import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const suppressPath = fileURLToPath(
	new URL("./suppress-warnings.cjs", import.meta.url).href,
);
const loaderPath = new URL("./index.js", import.meta.url).href;

const options =
	(process.env.NODE_OPTIONS ? process.env.NODE_OPTIONS + " " : "") +
	`-r ${JSON.stringify(suppressPath)} --loader ${loaderPath}`;

const command = process.argv[2];
const args = process.argv.slice(3);

// Run the command with the options
const cp = spawn(command, args, {
	shell: true,
	stdio: "inherit",
	env: {
		...process.env,
		NODE_OPTIONS: options,
	},
});

cp.on("error", (err) => {
	console.error(err);
	process.exit(1);
});

cp.on("exit", (code) => {
	process.exit(code ?? 0);
});
