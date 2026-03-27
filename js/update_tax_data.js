#!/usr/bin/env node

/**
 * Tax Data Updater Script
 * 
 * This script:
 * 1. Fetches current tax threshold data from official sources
 * 2. Generates updated JSON file with year-specific data
 * 3. Updates the HTML year selector with available years
 * 4. Updates the JavaScript tax calculator with new data
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Parse command line arguments
const args = process.argv.slice(2);

// Show help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
📖 Tax Data Updater - Usage

Usage: node update_tax_data.js [options]

Options:
  --test, -t        Use test output files (data/test_tax_thresholds.json)
  --dry-run, -n     Dry run mode - preview changes without writing files
  --help, -h        Show this help message

Environment Variables:
  DRY_RUN=true      Enable dry run mode
  TEST_MODE=true    Enable test mode
  TAX_DATA_OUTPUT_JSON  Custom JSON output path
  TAX_DATA_OUTPUT_JS    Custom JavaScript output path
  TAX_DATA_OUTPUT_HTML  Custom HTML output path

Examples:
  node update_tax_data.js                    # Normal production run
  node update_tax_data.js --test             # Test mode (safe)
  node update_tax_data.js --dry-run          # Preview changes
  node update_tax_data.js --test --dry-run   # Preview test changes
  DRY_RUN=true node update_tax_data.js       # Dry run via env var
`);
  process.exit(0);
}

// Global state for dry-run mode and test mode
const DRY_RUN = process.env.DRY_RUN === 'true' || process.env.DRY_RUN === '1' || 
               args.includes('--dry-run') || args.includes('-n');
const TEST_MODE = process.env.TEST_MODE === 'true' || process.env.TEST_MODE === '1' ||
                  args.includes('--test') || args.includes('-t');

// Configuration
const CONFIG = {
  dataSources: [
    {
      name: 'French Government Tax Portal',
      url: 'https://www.impots.gouv.fr/portail/',
      selector: '#tax-thresholds-table',
      parser: 'frenchGovernmentParser'
    },
    {
      name: 'Official Journal of France', 
      url: 'https://www.legifrance.gouv.fr/',
      selector: '.tax-rates-section',
      parser: 'legifranceParser'
    }
  ],
  // Use environment variables for output paths to allow safe testing
  outputPaths: {
    jsonData: TEST_MODE 
      ? path.join(__dirname, '..', 'data', 'test_tax_thresholds.json')
      : (process.env.TAX_DATA_OUTPUT_JSON || path.join(__dirname, '..', 'data', 'tax_thresholds.json')),
    taxCalculator: process.env.TAX_DATA_OUTPUT_JS || path.join(__dirname, 'taxCalculator.js'),
    htmlFile: process.env.TAX_DATA_OUTPUT_HTML || path.join(__dirname, '..', 'index.html')
  },
  fallbackData: {
    // Current 2025 thresholds as fallback
    2025: [
      { min: 0, max: 11497, rate: 0 },
      { min: 11498, max: 29315, rate: 0.11 },
      { min: 29316, max: 83823, rate: 0.30 },
      { min: 83824, max: 180294, rate: 0.41 },
      { min: 180295, max: Infinity, rate: 0.45 }
    ]
  }
};

/**
 * Parse tax data from French Government Portal
 */
function frenchGovernmentParser(html) {
  try {
    const $ = cheerio.load(html);
    const thresholds = [];
    
    $('#tax-thresholds-table tr').each((i, row) => {
      if (i > 0) { // Skip header row
        const cells = $(row).find('td');
        if (cells.length >= 3) {
          thresholds.push({
            min: parseInt($(cells[0]).text().trim().replace(/\D/g, '')),
            max: $(cells[1]).text().trim().toLowerCase() === 'infinity' ? Infinity : parseInt($(cells[1]).text().trim().replace(/\D/g, '')),
            rate: parseFloat($(cells[2]).text().trim().replace('%', '').replace(',', '.')) / 100
          });
        }
      }
    });
    
    return thresholds.length > 0 ? thresholds : null;
  } catch (error) {
    console.warn('French Government parser failed:', error.message);
    return null;
  }
}

/**
 * Parse tax data from Legifrance
 */
