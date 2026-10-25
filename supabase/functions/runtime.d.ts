declare const Deno: {
  env: { get(name: string): string | undefined };
};

declare module 'npm:@supabase/server@1' {
  interface SupabaseFunctionContext {
    userClaims?: { id?: string; email?: string };
    jwtClaims?: { sub?: string };
    supabaseAdmin: {
      auth: { admin: { deleteUser(id: string): Promise<{ error: Error | null }> } };
    };
  }
  export function withSupabase(
    config: { auth: 'user' },
    handler: (request: Request, context: SupabaseFunctionContext) => Promise<Response>,
  ): (request: Request) => Promise<Response>;
}
