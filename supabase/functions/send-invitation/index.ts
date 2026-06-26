import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail } from '../_shared/smtpClient.ts';
import { validateWebhookSecret, corsHeaders } from '../_shared/validateWebhook.ts';

declare const Deno: any;

// ─── Helper: lookup user by email via Admin REST API (O(1), no full scan) ────
async function getUserByEmail(supabaseUrl: string, serviceKey: string, email: string) {
  const resp = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email.toLowerCase())}`,
    { headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey } }
  );
  if (!resp.ok) return null;
  const { users = [] } = await resp.json();
  return users[0] ?? null;
}

// ─── Helper: safely extract OTP token from magic link ────────────────────────
function extractToken(actionLink: string): string {
  try {
    return new URL(actionLink).searchParams.get('token') ?? 'MAGIC_LINK';
  } catch {
    return 'MAGIC_LINK';
  }
}

// ─── Email template ───────────────────────────────────────────────────────────
function buildInviteEmail(fullName: string, companyName: string, actionLink: string): string {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre invitation Wadashaqayn</title>
  <style>
    body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background-color:#f4f4f4}
    .container{max-width:600px;margin:20px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1)}
    .header{background:linear-gradient(135deg,#2563eb 0%,#0ea5e9 100%);color:#fff;padding:40px 30px;text-align:center}
    .header h1{margin:0;font-size:24px;font-weight:600;letter-spacing:.5px}
    .header-slogan{margin-top:10px;font-size:14px;font-weight:400;opacity:.9}
    .content{padding:40px 30px}
    p,li{font-size:16px;color:#334155;margin-bottom:20px;line-height:1.6}
    h3{font-size:18px;color:#0f172a;margin-top:0}
    .feature-list{list-style:none;padding:0;margin:20px 0}
    .feature-item{margin-bottom:18px;padding-left:18px;border-left:3px solid #3b82f6}
    .feature-title{font-weight:600;color:#1e40af;display:block;font-size:16px}
    .cta-wrapper{text-align:center;margin:30px 0}
    .action-button{display:inline-block;background-color:#2563eb;color:#fff!important;padding:14px 32px;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px}
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
      <p>Vous êtes invité à créer votre espace de pilotage pour <strong>${companyName}</strong> sur Wadashaqayn — la plateforme qui centralise :</p>
      <ul class="feature-list">
        <li class="feature-item">
          <span class="feature-title">Suivi des Tâches &amp; Projets</span>
          Vision complète de l'avancement de vos équipes.
        </li>
        <li class="feature-item">
          <span class="feature-title">Gestion RH</span>
          Ressources humaines et processus administratifs en un seul endroit.
        </li>
      </ul>
      <div class="cta-wrapper">
        <a href="${actionLink}" class="action-button">Activer mon espace</a>
      </div>
      <div class="notice">
        Ce lien est personnel et valide <strong>7 jours</strong>. Vous définirez votre mot de passe lors de la première connexion.
      </div>
      <p style="margin-top:28px">Cordialement,<br><strong>L'équipe Wadashaqayn</strong></p>
    </div>
    <div class="footer">
      <p>© ${year} Wadashaqayn. Tous droits réservés.</p>
      <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authError = validateWebhookSecret(req);
  if (authError) return authError;

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { email, fullName, invitedBy, companyName: providedCompanyName } = await req.json();

    if (!email || !fullName) {
      return new Response(JSON.stringify({ error: 'email et fullName sont requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = crypto.randomUUID();
    const companyName = providedCompanyName?.trim() || `${fullName.split(' ')[0]}'s Company`;
    // Temp password used only to satisfy Supabase createUser requirement — never stored, never emailed
    const tempPassword = crypto.randomUUID().slice(0, 12) + 'Aa1!';

    const userMetadata = {
      full_name: fullName,
      company_name: companyName,
      tenant_id: tenantId,
      invitation_type: 'tenant_owner',
      role: 'tenant_admin',
    };

    // 1. Create or update Auth user (no listUsers() full scan)
    const existingUser = await getUserByEmail(SUPABASE_URL, SERVICE_KEY, email);
    let userId: string;

    if (existingUser) {
      const { error } = await admin.auth.admin.updateUserById(existingUser.id, {
        user_metadata: { ...existingUser.user_metadata, ...userMetadata },
      });
      if (error) throw error;
      userId = existingUser.id;
    } else {
      const { data: newUser, error } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: userMetadata,
      });
      if (error) throw error;
      userId = newUser.user.id;
    }

    // 2. Generate magic link
    const siteUrl = (Deno.env.get('SITE_URL') ?? req.headers.get('origin') ?? 'https://wadashaqayn.org').replace(/\/$/, '');
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback?email=${encodeURIComponent(email)}&type=invite&invitation=tenant_owner`,
        data: userMetadata,
      },
    });
    if (linkError) throw linkError;

    const actionLink = linkData.properties.action_link;
    const token = extractToken(actionLink);

    // 3. Persist invitation record
    const { data: invitation, error: insertError } = await admin
      .from('invitations')
      .insert({
        token,
        email,
        full_name: fullName,
        tenant_id: tenantId,
        tenant_name: companyName,
        invitation_type: 'tenant_owner',
        invited_by: invitedBy ?? null,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          company_name: companyName,
          confirmation_url: actionLink,
          supabase_user_id: userId,
        },
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    // 4. Send email (magic link only — no credentials in email body)
    try {
      await sendEmail({
        to: email,
        subject: `Votre invitation à rejoindre Wadashaqayn — ${companyName}`,
        html: buildInviteEmail(fullName, companyName, actionLink),
      });
    } catch (emailError) {
      console.error('SMTP send failed (non-fatal):', emailError);
    }

    return new Response(JSON.stringify({ success: true, invitationId: invitation.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('send-invitation error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
