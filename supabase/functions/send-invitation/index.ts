import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/smtpClient.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Edge Function: send-invitation (GOLD STANDARD) started');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { email, fullName, invitedBy, companyName: providedCompanyName } = await req.json();

    if (!email || !fullName) {
      return new Response(JSON.stringify({ error: 'Email and fullName are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📝 Processing invitation for: ${email}`);

    // 1. Prepare Data
    const tenantId = crypto.randomUUID();
    const companyName = providedCompanyName || `${fullName.split(' ')[0]}'s Company`;
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

    // 2. Create or Update User
    console.log('👤 Creating/Updating Auth User...');
    let userId;

    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email.toLowerCase());

    const userMetadata = {
      full_name: fullName,
      company_name: companyName,
      tenant_id: tenantId,
      invitation_type: 'tenant_owner',
      role: 'tenant_admin',
    };

    if (existingUser) {
      console.log('ℹ️ User already exists, updating metadata...');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { user_metadata: { ...existingUser.user_metadata, ...userMetadata } }
      );
      if (updateError) throw updateError;
      userId = existingUser.id;
    } else {
      console.log('🆕 Creating new user...');
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false, // We will confirm via the magic link
        user_metadata: userMetadata,
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // 3. Generate Magic Link
    console.log('🔗 Generating Magic Link...');
    const siteUrl =
      Deno.env.get('SITE_URL') || req.headers.get('origin') || 'https://wadashaqayn.org';
    const baseUrl = siteUrl.replace(/\/$/, '');

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: `${baseUrl}/auth/callback?email=${encodeURIComponent(email)}&type=invite&invitation=tenant_owner`,
        data: userMetadata,
      },
    });

    if (linkError) throw linkError;

    const actionLink = linkData.properties.action_link;
    // Extract token from link for database record (optional but good for tracking)
    const token = actionLink.match(/token=([^&]+)/)?.[1] || 'MAGIC_LINK';

    // 4. Insert into 'invitations' table (for tracking purposes)
    console.log('💾 Saving invitation record...');
    const { data: invitation, error: insertError } = await supabaseAdmin
      .from('invitations')
      .insert({
        token: token,
        email: email,
        full_name: fullName,
        tenant_id: tenantId,
        tenant_name: companyName,
        invitation_type: 'tenant_owner',
        invited_by: invitedBy || null,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          company_name: companyName,
          confirmation_url: actionLink,
          supabase_user_id: userId,
        },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. Send Email via SMTP
    console.log(`📧 Sending email to ${email}`);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Votre centre de pilotage unique</title>
        <style>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
          /* Lighter blue gradient matching site primary theme */
          .header { background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
          .header-slogan { margin-top: 10px; font-size: 14px; font-weight: 400; opacity: 0.9; letter-spacing: 0.5px; }
          .content { padding: 40px 30px; }
          /* Unify font size to 16px for all main text */
          p, li, .welcome-text { font-size: 16px; color: #334155; margin-bottom: 25px; line-height: 1.6; }
          h3 { font-size: 18px; color: #0f172a; margin-top: 0; }
          
          .feature-list { list-style: none; padding: 0; margin: 25px 0; }
          .feature-item { margin-bottom: 20px; padding-left: 20px; border-left: 3px solid #3b82f6; }
          .feature-title { font-weight: 600; color: #1e40af; display: block; font-size: 16px; }
          
          .action-button { display: inline-block; background-color: #2563eb; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px 0; transition: background-color 0.2s; width: 80%; text-align: center; }
          .action-button:hover { background-color: #1d4ed8; }
          
          /* Refined Credentials Box - clearer, cleaner */
          .credentials-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 25px; margin: 30px 0; }
          .credentials-title { font-size: 16px; font-weight: 600; color: #334155; margin-bottom: 15px; margin-top: 0; }
          .credential-item { margin-bottom: 12px; font-size: 16px; display: flex; flex-direction: column; }
          .credential-item:last-child { margin-bottom: 0; }
          .credential-label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; font-weight: 600; }
          .credential-value { color: #0f172a; font-family: 'Consolas', monospace; font-size: 16px; background: white; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; }
          
          /* Refined Important Note - Integrated */
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
              Pour optimiser la performance et la gestion de <strong>${companyName}</strong>, j'ai le plaisir de vous inviter à créer votre compte administrateur sur Wadashaqayn.
            </p>

            <p>Notre plateforme résout le problème de la dispersion des outils en centralisant :</p>
            
            <ul class="feature-list">
              <li class="feature-item">
                <span class="feature-title">Le suivi des Tâches & Projets</span>
                Maîtrisez le flux de travail continu de vos équipes et l'avancement des grands projets.
              </li>
              <li class="feature-item">
                <span class="feature-title">La gestion RH</span>
                Intégrez le suivi des ressources et les processus administratifs.
              </li>
            </ul>

            <p class="welcome-text">
              En utilisant Wadashaqayn, vous gagnez un tableau de bord unique pour une visibilité totale et une gestion simplifiée.
            </p>

            <p style="text-align: center;">Activez votre espace ici :</p>
            
            <div style="text-align: center;">
              <a href="${actionLink}" class="action-button">Démarrer l'optimisation de ma gestion</a>
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
            
            <p>Je suis à votre disposition pour toute question initiale.</p>
            
            <p style="margin-top: 30px;">
              Cordialement,<br>
              <strong>L'équipe Wadashaqayn</strong>
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Wadashaqayn. Tous droits réservés.</p>
            <p>Ce lien est valide pendant 7 jours.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      await sendEmail({
        to: email,
        subject: `Votre centre de pilotage unique pour ${companyName} (Invitation)`,
        html: emailHtml,
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // We generally don't want to fail the whole request if email fails,
      // but we should log it.
      // Depending on requirements, we might want to throw here.
      // For now, logging error but continuing since invitation is created.
    }

    console.log('✅ Invitation process completed successfully');

    return new Response(JSON.stringify({ success: true, invitationId: invitation.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('🚨 Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
