import { parentPort } from "worker_threads";
import { createServer } from "vite";

if (!parentPort) {
	throw new Error("Not in a worker");
}

async function main() {
	const server = await createServer({
		server: { hmr: false, middlewareMode: true },
		optimizeDeps: { include: ["vavite"] },
	});

	parentPort!.postMessage("ready");

	parentPort!.on("message", async (message: string) => {
		if (message.startsWith("file: ")) {
			const file = message.substring(6);

			let failed = false;
			await server.ssrLoadModule(file).catch((error) => {
				parentPort!.postMessage({
					type: "error",
					file,
					message: `Failed to load ${file}:\n${error}`,
				});
				failed = true;
			});

			if (!failed) {
				const runner = (globalThis as any).$vavite$run;

				if (!runner) {
					parentPort!.postMessage({
						type: "error",
						file,
						message: `To tests were found`,
					});
				} else {
					const results = await runner();
					parentPort!.postMessage({
						type: "results",
						file,
						results,
					});

					delete (globalThis as any).$vavite$run;
				}
			}

			parentPort!.postMessage("ready");
		} else {
			await server.close();
			process.exit(0);
		}
	});
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
