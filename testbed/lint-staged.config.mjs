export default {
	"**/*.ts?(x)": [
		() => "tsc -p testbed/tsconfig.json --noEmit",
		// "eslint --max-warnings=0",
	],
	"*": "prettier --ignore-unknown --write",
};
