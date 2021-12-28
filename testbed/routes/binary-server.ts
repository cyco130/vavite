import { RenderResult } from "../handler";

export default function renderBinary(): RenderResult {
	return {
		raw: new TextEncoder().encode(
			"This is rendered as binary with non-ASCII chars 😊",
		),
	};
}
