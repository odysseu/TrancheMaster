// taxCalculator.js - Pure calculation functions
// Tax thresholds for 2025
export const TAX_THRESHOLDS = [
  { min: 0, max: 11497, rate: 0 },
  { min: 11498, max: 29315, rate: 0.11 },
  { min: 29316, max: 83823, rate: 0.30 },
  { min: 83824, max: 180294, rate: 0.41 },
  { min: 180295, max: Infinity, rate: 0.45 }
];

// Pre-calculate tax information for each threshold
export const THRESHOLD_DATA = [];
for (let i = 0; i < TAX_THRESHOLDS.length; i++) {
  const threshold = TAX_THRESHOLDS[i];
  // Calculate cumulative tax from previous thresholds
  let cumulativeTax = 0;
  for (let j = 0; j < i; j++) {
    const prev = TAX_THRESHOLDS[j];
    cumulativeTax += (prev.max - Math.max(prev.min - 1, 0)) * prev.rate;
  }
  const cumulativeTaxableIncome = Math.max(threshold.min - 1, 0);
  // Calculate tax range for this threshold
  const minTax = cumulativeTax;
  const maxTax = cumulativeTax + (threshold.max - Math.max(threshold.min - 1, 0)) * threshold.rate;
  // Calculate min and max tax percentages for this threshold
  let minTaxPercentage = i > 0 ? (minTax / threshold.min) * 100 : 0;
  let maxTaxPercentage = threshold.max !== Infinity ? maxTax / threshold.max * 100 : threshold.rate - 1E-15;
  THRESHOLD_DATA.push({
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

// Helper function to format numbers to 2 decimal places if needed
export function formatNumber(value) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? rounded : rounded.toFixed(2);
}

// Calculate tax with breakdown by threshold
export function calculateTaxWithBreakdown(taxableIncome) {
  let tax = 0;
  let thresholdTax = 0;
  let taxableAmount = 0;
  const breakdown = [];
  for (const threshold of TAX_THRESHOLDS) {
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
export function findThresholdForTaxPercentage(taxPercentage) {
  for (let i = 0; i < THRESHOLD_DATA.length; i++) {
    const threshold = THRESHOLD_DATA[i];
    if (taxPercentage >= threshold.minTaxPercentage && taxPercentage <= threshold.maxTaxPercentage) {
      return { threshold }; // , index: i
    }
  }
  return { threshold: null }; // , index: -1
}

// Calculate revenue from tax amount
export function calculateNetRevenuFromTaxValue(taxAmount, chargesType, fixedCharges) {
  // If tax is 0, return the maximum revenue for 0% tax
  let taxableIncome;
  if (taxAmount === 0) {
    taxableIncome = TAX_THRESHOLDS[0].max;
  } else {
    // Find the threshold where this tax amount would fall
    let targetThreshold = null;
    for (const threshold of THRESHOLD_DATA) {
      if (taxAmount >= threshold.minTax && taxAmount <= threshold.maxTax) {
        targetThreshold = threshold;
        break;
      }
    }
    // If no threshold found, use the last one
    if (!targetThreshold) {
      targetThreshold = THRESHOLD_DATA[THRESHOLD_DATA.length - 1];
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
export function calculateNetRevenuFromTaxPercentage(taxPercentage, chargesType, fixedCharges, { threshold }) {
  const taxRate = taxPercentage / 100;
  let taxableIncome;
  if (taxPercentage === 0) {
    taxableIncome = TAX_THRESHOLDS[0].max;
  } else {
    // For the first taxable threshold (special case)
    // if (threshold.min === 11498) {
    //   const income = 11497 / (1 - taxRate / 0.11);
    //   let estimatedRevenu;
    //   if (chargesType === "abattement") {
    //     estimatedRevenu = income / 0.9;
    //   } else {
    //     estimatedRevenu = income + fixedCharges;
    //   }
    //   return {
    //     yearly: formatNumber(estimatedRevenu),
    //     monthly: formatNumber(estimatedRevenu / 12)
    //   };
    // }
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
