// main.js - Main application file with DOM interactions
import {
  calculateAndFormatRevenuToImpot
} from './revenuCalculator.js';
import {
  calculateAndFormatImpotToRevenu
} from './impotCalculator.js';

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
  const revenuInput = document.getElementById("revenu");
  const fixedChargesInput = document.getElementById("fixed-charges");
  const taxPercentageInput = document.getElementById("tax-percentage-input");
  const taxAmountInput = document.getElementById("tax-amount");
  const fixedChargesReverseInput = document.getElementById("fixed-charges-reverse");
  const yearSelect = document.getElementById("year-select");

  // Get result elements
  const taxPercentageElement = document.getElementById("tax-percentage");
  const thresholdBreakdownElement = document.getElementById("threshold-breakdown");
  const totalTaxElement = document.getElementById("total-tax");
  const missingMoneyElement = document.getElementById("missing-money");
  const calculatedRevenuElement = document.getElementById("calculated-revenu");

  // Get menu buttons
  const abattementBtn = document.getElementById("abattement-btn");
  const fixedChargesBtn = document.getElementById("fixed-charges-btn");
  const taxPercentageBtn = document.getElementById("tax-percentage-btn");
  const taxAmountBtn = document.getElementById("tax-amount-btn");
  const abattementReverseBtn = document.getElementById("abattement-reverse-btn");
  const fixedChargesReverseBtn = document.getElementById("fixed-charges-reverse-btn");
  const yearlyOptionBtn = document.getElementById("yearly-option-btn");
  const monthlyOptionBtn = document.getElementById("monthly-option-btn");
  const yearlyOptionReverseBtn = document.getElementById("yearly-option-reversed-btn");
  const monthlyOptionReverseBtn = document.getElementById("monthly-option-reversed-btn");

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

  // Single recalculation helpers: read current UI state, then calculate + format
  const recalculateRevenuToImpot = () => {
    calculateAndFormatRevenuToImpot(
      revenuInput.value, fixedChargesInput.value,
      yearlyOptionBtn.classList.contains("active"),
      abattementBtn.classList.contains("active"),
      yearSelect.value,
      taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement
    );
  };

  const recalculateImpotToRevenu = () => {
    calculateAndFormatImpotToRevenu(
      taxPercentageInput.value, taxAmountInput.value, fixedChargesReverseInput.value,
      taxPercentageBtn.classList.contains("active"),
      abattementReverseBtn.classList.contains("active"),
      yearlyOptionReverseBtn.classList.contains("active"),
      yearSelect.value, calculatedRevenuElement
    );
  };

  // Helper to activate exactly one button within a menu group
  const activateButton = (buttons, activeBtn) => {
    buttons.forEach(btn => btn.classList.toggle("active", btn === activeBtn));
  };

  // Main mode menu toggle
  revenuToImpotBtn.addEventListener("click", () => {
    revenuToImpotSection.classList.add("active");
    impotToRevenuSection.classList.remove("active");
    activateButton([revenuToImpotBtn, impotToRevenuBtn], revenuToImpotBtn);
    recalculateRevenuToImpot();
  });

  impotToRevenuBtn.addEventListener("click", () => {
    impotToRevenuSection.classList.add("active");
    revenuToImpotSection.classList.remove("active");
    activateButton([revenuToImpotBtn, impotToRevenuBtn], impotToRevenuBtn);
    recalculateImpotToRevenu();
  });

  // Revenu → Impôt: 10% or charges menu
  abattementBtn.addEventListener("click", () => {
    fixedChargesGroup.style.display = "none";
    activateButton([abattementBtn, fixedChargesBtn], abattementBtn);
    recalculateRevenuToImpot();
  });

  fixedChargesBtn.addEventListener("click", () => {
    fixedChargesGroup.style.display = "block";
    activateButton([abattementBtn, fixedChargesBtn], fixedChargesBtn);
    recalculateRevenuToImpot();
  });

  // Revenu → Impôt: Yearly or monthly menu
  yearlyOptionBtn.addEventListener("click", () => {
    activateButton([yearlyOptionBtn, monthlyOptionBtn], yearlyOptionBtn);
    recalculateRevenuToImpot();
  });

  monthlyOptionBtn.addEventListener("click", () => {
    activateButton([yearlyOptionBtn, monthlyOptionBtn], monthlyOptionBtn);
    recalculateRevenuToImpot();
  });

  // Impôt → Revenu: Yearly or monthly menu
  yearlyOptionReverseBtn.addEventListener("click", () => {
    activateButton([yearlyOptionReverseBtn, monthlyOptionReverseBtn], yearlyOptionReverseBtn);
    recalculateImpotToRevenu();
  });

  monthlyOptionReverseBtn.addEventListener("click", () => {
    activateButton([yearlyOptionReverseBtn, monthlyOptionReverseBtn], monthlyOptionReverseBtn);
    recalculateImpotToRevenu();
  });

  // Impôt → Revenu: Percentage or value menu
  taxPercentageBtn.addEventListener("click", () => {
    taxPercentageGroup.style.display = "block";
    taxAmountGroup.style.display = "none";
    taxTypeGroup.classList.add("hidden");
    activateButton([taxPercentageBtn, taxAmountBtn], taxPercentageBtn);
    recalculateImpotToRevenu();
  });

  taxAmountBtn.addEventListener("click", () => {
    taxAmountGroup.style.display = "block";
    taxPercentageGroup.style.display = "none";
    taxTypeGroup.classList.remove("hidden");
    activateButton([taxPercentageBtn, taxAmountBtn], taxAmountBtn);
    recalculateImpotToRevenu();
  });

  // Impôt → Revenu: 10% or charges menu
  abattementReverseBtn.addEventListener("click", () => {
    fixedChargesGroupReverse.style.display = "none";
    activateButton([abattementReverseBtn, fixedChargesReverseBtn], abattementReverseBtn);
    recalculateImpotToRevenu();
  });

  fixedChargesReverseBtn.addEventListener("click", () => {
    fixedChargesGroupReverse.style.display = "block";
    activateButton([abattementReverseBtn, fixedChargesReverseBtn], fixedChargesReverseBtn);
    recalculateImpotToRevenu();
  });

  // Add event listeners for input changes
  [revenuInput, fixedChargesInput].forEach(input => {
    input.addEventListener("input", recalculateRevenuToImpot);
  });

  [taxPercentageInput, taxAmountInput, fixedChargesReverseInput].forEach(input => {
    input.addEventListener("input", recalculateImpotToRevenu);
  });

  // Recalculate both sections when the tax year changes
  yearSelect.addEventListener("change", () => {
    recalculateRevenuToImpot();
    recalculateImpotToRevenu();
  });

  // Register functions with translation system
  if (window.translationSystem) {
    window.translationSystem.registerCalculationFunctions(
      recalculateRevenuToImpot,
      recalculateImpotToRevenu
    );
  }
});
