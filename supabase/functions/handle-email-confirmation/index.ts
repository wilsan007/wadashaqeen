import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

// ─── CORS ─────────────────────────────────────────────────────────────────────
function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function respond(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

// ─── Email confirmation helper ────────────────────────────────────────────────
async function confirmEmail(admin: any, userId: string, currentMeta: Record<string, any>) {
  const ts = new Date().toISOString();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
    user_metadata: { ...currentMeta, email_confirmed_at: ts },
  });
  if (!error) return;
  // Fallback — metadata-only flag
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: { ...currentMeta, email_confirmed_at: ts, email_confirm_fallback: true },
  });
}

// ─── COLLABORATOR onboarding ──────────────────────────────────────────────────
async function processCollaborator(
  admin: any,
  userId: string,
  userEmail: string,
  userMeta: Record<string, any>,
  emailAlreadyConfirmed: boolean,
  origin: string | null
): Promise<Response> {

  if (userMeta?.invitation_type !== 'collaborator') {
    return respond({ message: 'Ignoré: non collaborateur' }, 200, origin);
  }

  // Anti-loop guard: check if THIS specific invitation was already processed.
  // This allows the same user to be re-invited into another tenant.
  if (
    userMeta?.processed_collaborator_at &&
    userMeta?.last_processed_invitation_id &&
    userMeta.last_processed_invitation_id === userMeta.invitation_id
  ) {
    return respond({ message: 'Déjà traité pour cette invitation' }, 200, origin);
  }

  // 1. Resolve invitation — by ID first, fallback by email
  let invitation: {
    id: string;
    tenant_id: string;
    full_name: string;
    role_to_assign: string;
    department: string | null;
    job_position: string | null;
    status: string;
  } | null = null;

  if (userMeta.invitation_id) {
    const { data, error } = await admin
      .from('invitations')
      .select('id, tenant_id, full_name, role_to_assign, department, job_position, status')
      .eq('id', userMeta.invitation_id)
      .single();
    if (!error && data) {
      if (data.status === 'accepted') {
        console.log(`✅ Invitation ${data.id} déjà acceptée — skip duplicate`);
        return respond({ success: true, message: 'Déjà traité', data: { user_id: userId, tenant_id: data.tenant_id } }, 200, origin);
      }
      invitation = data;
    }
  }

  if (!invitation) {
    console.warn(`⚠️ invitation_id introuvable (${userMeta.invitation_id}), fallback email: ${userEmail}`);
    const { data, error } = await admin
      .from('invitations')
      .select('id, tenant_id, full_name, role_to_assign, department, job_position, status')
      .eq('email', userEmail)
      .eq('invitation_type', 'collaborator')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error || !data) {
      throw new Error(`INVITATION_NOT_FOUND: invitation_id=${userMeta.invitation_id}, email=${userEmail}`);
    }
    invitation = data;
    console.log(`✅ Fallback email réussi — invitation: ${invitation.id}, tenant: ${invitation.tenant_id}`);
  }

  if (!invitation.tenant_id) throw new Error('INVALID_INVITATION: tenant_id manquant');

  // 2. Confirm email if not already done
  if (!emailAlreadyConfirmed) {
    await confirmEmail(admin, userId, userMeta);
  }

  // 3. Resolve role
  const { data: role, error: roleError } = await admin
    .from('roles')
    .select('id, name, display_name')
    .eq('name', invitation.role_to_assign)
    .single();
  if (roleError || !role) {
    throw new Error(`ROLE_NOT_FOUND: '${invitation.role_to_assign}' inexistant`);
  }

  // 4. Create profile (skip if already exists in this tenant)
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .eq('tenant_id', invitation.tenant_id)
    .maybeSingle();

  if (!existingProfile) {
    const { error: profileError } = await admin.from('profiles').insert({
      user_id: userId,
      tenant_id: invitation.tenant_id,
      full_name: invitation.full_name,
      email: userEmail,
      role: role.name,
      contract_type: 'CDI',
      weekly_hours: 35,
    });
    if (profileError) throw new Error(`DB_PROFILE_ERROR: ${profileError.message}`);
  } else {
    await admin
      .from('profiles')
      .update({ role: role.name, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('tenant_id', invitation.tenant_id);
  }

  // 5. Create or update employee — handles UNIQUE(email) + UNIQUE(user_id,tenant_id)
  //    employee_id auto-generated by DB trigger set_employee_id when inserting new rows
  const { data: existingEmp } = await admin
    .from('employees')
    .select('id, employee_id')
    .or(`user_id.eq.${userId},email.eq.${userEmail}`)
    .maybeSingle();

  let employeeId = 'auto-generated';
  if (existingEmp) {
    // Already exists — just update non-critical fields, keep employee_id
    await admin
      .from('employees')
      .update({
        tenant_id: invitation.tenant_id,
        job_title: invitation.job_position ?? 'Collaborateur',
        department_id: invitation.department ?? null,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingEmp.id);
    employeeId = existingEmp.employee_id ?? 'auto-generated';
    console.log(`ℹ️ Employé existant mis à jour: ${employeeId}`);
  } else {
    // New employee — employee_id generated by trigger set_employee_id
    const { data: newEmp, error: empError } = await admin
      .from('employees')
      .insert({
        user_id: userId,
        full_name: invitation.full_name,
        email: userEmail,
        job_title: invitation.job_position ?? 'Collaborateur',
        department_id: invitation.department ?? null,
        hire_date: new Date().toISOString().split('T')[0],
        contract_type: 'CDI',
        weekly_hours: 35,
        status: 'active',
        tenant_id: invitation.tenant_id,
      })
      .select('employee_id')
      .maybeSingle();
    if (empError) console.warn('⚠️ employees insert:', empError.message);
    employeeId = newEmp?.employee_id ?? 'auto-generated';
  }

  // 6. Assign role
  const { error: roleAssignError } = await admin.from('user_roles').upsert(
    {
      user_id: userId,
      role_id: role.id,
      context_type: 'global',
      context_id: invitation.tenant_id,
      assigned_at: new Date().toISOString(),
      is_active: true,
      tenant_id: invitation.tenant_id,
    },
    { onConflict: 'user_id,role_id,tenant_id', ignoreDuplicates: true }
  );
  if (roleAssignError) console.warn('⚠️ user_roles upsert:', roleAssignError.message);

  // 7. Mark as processed (anti-loop)
  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...userMeta,
      processed_collaborator_at: new Date().toISOString(),
      last_processed_invitation_id: invitation.id,
      employee_id: employeeId,
    },
  });

  await admin.from('invitations').update({ status: 'accepted' }).eq('id', invitation.id);

  console.log(`✅ Collaborateur configuré: user=${userId}, tenant=${invitation.tenant_id}, employee_id=${employeeId}`);

  return respond(
    {
      success: true,
      message: 'Collaborateur configuré avec succès',
      data: { user_id: userId, tenant_id: invitation.tenant_id, employee_id: employeeId, role: role.display_name },
    },
    200,
    origin
  );
}

