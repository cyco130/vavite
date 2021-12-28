import userHandler from "@vavite/handler";
import type { NetlifyFunction } from "netlify-lambda-types";

export const handler: NetlifyFunction = async (event) => {
	try {
		const url = new URL(event.path, "https://" + event.headers.host);

		const reqBody = event.isBase64Encoded
			? Buffer.from(event.body, "base64")
			: event.body;

		const response = await userHandler({
			raw: event,
			ip: event.headers["x-nf-client-connection-ip"],
			url,
			method: event.httpMethod,
			headers: event.headers,
			body: {
				text: () => Promise.resolve(reqBody.toString()),
				binary: () => Promise.resolve(Buffer.from(reqBody)),
				async *stream() {
					yield this.binary();
				},
			},
		});

		if (!response) {
			return {
				statusCode: 404,
				body: "Not Found",
			};
		}

		if ("raw" in response) {
			return response.raw;
		}

		const headers: Record<string, string | undefined> = {};
		const multiValueHeaders: Record<string, string[]> = {};

		for (const [key, value] of Object.entries(response.headers || {})) {
			if (Array.isArray(value)) {
				multiValueHeaders[key] = value;
			} else {
				headers[key] = value;
			}
		}

		const resBody = response.body;
		let body: string;
		let isBase64Encoded = false;

		if (!resBody) {
			body = "";
		} else if (typeof resBody === "string") {
			body = resBody;
		} else if (resBody instanceof Uint8Array) {
			body = Buffer.from(resBody).toString("base64");
			isBase64Encoded = true;
		} else {
			const chunks: string[] | Buffer[] = [];

			for await (const chunk of resBody) {
				if (typeof chunk === "string") {
					chunks.push(chunk as any);
				} else {
					chunks.push(chunk as any);
				}
			}

			switch (typeof chunks[0]) {
				case "undefined":
					body = "";
					break;

				case "string":
					body = chunks.join("");
					break;

				default:
					body = Buffer.concat(chunks as Buffer[]).toString("base64");
					isBase64Encoded = true;
					break;
			}
		}

		return {
			statusCode: response.status || 200,
			headers,
			multiValueHeaders,
			body,
			isBase64Encoded,
		};
	} catch (error) {
		console.error(error);
		return {
			statusCode: 500,
			body: "Internal Server Error",
		};
	}
};