function legifranceParser(html) {
  try {
    const $ = cheerio.load(html);
    const thresholds = [];
    
    $('.tax-rates-section .article-content p').each((i, paragraph) => {
      const text = $(paragraph).text().trim();
      const match = text.match(/(\d+)\s*à\s*(\d+|infinity)\s*:\s*(\d+(?:,\d+)?)\s*%/i);
      
      if (match) {
        thresholds.push({
          min: parseInt(match[1]),
          max: match[2].toLowerCase() === 'infinity' ? Infinity : parseInt(match[2]),
          rate: parseFloat(match[3].replace(',', '.')) / 100
        });
      }
    });
    
    return thresholds.length > 0 ? thresholds : null;
  } catch (error) {
    console.warn('Legifrance parser failed:', error.message);
    return null;
  }
}

/**
 * Fetch tax data from all sources
 */
async function fetchTaxData(year) {
  console.log(`🔍 Fetching tax data for year ${year}...`);
  
  for (const source of CONFIG.dataSources) {
    try {
      console.log(`  Trying ${source.name}...`);
      const response = await axios.get(source.url, {
        timeout: 10000,
        headers: { 'User-Agent': 'TaxDataUpdater/1.0' }
      });
      
      const parser = eval(source.parser);
      const data = parser(response.data);
      
      if (data && data.length > 0) {
        console.log(`  ✅ Successfully fetched data from ${source.name}`);
        return data;
      }
    } catch (error) {
      console.log(`  ❌ Failed to fetch from ${source.name}: ${error.message}`);
    }
  }
  
  console.log(`  ⚠️  Using fallback data for ${year}`);
  return CONFIG.fallbackData[year] || null;
}

/**
 * Generate complete tax thresholds data
 */
async function generateTaxData() {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  const result = {};
  
  console.log('🚀 Starting tax data generation...');
  
  for (const year of years) {
    const data = await fetchTaxData(year);
    if (data) {
      result[year] = data;
    }
  }
  
  // Ensure we have at least the current year
  if (!result[currentYear]) {
    result[currentYear] = CONFIG.fallbackData[2025];
  }
  
  console.log('✅ Tax data generation complete');
  return result;
}

/**
 * Write JSON data file
 */
