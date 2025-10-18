// Tax thresholds for 2025 (updated values)
const TAX_THRESHOLDS = [
    { min: 0, max: 11497, rate: 0 },
    { min: 11498, max: 29315, rate: 0.11 },
    { min: 29316, max: 83823, rate: 0.30 },
    { min: 83824, max: 180294, rate: 0.41 },
    { min: 180295, max: Infinity, rate: 0.45 }
];

// Pre-calculate min and max tax percentages for each threshold
const THRESHOLD_TAX_RANGES = [];
for (let i = 0; i < TAX_THRESHOLDS.length; i++) {
    const threshold = TAX_THRESHOLDS[i];

    // Calculate minimum tax percentage for this threshold
    let minTaxPercentage = 0;
    if (i > 0) {
        // Tax from previous threshold
        const prevThreshold = TAX_THRESHOLDS[i-1];
        const prevThresholdTax = (prevThreshold.max - prevThreshold.min) * prevThreshold.rate;

        // Tax from current threshold (minimum)
        const currentThresholdTax = 0;

        // Total taxable income at the start of this threshold
        const totalIncomeAtStart = threshold.min;

        // Minimum tax percentage
        minTaxPercentage = (prevThresholdTax + currentThresholdTax) / totalIncomeAtStart * 100;
    }

    // Calculate maximum tax percentage for this threshold
    let maxTaxPercentage = 0;
    if (threshold.max !== Infinity) {
        // Tax from this threshold (maximum)
        const currentThresholdTax = (threshold.max - threshold.min) * threshold.rate;

        // Tax from previous thresholds
        let prevThresholdsTax = 0;
        for (let j = 0; j < i; j++) {
            const prevThreshold = TAX_THRESHOLDS[j];
            prevThresholdsTax += (prevThreshold.max - prevThreshold.min) * prevThreshold.rate;
        }

        // Total taxable income at the end of this threshold
        const totalIncomeAtEnd = threshold.max;

        // Maximum tax percentage
        maxTaxPercentage = (prevThresholdsTax + currentThresholdTax) / totalIncomeAtEnd * 100;
    } else {
        // For the last threshold, we can't calculate a max percentage
        maxTaxPercentage = Infinity;
    }

    THRESHOLD_TAX_RANGES.push({
        min: threshold.min,
        max: threshold.max,
        rate: threshold.rate,
        minTaxPercentage: minTaxPercentage,
        maxTaxPercentage: maxTaxPercentage
    });
}

// Helper function to format numbers to 2 decimal places if needed
function formatNumber(value) {
    const rounded = Math.round(value * 100) / 100;
    return Number.isInteger(rounded) ? rounded : rounded.toFixed(2);
}

// Global variables for inputs
let revenuInput, revenuTypeSelect, fixedChargesInput,
    taxPercentageInput, taxAmountInput, taxTypeSelect, fixedChargesReverseInput,
    taxPercentageElement, thresholdBreakdownElement, totalTaxElement, missingMoneyElement,
    estimatedRevenuElement, abattementBtn, fixedChargesBtn, taxPercentageBtn, taxAmountBtn,
    abattementReverseBtn, fixedChargesReverseBtn;

