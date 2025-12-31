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
        const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
        document.body.innerHTML = html;

        window.translationSystem = {
            getTranslation: (key, ...args) => {
                const translations = {
                    'tax-percentage-prefix': 'Tax rate: ',
                    'total-tax-prefix': 'Total tax: ',
                    'no-tax-complete': 'With a taxable income of {0}€, you don\'t pay any tax. You are below the first tax threshold ({1}€).',
                    'max-contributor-message': 'You are a great contributor! You have exceeded the highest tax bracket.',
                    'missing-money-complete': 'You need an additional {0}€ per year ({1}€ per month) to reach the next bracket.',
                    'tax-percentage-error': 'The tax percentage cannot exceed 40.50%. Please enter a valid value.',
                    'tax-percentage-with-deduction-error': 'The tax percentage cannot exceed 40.50% with deduction.',
                    'tax-percentage-with-fixed-charges-error': 'The tax percentage cannot exceed 45% with actual expenses.',
                    'zero-tax-message': 'With 0% tax, your annual income is less than {0}€ ({1}€/month).',
                    'calculated-revenu-prefix': 'Calculated annual income: ',
                    'monthly-option': 'Monthly'
                };
                let translation = translations[key] || key;
                args.forEach((arg, i) => {
                    translation = translation.replace(`{${i}}`, arg);
                });
                return translation;
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
                    <div class="menu">
                        <button id="yearly-option-btn" class="menu-btn">Yearly</button>
                        <button id="monthly-option-btn" class="menu-btn active">Monthly</button>
                    </div>
                </div>
                <div class="menu">
                    <button id="abattement-btn" class="menu-btn active">Deduction (10%)</button>
                    <button id="fixed-charges-btn" class="menu-btn">Actual expenses (€)</button>
                </div>
                <div class="input-group" id="fixed-charges-group" style="display: none;">
                    <input type="number" id="fixed-charges" value="2000">
                </div>
            </div>
            <div id="impot-to-revenu-section" class="section">
                <div class="menu">
                    <button id="tax-percentage-btn" class="menu-btn active">Tax percentage (%)</button>
                    <button id="tax-amount-btn" class="menu-btn">Tax amount (€)</button>
                </div>
                <div class="input-group" id="tax-percentage-group">
                    <input type="number" id="tax-percentage-input" value="15">
                </div>
                <div class="input-group" id="tax-amount-group" style="display: none;">
                    <input type="number" id="tax-amount" value="5000">
                </div>
                <div class="input-group" id="tax-type-group" class="hidden">
                    <div class="menu">
                        <button id="yearly-option-reversed-btn" class="menu-btn">Yearly</button>
                        <button id="monthly-option-reversed-btn" class="menu-btn active">Monthly</button>
                    </div>
                </div>
                <div class="menu">
                    <button id="abattement-reverse-btn" class="menu-btn active">Deduction (10%)</button>
                    <button id="fixed-charges-reverse-btn" class="menu-btn">Actual expenses (€)</button>
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
                <table class="threshold-table" id="threshold-breakdown-reverse">
                    <tbody id="threshold-breakdown-reverse-body"></tbody>
                </table>
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
            expect(breakdown).toEqual([{ min: 0, max: 11497, rate: 0, tax: 0, taxableAmount: 0 }]);
        });

        it('should calculate correct tax for income in first taxable threshold', () => {
            const { tax, breakdown } = calculateTaxWithBreakdown(15000);
            expect(tax).toBe("385.33");
            expect(breakdown[1].taxableAmount).toBe(3503);
            expect(breakdown[1].tax).toBe(385.33);
        });

        it('should calculate correct tax for income in second threshold', () => {
            const { tax, breakdown } = calculateTaxWithBreakdown(50000);
            expect(tax).toBe("8165.48");
            expect(breakdown[2].taxableAmount).toBe(20685);
            expect(breakdown[2].tax).toBeCloseTo(6205.5);
        });

        it('should calculate correct tax for income in highest threshold', () => {
            const { tax, breakdown } = calculateTaxWithBreakdown(200000);
            expect(tax).toBe("66733.19");
            expect(breakdown[4].taxableAmount).toBe(19706);
            expect(breakdown[4].tax).toBeCloseTo(8867.70);
        });
    });

    describe('findThresholdForTaxPercentage', () => {
        it('should find correct threshold for 0% tax', () => {
            const { threshold } = findThresholdForTaxPercentage(0);
            expect(threshold.min).toBe(0);
            expect(threshold.max).toBe(11497);
        });

        it('should find correct threshold for 15% tax', () => {
            const { threshold } = findThresholdForTaxPercentage(15);
            expect(threshold.min).toBe(29316);
            expect(threshold.max).toBe(83823);
        });

        it('should return null for invalid tax percentages', () => {
            const { threshold } = findThresholdForTaxPercentage(50);
            expect(threshold).toBeNull();
        });
    });

    describe('calculateNetRevenuFromTaxValue', () => {
        it('should return correct revenue for tax in first threshold with abattement', () => {
            const result = calculateNetRevenuFromTaxValue(100, 'abattement', 0);
            expect(parseFloat(result.yearly)).toBeCloseTo(13784.55);
        });

        it('should return correct revenue for tax in second threshold with fixed charges', () => {
            const result = calculateNetRevenuFromTaxValue(5000, 'fixed', 1000);
            expect(parseFloat(result.yearly)).toBeCloseTo(40448.40);
        });
    });

    describe('calculateNetRevenuFromTaxPercentage', () => {
        it('should return correct revenue for 7.22% tax with fixed charges', () => {
            const { threshold } = findThresholdForTaxPercentage(7.22);
            const result = calculateNetRevenuFromTaxPercentage(7.22, 'fixed', 0, { threshold });
            expect(parseFloat(result.yearly)).toBeCloseTo(30000, -1);
        });

        it('should return correct revenue for 2% tax with abattement', () => {
            const { threshold } = findThresholdForTaxPercentage(2);
            const result = calculateNetRevenuFromTaxPercentage(2, 'abattement', 0, { threshold });
            expect(parseFloat(result.yearly)).toBeCloseTo(15614.57);
        });
    });

    describe('Round-trip verification', () => {
        const testCases = [
            { netIncome: 25000, chargesType: 'abattement', fixedCharges: 0 },
            { netIncome: 100000, chargesType: 'fixed', fixedCharges: 2000 },
        ];

        testCases.forEach(({ netIncome, chargesType, fixedCharges }) => {
            it(`should verify round-trip for net income ${netIncome} with ${chargesType} charges`, () => {
                const taxableIncome = chargesType === 'abattement' ? netIncome * 0.9 : netIncome - fixedCharges;
                const { tax } = calculateTaxWithBreakdown(taxableIncome);
                const taxPercentage = (tax / taxableIncome) * 100;
                const { threshold } = findThresholdForTaxPercentage(taxPercentage);
                const calculatedNetIncome = calculateNetRevenuFromTaxPercentage(taxPercentage, chargesType, fixedCharges, { threshold });
                expect(parseFloat(calculatedNetIncome.yearly)).toBeCloseTo(netIncome, -1);
            });
        });
    });

    describe('formatNumber', () => {
        it('should format integers and decimals correctly', () => {
            expect(formatNumber(1000)).toBe(1000);
            expect(formatNumber(1000.456)).toBe("1000.46");
        });
    });

    describe('THRESHOLD_DATA verification', () => {
        it('should have correct pre-calculated data', () => {
            expect(THRESHOLD_DATA.length).toBe(TAX_THRESHOLDS.length);
            expect(THRESHOLD_DATA[1].minTaxPercentage).toBeCloseTo(0);
            expect(THRESHOLD_DATA[2].minTaxPercentage).toBeCloseTo(6.69);
        });
    });
});
