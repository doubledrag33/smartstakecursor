module.exports = {
  root: true,
  env: { node: true, es2022: true, jest: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: 2022, sourceType: "module", project: false },
  plugins: ["@typescript-eslint", "import", "node"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:node/recommended",
    "prettier"
  ],
  rules: {
    "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "node/no-unsupported-features/es-syntax": "off",
    "import/order": [
      "warn",
      { groups: [["builtin", "external"], "internal", ["parent", "sibling", "index"]] }
    ],
    "max-len": ["warn", { code: 120 }]
  }
};