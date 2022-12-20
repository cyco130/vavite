// Based on following code:
// https://github.com/esbuild-kit/tsx/blob/bd3ec4a5ed67545c044d6780fcd3187f0ff2f8a8/src/suppress-warnings.cts
// Copyright (c) Hiroki Osame <hiroki.osame@gmail.com>
// Under MIT License

const ignoreWarnings = new Set([
	"--experimental-loader is an experimental feature. This feature could change at any time",
	"Custom ESM Loaders is an experimental feature. This feature could change at any time",
]);

const { emit } = process;

process.emit = function (this: any, event: string, warning: Error) {
	if (event === "warning" && ignoreWarnings.has(warning.message)) {
		return;
	}

	// eslint-disable-next-line prefer-rest-params
	return Reflect.apply(emit, this, arguments);
} as any;
