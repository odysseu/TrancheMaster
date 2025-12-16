
# TrancheMaster

Calculator for _Impôt sur le Revenu_ (_IR_), the French income tax.

This simulator helps you determine your tax threshold based on your income, and vice versa, using the official 2025 tax brackets as published on [the official website](https://www.service-public.gouv.fr/particuliers/actualites/A18045). For more advanced simulations, you can also use [the official simulator](https://simulateur-ir-ifi.impots.gouv.fr/calcul_impot/2025/) for any more advanced simulation.

## Description 🤔

<details open>
  <summary>🇬🇧 English</summary>
  Welcome!
  **TrancheMaster** is a calculator for the French income tax (Impôt sur le Revenu). It allows you to determine your tax bracket based on your income, or estimate the income corresponding to a specific tax threshold. The simulator uses the official 2025 tax brackets to provide accurate results. Whether you're planning your finances or just curious, TrancheMaster helps you understand your <followup encodedFollowup="%7B%22id%22%3A%222ad6ce80-b134-4f54-a457-39e8ce82f2b9%22%2C%22snippet%22%3A%22tax%20obligations%20clearly%20and%20quickly%22%2C%22question%22%3A%22How%20does%20TrancheMaster%20simplify%20the%20process%20of%20understanding%20tax%20obligations%20compared%20to%20traditional%20methods%3F%22%7D" />.
</details>
<details>
  <summary>🇫🇷 Français</summary>
  Bienvenue !
  **TrancheMaster** est une calculette pour l'Impôt sur le Revenu (IR) en France. Elle vous permet de déterminer votre tranche d'imposition en fonction de vos revenus, ou d'estimer le revenu correspondant à un seuil d'impôt donné. Le simulateur utilise les tranches officielles de l'année 2025 pour vous fournir des résultats précis. Que vous planifiez vos finances ou que vous soyez simplement curieux, TrancheMaster vous aide à comprendre vos obligations fiscales de manière claire et rapide.
</details>
<details>
  <summary>🇪🇸 Español</summary>
  ¡Bienvenido!
  **TrancheMaster** es una calculadora para el impuesto sobre la renta francés (Impôt sur le Revenu). Le permite determinar su tramo impositivo según sus ingresos, o estimar los ingresos correspondientes a un umbral fiscal específico. El simulador utiliza las escalas oficiales del año 2025 para ofrecer resultados precisos. Ya sea que esté planificando sus finanzas o simplemente tenga curiosidad, TrancheMaster le ayuda a entender sus obligaciones fiscales de manera clara y rápida.
</details>
<details>
  <summary>🇩🇪 Deutsch</summary>
  Willkommen!
  **TrancheMaster** ist ein Rechner für die französische Einkommensteuer (Impôt sur le Revenu). Damit können Sie Ihre Steuerklasse basierend auf Ihrem Einkommen bestimmen oder das Einkommen schätzen, das einem bestimmten Steuersatz entspricht. Der Simulator verwendet die offiziellen Steuersätze des Jahres 2025, um genaue Ergebnisse zu liefern. Egal, ob Sie Ihre Finanzen planen oder einfach neugierig sind, TrancheMaster hilft Ihnen, Ihre Steuerverpflichtungen klar und schnell zu verstehen.
</details>

## App Link 🚀

This app is accessible [> on GitHub Pages <](https://odysseu.github.io/TrancheMaster/) (replace with your actual GitHub Pages link if available).


## Deploy and try the simulator locally 💻

This is a static website merely using local files and javascript packages downloaded from the [jsdeliver **C**ontent **D**elivery **N**etwork](https://cdn.jsdelivr.net).

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

![Lines](./badges_output/badge_lines.svg) ![Statements](./badges_output/badge_statements.svg)  ![Branches](./badges_output/badge_branches.svg)  ![Functions](./badges_output/badge_functions.svg)

### Prerequisites

- **Node.js**: Ensure you have Node.js (version 16 or higher) installed. Download it from [nodejs.org](https://nodejs.org).
- **npm**: npm is included with Node.js. Ensure it's up-to-date.

### Setup

- Clone the Repository:

  ```sh
  git clone https://github.com/odysseu/TrancheMaster.git
  ```

- Go to the project root :

  ```
  cd HabitatCalc
  ```

- Install Dependencies:

  ```
  npm install
  ```

### Running Tests

To run the tests, use the following command:

  ```
  npm test
  ```

### Writing Tests

- **Framework**: We use [Jest](https://jestjs.io) for testing.
- **Test Files**: Place your test files in the `tests/` directory. Use the `.test.js` or `.spec.js` extensions.
- **Assertions**: Use Jest's built-in matchers for assertions.

#### Test files exemples

See the `*.test.js` files in the `tests/` directory for test file inspiration