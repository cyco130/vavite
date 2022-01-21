export default {
	"**/*.ts?(x)": [
		() => "tsc -p packages/vavite/tsconfig.json --noEmit",
		"eslint --max-warnings 0 --ignore-pattern dist",
	],
	"*": "prettier --ignore-unknown --write",
};
