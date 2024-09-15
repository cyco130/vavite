# Va vite!

`vavite` is a set of tools for developing and building server-side applications with [Vite](https://vitejs.dev).

Vite, despite being a frontend tool, has support for transpiling server-side code. The feature is intended for building [server-side rendering (SSR)](https://vitejs.dev/guide/ssr.html) applications. But there's no reason why it can't be leveraged for building server-side applications that are not necessarily related to SSR. `vavite` lets you do that, but also vastly simplifies the SSR workflow.

Vite's official SSR guide describes a workflow where Vite's development server is used as a middleware function in a server application made with a [Connect](https://github.com/senchalabs/connect) compatible Node.js framework (like [Express](https://expressjs.com)). If your server-side code needs transpilation (e.g. for TypeScript), you're required to use another set of tools (say [`ts-node`](https://typestrong.org/ts-node/) and [`nodemon`](https://nodemon.io/)) for development and building. `vavite` enables you to use Vite itself to transpile your server-side code.

## Examples

- [simple-standalone](examples/simple-standalone): Simple standalone example ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/simple-standalone))
- [express](examples/express): Integrating with Express ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/express))
- [koa](examples/koa): Integrating with Koa ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/koa))
- [fastify](examples/fastify): Integrating with Fastify ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/fastify))
- [hapi](examples/hapi): Integrating with Hapi ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/hapi))
- [ssr-react-express](examples/ssr-react-express): React SSR with Express ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/ssr-react-express))
- [ssr-vue-express](examples/ssr-vue-express): Vue SSR with Express ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/ssr-vue-express))
- [vike](examples/vike): Vike with React and Express ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/vike))
- [socket-io](examples/socket-io): [socket.io](https://socket.io/) with Express ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/socket-io))
- [Nest.js](examples/nestjs): [Nest.js](https://nestjs.com/) with Express ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/nestjs))
- [Nest.js with vike](examples/nestjs-vike): [Nest.js](https://nestjs.com/) with Vike ([Stackblitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/nestjs-vike))

## Packages

[`vavite`](packages/vavite) is the main package that should work for most workflows but it is built on a set of lower level tools that you can use independently:

- [`@vavite/connect`](packages/connect) is a Vite plugin that turns the official SSR workflow around: Instead of mounting Vite's dev server into your application as a middleware function, you write your application in the form of a middleware function (with the `(req, res, next)` signature) and mount it into Vite's dev server. For production, you can provide a custom server entry or it can build a standalone Node.js server application for you. This workflow is best if you're only interested in handling requests and you don't need control over the server entry during development.

- If you do need control over your server entry even during development, [`@vavite/reloader`](packages/reloader) is a Vite plugin that provides live reloading capabilities for applications written with _any_ Node.js server framework. It should be usable with any framework that allows you to provide your own `http.Server` instance. **Note that this is a less reliable method and some things don't work on some operating systems.**

- [`@vavite/expose-vite-dev-server`](packages/expose-vite-dev-server) is a plugin that provides access to Vite's dev server by simply importing it. It's useful for accessing server methods like `ssrFixStacktrace` and `transformIndexHtml` during development using either `@vavite/connect` or `@vavite/reloader`.

- Building an SSR application with Vite involves at least two invocations of Vite's build command: once for the client and once for the server. [`@vavite/multibuild`](packages/multibuild) provides a JavaScript API for orchestrating multiple Vite builds and [`@vavite/multibuild-cli`](packages/multibuild-cli) is a drop-in replacement for the `vite build` CLI command for invoking multiple builds.

- [`@vavite/node-loader`](packages/node-loader) is a Vite plugin that makes it possible to debug SSR code with full support for sourcemaps and breakpoints. It uses a Node ESM loader behind the scenes.
