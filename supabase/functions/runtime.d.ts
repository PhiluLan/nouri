declare const Deno: {
  env: { get(name: string): string | undefined };
};

declare module 'npm:@supabase/server@1' {
  export function withSupabase(
    config: { auth: 'user' },
    handler: (request: Request, context: unknown) => Promise<Response>,
  ): (request: Request) => Promise<Response>;
}
