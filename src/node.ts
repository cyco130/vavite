import path from "path";
import { Worker } from "worker_threads";
import glob from "fast-glob";
import { red, green, white } from "kleur/colors";
import { underline } from "kleur";
import { cpus } from "os";

async function main() {
	const fileSpecs = process.argv.slice(2);
	const files = await glob(fileSpecs);

	if (!files.length) {
		console.error("No tests found");
		process.exit(1);
	}

	let currentIndex = 0;
	let failed = false;
	let workerCount = Math.min(files.length, cpus().length);

	Array(workerCount)
		.fill(0)
		.map(() => new Worker(path.resolve(__dirname, "./worker.js")))
		.map((worker) => {
			worker.on("message", (msg: any) => {
				if (msg === "ready") {
					if (currentIndex >= files.length) {
						worker.postMessage("end");
					} else {
						worker.postMessage("file: " + files[currentIndex]);
						currentIndex++;
					}
				} else if (msg.type === "error") {
					console.log(msg.file);
					console.log(msg.message);
				} else if (msg.type === "results") {
					console.log(underline(white(msg.file)!));

					for (const result of msg.results) {
						const [test, error] = result as [string, string?];
						if (!error) {
							console.log(green("[PASS]"), test);
						} else {
							failed = true;
							console.log(red("[FAIL]"), test);
							console.log(
								"       " + error.split("\n").join("\n         ").trimEnd(),
							);
						}
					}

					console.log();
				}
			});

			worker.on("exitt", () => {
				workerCount--;

				if (!workerCount) {
					process.exit(failed ? 1 : 0);
				}
			});
		});
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
