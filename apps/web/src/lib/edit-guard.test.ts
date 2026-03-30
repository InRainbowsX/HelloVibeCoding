import test from 'node:test';
import assert from 'node:assert/strict';

import { shouldWarnBeforeLeave } from './edit-guard';

test('warns when form is dirty and navigation target changes', () => {
  assert.equal(
    shouldWarnBeforeLeave({
      isDirty: true,
      currentPathname: '/projects/poop-map',
      nextPathname: '/projects',
    }),
    true,
  );
});

test('does not warn when form is clean', () => {
  assert.equal(
    shouldWarnBeforeLeave({
      isDirty: false,
      currentPathname: '/projects/poop-map',
      nextPathname: '/projects',
    }),
    false,
  );
});

test('does not warn when staying on the same pathname', () => {
  assert.equal(
    shouldWarnBeforeLeave({
      isDirty: true,
      currentPathname: '/projects/poop-map',
      nextPathname: '/projects/poop-map',
    }),
    false,
  );
});
