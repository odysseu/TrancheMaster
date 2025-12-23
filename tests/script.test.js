/**
 * @jest-environment jsdom
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
// import { TAX_THRESHOLDS } from '../js/taxCalculator.js';

// Mock the taxCalculator module
jest.mock('../js/taxCalculator.js', () => ({
  TAX_THRESHOLDS: [
    { min: 0, max: 11497, rate: 0 },
    { min: 11498, max: 29315, rate: 0.11 },
    { min: 29316, max: 83823, rate: 0.30 },
    { min: 83824, max: 180294, rate: 0.41 },
    { min: 180295, max: Infinity, rate: 0.45 }
  ],
  THRESHOLD_DATA: [],
  calculateTaxWithBreakdown: jest.fn((taxableIncome) => {
    if (taxableIncome <= 11497) return { tax: 0, breakdown: [{ min: 0, max: 11497, rate: 0, taxableAmount: taxableIncome, tax: 0 }] };
    if (taxableIncome <= 29315) return { tax: (taxableIncome - 11497) * 0.11, breakdown: [] };
    if (taxableIncome <= 83823) return { tax: 1959.98 + (taxableIncome - 29315) * 0.30, breakdown: [] };
    if (taxableIncome <= 180294) return { tax: 18312.79 + (taxableIncome - 83823) * 0.41, breakdown: [] };
    return { tax: 57865.94 + (taxableIncome - 180294) * 0.45, breakdown: [] };
  }),
  findThresholdForTaxPercentage: jest.fn((taxPercentage) => {
    if (taxPercentage <= 0) return { threshold: { min: 0, max: 11497, rate: 0, minTax: 0, maxTax: 0, minTaxPercentage: 0, maxTaxPercentage: 0 } };
    if (taxPercentage <= 11) return { threshold: { min: 11498, max: 29315, rate: 0.11, minTax: 0, maxTax: 1959.98, minTaxPercentage: 0, maxTaxPercentage: 11 } };
    if (taxPercentage <= 30) return { threshold: { min: 29316, max: 83823, rate: 0.30, minTax: 1960.28, maxTax: 16352.4, minTaxPercentage: 6.69, maxTaxPercentage: 21.85 } };
    if (taxPercentage <= 41) return { threshold: { min: 83824, max: 180294, rate: 0.41, minTax: 18313.08, maxTax: 39553.11, minTaxPercentage: 21.85, maxTaxPercentage: 41 } };
    return { threshold: { min: 180295, max: Infinity, rate: 0.45, minTax: 57866.23, maxTax: Infinity, minTaxPercentage: 41, maxTaxPercentage: 45 } };
  }),
  calculateNetRevenuFromTaxValue: jest.fn((taxAmount, chargesType, fixedCharges) => {
    if (taxAmount === 0) return { yearly: chargesType === "abattement" ? 11497 / 0.9 : 11497 + fixedCharges, monthly: (chargesType === "abattement" ? 11497 / 0.9 : 11497 + fixedCharges) / 12 };
    return { yearly: 50000, monthly: 50000 / 12 };
  }),
  calculateNetRevenuFromTaxPercentage: jest.fn((taxPercentage, chargesType, fixedCharges) => {
    if (taxPercentage === 0) return { yearly: chargesType === "abattement" ? 11497 / 0.9 : 11497 + fixedCharges, monthly: (chargesType === "abattement" ? 11497 / 0.9 : 11497 + fixedCharges) / 12 };
    return { yearly: 50000, monthly: 50000 / 12 };
  }),
  formatNumber: jest.fn((value) => Number.isInteger(value) ? value : value.toFixed(2))
}));

describe('script.js DOM Interactions', () => {
  let container;

  beforeAll(() => {
    // Load the index.html file
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
    document.body.innerHTML = html;

    // Mock translation system
    window.translationSystem = {
      getTranslation: jest.fn((key, ...args) => {
        const translations = {
          'tax-percentage-prefix': 'Taux d\'imposition : ',
          'total-tax-prefix': 'Impôt total : ',
          'no-tax-complete': 'Avec des revenus imposables de {0}€, vous ne payez aucun impôt. Votre revenu se trouve en dessous du seuil de la deuxième tranche (situé à {1}€).',
          'missing-money-complete': 'Il manque {0}€ par an ({1}€ par mois) pour atteindre la prochaine tranche.',
          'max-contributor-message': 'Vous êtes un grand contributeur ! Vous avez dépassé la dernière tranche d\'imposition.',
          'tax-percentage-error': 'Le pourcentage d\'imposition ne peut pas dépasser 45 %. Veuillez entrer une valeur valide.',
          'tax-percentage-with-deduction-error': 'Le pourcentage d\'imposition ne peut pas dépasser 40,50 % avec l\'abattement. Veuillez entrer une valeur valide.',
          'tax-percentage-with-fixed-charges-error': 'Le pourcentage d\'imposition ne peut pas dépasser 45 % avec les charges fixes. Veuillez entrer une valeur valide.',
          'zero-tax-message': 'Avec 0% d\'imposition, votre revenu annuel est inférieur à {0}€ ({1}€/mois).',
          'calculated-revenu-prefix': 'Revenu annuel calculé : ',
          'monthly-option': 'Mensuel'
        };
        let translation = translations[key] || key;
        args.forEach((arg, i) => translation = translation.replace(`{${i}}`, arg));
        return translation;
      }),
      loadTranslations: jest.fn().mockResolvedValue({}),
      registerCalculationFunctions: jest.fn(),
      currentLanguage: 'fr',
      translations: {}
    };

    // Import script.js after mocking
    require('../js/script.js');
  });

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <div class="container">
        <div class="menu">
          <button id="revenu-to-impot-btn" class="menu-btn active">Revenu → Impôt</button>
          <button id="impot-to-revenu-btn" class="menu-btn">Impôt → Revenu</button>
        </div>
        <div id="revenu-to-impot-section" class="section active">
          <div class="input-group">
            <label for="revenu">Revenu (€) :</label>
            <input type="number" id="revenu" value="50000">
          </div>
          <div class="input-group">
            <label for="revenu-type">Type de revenu :</label>
            <div class="menu">
              <button id="yearly-option-btn" class="menu-btn active">Annuel</button>
              <button id="monthly-option-btn" class="menu-btn">Mensuel</button>
            </div>
          </div>
          <div class="menu">
            <button id="abattement-btn" class="menu-btn active">Abattement (10%)</button>
            <button id="fixed-charges-btn" class="menu-btn">Frais réels (€)</button>
          </div>
          <div class="input-group" id="fixed-charges-group" style="display: none;">
            <input type="number" id="fixed-charges" value="2000">
          </div>
          <div class="results">
            <h2>Résultats</h2>
            <p id="tax-percentage"></p>
            <table class="threshold-table">
              <thead>
                <tr>
                  <th>Tranche</th>
                  <th>Montant imposable (€)</th>
                  <th>Taux (%)</th>
                  <th>Impôt (€)</th>
                </tr>
              </thead>
              <tbody id="threshold-breakdown"></tbody>
            </table>
            <p id="total-tax"></p>
            <p id="missing-money"></p>
          </div>
        </div>
        <div id="impot-to-revenu-section" class="section">
          <div class="menu">
            <button id="tax-percentage-btn" class="menu-btn active">Pourcentage d'imposition (%)</button>
            <button id="tax-amount-btn" class="menu-btn">Montant de l'impôt (€)</button>
          </div>
          <div class="input-group" id="tax-percentage-group">
            <input type="number" id="tax-percentage-input" value="15">
          </div>
          <div class="input-group" id="tax-amount-group" style="display: none;">
            <input type="number" id="tax-amount" value="5000">
          </div>
          <div class="input-group" id="tax-type-group" class="hidden">
            <div class="menu">
              <button id="yearly-option-reversed-btn" class="menu-btn active">Annuel</button>
              <button id="monthly-option-reversed-btn" class="menu-btn">Mensuel</button>
            </div>
          </div>
          <div class="menu">
            <button id="abattement-reverse-btn" class="menu-btn active">Abattement (10%)</button>
            <button id="fixed-charges-reverse-btn" class="menu-btn">Frais réels (€)</button>
          </div>
          <div class="input-group" id="fixed-charges-group-reverse" style="display: none;">
            <input type="number" id="fixed-charges-reverse" value="1000">
          </div>
          <div class="results">
            <h2>Résultats</h2>
            <p id="calculated-revenu"></p>
            <table class="threshold-table" id="threshold-breakdown-reverse">
              <thead>
                <tr>
                  <th>Tranche</th>
                  <th>Montant imposable (€)</th>
                  <th>Taux (%)</th>
                  <th>Impôt (€)</th>
                  <th>Impôt cumulé (€)</th>
                </tr>
              </thead>
              <tbody id="threshold-breakdown-reverse-body"></tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
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
      expect(taxPercentageInput.getAttribute('max')).toBe('40.50');
      expect(taxPercentageInput.getAttribute('step')).toBe('0.01');
    });
  });

  describe('Mode Toggle', () => {
    it('should switch to "Revenu → Impôt" mode', () => {
      const revenuToImpotBtn = document.getElementById('revenu-to-impot-btn');
      const impotToRevenuSection = document.getElementById('impot-to-revenu-section');
      const revenuToImpotSection = document.getElementById('revenu-to-impot-section');

      impotToRevenuSection.classList.add('active');
      revenuToImpotSection.classList.remove('active');
      revenuToImpotBtn.classList.remove('active');
      document.getElementById('impot-to-revenu-btn').classList.add('active');

      revenuToImpotBtn.click();

      expect(revenuToImpotSection.classList.contains('active')).toBe(true);
      expect(impotToRevenuSection.classList.contains('active')).toBe(false);
      expect(revenuToImpotBtn.classList.contains('active')).toBe(true);
    });

    it('should switch to "Impôt → Revenu" mode', () => {
      const impotToRevenuBtn = document.getElementById('impot-to-revenu-btn');
      const impotToRevenuSection = document.getElementById('impot-to-revenu-section');
      const revenuToImpotSection = document.getElementById('revenu-to-impot-section');

      impotToRevenuBtn.click();

      expect(impotToRevenuSection.classList.contains('active')).toBe(true);
      expect(revenuToImpotSection.classList.contains('active')).toBe(false);
      expect(impotToRevenuBtn.classList.contains('active')).toBe(true);
    });
  });

  describe('Revenu → Impôt Logic', () => {
    it('should calculate tax with abattement', () => {
      const calculateRevenuToImpot = require('../js/script.js').calculateRevenuToImpot;
      const revenuInput = document.getElementById('revenu');
      revenuInput.value = '50000';
      calculateRevenuToImpot();

      expect(window.translationSystem.getTranslation).toHaveBeenCalledWith('tax-percentage-prefix');
      expect(window.translationSystem.getTranslation).toHaveBeenCalledWith('total-tax-prefix');
    });

    it('should show fixed charges input when "Frais réels" is selected', () => {
      const fixedChargesBtn = document.getElementById('fixed-charges-btn');
      const fixedChargesGroup = document.getElementById('fixed-charges-group');

      fixedChargesBtn.click();

      expect(fixedChargesGroup.style.display).toBe('block');
      expect(fixedChargesBtn.classList.contains('active')).toBe(true);
    });
  });

  describe('Impôt → Revenu Logic', () => {
    it('should calculate revenue from tax percentage', () => {
      const impotToRevenuSection = document.getElementById('impot-to-revenu-section');
      const impotToRevenuBtn = document.getElementById('impot-to-revenu-btn');
      impotToRevenuBtn.click();

      const taxPercentageInput = document.getElementById('tax-percentage-input');
      taxPercentageInput.value = '15';
      const event = new Event('input');
      taxPercentageInput.dispatchEvent(event);

      expect(window.translationSystem.getTranslation).toHaveBeenCalledWith('calculated-revenu-prefix');
    });

    it('should show error for invalid tax percentage with abattement', () => {
      const impotToRevenuSection = document.getElementById('impot-to-revenu-section');
      const impotToRevenuBtn = document.getElementById('impot-to-revenu-btn');
      impotToRevenuBtn.click();

      const taxPercentageInput = document.getElementById('tax-percentage-input');
      taxPercentageInput.value = '41';
      const event = new Event('input');
      taxPercentageInput.dispatchEvent(event);

      expect(window.translationSystem.getTranslation).toHaveBeenCalledWith('tax-percentage-with-deduction-error');
    });

    it('should calculate revenue from tax amount', () => {
      const impotToRevenuSection = document.getElementById('impot-to-revenu-section');
      const impotToRevenuBtn = document.getElementById('impot-to-revenu-btn');
      impotToRevenuBtn.click();

      const taxAmountBtn = document.getElementById('tax-amount-btn');
      taxAmountBtn.click();

      const taxAmountInput = document.getElementById('tax-amount');
      taxAmountInput.value = '5000';
      const event = new Event('input');
      taxAmountInput.dispatchEvent(event);

      expect(window.translationSystem.getTranslation).toHaveBeenCalledWith('calculated-revenu-prefix');
    });
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
