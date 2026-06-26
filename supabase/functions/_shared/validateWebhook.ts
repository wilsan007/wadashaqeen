/**
 * Valide le secret webhook pour les Edge Functions sans JWT.
 * Utiliser sur send-invitation et send-notifications.
 */
export function validateWebhookSecret(req: Request): Response | null {
  const secret = req.headers.get('x-webhook-secret');
  const expected = Deno.env.get('WEBHOOK_SECRET');

  if (!expected) {
    console.error('WEBHOOK_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!secret || secret !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}

// Restrict to SITE_URL in production; fall back to '*' only if unset (local dev).
const _origin = (typeof Deno !== 'undefined' ? Deno.env.get('SITE_URL') : null) ?? '*';

export const corsHeaders = {
  'Access-Control-Allow-Origin': _origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
