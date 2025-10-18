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

  // Update document title
  if (translations['title']) {
    document.title = translations['title'];
  }

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

// Initialize translations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load default language
  loadTranslations(currentLanguage);

  // Add event listener for language change
  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.addEventListener('change', () => {
      currentLanguage = languageSelect.value;
      localStorage.setItem('language', currentLanguage);
      loadTranslations(currentLanguage);
    });

    // Load saved language preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      currentLanguage = savedLanguage;
      languageSelect.value = currentLanguage;
    }
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
