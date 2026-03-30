import test from 'node:test';
import assert from 'node:assert/strict';

import { consumeAuthFlashMessage, setAuthFlashMessage } from './auth-flash';

function createMemoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
  };
}

test('consumes auth flash message only once', () => {
  const storage = createMemoryStorage();

  setAuthFlashMessage('登录成功', storage);

  assert.equal(consumeAuthFlashMessage(storage), '登录成功');
  assert.equal(consumeAuthFlashMessage(storage), null);
});
