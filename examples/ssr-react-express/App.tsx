import { ReactNode } from "react";
import { Nav } from "./components/Nav";

export function App(props: { children: ReactNode }) {
	return (
		<div>
			<aside>
				<Nav />
			</aside>
			{props.children}
		</div>
	);
}
