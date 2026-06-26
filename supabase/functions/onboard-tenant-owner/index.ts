// @ts-ignore - Deno imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - Deno imports
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore - Deno global
const _siteUrl = Deno.env.get('SITE_URL') ?? '*';
const corsHeaders = {
  'Access-Control-Allow-Origin': _siteUrl,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface OnboardRequest {
  code: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Edge Function: onboard-tenant-owner démarrée')

    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { 
        status: 405,
        headers: corsHeaders 
      })
    }

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

    // Récupérer le token d'authentification
    const authHeader = req.headers.get('Authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()
    
    if (!token) {
      console.log('❌ Token manquant')
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      })
    }

    // Vérifier l'utilisateur authentifié
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    
    if (userError || !user) {
      console.log('❌ Utilisateur non authentifié:', userError?.message)
      return new Response('Unauthorized', { 
        status: 401,
        headers: corsHeaders 
      })
    }

    console.log('✅ Utilisateur authentifié:', user.email)

    // Récupérer le code d'invitation
    const { code }: OnboardRequest = await req.json().catch(() => ({ code: undefined }))
    
    if (!code) {
      console.log('❌ Code d\'invitation manquant')
      return new Response('Missing invite code', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    console.log('📧 Code d\'invitation reçu:', code)

    // Lire l'invitation dans la base
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('id', code)
      .eq('status', 'pending')
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (invitationError || !invitation) {
      console.log('❌ Invitation invalide:', invitationError?.message)
      return new Response('Invalid or expired invite', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    console.log('✅ Invitation trouvée:', invitation.email)

    // Vérifier correspondance email
    if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
      console.log('❌ Email ne correspond pas:', invitation.email, 'vs', user.email)
      return new Response('Email mismatch', { 
        status: 403,
        headers: corsHeaders 
      })
    }

    console.log('✅ Email vérifié, appel RPC onboard_tenant_owner...')

    // Appeler la fonction RPC transactionnelle
    const { data: result, error: rpcError } = await supabaseAdmin.rpc('onboard_tenant_owner', {
      p_user_id: user.id,
      p_email: user.email,
      p_slug: invitation.tenant_id, // Utiliser tenant_id comme slug temporairement
      p_tenant_name: invitation.tenant_name || `Entreprise ${invitation.full_name}`,
      p_invite_code: invitation.id
    })

    if (rpcError) {
      console.error('❌ Erreur RPC:', rpcError.message)
      return new Response(rpcError.message, { 
        status: 400,
        headers: corsHeaders 
      })
    }

    console.log('✅ Onboarding réussi:', result)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    })

  } catch (error) {
    console.error('💥 Erreur serveur:', error)
    return new Response('Server error', { 
      status: 500,
      headers: corsHeaders 
    })
  }
})
