require("@cyco130/eslint-config/patch");

module.exports = {
	extends: ["@cyco130/eslint-config/node"],
	ignorePatterns: ["dist", "node_modules", "**/*.cjs", "cli.js"],
	parserOptions: { project: __dirname + "/tsconfig.json" },
};
