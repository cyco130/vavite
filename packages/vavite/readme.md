# Va vite!

`vavite` is a [Vite](https://vitejs.dev) plugin for developing and building server-side applications, using Vite as the transpiler/bundler.

Vite, despite being mainly a frontend tool, has support for transpiling server-side code. The feature is intended for building [server-side rendering (SSR)](https://vitejs.dev/guide/ssr) applications. But it can be leveraged for building server-side applications that are not necessarily related to SSR. `vavite` lets you do that, but also simplifies the SSR workflow.

Vite's official SSR guide describes a workflow where Vite's development server is used as a middleware function in a server application made with a [Connect](https://github.com/senchalabs/connect) compatible Node.js framework (like [Express](https://expressjs.com)). If your server-side code needs transpilation (e.g. for TypeScript or JSX), you're required to use another set of tools (say [`ts-node`](https://typestrong.org/ts-node/) and [`nodemon`](https://nodemon.io/)) for development and building. `vavite` enables you to use Vite itself to transpile all of your server-side code.

## Operating modes

Vavite has two operating modes, determined by the `type` property of the entries you provide via the `entries` configuration option:

### Handler mode (`type: "runnable-handler"`)

In this mode, Vavite will import your entry and call the exported `node:http`-compatible request handler for incoming requests. This is the default mode and is suitable for most use cases. In this mode, your entry module will not be loaded until the first request comes in.

For production, you need to explicitly start the server by calling `app.listen` or similar in your entry module, guarded by `if (import.meta.env.COMMAND === "build") { ... }` to prevent it from running in development.

### Server mode (`type: "runnable-server"`)

In this mode, Vavite will run your entry which is expected to start a server on its own, on a separate port from the Vite's dev server. Vavite will proxy incoming requests to that server. This mode is less efficient and less well tested but it can be useful if you need control over server creation even in development or you want to use an HTTP serving library that is not compatible with `node:http`, like `Bun.serve`.

## Examples

The easiest way to start with Vavite is to follow the examples:

- Handler entry setups:
  - Server-only setups:
    - [simple-standalone](/examples/simple-standalone): Simple `node:http` server example ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/simple-standalone))
    - [express](/examples/express): Integrating with Express ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/express))
    - [koa](/examples/koa): Integrating with Koa ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/koa))
    - [fastify](/examples/fastify): Integrating with Fastify ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/fastify))
    - [hapi](/examples/hapi): Integrating with Hapi ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/hapi))
    - [Nest.js](/examples/nestjs): [Nest.js](https://nestjs.com/) with Express ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/nestjs))
  - SSR setups
    - [ssr-react-express](/examples/ssr-react-express): React SSR with Express ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/ssr-react-express))
  - Other examples
    - [resource-cleanup](/examples/resource-cleanup): Demonstrating patterns for cleaning up resources on hot reload
    - [ws](/examples/ws): WebSocket server example ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/ws))
- Server entry setups:
  - [express-server](/examples/express-server): Integrating with Express in server mode ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/express-server))
  - [bun-server](/examples/bun-server): Integrating with `Bun.serve` in server mode

## Usage

Install as a development dependency:

```sh
npm install --save-dev vavite
```

### Server-only setup

In this setup, Vavite will route requests to your handler or server before most of Vite's own middlewares, effectively bypassing Vite's most client-side features. You also need `appType: "custom"` and a `builder.buildApp` option to only build the server environment.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { vavite } from "vavite";

export default defineConfig({
  appType: "custom",
  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments.ssr!);
    },
  },
  plugins: [vavite()],
});
```

Then add a `src/entry.server.ts` (or name it explicitly via Vavite's `entries` option):

```ts
// entry.server.ts

// Alternatively, you can put the following in the `types` option of your tsconfig.json
/// <reference types="vite/client" />
/// <reference types="vavite/types" />

import { createServerApp } from "your-favorite-server-framework";

const app = FavoriteServerFramework.createServer();

// Add your middleware and routes here

// Default export a Connect-compatible handler for dev
export app.getNodeHttpHandler();

if (import.meta.env.COMMAND === "build") {
	// Start the server in production mode
	app.listen(3000, () => {
		console.log("Server is listening on http://localhost:3000");
	});
}

if (import.meta.hot) {
	import.meta.hot.accept();
}
```

### SSR setup

In this setup, Vavite will place your server handler after Vite's asset transformation pipeline. It will do it automatically if it detects a client entry in your Vite config. If it fails for any reason, use `vavite({ entries: [{ entry: "/src/entry.server", order: "post" }] })` to force it to insert the handler in the correct position.

```ts
// vite.config.ts

import { defineConfig } from "vite";
import { vavite } from "vavite";

