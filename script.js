// Tax thresholds for 2025 (updated values)
const TAX_THRESHOLDS = [
    { min: 0, max: 11497, rate: 0 },
    { min: 11498, max: 29315, rate: 0.11 },
    { min: 29316, max: 83823, rate: 0.30 },
    { min: 83824, max: 180294, rate: 0.41 },
    { min: 180295, max: Infinity, rate: 0.45 }
];

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

    // Initialize visibility on page load
    taxTypeGroup.classList.add("hidden");

    // Main mode menu toggle
    revenuToImpotBtn.addEventListener("click", () => {
        revenuToImpotSection.classList.add("active");
        impotToRevenuSection.classList.remove("active");
        revenuToImpotBtn.classList.add("active");
        impotToRevenuBtn.classList.remove("active");
        calculateRevenuToImpot(); // Recalculate when switching sections
    });

    impotToRevenuBtn.addEventListener("click", () => {
        impotToRevenuSection.classList.add("active");
        revenuToImpotSection.classList.remove("active");
        impotToRevenuBtn.classList.add("active");
        revenuToImpotBtn.classList.remove("active");
        calculateImpotToRevenu(); // Recalculate when switching sections
    });

    // Revenu → Impôt: 10% or charges menu
    abattementBtn.addEventListener("click", () => {
        fixedChargesGroup.style.display = "none";
        abattementBtn.classList.add("active");
        fixedChargesBtn.classList.remove("active");
        calculateRevenuToImpot(); // Recalculate when changing method
    });

    fixedChargesBtn.addEventListener("click", () => {
        fixedChargesGroup.style.display = "block";
        fixedChargesBtn.classList.add("active");
        abattementBtn.classList.remove("active");
        calculateRevenuToImpot(); // Recalculate when changing method
    });

    // Impôt → Revenu: Percentage or value menu
    taxPercentageBtn.addEventListener("click", () => {
        taxPercentageGroup.style.display = "block";
        taxAmountGroup.style.display = "none";
        taxTypeGroup.classList.add("hidden");
        taxPercentageBtn.classList.add("active");
        taxAmountBtn.classList.remove("active");
        calculateImpotToRevenu(); // Recalculate when changing method
    });

    taxAmountBtn.addEventListener("click", () => {
        taxAmountGroup.style.display = "block";
        taxPercentageGroup.style.display = "none";
        taxTypeGroup.classList.remove("hidden");
        taxAmountBtn.classList.add("active");
        taxPercentageBtn.classList.remove("active");
        calculateImpotToRevenu(); // Recalculate when changing method
    });

    // Impôt → Revenu: 10% or charges menu
    abattementReverseBtn.addEventListener("click", () => {
        fixedChargesGroupReverse.style.display = "none";
        abattementReverseBtn.classList.add("active");
        fixedChargesReverseBtn.classList.remove("active");
        calculateImpotToRevenu(); // Recalculate when changing method
    });

    fixedChargesReverseBtn.addEventListener("click", () => {
        fixedChargesGroupReverse.style.display = "block";
        fixedChargesReverseBtn.classList.add("active");
        abattementReverseBtn.classList.remove("active");
        calculateImpotToRevenu(); // Recalculate when changing method
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
        missingMoneyElement.textContent = `Il manque ${formatNumber(missingMoneyYearly)}\u00A0€ par an (${formatNumber(missingMoneyMonthly)}\u00A0€ par mois) pour atteindre la prochaine tranche.`;
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
            const estimatedRevenu = estimateRevenuFromTaxPercentage(taxPercentage, chargesType, fixedCharges);
            estimatedRevenuElement.textContent = `Revenu annuel estimé : ${formatNumber(estimatedRevenu.yearly)}\u00A0€ (Mensuel : ${formatNumber(estimatedRevenu.monthly)}\u00A0€)`;
        } else {
            const taxAmount = parseFloat(taxAmountInput.value);
            if (isNaN(taxAmount) || taxAmount <= 0) {
                estimatedRevenuElement.textContent = "";
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
        // Simplified estimation: Assume taxable income is in the highest threshold
        let estimatedTaxableIncome = taxAmount / TAX_THRESHOLDS[TAX_THRESHOLDS.length - 1].rate;
        let estimatedRevenu = chargesType === "abattement" ?
            estimatedTaxableIncome / 0.9 :
            estimatedTaxableIncome + fixedCharges;
        return {
            yearly: formatNumber(estimatedRevenu),
            monthly: formatNumber(estimatedRevenu / 12)
        };
    }

    // Function to estimate revenu from tax percentage
    function estimateRevenuFromTaxPercentage(taxPercentage, chargesType, fixedCharges) {
        const taxRate = taxPercentage / 100;
        let estimatedRevenu = 100000; // Initial guess
        let taxableIncome = chargesType === "abattement" ? estimatedRevenu * 0.9 : estimatedRevenu - fixedCharges;
        let calculatedTax = calculateTax(taxableIncome);
        let calculatedTaxRate = calculatedTax / estimatedRevenu;

        // Iteratively adjust estimated revenu to match tax percentage
        while (Math.abs(calculatedTaxRate - taxRate) > 0.001) {
            estimatedRevenu += (taxRate - calculatedTaxRate) * estimatedRevenu;
            taxableIncome = chargesType === "abattement" ? estimatedRevenu * 0.9 : estimatedRevenu - fixedCharges;
            calculatedTax = calculateTax(taxableIncome);
            calculatedTaxRate = calculatedTax / estimatedRevenu;
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
