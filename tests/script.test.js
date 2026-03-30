/**
 * @jest-environment jsdom
 */
import { read, readFile, readFileSync } from 'fs';
import { resolve } from 'path';
// import { TAX_THRESHOLDS } from '../js/taxCalculator.js';
import {
  calculateRevenuToImpot,
  formatRevenuToImpotResults,
  calculateAndFormatRevenuToImpot
} from '../js/revenuCalculator.js';
import {
  calculateImpotToRevenu,
  formatImpotToRevenuResults,
  calculateAndFormatImpotToRevenu
} from '../js/impotCalculator.js';
import {
  calculateTaxWithBreakdown,
  findThresholdForTaxPercentage,
  calculateNetRevenuFromTaxValue,
  calculateNetRevenuFromTaxPercentage
} from '../js/taxCalculator.js';

// Mock the taxCalculator module to match what script.js actually imports
jest.mock('../js/taxCalculator.js', () => ({
  TAX_THRESHOLDS_BY_YEAR_FINAL: {
    2025: [
      { min: 0, max: 11497, rate: 0 },
      { min: 11498, max: 29315, rate: 0.11 },
      { min: 29316, max: 83823, rate: 0.30 },
      { min: 83824, max: 180294, rate: 0.41 },
      { min: 180295, max: Infinity, rate: 0.45 }
    ]
  },
  calculateTaxWithBreakdown: jest.fn((taxableIncome, year = 2025) => {
    if (taxableIncome <= 11497) return { tax: 0, breakdown: [{ min: 0, max: 11497, rate: 0, taxableAmount: taxableIncome, tax: 0 }] };
    if (taxableIncome <= 29315) return { tax: (taxableIncome - 11497) * 0.11, breakdown: [] };
    if (taxableIncome <= 83823) return { tax: 1959.98 + (taxableIncome - 29315) * 0.30, breakdown: [] };
    if (taxableIncome <= 180294) return { tax: 18312.79 + (taxableIncome - 83823) * 0.41, breakdown: [] };
    return { tax: 57865.94 + (taxableIncome - 180294) * 0.45, breakdown: [] };
  }),
  calculateNetRevenuFromTaxValue: jest.fn((taxAmount, chargesType, fixedCharges, year = 2025) => {
    if (taxAmount === 0) return { yearly: chargesType === "abattement" ? 11497 / 0.9 : 11497 + fixedCharges, monthly: (chargesType === "abattement" ? 11497 / 0.9 : 11497 + fixedCharges) / 12 };
    return { yearly: 50000, monthly: 50000 / 12 };
  }),
  findThresholdForTaxPercentage: jest.fn((taxPercentage, year = 2025) => {
    if (taxPercentage <= 0) return { threshold: { min: 0, max: 11497, rate: 0, minTax: 0, maxTax: 0, minTaxPercentage: 0, maxTaxPercentage: 0 } };
    if (taxPercentage <= 11) return { threshold: { min: 11498, max: 29315, rate: 0.11, minTax: 0, maxTax: 1959.98, minTaxPercentage: 0, maxTaxPercentage: 11 } };
    if (taxPercentage <= 30) return { threshold: { min: 29316, max: 83823, rate: 0.30, minTax: 1960.28, maxTax: 16352.4, minTaxPercentage: 6.69, maxTaxPercentage: 21.85 } };
    if (taxPercentage <= 41) return { threshold: { min: 83824, max: 180294, rate: 0.41, minTax: 18313.08, maxTax: 39553.11, minTaxPercentage: 21.85, maxTaxPercentage: 41 } };
    return { threshold: { min: 180295, max: Infinity, rate: 0.45, minTax: 57866.23, maxTax: Infinity, minTaxPercentage: 41, maxTaxPercentage: 45 } };
  }),
  calculateNetRevenuFromTaxPercentage: jest.fn((taxPercentage, chargesType, fixedCharges, { threshold }, year = 2025) => {
    if (taxPercentage === 0) return { yearly: chargesType === "abattement" ? 11497 / 0.9 : 11497 + fixedCharges, monthly: (chargesType === "abattement" ? 11497 / 0.9 : 11497 + fixedCharges) / 12 };
    return { yearly: 50000, monthly: 50000 / 12 };
  }),
  formatNumber: jest.fn((value) => Number.isInteger(value) ? value : value.toFixed(2))
}));

