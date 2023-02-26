import { fileURLToPath, pathToFileURL } from "node:url";
import { ViteDevServer } from "vite";

declare global {
	// eslint-disable-next-line no-var
	var __vite_dev_server__: ViteDevServer | undefined;
	// eslint-disable-next-line no-var
	var __vavite_loader__: boolean;
}

global.__vavite_loader__ = true;

interface NodeResolveContext {
	/** Export conditions of the relevant package.json */
	conditions: string[];
	/** Import assertions */
	importAssertions: any;
	/** The module importing this one, or undefined if this is the Node.js entry point */
	parentURL?: string;
}

interface NodeResolveResult {
	/** A hint to the load hook (it might be ignored) */
	format?:
		| null
		| "builtin"
		| "commonjs"
		| "json"
		| "module"
		| "wasm"
		// These ones are to mark Vite URLs
		| "vite"
		| "vite-entry";
	/** A signal that this hook intends to terminate the chain of resolve hooks. Default: false */
	shortCircuit?: boolean;
	/** The absolute URL to which this input resolves */
	url: string;
}

interface NodeLoadContext {
	/** Export conditions of the relevant package.json */
	conditions: string[];
	/** The format optionally supplied by the resolve hook chain */
	format?: string | null;
	/** Import assertions */
	importAssertions: any;
}

interface NodeLoadResult {
	/** File format */
	format: string;
	/** A signal that this hook intends to terminate the chain of resolve hooks. Default: false */
	shortCircuit?: boolean;
	/** The source for Node.js to evaluate */
	source: string | ArrayBuffer | Uint8Array;
	/** Not sure? */
	responseURL?: string;
}

function timestamp(id: string): string {
	const ts =
		__vite_dev_server__?.moduleGraph.getModuleById(
			id,
		)?.lastInvalidationTimestamp;

	if (ts) {
		return `?t=${ts}`;
	}

	return "";
}

function unwrapSpecifier(
	specifier: string,
): [specifier: string, isId?: boolean] {
	if (specifier.startsWith("file:")) {
		return [fileURLToPath(specifier)];
	} else if (specifier.startsWith("vite:")) {
		return [specifier.slice(5), true];
		// } else if (specifier.startsWith("/@id/__x00__")) {
		// 	return ["\0" + specifier.slice(12), true];
	} else if (specifier.startsWith("/@id/")) {
		return [specifier.slice(5), true];
	} else {
		return [specifier];
	}
}

const viteUrlMap = new WeakMap<ViteDevServer, Set<string>>();
let projectRoot = "/";

export async function resolve(
	specifier: string,
	context: NodeResolveContext,
	nextResolve: (
		specifier: string,
		context: NodeResolveContext,
	) => Promise<NodeResolveResult>,
): Promise<NodeResolveResult> {
	if (typeof __vite_dev_server__ === "undefined") {
		return nextResolve(specifier, context);
	}

	projectRoot = __vite_dev_server__.config.root.replace(/\\/g, "/");

	let map = viteUrlMap.get(__vite_dev_server__);
	if (!map) {
		map = new Set();
		viteUrlMap.set(__vite_dev_server__, map);
	}

	if (specifier.match(/\?ssrLoadModuleEntry$/) && context.parentURL) {
		specifier = specifier.slice(0, -"?ssrLoadModuleEntry".length);

		const resolved = await __vite_dev_server__.moduleGraph.resolveUrl(
			specifier,
			true,
		);

		if (resolved) {
			const id = resolved[1];

			let url =
				(id.startsWith("/@id/") || id[0] === "\0" ? "vite:" : "file://") +
				id +
				timestamp(id);

			url = url.replace(/\0/g, "__x00__");

			map?.add(url);

			return {
				url,
				shortCircuit: true,
				format: "vite",
			};
		}
	} else if (context.parentURL && map?.has(context.parentURL)) {
		if (specifier[0] === "." || specifier[0] === "/") {
			const [unwrapped, isId] = unwrapSpecifier(specifier);

			if (isId) {
				const url = "vite:" + unwrapped + timestamp(unwrapped);
				map?.add(url);

				return {
					url,
					shortCircuit: true,
					format: "vite",
				};
			}

			const [parent] = unwrapSpecifier(context.parentURL);

			const resolved = await __vite_dev_server__.pluginContainer.resolveId(
				unwrapped,
				parent,
				{ ssr: true },
			);

			if (resolved && !resolved.external) {
				const id = resolved.id.replace(/\0/g, "__x00__");
				const url =
					(id.startsWith("/@id/") ? "vite:" : "file://") + id + timestamp(id);
				map?.add(url);

				return {
					url,
					shortCircuit: true,
					format: "vite",
				};
			}
		}

		let [parentId] = unwrapSpecifier(context.parentURL);
		if (parentId.startsWith(projectRoot + "/")) {
			parentId = parentId.slice(projectRoot.length);
		}
		const parentFile = (
			await __vite_dev_server__.moduleGraph.getModuleByUrl(parentId)
		)?.file;
		if (!parentFile) {
			return nextResolve(specifier, context);
		}
		const nextContext = {
			...context,
			parentURL: pathToFileURL(parentFile).href,
		};

		return await nextResolve(specifier, nextContext);
	}

	return nextResolve(specifier, context);
}

export async function load(
	url: string,
	context: NodeLoadContext,
	nextLoad: (url: string, context: NodeLoadContext) => Promise<NodeLoadResult>,
): Promise<NodeLoadResult> {
	if (typeof __vite_dev_server__ === "undefined") {
		return nextLoad(url, context);
	}

	if (context.format === "vite") {
		let id: string;
		let responseURL: string | undefined;
		if (url.startsWith("file://")) {
			id = url.slice(7);
			if (id.startsWith(projectRoot + "/")) {
				id = id.slice(projectRoot.length);
			}
		} else if (url.startsWith("vite:")) {
			id = url.slice(5);
			responseURL = url;
			id = id.replace(/__x00__/g, "\0");
		} else {
			throw new Error(`Invalid Vite url ${url}`);
		}

		const loaded = await __vite_dev_server__.transformRequest(id, {
			ssr: true,
		});

		if (!loaded) {
			throw new Error(`Failed to load module ${id}`);
		}

		let code = loaded.code;

		const map = loaded.map;

		if (map) {
			code += `\n//# sourceMappingURL=data:application/json;base64,${Buffer.from(
				JSON.stringify(map),
			).toString("base64")}`;
		}

		return {
			format: "module",
			source: code,
			shortCircuit: true,
			responseURL,
		};
	}

	return nextLoad(url, context);
}
