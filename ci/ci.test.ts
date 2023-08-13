import { describe, test, expect, beforeAll, afterAll } from "vitest";
import puppeteer from "puppeteer";
import path from "node:path";
import fs from "node:fs";
import { spawn, ChildProcess } from "node:child_process";
import fetch from "node-fetch";
import { promisify } from "node:util";
import psTree from "ps-tree";
import { kill } from "node:process";

const TEST_HOST = "http://localhost:3000";

const browser = await puppeteer.launch({
	headless: "new",
	defaultViewport: { width: 1200, height: 800 },
});

const pages = await browser.pages();
const page = pages[0];

const baseCases: Array<{
	framework: string;
	file: string;
}> = [
	{ framework: "simple-standalone", file: "handler.ts" },
	{ framework: "express", file: "routes/home.ts" },
	{ framework: "fastify", file: "routes/home.ts" },
	{ framework: "koa", file: "routes/home.ts" },
	{ framework: "hapi", file: "routes/home.ts" },
	{ framework: "ssr-react-express", file: "pages/Home.tsx" },
	{ framework: "ssr-vue-express", file: "pages/Home.vue" },
	{ framework: "vite-plugin-ssr", file: "pages/index/index.page.tsx" },
	{ framework: "nestjs", file: "src/app.controller.ts" },
	// This one is annoyingly flaky
	// { framework: "nestjs-vite-plugin-ssr", file: "pages/index/index.page.tsx" },
	{ framework: "fastify-vite-plugin-ssr", file: "pages/index/index.page.tsx" },
];

const [major, minor] = process.version
	.slice(1)
	.split(".")
	.map((x) => Number(x));

const cases: Array<{
	framework: string;
	file: string;
	env: "production" | "development" | "with-loader";
}> = [
	...baseCases.map((x) => ({ ...x, env: "production" as const })),
	...baseCases.map((x) => ({ ...x, env: "development" as const })),
];

const loaderAvailable =
	(major > 16 || (major === 16 && minor >= 12)) && major < 20;

if (loaderAvailable) {
	cases.push(...baseCases.map((x) => ({ ...x, env: "with-loader" as const })));
}

describe.each(cases)("$framework - $env ", ({ framework, env, file }) => {
	const ssr = framework.includes("ssr");
	const dir = path.resolve(__dirname, "..", "examples", framework);

	let cp: ChildProcess | undefined;

	beforeAll(async () => {
		let command =
			env === "production"
				? "pnpm run build && pnpm start"
				: "pnpm exec vite serve --strictPort --port 3000 --logLevel silent";

		if (framework === "nestjs-vite-plugin-ssr" && env !== "production") {
			command = `pnpm exec vite optimize --force && ${command}`;
		}

		cp = spawn(command, {
			shell: true,
			stdio: "inherit",
			cwd: dir,
			env: {
				...process.env,
				...(env === "with-loader" && {
					NODE_OPTIONS:
						(process.env.NODE_OPTIONS ?? "") +
						" -r vavite/suppress-loader-warnings --loader vavite/node-loader",
				}),
			},
		});

		// Wait until server is ready
		await new Promise<void>((resolve, reject) => {
			cp!.on("error", reject);

			cp!.on("exit", (code) => {
				if (code !== 0) {
					cp = undefined;
					reject(new Error(`Process exited with code ${code}`));
				}
			});

			const interval = setInterval(() => {
				fetch(TEST_HOST)
					.then(async (r) => {
						if (r.status === 200) {
							clearInterval(interval);
							resolve();
						}
					})
					.catch(() => {
						// Ignore error
					});
			}, 250);
		});
	}, 60_000);

	afterAll(async () => {
		if (!cp || cp.exitCode || !cp.pid) {
			return;
		}

		const tree = await promisify(psTree)(cp.pid);
		const pids = [cp.pid, ...tree.map((p) => +p.PID)];

		for (const pid of pids) {
			kill(+pid, "SIGINT");
		}

		await new Promise((resolve) => {
			cp!.on("exit", resolve);
		});
	});

	test("renders home page", async () => {
		const text = await fetch(TEST_HOST).then((r) => r.text());
		expect(text).toContain("Hello");
	}, 10_000);

	if (ssr) {
		test("renders interactive page", async () => {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			await page.goto(TEST_HOST + "/");
			await new Promise((resolve) => setTimeout(resolve, 1000));

			await page.waitForFunction(
				() => {
					const button = document.querySelector("button")!;
					button.click();
					return button.innerText.includes("1");
				},
				{ timeout: 10_000 },
			);
		}, 15_000);
	}

	if (env !== "production") {
		test("hot reloads page", async () => {
			await page.goto(TEST_HOST);

			const filePath = path.resolve(dir, file);
			const oldContent = await fs.promises.readFile(filePath, "utf8");
			const newContent = oldContent.replace("Hello from", "Hot reloadin'");

			await new Promise((resolve) => setTimeout(resolve, 500));
			await fs.promises.writeFile(filePath, newContent);
			await new Promise((resolve) => setTimeout(resolve, 500));

			if (!ssr) {
				await page.goto(TEST_HOST);
			}

			try {
				await page.waitForFunction(
					() => document.body.textContent?.includes("Hot reloadin'"),
					{ timeout: 60_000 },
				);
			} finally {
				await fs.promises.writeFile(filePath, oldContent);
			}
		}, 60_000);
	}
});

afterAll(async () => {
	await browser.close();
});
