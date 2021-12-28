export { default } from "./plugin";
export { parseRequest } from "./node-helpers";

export type RequestHandler = (
	request: IncomingRequest,
) =>
	| undefined
	| OutgoingResponse
	| RawResponse
	| Promise<undefined | OutgoingResponse | RawResponse>;

/** Environment agnostic representation of an HTTP request */
export interface IncomingRequest {
	/** Environment specific request representation */
	raw: any;
	/** IP address of the end user */
	ip: string;
	/** URL of the current request */
	url: URL;
	/** HTTP method */
	method: string;
	/** Request headers */
	headers: Record<string, string | undefined>;
	/** Request body */
	body: RequestBody;
}

/** Request body with streaming support */
export interface RequestBody {
	/** Read all as a UTF-8 encoded string */
	text(): Promise<string>;
	/** Read all as a an array of bytes */
	binary(): Promise<Uint8Array>;
	/** Read as a stream of bytes */
	stream(): AsyncGenerator<Uint8Array>;
}

export interface OutgoingResponse {
	/** HTTP status code */
	status?: number;
	/** Response headers */
	headers?: Record<string, undefined | string | string[]>;
	/** Response body */
	body?: ResponseBody;
}

export interface RawResponse {
	raw: any;
}

export type ResponseBody =
	| null
	| string
	| Uint8Array
	| AsyncGenerator<Uint8Array>
	| AsyncGenerator<string>;

export interface ViteManifest {
	[key: string]: ViteChunk;
}

export interface ViteChunk {
	file: string;
	imports?: string[];
	dynamicImports?: string[];
	css?: string[];
	assets?: string[];
}

export interface ViteSsrManifest {
	[key: string]: string[];
}

export interface VaviteConfig {
	serverEntry: string;
	clientOutDir: string;
	serverOutDir: string;
}
