# Vavite Simple Standalone example

A simple Express server with WebSocket support using the `ws` library.

Note that Vite itself uses a WebSocket server for HMR during development on the `/` path by default. To avoid conflicts, you should either use a different path for your WebSocket server (e.g. `/ws`) or change Vite's HMR path using the `server.hmr.path` option in `vite.config.ts`. This example uses the former approach and listens for WebSocket connections on the `/ws` path.

The WebSocket server is connected to Vite's dev server during dev and the actual server in production. It also supports hot module replacement (HMR) during development: If you change the code in `src/entry.server.ts`, the WebSocket server will be closed and restarted with the new code and the client will reconnect.

> [Try on StackBlitz](https://stackblitz.com/github/cyco130/vavite/tree/main/examples/ws)

Clone with:

```bash
npx degit cyco130/vavite/examples/ws
```
