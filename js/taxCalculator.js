// taxCalculator.js - Pure calculation functions with built-in data loading

// Default tax thresholds data (includes years 2019-2026).
// BEGIN DEFAULT_TAX_THRESHOLDS (managed by js/update_tax_data.js - do not edit manually)
const DEFAULT_TAX_THRESHOLDS = {
  2026: [
    { min: 0, max: 11600, rate: 0 },
    { min: 11601, max: 29579, rate: 0.11 },
    { min: 29580, max: 84577, rate: 0.3 },
    { min: 84578, max: 181917, rate: 0.41 },
    { min: 181918, max: Infinity, rate: 0.45 }
  ],
  2025: [
    { min: 0, max: 11497, rate: 0 },
    { min: 11498, max: 29315, rate: 0.11 },
    { min: 29316, max: 83823, rate: 0.3 },
    { min: 83824, max: 180294, rate: 0.41 },
    { min: 180295, max: Infinity, rate: 0.45 }
  ],
  2024: [
    { min: 0, max: 11294, rate: 0 },
    { min: 11295, max: 28797, rate: 0.11 },
    { min: 28798, max: 82341, rate: 0.3 },
    { min: 82342, max: 177106, rate: 0.41 },
    { min: 177107, max: Infinity, rate: 0.45 }
  ],
  2023: [
    { min: 0, max: 10777, rate: 0 },
    { min: 10778, max: 27478, rate: 0.11 },
    { min: 27479, max: 78570, rate: 0.3 },
    { min: 78571, max: 168994, rate: 0.41 },
    { min: 168995, max: Infinity, rate: 0.45 }
  ],
  2022: [
    { min: 0, max: 10225, rate: 0 },
    { min: 10226, max: 26070, rate: 0.11 },
    { min: 26071, max: 74545, rate: 0.3 },
    { min: 74546, max: 160336, rate: 0.41 },
    { min: 160337, max: Infinity, rate: 0.45 }
  ],
  2021: [
    { min: 0, max: 10084, rate: 0 },
    { min: 10085, max: 25710, rate: 0.11 },
    { min: 25711, max: 73516, rate: 0.3 },
    { min: 73517, max: 158122, rate: 0.41 },
    { min: 158123, max: Infinity, rate: 0.45 }
  ],
  2020: [
    { min: 0, max: 10064, rate: 0 },
    { min: 10065, max: 27794, rate: 0.14 },
    { min: 27795, max: 74517, rate: 0.3 },
    { min: 74518, max: 157806, rate: 0.41 },
    { min: 157807, max: Infinity, rate: 0.45 }
  ],
  2019: [
    { min: 0, max: 9964, rate: 0 },
    { min: 9965, max: 27519, rate: 0.14 },
    { min: 27520, max: 73779, rate: 0.3 },
    { min: 73780, max: 156244, rate: 0.41 },
    { min: 156245, max: Infinity, rate: 0.45 }
  ],
  2018: [
    { min: 0, max: 9807, rate: 0 },
    { min: 9808, max: 27086, rate: 0.14 },
    { min: 27087, max: 72617, rate: 0.3 },
    { min: 72618, max: 153783, rate: 0.41 },
    { min: 153784, max: Infinity, rate: 0.45 }
  ],
  2017: [
    { min: 0, max: 9710, rate: 0 },
    { min: 9711, max: 26818, rate: 0.14 },
    { min: 26819, max: 71898, rate: 0.3 },
    { min: 71899, max: 152260, rate: 0.41 },
    { min: 152261, max: Infinity, rate: 0.45 }
  ],
  2016: [
    { min: 0, max: 9700, rate: 0 },
    { min: 9701, max: 26791, rate: 0.14 },
    { min: 26792, max: 71826, rate: 0.3 },
    { min: 71827, max: 152108, rate: 0.41 },
    { min: 152109, max: Infinity, rate: 0.45 }
  ],
  2015: [
    { min: 0, max: 9690, rate: 0 },
    { min: 9691, max: 26764, rate: 0.14 },
    { min: 26765, max: 71754, rate: 0.3 },
    { min: 71755, max: 151956, rate: 0.41 },
    { min: 151957, max: Infinity, rate: 0.45 }
  ],
  2014: [
    { min: 0, max: 6011, rate: 0 },
    { min: 6012, max: 11991, rate: 0.055 },
    { min: 11992, max: 26631, rate: 0.14 },
    { min: 26632, max: 71397, rate: 0.3 },
    { min: 71398, max: 151200, rate: 0.41 },
    { min: 151201, max: Infinity, rate: 0.45 }
  ],
  2013: [
    { min: 0, max: 5963, rate: 0 },
    { min: 5964, max: 11896, rate: 0.055 },
    { min: 11897, max: 26420, rate: 0.14 },
    { min: 26421, max: 70830, rate: 0.3 },
    { min: 70831, max: 150000, rate: 0.41 },
    { min: 150001, max: Infinity, rate: 0.45 }
  ],
  2012: [
    { min: 0, max: 5963, rate: 0 },
    { min: 5964, max: 11896, rate: 0.055 },
    { min: 11897, max: 26420, rate: 0.14 },
    { min: 26421, max: 70830, rate: 0.3 },
    { min: 70831, max: Infinity, rate: 0.41 }
  ],
  2011: [
    { min: 0, max: 5963, rate: 0 },
    { min: 5964, max: 11896, rate: 0.055 },
    { min: 11897, max: 26420, rate: 0.14 },
    { min: 26421, max: 70830, rate: 0.3 },
    { min: 70831, max: Infinity, rate: 0.41 }
  ],
  2010: [
    { min: 0, max: 5875, rate: 0 },
    { min: 5876, max: 11720, rate: 0.055 },
    { min: 11721, max: 26030, rate: 0.14 },
    { min: 26031, max: 69783, rate: 0.3 },
    { min: 69784, max: Infinity, rate: 0.4 }
  ],
  2009: [
    { min: 0, max: 5852, rate: 0 },
    { min: 5853, max: 11673, rate: 0.055 },
    { min: 11674, max: 25926, rate: 0.14 },
    { min: 25927, max: 69505, rate: 0.3 },
    { min: 69506, max: Infinity, rate: 0.4 }
  ],
  2008: [
    { min: 0, max: 5687, rate: 0 },
    { min: 5688, max: 11344, rate: 0.055 },
    { min: 11345, max: 25195, rate: 0.14 },
    { min: 25196, max: 67546, rate: 0.3 },
    { min: 67547, max: Infinity, rate: 0.4 }
  ],
  2007: [
    { min: 0, max: 5614, rate: 0 },
    { min: 5615, max: 11198, rate: 0.055 },
    { min: 11199, max: 24872, rate: 0.14 },
    { min: 24873, max: 66679, rate: 0.3 },
    { min: 66680, max: Infinity, rate: 0.4 }
  ],
  2006: [
    { min: 0, max: 4412, rate: 0 },
    { min: 4413, max: 8677, rate: 0.0683 },
    { min: 8678, max: 15274, rate: 0.1914 },
    { min: 15275, max: 24731, rate: 0.2826 },
    { min: 24732, max: 40241, rate: 0.3738 },
    { min: 40242, max: 49624, rate: 0.4262 },
    { min: 49625, max: Infinity, rate: 0.4809 }
  ],
  2005: [
    { min: 0, max: 4334, rate: 0 },
    { min: 4335, max: 15004, rate: 0.1914 },
    { min: 15005, max: 24294, rate: 0.2826 },
    { min: 24295, max: 39529, rate: 0.3738 },
    { min: 39530, max: 48747, rate: 0.4262 },
    { min: 48748, max: Infinity, rate: 0.4809 }
  ],
  2004: [
    { min: 0, max: 4262, rate: 0 },
    { min: 4263, max: 14753, rate: 0.1914 },
    { min: 14754, max: 23888, rate: 0.2826 },
    { min: 23889, max: 38868, rate: 0.3738 },
    { min: 38869, max: 47932, rate: 0.4262 },
    { min: 47933, max: Infinity, rate: 0.4809 }
  ],
  2003: [
    { min: 0, max: 4191, rate: 0 },
    { min: 4192, max: 8242, rate: 0.0705 },
    { min: 8243, max: 14506, rate: 0.1974 },
    { min: 14507, max: 23489, rate: 0.2914 },
    { min: 23490, max: 38218, rate: 0.3854 },
    { min: 38219, max: 47131, rate: 0.4394 },
    { min: 47132, max: Infinity, rate: 0.4958 }
  ],
  2002: [
    { min: 0, max: 4120, rate: 0 },
    { min: 4121, max: 8104, rate: 0.075 },
    { min: 8105, max: 14264, rate: 0.21 },
    { min: 14265, max: 23096, rate: 0.31 },
    { min: 23097, max: 37579, rate: 0.41 },
    { min: 37580, max: 46343, rate: 0.4675 },
    { min: 46344, max: Infinity, rate: 0.5275 }
  ]
};
// END DEFAULT_TAX_THRESHOLDS

