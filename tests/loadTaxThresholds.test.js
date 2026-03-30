/**
 * @jest-environment node
 */
import { TAX_THRESHOLDS_BY_YEAR_FINAL } from '../js/taxCalculator.js';

describe('Tax Thresholds Loading', () => {
  it('should load tax thresholds from JSON file', () => {
    expect(TAX_THRESHOLDS_BY_YEAR_FINAL).toBeDefined();
    expect(typeof TAX_THRESHOLDS_BY_YEAR_FINAL).toBe('object');
  });

  it('should have data for 2025', () => {
    expect(TAX_THRESHOLDS_BY_YEAR_FINAL[2025]).toBeDefined();
    expect(Array.isArray(TAX_THRESHOLDS_BY_YEAR_FINAL[2025])).toBe(true);
    expect(TAX_THRESHOLDS_BY_YEAR_FINAL[2025].length).toBe(5);
  });

  it('should have data for 2026', () => {
    expect(TAX_THRESHOLDS_BY_YEAR_FINAL[2026]).toBeDefined();
    expect(Array.isArray(TAX_THRESHOLDS_BY_YEAR_FINAL[2026])).toBe(true);
    expect(TAX_THRESHOLDS_BY_YEAR_FINAL[2026].length).toBe(5);
  });

  it('should have correct 2025 threshold values', () => {
    const thresholds2025 = TAX_THRESHOLDS_BY_YEAR_FINAL[2025];
    
    expect(thresholds2025[0]).toEqual({ min: 0, max: 11497, rate: 0 });
    expect(thresholds2025[1]).toEqual({ min: 11498, max: 29315, rate: 0.11 });
    expect(thresholds2025[2]).toEqual({ min: 29316, max: 83823, rate: 0.3 });
    expect(thresholds2025[3]).toEqual({ min: 83824, max: 180294, rate: 0.41 });
    expect(thresholds2025[4]).toEqual({ min: 180295, max: Infinity, rate: 0.45 });
  });

  it('should have correct 2026 threshold values from JSON', () => {
    const thresholds2026 = TAX_THRESHOLDS_BY_YEAR_FINAL[2026];
    
    expect(thresholds2026[0]).toEqual({ min: 0, max: 11600, rate: 0 });
    expect(thresholds2026[1]).toEqual({ min: 11601, max: 29579, rate: 0.11 });
    expect(thresholds2026[2]).toEqual({ min: 29580, max: 84577, rate: 0.3 });
    expect(thresholds2026[3]).toEqual({ min: 84578, max: 181917, rate: 0.41 });
    expect(thresholds2026[4]).toEqual({ min: 181918, max: Infinity, rate: 0.45 });
  });

  it('should convert Infinity strings to actual Infinity', () => {
    const thresholds2025 = TAX_THRESHOLDS_BY_YEAR_FINAL[2025];
    const lastThreshold = thresholds2025[thresholds2025.length - 1];
    
    expect(lastThreshold.max).toBe(Infinity);
    expect(typeof lastThreshold.max).toBe('number');
    expect(isFinite(lastThreshold.max)).toBe(false);
  });

  it('should have Infinity in 2026 thresholds', () => {
    const thresholds2026 = TAX_THRESHOLDS_BY_YEAR_FINAL[2026];
    const lastThreshold = thresholds2026[thresholds2026.length - 1];
    
    expect(lastThreshold.max).toBe(Infinity);
    expect(typeof lastThreshold.max).toBe('number');
    expect(isFinite(lastThreshold.max)).toBe(false);
  });

  describe('Threshold validation', () => {
    it('should have thresholds in ascending order for 2025', () => {
      const thresholds = TAX_THRESHOLDS_BY_YEAR_FINAL[2025];
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i].min).toBeGreaterThan(thresholds[i-1].min);
        expect(thresholds[i].max).toBeGreaterThan(thresholds[i-1].max);
      }
    });

    it('should have thresholds in ascending order for 2026', () => {
      const thresholds = TAX_THRESHOLDS_BY_YEAR_FINAL[2026];
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i].min).toBeGreaterThan(thresholds[i-1].min);
        expect(thresholds[i].max).toBeGreaterThan(thresholds[i-1].max);
      }
    });

    it('should have no gaps between thresholds for 2025', () => {
      const thresholds = TAX_THRESHOLDS_BY_YEAR_FINAL[2025];
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i].min).toBe(thresholds[i-1].max + 1);
      }
    });

    it('should have no gaps between thresholds for 2026', () => {
      const thresholds = TAX_THRESHOLDS_BY_YEAR_FINAL[2026];
      for (let i = 1; i < thresholds.length; i++) {
        expect(thresholds[i].min).toBe(thresholds[i-1].max + 1);
      }
    });
  });

  describe('Year comparison', () => {
    it('should have different values for 2025 vs 2026', () => {
      const thresholds2025 = TAX_THRESHOLDS_BY_YEAR_FINAL[2025];
      const thresholds2026 = TAX_THRESHOLDS_BY_YEAR_FINAL[2026];
      
      // First thresholds should be different
      expect(thresholds2026[0].max).not.toBe(thresholds2025[0].max);
      expect(thresholds2026[0].max).toBe(11600); // Updated value
      expect(thresholds2025[0].max).toBe(11497); // Original value
    });

    it('should have consistent rate structure between years', () => {
      const thresholds2025 = TAX_THRESHOLDS_BY_YEAR_FINAL[2025];
      const thresholds2026 = TAX_THRESHOLDS_BY_YEAR_FINAL[2026];
      
      expect(thresholds2025.length).toBe(thresholds2026.length);
      
      for (let i = 0; i < thresholds2025.length; i++) {
        expect(thresholds2025[i].rate).toBe(thresholds2026[i].rate);
      }
    });
  });
});
