// Tax thresholds for 2025 (example values, replace with actual thresholds)
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

    // Main mode menu toggle
    const revenuToImpotBtn = document.getElementById("revenu-to-impot-btn");
    const impotToRevenuBtn = document.getElementById("impot-to-revenu-btn");
    const revenuToImpotSection = document.getElementById("revenu-to-impot-section");
    const impotToRevenuSection = document.getElementById("impot-to-revenu-section");

    revenuToImpotBtn.addEventListener("click", () => {
        revenuToImpotSection.classList.add("active");
        impotToRevenuSection.classList.remove("active");
        revenuToImpotBtn.classList.add("active");
        impotToRevenuBtn.classList.remove("active");
    });

    impotToRevenuBtn.addEventListener("click", () => {
        impotToRevenuSection.classList.add("active");
        revenuToImpotSection.classList.remove("active");
        impotToRevenuBtn.classList.add("active");
        revenuToImpotBtn.classList.remove("active");
    });

    // Revenu → Impôt: 10% or charges menu
    const abattementBtn = document.getElementById("abattement-btn");
    const fixedChargesBtn = document.getElementById("fixed-charges-btn");
    const fixedChargesGroup = document.getElementById("fixed-charges-group");

    abattementBtn.addEventListener("click", () => {
        fixedChargesGroup.style.display = "none";
        abattementBtn.classList.add("active");
        fixedChargesBtn.classList.remove("active");
    });

    fixedChargesBtn.addEventListener("click", () => {
        fixedChargesGroup.style.display = "block";
        fixedChargesBtn.classList.add("active");
        abattementBtn.classList.remove("active");
    });

    // Impôt → Revenu: Percentage or value menu
    const taxPercentageBtn = document.getElementById("tax-percentage-btn");
    const taxAmountBtn = document.getElementById("tax-amount-btn");
    const taxPercentageGroup = document.getElementById("tax-percentage-group");
    const taxAmountGroup = document.getElementById("tax-amount-group");
    const taxTypeGroup = document.getElementById("tax-type-group");

    // Initialize visibility on page load
    taxTypeGroup.classList.add("hidden");

    taxPercentageBtn.addEventListener("click", () => {
        taxPercentageGroup.style.display = "block";
        taxAmountGroup.style.display = "none";
        taxTypeGroup.classList.add("hidden");
        taxPercentageBtn.classList.add("active");
        taxAmountBtn.classList.remove("active");
    });

    taxAmountBtn.addEventListener("click", () => {
        taxAmountGroup.style.display = "block";
        taxPercentageGroup.style.display = "none";
        taxTypeGroup.classList.remove("hidden");
        taxAmountBtn.classList.add("active");
        taxPercentageBtn.classList.remove("active");
    });

    // Impôt → Revenu: 10% or charges menu
    const abattementReverseBtn = document.getElementById("abattement-reverse-btn");
    const fixedChargesReverseBtn = document.getElementById("fixed-charges-reverse-btn");
    const fixedChargesGroupReverse = document.getElementById("fixed-charges-group-reverse");

    abattementReverseBtn.addEventListener("click", () => {
        fixedChargesGroupReverse.style.display = "none";
        abattementReverseBtn.classList.add("active");
        fixedChargesReverseBtn.classList.remove("active");
    });

    fixedChargesReverseBtn.addEventListener("click", () => {
        fixedChargesGroupReverse.style.display = "block";
        fixedChargesReverseBtn.classList.add("active");
        abattementReverseBtn.classList.remove("active");
    });

    // Revenu → Impôt logic
    const revenuInput = document.getElementById("revenu");
    const revenuTypeSelect = document.getElementById("revenu-type");
    const calculateRevenuToImpotBtn = document.getElementById("calculate-revenu-to-impot-btn");
    const taxPercentageElement = document.getElementById("tax-percentage");
    const thresholdBreakdownElement = document.getElementById("threshold-breakdown");
    const totalTaxElement = document.getElementById("total-tax");
    const missingMoneyElement = document.getElementById("missing-money");

    calculateRevenuToImpotBtn.addEventListener("click", () => {
        const revenu = parseFloat(revenuInput.value);
        if (isNaN(revenu)) {
            alert("Veuillez entrer un revenu valide.");
            return;
        }

        const revenuType = revenuTypeSelect.value;
        const yearlyRevenu = revenuType === "monthly" ? revenu * 12 : revenu;

        // Use the selected menu to determine the method
        const chargesType = abattementBtn.classList.contains("active") ? "abattement" : "fixed";
        const fixedCharges = chargesType === "fixed" ? parseFloat(document.getElementById("fixed-charges").value) || 0 : 0;

        let taxableIncome;
        if (chargesType === "abattement") {
            taxableIncome = yearlyRevenu * 0.9;
        } else {
            taxableIncome = yearlyRevenu - fixedCharges;
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
                <td>${threshold.rate * 100}</td>
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

        taxPercentageElement.textContent = `Taux d'imposition : ${taxPercentage.toFixed(2)} %`;
        totalTaxElement.textContent = `Impôt total : ${formatNumber(tax)}\u00A0€`;
        missingMoneyElement.textContent = `Il manque ${formatNumber(missingMoneyYearly)}\u00A0€ par an (${formatNumber(missingMoneyMonthly)}\u00A0€ par mois) pour atteindre la prochaine tranche.`;
    });

    // Impôt → Revenu logic
    const taxTypeSelect = document.getElementById("tax-type");
    const calculateImpotToRevenuBtn = document.getElementById("calculate-impot-to-revenu-btn");
    const estimatedRevenuElement = document.getElementById("estimated-revenu");

    calculateImpotToRevenuBtn.addEventListener("click", () => {
        // Use the selected menu to determine the method
        const isTaxPercentageMode = taxPercentageBtn.classList.contains("active");
        const chargesType = abattementReverseBtn.classList.contains("active") ? "abattement" : "fixed";
        const fixedCharges = chargesType === "fixed" ? parseFloat(document.getElementById("fixed-charges-reverse").value) || 0 : 0;

        if (isTaxPercentageMode) {
            const taxPercentage = parseFloat(document.getElementById("tax-percentage-input").value);
            if (isNaN(taxPercentage)) {
                alert("Veuillez entrer un pourcentage d'imposition valide.");
                return;
            }
            const estimatedRevenu = estimateRevenuFromTaxPercentage(taxPercentage, chargesType, fixedCharges);
            estimatedRevenuElement.textContent = `Revenu annuel estimé : ${formatNumber(estimatedRevenu.yearly)}\u00A0€ (Mensuel : ${formatNumber(estimatedRevenu.monthly)}\u00A0€)`;
        } else {
            const taxAmount = parseFloat(document.getElementById("tax-amount").value);
            if (isNaN(taxAmount)) {
                alert("Veuillez entrer un montant d'impôt valide.");
                return;
            }
            const taxType = taxTypeSelect.value;
            const yearlyTax = taxType === "monthly" ? taxAmount * 12 : taxAmount;
            const estimatedRevenu = estimateRevenuFromTax(yearlyTax, chargesType, fixedCharges);
            estimatedRevenuElement.textContent = `Revenu annuel estimé : ${formatNumber(estimatedRevenu.yearly)}\u00A0€ (Mensuel : ${formatNumber(estimatedRevenu.monthly)}\u00A0€)`;
        }
    });

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
