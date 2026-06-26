// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Auth hooks are server-to-server; restrict to SITE_URL in production
// @ts-ignore - Deno global
const _siteUrl = Deno.env.get('SITE_URL') ?? null;
const corsHeaders = {
  'Access-Control-Allow-Origin': _siteUrl ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClaimsRequest {
  user_id: string
  email?: string
  user_metadata?: any
  app_metadata?: any
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify hook secret sent by Supabase (configure HOOK_SECRET in Edge Function secrets)
  // @ts-ignore - Deno global
  const hookSecret = Deno.env.get('HOOK_SECRET');
  if (hookSecret) {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || authHeader !== `Bearer ${hookSecret}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    console.log('🔐 Auth Hook Claims démarrée')
    
    const payload: ClaimsRequest = await req.json()
    console.log('📥 Payload reçu:', JSON.stringify(payload, null, 2))

    // Créer le client Supabase avec service role
    const supabaseAdmin = createClient(
      // @ts-ignore - Deno global
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore - Deno global
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Récupérer les informations du profil utilisateur
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        tenant_id,
        role,
        full_name
      `)
      .eq('user_id', payload.user_id)
      .single()

    if (profileError) {
      console.log('⚠️ Profil non trouvé, utilisation des claims par défaut')
      
      // Claims par défaut si pas de profil
      return new Response(
        JSON.stringify({
          user_id: payload.user_id,
          email: payload.email,
          role: 'user'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Vérifier si c'est un Super Admin
    const isSuperAdmin = profile.role === 'super_admin' && 
                        profile.tenant_id === '00000000-0000-0000-0000-000000000000'

    // Récupérer les rôles actifs
    const { data: userRoles } = await supabaseAdmin
      .from('user_roles')
      .select(`
        roles(name),
        tenant_id,
        is_active
      `)
      .eq('user_id', payload.user_id)
      .eq('is_active', true)

    // Construire les claims personnalisés
    const customClaims = {
      user_id: payload.user_id,
      email: payload.email,
      tenant_id: profile.tenant_id,
      role: profile.role,
      full_name: profile.full_name,
      is_super_admin: isSuperAdmin,
      roles: userRoles?.map(ur => ur.roles.name) || [],
      has_global_access: isSuperAdmin
    }

    console.log('✅ Claims générés:', customClaims)

    return new Response(
      JSON.stringify(customClaims),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Erreur dans Auth Hook:', error)
    
    // En cas d'erreur, retourner des claims minimaux
    return new Response(
      JSON.stringify({
        // @ts-ignore - payload défini dans le scope
        user_id: payload?.user_id || '',
        // @ts-ignore - payload défini dans le scope
        email: payload?.email || '',
        role: 'user'
      }),
      { 
        status: 200, // Important: toujours retourner 200 pour les hooks
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
