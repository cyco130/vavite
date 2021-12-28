import { IncomingRequest } from "vavite";
import { RenderResult } from "../handler";

export default async function renderEchoBin(
	req: IncomingRequest,
): Promise<RenderResult> {
	const body = await req.body.binary();
	return { raw: body.join(", ") };
}
