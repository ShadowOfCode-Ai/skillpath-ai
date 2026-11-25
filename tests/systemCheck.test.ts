/**
 * @file systemCheck.test.ts
 * Vitest & Node-compatible test suite verifying SC01 through SC12 test cases.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { runSystemCheck } from '../src/engine/selfCheck';

test('SC01 - SC12 diagnostic test suite', () => {
  const results = runSystemCheck();

  assert.equal(results.length, 12, 'Expected 12 distinct test cases in System Check suite');

  for (const item of results) {
    assert.equal(
      item.status,
      'PASS',
      `Test case ${item.code} (${item.name}) failed! Details: ${item.details}`
    );
  }
});
