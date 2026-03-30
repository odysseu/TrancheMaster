// script.js - Main application file with DOM interactions
import {
  calculateAndFormatRevenuToImpot
} from './revenuCalculator.js';
import {
  calculateImpotToRevenu,
  calculateAndFormatImpotToRevenu
} from './impotCalculator.js';

// DOM elements
let revenuInput, fixedChargesInput,
  taxPercentageInput, taxAmountInput, fixedChargesReverseInput, // taxTypeSelect,
  taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement,
  calculatedRevenuElement, abattementBtn, fixedChargesBtn, taxPercentageBtn, taxAmountBtn,
  abattementReverseBtn, fixedChargesReverseBtn, yearlyOptionBtn, monthlyOptionBtn, yearlyOptionReverseBtn, monthlyOptionReverseBtn,
  yearSelect;

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  // Wait for translations to load
  if (window.translationSystem) {
    await window.translationSystem.loadTranslations(window.translationSystem.currentLanguage);
  }

  // Dark/light mode toggle
  const darkModeToggle = document.getElementById("dark-mode-toggle");
  if (localStorage.getItem("dark-mode") === "enabled") {
    document.body.classList.add("dark-mode");
    darkModeToggle.checked = true;
  }
  darkModeToggle.addEventListener("change", () => {
    if (darkModeToggle.checked) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("dark-mode", "enabled");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("dark-mode", "disabled");
    }
  });

  // Get DOM elements
  revenuInput = document.getElementById("revenu");
  fixedChargesInput = document.getElementById("fixed-charges");
  taxPercentageInput = document.getElementById("tax-percentage-input");
  taxAmountInput = document.getElementById("tax-amount");
  // taxTypeSelect = document.getElementById("tax-type");
  fixedChargesReverseInput = document.getElementById("fixed-charges-reverse");
  yearSelect = document.getElementById("year-select");

  // Get result elements
  taxPercentageElement = document.getElementById("tax-percentage");
  thresholdBreakdownElement = document.getElementById("threshold-breakdown");
  totalTaxElement = document.getElementById("total-tax");
  missingMoneyElement = document.getElementById("missing-money");
  calculatedRevenuElement = document.getElementById("calculated-revenu");

  // Get menu buttons
  abattementBtn = document.getElementById("abattement-btn");
  fixedChargesBtn = document.getElementById("fixed-charges-btn");
  taxPercentageBtn = document.getElementById("tax-percentage-btn");
  taxAmountBtn = document.getElementById("tax-amount-btn");
  abattementReverseBtn = document.getElementById("abattement-reverse-btn");
  fixedChargesReverseBtn = document.getElementById("fixed-charges-reverse-btn");
  yearlyOptionBtn = document.getElementById("yearly-option-btn");
  monthlyOptionBtn = document.getElementById("monthly-option-btn");
  yearlyOptionReverseBtn = document.getElementById("yearly-option-reversed-btn");
  monthlyOptionReverseBtn = document.getElementById("monthly-option-reversed-btn");

  // Get section elements
  const revenuToImpotBtn = document.getElementById("revenu-to-impot-btn");
  const impotToRevenuBtn = document.getElementById("impot-to-revenu-btn");
  const revenuToImpotSection = document.getElementById("revenu-to-impot-section");
  const impotToRevenuSection = document.getElementById("impot-to-revenu-section");

  // Get group elements
  const fixedChargesGroup = document.getElementById("fixed-charges-group");
  const taxPercentageGroup = document.getElementById("tax-percentage-group");
  const taxAmountGroup = document.getElementById("tax-amount-group");
  const taxTypeGroup = document.getElementById("tax-type-group");
  const fixedChargesGroupReverse = document.getElementById("fixed-charges-group-reverse");

  // Initialize visibility on page load
  taxTypeGroup.classList.add("hidden");

  // Main mode menu toggle
  revenuToImpotBtn.addEventListener("click", () => {
    revenuToImpotSection.classList.add("active");
    impotToRevenuSection.classList.remove("active");
    revenuToImpotBtn.classList.add("active");
    impotToRevenuBtn.classList.remove("active");
    const isYearly = yearlyOptionBtn.classList.contains("active");
    const useAbattement = abattementBtn.classList.contains("active");
    calculateAndFormatRevenuToImpot(
      revenuInput.value, fixedChargesInput.value, isYearly, useAbattement, yearSelect.value,
      taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement
    );
  });

  impotToRevenuBtn.addEventListener("click", () => {
    impotToRevenuSection.classList.add("active");
    revenuToImpotSection.classList.remove("active");
    impotToRevenuBtn.classList.add("active");
    revenuToImpotBtn.classList.remove("active");
    calculateImpotToRevenu();
  });

  // Revenu → Impôt: 10% or charges menu
  abattementBtn.addEventListener("click", () => {
    fixedChargesGroup.style.display = "none";
    abattementBtn.classList.add("active");
    fixedChargesBtn.classList.remove("active");
    const isYearly = yearlyOptionBtn.classList.contains("active");
    const useAbattement = true;
    calculateAndFormatRevenuToImpot(
      revenuInput.value, fixedChargesInput.value, isYearly, useAbattement, yearSelect.value,
      taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement
    );
  });

  fixedChargesBtn.addEventListener("click", () => {
    fixedChargesGroup.style.display = "block";
    fixedChargesBtn.classList.add("active");
    abattementBtn.classList.remove("active");
    const isYearly = yearlyOptionBtn.classList.contains("active");
    const useAbattement = false;
    calculateAndFormatRevenuToImpot(
      revenuInput.value, fixedChargesInput.value, isYearly, useAbattement, yearSelect.value,
      taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement
    );
  });

  // Impôt → Revenu: Yearly or monthly menu
  yearlyOptionBtn.addEventListener("click", () => {
    yearlyOptionBtn.classList.add("active");
    monthlyOptionBtn.classList.remove("active");
    const isYearly = true;
    const useAbattement = abattementBtn.classList.contains("active");
    calculateAndFormatRevenuToImpot(
      revenuInput.value, fixedChargesInput.value, isYearly, useAbattement, yearSelect.value,
      taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement
    );
  });

  monthlyOptionBtn.addEventListener("click", () => {
    monthlyOptionBtn.classList.add("active");
    yearlyOptionBtn.classList.remove("active");
    const isYearly = false;
    const useAbattement = abattementBtn.classList.contains("active");
    calculateAndFormatRevenuToImpot(
      revenuInput.value, fixedChargesInput.value, isYearly, useAbattement, yearSelect.value,
      taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement
    );
  });

  yearlyOptionReverseBtn.addEventListener("click", () => {
    yearlyOptionReverseBtn.classList.add("active");
    monthlyOptionReverseBtn.classList.remove("active");
    const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
    const useAbattement = abattementReverseBtn.classList.contains("active");
    const isYearly = true;
    calculateAndFormatImpotToRevenu(
      taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
      isTaxPercentageMode, useAbattement, isYearly, yearSelect.value, calculatedRevenuElement
    );
  });

  monthlyOptionReverseBtn.addEventListener("click", () => {
    monthlyOptionReverseBtn.classList.add("active");
    yearlyOptionReverseBtn.classList.remove("active");
    const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
    const useAbattement = abattementReverseBtn.classList.contains("active");
    const isYearly = false;
    calculateAndFormatImpotToRevenu(
      taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
      isTaxPercentageMode, useAbattement, isYearly, yearSelect.value, calculatedRevenuElement
    );
  });

  // Impôt → Revenu: Percentage or value menu
  taxPercentageBtn.addEventListener("click", () => {
    taxPercentageGroup.style.display = "block";
    taxAmountGroup.style.display = "none";
    taxTypeGroup.classList.add("hidden");
    taxPercentageBtn.classList.add("active");
    taxAmountBtn.classList.remove("active");
    const isTaxPercentageMode = true;
    const useAbattement = abattementReverseBtn.classList.contains("active");
    const isYearly = yearlyOptionReverseBtn.classList.contains("active");
    calculateAndFormatImpotToRevenu(
      taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
      isTaxPercentageMode, useAbattement, isYearly, yearSelect.value, calculatedRevenuElement
    );
  });

  taxAmountBtn.addEventListener("click", () => {
    taxAmountGroup.style.display = "block";
    taxPercentageGroup.style.display = "none";
    taxTypeGroup.classList.remove("hidden");
    taxAmountBtn.classList.add("active");
    taxPercentageBtn.classList.remove("active");
    const isTaxPercentageMode = false;
    const useAbattement = abattementReverseBtn.classList.contains("active");
    const isYearly = yearlyOptionReverseBtn.classList.contains("active");
    calculateAndFormatImpotToRevenu(
      taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
      isTaxPercentageMode, useAbattement, isYearly, yearSelect.value, calculatedRevenuElement
    );
  });

  // Impôt → Revenu: 10% or charges menu
  abattementReverseBtn.addEventListener("click", () => {
    fixedChargesGroupReverse.style.display = "none";
    abattementReverseBtn.classList.add("active");
    fixedChargesReverseBtn.classList.remove("active");
    const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
    const useAbattement = true;
    const isYearly = yearlyOptionReverseBtn.classList.contains("active");
    calculateAndFormatImpotToRevenu(
      taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
      isTaxPercentageMode, useAbattement, isYearly, yearSelect.value, calculatedRevenuElement
    );
  });

  fixedChargesReverseBtn.addEventListener("click", () => {
    fixedChargesGroupReverse.style.display = "block";
    fixedChargesReverseBtn.classList.add("active");
    abattementReverseBtn.classList.remove("active");
    const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
    const useAbattement = false;
    const isYearly = yearlyOptionReverseBtn.classList.contains("active");
    calculateAndFormatImpotToRevenu(
      taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
      isTaxPercentageMode, useAbattement, isYearly, yearSelect.value, calculatedRevenuElement
    );
  });

  // Add event listeners for input changes
  revenuInput.addEventListener("input", () => {
    const isYearly = yearlyOptionBtn.classList.contains("active");
    const useAbattement = abattementBtn.classList.contains("active");
    calculateAndFormatRevenuToImpot(
      revenuInput.value, fixedChargesInput.value, isYearly, useAbattement, yearSelect.value,
      taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement
    );
  });
  
  fixedChargesInput.addEventListener("input", () => {
    const isYearly = yearlyOptionBtn.classList.contains("active");
    const useAbattement = abattementBtn.classList.contains("active");
    calculateAndFormatRevenuToImpot(
      revenuInput.value, fixedChargesInput.value, isYearly, useAbattement, yearSelect.value,
      taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement
    );
  });
  
  taxPercentageInput.addEventListener("input", () => {
    const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
    const useAbattement = abattementReverseBtn.classList.contains("active");
    const isYearly = yearlyOptionReverseBtn.classList.contains("active");
    calculateAndFormatImpotToRevenu(
      taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
      isTaxPercentageMode, useAbattement, isYearly, yearSelect.value, calculatedRevenuElement
    );
  });
  
  taxAmountInput.addEventListener("input", () => {
    const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
    const useAbattement = abattementReverseBtn.classList.contains("active");
    const isYearly = yearlyOptionReverseBtn.classList.contains("active");
    calculateAndFormatImpotToRevenu(
      taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
      isTaxPercentageMode, useAbattement, isYearly, yearSelect.value, calculatedRevenuElement
    );
  });
  
  fixedChargesReverseInput.addEventListener("input", () => {
    const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
    const useAbattement = abattementReverseBtn.classList.contains("active");
    const isYearly = yearlyOptionReverseBtn.classList.contains("active");
    calculateAndFormatImpotToRevenu(
      taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
      isTaxPercentageMode, useAbattement, isYearly, yearSelect.value, calculatedRevenuElement
    );
  });
  
  yearSelect.addEventListener("change", () => {
    const isYearly = yearlyOptionBtn.classList.contains("active");
    const useAbattement = abattementBtn.classList.contains("active");
    calculateAndFormatRevenuToImpot(
      revenuInput.value, fixedChargesInput.value, isYearly, useAbattement, yearSelect.value,
      taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement
    );
    
    const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
    const useAbattementReverse = abattementReverseBtn.classList.contains("active");
    const isYearlyReverse = yearlyOptionReverseBtn.classList.contains("active");
    calculateAndFormatImpotToRevenu(
      taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
      isTaxPercentageMode, useAbattementReverse, isYearlyReverse, yearSelect.value, calculatedRevenuElement
    );
  });

  // Register functions with translation system
  if (window.translationSystem) {
    window.translationSystem.registerCalculationFunctions(
      () => {
        const isYearly = yearlyOptionBtn.classList.contains("active");
        const useAbattement = abattementBtn.classList.contains("active");
        calculateAndFormatRevenuToImpot(
          revenuInput.value, fixedChargesInput.value, isYearly, useAbattement, yearSelect.value,
          taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement
        );
      },
      () => {
        const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
        const useAbattement = abattementReverseBtn.classList.contains("active");
        const isYearly = yearlyOptionReverseBtn.classList.contains("active");
        calculateAndFormatImpotToRevenu(
          taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
          isTaxPercentageMode, useAbattement, isYearly, yearSelect.value, calculatedRevenuElement
        );
      }
    );
  }
});
