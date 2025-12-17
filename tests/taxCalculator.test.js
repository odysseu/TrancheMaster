/**
 * @jest-environment jsdom
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
    TAX_THRESHOLDS,
    THRESHOLD_DATA,
    calculateTaxWithBreakdown,
    calculateNetRevenuFromTaxValue,
    findThresholdForTaxPercentage,
    calculateNetRevenuFromTaxPercentage,
    formatNumber
} from '../js/taxCalculator.js';

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
                    'calculated-revenu-prefix': 'Calculated annual income: ',
                    'monthly-option': 'Monthly'
                };
                return translations[key] || key;
            },
            loadTranslations: jest.fn().mockResolvedValue({}),
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
                <p id="calculated-revenu"></p>
            </div>
        `;
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('calculateTaxWithBreakdown', () => {
        it('should return 0 for income below first threshold', () => {
            const { tax, breakdown } = calculateTaxWithBreakdown(0);
            expect(tax).toBe(0);
            expect(breakdown).toEqual([{ "max": 11497, "min": 0, "rate": 0, "tax": 0, "taxableAmount": 0 }]);

            const result2 = calculateTaxWithBreakdown(100);
            expect(result2.tax).toBe(0);
            expect(result2.breakdown).toEqual([{ "max": 11497, "min": 0, "rate": 0, "tax": 0, "taxableAmount": 100 }]);

            const result3 = calculateTaxWithBreakdown(11497);
            expect(result3.tax).toBe(0);
            expect(result3.breakdown).toEqual([{ "max": 11497, "min": 0, "rate": 0, "tax": 0, "taxableAmount": 11497 }]);
        });

        it('should calculate correct tax and breakdown for income in first taxable threshold', () => {
            const { tax, breakdown } = calculateTaxWithBreakdown(11498);
            expect(tax).toBe("0.11");
            expect(breakdown.length).toEqual(2)
            expect(breakdown[1]).toEqual(
                {
                    min: 11498,
                    max: 29315,
                    rate: 0.11,
                    taxableAmount: 1,
                    tax: 0.11
                }
            );

            const result2 = calculateTaxWithBreakdown(15000);
            expect(result2.tax).toBe("385.33");
            expect(result2.breakdown.length).toEqual(2)
            expect(result2.breakdown[1]).toEqual(
                {
                    min: 11498,
                    max: 29315,
                    rate: 0.11,
                    taxableAmount: 3503,
                    tax: 385.33
                }
            );

            const result3 = calculateTaxWithBreakdown(29315);
            expect(result3.tax).toBe("1959.98");
            expect(result3.breakdown.length).toEqual(2)
            expect(result3.breakdown[1]).toEqual(
                {
                    min: 11498,
                    max: 29315,
                    rate: 0.11,
                    taxableAmount: 17818,
                    tax: 1959.98
                }
            );
        });

        it('should calculate correct tax and breakdown for income in second threshold', () => {
            const { tax, breakdown } = calculateTaxWithBreakdown(29316);
            expect(tax).toBe("1960.28");
            expect(breakdown.length).toEqual(3)
            expect(breakdown[2]).toEqual({"max": 83823, "min": 29316, "rate": 0.3, "tax": 0.3, "taxableAmount": 1});

            const result2 = calculateTaxWithBreakdown(50000);
            expect(result2.tax).toBe("8165.48");
            expect(result2.breakdown).toHaveLength(3);
            expect(result2.breakdown[0].taxableAmount).toBe(11497);
            expect(result2.breakdown[0].tax).toBe(0);
            expect(result2.breakdown[1].taxableAmount).toBe(17818);
            expect(result2.breakdown[1].tax).toBeCloseTo(1959.98);
        });

        it('should calculate correct tax and breakdown for income in third threshold', () => {
            const { tax, breakdown } = calculateTaxWithBreakdown(83824);
            expect(tax).toBe("18312.79");
            expect(breakdown).toHaveLength(4);
            expect(breakdown[0].taxableAmount).toBe(11497);
            expect(breakdown[0].tax).toBe(0);
            expect(breakdown[1].taxableAmount).toBe(17818);
            expect(breakdown[1].tax).toBeCloseTo(1959.98);
            expect(breakdown[2].taxableAmount).toBe(54508);
            expect(breakdown[2].tax).toBeCloseTo(16352.4);

            const result2 = calculateTaxWithBreakdown(100000);
            expect(result2.tax).toBe("24944.95");
            expect(result2.breakdown).toHaveLength(4);
            expect(result2.breakdown[2].taxableAmount).toBe(54508);
            expect(result2.breakdown[2].tax).toBeCloseTo(16352.4);
        });

        it('should calculate correct tax and breakdown for income in highest threshold', () => {
            const { tax, breakdown } = calculateTaxWithBreakdown(180295);
            expect(tax).toBe("57865.94");
            expect(breakdown).toHaveLength(5);
            expect(breakdown[3].taxableAmount).toBe(96471);
            expect(breakdown[3].tax).toBeCloseTo(39553.11);

            const result2 = calculateTaxWithBreakdown(200000);
            expect(result2.tax).toBe("66733.19");
            expect(result2.breakdown).toHaveLength(5);
            expect(result2.breakdown[3].taxableAmount).toBe(96471);
            expect(result2.breakdown[3].tax).toBeCloseTo(39553.11);
        });
    });

    describe('findThresholdForTaxPercentage', () => {
        it('should find correct threshold for 0% tax', () => {
            const { threshold } = findThresholdForTaxPercentage(0);
            expect(threshold.min).toBe(0);
            expect(threshold.max).toBe(11497);
        });

        it('should find correct threshold for 2% tax', () => {
            const { threshold } = findThresholdForTaxPercentage(2);
            expect(threshold.min).toBe(11498);
            expect(threshold.max).toBe(29315);
        });

        it('should find correct threshold for 15% tax', () => {
            const { threshold } = findThresholdForTaxPercentage(15);
            expect(threshold.min).toBe(29316);
            expect(threshold.max).toBe(83823);
        });

        it('should return null for invalid tax percentages', () => {
            const { threshold } = findThresholdForTaxPercentage(-1);
            expect(threshold).toBeNull();

            const { threshold: threshold2 } = findThresholdForTaxPercentage(50);
            expect(threshold2).toBeNull();
        });
    });

    describe('calculateNetRevenuFromTaxValue', () => {
        describe('with abattement (10% deduction)', () => {
            it('should return correct revenue for tax in first threshold', () => {
                const result = calculateNetRevenuFromTaxValue(100, 'abattement', 0);
                expect(parseFloat(result.yearly)).toBeCloseTo(parseFloat("13784.55"), 1);
            });

            it('should return correct revenue for tax spanning multiple thresholds', () => {
                const result = calculateNetRevenuFromTaxValue(5000, 'abattement', 0);
                expect(parseFloat(result.yearly)).toBeCloseTo(parseFloat("43831.55"), 1);
            });
        });

        describe('with fixed charges', () => {
            it('should return correct revenue for tax in first threshold', () => {
                const result = calculateNetRevenuFromTaxValue(100, 'fixed', 1000);
                expect(result.yearly).toBe("13406.09");
            });
        });
    });

    describe('calculateNetRevenuFromTaxPercentage', () => {
        describe('with fixed charges', () => {
            it('should return correct revenue for 7.22% tax', () => {
                const { threshold } = findThresholdForTaxPercentage(7.22);
                const result = calculateNetRevenuFromTaxPercentage(7.22, 'fixed', 0, { threshold });
                expect(parseFloat(result.yearly)).toBeCloseTo(parseFloat("30000"), -1);
            });
            it('should return correct revenue for 2% tax', () => {
                const { threshold } = findThresholdForTaxPercentage(2);
                const result = calculateNetRevenuFromTaxPercentage(2, 'fixed', 1000, { threshold });
                expect(parseFloat(result.yearly)).toBeCloseTo(parseFloat("15053.11"));
            });
        });
        describe('with abattement', () => {
            it('should return correct revenue for 2% tax', () => {
                const { threshold } = findThresholdForTaxPercentage(2);
                const result = calculateNetRevenuFromTaxPercentage(2, 'abattement', 0, { threshold });
                expect(parseFloat(result.yearly)).toBeCloseTo(parseFloat("15614.57"));
            });
        });

    });

    describe('Round-trip verification', () => {
        const testCases = [
            { netIncome: 25000, chargesType: 'abattement', fixedCharges: 0 },
            { netIncome: 50000, chargesType: 'abattement', fixedCharges: 0 },
            { netIncome: 100000, chargesType: 'abattement', fixedCharges: 0 },
            { netIncome: 25000, chargesType: 'fixed', fixedCharges: 2000 },
        ];

        testCases.forEach(({ netIncome, chargesType, fixedCharges }) => {
            it(`should verify round-trip for net income ${netIncome} with ${chargesType} charges (fixed charges at ${fixedCharges} €)`, () => {
                // Calculate tax from netIncome
                const taxablenetIncome = chargesType === 'abattement' ? netIncome * 0.9 : netIncome - fixedCharges; // TODO: use this shortcut everywhere possible
                const { tax } = calculateTaxWithBreakdown(taxablenetIncome);

                // Calculate netIncome back from tax
                const calculatedNetIncome = calculateNetRevenuFromTaxValue(tax, chargesType, fixedCharges);

                // Calculate tax percentage
                const taxPercentage = (tax / taxablenetIncome) * 100;

                // Find threshold for tax percentage
                const { threshold } = findThresholdForTaxPercentage(taxPercentage);

                // Calculate income from tax percentage
                const calculateNetRevenuFromPercentage = calculateNetRevenuFromTaxPercentage(
                    taxPercentage, chargesType, fixedCharges, { threshold }
                );

                // Verify results are close
                expect(parseFloat(calculatedNetIncome.yearly)).toBeCloseTo(netIncome, -1);
                expect(parseFloat(calculateNetRevenuFromPercentage.yearly)).toBeCloseTo(netIncome, -1);
            });
        });
    });

    describe('formatNumber', () => {
        it('should format integers correctly', () => {
            expect(formatNumber(1000)).toBe(1000);
        });

        it('should format decimals correctly', () => {
            expect(formatNumber(1000.456)).toBe("1000.46");
            expect(formatNumber(1000.4)).toBe("1000.40");
        });
    });

    describe('THRESHOLD_DATA verification', () => {
        it('should have correct pre-calculated data', () => {
            expect(THRESHOLD_DATA.length).toBe(TAX_THRESHOLDS.length);
            expect(THRESHOLD_DATA[1].minTaxPercentage).toBeCloseTo(0);
            expect(THRESHOLD_DATA[2].minTaxPercentage).toBeCloseTo(6.69);
            expect(THRESHOLD_DATA[2].maxTaxPercentage).toBeCloseTo(21.85);
        });
    });
});
