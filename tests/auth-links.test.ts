import assert from 'node:assert/strict';
import test from 'node:test';
import { authParamsFromUrl } from '../src/lib/auth-url';

test('reads implicit recovery tokens from a native deep-link fragment', () => {
  const result = authParamsFromUrl('nouri://reset-password#access_token=access&refresh_token=refresh&type=recovery');
  assert.deepEqual(result, {
    accessToken: 'access', refreshToken: 'refresh', code: null, type: 'recovery', error: null,
  });
});

test('reads a PKCE code and surfaces provider errors', () => {
  assert.equal(authParamsFromUrl('nouri://reset-password?code=abc').code, 'abc');
  assert.equal(authParamsFromUrl('nouri://reset-password?error_description=Link%20expired').error, 'Link expired');
});