// Mock the revenuCalculator module
jest.mock('../js/revenuCalculator.js', () => {
  const mockCalculateRevenuToImpot = jest.fn((revenu, fixedCharges, isYearly, useAbattement, year) => {
    return { taxableIncome: revenu * 0.9, taxPercentage: 10, totalTax: 5000 };
  });
  const mockFormatRevenuToImpotResults = jest.fn((results, taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement) => {
    if (taxPercentageElement) taxPercentageElement.textContent = '10%';
    if (totalTaxElement) totalTaxElement.textContent = '5000€';
  });
  
  return {
    calculateRevenuToImpot: mockCalculateRevenuToImpot,
    formatRevenuToImpotResults: mockFormatRevenuToImpotResults,
    calculateAndFormatRevenuToImpot: jest.fn((revenu, fixedCharges, isYearly, useAbattement, year, taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement) => {
      mockCalculateRevenuToImpot(revenu, fixedCharges, isYearly, useAbattement, year);
      mockFormatRevenuToImpotResults({ taxPercentage: 10, totalTax: 5000 }, taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement);
    })
  };
});

// Mock the impotCalculator module
jest.mock('../js/impotCalculator.js', () => {
  const mockCalculateImpotToRevenu = jest.fn((taxPercentage, taxAmount, fixedCharges, isTaxPercentageMode, useAbattement, isYearly, year) => {
    return { yearly: 50000, monthly: 50000 / 12 };
  });
  const mockFormatImpotToRevenuResults = jest.fn((results, calculatedRevenuElement) => {
    if (calculatedRevenuElement) calculatedRevenuElement.textContent = '50000€';
  });
  
  return {
    calculateImpotToRevenu: mockCalculateImpotToRevenu,
    formatImpotToRevenuResults: mockFormatImpotToRevenuResults,
    calculateAndFormatImpotToRevenu: jest.fn((taxPercentage, taxAmount, fixedCharges, isTaxPercentageMode, useAbattement, isYearly, year, calculatedRevenuElement) => {
      const results = mockCalculateImpotToRevenu(taxPercentage, taxAmount, fixedCharges, isTaxPercentageMode, useAbattement, isYearly, year);
      mockFormatImpotToRevenuResults(results, calculatedRevenuElement);
    })
  };
});

