import assert from 'node:assert/strict';
import test from 'node:test';
import { loadProjectsPageState, saveProjectsPageState } from './projects-page-state';

test('saves and loads projects page state from sessionStorage', () => {
  const store = new Map<string, string>();
  Object.assign(globalThis, {
    window: {
      sessionStorage: {
        getItem(key: string) {
          return store.get(key) ?? null;
        },
        setItem(key: string, value: string) {
          store.set(key, value);
        },
      },
    },
  });

  saveProjectsPageState({
    activeCategory: '宠物陪伴',
    sortMode: 'discussion',
    scrollY: 640,
  });

  assert.deepEqual(loadProjectsPageState(), {
    activeCategory: '宠物陪伴',
    sortMode: 'discussion',
    scrollY: 640,
  });
});

test('returns null for invalid stored state', () => {
  const store = new Map<string, string>([['hvc:projects-page-state', '{"activeCategory":1}']]);
  Object.assign(globalThis, {
    window: {
      sessionStorage: {
        getItem(key: string) {
          return store.get(key) ?? null;
        },
        setItem(key: string, value: string) {
          store.set(key, value);
        },
      },
    },
  });

  assert.equal(loadProjectsPageState(), null);
});
