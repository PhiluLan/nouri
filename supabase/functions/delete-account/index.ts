import { withSupabase } from 'npm:@supabase/server@1';

const handler = withSupabase({ auth: 'user' }, async (request, context) => {
  if (request.method !== 'POST') return Response.json({ error: 'method_not_allowed' }, { status: 405 });

  let confirmation = '';
  try {
    const body = await request.json();
    confirmation = typeof body?.confirmation === 'string' ? body.confirmation : '';
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (confirmation !== 'DELETE_ACCOUNT') return Response.json({ error: 'confirmation_required' }, { status: 400 });

  const userId = context.userClaims?.id ?? context.jwtClaims?.sub;
  if (!userId) return Response.json({ error: 'user_identity_missing' }, { status: 401 });

  const { error } = await context.supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    console.error('delete-account failed', error);
    return Response.json({ error: 'account_deletion_failed' }, { status: 500 });
  }

  return Response.json({ deleted: true });
});

export default { fetch: handler };
