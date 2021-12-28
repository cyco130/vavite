import { IncomingRequest } from "vavite";
import { RenderResult } from "../handler";

export default async function renderEchoText(
	req: IncomingRequest,
): Promise<RenderResult> {
	const body = await req.body.text();
	return { raw: body };
}
