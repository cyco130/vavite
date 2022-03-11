# @vavite/expose-vite-dev-server

`@vavite/expose-vite-dev-server` is a [Vite](https://vitejs.dev) plugin for exposing the Vite development server to user code during development. It can be used for accessing Vite development server methods such as `ssrFixStacktrace` and `transformIndexHtml` in [`vavite`](../vavite), [`@vavite/connect`](../connect), and [`@vavite/reloader`](../reloader) applications.

## Installation and usage

Install `vite` and `@vavite/expose-vite-dev-server` as development dependencies (`npm install --save-dev vite @vavite/expose-vite-dev-server`) and add `@vavite/expose-vite-dev-server` plugin to your Vite config:

```ts
import { defineConfig } from "vite";
import exposeViteDevServer from "@vavite/expose-vite-dev-server";

export default defineConfig({
  plugins: [exposeViteDevServer()],
});
```

Now you can import the dev server in your application with `import viteDevServer from @vavite/expose-vite-dev-server/vite-dev-server` during development. In production, it will be available but its value will be `undefined`.
