export {};

const pageNo = location.pathname.split("/").pop();

console.log(`Hello from page ${pageNo}`);

async function main() {
	for (;;) {
		const message = await fetch("/vavite/ready").then((r) => r.text());
		if (message.startsWith("file: ")) {
			const file = message.substring(6);

			let failed = false;
			await import("/" + file).catch((error) => {
				postMessage({
					type: "error",
					file,
					message: `Failed to load ${file}:\n${error}`,
				});
				failed = true;
			});

			if (!failed) {
				const runner = (globalThis as any).$vavite$run;

				if (!runner) {
					postMessage({
						type: "error",
						file,
						message: `To tests were found`,
					});
				} else {
					const results = await runner();
					postMessage({
						type: "results",
						file,
						results,
					});

					delete (globalThis as any).$vavite$run;
				}
			}
		} else {
			return;
		}
	}
}

main().finally(() => {
	fetch("/vavite/close", { method: "POST" });
});

async function postMessage(message: any) {
	await fetch("/vavite/message", {
		method: "POST",
		body: JSON.stringify(message),
	});
}
