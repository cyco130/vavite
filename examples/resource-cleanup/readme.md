# Vavite Resource Cleanup Example

This example demonstrates two patterns for resource cleanup in the presence of HMR.

The first pattern is to always create a new resource and clean up the old one if it exists. See [cleanup-on-dispose.ts](./src/cleanup-on-dispose.ts).

The other, more involved but more efficient pattern is to reuse the same resource if the configuration hasn't changed. See [reuse.ts](./src/reuse.ts).
