# Vavite Vue SSR example with Express

Simple example for Vue SSR with Vavite that shows how to:

- Integrate Express with Vite's dev server
- Run multiple build steps (for client and server)
- Perform SSR in Vue

> [Try on StackBlitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/ssr-vue-express)

Clone with:

```bash
npx degit cyco130/vavite/examples/ssr-vue-express
```

> All examples have `"type": "module"` in their `package.json`.
>
> - For Vite v2, remove it to use CommonJS (CJS).
> - If you want to use CommonJS with Vite v3+, add `legacy.buildSsrCjsExternalHeuristics: true` to your Vite config.
