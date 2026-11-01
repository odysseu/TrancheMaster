#!/usr/bin/env node

/**
 * Tax Data Updater Script
 *
 * This script:
 * 1. Fetches the tax bracket tables from the single source:
 *    French Wikipedia - "Barèmes de l'impôt sur le revenu en France"
 * 2. Parses every euro-denominated barème table (current + historical)
 * 3. Generates updated JSON file with year-specific data
 * 4. Updates the HTML year selector with available years
 * 5. Updates the JavaScript tax calculator (marked DEFAULT_TAX_THRESHOLDS block)
 *
 * Year convention: Wikipedia labels a table by the income year ("revenus
 * net imposable 2025"), while this app labels the barème by the tax year
 * (the year the tax is paid/liquidated), so app year = Wikipedia year + 1.
 * Tables in francs (FF, pre-2002) and non-barème tables (e.g. the
 * "contribution exceptionnelle sur les hauts revenus") are ignored.
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
  node js/update_tax_data.js                    # Normal production run
  node js/update_tax_data.js --test             # Test mode (safe)
  node js/update_tax_data.js --dry-run          # Preview changes
  node js/update_tax_data.js --test --dry-run   # Preview test changes
  DRY_RUN=true node js/update_tax_data.js       # Dry run via env var
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
  source: {
    name: 'Wikipédia - Barèmes de l\'impôt sur le revenu en France',
    url: 'https://fr.wikipedia.org/wiki/Bar%C3%A8mes_de_l%27imp%C3%B4t_sur_le_revenu_en_France',
    parser: 'wikipediaParser'
  },
  // Use environment variables for output paths to allow safe testing.
  // In TEST_MODE every output defaults to a test file (never production).
  outputPaths: {
    jsonData: process.env.TAX_DATA_OUTPUT_JSON ||
      (TEST_MODE
        ? path.join(__dirname, '..', 'data', 'test_tax_thresholds.json')
        : path.join(__dirname, '..', 'data', 'tax_thresholds.json')),
    taxCalculator: process.env.TAX_DATA_OUTPUT_JS ||
      (TEST_MODE
        ? path.join(__dirname, 'test_taxCalculator.js')
        : path.join(__dirname, 'taxCalculator.js')),
    htmlFile: process.env.TAX_DATA_OUTPUT_HTML ||
      (TEST_MODE
        ? path.join(__dirname, '..', 'test_index.html')
        : path.join(__dirname, '..', 'index.html'))
  },
  fallbackData: {
    // Most recent known thresholds as last-resort fallback (tax year)
    2026: [
      { min: 0, max: 11600, rate: 0 },
      { min: 11601, max: 29579, rate: 0.11 },
      { min: 29580, max: 84577, rate: 0.30 },
      { min: 84578, max: 181917, rate: 0.41 },
      { min: 181918, max: Infinity, rate: 0.45 }
    ],
    2025: [
      { min: 0, max: 11497, rate: 0 },
      { min: 11498, max: 29315, rate: 0.11 },
      { min: 29316, max: 83823, rate: 0.30 },
      { min: 83824, max: 180294, rate: 0.41 },
      { min: 180295, max: Infinity, rate: 0.45 }
    ]
  }
};

// Markers delimiting the generated block in taxCalculator.js
const JS_BLOCK_START = '// BEGIN DEFAULT_TAX_THRESHOLDS';
const JS_BLOCK_END = '// END DEFAULT_TAX_THRESHOLDS';

// Most recent year available in the fallback data
const FALLBACK_YEARS = Object.keys(CONFIG.fallbackData).map(Number).sort((a, b) => b - a);
const LATEST_FALLBACK_YEAR = FALLBACK_YEARS[0];

/**
 * Parse a French-formatted amount: "11 600 euros" -> 11600
 * Handles regular spaces, no-break spaces (U+00A0) and narrow no-break
 * spaces (U+202F) used as thousands separators.
 */
function parseAmount(text) {
  const cleaned = (text || '').replace(/[\s   ]/g, '').replace(',', '.');
  const m = cleaned.match(/-?\d+(\.\d+)?/);
  return m ? Math.round(parseFloat(m[0])) : null;
}

/**
 * Parse a French-formatted rate: "5,5 %" -> 0.055
 */
function parseRate(text) {
  const cleaned = (text || '').replace(/[\s   ]/g, '').replace(',', '.');
  const m = cleaned.match(/(\d+(?:\.\d+)?)\s*%?/);
  if (!m) return null;
  // Round to 6 decimals to avoid floating point noise (38,54 % -> 0.3854)
  return Math.round((parseFloat(m[1]) / 100) * 1e6) / 1e6;
}

/**
 * Parse an interval cell: one of
 *   "Jusqu'à 11 600 euros"        -> { min: 0, max: 11600 }
 *   "De 11 601 à 29 579 euros"    -> { min: 11601, max: 29579 }
 *   "Au-dessus de 181 918 euros"  -> { min: 181918, max: Infinity }
 */
