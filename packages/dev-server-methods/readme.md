# @vavite/dev-server-methods

`@vavite/dev-server-methods` is a [Vite](https://vitejs.dev) plugin for exposing some of the Vite development server methods during development and their stubs for production. It's useful for rendering HTML and fixing stack traces in [`vavite`](../vavite), [`@vavite/connect`](../connect), and [`@vavite/reloader`](../reloader) applications.

## Installation and usage

Install `vite` and `@vavite/dev-server-methods` as development dependencies (`npm install --save-dev vite @vavite/dev-server-methods`) and add `@vavite/dev-server-methods/plugin` to your Vite config:

```ts
import { defineConfig } from "vite";
import vaviteDevServerMethods from "@vavite/dev-server-methods/plugin";

export default defineConfig({
  plugins: [
    vaviteDevServerMethods(),
  ],
});
```

Now you can import `transformIndexHtml` and `fixStackTrace` from `@vavite/dev-server-methods` and use them in your Vite-processed modules.

## API

```ts
/**
 * Exposes Vite development server's transformIndexHtml method.
 * During development, it applies Vite built-in HTML transforms and any plugin HTML transforms.
 * In production, it returns the HTML unchanged.
 */
function transformIndexHtml(url: string, html: string, originalUrl?: string): Promise<string>;

/**
 * Exposes Vite development server's ssrFixStacktrace method.
 * During development, it fixes the error stacktrace.
 * In production, it's a no-op.
 */
function fixStacktrace(error: Error): void;
```

