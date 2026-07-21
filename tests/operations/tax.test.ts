import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateTaxLine, sumExact } from '../../src/services/operations/tax';

const rule = (overrides: Record<string, unknown> = {}) => ({ id: 'general', rateBps: 825, appliesTo: 'ALL', referenceId: null, priority: 1, compound: false, ...overrides });

test('tax uses integer half-up rounding at the line boundary', () => {
  assert.deepEqual(calculateTaxLine({ productId: 'p1', categoryId: 'c1', quantityMilliunits: 1000, unitPriceCents: 1000 }, [rule()], false), {
    grossCents: 1000, discountCents: 0, taxableCents: 1000, taxCents: 83, totalCents: 1083, taxRuleIds: ['general'],
  });
});

test('weighted quantities and discounts remain integer cents', () => {
  const result = calculateTaxLine({ productId: 'p1', categoryId: 'c1', quantityMilliunits: 1250, unitPriceCents: 333, discountCents: 17 }, [rule({ rateBps: 700 })], false);
  assert.deepEqual(result, { grossCents: 416, discountCents: 17, taxableCents: 399, taxCents: 28, totalCents: 427, taxRuleIds: ['general'] });
});

test('product/category applicability and stable priority are honored', () => {
  const result = calculateTaxLine({ productId: 'p1', categoryId: 'c1', quantityMilliunits: 1000, unitPriceCents: 1000 }, [
    rule({ id: 'other', appliesTo: 'PRODUCT', referenceId: 'p2', rateBps: 9999 }),
    rule({ id: 'category', appliesTo: 'CATEGORY', referenceId: 'c1', rateBps: 100, priority: 2 }),
    rule({ id: 'product', appliesTo: 'PRODUCT', referenceId: 'p1', rateBps: 200, priority: 1 }),
  ], false);
  assert.equal(result.taxCents, 30);
  assert.deepEqual(result.taxRuleIds, ['product', 'category']);
});

test('a validated exemption removes all tax rules', () => {
  assert.equal(calculateTaxLine({ productId: 'p1', categoryId: null, quantityMilliunits: 1000, unitPriceCents: 1000 }, [rule()], true).taxCents, 0);
});

test('invalid quantity, discount, and rule rate fail closed', () => {
  assert.throws(() => calculateTaxLine({ productId: 'p1', categoryId: null, quantityMilliunits: 0, unitPriceCents: 100 }, [rule()], false), /Quantity/);
  assert.throws(() => calculateTaxLine({ productId: 'p1', categoryId: null, quantityMilliunits: 1000, unitPriceCents: 100, discountCents: 101 }, [rule()], false), /discount/);
  assert.throws(() => calculateTaxLine({ productId: 'p1', categoryId: null, quantityMilliunits: 1000, unitPriceCents: 100 }, [rule({ rateBps: 100001 })], false), /rate/);
});

test('split tenders must be positive integer cents and exact', () => {
  assert.doesNotThrow(() => sumExact([100, 983], 1083, 'MISMATCH'));
  assert.throws(() => sumExact([100, 982], 1083, 'MISMATCH'), /exactly equal/);
  assert.throws(() => sumExact([1083.1], 1083, 'MISMATCH'), /positive cents/);
});
