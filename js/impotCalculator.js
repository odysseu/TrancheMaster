// impotCalculator.js - Impôt to Revenu calculation logic
import {
  TAX_THRESHOLDS_BY_YEAR_FINAL as TAX_THRESHOLDS_BY_YEAR,
  calculateTaxWithBreakdown,
  calculateNetRevenuFromTaxPercentage,
  calculateNetRevenuFromTaxValue,
  findThresholdForTaxPercentage,
  formatNumber
} from './taxCalculator.js';

// Core calculation function for tax percentage mode - returns calculation results without DOM manipulation
export function calculateImpotToRevenuByPercentage(
  taxPercentageValue,
  fixedChargesValue,
  useAbattement,
  isYearly,
  selectedYear
) {
  const taxPercentage = parseFloat(taxPercentageValue);
  if (isNaN(taxPercentage) || taxPercentage <= 0) {
    return null;
  }
  
  const selectedYearInt = parseInt(selectedYear) || 2025;
  const thresholds = TAX_THRESHOLDS_BY_YEAR[selectedYearInt] || TAX_THRESHOLDS_BY_YEAR[2025];
  const fixedCharges = useAbattement ? 0 : parseFloat(fixedChargesValue) || 0;
  
  // Check if tax percentage is above maximum
  const maxRate = thresholds[thresholds.length - 1].rate * 100;
  const maxRateWithDeduction = maxRate * 0.9;
  
  if (taxPercentage > maxRateWithDeduction && useAbattement) {
    return { error: "tax-percentage-with-deduction-error" };
  } else if (taxPercentage > maxRate - 1E-15 && !useAbattement) {
    return { error: "tax-percentage-with-fixed-charges-error" };
  }
  
  // Handle zero tax percentage case
  if (taxPercentage === 0) {
    const maxRevenuNoTax = thresholds[0].max;
    const calculatedRevenuNoTax = useAbattement 
      ? maxRevenuNoTax / 0.9
      : maxRevenuNoTax + fixedCharges;
    
    return {
      calculatedRevenuNoTax,
      isZeroTax: true
    };
  }
  
  // Find the appropriate threshold for this tax percentage
  const { threshold } = findThresholdForTaxPercentage(taxPercentage, selectedYearInt);
  if (!threshold) {
    return { error: "tax-percentage-error" };
  }
  
  // Calculate revenue based on the target threshold
  const calculatedNetIncome = calculateNetRevenuFromTaxPercentage(
    taxPercentage, 
    useAbattement ? "abattement" : "fixed", 
    fixedCharges, 
    { threshold }, 
    selectedYearInt
  );
  
  // Calculate taxable income for breakdown
  const taxableIncome = useAbattement 
    ? Math.max(0, calculatedNetIncome.yearly * 0.9)
    : Math.max(0, calculatedNetIncome.yearly - fixedCharges);
  
  const { breakdown } = calculateTaxWithBreakdown(taxableIncome, selectedYearInt);
  
  return {
    calculatedNetIncome,
    breakdown,
    taxableIncome
  };
}

// Core calculation function for tax amount mode - returns calculation results without DOM manipulation
export function calculateImpotToRevenuByAmount(
  taxAmountValue,
  fixedChargesValue,
  useAbattement,
  isYearly,
  selectedYear
) {
  const taxAmount = parseFloat(taxAmountValue);
  if (isNaN(taxAmount) || taxAmount <= 0) {
    return null;
  }
  
  const selectedYearInt = parseInt(selectedYear) || 2025;
  const thresholds = TAX_THRESHOLDS_BY_YEAR[selectedYearInt] || TAX_THRESHOLDS_BY_YEAR[2025];
  const fixedCharges = useAbattement ? 0 : parseFloat(fixedChargesValue) || 0;
  
  // Handle zero tax amount case
  if (taxAmount === 0) {
    const maxRevenuNoTax = thresholds[0].max;
    const calculatedRevenuNoTax = useAbattement 
      ? maxRevenuNoTax / 0.9
      : maxRevenuNoTax + fixedCharges;
    
    return {
      calculatedRevenuNoTax,
      isZeroTax: true
    };
  }
  
  // Calculate based on tax amount
  const yearlyTax = isYearly ? taxAmount : taxAmount * 12;
  const calculatedNetIncome = calculateNetRevenuFromTaxValue(
    yearlyTax, 
    useAbattement ? "abattement" : "fixed", 
    fixedCharges, 
    selectedYearInt
  );
  
  // Calculate taxable income for breakdown
  const taxableIncome = useAbattement 
    ? calculatedNetIncome.yearly * 0.9
    : Math.max(0, calculatedNetIncome.yearly - fixedCharges);
  
  const { breakdown } = calculateTaxWithBreakdown(taxableIncome, selectedYearInt);
  
  return {
    calculatedNetIncome,
    breakdown,
    taxableIncome
  };
}

// Main calculation function that routes to the appropriate mode
export function calculateImpotToRevenu(
  taxPercentageValue,
  taxAmountValue,
  fixedChargesValue,
  isTaxPercentageMode,
  useAbattement,
  isYearly,
  selectedYear
) {
  if (isTaxPercentageMode) {
    return calculateImpotToRevenuByPercentage(
      taxPercentageValue, fixedChargesValue, useAbattement, isYearly, selectedYear
    );
  } else {
    return calculateImpotToRevenuByAmount(
      taxAmountValue, fixedChargesValue, useAbattement, isYearly, selectedYear
    );
  }
}

// Function to format calculation results for display
export function formatImpotToRevenuResults(
  results,
  calculatedRevenuElement
) {
  // Clear previous breakdown
  const thresholdBreakdownReverseBody = document.getElementById("threshold-breakdown-reverse-body");
  thresholdBreakdownReverseBody.innerHTML = "";
  
  if (!results) {
    calculatedRevenuElement.textContent = "";
    return;
  }
  
  // Handle error cases
  if (results.error) {
    calculatedRevenuElement.textContent = window.translationSystem.getTranslation(results.error);
    return;
  }
  
  // Handle zero tax case
  if (results.isZeroTax) {
    calculatedRevenuElement.textContent = window.translationSystem.getTranslation("zero-tax-message",
      formatNumber(results.calculatedRevenuNoTax),
      formatNumber(results.calculatedRevenuNoTax / 12));
    return;
  }
  
  // Format main result
  calculatedRevenuElement.textContent = window.translationSystem.getTranslation("calculated-revenu-prefix") +
    formatNumber(results.calculatedNetIncome.yearly) + "€ (" +
    window.translationSystem.getTranslation("monthly-option").toLowerCase() + ": " +
    formatNumber(results.calculatedNetIncome.monthly) + "€)";
  
  // Format threshold breakdown
  let cumulativeTax = 0;
  results.breakdown.forEach(threshold => {
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
}

// Main function that combines calculation and formatting
export function calculateAndFormatImpotToRevenu(
  taxPercentageValue,
  taxAmountValue,
  fixedChargesValue,
  isTaxPercentageMode,
  useAbattement,
  isYearly,
  selectedYear,
  calculatedRevenuElement
) {
  const results = calculateImpotToRevenu(
    taxPercentageValue, taxAmountValue, fixedChargesValue, 
    isTaxPercentageMode, useAbattement, isYearly, selectedYear
  );
  formatImpotToRevenuResults(results, calculatedRevenuElement);
  return results;
}