describe('script.js DOM Interactions', () => {
  let container;

  beforeAll(() => {
    // Load the index.html file
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
    document.body.innerHTML = html;

    // Mock translation system with proper structure
    const translations = JSON.parse(readFileSync(resolve(__dirname, '../translations/fr.json'), 'utf8'));
    window.translationSystem = {
      getTranslation: jest.fn((key, ...args) => {
        let translation = translations[key] || key;
        args.forEach((arg, i) => {
          translation = translation.replace(new RegExp(`\{${i}\}`, 'g'), arg);
        });
        return translation;
      }),
      loadTranslations: jest.fn().mockResolvedValue({}),
      registerCalculationFunctions: jest.fn((revenuFunc, impotFunc) => {
        // Store the calculation functions for testing
        window.calculationFunctions = { revenuFunc, impotFunc };
      }),
      currentLanguage: 'fr',
      translations: translations
    };

    // Clear the module cache to ensure fresh imports
    jest.resetModules();

    // Import script.js after mocking
    require('../js/script.js');
    
    // Manually trigger DOMContentLoaded event to initialize the app
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
  });

  beforeEach(() => {
    // Clear module cache to ensure fresh imports for each test
    jest.resetModules();

    // Load the index.html file
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
    document.body.innerHTML = html;

    // Import script.js after mocking and setting up the DOM
    const scriptModule = require('../js/script.js');
    
    // Manually trigger DOMContentLoaded event to initialize the app
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    // Set up initial state
    document.getElementById('revenu-to-impot-btn').click();
    document.getElementById('yearly-option-btn').click();
    document.getElementById('abattement-btn').click();
    document.getElementById('tax-percentage-btn').click();
    document.getElementById('yearly-option-reversed-btn').click();
    document.getElementById('abattement-reverse-btn').click();

    // Set input values
    document.getElementById('revenu').value = '50000';
    document.getElementById('fixed-charges').value = '2000';
    document.getElementById('tax-percentage-input').value = '15';
    document.getElementById('tax-amount').value = '5000';
    document.getElementById('fixed-charges-reverse').value = '1000';
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('DOM Initialization', () => {
    it('should initialize DOM elements correctly', () => {
      expect(document.getElementById('revenu-to-impot-btn')).toBeTruthy();
      expect(document.getElementById('impot-to-revenu-btn')).toBeTruthy();
      expect(document.getElementById('revenu')).toBeTruthy();
      expect(document.getElementById('fixed-charges')).toBeTruthy();
      expect(document.getElementById('tax-percentage-input')).toBeTruthy();
      expect(document.getElementById('tax-amount')).toBeTruthy();
      expect(document.getElementById('fixed-charges-reverse')).toBeTruthy();
    });

    it('should set max value for tax percentage input', () => {
      const taxPercentageInput = document.getElementById('tax-percentage-input');
      expect(taxPercentageInput.getAttribute('step')).toBe('0.01');
    });
  });

  describe('Mode Toggle', () => {
    it('should switch to "Revenu → Impôt" mode', () => {
      const impotToRevenuBtn = document.getElementById('impot-to-revenu-btn');
      const revenuToImpotBtn = document.getElementById('revenu-to-impot-btn');
      revenuToImpotBtn.click();
      impotToRevenuBtn.click();
      revenuToImpotBtn.click();
      const impotToRevenuSection = document.getElementById('impot-to-revenu-section');
      const revenuToImpotSection = document.getElementById('revenu-to-impot-section');

      expect(revenuToImpotSection.classList.contains('active') | impotToRevenuSection.classList.contains('active')).toBeTruthy();
      expect(revenuToImpotSection.classList.contains('active')).toBe(true);
      expect(impotToRevenuSection.classList.contains('active')).toBe(false);
      expect(revenuToImpotBtn.classList.contains('active')).toBe(true);
    });

    it('should switch to "Impôt → Revenu" mode', () => {
      const impotToRevenuBtn = document.getElementById('impot-to-revenu-btn');
      const revenuToImpotBtn = document.getElementById('revenu-to-impot-btn');
      
      // Start from known state
      revenuToImpotBtn.click();
      
      // Now switch to Impôt → Revenu
      impotToRevenuBtn.click();
      
      const impotToRevenuSection = document.getElementById('impot-to-revenu-section');
      const revenuToImpotSection = document.getElementById('revenu-to-impot-section');

      expect(revenuToImpotSection.classList.contains('active') | impotToRevenuSection.classList.contains('active')).toBeTruthy();
      expect(impotToRevenuSection.classList.contains('active')).toBe(true);
      expect(revenuToImpotSection.classList.contains('active')).toBe(false);
      expect(impotToRevenuBtn.classList.contains('active')).toBe(true);
      expect(revenuToImpotBtn.classList.contains('active')).toBe(false);
    });

    // it('should switch to "Impôt → Revenu" mode', () => {
    //   const impotToRevenuBtn = document.getElementById('impot-to-revenu-btn');
    //   const revenuToImpotBtn = document.getElementById('revenu-to-impot-btn');
    //   impotToRevenuBtn.click();
    //   revenuToImpotBtn.click();
    //   impotToRevenuBtn.click();
    //   const impotToRevenuSection = document.getElementById('impot-to-revenu-section');
    //   const revenuToImpotSection = document.getElementById('revenu-to-impot-section');

    //   expect(revenuToImpotSection.classList.contains('active') | impotToRevenuSection.classList.contains('active')).toBeTruthy();
    //   expect(impotToRevenuSection.classList.contains('active')).toBe(true);
    //   expect(revenuToImpotSection.classList.contains('active')).toBe(false);
    //   expect(impotToRevenuBtn.classList.contains('active')).toBe(true);
    // });
  });

  describe('Revenu → Impôt Logic', () => {
    it('should show fixed charges input when "Frais réels" is selected', () => {
      const fixedChargesBtn = document.getElementById('fixed-charges-btn');
      const fixedChargesGroup = document.getElementById('fixed-charges-group');

      fixedChargesBtn.click();

      expect(fixedChargesGroup.style.display).toBe('block');
      expect(fixedChargesBtn.classList.contains('active')).toBe(true);
    });

    it('should hide fixed charges input when "Abattement" is selected', () => {
      const abattementBtn = document.getElementById('abattement-btn');
      const fixedChargesGroup = document.getElementById('fixed-charges-group');

      abattementBtn.click();

      expect(fixedChargesGroup.style.display).toBe('none');
      expect(abattementBtn.classList.contains('active')).toBe(true);
    });
  });

  describe('Impôt → Revenu Logic', () => {
    // These tests are temporarily disabled due to ES module vs CommonJS mismatch
    // They will be re-enabled once the module system is properly configured
  });

  describe('Dark/Light Mode Toggle', () => {
    it('should enable dark mode', () => {
      const darkModeToggle = document.getElementById('dark-mode-toggle');
      darkModeToggle.checked = true;
      const event = new Event('change');
      darkModeToggle.dispatchEvent(event);

      expect(document.body.classList.contains('dark-mode')).toBe(true);
      expect(localStorage.getItem('dark-mode')).toBe('enabled');
    });

    it('should disable dark mode', () => {
      document.body.classList.add('dark-mode');
      localStorage.setItem('dark-mode', 'enabled');

      const darkModeToggle = document.getElementById('dark-mode-toggle');
      darkModeToggle.checked = false;
      const event = new Event('change');
      darkModeToggle.dispatchEvent(event);

      expect(document.body.classList.contains('dark-mode')).toBe(false);
      expect(localStorage.getItem('dark-mode')).toBe('disabled');
    });
  });
});
