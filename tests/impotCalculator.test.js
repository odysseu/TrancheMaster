/**
 * @jest-environment jsdom
 */
import {
    calculateImpotToRevenuByPercentage,
    calculateImpotToRevenuByAmount,
    calculateImpotToRevenu,
    formatImpotToRevenuResults,
    calculateAndFormatImpotToRevenu
} from '../js/impotCalculator.js';
import { TAX_THRESHOLDS_BY_YEAR_FINAL } from '../js/taxCalculator.js';

describe('Impot Calculator Functions', () => {
    let calculatedRevenuElement;

    beforeEach(() => {
        // Set up DOM elements for testing
        calculatedRevenuElement = document.createElement('p');
        calculatedRevenuElement.id = 'calculated-revenu';
        
        // Create threshold breakdown table
        const thresholdBreakdownReverse = document.createElement('table');
        thresholdBreakdownReverse.id = 'threshold-breakdown-reverse';
        const tbody = document.createElement('tbody');
        tbody.id = 'threshold-breakdown-reverse-body';
        thresholdBreakdownReverse.appendChild(tbody);
        
        document.body.appendChild(calculatedRevenuElement);
        document.body.appendChild(thresholdBreakdownReverse);
        
        // Mock translation system
        window.translationSystem = {
            getTranslation: jest.fn((key, ...args) => {
                const translations = {
                    'calculated-revenu-prefix': 'Calculated annual income: ',
                    'monthly-option': 'Monthly',
                    'zero-tax-message': 'With 0% tax, your annual income is less than {0}€ ({1}€/month).',
                    'tax-percentage-with-deduction-error': 'The tax percentage cannot exceed 40.50% with deduction.',
                    'tax-percentage-with-fixed-charges-error': 'The tax percentage cannot exceed 45% with actual expenses.',
                    'tax-percentage-error': 'The tax percentage cannot exceed 40.50%. Please enter a valid value.'
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

    describe('calculateImpotToRevenuByPercentage', () => {
        it('should return null for invalid input', () => {
            const result = calculateImpotToRevenuByPercentage('', 0, true, true, 2025);
            expect(result).toBeNull();
        });

        it('should return error for tax percentage above maximum with deduction', () => {
            const result = calculateImpotToRevenuByPercentage(42, 0, true, true, 2025);
            expect(result.error).toBe('tax-percentage-with-deduction-error');
        });

        it('should return error for tax percentage above maximum with fixed charges', () => {
            const result = calculateImpotToRevenuByPercentage(46, 1000, false, true, 2025);
            expect(result.error).toBe('tax-percentage-with-fixed-charges-error');
        });

        it('should return null for zero tax percentage (current logic)', () => {
            const result = calculateImpotToRevenuByPercentage(0, 0, true, true, 2025);
            expect(result).toBeNull();
        });

        it('should handle very small tax percentage correctly', () => {
            const result = calculateImpotToRevenuByPercentage(0.1, 0, true, true, 2025);
            expect(result).not.toBeNull();
            expect(result.error).toBeUndefined();
        });

        it('should calculate correctly for valid tax percentage with deduction', () => {
            const result = calculateImpotToRevenuByPercentage(15, 0, true, true, 2025);
            expect(result).not.toBeNull();
            expect(result.error).toBeUndefined();
            expect(parseFloat(result.calculatedNetIncome.yearly)).toBeGreaterThan(0);
        });

        it('should calculate correctly for valid tax percentage with fixed charges', () => {
            const result = calculateImpotToRevenuByPercentage(20, 2000, false, true, 2025);
            expect(result).not.toBeNull();
            expect(result.error).toBeUndefined();
            expect(parseFloat(result.calculatedNetIncome.yearly)).toBeGreaterThan(0);
        });

        it('should handle different years', () => {
            const result = calculateImpotToRevenuByPercentage(10, 0, true, true, 2026);
            expect(result).not.toBeNull();
        });
    });

    describe('calculateImpotToRevenuByAmount', () => {
        it('should return null for invalid input', () => {
            const result = calculateImpotToRevenuByAmount('', 0, true, true, 2025);
            expect(result).toBeNull();
        });

        it('should return null for zero tax amount (current logic)', () => {
            const result = calculateImpotToRevenuByAmount(0, 0, true, true, 2025);
            expect(result).toBeNull();
        });

        it('should handle very small tax amount correctly', () => {
            const result = calculateImpotToRevenuByAmount(1, 0, true, true, 2025);
            expect(result).not.toBeNull();
            expect(parseFloat(result.calculatedNetIncome.yearly)).toBeGreaterThan(0);
        });

        it('should calculate correctly for tax amount with deduction', () => {
            const result = calculateImpotToRevenuByAmount(5000, 0, true, true, 2025);
            expect(result).not.toBeNull();
            expect(parseFloat(result.calculatedNetIncome.yearly)).toBeGreaterThan(0);
        });

        it('should calculate correctly for tax amount with fixed charges', () => {
            const result = calculateImpotToRevenuByAmount(10000, 2000, false, true, 2025);
            expect(result).not.toBeNull();
            expect(parseFloat(result.calculatedNetIncome.yearly)).toBeGreaterThan(0);
        });

        it('should handle monthly tax amount correctly', () => {
            const result = calculateImpotToRevenuByAmount(1000, 0, true, false, 2025);
            expect(result).not.toBeNull();
            expect(parseFloat(result.calculatedNetIncome.yearly)).toBeGreaterThan(0);
        });

        it('should handle different years (2026)', () => {
            const result = calculateImpotToRevenuByAmount(5000, 0, true, true, 2026);
            expect(result).not.toBeNull();
            expect(parseFloat(result.calculatedNetIncome.yearly)).toBeGreaterThan(0);
        });
    });

    describe('calculateImpotToRevenu', () => {
        it('should route to percentage mode when isTaxPercentageMode is true', () => {
            const result = calculateImpotToRevenu(15, 0, 0, true, true, true, 2025);
            expect(result).not.toBeNull();
        });

        it('should route to amount mode when isTaxPercentageMode is false', () => {
            const result = calculateImpotToRevenu(0, 5000, 0, false, true, true, 2025);
            expect(result).not.toBeNull();
        });
    });

    describe('formatImpotToRevenuResults', () => {
        it('should handle null results', () => {
            formatImpotToRevenuResults(null, calculatedRevenuElement);
            expect(calculatedRevenuElement.textContent).toBe('');
        });

        it('should handle error results', () => {
            const errorResult = { error: 'tax-percentage-with-deduction-error' };
            formatImpotToRevenuResults(errorResult, calculatedRevenuElement);
            expect(calculatedRevenuElement.textContent).toContain('cannot exceed 40.50%');
        });

        it('should handle zero tax results', () => {
            const zeroTaxResult = {
                isZeroTax: true,
                calculatedRevenuNoTax: 15000
            };
            formatImpotToRevenuResults(zeroTaxResult, calculatedRevenuElement);
            expect(calculatedRevenuElement.textContent).toContain('With 0% tax');
        });

        it('should format normal results correctly', () => {
            const normalResult = {
                calculatedNetIncome: {
                    yearly: 50000,
                    monthly: 50000 / 12
                },
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
                taxableIncome: 16497
            };
            
            formatImpotToRevenuResults(normalResult, calculatedRevenuElement);
            
            expect(calculatedRevenuElement.textContent).toContain('Calculated annual income: 50000€');
            expect(document.getElementById('threshold-breakdown-reverse-body').querySelectorAll('tr').length).toBe(2);
        });
    });

    describe('calculateAndFormatImpotToRevenu', () => {
        it('should calculate and format results for percentage mode', () => {
            const result = calculateAndFormatImpotToRevenu(
                15, 0, 0, true, true, true, 2025, calculatedRevenuElement
            );
            
            expect(result).not.toBeNull();
            expect(calculatedRevenuElement.textContent).not.toBe('');
        });

        it('should calculate and format results for amount mode', () => {
            const result = calculateAndFormatImpotToRevenu(
                0, 5000, 0, false, true, true, 2025, calculatedRevenuElement
            );
            
            expect(result).not.toBeNull();
            expect(calculatedRevenuElement.textContent).not.toBe('');
        });
    });
});
