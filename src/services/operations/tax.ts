import { OperationsError } from './errors';

export type TaxRuleInput = {
  id: string;
  rateBps: number;
  appliesTo: string;
  referenceId: string | null;
  priority: number;
  compound: boolean;
};

export type TaxLineInput = {
  productId: string;
  categoryId: string | null;
  quantityMilliunits: number;
  unitPriceCents: number;
  discountCents?: number;
};

function roundHalfUp(numerator: number, denominator: number): number {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator <= 0) {
    throw new OperationsError('Money calculation exceeded safe integer limits', 422, 'MONEY_RANGE_INVALID');
  }
  return Math.floor((numerator + Math.floor(denominator / 2)) / denominator);
}

export function calculateTaxLine(line: TaxLineInput, rules: TaxRuleInput[], exempt: boolean) {
  if (!Number.isInteger(line.quantityMilliunits) || line.quantityMilliunits <= 0 || line.quantityMilliunits > 1_000_000) {
    throw new OperationsError('Quantity must be positive integer milliunits', 422, 'QUANTITY_INVALID');
  }
  if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
    throw new OperationsError('Unit price must be non-negative integer cents', 422, 'PRICE_INVALID');
  }
  const grossCents = roundHalfUp(line.quantityMilliunits * line.unitPriceCents, 1000);
  const discountCents = line.discountCents ?? 0;
  if (!Number.isInteger(discountCents) || discountCents < 0 || discountCents > grossCents) {
    throw new OperationsError('Line discount is invalid', 422, 'DISCOUNT_INVALID');
  }
  const taxableCents = grossCents - discountCents;
  const applicable = exempt ? [] : rules
    .filter((rule) => rule.appliesTo === 'ALL' || (rule.appliesTo === 'PRODUCT' && rule.referenceId === line.productId) || (rule.appliesTo === 'CATEGORY' && rule.referenceId === line.categoryId))
    .sort((a, b) => a.priority - b.priority);
  let taxCents = 0;
  for (const rule of applicable) {
    if (!Number.isInteger(rule.rateBps) || rule.rateBps < 0 || rule.rateBps > 100_000) {
      throw new OperationsError('Tax rule rate is invalid', 422, 'TAX_RULE_INVALID');
    }
    const base = rule.compound ? taxableCents + taxCents : taxableCents;
    taxCents += roundHalfUp(base * rule.rateBps, 10_000);
  }
  return {
    grossCents,
    discountCents,
    taxableCents,
    taxCents,
    totalCents: taxableCents + taxCents,
    taxRuleIds: applicable.map((rule) => rule.id),
  };
}

export function sumExact(values: number[], expected: number, code: string): void {
  if (values.some((value) => !Number.isInteger(value) || value <= 0) || values.reduce((sum, value) => sum + value, 0) !== expected) {
    throw new OperationsError('Tender amounts must be positive cents and exactly equal the checkout total', 422, code);
  }
}
