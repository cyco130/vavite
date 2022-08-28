# Vavite vite-plugin-ssr example with NestJS

Simple example of using [vite-plugin-ssr](https://vite-plugin-ssr.com) with Vavite and [NestJS](https://nestjs.com/) that shows how to:

- Integrate NestJS with Vite's dev server
- Run multiple build steps (for client and server)
- Perform React SSR with vite-plugin-ssr

Clone with:

```bash
npx degit cyco130/vavite/examples/nestjs-vite-plugin-ssr
```

> All examples have `"type": "module"` in their `package.json`.
>
> - For Vite v2, remove it to use CommonJS (CJS).
> - If you want to use CommonJS with Vite v3, add `legacy.buildSsrCjsExternalHeuristics: true` to your Vite config.
