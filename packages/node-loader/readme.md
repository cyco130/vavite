# @vavite/node-loader

`@vavite/node-loader` is [Node ESM loader](https://nodejs.org/api/esm.html#loaders) that uses [Vite](https://vitejs.dev) to transpile modules. It is part of the `vavite` project but it can be used in any Vite SSR project to enable sourcemap and breakpoints support.

## Installation

```sh
npm install --save-dev @vavite/node-loader
```

## Usage

Add the following to your Vite config:

```ts
import { defineConfig } from "vite";
import { nodeLoaderPlugin } from "@vavite/node-loader/plugin";

export default defineConfig({
  plugins: [
    nodeLoaderPlugin(),
    // ...
  ],
});
```

And run your project with `vavite-loader vite dev`.
