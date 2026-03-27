#!/usr/bin/env node

/**
 * Test script for the tax data updater
 */

const { 
  frenchGovernmentParser, 
  legifranceParser, 
  generateTaxData,
  writeJsonData,
  updateHtmlYearSelector,
  updateTaxCalculator 
} = require('./update_tax_data');

const fs = require('fs');
const path = require('path');

// Test variables
let testUpdatedContent;
let testUpdatedJsContent;

console.log('🧪 Testing Tax Data Updater...\n');

// Test data
const testHtml = `
<html>
<body>
  <table id="tax-thresholds-table">
    <tr><th>Min</th><th>Max</th><th>Rate</th></tr>
    <tr><td>0 €</td><td>11,497 €</td><td>0%</td></tr>
    <tr><td>11,498 €</td><td>29,315 €</td><td>11%</td></tr>
    <tr><td>29,316 €</td><td>83,823 €</td><td>30%</td></tr>
    <tr><td>83,824 €</td><td>180,294 €</td><td>41%</td></tr>
    <tr><td>180,295 €</td><td>Infinity</td><td>45%</td></tr>
  </table>
  
  <div class="tax-rates-section">
    <div class="article-content">
      <p>De 0 à 11497 : 0%</p>
      <p>De 11498 à 29315 : 11%</p>
      <p>De 29316 à 83823 : 30%</p>
    </div>
  </div>
</body>
</html>
`;

// Test parsers
console.log('1. Testing HTML Parsers...');

try {
  const frenchResult = frenchGovernmentParser(testHtml);
  console.log('   French Government Parser:', frenchResult ? '✅ PASS' : '❌ FAIL');
  if (frenchResult) {
    console.log('   Found thresholds:', frenchResult.length);
  }
} catch (error) {
  console.log('   French Government Parser: ❌ FAIL -', error.message);
}

try {
  const legifranceResult = legifranceParser(testHtml);
  console.log('   Legifrance Parser:', legifranceResult ? '✅ PASS' : '❌ FAIL');
  if (legifranceResult) {
    console.log('   Found thresholds:', legifranceResult.length);
  }
} catch (error) {
  console.log('   Legifrance Parser: ❌ FAIL -', error.message);
}

// Test JSON writing
console.log('\n2. Testing JSON Data Writing...');
try {
  const testData = {
    2025: [
      { min: 0, max: 11497, rate: 0 },
      { min: 11498, max: 29315, rate: 0.11 }
    ]
  };
  
  const testJsonPath = path.join(__dirname, 'test_output.json');
  // Create a mock CONFIG for testing
  const originalWriteFileSync = fs.writeFileSync;
  fs.writeFileSync = (path, content) => {
    if (path === testJsonPath) {
      originalWriteFileSync.call(fs, path, content);
    } else {
      originalWriteFileSync.call(fs, path, content);
    }
  };
  
  const result = writeJsonData(testData);
  
  // Restore original
  fs.writeFileSync = originalWriteFileSync;
  console.log('   JSON Writing:', result ? '✅ PASS' : '❌ FAIL');
  
  // Clean up
  if (fs.existsSync(testJsonPath)) {
    fs.unlinkSync(testJsonPath);
  }
} catch (error) {
  console.log('   JSON Writing: ❌ FAIL -', error.message);
}

// Test HTML selector update
console.log('\n3. Testing HTML Selector Update...');
try {
  const testHtmlPath = path.join(__dirname, 'test_index.html');
  const testHtmlContent = `
<!DOCTYPE html>
<html>
<body>
  <select id="year-select" class="year-select">
    <option value="2025" selected>2025</option>
  </select>
</body>
</html>`;
  
  // Create test file
  fs.writeFileSync(testHtmlPath, testHtmlContent);
  
  // Mock the CONFIG.outputPaths.htmlFile
  const originalReadFileSync = fs.readFileSync;
  const originalWriteFileSync = fs.writeFileSync;
  
  fs.readFileSync = (path) => {
    if (path === testHtmlPath) return testHtmlContent;
    return originalReadFileSync.call(fs, path);
  };
  
  fs.writeFileSync = (path, content) => {
    if (path === testHtmlPath) {
      // Store the result for verification
      testUpdatedContent = content;
    }
    originalWriteFileSync.call(fs, path, content);
  };
  
  const testData = { 2025: [], 2024: [], 2023: [] };
  const result = updateHtmlYearSelector(testData);
  
  // Restore originals
  fs.readFileSync = originalReadFileSync;
  fs.writeFileSync = originalWriteFileSync;
  console.log('   HTML Selector Update:', result ? '✅ PASS' : '❌ FAIL');
  
  // Verify the update
  if (result && testUpdatedContent) {
    const hasMultipleYears = testUpdatedContent.includes('2024') && testUpdatedContent.includes('2023');
    console.log('   Year options updated:', hasMultipleYears ? '✅ PASS' : '❌ FAIL');
  }
  
  // Clean up
  if (fs.existsSync(testHtmlPath)) {
    fs.unlinkSync(testHtmlPath);
  }
} catch (error) {
  console.log('   HTML Selector Update: ❌ FAIL -', error.message);
}

// Test JS calculator update
console.log('\n4. Testing JS Calculator Update...');
try {
  const testJsPath = path.join(__dirname, 'test_taxCalculator.js');
  const testJsContent = `
// Test file
// Tax thresholds for different years
export const TAX_THRESHOLDS_BY_YEAR = {
  2025: [
    { min: 0, max: 1000, rate: 0 }
  ]
};
`;
  
  // Create test file
  fs.writeFileSync(testJsPath, testJsContent);
  
  // Mock file operations
  const originalReadFileSync = fs.readFileSync;
  const originalWriteFileSync = fs.writeFileSync;
  
  fs.readFileSync = (path) => {
    if (path === testJsPath) return testJsContent;
    return originalReadFileSync.call(fs, path);
  };
  
  fs.writeFileSync = (path, content) => {
    if (path === testJsPath) {
      testUpdatedJsContent = content;
    }
    originalWriteFileSync.call(fs, path, content);
  };
  
  const testData = {
    2025: [{ min: 0, max: 11497, rate: 0 }],
    2024: [{ min: 0, max: 11294, rate: 0 }]
  };
  
  const result = updateTaxCalculator(testData);
  
  // Restore originals
  fs.readFileSync = originalReadFileSync;
  fs.writeFileSync = originalWriteFileSync;
  console.log('   JS Calculator Update:', result ? '✅ PASS' : '❌ FAIL');
  
  // Clean up
  if (fs.existsSync(testJsPath)) {
    fs.unlinkSync(testJsPath);
  }
} catch (error) {
  console.log('   JS Calculator Update: ❌ FAIL -', error.message);
}

console.log('\n🎉 Testing Complete!');
console.log('Run the full updater with: npm run update');