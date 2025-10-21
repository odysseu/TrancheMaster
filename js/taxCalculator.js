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
  let cumulativeTaxableIncome = 0;
  for (let j = 0; j < i; j++) {
    const prev = TAX_THRESHOLDS[j];
    cumulativeTax += (prev.max - prev.min) * prev.rate;
    cumulativeTaxableIncome += (prev.max - prev.min);
  }

  // Calculate tax range for this threshold
  const minTax = cumulativeTax;
  const maxTax = cumulativeTax + (threshold.max - threshold.min) * threshold.rate;

  // Calculate min and max tax percentages for this threshold
  let minTaxPercentage = i > 0 ? (minTax / threshold.min) * 100 : 0;
  let maxTaxPercentage = threshold.max !== Infinity ?
      ((cumulativeTax + (threshold.max - threshold.min) * threshold.rate) / threshold.max) * 100 :
      Infinity;

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

// Calculate tax based on taxable income
export function calculateTax(taxableIncome) {
  let tax = 0;
  for (const threshold of TAX_THRESHOLDS) {
    if (taxableIncome >= threshold.min) {
      const taxableAmount = Math.min(taxableIncome, threshold.max) - (threshold.min - 1);
      tax += taxableAmount * threshold.rate;
    }
  }
  return formatNumber(tax);
}

// Calculate tax with breakdown by threshold
export function calculateTaxWithBreakdown(taxableIncome) {
  let tax = 0;
  const breakdown = [];

  for (const threshold of TAX_THRESHOLDS) {
    if (taxableIncome > threshold.min) {
      const taxableAmount = Math.min(taxableIncome, threshold.max) - threshold.min;
      const thresholdTax = taxableAmount * threshold.rate;
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
  for (const threshold of THRESHOLD_DATA) {
    if (taxPercentage >= threshold.minTaxPercentage && taxPercentage <= threshold.maxTaxPercentage) {
      return threshold;
    }
  }
  return null;
}

// Estimate revenue from tax amount
export function estimateRevenuFromTax(taxAmount, chargesType, fixedCharges) {
  // If tax is 0, return the maximum revenue for 0% tax
  if (taxAmount === 0) {
    const maxRevenuNoTax = TAX_THRESHOLDS[1].min / (chargesType === "abattement" ? 0.9 : 1);
    return {
      yearly: formatNumber(maxRevenuNoTax),
      monthly: formatNumber(maxRevenuNoTax / 12)
    };
  }

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
  const taxableIncome = targetThreshold.min + (taxInThreshold / targetThreshold.rate);

  // Calculate revenue based on charges type
  let estimatedRevenu;
  if (chargesType === "abattement") {
    estimatedRevenu = taxableIncome / 0.9;
  } else {
    estimatedRevenu = taxableIncome + fixedCharges;
  }

  return {
    yearly: formatNumber(estimatedRevenu),
    monthly: formatNumber(estimatedRevenu / 12)
  };
}

// Calculate revenue from tax percentage using precise formula
export function calculateRevenuFromTaxPercentage(taxPercentage, chargesType, fixedCharges, targetThreshold) {
  const taxRate = taxPercentage / 100;

  // For 0% tax, return the maximum revenue for 0% tax
  if (taxPercentage === 0) {
    const maxRevenuNoTax = TAX_THRESHOLDS[1].min / (chargesType === "abattement" ? 0.9 : 1);
    return {
      yearly: formatNumber(maxRevenuNoTax),
      monthly: formatNumber(maxRevenuNoTax / 12)
    };
  }

  // For the first taxable threshold (special case)
  if (targetThreshold.min === 11498) {
    // Use the formula: tax = (income - 11497) * 0.11
    // And taxPercentage = tax / income
    const income = 11497 / (1 - taxRate / 0.11);

    // Calculate revenue based on charges type
    let estimatedRevenu;
    if (chargesType === "abattement") {
      estimatedRevenu = income / 0.9;
    } else {
      estimatedRevenu = income + fixedCharges;
    }

    return {
      yearly: formatNumber(estimatedRevenu),
      monthly: formatNumber(estimatedRevenu / 12)
    };
  }

  // For other thresholds, use the general formula
  if (chargesType === "abattement") {
    const numerator = 0.9 * targetThreshold.cumulativeTax - 0.9 * targetThreshold.rate * targetThreshold.min;
    const denominator = taxRate - 0.9 * targetThreshold.rate;
    const taxableIncome = numerator / denominator;
    const revenue = taxableIncome / 0.9;

    return {
      yearly: formatNumber(revenue),
      monthly: formatNumber(revenue / 12)
    };
  } else {
    const numerator = targetThreshold.cumulativeTax - targetThreshold.rate * targetThreshold.min - taxRate * fixedCharges;
    const denominator = taxRate - targetThreshold.rate;
    const taxableIncome = numerator / denominator;
    const revenue = taxableIncome + fixedCharges;

    return {
      yearly: formatNumber(revenue),
      monthly: formatNumber(revenue / 12)
    };
  }
}
