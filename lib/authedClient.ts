import { createClient } from '@supabase/supabase-js';

/**
 * Builds a Supabase client scoped to the CALLER, using the JWT they
 * send in the Authorization header. With RLS enabled, this client can
 * only read/write that user's own rows — so the client can no longer
 * spoof a different family by passing someone else's userId.
 *
 * Returns { supabase, userId } or throws if the request is unauthenticated.
 */
export async function getAuthedClient(req: Request) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    throw new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
    });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );

  // Verify the token and get the real user id from it (not the body).
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
    });
  }

  return { supabase, userId: user.id };
}
