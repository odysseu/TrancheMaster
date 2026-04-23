// Translation system
let translations = {};
let currentLanguage = 'fr';
let calculateRevenuToImpot;
let calculateImpotToRevenu;

// Function to load translations
async function loadTranslations(lang) {
  try {
    const response = await fetch(`translations/${lang}.json`);
    translations = await response.json();
    updateLanguage();
    updateSelectedLanguage();
    return translations;
  } catch (error) {
    console.error('Error loading translations:', error);
    return {};
  }
}

// Function to update language in UI
function updateLanguage() {
  // Update all elements with data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (translations[key]) {
      element.setAttribute('placeholder', translations[key]);
    }
  });

  // Update HTML lang attribute
  document.documentElement.lang = currentLanguage;

  // Trigger recalculations after language update
  if (typeof calculateRevenuToImpot === 'function' && document.getElementById('revenu-to-impot-section').classList.contains('active')) {
    calculateRevenuToImpot();
  } else if (typeof calculateImpotToRevenu === 'function' && document.getElementById('impot-to-revenu-section').classList.contains('active')) {
    calculateImpotToRevenu();
  }
}

// Function to get translation with placeholders
function getTranslation(key, ...args) {
  let translation = translations[key] || key;

  // Replace placeholders if any
  if (args.length > 0) {
    args.forEach((arg, index) => {
      translation = translation.replace(`{${index}}`, arg);
    });
  }

  return translation;
}

// Function to update selected language display
function updateSelectedLanguage() {
  const selectedLangEl = document.querySelector('.selected-language');
  if (selectedLangEl) {
    selectedLangEl.textContent = translations[`language-flag-${currentLanguage}`] || '';
  }
}

// Initialize Language Selector when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const customLanguageSelect = document.querySelector('.custom-language-select');
  const selectedLanguageEl = document.querySelector('.selected-language');
  const languageOptions = document.querySelectorAll('.language-option');

  // Load saved language preference first
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage) {
    currentLanguage = savedLanguage;
  }

  // Load default language and wait for it
  await loadTranslations(currentLanguage);

  // Add event listener for custom language selector
  if (customLanguageSelect && selectedLanguageEl) {
    const closeDropdown = () => customLanguageSelect.classList.remove('open');

    // Toggle dropdown on click
    selectedLanguageEl.addEventListener('click', (e) => {
      e.stopPropagation();
      customLanguageSelect.classList.toggle('open');
    });

    // Handle language option selection
    languageOptions.forEach(option => {
      option.addEventListener('click', async (e) => {
        e.stopPropagation();
        currentLanguage = option.dataset.value;
        localStorage.setItem('language', currentLanguage);
        await loadTranslations(currentLanguage);
        closeDropdown();
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', closeDropdown);

    // Prevent dropdown from closing when clicking inside
    customLanguageSelect.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Initialize selected language display with flag only
    updateSelectedLanguage();
  }
});

// Function to register calculation functions
function registerCalculationFunctions(revenuFunc, impotFunc) {
  calculateRevenuToImpot = revenuFunc;
  calculateImpotToRevenu = impotFunc;
}

// Export functions for use in other scripts
window.translationSystem = {
  getTranslation,
  loadTranslations,
  updateLanguage,
  currentLanguage,
  translations,
  registerCalculationFunctions
};
