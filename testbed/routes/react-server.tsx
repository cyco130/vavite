import React from "react";
import { App } from "./react-page";
import { renderToString } from "react-dom/server";
import { RenderResult } from "../handler";

export default function renderReactPage(): RenderResult {
	return {
		html: renderToString(<App />),
		scripts: ["routes/react-client.tsx"],
	};
}
