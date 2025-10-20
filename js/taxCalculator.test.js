/**
 * @jest-environment jsdom
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
    TAX_THRESHOLDS,
    THRESHOLD_DATA,
    calculateTax,
    calculateTaxWithBreakdown,
    estimateRevenuFromTax,
    findThresholdForTaxPercentage,
    calculateRevenuFromTaxPercentage,
    formatNumber
} from './taxCalculator.js';

describe('Tax Calculation Functions', () => {
    let container;

    beforeAll(() => {
        // Load the index.html file
        const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
        document.body.innerHTML = html;

        // Mock translation system if needed
        window.translationSystem = {
            getTranslation: (key, ...args) => {
                const translations = {
                    'tax-percentage-prefix': 'Tax rate: ',
                    'total-tax-prefix': 'Total tax: ',
                    'no-tax-complete': 'With a taxable income of {0}€, you don\'t pay any tax. You are below the first tax threshold ({1}€).',
                    'max-contributor-message': 'You are a great contributor! You have exceeded the highest tax bracket.',
                    'missing-money-complete': 'You need an additional {0}€ per year ({1}€ per month) to reach the next bracket.',
                    'tax-percentage-error': 'The tax percentage cannot exceed 40.50%. Please enter a valid value.',
                    'zero-tax-message': 'With 0% tax, your annual income is less than {0}€ ({1}€/month).',
                    'estimated-revenu-prefix': 'Estimated annual income: ',
                    'monthly-option': 'Monthly'
                };
                return translations[key] || key;
            },
            loadTranslations: jest.fn().mockResolvedValue({}), // Changed from resolvedValue to mockResolvedValue
            registerCalculationFunctions: jest.fn(),
            currentLanguage: 'en',
            translations: {}
        };
    });

    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = `
      <div id="revenu-to-impot-section" class="section active">
        <div class="input-group">
          <input type="number" id="revenu" value="50000">
          <select id="revenu-type">
            <option value="yearly" selected>Yearly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div class="input-group" id="fixed-charges-group" style="display: none;">
          <input type="number" id="fixed-charges" value="2000">
        </div>
      </div>
      <div id="impot-to-revenu-section" class="section">
        <div class="input-group">
          <input type="number" id="tax-percentage-input" value="15">
        </div>
        <div class="input-group">
          <input type="number" id="tax-amount" value="5000">
          <select id="tax-type">
            <option value="yearly" selected>Yearly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div class="input-group" id="fixed-charges-group-reverse" style="display: none;">
          <input type="number" id="fixed-charges-reverse" value="1000">
        </div>
      </div>
      <div class="results">
        <p id="tax-percentage"></p>
        <table class="threshold-table">
          <tbody id="threshold-breakdown"></tbody>
        </table>
        <p id="total-tax"></p>
        <p id="missing-money"></p>
        <p id="estimated-revenu"></p>
      </div>
    `;
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('calculateTax', () => {
        it('should return 0 for income below first threshold', () => {
            expect(calculateTax(10000)).toBe(0);
            expect(calculateTax(11497)).toBe(0);
        });

        it('should calculate correct tax for income in first taxable threshold', () => {
            expect(calculateTax(11498)).toBe(0); // rounded 0.11 * (11498 - 11497)
            expect(calculateTax(15000)).toBe(385.33); // (15000-11497)*0.11
            expect(calculateTax(29315)).toBe(1935.05);
        });

        it('should calculate correct tax for income in second threshold', () => {
            expect(calculateTax(29316)).toBe(1935.17);
            expect(calculateTax(50000)).toBe(5467.5);
        });

        it('should calculate correct tax for income in third threshold', () => {
            expect(calculateTax(83824)).toBe(18081.59);
            expect(calculateTax(100000)).toBe(25467.5);
        });

        it('should calculate correct tax for income in highest threshold', () => {
            expect(calculateTax(180295)).toBe(58435.55);
            expect(calculateTax(200000)).toBe(66435.5);
        });
    });

    describe('findThresholdForTaxPercentage', () => {
        it('should find correct threshold for 0% tax', () => {
            const threshold = findThresholdForTaxPercentage(0);
            expect(threshold.min).toBe(0);
            expect(threshold.max).toBe(11497);
        });

        it('should find correct threshold for 2% tax', () => {
            const threshold = findThresholdForTaxPercentage(2);
            expect(threshold.min).toBe(11498);
            expect(threshold.max).toBe(29315);
        });

        it('should find correct threshold for 15% tax', () => {
            const threshold = findThresholdForTaxPercentage(15);
            expect(threshold.min).toBe(11498);
            expect(threshold.max).toBe(29315);
        });

        it('should return null for invalid tax percentages', () => {
            expect(findThresholdForTaxPercentage(-1)).toBeNull();
            expect(findThresholdForTaxPercentage(50)).toBeNull();
        });
    });

    describe('estimateRevenuFromTax', () => {
        describe('with abattement (10% deduction)', () => {
            it('should return correct revenue for tax in first threshold', () => {
                const result = estimateRevenuFromTax(100, 'abattement', 0);
                expect(result.yearly).toBe(11507.85);
            });

            it('should return correct revenue for tax spanning multiple thresholds', () => {
                const result = estimateRevenuFromTax(5000, 'abattement', 0);
                expect(result.yearly).toBe(33706.61);
            });
        });

        describe('with fixed charges', () => {
            it('should return correct revenue for tax in first threshold', () => {
                const result = estimateRevenuFromTax(100, 'fixed', 1000);
                expect(result.yearly).toBe(12507.85);
            });
        });
    });

    describe('calculateRevenuFromTaxPercentage', () => {
        describe('with abattement', () => {
            it('should return correct revenue for 2% tax', () => {
                const threshold = findThresholdForTaxPercentage(2);
                const result = calculateRevenuFromTaxPercentage(2, 'abattement', 0, threshold);
                expect(result.yearly).toBe(14211.76);
            });
        });

        describe('with fixed charges', () => {
            it('should return correct revenue for 2% tax', () => {
                const threshold = findThresholdForTaxPercentage(2);
                const result = calculateRevenuFromTaxPercentage(2, 'fixed', 1000, threshold);
                expect(result.yearly).toBe(15211.76);
            });
        });
    });

    describe('Round-trip verification', () => {
        const testCases = [
            { income: 25000, chargesType: 'abattement', fixedCharges: 0 },
            { income: 50000, chargesType: 'abattement', fixedCharges: 0 },
            { income: 100000, chargesType: 'abattement', fixedCharges: 0 },
            { income: 25000, chargesType: 'fixed', fixedCharges: 2000 },
        ];

        testCases.forEach(({ income, chargesType, fixedCharges }) => {
            it(`should verify round-trip for income ${income} with ${chargesType} charges`, () => {
                // Calculate tax from income
                const taxableIncome = chargesType === 'abattement' ? income * 0.9 : income - fixedCharges;
                const tax = calculateTax(taxableIncome);

                // Calculate income back from tax
                const estimatedIncome = estimateRevenuFromTax(tax, chargesType, fixedCharges);

                // Calculate tax percentage
                const taxPercentage = (tax / income) * 100;

                // Calculate income from tax percentage
                const threshold = findThresholdForTaxPercentage(taxPercentage);
                const estimatedIncomeFromPercentage = calculateRevenuFromTaxPercentage(
                    taxPercentage, chargesType, fixedCharges, threshold
                );

                // Verify results are close
                expect(estimatedIncome.yearly).toBeCloseTo(income, -1);
                expect(estimatedIncomeFromPercentage.yearly).toBeCloseTo(income, -1);
            });
        });
    });

    describe('formatNumber', () => {
        it('should format integers correctly', () => {
            expect(formatNumber(1000)).toBe(1000);
        });

        it('should format decimals correctly', () => {
            expect(formatNumber(1000.456)).toBe(1000.46);
            expect(formatNumber(1000.4)).toBe(1000.4);
        });
    });

    describe('THRESHOLD_DATA verification', () => {
        it('should have correct pre-calculated data', () => {
            expect(THRESHOLD_DATA.length).toBe(TAX_THRESHOLDS.length);
            expect(THRESHOLD_DATA[1].minTaxPercentage).toBeCloseTo(10.04);
            expect(THRESHOLD_DATA[2].minTaxPercentage).toBeCloseTo(18.16);
        });
    });
});
