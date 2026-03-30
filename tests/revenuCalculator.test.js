/**
 * @jest-environment jsdom
 */
import {
    calculateRevenuToImpot,
    formatRevenuToImpotResults,
    calculateAndFormatRevenuToImpot
} from '../js/revenuCalculator.js';
import { TAX_THRESHOLDS_BY_YEAR_FINAL } from '../js/taxCalculator.js';

describe('Revenu Calculator Functions', () => {
    let taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement;

    beforeEach(() => {
        // Set up DOM elements for testing
        taxPercentageElement = document.createElement('p');
        taxPercentageElement.id = 'tax-percentage';
        
        thresholdBreakdownElement = document.createElement('tbody');
        thresholdBreakdownElement.id = 'threshold-breakdown';
        
        totalTaxElement = document.createElement('p');
        totalTaxElement.id = 'total-tax';
        
        missingMoneyElement = document.createElement('p');
        missingMoneyElement.id = 'missing-money';
        
        document.body.appendChild(taxPercentageElement);
        document.body.appendChild(thresholdBreakdownElement);
        document.body.appendChild(totalTaxElement);
        document.body.appendChild(missingMoneyElement);
        
        // Mock translation system
        window.translationSystem = {
            getTranslation: jest.fn((key, ...args) => {
                const translations = {
                    'tax-percentage-prefix': 'Tax rate: ',
                    'total-tax-prefix': 'Total tax: ',
                    'no-tax-complete': 'With a taxable income of {0}€, you don\'t pay any tax. You are below the first tax threshold ({1}€).',
                    'max-contributor-message': 'You are a great contributor! You have exceeded the highest tax bracket.',
                    'missing-money-complete': 'You need an additional {0}€ per year ({1}€ per month) to reach the next bracket.'
                };
                let translation = translations[key] || key;
                args.forEach((arg, i) => {
                    translation = translation.replace(`{${i}}`, arg);
                });
                return translation;
            })
        };
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('calculateRevenuToImpot', () => {
        it('should return null for invalid input', () => {
            const result = calculateRevenuToImpot('', 0, true, true, 2025);
            expect(result).toBeNull();
        });

        it('should calculate correctly for income below first threshold', () => {
            const result = calculateRevenuToImpot(10000, 0, true, true, 2025);
            expect(result.tax).toBe(0);
            expect(result.taxPercentage).toBe(0);
            expect(result.hasNextThreshold).toBe(true);
        });

        it('should calculate correctly for income in first taxable threshold', () => {
            const result = calculateRevenuToImpot(20000, 0, true, true, 2025);
            expect(parseFloat(result.tax)).toBeGreaterThan(0);
            expect(result.taxPercentage).toBeGreaterThan(0);
            expect(result.taxableIncome).toBe(20000 * 0.9);
        });

        it('should calculate correctly with fixed charges', () => {
            const result = calculateRevenuToImpot(50000, 2000, true, false, 2025);
            expect(result.taxableIncome).toBe(50000 - 2000);
            expect(parseFloat(result.tax)).toBeGreaterThan(0);
        });

        it('should handle monthly income correctly', () => {
            const result = calculateRevenuToImpot(4000, 0, false, true, 2025);
            expect(result.taxableIncome).toBe(4000 * 12 * 0.9);
        });

        it('should handle highest tax bracket', () => {
            const result = calculateRevenuToImpot(300000, 0, true, true, 2025);
            expect(result.hasNextThreshold).toBe(false);
        });
    });

    describe('formatRevenuToImpotResults', () => {
        it('should handle null results', () => {
            formatRevenuToImpotResults(null, taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement);
            expect(taxPercentageElement.textContent).toBe('');
            expect(thresholdBreakdownElement.innerHTML).toBe('');
        });

        it('should format results correctly for zero tax', () => {
            const mockResults = {
                tax: 0,
                taxPercentage: 0,
                breakdown: [{
                    min: 0,
                    max: 11497,
                    rate: 0,
                    taxableAmount: 10000,
                    tax: 0
                }],
                taxableIncome: 10000,
                missingMoneyYearly: 1497,
                missingMoneyMonthly: 1497 / 12,
                hasNextThreshold: true,
                thresholds: TAX_THRESHOLDS_BY_YEAR_FINAL[2025]
            };
            
            formatRevenuToImpotResults(mockResults, taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement);
            
            expect(taxPercentageElement.textContent).toContain('Tax rate: 0.000');
            expect(totalTaxElement.textContent).toContain('Total tax: 0');
            expect(missingMoneyElement.textContent).toContain('You need an additional');
            expect(thresholdBreakdownElement.querySelectorAll('tr').length).toBe(1);
        });

        it('should format results correctly for taxable income', () => {
            const mockResults = {
                tax: "1000",
                taxPercentage: 10,
                breakdown: [
                    {
                        min: 0,
                        max: 11497,
                        rate: 0,
                        taxableAmount: 11497,
                        tax: 0
                    },
                    {
                        min: 11498,
                        max: 29315,
                        rate: 0.11,
                        taxableAmount: 5000,
                        tax: 550
                    }
                ],
                taxableIncome: 16497,
                missingMoneyYearly: 12718,
                missingMoneyMonthly: 12718 / 12,
                hasNextThreshold: true,
                thresholds: TAX_THRESHOLDS_BY_YEAR_FINAL[2025]
            };
            
            formatRevenuToImpotResults(mockResults, taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement);
            
            expect(taxPercentageElement.textContent).toContain('Tax rate: 10.000');
            expect(totalTaxElement.textContent).toContain('Total tax: 1000');
            expect(thresholdBreakdownElement.querySelectorAll('tr').length).toBe(2);
        });

        it('should format max contributor message', () => {
            const mockResults = {
                tax: 50000,
                taxPercentage: 45,
                breakdown: [],
                taxableIncome: 200000,
                missingMoneyYearly: 0,
                missingMoneyMonthly: 0,
                hasNextThreshold: false,
                thresholds: TAX_THRESHOLDS_BY_YEAR_FINAL[2025]
            };
            
            formatRevenuToImpotResults(mockResults, taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement);
            
            expect(missingMoneyElement.textContent).toContain('You are a great contributor');
        });
    });

    describe('calculateAndFormatRevenuToImpot', () => {
        it('should calculate and format results', () => {
            const result = calculateAndFormatRevenuToImpot(
                50000, 0, true, true, 2025,
                taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement
            );
            
            expect(result).not.toBeNull();
            expect(taxPercentageElement.textContent).not.toBe('');
            expect(thresholdBreakdownElement.innerHTML).not.toBe('');
        });
    });
});
