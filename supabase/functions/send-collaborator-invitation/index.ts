import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/smtpClient.ts';

declare const Deno: any;

// ─── CORS ─────────────────────────────────────────────────────────────────────
function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

// ─── Error response helper ────────────────────────────────────────────────────
function sendError(
  message: string,
  code: string,
  status: number,
  origin: string | null,
  suggestion?: string,
  details?: unknown
) {
  return new Response(
    JSON.stringify({ success: false, error: message, errorCode: code, suggestion, technicalDetails: details }),
    { status, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
  );
}

// ─── Helper: lookup user by email via Admin REST API (O(1)) ──────────────────
async function getUserByEmail(supabaseUrl: string, serviceKey: string, email: string) {
  const resp = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email.toLowerCase())}`,
    { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } }
  );
  if (!resp.ok) return null;
  const { users = [] } = await resp.json();
  return users[0] ?? null;
}

// ─── Helper: extract OTP token from magic link URL ────────────────────────────
function extractToken(actionLink: string): string | null {
  try {
    return new URL(actionLink).searchParams.get('token');
  } catch {
    return null;
  }
}

// ─── Email template ───────────────────────────────────────────────────────────
function buildCollaboratorEmail(
  fullName: string,
  companyName: string,
  adminName: string,
  actionLink: string,
  email: string,
  tempPassword?: string
): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation à rejoindre ${companyName}</title>
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background-color:#f4f4f4}
    .container{max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)}
    .header{background:linear-gradient(135deg,#2563eb 0%,#0ea5e9 100%);color:#fff;padding:40px 30px;text-align:center}
    .header h1{margin:0;font-size:24px;font-weight:600;letter-spacing:.5px}
    .header-slogan{margin-top:10px;font-size:14px;font-weight:400;opacity:.9}
    .content{padding:40px 30px}
    p,li{font-size:16px;color:#374151;margin-bottom:20px;line-height:1.6}
    h3{font-size:18px;color:#0f172a;margin-top:0}
    .feature-list{list-style:none;padding:0;margin:20px 0}
    .feature-item{margin-bottom:18px;padding-left:18px;border-left:3px solid #10b981}
    .feature-title{font-weight:600;color:#059669;display:block;font-size:16px}
    .cta-wrapper{text-align:center;margin:30px 0}
    .action-button{display:inline-block;background-color:#2563eb;color:#fff!important;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px}
    .login-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px 24px;margin:24px 0}
    .login-label{font-size:12px;text-transform:uppercase;letter-spacing:.5px;color:#64748b;font-weight:600;margin-bottom:4px}
    .login-value{font-family:Consolas,monospace;font-size:15px;color:#0f172a;background:#fff;padding:6px 10px;border:1px solid #cbd5e1;border-radius:4px;display:block;margin-bottom:12px}
    .notice{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;font-size:14px;color:#166534;margin-top:24px}
    .footer{background-color:#f1f5f9;padding:24px 30px;text-align:center;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0}
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
      <p><strong>${adminName}</strong> vous invite à rejoindre l'espace de travail de <strong>${companyName}</strong> sur Wadashaqayn.</p>
      
      <p>Voici vos accès temporaires de connexion :</p>
      <div class="login-box">
        <div class="login-label">Identifiant (Email)</div>
        <div class="login-value">${email}</div>
        <div class="login-label">Mot de passe temporaire</div>
        <div class="login-value">${tempPassword ?? 'Utilisez votre mot de passe habituel'}</div>
      </div>

      <ul class="feature-list">
        <li class="feature-item">
          <span class="feature-title">Projets et Tâches</span>
          Clarté totale sur vos priorités et vos échéances.
        </li>
        <li class="feature-item">
          <span class="feature-title">Gestion RH</span>
          Congés, fiches de temps et demandes administratives en un clic.
        </li>
      </ul>
      <div class="cta-wrapper">
        <a href="${actionLink}" class="action-button">Activer mon compte</a>
      </div>
      <div class="notice">
        Ce lien est personnel et valide <strong>7 jours</strong>. Vous pourrez modifier votre mot de passe après votre première connexion.
      </div>
      <p style="margin-top:28px">Bienvenue dans l'équipe !<br><strong>L'équipe Wadashaqayn</strong></p>
    </div>
    <div class="footer">
      <p>Message automatique — merci de ne pas y répondre.</p>
      <p>© ${year} Wadashaqayn. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async req => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Authenticate caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return sendError('Non connecté', 'UNAUTHORIZED', 401, origin);

    const accessToken = authHeader.replace('Bearer ', '').trim();
    const { data: { user: inviter }, error: authError } = await admin.auth.getUser(accessToken);
    if (authError || !inviter) return sendError('Session expirée', 'SESSION_EXPIRED', 401, origin);

    // 2. Check permissions
    const { data: canInvite } = await admin.rpc('can_invite_collaborators', { user_id: inviter.id });
    if (!canInvite) {
      return sendError('Permissions insuffisantes', 'FORBIDDEN', 403, origin, 'Contactez votre administrateur.');
    }

    const { data: tenantId } = await admin.rpc('get_user_tenant_id', { user_uuid: inviter.id });
    if (!tenantId) return sendError('Aucune entreprise associée', 'NO_TENANT', 400, origin);

    const { data: tenantData } = await admin.from('tenants').select('name').eq('id', tenantId).single();
    const companyName = tenantData?.name ?? 'Votre Entreprise';

    // 3. Validate input
    const { email, fullName, roleToAssign, department, siteUrl } = await req.json();
    if (!email || !fullName || !roleToAssign) {
      return sendError('Champs manquants', 'MISSING_FIELDS', 400, origin, 'Email, Nom et Rôle requis.');
    }

    // 4. Check email conflict
    const { data: exists } = await admin.rpc('is_email_in_tenant', {
      email_param: email,
      tenant_id_param: tenantId,
    });
    if (exists) {
      return sendError("Email déjà dans l'équipe", 'EMAIL_EXISTS', 409, origin, 'Cet utilisateur est déjà membre.');
    }

    // 5. Generate temp password — sent in email for new users, never stored in DB
    const tempPassword = crypto.randomUUID().slice(0, 12) + 'Aa1!';

    const { data: invitation, error: inviteError } = await admin
      .from('invitations')
      .insert({
        email,
        full_name: fullName,
        tenant_id: tenantId,
        token: `PENDING-${crypto.randomUUID()}`,
        invitation_type: 'collaborator',
        invited_by: inviter.id,
        role_to_assign: roleToAssign,
        department: department ?? null,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          invited_by_email: inviter.email,
          role: roleToAssign,
          company_name: companyName,
        },
      })
      .select('id, metadata')
      .single();

    if (inviteError) return sendError('Erreur DB Invitation', 'DB_ERROR', 500, origin, undefined, inviteError.message);

    const invitationId = invitation.id;

    // 6. Create or update Auth user (O(1) lookup — no full listUsers scan)
    const existingUser = await getUserByEmail(SUPABASE_URL, SERVICE_KEY, email);
    let targetUserId: string;

    const userMetadata = {
      full_name: fullName,
      invitation_id: invitationId,
      tenant_id: tenantId,
      company_name: companyName,
      invitation_type: 'collaborator',
      role_to_assign: roleToAssign,
      ready_for_confirmation: true,
    };

    if (existingUser) {
      const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
        password: tempPassword,
        user_metadata: {
          // Conserver les metadata non-critiques de l'ancien compte
          ...existingUser.user_metadata,
          // Écraser TOUJOURS les clés critiques pour la nouvelle invitation
          ...userMetadata,
          invitation_id:             invitationId,
          tenant_id:                 tenantId,
          invitation_type:           'collaborator',
          role_to_assign:            roleToAssign,
          ready_for_confirmation:    true,
          // ⚠️ CRITIQUE : Réinitialiser le flag anti-boucle pour autoriser
          // le retraitement dans handle-collaborator-confirmation.
          // Sans ce reset, un user invité une 2e fois (même email, autre tenant)
          // serait bloqué par le guard et ne rejoindrait jamais le bon tenant.
          processed_collaborator_at:       null,
          last_processed_invitation_id:    null,
        },
      });
      if (updateError) {
        await admin.from('invitations').delete().eq('id', invitationId);
        return sendError('Erreur update user', 'USER_UPDATE_FAIL', 500, origin);
      }
      targetUserId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: userMetadata,
      });
      if (createError) {
        await admin.from('invitations').delete().eq('id', invitationId);
        return sendError('Erreur création user', 'USER_CREATE_FAIL', 500, origin, undefined, createError.message);
      }
      targetUserId = newUser.user.id;
    }

    // 7. Generate magic link
    const baseUrl = (
      siteUrl ??
      ((req.headers.get('origin') ?? '').replace(/\/$/, '') ||
      (Deno.env.get('SITE_URL') ?? 'http://localhost:8080'))
    ).replace(/\/$/, '');

    const linkType = existingUser ? 'magiclink' : 'invite';
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: linkType,
      email,
      options: {
        redirectTo: `${baseUrl}/auth/callback?email=${encodeURIComponent(email)}&type=${linkType}&invitation=collaborator`,
        data: userMetadata, // garantit que user_metadata reste cohérent dans le token OTP
      },
    });
    
    if (linkError) {
      await admin.from('invitations').delete().eq('id', invitationId);
      return sendError('Erreur génération lien', 'LINK_ERROR', 500, origin, undefined, linkError.message);
    }

    const confirmationUrl = linkData.properties.action_link;
    const confirmationToken = extractToken(confirmationUrl);

    // 8. Update invitation with real token and confirmation URL
    await admin
      .from('invitations')
      .update({
        token: confirmationToken ?? crypto.randomUUID(),
        metadata: {
          ...invitation.metadata,
          confirmation_url: confirmationUrl,
          supabase_user_id: targetUserId,
        },
      })
      .eq('id', invitationId);

    // 9. Send email — includes temp password for new users (never stored in DB)
    try {
      const { data: profileData } = await admin
        .from('profiles')
        .select('full_name')
        .eq('user_id', inviter.id)
        .single();

      const adminName = profileData?.full_name ?? 'L\'administrateur';

      const emailPassword = tempPassword;

      await sendEmail({
        to: email,
        subject: `${companyName} vous invite à rejoindre Wadashaqayn`,
        html: buildCollaboratorEmail(fullName, companyName, adminName, confirmationUrl, email, emailPassword),
      });
    } catch (emailErr) {
      console.error('SMTP send failed (non-fatal):', emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Collaborateur invité avec succès',
        data: { invitation_id: invitationId, email },
      }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('send-collaborator-invitation error:', err.message);
    return sendError('Erreur critique', 'CRITICAL_ERROR', 500, origin, undefined, err.message);
  }
});
