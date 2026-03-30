// revenuCalculator.js - Revenu to Impôt calculation logic
import {
  TAX_THRESHOLDS_BY_YEAR_FINAL as TAX_THRESHOLDS_BY_YEAR,
  calculateTaxWithBreakdown,
  formatNumber
} from './taxCalculator.js';

// Core calculation function - returns calculation results without DOM manipulation
export function calculateRevenuToImpot(
  revenuValue,
  fixedChargesValue,
  isYearly,
  useAbattement,
  selectedYear
) {
  const revenu = parseFloat(revenuValue);
  if (isNaN(revenu) || revenu <= 0) {
    return null;
  }
  
  const yearlyRevenu = isYearly ? revenu : revenu * 12;
  const thresholds = TAX_THRESHOLDS_BY_YEAR[selectedYear] || TAX_THRESHOLDS_BY_YEAR[2025];
  
  // Calculate taxable income based on method
  const fixedCharges = useAbattement ? 0 : parseFloat(fixedChargesValue) || 0;
  const taxableIncome = useAbattement 
    ? Math.max(0, yearlyRevenu * 0.9)
    : Math.max(0, yearlyRevenu - fixedCharges);
  
  // Calculate tax and breakdown
  const { tax, breakdown } = calculateTaxWithBreakdown(taxableIncome, selectedYear);
  const taxPercentage = taxableIncome === 0 ? 0 : (tax / taxableIncome) * 100;
  
  // Find next threshold for missing money calculation
  const nextThreshold = thresholds.find(threshold => taxableIncome < threshold.min);
  const missingMoneyYearly = nextThreshold ? nextThreshold.min - taxableIncome : 0;
  const missingMoneyMonthly = missingMoneyYearly / 12;
  
  return {
    taxPercentage,
    tax,
    breakdown,
    taxableIncome,
    missingMoneyYearly,
    missingMoneyMonthly,
    hasNextThreshold: !!nextThreshold,
    thresholds
  };
}

// Function to format calculation results for display
export function formatRevenuToImpotResults(
  results,
  taxPercentageElement,
  thresholdBreakdownElement,
  totalTaxElement,
  missingMoneyElement
) {
  if (!results) {
    taxPercentageElement.textContent = "";
    thresholdBreakdownElement.innerHTML = "";
    totalTaxElement.textContent = "";
    missingMoneyElement.textContent = "";
    return;
  }
  
  // Format threshold breakdown
  thresholdBreakdownElement.innerHTML = "";
  results.breakdown.forEach(threshold => {
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
  
  // Format results
  taxPercentageElement.textContent = window.translationSystem.getTranslation("tax-percentage-prefix") + results.taxPercentage.toFixed(3) + "\u00A0%";
  totalTaxElement.textContent = window.translationSystem.getTranslation("total-tax-prefix") + formatNumber(results.tax) + "\u00A0€";
  
  // Format missing money message
  if (results.tax === 0) {
    missingMoneyElement.textContent = window.translationSystem.getTranslation(
      "no-tax-complete",
      formatNumber(results.taxableIncome),
      formatNumber(results.thresholds[1].min)
    ) + window.translationSystem.getTranslation(
      "missing-money-complete",
      formatNumber(results.missingMoneyYearly),
      formatNumber(results.missingMoneyMonthly)
    );
  } else if (!results.hasNextThreshold) {
    missingMoneyElement.textContent = window.translationSystem.getTranslation("max-contributor-message");
  } else {
    missingMoneyElement.textContent = window.translationSystem.getTranslation("missing-money-complete",
      formatNumber(results.missingMoneyYearly),
      formatNumber(results.missingMoneyMonthly));
  }
}

// Main function that combines calculation and formatting
export function calculateAndFormatRevenuToImpot(
  revenuValue,
  fixedChargesValue,
  isYearly,
  useAbattement,
  selectedYear,
  taxPercentageElement,
  thresholdBreakdownElement,
  totalTaxElement,
  missingMoneyElement
) {
  const results = calculateRevenuToImpot(revenuValue, fixedChargesValue, isYearly, useAbattement, selectedYear);
  formatRevenuToImpotResults(results, taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement);
  return results;
}