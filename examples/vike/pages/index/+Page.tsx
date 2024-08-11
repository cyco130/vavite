export { Page };

import { Counter } from "./Counter";

function Page() {
	return (
		<>
			<h1>Hello from Vike on Express!</h1>
			This page is:
			<ul>
				<li>Rendered to HTML.</li>
				<li>
					Interactive. <Counter />
				</li>
			</ul>
		</>
	);
}