document.addEventListener("DOMContentLoaded", () => {
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

    // Get input elements
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
    estimatedRevenuElement = document.getElementById("estimated-revenu");

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
    function calculateRevenuToImpot() {
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

        const currentThreshold = TAX_THRESHOLDS.find(threshold =>
            taxableIncome >= threshold.min && taxableIncome <= threshold.max
        );
        const nextThreshold = TAX_THRESHOLDS.find(threshold =>
            taxableIncome < threshold.min
        );

        let missingMoneyYearly = nextThreshold ? nextThreshold.min - taxableIncome : 0;
        let missingMoneyMonthly = missingMoneyYearly / 12;

        taxPercentageElement.textContent = `Taux d'imposition : ${taxPercentage.toFixed(2)}\u00A0%`;
        totalTaxElement.textContent = `Impôt total : ${formatNumber(tax)}\u00A0€`;

        if (tax === 0) {
            missingMoneyElement.textContent = `Avec un revenu imposable de ${formatNumber(taxableIncome)}\u00A0€, vous ne payez pas d'impôt. Vous êtes sous le premier seuil d'imposition (${formatNumber(TAX_THRESHOLDS[1].min)}\u00A0€).`;
        } else if (!nextThreshold) {
            missingMoneyElement.textContent = "Vous êtes un grand contributeur ! Vous avez dépassé la dernière tranche d'imposition.";
        } else {
            missingMoneyElement.textContent = `Il manque ${formatNumber(missingMoneyYearly)}\u00A0€ par an (${formatNumber(missingMoneyMonthly)}\u00A0€ par mois) pour atteindre la prochaine tranche.`;
        }
    }

    // Impôt → Revenu logic
    function calculateImpotToRevenu() {
        // Use the selected menu to determine the method
        const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
        const chargesType = abattementReverseBtn.classList.contains("active") ? "abattement" : "fixed";
        const fixedCharges = chargesType === "fixed" ? parseFloat(fixedChargesReverseInput.value) || 0 : 0;

        if (isTaxPercentageMode) {
            const taxPercentage = parseFloat(taxPercentageInput.value);
            if (isNaN(taxPercentage) || taxPercentage <= 0) {
                estimatedRevenuElement.textContent = "";
                return;
            }

            // Check if tax percentage is above maximum
            if (taxPercentage > 40.50) {
                estimatedRevenuElement.textContent = "Le pourcentage d'imposition ne peut pas dépasser 40,50%. Veuillez entrer une valeur valide.";
                return;
            }

            if (taxPercentage === 0) {
                const maxRevenuNoTax = TAX_THRESHOLDS[1].min / (chargesType === "abattement" ? 0.9 : 1);
                estimatedRevenuElement.textContent = `Avec 0% d'imposition, votre revenu annuel est inférieur à ${formatNumber(maxRevenuNoTax)}\u00A0€ (${formatNumber(maxRevenuNoTax/12)}\u00A0€/mois).`;
                return;
            }

            // Find the appropriate threshold range for this tax percentage
            let targetThreshold = null;
            for (let i = 0; i < THRESHOLD_TAX_RANGES.length; i++) {
                const range = THRESHOLD_TAX_RANGES[i];
                if (taxPercentage >= range.minTaxPercentage && (taxPercentage <= range.maxTaxPercentage || range.maxTaxPercentage === Infinity)) {
                    targetThreshold = range;
                    break;
                }
            }

            // If no threshold found, use the last one
            if (!targetThreshold) {
                targetThreshold = THRESHOLD_TAX_RANGES[THRESHOLD_TAX_RANGES.length - 1];
            }

            // Calculate estimated revenue based on the target threshold
            const estimatedRevenu = estimateRevenuFromTaxPercentageAndThreshold(taxPercentage, chargesType, fixedCharges, targetThreshold);
            estimatedRevenuElement.textContent = `Revenu annuel estimé : ${formatNumber(estimatedRevenu.yearly)}\u00A0€ (Mensuel : ${formatNumber(estimatedRevenu.monthly)}\u00A0€)`;
        } else {
            const taxAmount = parseFloat(taxAmountInput.value);
            if (isNaN(taxAmount) || taxAmount <= 0) {
                estimatedRevenuElement.textContent = "";
                return;
            }

            if (taxAmount === 0) {
                const maxRevenuNoTax = TAX_THRESHOLDS[1].min / (chargesType === "abattement" ? 0.9 : 1);
                estimatedRevenuElement.textContent = `Avec 0€ d'impôt, votre revenu annuel est inférieur à ${formatNumber(maxRevenuNoTax)}\u00A0€ (${formatNumber(maxRevenuNoTax/12)}\u00A0€/mois).`;
                return;
            }

            const taxType = taxTypeSelect.value;
            const yearlyTax = taxType === "monthly" ? taxAmount * 12 : taxAmount;
            const estimatedRevenu = estimateRevenuFromTax(yearlyTax, chargesType, fixedCharges);
            estimatedRevenuElement.textContent = `Revenu annuel estimé : ${formatNumber(estimatedRevenu.yearly)}\u00A0€ (Mensuel : ${formatNumber(estimatedRevenu.monthly)}\u00A0€)`;
        }
    }

    // Function to calculate tax with breakdown by threshold
    function calculateTaxWithBreakdown(taxableIncome) {
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

    // Function to estimate revenu from tax amount
    function estimateRevenuFromTax(taxAmount, chargesType, fixedCharges) {
        // If tax is 0, return the maximum revenue for 0% tax
        if (taxAmount === 0) {
            const maxRevenuNoTax = TAX_THRESHOLDS[1].min / (chargesType === "abattement" ? 0.9 : 1);
            return {
                yearly: formatNumber(maxRevenuNoTax),
                monthly: formatNumber(maxRevenuNoTax / 12)
            };
        }

        // Find the threshold where this tax amount would fall
        let cumulativeTax = 0;
        let targetThresholdIndex = -1;

        for (let i = 0; i < TAX_THRESHOLDS.length; i++) {
            const threshold = TAX_THRESHOLDS[i];
            if (i === 0) continue; // Skip first threshold (0% tax)

            const prevThreshold = TAX_THRESHOLDS[i-1];
            const prevThresholdTax = (prevThreshold.max - prevThreshold.min) * prevThreshold.rate;
            cumulativeTax += prevThresholdTax;

            const currentThresholdTax = (threshold.max - threshold.min) * threshold.rate;
            if (cumulativeTax + currentThresholdTax >= taxAmount) {
                targetThresholdIndex = i;
                break;
            }
            cumulativeTax += currentThresholdTax;
        }

        // If no threshold found, use the last one
        if (targetThresholdIndex === -1) {
            targetThresholdIndex = TAX_THRESHOLDS.length - 1;
        }

        const targetThreshold = TAX_THRESHOLDS[targetThresholdIndex];

        // Calculate taxable income for this threshold
        let taxableIncome = 0;
        let remainingTax = taxAmount;

        // Add tax from previous thresholds
        for (let i = 1; i < targetThresholdIndex; i++) {
            const threshold = TAX_THRESHOLDS[i];
            const thresholdTax = (threshold.max - threshold.min) * threshold.rate;
            remainingTax -= thresholdTax;
            taxableIncome = threshold.max;
        }

        // Calculate taxable income in the target threshold
        if (targetThresholdIndex > 0) {
            const prevThreshold = TAX_THRESHOLDS[targetThresholdIndex - 1];
            taxableIncome = prevThreshold.max + (remainingTax / targetThreshold.rate);
        } else {
            taxableIncome = remainingTax / targetThreshold.rate;
        }

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

    // New function to estimate revenu from tax percentage using threshold ranges
    function estimateRevenuFromTaxPercentageAndThreshold(taxPercentage, chargesType, fixedCharges, targetThreshold) {
        const taxRate = taxPercentage / 100;

        // For 0% tax, return the maximum revenue for 0% tax
        if (taxPercentage === 0) {
            const maxRevenuNoTax = TAX_THRESHOLDS[1].min / (chargesType === "abattement" ? 0.9 : 1);
            return {
                yearly: formatNumber(maxRevenuNoTax),
                monthly: formatNumber(maxRevenuNoTax / 12)
            };
        }

        // Calculate the taxable income that would result in the given tax percentage
        // We'll use an iterative approach to find the correct income

        // Start with an initial guess based on the target threshold
        let estimatedTaxableIncome;
        if (targetThreshold.min === 0) {
            // For the first taxable threshold
            estimatedTaxableIncome = targetThreshold.max;
        } else {
            // For other thresholds, start with the middle of the range
            estimatedTaxableIncome = (targetThreshold.min + targetThreshold.max) / 2;
        }

        // Calculate initial revenue based on charges type
        let estimatedRevenu = chargesType === "abattement" ?
            estimatedTaxableIncome / 0.9 :
            estimatedTaxableIncome + fixedCharges;

        // Calculate initial tax and tax rate
        let calculatedTax = calculateTax(estimatedTaxableIncome);
        let calculatedTaxRate = calculatedTax / estimatedRevenu;

        // Iteratively adjust estimated revenue to match tax percentage
        let iterations = 0;
        const maxIterations = 100;
        const tolerance = 0.001;

        while (Math.abs(calculatedTaxRate - taxRate) > tolerance && iterations < maxIterations) {
            // Adjust the estimate based on the difference between calculated and target tax rates
            const adjustmentFactor = (taxRate - calculatedTaxRate) * 0.5;
            estimatedRevenu *= (1 + adjustmentFactor);

            // Recalculate taxable income based on new revenue estimate
            estimatedTaxableIncome = chargesType === "abattement" ?
                estimatedRevenu * 0.9 :
                estimatedRevenu - fixedCharges;

            // Ensure we stay within the target threshold range
            if (estimatedTaxableIncome < targetThreshold.min) {
                estimatedTaxableIncome = targetThreshold.min;
                estimatedRevenu = chargesType === "abattement" ?
                    targetThreshold.min / 0.9 :
                    targetThreshold.min + fixedCharges;
            } else if (targetThreshold.max !== Infinity && estimatedTaxableIncome > targetThreshold.max) {
                estimatedTaxableIncome = targetThreshold.max;
                estimatedRevenu = chargesType === "abattement" ?
                    targetThreshold.max / 0.9 :
                    targetThreshold.max + fixedCharges;
            }

            // Recalculate tax and tax rate
            calculatedTax = calculateTax(estimatedTaxableIncome);
            calculatedTaxRate = calculatedTax / estimatedRevenu;

            iterations++;
        }

        return {
            yearly: formatNumber(estimatedRevenu),
            monthly: formatNumber(estimatedRevenu / 12)
        };
    }

    // Function to calculate tax based on taxable income
    function calculateTax(taxableIncome) {
        let tax = 0;
        for (const threshold of TAX_THRESHOLDS) {
            if (taxableIncome > threshold.min) {
                const taxableAmount = Math.min(taxableIncome, threshold.max) - threshold.min;
                tax += taxableAmount * threshold.rate;
            }
        }
        return formatNumber(tax);
    }
});
