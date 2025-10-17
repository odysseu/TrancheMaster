// Tax thresholds for 2025 (example values, replace with actual thresholds)
const TAX_THRESHOLDS = [
    { min: 0, max: 11294, rate: 0 },
    { min: 11295, max: 28797, rate: 0.11 },
    { min: 28798, max: 82341, rate: 0.30 },
    { min: 82342, max: 177106, rate: 0.41 },
    { min: 177107, max: Infinity, rate: 0.45 }
];

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
    const methodRevenuToImpotText = document.getElementById("method-revenu-to-impot-text");

    abattementBtn.addEventListener("click", () => {
        fixedChargesGroup.style.display = "none";
        abattementBtn.classList.add("active");
        fixedChargesBtn.classList.remove("active");
        methodRevenuToImpotText.textContent = "Revenu brut - 10% (abattement forfaitaire) = Revenu imposable";
    });

    fixedChargesBtn.addEventListener("click", () => {
        fixedChargesGroup.style.display = "block";
        fixedChargesBtn.classList.add("active");
        abattementBtn.classList.remove("active");
        methodRevenuToImpotText.textContent = "Revenu brut - Frais réels = Revenu imposable";
    });

    // Impôt → Revenu: Percentage or value menu
    const taxPercentageBtn = document.getElementById("tax-percentage-btn");
    const taxAmountBtn = document.getElementById("tax-amount-btn");
    const taxPercentageGroup = document.getElementById("tax-percentage-group");
    const taxAmountGroup = document.getElementById("tax-amount-group");
    const methodImpotToRevenuTypeText = document.getElementById("method-impot-to-revenu-type-text");

    taxPercentageBtn.addEventListener("click", () => {
        taxPercentageGroup.style.display = "block";
        taxAmountGroup.style.display = "none";
        taxPercentageBtn.classList.add("active");
        taxAmountBtn.classList.remove("active");
        methodImpotToRevenuTypeText.textContent = "Estimation basée sur le pourcentage d'imposition";
    });

    taxAmountBtn.addEventListener("click", () => {
        taxAmountGroup.style.display = "block";
        taxPercentageGroup.style.display = "none";
        taxAmountBtn.classList.add("active");
        taxPercentageBtn.classList.remove("active");
        methodImpotToRevenuTypeText.textContent = "Estimation basée sur le montant de l'impôt";
    });

    // Impôt → Revenu: 10% or charges menu
    const abattementReverseBtn = document.getElementById("abattement-reverse-btn");
    const fixedChargesReverseBtn = document.getElementById("fixed-charges-reverse-btn");
    const fixedChargesGroupReverse = document.getElementById("fixed-charges-group-reverse");
    const methodImpotToRevenuChargesText = document.getElementById("method-impot-to-revenu-charges-text");

    abattementReverseBtn.addEventListener("click", () => {
        fixedChargesGroupReverse.style.display = "none";
        abattementReverseBtn.classList.add("active");
        fixedChargesReverseBtn.classList.remove("active");
        methodImpotToRevenuChargesText.textContent = "Revenu brut - 10% (abattement forfaitaire) = Revenu imposable";
    });

    fixedChargesReverseBtn.addEventListener("click", () => {
        fixedChargesGroupReverse.style.display = "block";
        fixedChargesReverseBtn.classList.add("active");
        abattementReverseBtn.classList.remove("active");
        methodImpotToRevenuChargesText.textContent = "Revenu brut - Frais réels = Revenu imposable";
    });

    // Revenu → Impôt logic
    const revenuInput = document.getElementById("revenu");
    const revenuTypeSelect = document.getElementById("revenu-type");
    const calculateRevenuToImpotBtn = document.getElementById("calculate-revenu-to-impot-btn");
    const taxPercentageElement = document.getElementById("tax-percentage");
    const moneyPerThresholdElement = document.getElementById("money-per-threshold");
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

        const tax = calculateTax(taxableIncome);
        const taxPercentage = (tax / yearlyRevenu) * 100;

        const currentThreshold = TAX_THRESHOLDS.find(threshold =>
            taxableIncome >= threshold.min && taxableIncome <= threshold.max
        );
        const nextThreshold = TAX_THRESHOLDS.find(threshold =>
            taxableIncome < threshold.min
        );

        let missingMoneyYearly = nextThreshold ? nextThreshold.min - taxableIncome : 0;
        let missingMoneyMonthly = missingMoneyYearly / 12;

        taxPercentageElement.textContent = `Taux d'imposition : ${taxPercentage.toFixed(2)}%`;
        moneyPerThresholdElement.textContent = `Impôt par tranche : ${formatMoneyPerThreshold(taxableIncome)}`;
        missingMoneyElement.textContent = `Il manque ${missingMoneyYearly.toFixed(2)}€ par an (${missingMoneyMonthly.toFixed(2)}€ par mois) pour atteindre la prochaine tranche.`;
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
            estimatedRevenuElement.textContent = `Revenu annuel estimé : ${estimatedRevenu.yearly.toFixed(2)}€ (Mensuel : ${estimatedRevenu.monthly.toFixed(2)}€)`;
        } else {
            const taxAmount = parseFloat(document.getElementById("tax-amount").value);
            if (isNaN(taxAmount)) {
                alert("Veuillez entrer un montant d'impôt valide.");
                return;
            }
            const taxType = taxTypeSelect.value;
            const yearlyTax = taxType === "monthly" ? taxAmount * 12 : taxAmount;
            const estimatedRevenu = estimateRevenuFromTax(yearlyTax, chargesType, fixedCharges);
            estimatedRevenuElement.textContent = `Revenu annuel estimé : ${estimatedRevenu.yearly.toFixed(2)}€ (Mensuel : ${estimatedRevenu.monthly.toFixed(2)}€)`;
        }
    });

    // Function to calculate tax based on taxable income
    function calculateTax(taxableIncome) {
        let tax = 0;
        for (const threshold of TAX_THRESHOLDS) {
            if (taxableIncome > threshold.min) {
                const taxableAmount = Math.min(taxableIncome, threshold.max) - threshold.min;
                tax += taxableAmount * threshold.rate;
            }
        }
        return tax;
    }

    // Function to format money per threshold
    function formatMoneyPerThreshold(taxableIncome) {
        let result = "";
        for (const threshold of TAX_THRESHOLDS) {
            if (taxableIncome > threshold.min) {
                const taxableAmount = Math.min(taxableIncome, threshold.max) - threshold.min;
                result += `${taxableAmount.toFixed(2)}€ à ${(threshold.rate * 100)}%, `;
            }
        }
        return result.slice(0, -2);
    }

    // Function to estimate revenu from tax amount
    function estimateRevenuFromTax(taxAmount, chargesType, fixedCharges) {
        // Simplified estimation: Assume taxable income is in the highest threshold
        let estimatedTaxableIncome = taxAmount / TAX_THRESHOLDS[TAX_THRESHOLDS.length - 1].rate;
        let estimatedRevenu = chargesType === "abattement" ?
            estimatedTaxableIncome / 0.9 :
            estimatedTaxableIncome + fixedCharges;
        return {
            yearly: estimatedRevenu,
            monthly: estimatedRevenu / 12
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
            yearly: estimatedRevenu,
            monthly: estimatedRevenu / 12
        };
    }
});
