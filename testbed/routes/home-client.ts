import css from "./styles.module.css";

const button = document.querySelector(`.${css.btn}`)!;
let count = 0;
button.addEventListener("click", () => {
	count++;
	button.textContent = `Count: ${count}`;
});
