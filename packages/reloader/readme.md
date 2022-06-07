# @vavite/reloader

`@vavite/reloader` is a plugin for developing and building Node.js server applications with [Vite](https://vitejs.dev). It can be used with any Node.js server framework that allows you to provide your own `http.Server` instance, including but not limited to **Express**, **Koa**, **Fastify**, and **Hapi**.

## Installation and usage

Install `vite` and `@vavite/reloader` as development dependencies (`npm install --save-dev vite @vavite/reloader`) and add `@vavite/reloader` to your Vite config:

```ts
import { defineConfig } from "vite";
import vaviteReloader from "@vavite/reloader";

export default defineConfig({
  plugins: [
    vaviteReloader({
      // Options, see below
    }),
  ],
});
```

Then install the server framework of your choice (e.g. Express) and create a `server.ts` file in the root of your project. Write your initialization code in such a way that when `import.meta.env.PROD` is true, it creates a normal server instance and when it's false, it uses the `http.Server` instance default imported from `vavite/http-dev-server`. How to do this depends on the framework, you can refer to the [examples](#examples). Here's an example for Express:

```ts
import express from "express";
import httpDevServer from "@vavite/reloader/http-dev-server";

const app = express();

// Configure your server here
app.get("/", (req, res) => {
  res.send("Hello, world!");
});

if (import.meta.env.PROD) {
  // For production, start your server
  // as you would normally do.
  app.listen(3000, "localhost", () => {
    console.log("Server started on http://localhost:3000");
  });
} else {
  // For development, use httpDevServer.
  // An Express app instance is actually
  // a request listener function, this
  // is all we need to do:
  httpDevServer.on("request", app);
}
```

Now you can start the development server with `npx vite` and visit `http://localhost:3000/` to see the result. Your server will be reloaded when you make any changes to the code.

You can build your server application for production with `npx vite build --ssr` and start it with `node dist/server`.

## Lazy loading handlers

One of the most important advantages of Vite is its on-demand nature: Modules are only transpiled when they are actually used. By default, `@vavite/reloader` reloads your server entry every time one of its dependencies changes. Since the server entry is the the root of the dependency tree, this means _any_ change in your server-side code will trigger a full reload. Although it works, it doesn't tap into the full potential of Vite.

A typical Node.js server application lifecycle consists of two phases. The first is the initialization phase where you create and configure your server instance and the second is the request listening phase where the application services incoming requests as they come in. Typically, the initialization code changes less often and request listeners change more often and more granularly.

`@vavite/reloader` can be used to lazy load request handlers to avoid re-executing the initialization code unnecessarily: If you set the configuration option `reloadOn` to `"static-deps-change"` (instead of the default `"any-change"`), `@vavite/reloader` will not reload the server entry when its dynamically imported dependencies change. For example, if you have an Express route listener like this:

```ts
import routeHandler from "./route-handler";

app.get("/my-route", routeHandler);
```

You can avoid re-executing your initialization code by refactoring it like this:

```ts
app.get("/my-route", async (req, res, next) => {
  // Omitting error handling for clarity
  const routeHandler = (await import("./route-handler")).default;
  routeHandler(req, res, next);
});
```

This way, changes to your route handlers will not force a server reload and your route handler will only be transpiled and loaded when a request to the path `"/my-route"` comes in, greatly improving development-time performance.

If this lazy loading pattern feels too wordy, you can refactor it into a function suitable for your server framework. One possible implementation for Express could be:

```ts
function lazy(
  importer: () => Promise<{ default: RequestHandler }>,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const routeHandler = (await importer()).default;
      routeHandler(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

// When reloadOn option is set to "static-deps-change",
// changes to the route handlers will not trigger a reload.
app.get(
  "/foo",
  lazy(() => import("./routes/foo")),
);
app.get(
  "/bar",
  lazy(() => import("./routes/bar")),
);
app.get(
  "/baz",
  lazy(() => import("./routes/baz")),
);
```

## Options

### `entry: string = "/server"`

Server entry. The default value `"/server"` will resolve to `server.js`, `server.ts` etc. in your project root.

### `reloadOn: "any-change" | "static-deps-change" = "any-change"`

When to reload the server. `"any-change"` reloads every time any of the dependencies of the server entry changes. `"static-deps-change"` only reloads when statically imported dependencies change, dynamically imported dependencies are not tracked.

### `serveClientAssetsInDev: boolean = false`

Whether to serve client assets in development mode. Enable when developing full-stack applications.

> TODO: Currently HTML files are _not_ served regardless of this setting. An option to enable it is being considered.

## Other considerations

Unlike solutions like `nodemon` which restarts the whole server process on file changes, `@vavite/reloader` only re-executes the server entry in the same process which may cause global state to leak from old to new server instances. Since this is a novel approach, we don't know whether it will cause adverse effects on the internal operations of server frameworks.
