import test from 'node:test';
import assert from 'node:assert/strict';

import { getIncubationsIndexPath, getProjectsIndexPath } from './content-routes';

test('returns the projects index path after delete', () => {
  assert.equal(getProjectsIndexPath(), '/projects');
});

test('returns the incubations index path after delete', () => {
  assert.equal(getIncubationsIndexPath(), '/incubations');
});
