export default {
	"**/*.ts?(x)": [
		() => "tsc -p packages/dev-server-methods/tsconfig.json --noEmit",
		"eslint --max-warnings 0 --ignore-pattern dist",
	],
	"*": "prettier --ignore-unknown --write",
};
