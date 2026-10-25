import { supabase } from './supabase';
import { authParamsFromUrl } from './auth-url';

export const passwordResetRedirectUrl = 'nouri://reset-password';

export async function createSessionFromAuthUrl(url: string) {
  const params = authParamsFromUrl(url);
  if (params.error) throw new Error(params.error);

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return data.session;
  }

  if (params.accessToken && params.refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.accessToken,
      refresh_token: params.refreshToken,
    });
    if (error) throw error;
    return data.session;
  }

  throw new Error('Der Rücksetzlink enthält keine gültige Sitzung. Fordere bitte einen neuen Link an.');
}