export default defineConfig({
  appType: "custom",
  environments: {
    // Provide an explicit client entry and separate `outDir`s for each environment
    client: {
      build: {
        manifest: true,
        outDir: "dist/client",
        rollupOptions: {
          input: {
            "entry.client": "/src/entry.client.tsx",
          },
        },
      },
    },
    ssr: {
      build: {
        outDir: "dist/server",
      },
    },
  },

  plugins: [vavite()],
});
```

You can use `vite build --app` to build both environments or you can provide a `builder.buildApp` option to control the order of the builds.

### Other features

By default, Vavite will expose some information about the environment your code is running on:

- Use `import.meta.env.COMMAND` to check whether you're running under `vite serve` or after `vite build`.
- Use `import.meta.env.ENVIRONMENT` to get the current environment name (e.g. `"client"` or `"ssr"`).

For many SSR setups, you might require access to Vite's dev server instance. You can `import viteDevServer from "vavite:vite-dev-server"`. `viteDevServer` will be undefined in the production environment.

### Cleaning up resources on hot reload

Vavite supports hot module replacement (HMR) on the server. If you have any resources like database connections or WebSocket servers that need to be cleaned up on hot reload, use the `import.meta.hot.dispose` hook:

```ts
export const someResource = createSomeResource();

if (import.meta.hot) {
  import.meta.hot.accept();

  import.meta.hot.dispose(() => {
    someResource.cleanup();
  });
}
```

Alternatively, you can reuse the resource if its configuration hasn't changed with the following pattern:

```ts
import { createDbConnection } from "some-db-library";

const CONFIG = {
  // ...
};

if (import.meta.hot && import.meta.hot.data.oldConfig) {
  function isSameConfig(oldConfig: typeof CONFIG): boolean {
    return isDeepEqualInSomeSense(oldConfig, CONFIG);
  }

  if (!isSameConfig(import.meta.hot.data.oldConfig)) {
    console.log(
      "Config changed, will close the old database connection and create a new one",
    );
    import.meta.hot.data.oldDb.close();
    delete import.meta.hot.data.oldDb;
  } else {
    console.log("Config is the same, will reuse the same database connection");
  }
}

export const db = import.meta.hot?.data.oldDb ?? createDbConnection(CONFIG);

if (import.meta.hot) {
  import.meta.hot.accept();

  import.meta.hot.dispose(() => {
    import.meta.hot!.data.oldConfig = CONFIG;
    import.meta.hot!.data.oldDb = db;
  });
}
```

In the production build, Vite will remove all HMR-related code, so there will be no performance overhead.

## Migrating from v5

Vite has introduced a new [Environment API](https://vite.dev/guide/api-environment) that provides some of the functionality that Vavite used to provide in a much cleaner and efficient way out-of-the-box. As a result, Vavite v6 is a complete rewrite which is much leaner than v5. But it also means that there are some breaking changes.

### System requirements

- Node 20 or later (dropped support for Node 18)
- Vite v7 (dropped support for earlier versions)

### Removed packages

All packages under the `@vavite` namespace and the `vavite` CLI command are now gone:

- Instead of the `vavite` CLI command, just use `vite build --app` or the `builder.buildApp` configutation in your Vite config.
- `@vavite/connect`: Use the `type: "runnable-handler"` entry type.
- `@vavite/reloader`: Use the `type: "runnable-server"` entry type.
- `@vavite/expose-vite-dev-server`: Equivalent functionality is provided by the `exposeDevServer` configuration option.
- `@vavite/multibuild` and `@vavite/multibuild-cli`: Vite now provides better control on multiple builds via the `builder.buildApp` configutation option.
- `@vavite/node-loader`: This was an experiment that only worked in Node 16.

### Changed configuration options

- `handlerEntry` and `serverEntry` are replaced by the `entries` option. You can specify multiple entries with different types and order. The default entry is a handler entry at `/src/entry.server.ts`.
- `serveClientAssetsInDev` is gone. Use `entries.order` option to insert your handler before or after Vite's own middleware.
- `standalone` is gone. Explicitly start your server in production.
- `clientAssetsDir` and `bundleSirv` are gone. Explicitly insert a static file serving middleware in production.
- `reloadOn` is gone. Vite now supports a much more capable hot reloading on the server which solved the problem in a much better way.
- `useViteRuntime` is gone. It was an experimental feature of early versions of Vite 6, now replaced by the Environment API.

### Other changes needed in the Vite config

- Set `appType: "custom"` unless you really want Vite to server `index.html` for the `/` route.
- Remove `buildSteps` and use `vite build --app` or the `builder.buildApp` Vite config option to orchestrate the build process programmatically.

### Changes needed in your server code

- Do not call the `next` function from your exported handler entry, just end the response with a 404.
- Explicitly add code to start the server in production: `if (import.meta.env.COMMAND === "serve") { startMyServer(myHandler); }`
- Import `viteDevServer` from `vavite:vite-dev-server` instead of `vavite/vite-dev-server`.
- Add `if (import.meta.hot) { import.meta.hot.accept(); }` to your server entry file for better performance.

### Removed examples

- All `vike` (formerly `vite-plugin-ssr`) examples are removed. Vike itself provides equivalent functionality to load server-side code.
- Vue SSR example is removed. My Vue knowledge is limited and I don't want to mislead with a bad example. It should be possible for someone more knowledgeable to create a good example though. PRs are welcome!
