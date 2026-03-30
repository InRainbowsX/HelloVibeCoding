import test from 'node:test';
import assert from 'node:assert/strict';

import { getProjectPrimaryTabFromPath } from './project-detail-tabs';

test('resolves overview tab for default project detail path', () => {
  assert.equal(getProjectPrimaryTabFromPath('/projects/checkiday', 'checkiday'), 'overview');
});

test('keeps overview tab active for teardown path after teardown is retired', () => {
  assert.equal(getProjectPrimaryTabFromPath('/projects/checkiday/teardown', 'checkiday'), 'overview');
});
