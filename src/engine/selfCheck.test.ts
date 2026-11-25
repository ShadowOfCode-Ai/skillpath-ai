/**
 * @file selfCheck.test.ts
 * Unit tests for SC01 through SC12 test runner using node:test and node:assert/strict.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { runSystemCheck } from './selfCheck';

test('System Check SC01 - SC12 all pass with zero failures', () => {
  const results = runSystemCheck();

  assert.equal(results.length, 12, 'Expected 12 distinct system check cases');

  for (const res of results) {
    assert.equal(
      res.status,
      'PASS',
      `System Check case ${res.code} (${res.name}) failed! Details: ${res.details}`
    );
  }
});
