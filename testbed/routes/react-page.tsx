import React, { useState } from "react";
import css from "./styles.module.css";

export const App = () => {
	const [count, setCount] = useState(0);

	return (
		<div>
			<h1>React</h1>
			<p>
				<button className={css.btn} onClick={() => setCount((x) => x + 1)}>
					Count {count}
				</button>
			</p>
		</div>
	);
};
