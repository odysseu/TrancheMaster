/**
 * @jest-environment node
 *
 * Regression tests: per-year threshold data must be derived from the
 * currently loaded data (not a stale snapshot), so reverse calculations
 * keep working for any year after data/tax_thresholds.json is loaded.
 */
import {
  TAX_THRESHOLDS_BY_YEAR_FINAL,
  getThresholdDataForYear,
  findThresholdForTaxPercentage,
  calculateNetRevenuFromTaxValue,
  calculateTaxWithBreakdown
} from '../js/taxCalculator.js';

// 2020 brackets as published in data/tax_thresholds.json
const THRESHOLDS_2020 = [
  { min: 0, max: 10084, rate: 0 },
  { min: 10085, max: 25710, rate: 0.11 },
  { min: 25711, max: 73516, rate: 0.30 },
  { min: 73517, max: 158122, rate: 0.41 },
  { min: 158123, max: Infinity, rate: 0.45 }
];

describe('Per-year threshold data (loaded at runtime)', () => {
  beforeAll(() => {
    // Simulate what loadTaxDataFromJSON() does after fetching data/tax_thresholds.json
    TAX_THRESHOLDS_BY_YEAR_FINAL[2020] = THRESHOLDS_2020;
  });

  afterAll(() => {
    delete TAX_THRESHOLDS_BY_YEAR_FINAL[2020];
  });

  it('should compute threshold metadata for a year added after module load', () => {
    const data = getThresholdDataForYear(2020);
    expect(data.length).toBe(5);
    expect(data[2].min).toBe(25711);
    expect(data[2].cumulativeTax).toBeCloseTo((25710 - 10084) * 0.11);
  });

  it('should find the 2020 bracket (not the 2025 one) for a 15% tax rate', () => {
    const { threshold } = findThresholdForTaxPercentage(15, 2020);
    expect(threshold).not.toBeNull();
    expect(threshold.min).toBe(25711); // 2020 30% bracket, not 29316 (2025)
    expect(threshold.max).toBe(73516);
  });

  it('should reverse-calculate tax amount using 2020 brackets', () => {
    // Forward: taxable income 50000 in 2020 -> tax
    const { tax } = calculateTaxWithBreakdown(50000, 2020);
    // Reverse: same tax amount must give back taxable income 50000 (fixed charges = 0)
    const result = calculateNetRevenuFromTaxValue(parseFloat(tax), 'fixed', 0, 2020);
    expect(parseFloat(result.yearly)).toBeCloseTo(50000, 0);
  });

  it('should keep 2025 results unchanged', () => {
    const { threshold } = findThresholdForTaxPercentage(15, 2025);
    expect(threshold.min).toBe(29316);
  });
});
