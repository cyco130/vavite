export default {
	"**/*.ts?(x)": [
		() => "tsc -p packages/vavite/tsconfig.json --noEmit",
		// "eslint --max-warnings=0",
	],
	"*": "prettier --ignore-unknown --write",
};
