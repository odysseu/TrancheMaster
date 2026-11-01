#!/usr/bin/env node

/**
 * Test script for the tax data updater.
 *
 * Safe by construction: it points the updater's output paths at temporary
 * files via TAX_DATA_OUTPUT_* environment variables BEFORE requiring the
 * module, so the production files (index.html, taxCalculator.js,
 * data/tax_thresholds.json) are never touched.
 *
 * Run from the repo root:  npm run test:updater
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

// Redirect all outputs to a temp directory before loading the updater
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tax-updater-test-'));
process.env.TAX_DATA_OUTPUT_JSON = path.join(tmpDir, 'tax_thresholds.json');
process.env.TAX_DATA_OUTPUT_JS = path.join(tmpDir, 'taxCalculator.js');
process.env.TAX_DATA_OUTPUT_HTML = path.join(tmpDir, 'index.html');

const {
  wikipediaParser,
  parseAmount,
  parseRate,
  parseInterval,
  writeJsonData,
  updateHtmlYearSelector,
  updateTaxCalculator
} = require('./update_tax_data');

let failures = 0;
const check = (name, condition) => {
  console.log(`   ${name}: ${condition ? '✅ PASS' : '❌ FAIL'}`);
  if (!condition) failures++;
};

// Sample HTML mimicking the structure of the Wikipedia article
// "Barèmes de l'impôt sur le revenu en France"
const testHtml = `
<html>
<body>
<h2>Barème en vigueur</h2>
<table class="wikitable centre">
  <tr><th>Intervalles des revenus net imposable 2025 (euros)</th><th>Taux d'imposition (%)</th></tr>
  <tr><td>Jusqu'à 11&nbsp;600 euros</td><td>0&nbsp;%</td></tr>
  <tr><td>De 11&nbsp;601 à 29&nbsp;579 euros</td><td>11&nbsp;%</td></tr>
  <tr><td>De 29&nbsp;580 à 84&nbsp;577 euros</td><td>30&nbsp;%</td></tr>
  <tr><td>De 84&nbsp;578 à 181&nbsp;917 euros</td><td>41&nbsp;%</td></tr>
  <tr><td>Au-dessus de 181&nbsp;918 euros</td><td>45&nbsp;%</td></tr>
</table>

<h2>Barèmes historiques</h2>
<table class="wikitable centre">
  <tr><th>Intervalles des revenus net imposable 2010 et 2011 (euros)</th><th>Taux d'imposition (%)</th></tr>
  <tr><td>Jusqu'à 5&nbsp;963 euros</td><td>0&nbsp;%</td></tr>
  <tr><td>De 5&nbsp;964 à 11&nbsp;896 euros</td><td>5,5&nbsp;%</td></tr>
  <tr><td>Au-dessus de 11&nbsp;896 euros</td><td>14&nbsp;%</td></tr>
</table>
<table class="wikitable centre">
  <tr><th>Intervalles des revenus net imposable 2015 (euros)</th><th>Taux d'imposition (%)</th></tr>
  <tr><td>Jusqu'à 9&nbsp;700 euros</td><td>0&nbsp;%</td></tr>
  <tr><td>De 9&nbsp;700 à 26&nbsp;791 euros</td><td>14&nbsp;%</td></tr>
  <tr><td>Au-dessus de 26&nbsp;791 euros</td><td>30&nbsp;%</td></tr>
</table>
<table class="wikitable centre">
  <tr><th>Intervalles des revenus net imposable 2000 (FF)</th><th>Taux d'imposition (%)</th></tr>
  <tr><td>Jusqu'à 26&nbsp;600</td><td>0&nbsp;%</td></tr>
  <tr><td>Au-dessus de 26&nbsp;600</td><td>50&nbsp;%</td></tr>
</table>

<h2>Contribution exceptionnelle sur les hauts revenus</h2>
<table class="wikitable centre">
  <tr><th>Intervalles des revenus net imposable 2015 (euros)</th><th>Taux d'imposition (%)</th></tr>
  <tr><td>De 250&nbsp;000 à 500&nbsp;000 euros</td><td>3&nbsp;%</td></tr>
</table>
</body>
</html>
`;

console.log('🧪 Testing Tax Data Updater...\n');

console.log('1. Testing primitive parsers...');
check('parseAmount("11 600 euros")', parseAmount('11\u202f600 euros') === 11600);
check('parseRate("5,5 %")', parseRate('5,5 %') === 0.055);
check('parseInterval("Jusqu\'à 11 600 euros")', JSON.stringify(parseInterval("Jusqu'à 11 600 euros")) === '{"min":0,"max":11600}');
check('parseInterval("Au-dessus de 181 918 euros")', parseInterval('Au-dessus de 181 918 euros').max === Infinity);

console.log('\n2. Testing Wikipedia parser...');
const parsed = wikipediaParser(testHtml);
check('Parser returns data', parsed !== null);
// revenus 2025 => app year 2026
check('2026 barème (from "revenus 2025")', parsed && parsed['2026'] && parsed['2026'].length === 5
  && parsed['2026'][0].max === 11600 && parsed['2026'][1].min === 11601
  && parsed['2026'][4].max === Infinity && parsed['2026'][4].rate === 0.45);
// multi-year header "2010 et 2011" -> app years 2011 and 2012
check('multi-year header 2010 et 2011', parsed && parsed['2011'] && parsed['2012']
  && parsed['2011'][1].rate === 0.055 && parsed['2012'][1].min === 5964);
// overlapping wording normalized: "De 9 700 à ..." after "Jusqu'à 9 700" -> min 9701
check('overlap normalized (2016)', parsed && parsed['2016'] && parsed['2016'][1].min === 9701);
// FF table and CEHR table must be ignored
check('FF table ignored', parsed && !parsed['2001']);
check('CEHR table ignored (2016 kept clean)', parsed && parsed['2016'].length === 3);

console.log('\n3. Testing JSON Data Writing...');
const testData = {
  2026: [
    { min: 0, max: 11600, rate: 0 },
    { min: 11601, max: Infinity, rate: 0.11 }
  ],
  2025: [
    { min: 0, max: 11497, rate: 0 }
  ]
};
const jsonOk = writeJsonData(testData);
const jsonPath = process.env.TAX_DATA_OUTPUT_JSON;
const writtenJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
check('JSON Writing', jsonOk && writtenJson['2026'][1].max === 'Infinity'
  && writtenJson['2025'][0].max === 11497);

console.log('\n4. Testing HTML Selector Update...');
const htmlPath = process.env.TAX_DATA_OUTPUT_HTML;
fs.writeFileSync(htmlPath, `
<!DOCTYPE html>
<html>
<body>
  <select id="year-select" class="year-select" data-i18n-aria="year-select-aria">
    <option value="2025" selected>2025</option>
  </select>
</body>
</html>`);
const htmlOk = updateHtmlYearSelector(testData);
const updatedHtml = fs.readFileSync(htmlPath, 'utf8');
check('HTML Selector Update', htmlOk
  && updatedHtml.includes('value="2026" selected') && updatedHtml.includes('value="2025"')
  && updatedHtml.includes('data-i18n-aria="year-select-aria"'));

console.log('\n5. Testing JS Calculator Update...');
const jsPath = process.env.TAX_DATA_OUTPUT_JS;
fs.writeFileSync(jsPath, `// Tax calculator
// BEGIN DEFAULT_TAX_THRESHOLDS (managed by js/update_tax_data.js - do not edit manually)
const DEFAULT_TAX_THRESHOLDS = {
  2025: [
    { min: 0, max: 1000, rate: 0 }
  ]
};
// END DEFAULT_TAX_THRESHOLDS

export const TAX_THRESHOLDS = DEFAULT_TAX_THRESHOLDS[2025];
`);
const jsOk = updateTaxCalculator(testData);
const updatedJs = fs.readFileSync(jsPath, 'utf8');
check('JS Calculator Update', jsOk
  && updatedJs.includes('// BEGIN DEFAULT_TAX_THRESHOLDS')
  && updatedJs.includes('// END DEFAULT_TAX_THRESHOLDS')
  && updatedJs.includes('2026: [')
  && updatedJs.includes('{ min: 11601, max: Infinity, rate: 0.11 }')
  && updatedJs.includes('export const TAX_THRESHOLDS = DEFAULT_TAX_THRESHOLDS[2025];'));

// Cleanup temp files
fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(`\n${failures === 0 ? '🎉 All tests passed!' : `❌ ${failures} test(s) failed`}`);
console.log('Run the full updater with: npm run update:tax-data');
process.exit(failures === 0 ? 0 : 1);
