import { useState } from "react";

export function Counter() {
	const [count, setCount] = useState(0);

	return (
		<button onClick={() => setCount((old) => old + 1)}>Counter: {count}</button>
	);
}
