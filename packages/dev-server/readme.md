# @vavite/dev-server

`@vavite/dev-server` is a [Vite](https://vitejs.dev) plugin for exposing the Vite development server during development. It can be used for accessing Vite development server methods such as `ssrFixStacktrace` and `transformIndexHtml` in [`vavite`](../vavite), [`@vavite/connect`](../connect), and [`@vavite/reloader`](../reloader) applications.

## Installation and usage

Install `vite` and `@vavite/dev-server` as development dependencies (`npm install --save-dev vite @vavite/dev-server`) and add `@vavite/dev-server` plugin to your Vite config:

```ts
import { defineConfig } from "vite";
import vaviteDevServer from "@vavite/dev-server";

export default defineConfig({
  plugins: [
    vaviteDevServer(),
  ],
});
```

Now you can import the dev server in your application with `import viteDevServer from @vavite/dev-server/server` during development. It will be available but its value will be `undefined` in production.