function writeJsonData(data) {
  try {
    // Custom JSON stringify to handle Infinity properly
    const jsonContent = JSON.stringify(data, (key, value) => 
      value === Infinity ? 'Infinity' : value, 2
    );
    
    if (DRY_RUN) {
      console.log(`🔍 [DRY RUN] Would write tax data to ${CONFIG.outputPaths.jsonData}`);
      console.log('Generated JSON content:');
      console.log(jsonContent);
      return true;
    }
    
    fs.writeFileSync(CONFIG.outputPaths.jsonData, jsonContent, 'utf8');
    console.log(`📝 Written tax data to ${CONFIG.outputPaths.jsonData}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to write JSON data:', error.message);
    return false;
  }
}

/**
 * Update HTML year selector
 */
function updateHtmlYearSelector(years) {
  try {
    if (DRY_RUN) {
      const sortedYears = Object.keys(years).sort((a, b) => b - a);
      console.log(`🔍 [DRY RUN] Would update HTML year selector with years: ${sortedYears.join(', ')}`);
      return true;
    }
    
    let htmlContent = fs.readFileSync(CONFIG.outputPaths.htmlFile, 'utf8');
    
    // Find the year selector
    const selectorMatch = htmlContent.match(/<select id="year-select" class="year-select">[\s\S]*?<\/select>/);
    
    if (selectorMatch) {
      const sortedYears = Object.keys(years).sort((a, b) => b - a);
      const options = sortedYears.map(year => 
        `            <option value="${year}"${year === sortedYears[0] ? ' selected' : ''}>${year}</option>`
      ).join('\n');
      
      const newSelector = `<select id="year-select" class="year-select">\n${options}\n        </select>`;
      
      htmlContent = htmlContent.replace(selectorMatch[0], newSelector);
      fs.writeFileSync(CONFIG.outputPaths.htmlFile, htmlContent, 'utf8');
      
      console.log(`📝 Updated HTML year selector with years: ${sortedYears.join(', ')}`);
      return true;
    } else {
      console.warn('⚠️  Could not find year selector in HTML file');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to update HTML year selector:', error.message);
    return false;
  }
}

/**
 * Update JavaScript tax calculator
 */
function updateTaxCalculator(data) {
  try {
    // Generate the TAX_THRESHOLDS_BY_YEAR object string
    const yearsData = Object.entries(data).map(([year, thresholds]) => {
      const thresholdsStr = thresholds.map(t => 
        `    { min: ${t.min}, max: ${t.max === Infinity ? 'Infinity' : t.max}, rate: ${t.rate} }`
      ).join(',\n');
      
      return `  ${year}: [
${thresholdsStr}
  ]`;
    }).join(',\n');
    
    const newContent = `// Tax thresholds for different years
export const TAX_THRESHOLDS_BY_YEAR = {
${yearsData}
};`;
    
    if (DRY_RUN) {
      console.log(`🔍 [DRY RUN] Would update JavaScript tax calculator`);
      console.log('Generated JavaScript content:');
      console.log(newContent);
      return true;
    }
    
    let jsContent = fs.readFileSync(CONFIG.outputPaths.taxCalculator, 'utf8');
    
    // Replace the TAX_THRESHOLDS_BY_YEAR section
    const startMarker = '// Tax thresholds for different years';
    const endMarker = '};';
    
    const startIndex = jsContent.indexOf(startMarker);
    if (startIndex !== -1) {
      let endIndex = startIndex;
      let braceCount = 0;
      let foundEnd = true;
      
      for (let i = startIndex; i < jsContent.length; i++) {
        if (jsContent[i] === '{') braceCount++;
        if (jsContent[i] === '}') braceCount--;
        if (braceCount === 0 && jsContent.substring(i, i + 2) === '};') {
          endIndex = i + 2;
          foundEnd = true;
          break;
        }
      }
      
      if (foundEnd) {
        const newJsContent = jsContent.substring(0, startIndex) + newContent + jsContent.substring(endIndex);
        fs.writeFileSync(CONFIG.outputPaths.taxCalculator, newJsContent, 'utf8');
        console.log(`📝 Updated JavaScript tax calculator`);
        return true;
      }
    }
    
    console.warn('⚠️  Could not find TAX_THRESHOLDS_BY_YEAR section in tax calculator');
    return false;
  } catch (error) {
    console.error('❌ Failed to update tax calculator:', error.message);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔧 Tax Data Updater - Starting...\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE ACTIVE - No files will be modified\n');
  }
  if (TEST_MODE) {
    console.log('🧪 TEST MODE ACTIVE - Using test output files\n');
  }
  
  try {
    // Step 1: Generate tax data
    const taxData = await generateTaxData();
    
    // Step 2: Write JSON data file
    const jsonSuccess = writeJsonData(taxData);
    
    // Step 3: Update HTML year selector
    const htmlSuccess = updateHtmlYearSelector(taxData);
    
    // Step 4: Update JavaScript tax calculator
    const jsSuccess = updateTaxCalculator(taxData);
    
    // Summary
    console.log('\n📊 Update Summary:');
    console.log(`  JSON Data: ${jsonSuccess ? '✅ Updated' : '❌ Failed'}`);
    console.log(`  HTML Selector: ${htmlSuccess ? '✅ Updated' : '❌ Failed'}`);
    console.log(`  JS Calculator: ${jsSuccess ? '✅ Updated' : '❌ Failed'}`);
    
    if (jsonSuccess && htmlSuccess && jsSuccess) {
      if (DRY_RUN) {
        console.log('\n🎉 Dry run completed successfully! Use DRY_RUN=false to apply changes.');
      } else {
        console.log('\n🎉 All updates completed successfully!');
      }
    } else {
      console.log('\n⚠️  Some updates failed. Check logs above.');
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
  }
}

// Run the script
if (require.main === module) {
  // Check if required dependencies are installed
  try {
    require('axios');
    require('cheerio');
  } catch (error) {
    console.error('❌ Required dependencies not found. Please install them first:');
    console.error('   npm install axios cheerio');
    process.exit(1);
  }
  
  main();
}

// Export functions for testing
module.exports = {
  frenchGovernmentParser,
  legifranceParser,
  generateTaxData,
  writeJsonData,
  updateHtmlYearSelector,
  updateTaxCalculator
};