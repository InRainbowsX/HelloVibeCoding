import test from 'node:test';
import assert from 'node:assert/strict';

import { consumeContentFlashMessage, setContentFlashMessage } from './content-flash';

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

test('consumes content flash message only once', () => {
  const storage = createMemoryStorage();

  setContentFlashMessage('已保存', storage);

  assert.equal(consumeContentFlashMessage(storage), '已保存');
  assert.equal(consumeContentFlashMessage(storage), null);
});
