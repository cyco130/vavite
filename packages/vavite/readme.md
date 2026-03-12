# Va vite!

`vavite` is a [Vite](https://vitejs.dev) plugin for developing and building server-side applications, using Vite as the transpiler/bundler.

Vite, despite being mainly a frontend tool, has support for transpiling server-side code. The feature is intended for building [server-side rendering (SSR)](https://vitejs.dev/guide/ssr) applications. But it can be leveraged for building server-side applications that are not necessarily related to SSR. `vavite` lets you do that, but also simplifies the SSR workflow.

Vite's official SSR guide describes a workflow where Vite's development server is used as a middleware function in a server application made with a [Connect](https://github.com/senchalabs/connect) compatible Node.js framework (like [Express](https://expressjs.com)). If your server-side code needs transpilation (e.g. for TypeScript or JSX), you're required to use another set of tools (say [`ts-node`](https://typestrong.org/ts-node/) and [`nodemon`](https://nodemon.io/)) for development and building. `vavite` enables you to use Vite itself to transpile all of your server-side code.

## Getting started

1. Install `vavite` as a development dependency in your project.
   ```sh
   npm install --save-dev vavite
   ```
2. Add the `vavite` plugin to your Vite config.

   ```ts
   // vite.config.ts
   import { defineConfig } from "vite";
   import { vavite } from "vavite";

   export default defineConfig({
     appType: "custom", // Prevent Vite from serving index.html for the / route
     plugins: [
       vavite({
         // Optional configuration options go here
       }),
     ],
   });
   ```

3. Now you can create a handler or server entry (Vavite looks for `/src/entry.server.{js,ts,jsx,tsx}` by default).

## Entry types

Vavite recognizes two types of entries specified by the `type` property of the entries you provide via the `entries` configuration option: handler entries (`"runnable-handler"`, the default) and server entries (`"runnable-server"`).

Handler entries are expected to export a `node:http`-compatible request handler which will be added to Vite's dev server as a middleware. Server entries are expected to start a server on their own, on a separate port from the Vite's dev server. Vavite will proxy incoming requests to that server.

### Handler entries (`type: "runnable-handler"`)

Handler entries are expected to export a `node:http`-compatible request handler. For this entry type, during develompent (`vite dev`) Vavite will import your entry and call the exported handler for each incoming request. For production, you need to explicitly start the server.

The simplest handler entry looks like this:

```ts
// entry.server.ts

// Alternatively, you can put add these to the `types` option of your tsconfig.json
/// <reference types="vite/client" />
/// <reference types="vavite/types" />

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

// Default export a handler for dev
export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url === "/") {
    res
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .end("<h1>Hello from standalone!</h1>");
  } else {
    res.statusCode = 404;
    res.end("Not found");
  }
}

// Start the standalone server in production mode
if (import.meta.env.COMMAND === "build") {
  createServer(handler).listen(3000, () => {
    console.log("Server is listening on http://localhost:3000");
  });
}

// Enable hot module replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}
```

The above example uses `node:http` but it's possible to get a hold of a compatible handler from most Node.js server frameworks. See the examples for Express, Fastify, Koa, Hapi, and Nest.js for more details.

### Server entries (`type: "runnable-server"`)

Server entries are expected to start an HTTP server (on a separate port from the Vite's dev server) and process incoming requests. For development, Vavite will proxy incoming requests to that server. For production, your server will be the one directly receiving incoming requests.

Proxying is less efficient than direct function calls and is less well tested. But it is useful when you need control over server creation even in development or when you want to use an HTTP serving library that is not compatible with `node:http`, like `Bun.serve`.

Since this isn't the default entry type, you need to specify the entry type and the address it will be running on explicitly in the Vite config:

```ts
// vite.config.ts

// Alternatively, you can put add these to the `types` option of your tsconfig.json
/// <reference types="vite/client" />
/// <reference types="vavite/types" />

import { defineConfig } from "vite";
import { vavite } from "vavite";

export default defineConfig({
  appType: "custom", // Prevent Vite from serving index.html for the / route
  plugins: [
    vavite({
      entries: [
        {
          entry: "/src/entry.server",
          type: "runnable-server",
          proxyOptions: {
            target: "http://localhost:3000",
          },
        },
      ],
    }),
  ],
});
```

And the server entry itself looks like this:

```ts
// entry.server.ts
import { createServer } from "node:http";

createServer((req, res) => {
  if (req.url === "/") {
    res
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .end("<h1>Hello from standalone!</h1>");
  } else {
    res.statusCode = 404;
    res.end("Not found");
  }
}).listen(3000, () => {
  console.log("Server is listening on http://localhost:3000");
});
```

## Entry order

Each entry has an optional `order` property which can be either `"pre"` or `"post"`. It determines whether the entry will be placed before or after Vite's own middlewares. `"pre"` entries will run before Vite's middlewares while `"post"` entries will run after. If not specified, Vavite will try to automatically determine the order based on whether you have configured a client entry or not. If you have a client entry, the default order will be `"post"`, otherwise it will be `"pre"`.

`"pre"` entries are useful for server-only setups where you don't need Vite's client-side features or you need some processing before Vite's middlewares.

`"post"` entries are useful for SSR setups where you want to leverage Vite's asset transformation pipeline. In this case, you can import client assets in your server code and Vite will transform them correctly in development and production.

You can mark an entry with `final: true` to stop the request processing chain. Vavite will mark an entry as final by default if it is the last entry in the chain (respecting the pre/post order).

In development, non-final entries can pass unhandled requests to the next entry or Vite's own middlewares. This can be useful, for example, when you want to selectively pass some requests to Vite's own middlewares from `"pre"` entries. `/@vite/client` is a common example of this, since it needs to be handled by Vite's own middlewares for client-side HMR to work.

To forward unhandled requests in handler entries, just call the `next` function provided as the third argument. For server entries, return a response with status code 404 and the header `Vavite-Try-Next-Upstream` set to `true`. Note that the latter is less well tested and some proxy options might not work as expected when you use this feature.

In production, Vite's middleware stack will not exist so you will need to handle the processing order yourself. Typically, you will start a server for the frontmost entry and pass unhandled requests to the next handler by placing it in the middleware stack or to the next server by proxying.

### Server-only setup

In this setup, Vavite will route requests to your handler or server before most of Vite's own middlewares, effectively bypassing Vite's most client-side features. Typically, you also need `appType: "custom"` and a `builder.buildApp` option to only build the server environment.

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

### SSR setup

In this setup, Vavite will place your server handler after Vite's asset transformation pipeline.

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

In production, Vite's asset transformation pipeline will not exist. Instead, you will typically serve the built client assets with a static file serving middleware.

## Passing unhandled requests to the next entry or Vite

## Examples

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

## Other features and considerations

### Environment information and Vite dev server access

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

- For handler entry setups, explicitly add code to start the server in production: `if (import.meta.env.COMMAND === "serve") { startMyServer(myHandler); }`
- Import `viteDevServer` from `vavite:vite-dev-server` instead of `vavite/vite-dev-server`.
- Add `if (import.meta.hot) { import.meta.hot.accept(); }` to your server entry file for better performance.

### Removed examples

- All `vike` (formerly `vite-plugin-ssr`) examples are removed. Vike itself provides equivalent functionality to load server-side code.
- Vue SSR example is removed. My Vue knowledge is limited and I don't want to mislead with a bad example. It should be possible for someone more knowledgeable to create a good example though. PRs are welcome!
