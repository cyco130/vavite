import { Counter } from "./Counter";

export { Page };

function Page() {
	return (
		<>
			<h1>Hello from nestjs-vite-plugin-ssr</h1>
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
