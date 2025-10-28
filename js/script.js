// script.js - Main application file with DOM interactions
import {
  TAX_THRESHOLDS,
  THRESHOLD_DATA,
  calculateTaxWithBreakdown,
  calculateRevenuFromTaxValue,
  findThresholdForTaxPercentage,
  calculateRevenuFromTaxPercentage,
  formatNumber
} from './taxCalculator.js';

// DOM elements
let revenuInput, revenuTypeSelect, fixedChargesInput,
  taxPercentageInput, taxAmountInput, taxTypeSelect, fixedChargesReverseInput,
  taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement,
  calculatedRevenuElement, abattementBtn, fixedChargesBtn, taxPercentageBtn, taxAmountBtn,
  abattementReverseBtn, fixedChargesReverseBtn;

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  // Wait for translations to load
  if (window.translationSystem) {
    await window.translationSystem.loadTranslations(window.translationSystem.currentLanguage);
    window.translationSystem.registerCalculationFunctions(calculateRevenuToImpot, calculateImpotToRevenu);
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
  revenuTypeSelect = document.getElementById("revenu-type");
  fixedChargesInput = document.getElementById("fixed-charges");
  taxPercentageInput = document.getElementById("tax-percentage-input");
  taxAmountInput = document.getElementById("tax-amount");
  taxTypeSelect = document.getElementById("tax-type");
  fixedChargesReverseInput = document.getElementById("fixed-charges-reverse");

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

  // Set max value for tax percentage input
  taxPercentageInput.setAttribute("max", "40.50");
  taxPercentageInput.setAttribute("step", "0.01");

  // Initialize visibility on page load
  taxTypeGroup.classList.add("hidden");

  // Main mode menu toggle
  revenuToImpotBtn.addEventListener("click", () => {
    revenuToImpotSection.classList.add("active");
    impotToRevenuSection.classList.remove("active");
    revenuToImpotBtn.classList.add("active");
    impotToRevenuBtn.classList.remove("active");
    calculateRevenuToImpot();
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
    calculateRevenuToImpot();
  });

  fixedChargesBtn.addEventListener("click", () => {
    fixedChargesGroup.style.display = "block";
    fixedChargesBtn.classList.add("active");
    abattementBtn.classList.remove("active");
    calculateRevenuToImpot();
  });

  // Impôt → Revenu: Percentage or value menu
  taxPercentageBtn.addEventListener("click", () => {
    taxPercentageGroup.style.display = "block";
    taxAmountGroup.style.display = "none";
    taxTypeGroup.classList.add("hidden");
    taxPercentageBtn.classList.add("active");
    taxAmountBtn.classList.remove("active");
    calculateImpotToRevenu();
  });

  taxAmountBtn.addEventListener("click", () => {
    taxAmountGroup.style.display = "block";
    taxPercentageGroup.style.display = "none";
    taxTypeGroup.classList.remove("hidden");
    taxAmountBtn.classList.add("active");
    taxPercentageBtn.classList.remove("active");
    calculateImpotToRevenu();
  });

  // Impôt → Revenu: 10% or charges menu
  abattementReverseBtn.addEventListener("click", () => {
    fixedChargesGroupReverse.style.display = "none";
    abattementReverseBtn.classList.add("active");
    fixedChargesReverseBtn.classList.remove("active");
    calculateImpotToRevenu();
  });

  fixedChargesReverseBtn.addEventListener("click", () => {
    fixedChargesGroupReverse.style.display = "block";
    fixedChargesReverseBtn.classList.add("active");
    abattementReverseBtn.classList.remove("active");
    calculateImpotToRevenu();
  });

  // Add event listeners for input changes
  revenuInput.addEventListener("input", calculateRevenuToImpot);
  revenuTypeSelect.addEventListener("change", calculateRevenuToImpot);
  fixedChargesInput.addEventListener("input", calculateRevenuToImpot);
  taxPercentageInput.addEventListener("input", calculateImpotToRevenu);
  taxAmountInput.addEventListener("input", calculateImpotToRevenu);
  taxTypeSelect.addEventListener("change", calculateImpotToRevenu);
  fixedChargesReverseInput.addEventListener("input", calculateImpotToRevenu);

  // Revenu → Impôt logic
  function calculateRevenuToImpot() { // TODO : check that this takes net income to taxable income only once !
    const revenu = parseFloat(revenuInput.value);
    if (isNaN(revenu) || revenu <= 0) {
      taxPercentageElement.textContent = "";
      thresholdBreakdownElement.innerHTML = "";
      totalTaxElement.textContent = "";
      missingMoneyElement.textContent = "";
      return;
    }
    const revenuType = revenuTypeSelect.value;
    const yearlyRevenu = revenuType === "monthly" ? revenu * 12 : revenu;
    // Use the selected menu to determine the method
    const chargesType = abattementBtn.classList.contains("active") ? "abattement" : "fixed";
    const fixedCharges = chargesType === "fixed" ? parseFloat(fixedChargesInput.value) || 0 : 0;
    let taxableIncome;
    if (chargesType === "abattement") {
      taxableIncome = yearlyRevenu * 0.9;
    } else {
      taxableIncome = Math.max(0, yearlyRevenu - fixedCharges);
    }
    const { tax, breakdown } = calculateTaxWithBreakdown(taxableIncome);
    const taxPercentage = (tax / yearlyRevenu) * 100;
    // Display threshold breakdown
    thresholdBreakdownElement.innerHTML = "";
    breakdown.forEach(threshold => {
      const row = document.createElement("tr");
      const formattedTaxableAmount = formatNumber(threshold.taxableAmount);
      const formattedTax = formatNumber(threshold.tax);
      row.innerHTML = `
        <td>${formatNumber(threshold.min)}\u00A0-\u00A0${threshold.max === Infinity ? "+∞" : formatNumber(threshold.max)}</td>
        <td>${formattedTaxableAmount}</td>
        <td>${(threshold.rate * 100).toFixed(2)}</td>
        <td>${formattedTax}</td>
      `;
      thresholdBreakdownElement.appendChild(row);
    });
    const nextThreshold = TAX_THRESHOLDS.find(threshold =>
      taxableIncome < threshold.min
    );
    let missingMoneyYearly = nextThreshold ? nextThreshold.min - taxableIncome : 0;
    let missingMoneyMonthly = missingMoneyYearly / 12;
    taxPercentageElement.textContent = window.translationSystem.getTranslation("tax-percentage-prefix") + taxPercentage.toFixed(2) + "%";
    totalTaxElement.textContent = window.translationSystem.getTranslation("total-tax-prefix") + formatNumber(tax) + "€";
    if (tax === 0) {
      missingMoneyElement.textContent = window.translationSystem.getTranslation(
        "no-tax-complete",
        formatNumber(taxableIncome),
        formatNumber(TAX_THRESHOLDS[1].min)
      ) + window.translationSystem.getTranslation(
        "missing-money-complete",
        formatNumber(missingMoneyYearly),
        formatNumber(missingMoneyMonthly)
      ); // TODO
    } else if (!nextThreshold) {
      missingMoneyElement.textContent = window.translationSystem.getTranslation("max-contributor-message");
    } else {
      missingMoneyElement.textContent = window.translationSystem.getTranslation("missing-money-complete",
        formatNumber(missingMoneyYearly),
        formatNumber(missingMoneyMonthly));
    }
  }

  // Impôt → Revenu logic
  function calculateImpotToRevenu() {
    // Use the selected menu to determine the method
    const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
    const chargesType = abattementReverseBtn.classList.contains("active") ? "abattement" : "fixed";
    const fixedCharges = chargesType === "fixed" ? parseFloat(fixedChargesReverseInput.value) || 0 : 0;

    // Clear previous breakdown
    const thresholdBreakdownReverseBody = document.getElementById("threshold-breakdown-reverse-body");
    thresholdBreakdownReverseBody.innerHTML = "";

    if (isTaxPercentageMode) {
      const taxPercentage = parseFloat(taxPercentageInput.value);
      if (isNaN(taxPercentage) || taxPercentage <= 0) {
        calculatedRevenuElement.textContent = "";
        return;
      }

      // Check if tax percentage is above maximum
      if (taxPercentage > 40.50 && chargesType === "abattement") {
        calculatedRevenuElement.textContent = window.translationSystem.getTranslation("tax-percentage-with-deduction-error");
        return;
      } else if (taxPercentage > 45 - 1E-15 && chargesType === "fixed") {
        calculatedRevenuElement.textContent = window.translationSystem.getTranslation("tax-percentage-with-fixed-charges-error");
        return;
      }

      if (taxPercentage === 0) {
        const maxRevenuNoTax = TAX_THRESHOLDS[0].max;
        let calculatedRevenuNoTax;
        if (chargesType === "abattement") {
          calculatedRevenuNoTax = maxRevenuNoTax / 0.9;
        } else {
          calculatedRevenuNoTax = maxRevenuNoTax + fixedCharges;
        }
        calculatedRevenuElement.textContent = window.translationSystem.getTranslation("zero-tax-message",
          formatNumber(calculatedRevenuNoTax),
          formatNumber(calculatedRevenuNoTax / 12));
        return;
      }

      // Find the appropriate threshold for this tax percentage
      const { threshold, index } = findThresholdForTaxPercentage(taxPercentage);
      if (!threshold) {
        calculatedRevenuElement.textContent = window.translationSystem.getTranslation("tax-percentage-error");
        return;
      }

      // Calculate revenue based on the target threshold
      const calculatedRevenu = calculateRevenuFromTaxPercentage(taxPercentage, chargesType, fixedCharges, { threshold, index });
      calculatedRevenuElement.textContent = window.translationSystem.getTranslation("calculated-revenu-prefix") +
        formatNumber(calculatedRevenu.yearly) + "€ (" +
        window.translationSystem.getTranslation("monthly-option").toLowerCase() + ": " +
        formatNumber(calculatedRevenu.monthly) + "€)";

      // Calculate taxable income for breakdown
      const taxableIncome = calculatedRevenu.yearly;
      const { breakdown } = calculateTaxWithBreakdown(taxableIncome);

      // Display threshold breakdown
      let cumulativeTax = 0;
      breakdown.forEach(threshold => {
        const row = document.createElement("tr");
        cumulativeTax += threshold.tax;
        const formattedCumulativeTax = formatNumber(cumulativeTax);
        row.innerHTML = `
          <td>${formatNumber(threshold.min)}\u00A0-\u00A0${threshold.max === Infinity ? "+∞" : formatNumber(threshold.max)}</td>
          <td>${formatNumber(threshold.taxableAmount)}</td>
          <td>${(threshold.rate * 100).toFixed(2)}</td>
          <td>${formatNumber(threshold.tax)}</td>
          <td>${formattedCumulativeTax}</td>
        `;
        thresholdBreakdownReverseBody.appendChild(row);
      });
    } else {
      const taxAmount = parseFloat(taxAmountInput.value);
      if (isNaN(taxAmount) || taxAmount <= 0) {
        calculatedRevenuElement.textContent = "";
        return;
      }

      if (taxAmount === 0) {
        const maxRevenuNoTax = TAX_THRESHOLDS[1].min / (chargesType === "abattement" ? 0.9 : 1);
        calculatedRevenuElement.textContent = window.translationSystem.getTranslation("zero-tax-message",
          formatNumber(maxRevenuNoTax),
          formatNumber(maxRevenuNoTax / 12));
        return;
      }

      const taxType = taxTypeSelect.value;
      const yearlyTax = taxType === "monthly" ? taxAmount * 12 : taxAmount;
      const calculatedRevenu = calculateRevenuFromTaxValue(yearlyTax, chargesType, fixedCharges);

      // Calculate taxable income for breakdown
      const taxableIncome = chargesType === "abattement" ? calculatedRevenu.yearly * 0.9 : calculatedRevenu.yearly - fixedCharges;
      const { breakdown } = calculateTaxWithBreakdown(taxableIncome);

      // Display threshold breakdown
      let cumulativeTax = 0;
      breakdown.forEach(threshold => {
        const row = document.createElement("tr");
        cumulativeTax += threshold.tax;
        const formattedCumulativeTax = formatNumber(cumulativeTax);
        row.innerHTML = `
          <td>${formatNumber(threshold.min)}\u00A0-\u00A0${threshold.max === Infinity ? "+∞" : formatNumber(threshold.max)}</td>
          <td>${formatNumber(threshold.taxableAmount)}</td>
          <td>${(threshold.rate * 100).toFixed(2)}</td>
          <td>${formatNumber(threshold.tax)}</td>
          <td>${formattedCumulativeTax}</td>
        `;
        thresholdBreakdownReverseBody.appendChild(row);
      });

      calculatedRevenuElement.textContent = window.translationSystem.getTranslation("calculated-revenu-prefix") +
        formatNumber(calculatedRevenu.yearly) + "€ (" +
        window.translationSystem.getTranslation("monthly-option").toLowerCase() + ": " +
        formatNumber(calculatedRevenu.monthly) + "€)";
    }
  }

  // Register functions with translation system
  if (window.translationSystem) {
    window.translationSystem.registerCalculationFunctions(calculateRevenuToImpot, calculateImpotToRevenu);
  }
});
