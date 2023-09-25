# @vavite/multibuild

`@vavite/multibuild` is a tool for orchestrating multiple [Vite](https://vitejs.dev) builds. This package is the JavaScript API, check out [`@vavite/multibuild-cli`](../multibuild-cli) for the command line interface.

Developing applications that perform server-side rendering (SSR) with Vite requires two separate build steps: one for the client and one for the server. This library allows you to run both builds in a and customize the configuration for each build.

We're hoping that, eventually, [this feature will be implemented in Vite itself](https://github.com/vitejs/vite/issues/5936). This package exists to provide workaround until then.

## Usage

`@vavite/multibuild` extends the Vite configuration with a `buildSteps` property, which is an array of build step definitions. A build step definition is an object with a `name` property (which is simply a string naming the build step), and an optional `config` property which will be merged into the Vite configuration for the build step. For example, a client build followed by a server build can be defined like this:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  buildSteps: [
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
  ],
});
```

You can then `import { multibuild } from "@vavite/multibuild"` and use it instead of Vite's `build` function to run a multi-step build.

`@vavite/multibuild` will call `resolveConfig` with the `mode` parameter set to `"multibuild"` to extract the build steps. Setting `buildSteps` in subsequent steps has no effect.

## Sharing information between builds

`@vavite/multibuild` will call the `buildStepStart` hook on each plugin when a build step starts and pass it information about the current step and data forwarded from the previous step. The `buildStepEnd` hook will be called when the build step ends and its return value will be forwarded to the next step. If a promise is returned, it will be awaited first.

If no build steps are defined, `buildStepStart` and `buildStepEnd` will not be called.
