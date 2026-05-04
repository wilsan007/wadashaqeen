import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/smtpClient.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- HELPERS ---
function sendError(
  message: string,
  code: string,
  status: number,
  suggestion?: string,
  details?: any
) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      errorCode: code,
      suggestion: suggestion,
      technicalDetails: details,
    }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. AUTH & PERMISSIONS
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return sendError('Non connecté', 'UNAUTHORIZED', 401);

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user: inviter },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !inviter) return sendError('Session expirée', 'SESSION_EXPIRED', 401);

    // 2. CHECK DROITS (RPC)
    const { data: canInvite } = await supabaseClient.rpc('can_invite_collaborators', {
      user_id: inviter.id,
    });
    if (!canInvite)
      return sendError('Permissions insuffisantes', 'FORBIDDEN', 403, 'Contactez votre admin.');

    const { data: tenantId } = await supabaseClient.rpc('get_user_tenant_id', {
      user_uuid: inviter.id,
    });
    if (!tenantId) return sendError('Aucune entreprise associée', 'NO_TENANT', 400);

    // 2b. FETCH TENANT NAME
    const { data: tenantData } = await supabaseClient
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    // Default to a generic name if not found, or use the one from inviter if accessible
    const companyName = tenantData?.name || 'Votre Entreprise';

    // 3. VALIDATION INPUT
    const { email, fullName, roleToAssign, department, siteUrl } = await req.json();

    if (!email || !fullName || !roleToAssign) {
      return sendError('Champs manquants', 'MISSING_FIELDS', 400, 'Email, Nom et Rôle requis.');
    }

    // 4. CHECK EMAIL CONFLICT (RPC)
    const { data: exists } = await supabaseClient.rpc('is_email_in_tenant', {
      email_param: email,
      tenant_id_param: tenantId,
    });
    if (exists)
      return sendError(
        "Email déjà dans l'équipe",
        'EMAIL_EXISTS',
        409,
        'Cet utilisateur est déjà membre.'
      );

    console.log(`🚀 Adding collaborator ${email} to tenant ${tenantId}`);

    // 5. CRÉATION INVITATION (Pattern "Invitation First")
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

    const { data: invitation, error: inviteError } = await supabaseClient
      .from('invitations')
      .insert({
        email,
        full_name: fullName,
        tenant_id: tenantId, // Le VRAI tenant ID existant
        token: 'PENDING', // Token temporaire - sera mis à jour après génération du magic link
        invitation_type: 'collaborator',
        invited_by: inviter.id,
        role_to_assign: roleToAssign,
        department: department,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          temp_password: tempPassword,
          invited_by_email: inviter.email,
          role: roleToAssign,
          company_name: companyName,
        },
      })
      .select()
      .single();

    if (inviteError)
      return sendError('Erreur DB Invitation', 'DB_ERROR', 500, undefined, inviteError.message);

    const realInvitationId = invitation.id;

    // 6. GESTION USER AUTH & ROLLBACK
    let targetUserId;
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email.toLowerCase());

    const userMetadata = {
      full_name: fullName,
      invitation_id: realInvitationId, // ✅ Lien solide
      tenant_id: tenantId,
      company_name: companyName,
      invitation_type: 'collaborator',
      role_to_assign: roleToAssign,
      temp_password: tempPassword,
      ready_for_confirmation: true,
    };

    if (existingUser) {
      // User existe déjà (peut-être dans un autre tenant)
      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: { ...existingUser.user_metadata, ...userMetadata },
        }
      );
      if (updateError) {
        await supabaseClient.from('invitations').delete().eq('id', realInvitationId); // ROLLBACK
        return sendError('Erreur update user', 'USER_UPDATE_FAIL', 500);
      }
      targetUserId = existingUser.id;
    } else {
      // Création nouvel user
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: userMetadata,
      });
      if (createError) {
        await supabaseClient.from('invitations').delete().eq('id', realInvitationId); // ROLLBACK
        return sendError(
          'Erreur création user',
          'USER_CREATE_FAIL',
          500,
          undefined,
          createError.message
        );
      }
      targetUserId = newUser.user.id;
    }

    // 7. MAGIC LINK & UPDATE
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');

    let baseUrl;
    if (origin) {
      baseUrl = origin.replace(/\/$/, '');
    } else if (referer) {
      const refererUrl = new URL(referer);
      baseUrl = `${refererUrl.protocol}//${refererUrl.host}`;
    } else if (siteUrl) {
      baseUrl = siteUrl.replace(/\/$/, '');
    } else {
      const port = Deno.env.get('FRONTEND_PORT') || '8080';
      baseUrl = `http://localhost:${port}`;
    }

    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'invite', // ✅ 'invite' fonctionne avec email_confirm: false
      email: email,
      options: {
        redirectTo: `${baseUrl}/auth/callback?email=${encodeURIComponent(email)}&type=invite&invitation=collaborator`,
      },
    });

    if (linkError) return sendError('Erreur Link', 'LINK_ERROR', 500);

    const confirmationUrl = linkData.properties.action_link;
    const confirmationToken = confirmationUrl.match(/token=([^&]+)/)?.[1];

    await supabaseClient
      .from('invitations')
      .update({
        token: confirmationToken,
        metadata: {
          ...invitation.metadata,
          confirmation_url: confirmationUrl,
          supabase_user_id: targetUserId,
        },
      })
      .eq('id', realInvitationId);

    // 8. EMAIL (SMTP)
    try {
      // Get Admin/Inviter Name for the email
      const { data: userProfile } = await supabaseClient
        .from('profiles')
        .select('full_name')
        .eq('id', inviter.id)
        .single();

      const adminName = userProfile?.full_name || "L'administrateur";

      const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${companyName} vous invite à rejoindre Wadashaqayn</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          /* Lighter blue gradient matching site primary theme */
          .header { background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
          .header-slogan { margin-top: 10px; font-size: 14px; font-weight: 400; opacity: 0.9; letter-spacing: 0.5px; }
          .content { padding: 40px 30px; }
          /* Unify font size to 16px */
          p, li, .welcome-text { font-size: 16px; color: #374151; margin-bottom: 25px; line-height: 1.6; }
          h3 { font-size: 18px; color: #0f172a; margin-top: 0; }
          
          .feature-list { list-style: none; padding: 0; margin: 25px 0; }
          .feature-item { margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #10b981; }
          .feature-title { font-weight: 600; color: #059669; display: block; font-size: 16px; }
          
          .action-button { display: inline-block; background-color: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; transition: background-color 0.2s; width: 80%; text-align: center; }
          .action-button:hover { background-color: #1d4ed8; }
          
          /* Refined Credentials Box */
          .credentials-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 30px 0; }
          .credentials-title { font-size: 16px; font-weight: 600; color: #334155; margin-bottom: 15px; margin-top: 0; }
          .credential-item { margin-bottom: 12px; font-size: 16px; display: flex; flex-direction: column; }
          .credential-item:last-child { margin-bottom: 0; }
          .credential-label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600; }
          .credential-value { color: #0f172a; font-family: 'Consolas', monospace; font-size: 16px; background: white; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; }
          
          /* Refined Important Note */
          .important-note { background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin-top: 25px; font-size: 16px; color: #92400e; display: flex; align-items: start; gap: 10px; }
          .important-icon { font-size: 20px; line-height: 1; }
          
          .footer { background-color: #f1f5f9; padding: 30px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue sur Wadashaqayn</h1>
            <div class="header-slogan">Gérez mieux. Centralisez tout. Accomplissez plus.</div>
          </div>
          <div class="content">
            <h3>Bonjour ${fullName},</h3>
            
            <p class="welcome-text">
              <strong>${adminName}</strong>, Gérant/Administrateur de <strong>${companyName}</strong>, vous invite à rejoindre son espace de travail sur Wadashaqayn.
            </p>

            <p>${companyName} utilise cette plateforme pour centraliser la gestion de :</p>
            
            <ul class="feature-list">
              <li class="feature-item">
                <span class="feature-title">Projets et Tâches continues</span>
                Clarté totale sur vos priorités.
              </li>
              <li class="feature-item">
                <span class="feature-title">Processus RH et suivi interne</span>
                Gestion simplifiée de votre quotidien.
              </li>
            </ul>

            <p class="welcome-text">
              <strong>Votre action requise :</strong><br/>
              Veuillez cliquer ci-dessous pour activer votre compte. Cet outil devient votre référence unique pour le travail quotidien.
            </p>

            <div style="text-align: center;">
              <a href="${confirmationUrl}" class="action-button">Activer mon compte</a>
            </div>

            <div class="credentials-box">
              <p class="credentials-title">Vos identifiants de connexion :</p>
              <div class="credential-item">
                <span class="credential-label">Login</span>
                <span class="credential-value">${email}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">Mot de passe temporaire</span>
                <span class="credential-value">${tempPassword}</span>
              </div>
            </div>

            <div class="important-note">
              <span class="important-icon">🔒</span>
              <div>
                <strong>Important :</strong> Une fois connecté, modifiez votre mot de passe en cliquant sur vos initiales en haut à droite de l'écran (Profil > Changer le mot de passe).
              </div>
            </div>
            
            <p style="margin-top: 30px;">
              Bienvenue !<br>
              <strong>L'équipe Wadashaqayn</strong>
            </p>
          </div>
          <div class="footer">
            <p>Ceci est un message automatique. Merci de ne pas y répondre.</p>
            <p>© ${new Date().getFullYear()} Wadashaqayn. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
      `;

      await sendEmail({
        to: email,
        subject: `${companyName} vous invite à rejoindre Wadashaqayn`,
        html: emailHtml,
      });
    } catch (e) {
      console.error('Failed to send contributor invitation email', e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Collaborateur invité avec succès',
        data: { invitation_id: realInvitationId, email },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return sendError('Erreur critique', 'CRITICAL_ERROR', 500, undefined, error.message);
  }
});
