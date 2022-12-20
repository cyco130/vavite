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
	format?: null | "builtin" | "commonjs" | "json" | "module" | "wasm";
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
		return [specifier.slice(5)];
	} else if (specifier.startsWith("/@id/__x00__")) {
		return ["\0" + specifier.slice(12), true];
	} else if (specifier.startsWith("/@id/")) {
		return [specifier.slice(5), true];
	} else {
		return [specifier];
	}
}

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

	if (specifier.match(/\?ssrLoadModuleEntry$/) && context.parentURL) {
		specifier = specifier.slice(0, -"?ssrLoadModuleEntry".length);

		const resolved = await __vite_dev_server__.moduleGraph.resolveUrl(
			specifier,
			true,
		);

		if (resolved) {
			return {
				url: `vite:${specifier}${timestamp(resolved[1])}`,
				shortCircuit: true,
			};
		}
	} else if (context.parentURL?.startsWith("vite:")) {
		if (specifier[0] === "." || specifier[0] === "/") {
			const [unwrapped, isId] = unwrapSpecifier(specifier);

			if (isId) {
				return {
					url: "vite:" + unwrapped + timestamp(unwrapped),
					shortCircuit: true,
				};
			}

			const parent = context.parentURL.slice("vite:".length);

			const resolved = await __vite_dev_server__.pluginContainer.resolveId(
				unwrapped,
				parent,
				{ ssr: true },
			);

			if (resolved && !resolved.external) {
				const resolvedId = resolved.id.replace(/\0/g, "__x00__");

				return {
					url: "vite:" + resolvedId + timestamp(resolvedId),
					shortCircuit: true,
				};
			}
		}

		const parentId = context.parentURL.slice("vite:".length);
		const parentFile = (
			await __vite_dev_server__.moduleGraph.getModuleByUrl(parentId)
		)?.file;
		const parentURL = parentFile ? pathToFileURL(parentFile).href : parentId;
		const nexContext = { ...context, parentURL };

		try {
			return await nextResolve(specifier, nexContext);
		} catch (error) {
			const extensions = [
				".js",
				".cjs",
				".json",
				"/index.js",
				"/index.cjs",
				"/index.json",
			];

			for (const ext of extensions) {
				try {
					return await nextResolve(specifier + ext, nexContext);
				} catch {
					// Ignore
				}
			}

			throw error;
		}
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

	if (url.startsWith("vite:")) {
		const id = url.slice("vite:".length).replace(/__x00__/g, "\0");

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
		};
	}

	return nextLoad(url, context);
}