// ─── TENANT OWNER onboarding ──────────────────────────────────────────────────
async function processTenantOwner(
  admin: any,
  userId: string,
  userEmail: string,
  userMeta: Record<string, any>,
  origin: string | null
): Promise<Response> {
  const tenantId    = userMeta.tenant_id;
  const fullName    = userMeta.full_name    ?? userEmail.split('@')[0];
  const companyName = userMeta.company_name ?? `${fullName}'s Company`;

  if (!tenantId) throw new Error('TENANT_OWNER: tenant_id manquant dans user_metadata');

  // 1. Create tenant (idempotent)
  const { error: tenantError } = await admin.from('tenants').insert({
    id: tenantId,
    name: companyName,
    slug: companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000),
    status: 'active',
  });
  if (tenantError && !tenantError.message.includes('duplicate key')) {
    throw new Error(`DB_TENANT_ERROR: ${tenantError.message}`);
  }

  // 2. Create profile (idempotent)
  const { error: profileError } = await admin.from('profiles').insert({
    user_id: userId,
    tenant_id: tenantId,
    full_name: fullName,
    email: userEmail,
    role: 'tenant_admin',
    contract_type: 'CDI',
    weekly_hours: 35,
  });
  if (profileError && !profileError.message.includes('duplicate key')) {
    throw new Error(`DB_PROFILE_ERROR: ${profileError.message}`);
  }

  // 3. Create or update employee — handles UNIQUE(email) + UNIQUE(user_id,tenant_id)
  const { data: existingEmpOwner } = await admin
    .from('employees')
    .select('id')
    .or(`user_id.eq.${userId},email.eq.${userEmail}`)
    .maybeSingle();

  if (existingEmpOwner) {
    await admin
      .from('employees')
      .update({ tenant_id: tenantId, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', existingEmpOwner.id);
  } else {
    const { error: empError } = await admin.from('employees').insert({
      user_id: userId,
      full_name: fullName,
      email: userEmail,
      job_title: 'Tenant Administrateur',
      hire_date: new Date().toISOString().split('T')[0],
      contract_type: 'CDI',
      weekly_hours: 35,
      status: 'active',
      tenant_id: tenantId,
    });
    if (empError) console.warn('⚠️ employees insert:', empError.message);
  }

  // 4. Assign tenant_admin role
  const { data: roleData } = await admin
    .from('roles')
    .select('id')
    .eq('name', 'tenant_admin')
    .single();

  if (roleData) {
    const { error: roleError } = await admin.from('user_roles').upsert(
      {
        user_id: userId,
        role_id: roleData.id,
        context_type: 'global',
        context_id: tenantId,
        assigned_at: new Date().toISOString(),
        is_active: true,
        tenant_id: tenantId,
      },
      { onConflict: 'user_id,role_id,tenant_id', ignoreDuplicates: true }
    );
    if (roleError) console.warn('⚠️ user_roles upsert:', roleError.message);
  }

  // 5. Mark invitation as accepted (if one exists)
  await admin
    .from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('email', userEmail)
    .eq('invitation_type', 'tenant_owner')
    .eq('status', 'pending');

  console.log(`✅ Tenant owner configuré: user=${userId}, tenant=${tenantId}`);

  return respond(
    { success: true, message: 'Tenant owner configuré avec succès', data: { user_id: userId, tenant_id: tenantId } },
    200,
    origin
  );
}

// ─── Entry point ──────────────────────────────────────────────────────────────
serve(async (req) => {
  const origin = req.headers.get('origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return respond({ error: 'Method Not Allowed' }, 405, origin);
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const payload = await req.json();

    // ── Mode A: Direct call from frontend (AuthCallback) ──────────────────────
    // Payload: { user_id: string } + Authorization: Bearer <user_token>
    if (payload.user_id) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return respond({ error: 'Non autorisé' }, 401, origin);

      const { data: { user: caller }, error: authError } = await admin.auth.getUser(
        authHeader.replace('Bearer ', '').trim()
      );
      if (authError || !caller) return respond({ error: 'Token invalide' }, 401, origin);
      if (caller.id !== payload.user_id) return respond({ error: 'Identité non concordante' }, 403, origin);

      const userMeta = caller.user_metadata ?? {};
      // Mode A only supports collaborator (tenant_owner uses onboard-tenant-owner via RPC)
      return await processCollaborator(admin, caller.id, caller.email!, userMeta, true, origin);
    }

    // ── Mode B: DB webhook from pg_net trigger (notify_email_confirmation) ────
    // Payload: { type, table, schema, record, old_record }
    if (payload.type === 'UPDATE' && payload.table === 'users' && payload.schema === 'auth') {
      const newUser = payload.record;
      const oldUser = payload.old_record;

      // Verify it's a real email confirmation event
      const wasConfirmed = !oldUser?.email_confirmed_at && newUser?.email_confirmed_at;
      if (!wasConfirmed) {
        console.log('⏭️ Pas un événement de confirmation email — ignoré');
        return respond({ message: 'Ignoré: pas une confirmation' }, 200, origin);
      }

      const userId    = newUser.id;
      const userEmail = newUser.email;
      const userMeta  = newUser.raw_user_meta_data ?? {};

      console.log(`📧 Confirmation email détectée: ${userEmail} (type: ${userMeta.invitation_type})`);

      if (userMeta.invitation_type === 'collaborator') {
        return await processCollaborator(admin, userId, userEmail, userMeta, true, origin);
      }

      if (userMeta.invitation_type === 'tenant_owner') {
        return await processTenantOwner(admin, userId, userEmail, userMeta, origin);
      }

      console.warn('⚠️ Type d\'invitation inconnu:', userMeta.invitation_type);
      return respond({ message: 'Ignoré: type inconnu', type: userMeta.invitation_type }, 200, origin);
    }

    return respond({ error: 'Format de requête non reconnu' }, 400, origin);

  } catch (err: any) {
    console.error('❌ handle-email-confirmation:', err.message);
    return respond({ success: false, error: err.message, timestamp: new Date().toISOString() }, 500, origin);
  }
});
