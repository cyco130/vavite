import { IncomingRequest } from "vavite";
import { RenderResult } from "../handler";

export default async function renderEchoBinIterator(
	req: IncomingRequest,
): Promise<RenderResult> {
	const chunks: Uint8Array[] = [];

	for await (const chunk of req.body.stream()) {
		chunks.push(chunk);
	}

	const body = new Uint8Array(
		chunks.reduce((acc, chunk) => acc + chunk.length, 0),
	);
	let offset = 0;
	chunks.forEach((chunk) => {
		body.set(chunk, offset);
		offset += chunk.length;
	});

	return { raw: body.join(", ") };
}
