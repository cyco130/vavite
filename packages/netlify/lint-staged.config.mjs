export default {
	"**/*.ts?(x)": [
		() => "tsc -p packages/netlify/tsconfig.json --noEmit",
		// "eslint --max-warnings=0",
	],
	"*": "prettier --ignore-unknown --write",
};
