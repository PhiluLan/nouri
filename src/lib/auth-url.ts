export function authParamsFromUrl(url: string) {
  const parsed = new URL(url);
  const query = new URLSearchParams(parsed.search);
  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const value = (key: string) => query.get(key) ?? fragment.get(key);

  return {
    accessToken: value('access_token'),
    refreshToken: value('refresh_token'),
    code: value('code'),
    type: value('type'),
    error: value('error_description') ?? value('error'),
  };
}
