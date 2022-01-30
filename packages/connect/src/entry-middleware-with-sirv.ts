import type { IncomingMessage, ServerResponse } from "http";
import sirv, { RequestHandler, Options } from "sirv";

let handleExports: {
	default: RequestHandler;
	sirvOptions?: Options;
};

let sirvHandler: RequestHandler;

async function init() {
	// @ts-expect-error: This is a virtual module
	// eslint-disable-next-line import/no-unresolved
	handleExports = await import("@vavite/connect/user-handler");

	sirvHandler = sirv(
		// @ts-expect-error: This will be defined by the plugin
		__VAVITE_CLIENT_BUILD_OUTPUT_DIR,
		handleExports.sirvOptions,
	);
}

const promise = init();

export default async function middleware(
	req: IncomingMessage,
	res: ServerResponse,
	next: () => void,
) {
	if (!sirvHandler) await promise;

	sirvHandler(req, res, () => {
		handleExports.default(req, res, next);
	});
}
