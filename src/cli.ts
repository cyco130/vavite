import { version } from "../package.json";
import glob from "fast-glob";

async function main() {
	const options: string[] = [];
	const args: string[] = [];
	let optionsDone = false;

	for (const arg of process.argv.slice(2)) {
		if (arg === "--") {
			optionsDone = true;
		} else if (!optionsDone && arg.startsWith("--")) {
			options.push(arg);
		} else {
			args.push(arg);
		}
	}

	let env: "node" | "chrome" | "firefox" | undefined;
	let executablePath: string | undefined;
	let headless = true;

	for (const option of options) {
		if (option === "--help") {
			printUsage();
			process.exit(0);
		} else if (option === "--version") {
			console.log(version);
			process.exit(0);
		} else if (["--node", "--chrome", "--firefox"].includes(option)) {
			if (env !== undefined) {
				console.error(`Error: Cannot specify more than one environment`);
				process.exit(1);
			}

			env = option.slice(2) as any;
		} else if (option.startsWith("--executable-path=")) {
			if (executablePath !== undefined) {
				console.error(`Error: Cannot specify more than one executable path`);
				process.exit(1);
			}

			executablePath = option.slice("--executable-path=".length);
		} else if (option.startsWith("--no-headless")) {
			headless = false;
		}
	}

	if (env === undefined) env = "node";

	const files = await glob(args);

	(env === "node" ? import("./node") : import("./browser"))
		.then(({ main }) =>
			main(files, { browser: env as any, executablePath, headless }),
		)
		.catch((error) => {
			console.error(error);
			process.exit(1);
		});
}

function printUsage() {
	console.log(`Usage: ${process.argv[1]} [options] [files]`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
