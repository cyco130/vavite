import { getAssetFromKV, NotFoundError } from "@cloudflare/kv-asset-handler";
import handler from "@vavite/handler";

addEventListener("fetch", async (event: FetchEvent) => {
	event.respondWith(generateResponse(event));
});

async function generateResponse(event: FetchEvent) {
	if (event.request.method === "GET") {
		try {
			return await getAssetFromKV(event);
		} catch (error) {
			if (!(error instanceof NotFoundError)) {
				console.error(error);
				return new Response("Internal Server Error", { status: 500 });
			}
		}
	}

	try {
		const url = new URL(event.request.url);
		const headers: Record<string, string> = Object.fromEntries(
			event.request.headers.entries(),
		);

		const response = await handler({
			raw: event,
			ip: event.request.headers.get("CF-Connecting-IP") || "",
			url,
			method: event.request.method,
			headers,
			body: {
				text: () => event.request.text(),

				binary: () =>
					event.request.arrayBuffer().then((buffer) => new Uint8Array(buffer)),

				async *stream() {
					if (!event.request.body) {
						return;
					}

					const reader = event.request.body.getReader();

					for (;;) {
						const chunk = await reader.read();
						if (chunk.done) {
							return;
						}

						yield chunk.value;
					}
				},
			},
		});

		if (!response) {
			return new Response("Not Found", { status: 404 });
		}

		if ("raw" in response) {
			return response.raw;
		}

		const body = response.body;

		const outHeaders = new Headers();

		for (const [key, value] of Object.entries(response.headers || {})) {
			if (value === undefined) continue;
			if (typeof value === "string") {
				outHeaders.set(key, value);
			} else {
				for (const v of value) {
					outHeaders.append(key, v);
				}
			}
		}

		if (!body || typeof body === "string" || body instanceof Uint8Array) {
			return new Response(body || "", {
				status: response.status,
				headers: outHeaders,
			});
		}

		let { readable, writable } = new TransformStream();

		async function pump() {
			const writer = writable.getWriter();
			const encoder = new TextEncoder();

			for await (let chunk of body!) {
				if (typeof chunk === "string") {
					chunk = encoder.encode(chunk);
				}

				writer.write(chunk);
			}

			writer.close();
		}

		event.waitUntil(pump());

		return new Response(readable, {
			status: response.status,
			headers: outHeaders,
		});
	} catch (error) {
		console.error(error);
		return new Response("Internal Server Error", { status: 500 });
	}
}
