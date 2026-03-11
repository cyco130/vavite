import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";

const root = document.getElementById("root");
if (!root) {
	throw new Error("Root container not found");
}

async function render() {
	// Tiny, crappy router
	const importer = {
		"/": () => import("./pages/Home"),
		"/foo": () => import("./pages/Foo"),
		"/bar": () => import("./pages/Bar"),
	}[window.location.pathname];

	if (!importer) {
		throw new Error(`No page found for ${window.location.pathname}`);
	}

	const Page = (await importer()).default;

	hydrateRoot(
		root!,
		<App>
			<Page />
		</App>,
	);
}

render();
