/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Exposes Vite development server's transformIndexHtml method.
 * During development, it applies Vite built-in HTML transforms and any plugin HTML transforms.
 * In production, it returns the HTML unchanged.
 */
export async function transformIndexHtml(
	url: string,
	html: string,
	originalUrl?: string,
): Promise<string> {
	return html;
}

/**
 * Exposes Vite development server's ssrFixStacktrace method.
 * During development, it fixes the error stacktrace.
 * In production, it's a no-op.
 */
export function fixStacktrace(error: Error): void {
	// No-op
}
