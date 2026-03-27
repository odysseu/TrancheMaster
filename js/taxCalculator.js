// taxCalculator.js - Pure calculation functions
// Tax thresholds for different years
export const TAX_THRESHOLDS_BY_YEAR = {
  2025: [
    { min: 0, max: 11497, rate: 0 },
    { min: 11498, max: 29315, rate: 0.11 },
    { min: 29316, max: 83823, rate: 0.3 },
    { min: 83824, max: 180294, rate: 0.41 },
    { min: 180295, max: Infinity, rate: 0.45 }
  ],
  2026: [
    { min: 0, max: 11497, rate: 0 },
    { min: 11498, max: 29315, rate: 0.11 },
    { min: 29316, max: 83823, rate: 0.3 },
    { min: 83824, max: 180294, rate: 0.41 },
    { min: 180295, max: Infinity, rate: 0.45 }
  ]
};

// Default to 2025 for backward compatibility
export const TAX_THRESHOLDS = TAX_THRESHOLDS_BY_YEAR[2025];

// Pre-calculate tax information for each threshold for a given year
export const THRESHOLD_DATA_BY_YEAR = {};
for (const year in TAX_THRESHOLDS_BY_YEAR) {
  const thresholds = TAX_THRESHOLDS_BY_YEAR[year];
  const thresholdData = [];
  for (let i = 0; i < thresholds.length; i++) {
    const threshold = thresholds[i];
    // Calculate cumulative tax from previous thresholds
    let cumulativeTax = 0;
    for (let j = 0; j < i; j++) {
      const prev = thresholds[j];
      cumulativeTax += (prev.max - Math.max(prev.min - 1, 0)) * prev.rate;
    }
    const cumulativeTaxableIncome = Math.max(threshold.min - 1, 0);
    // Calculate tax range for this threshold
    const minTax = cumulativeTax;
    const maxTax = cumulativeTax + (threshold.max - Math.max(threshold.min - 1, 0)) * threshold.rate;
    // Calculate min and max tax percentages for this threshold
    let minTaxPercentage = i > 0 ? (minTax / threshold.min) * 100 : 0;
    let maxTaxPercentage = threshold.max !== Infinity ? maxTax / threshold.max * 100 : threshold.rate * 100 - 1E-15;
    thresholdData.push({
      min: threshold.min,
      max: threshold.max,
      rate: threshold.rate,
      minTax: minTax,
      maxTax: maxTax,
      minTaxPercentage: minTaxPercentage,
      maxTaxPercentage: maxTaxPercentage,
      cumulativeTax: cumulativeTax,
      cumulativeTaxableIncome: cumulativeTaxableIncome
    });
  }
  THRESHOLD_DATA_BY_YEAR[year] = thresholdData;
}

// Default to 2025 for backward compatibility
export const THRESHOLD_DATA = THRESHOLD_DATA_BY_YEAR[2025];

// Helper function to format numbers to 2 decimal places if needed
export function formatNumber(value) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? rounded : rounded.toFixed(2);
}

// Calculate tax with breakdown by threshold
export function calculateTaxWithBreakdown(taxableIncome, year = 2025) {
  const thresholds = TAX_THRESHOLDS_BY_YEAR[year] || TAX_THRESHOLDS_BY_YEAR[2025];
  let tax = 0;
  let thresholdTax = 0;
  let taxableAmount = 0;
  const breakdown = [];
  for (const threshold of thresholds) {
    if (taxableIncome >= threshold.min) {
      taxableAmount = Math.min(taxableIncome, threshold.max) - Math.max(threshold.min - 1, 0);
      thresholdTax = taxableAmount * threshold.rate;
      tax += thresholdTax;
      breakdown.push({
        min: threshold.min,
        max: threshold.max,
        rate: threshold.rate,
        taxableAmount: taxableAmount,
        tax: thresholdTax
      });
    }
  }
  return { tax: formatNumber(tax), breakdown };
}

// Find the appropriate threshold for a given tax percentage
export function findThresholdForTaxPercentage(taxPercentage, year = 2025) {
  const thresholdData = THRESHOLD_DATA_BY_YEAR[year] || THRESHOLD_DATA_BY_YEAR[2025];
  if (taxPercentage == 0) {
    return { threshold: thresholdData[0] };
  }
  else {
    for (let i = 1; i < thresholdData.length; i++) {
      const threshold = thresholdData[i];
      if (taxPercentage >= threshold.minTaxPercentage && taxPercentage < threshold.maxTaxPercentage) {
        return { threshold };
      }
    }
    return { threshold: null };
  }
}

// Calculate revenue from tax amount
export function calculateNetRevenuFromTaxValue(taxAmount, chargesType, fixedCharges, year = 2025) {
  const thresholds = TAX_THRESHOLDS_BY_YEAR[year] || TAX_THRESHOLDS_BY_YEAR[2025];
  const thresholdData = THRESHOLD_DATA_BY_YEAR[year] || THRESHOLD_DATA_BY_YEAR[2025];
  // If tax is 0, return the maximum revenue for 0% tax
  let taxableIncome;
  if (taxAmount === 0) {
    taxableIncome = thresholds[0].max;
  } else {
    // Find the threshold where this tax amount would fall
    let targetThreshold = null;
    for (const threshold of thresholdData) {
      if (taxAmount >= threshold.minTax && taxAmount <= threshold.maxTax) {
        targetThreshold = threshold;
        break;
      }
    }
    // If no threshold found, use the last one
    if (!targetThreshold) {
      targetThreshold = thresholdData[thresholdData.length - 1];
    }
    // Calculate taxable income for this threshold
    const taxInThreshold = taxAmount - targetThreshold.cumulativeTax;
    taxableIncome = targetThreshold.min - 1 + (taxInThreshold / targetThreshold.rate);
  }
  // Calculate revenue based on charges type
  let calculatedNetIncome;
  if (chargesType === "abattement") {
    calculatedNetIncome = taxableIncome / 0.9;
  } else {
    calculatedNetIncome = taxableIncome + fixedCharges;
  }
  return {
    yearly: formatNumber(calculatedNetIncome),
    monthly: formatNumber(calculatedNetIncome / 12)
  };
}

// Calculate revenue from tax percentage using precise formula
export function calculateNetRevenuFromTaxPercentage(taxPercentage, chargesType, fixedCharges, { threshold }, year = 2025) {
  const taxRate = taxPercentage / 100;
  let taxableIncome;
  if (taxPercentage === 0) {
    const thresholds = TAX_THRESHOLDS_BY_YEAR[year] || TAX_THRESHOLDS_BY_YEAR[2025];
    taxableIncome = thresholds[0].max;
  } else {
    const numerator = threshold.cumulativeTax - threshold.rate * (threshold.min - 0);
    const denominator = taxRate - threshold.rate;
    taxableIncome = numerator / denominator;
  }
  let calculatedNetIncome;
  if (chargesType === "abattement") {
    calculatedNetIncome = taxableIncome / 0.9;
  } else {
    calculatedNetIncome = taxableIncome + fixedCharges;
  }
  return {
    yearly: formatNumber(calculatedNetIncome),
    monthly: formatNumber(calculatedNetIncome / 12)
  };
}
