import { RenderResult } from "../handler";
import css from "./styles.module.css";

export default function renderHomePage(): RenderResult {
	return {
		html: `<h1>Vavite Test Page</h1>
			<p><button class="${css.btn}">Count: 0</button></p>
		`,
		scripts: ["routes/home-client.ts"],
	};
}
