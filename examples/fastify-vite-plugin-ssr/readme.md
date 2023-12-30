# Vavite vite-plugin-ssr example with Fastify

Simple example of using [vite-plugin-ssr](https://vite-plugin-ssr.com) with Vavite and Fastify that shows how to:

- Integrate Fastify with Vite's dev server
- Run multiple build steps (for client and server)
- Perform React SSR with vite-plugin-ssr

> [Try on StackBlitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/fastify-vite-plugin-ssr)

Clone with:

```bash
npx degit cyco130/vavite/examples/fastify-vite-plugin-ssr
```

> All examples have `"type": "module"` in their `package.json`.
>
> - For Vite v2, remove it to use CommonJS (CJS).
> - If you want to use CommonJS with Vite v3+, add `legacy.buildSsrCjsExternalHeuristics: true` to your Vite config.