function parseInterval(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  let m = t.match(/^Jusqu'à\s+(.+?)\s*euros?$/i);
  if (m) {
    const max = parseAmount(m[1]);
    return max != null ? { min: 0, max } : null;
  }
  m = t.match(/^De\s+(.+?)\s+à\s+(.+?)\s*euros?$/i);
  if (m) {
    const min = parseAmount(m[1]);
    const max = parseAmount(m[2]);
    return (min != null && max != null) ? { min, max } : null;
  }
  m = t.match(/^(?:Au-dessus de|Plus de)\s+(.+?)\s*euros?$/i);
  if (m) {
    const min = parseAmount(m[1]);
    return min != null ? { min, max: Infinity } : null;
  }
  return null;
}

/**
 * Wikipedia parser: extracts every euro barème table of the page.
 * Returns { appYear: [ { min, max, rate }, ... ], ... } or null on failure.
 *
 * Only tables under the "Barème en vigueur" / "Barèmes historiques"
 * sections are parsed, and only columns headed "...(euros)" — this skips
 * franc (FF) tables and unrelated tables (e.g. contribution exceptionnelle
 * sur les hauts revenus, which reuses a "revenus 2015" header).
 */
function wikipediaParser(html) {
  try {
    const $ = cheerio.load(html);
    const results = {};
    let section = '';

    // Walk headings and tables in document order to know each table's section
    $('h2, table').each((i, el) => {
      if (el.tagName === 'h2') {
        section = $(el).text().trim();
        return;
      }
      if (!/Bar[eè]me en vigueur|Bar[eè]mes historiques/i.test(section)) return;

      const table = $(el);
      const headerCells = table.find('tr').first().find('th, td').toArray();

      // Locate the rate column and the euro interval column(s)
      let rateCol = -1;
      const intervalCols = [];
      headerCells.forEach((cell, idx) => {
        const txt = $(cell).text();
        if (/Taux d'imposition/i.test(txt)) rateCol = idx;
        if (/Intervalles des revenus[^()]*\(euros?\)/i.test(txt)) {
          // Header may cover several years: "2010 et 2011 (euros)"
          const years = (txt.match(/\d{4}/g) || []).map(Number);
          if (years.length > 0) intervalCols.push({ idx, years });
        }
      });
      if (rateCol === -1 || intervalCols.length === 0) return;

      table.find('tr').slice(1).each((ri, tr) => {
        const cells = $(tr).find('th, td').toArray();
        const rate = parseRate($(cells[rateCol]).text());
        if (rate == null) return; // skip empty / note rows
        for (const col of intervalCols) {
          const interval = parseInterval($(cells[col.idx]).text());
          if (!interval) continue;
          for (const wikiYear of col.years) {
            // revenus N => barème de l'année d'imposition N + 1
            const appYear = wikiYear + 1;
            (results[appYear] = results[appYear] || []).push({ ...interval, rate });
          }
        }
      });
    });

    // Normalize each year: sort by min, first bracket starts at 0 and each
    // following bracket starts right after the previous one (the Wikipedia
    // wording sometimes overlaps, e.g. "Jusqu'à 9 700" / "De 9 700 à ...")
    for (const year of Object.keys(results)) {
      const rows = results[year].sort((a, b) => a.min - b.min);
      rows.forEach((row, i) => {
        row.min = i === 0 ? 0 : rows[i - 1].max + 1;
      });
      results[year] = rows;
    }

    return Object.keys(results).length > 0 ? results : null;
  } catch (error) {
    console.warn('Wikipedia parser failed:', error.message);
    return null;
  }
}

// Parser registry: maps the `parser` name in CONFIG.source to a function.
// Never resolve parsers dynamically (no eval) so CodeQL and readers can follow the flow.
const PARSERS = {
  wikipediaParser
};

/**
 * Sanity-check one year of parsed data
 */
function isValidYearData(thresholds) {
  return Array.isArray(thresholds) && thresholds.length >= 2 &&
    thresholds[0].min === 0 && thresholds[0].rate === 0 &&
    thresholds[thresholds.length - 1].max === Infinity &&
    thresholds.every((t, i) => i === 0 || t.min === thresholds[i - 1].max + 1);
}

/**
 * Fetch and parse tax data from the configured source
 */
async function fetchTaxData() {
  const source = CONFIG.source;
  console.log(`🔍 Fetching tax data from ${source.name}...`);
  console.log(`  ${source.url}`);
  try {
    const response = await axios.get(source.url, {
      timeout: 15000,
      headers: {
        // Wikipedia requires a descriptive User-Agent
        'User-Agent': 'TrancheMasterTaxUpdater/1.0 (https://github.com/odysseu/TrancheMaster)'
      }
    });

    const parser = PARSERS[source.parser];
    if (typeof parser !== 'function') {
      console.log(`  ❌ Unknown parser "${source.parser}"`);
      return null;
    }
    const data = parser(response.data);
    if (data) {
      const years = Object.keys(data).map(Number).sort((a, b) => a - b);
      console.log(`  ✅ Parsed ${years.length} barèmes (years ${years[0]}–${years[years.length - 1]})`);
      return data;
    }
    console.log('  ❌ Parser returned no data');
    return null;
  } catch (error) {
    console.log(`  ❌ Failed to fetch/parse: ${error.message}`);
    return null;
  }
}

/**
 * Generate complete tax thresholds data, with fallback for missing years
 */
async function generateTaxData() {
  console.log('🚀 Starting tax data generation...');

  let result = await fetchTaxData();

  if (!result) {
    console.log(`  ⚠️  Using fallback data (${LATEST_FALLBACK_YEAR} brackets)`);
    result = {};
    for (const year of FALLBACK_YEARS) {
      result[year] = CONFIG.fallbackData[year];
    }
  } else {
    // Drop invalid years, keep only valid barèmes
    for (const year of Object.keys(result)) {
      if (!isValidYearData(result[year])) {
        console.log(`  ⚠️  Dropping invalid data for year ${year}`);
        delete result[year];
      }
    }
  }

  // Ensure we have at least the current and previous tax years
  const currentYear = new Date().getFullYear();
  for (const year of [currentYear, currentYear - 1]) {
    if (!result[year]) {
      result[year] = CONFIG.fallbackData[year] || CONFIG.fallbackData[LATEST_FALLBACK_YEAR];
      console.log(`  ⚠️  Year ${year} missing from source, using fallback data`);
    }
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
      console.log('Generated JSON content (first 500 chars):');
      console.log(jsonContent.slice(0, 500) + '...');
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
    const selectorMatch = htmlContent.match(/<select id="year-select" class="year-select"[\s\S]*?<\/select>/);

    if (selectorMatch) {
      const sortedYears = Object.keys(years).sort((a, b) => b - a);
      const options = sortedYears.map(year =>
        `                    <option value="${year}"${year === sortedYears[0] ? ' selected' : ''}>${year}</option>`
      ).join('\n');

      const newSelector = `<select id="year-select" class="year-select" data-i18n-aria="year-select-aria">\n${options}\n                </select>`;

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
 * Update JavaScript tax calculator: replace the marked DEFAULT_TAX_THRESHOLDS block
 */
function updateTaxCalculator(data) {
  try {
    // Generate the DEFAULT_TAX_THRESHOLDS block (years sorted descending)
    const sortedYears = Object.keys(data).sort((a, b) => b - a);
    const yearsData = sortedYears.map(year => {
      const thresholdsStr = data[year].map(t =>
        `    { min: ${t.min}, max: ${t.max === Infinity ? 'Infinity' : t.max}, rate: ${t.rate} }`
      ).join(',\n');

      return `  ${year}: [\n${thresholdsStr}\n  ]`;
    }).join(',\n');

    const newBlock = `${JS_BLOCK_START} (managed by js/update_tax_data.js - do not edit manually)\nconst DEFAULT_TAX_THRESHOLDS = {\n${yearsData}\n};\n${JS_BLOCK_END}`;

    if (DRY_RUN) {
      console.log(`🔍 [DRY RUN] Would update JavaScript tax calculator`);
      console.log('Generated JavaScript content (first 500 chars):');
      console.log(newBlock.slice(0, 500) + '...');
      return true;
    }

    const jsContent = fs.readFileSync(CONFIG.outputPaths.taxCalculator, 'utf8');

    // Replace the marked DEFAULT_TAX_THRESHOLDS block
    const startIndex = jsContent.indexOf(JS_BLOCK_START);
    const endIndex = jsContent.indexOf(JS_BLOCK_END);
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
      const newJsContent = jsContent.substring(0, startIndex) + newBlock + jsContent.substring(endIndex + JS_BLOCK_END.length);
      fs.writeFileSync(CONFIG.outputPaths.taxCalculator, newJsContent, 'utf8');
      console.log(`📝 Updated JavaScript tax calculator (years: ${sortedYears.join(', ')})`);
      return true;
    }

    console.warn(`⚠️  Could not find ${JS_BLOCK_START} / ${JS_BLOCK_END} markers in tax calculator`);
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
    // In test mode, seed the test output files from production (if missing)
    // so the HTML/JS update steps can be exercised without touching production
    if (TEST_MODE) {
      const pairs = [
        [path.join(__dirname, '..', 'index.html'), CONFIG.outputPaths.htmlFile],
        [path.join(__dirname, 'taxCalculator.js'), CONFIG.outputPaths.taxCalculator]
      ];
      for (const [prod, test] of pairs) {
        if (!fs.existsSync(test) && fs.existsSync(prod)) {
          fs.copyFileSync(prod, test);
        }
      }
    }

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
    console.error('   npm install');
    process.exit(1);
  }

  main();
}

// Export functions for testing
module.exports = {
  wikipediaParser,
  parseAmount,
  parseRate,
  parseInterval,
  isValidYearData,
  generateTaxData,
  writeJsonData,
  updateHtmlYearSelector,
  updateTaxCalculator
};
