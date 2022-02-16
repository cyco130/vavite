# @vavite/multibuild

`@vavite/multibuild` is a [Vite](https://vitejs.dev) plugin for triggering multiple builds with a single `vite build` command.

Developing applications that perform server-side rendering (SSR) with Vite requires two separate build steps: one for the client and one for the server. This plugin allows you to run both builds in a single `vite build` command and provides a mechanism to customize the configuration for each build.

We're hoping that, eventually, [this feature will be implemented in Vite itself](https://github.com/vitejs/vite/issues/5936). This package only exists to provide workaround until then.

## Installation and usage

Install `vite` and `@vavite/multibuild` as development dependencies (`npm install --save-dev vite @vavite/multibuild`) and add `@vavite/multibuild` to your Vite config:

```ts
import { defineConfig } from "vite";
import vaviteMultiBuild from "@vavite/multibuild";

export default defineConfig({
	plugins: [
		vaviteMultiBuild({
			buildSteps: [
				// Build step definitions
			],
		}),
	],
});
```

A build step definition is an objects with a `name` property (which is simply a string naming the build step), and an optional `config` property which will be merged into the Vite configuration for the build step. For example, a client build followed by a server build can be defined as:

```ts
[
	{
		name: "client",
		config: {
			build: {
				outDir: "dist/client",
				rollupOptions: {
					// Client entry
					input: "/client",
				},
			},
		},
	},
	{
		name: "server",
		config: {
			build: {
				// Server entry
				ssr: "/server",
				outDir: "dist/server",
			},
		},
	},
];
```

If no build steps are defined, the plugin is a no-op.

## Sharing information between builds

`@vavite/multibuild` will call the `vaviteBuildStepStart` hook on each user plugin when a build step starts and pass it information about the current step and data forwarded from the previous step. The `vaviteBuildStepEnd` hook will be called when the build step ends and its return value will be forwarded to the next step. If a promise is returned, it will be awaited first.

`vaviteBuildStepStart` is called during the execution of the `config` hook of `@vavite/multibuild` plugin. So, if you want to set configuration options depending on the build step, `@vavite/multibuild` should come before your plugin if it's `enforce` option is set to `pre`.

If no build steps are defined, `vaviteBuildStepStart` and `vaviteBuildStepEnd` will not be called.

## Limitations

`@vavite/multibuild` uses global state to share information between build steps. For this reason, concurrent builds in a single process (calling `build()` multiple times without awaiting the previous one) is not supported.

The configuration overrides for the very first build step are injected in the `config` hook of `@vavite/multibuild`. `config` hook is called after the plugins are resolved, which means the `plugins` option in the config override of the first build step will be ignored. The configuration injection happens during the `build` call for the other build steps, so they are not affected. You can use the `VAVITE_MULTIBUILD_CURRENT_STEP_INDEX` global variable which will contain the build step index to work around this limitation and inject plugins conditionally (its value will be `0` for the first build step).

When forwarding data between build steps, the name of the plugin is used as a key. If your plugin supports multiple instances, you should have unique names for each instance that match between builds if you want to share data between build steps.
