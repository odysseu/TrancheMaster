
# TrancheMaster

**Calculator for *Impôt sur le Revenu* (IR), the French income tax.**

TrancheMaster helps you determine your tax bracket based on your income, or estimate the income required to reach a specific tax threshold. It uses the **official 2025 tax brackets** as published on [service-public.fr](https://www.service-public.fr/particuliers/actualites/A18045). For advanced simulations, you can also use [the official simulator](https://simulateur-ir-ifi.impots.gouv.fr/calcul_impot/2025/).

## Description 🤔

<details open>
  <summary>🇬🇧 English</summary>
  Welcome!
  **TrancheMaster** is a calculator for the French income tax (*Impôt sur le Revenu*). It allows you to:
  - Determine your tax bracket based on your income.
  - Estimate the income corresponding to a specific tax threshold.
  The simulator uses the **official 2025 tax brackets** to provide accurate, up-to-date results. Whether you're planning your finances or just curious, TrancheMaster simplifies understanding your tax obligations.
</details>

<details>
  <summary>🇫🇷 Français</summary>
  Bienvenue !
  **TrancheMaster** est une calculette pour l'*Impôt sur le Revenu* (IR) en France. Elle vous permet de :
  - Déterminer votre tranche d'imposition en fonction de vos revenus.
  - Estimer le revenu correspondant à un seuil d'impôt donné.
  Le simulateur utilise les **tranches officielles 2025** pour des résultats précis et actualisés. Que vous planifiez vos finances ou soyez simplement curieux, TrancheMaster rend vos obligations fiscales claires et accessibles.
</details>

<details>
  <summary>🇪🇸 Español</summary>
  ¡Bienvenido!
  **TrancheMaster** es una calculadora para el impuesto sobre la renta francés (*Impôt sur le Revenu*). Permite:
  - Determinar su tramo impositivo según sus ingresos.
  - Estimar los ingresos correspondientes a un umbral fiscal específico.
  El simulador utiliza las **escalas oficiales de 2025** para ofrecer resultados precisos y actualizados. Ya sea para planificar sus finanzas o por curiosidad, TrancheMaster simplifica la comprensión de sus obligaciones fiscales.
</details>

<details>
  <summary>🇩🇪 Deutsch</summary>
  Willkommen!
  **TrancheMaster** ist ein Rechner für die französische Einkommensteuer (*Impôt sur le Revenu*). Damit können Sie:
  - Ihre Steuerklasse basierend auf Ihrem Einkommen bestimmen.
  - Das Einkommen schätzen, das einem bestimmten Steuersatz entspricht.
  Der Simulator nutzt die **offiziellen Steuersätze 2025** für genaue und aktuelle Ergebnisse. Egal, ob Sie Ihre Finanzen planen oder einfach neugierig sind, TrancheMaster macht Ihre Steuerverpflichtungen verständlich.
</details>

## Quick Navigation 🗺️

- [🚀 App Link](#app-link-)
- [💻 Local Deployment](#deploy-and-try-locally-)
- [🧪 Testing](#testing-)
- [🔄 Tax Data Updater](#tax-data-updater-)

## App Link 🚀

Try the app directly: **[TrancheMaster on GitHub Pages](https://odysseu.github.io/TrancheMaster/)**


## Deploy and Try Locally 💻

This is a **static website** using local files and JavaScript packages from [jsDelivr CDN](https://cdn.jsdelivr.net).

### Prerequisites

- **git**: Ensure you have git (version 2 or higher) installed. Download it from [git-scm.com](https://git-scm.com/downloads
- **python**: Ensure you have python (version 3.5 or higher) installed. Download it from [python.org](https://www.python.org/downloads/).

### Deploy

If you wish to deploy the app localy and visualise it in your browser :

- Clone the Repository:

  ```sh
  git clone https://github.com/odysseu/TrancheMaster.git
  ```

- Go to the project root :

  ```
  cd TrancheMaster
  ```

- Launch the app :

  ```sh
  python -m http.server
  ```

- Open in your favorite browser `http://localhost:8000/`


### Hint if developing in codespace

If you're using codespace, for exemple the URL could be `https://fictional-something-...-end.github.dev`, then you can add in the URL `-8000.app` and will be able to see the app at `https://fictional-something-...-end-8000.app.github.dev`

## Testing 🧪

**Test Coverage :**

![Lines](./badges_output/lines_chart.svg) ![Statements](./badges_output/statements_chart.svg)  ![Branches](./badges_output/branches_chart.svg)  ![Functions](./badges_output/functions_chart.svg)

Special thanks to [js-coverage-badges](https://github.com/marialuisacp/js-coverage-badges) !

### Prerequisites

- **Node.js**: Ensure you have Node.js (version 16 or higher) installed. Download it from [nodejs.org](https://nodejs.org).
- **npm**: npm is included with Node.js. Ensure it's up-to-date.

### Setup

- Clone the Repository:

  ```sh
  git clone https://github.com/odysseu/TrancheMaster.git
  ```

- Go to the project root :

  ```sh
  cd HabitatCalc
  ```

- Install Dependencies:

  ```sh
  npm install
  ```

### Running Tests

To run the tests, use the following command:

  ```sh
  npm test
  ```

### Writing Tests

- **Framework**: We use [Jest](https://jestjs.io) for testing.
- **Test Files**: Place your test files in the `tests/` directory. Use the `.test.js` or `.spec.js` extensions.
- **Assertions**: Use Jest's built-in matchers for assertions.

#### Test files exemples

See the `*.test.js` files in the `tests/` directory for test file inspiration

## Tax Data Updater 🔄

**Automatically update tax thresholds from official French government sources**

The Tax Data Updater script fetches the latest tax bracket information and updates the application automatically.

### Quick Start

Run the updater in **2 simple steps**:

```bash
# 1. Navigate to js directory
cd js

# 2. Run the updater
node update_tax_data.js
```

That's it! The script will:
- ✅ Fetch latest tax data from official sources
- ✅ Update `data/tax_thresholds.json` with current thresholds
- ✅ Update HTML year selector with available years
- ✅ Update JavaScript tax calculator with new data

### Features

- **Automatic Data Fetching**: Retrieves from French Government Tax Portal and Legifrance
- **Robust Parsing**: Handles table and text-based tax data formats
- **Fallback System**: Uses current data if online sources are unavailable
- **Complete Updates**: JSON data, HTML selector, and JavaScript calculator
- **Comprehensive Testing**: Full test suite included
- **Safe Testing**: Dry-run mode and custom output paths prevent accidental data loss
- **Environment Variables**: Control output locations for safe experimentation

### Safety Features

The updater includes several safety mechanisms:

**Command Line Arguments:**
- `--test` or `-t` - Use test output files (writes to `data/test_tax_thresholds.json`)
- `--dry-run` or `-n` - Preview changes without modifying files
- `--test --dry-run` - Preview test mode changes

**Environment Variables:**
- `DRY_RUN=true` - Preview changes without writing files
- `TEST_MODE=true` - Use test output files
- `TAX_DATA_OUTPUT_JSON` - Custom JSON output path
- `TAX_DATA_OUTPUT_JS` - Custom JavaScript output path
- `TAX_DATA_OUTPUT_HTML` - Custom HTML output path

**Test Mode:**
```bash
node update_tax_data.js --test
```
Writes output to `data/test_tax_thresholds.json` instead of the production file.

**Dry Run Mode:**
```bash
node update_tax_data.js --dry-run
```
Shows what changes would be made without modifying any files.

### Scheduled Updates

For automatic monthly updates, add to your crontab:

```bash
# Run monthly on the 1st at 2 AM
0 2 1 * * cd /path/to/project/js && node update_tax_data.js >> /var/log/tax_updater.log 2>&1
```

### Manual Execution Options

**Direct Node.js:**
```bash
cd js
node update_tax_data.js
```

**Test Mode (Safe Testing):**
```bash
cd js
node update_tax_data.js --test
# or
node update_tax_data.js -t
```
This writes output to `data/test_tax_thresholds.json` instead of the production file.

**Dry Run (Preview Changes):**
```bash
cd js
node update_tax_data.js --dry-run
# or
node update_tax_data.js -n
```
Shows what changes would be made without modifying any files.

**Combined Test + Dry Run:**
```bash
cd js
node update_tax_data.js --test --dry-run
```
Preview changes that would be made in test mode.

**Custom Output Paths:**
```bash
cd js
TAX_DATA_OUTPUT_JSON="/tmp/test_tax_data.json" node update_tax_data.js
```

**Run Tests:**
```bash
cd js
npm test
```

### Troubleshooting

**Dependencies missing?**
```bash
cd scripts
npm install
```

**Permission issues?**
```bash
chmod +x scripts/*.sh scripts/*.js
```

**Network problems?** The script automatically falls back to current data if online sources are unavailable.

### Data Sources

The script fetches from:
- 🇫🇷 French Government Tax Portal: [impots.gouv.fr](https://www.impots.gouv.fr/)
- 📜 Official Journal of France: [legifrance.gouv.fr](https://www.legifrance.gouv.fr/)

### Manual Updates

If automatic fetching fails, you can manually edit:
1. `data/tax_thresholds.json` - Update the JSON data
2. `js/taxCalculator.js` - Update the `TAX_THRESHOLDS_BY_YEAR` object
3. `index.html` - Update the year selector options