// Try to load from external JSON file if available, otherwise use defaults
export let TAX_THRESHOLDS_BY_YEAR_FINAL = DEFAULT_TAX_THRESHOLDS;

// Function to load data from JSON file (for browser environment)
async function loadTaxDataFromJSON() {
  try {
    // Relative path so the app also works when hosted under a sub-path (e.g. GitHub Pages /TrancheMaster/)
    const response = await fetch('data/tax_thresholds.json');
    if (response.ok) {
      const data = await response.json();
      // Process the data to convert "Infinity" strings to actual Infinity
      const processedData = {};
      for (const year in data) {
        processedData[year] = data[year].map(threshold => ({
          min: threshold.min,
          max: threshold.max === "Infinity" ? Infinity : threshold.max,
          rate: threshold.rate
        }));
      }
      TAX_THRESHOLDS_BY_YEAR_FINAL = processedData;
      thresholdDataCache.clear();
      console.log('✅ Tax thresholds loaded from JSON file');

      // Update year selector with available years
      updateYearSelector(processedData);
    }
  } catch (error) {
    console.log('📄 Using built-in tax thresholds (JSON load failed):', error.message);
  }
}

// Load data if we're in a browser environment
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready before initializing year selector
  function initializeYearSelector() {
    updateYearSelector(DEFAULT_TAX_THRESHOLDS);
    loadTaxDataFromJSON();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeYearSelector);
  } else {
    initializeYearSelector();
  }
}

