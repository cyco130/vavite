import { Root, hydrateRoot, createRoot } from "react-dom/client";
import type { PageContextBuiltInClient } from "vite-plugin-ssr/client/router";
import type { PageContext } from "./types";
import { PageWrapper } from "./PageWrapper";

export { render };

export const clientRouting = true;
let root: Root | null = null;

async function render(pageContext: PageContextBuiltInClient & PageContext) {
	const { Page, pageProps } = pageContext;
	const page = (
		<PageWrapper pageContext={pageContext}>
			<Page {...pageProps} />
		</PageWrapper>
	);
	const container = document.getElementById("page-view")!;
	if (container.innerHTML === "" || !pageContext.isHydration) {
		if (!root) {
			root = createRoot(container);
		}
		root.render(page);
		// SSR
	} else {
		root = hydrateRoot(container, page);
	}
}
