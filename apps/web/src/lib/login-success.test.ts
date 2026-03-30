import test from 'node:test';
import assert from 'node:assert/strict';

import { runLoginSuccessFlow } from './login-success';

const authResponse = {
  user: {
    id: 'user-1',
    username: 'wangxu',
    displayName: '王旭',
    role: 'ADMIN',
    isSimulated: false,
    createdAt: '2026-03-11T00:00:00.000Z',
  },
  token: 'token-1',
};

test('applies login result to auth context even when external callback is missing', () => {
  let receivedUser = '';

  runLoginSuccessFlow(authResponse, {
    syncAuthState(data) {
      receivedUser = data.user.username;
    },
  });

  assert.equal(receivedUser, 'wangxu');
});

test('also calls external onLogin when provided', () => {
  const calls: string[] = [];

  runLoginSuccessFlow(authResponse, {
    syncAuthState(data) {
      calls.push(`auth:${data.user.username}`);
    },
    onLogin(data) {
      calls.push(`external:${data.user.username}`);
    },
  });

  assert.deepEqual(calls, ['auth:wangxu', 'external:wangxu']);
});