// Function to update year selector with available years
function updateYearSelector(years) {
  const yearSelect = document.getElementById('year-select');
  if (yearSelect) {
    const sortedYears = Object.keys(years).sort((a, b) => b - a);

    // Clear existing options
    yearSelect.innerHTML = '';

    // Add new options
    sortedYears.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      if (year === sortedYears[0]) {
        option.selected = true;
      }
      yearSelect.appendChild(option);
    });

    console.log(`📅 Year selector updated with years: ${sortedYears.join(', ')}`);
  }
}

// Default to 2025 for backward compatibility
export const TAX_THRESHOLDS = TAX_THRESHOLDS_BY_YEAR_FINAL[2025];

// Compute pre-calculated tax information for each threshold of a given year
export function computeThresholdData(thresholds) {
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
  return thresholdData;
}

// Cache of computed threshold data per year, invalidated when the underlying
// thresholds array is replaced (e.g. after loading data/tax_thresholds.json)
const thresholdDataCache = new Map();

export function getThresholdDataForYear(year) {
  const thresholds = TAX_THRESHOLDS_BY_YEAR_FINAL[year] || TAX_THRESHOLDS_BY_YEAR_FINAL[2025];
  const cached = thresholdDataCache.get(year);
  if (cached && cached.source === thresholds) {
    return cached.data;
  }
  const data = computeThresholdData(thresholds);
  thresholdDataCache.set(year, { source: thresholds, data });
  return data;
}

// Snapshot of pre-calculated data for the built-in years (backward compatibility)
export const THRESHOLD_DATA_BY_YEAR = {};
for (const year in TAX_THRESHOLDS_BY_YEAR_FINAL) {
  THRESHOLD_DATA_BY_YEAR[year] = computeThresholdData(TAX_THRESHOLDS_BY_YEAR_FINAL[year]);
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
  const thresholds = TAX_THRESHOLDS_BY_YEAR_FINAL[year] || TAX_THRESHOLDS_BY_YEAR_FINAL[2025];
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
  const thresholdData = getThresholdDataForYear(year);
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
  const thresholds = TAX_THRESHOLDS_BY_YEAR_FINAL[year] || TAX_THRESHOLDS_BY_YEAR_FINAL[2025];
  const thresholdData = getThresholdDataForYear(year);
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
    const thresholds = TAX_THRESHOLDS_BY_YEAR_FINAL[year] || TAX_THRESHOLDS_BY_YEAR_FINAL[2025];
    taxableIncome = thresholds[0].max;
  } else {
    // Taxable income in this bracket starts at (min - 1), so:
    // taxRate * I = cumulativeTax + rate * (I - (min - 1))
    const numerator = threshold.cumulativeTax - threshold.rate * (threshold.min - 1);
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
