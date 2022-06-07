import { describe, test, expect, beforeAll, afterAll } from "vitest";
import puppeteer, { ElementHandle } from "puppeteer";
import path from "path";
import fs from "fs";
import { spawn, ChildProcess } from "child_process";
import fetch from "node-fetch";
import kill from "kill-port";

const TEST_HOST = "http://localhost:3000";

const browser = await puppeteer.launch({
	// headless: false,
	defaultViewport: { width: 1200, height: 800 },
});

const pages = await browser.pages();
const page = pages[0];

const cases = [
	{ framework: "express", env: "development" },
	{ framework: "express", env: "production" },

	{ framework: "fastify", env: "development" },
	{ framework: "fastify", env: "production" },

	{ framework: "koa", env: "development" },
	{ framework: "koa", env: "production" },

	{ framework: "hapi", env: "development" },
	{ framework: "hapi", env: "production" },
] as const;

describe.each(cases)("$framework - $env", ({ framework, env }) => {
	const dir = path.resolve(__dirname, "..", "examples", framework);

	let cp: ChildProcess;

	beforeAll(async () => {
		await kill(3000, "tcp").catch(() => {
			// Do nothing
		});

		const command =
			env === "development"
				? "pnpm exec vite serve --strictPort --port 3000"
				: "pnpm run build && pnpm start";

		cp = spawn(command, {
			shell: true,
			stdio: "inherit",
			cwd: dir,
		});

		// Wait until server is ready
		await new Promise<void>((resolve) => {
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

	test("renders home page", async () => {
		await page.goto(TEST_HOST + "/");
		await page.waitForFunction(
			(framework) => document.body.innerText.includes("Hello"),
			undefined,
			framework,
		);
	});

	if (env === "development") {
		test("hot reloads page", async () => {
			await page.goto(TEST_HOST);

			const filePath = path.resolve(dir, "routes/home.ts");
			const oldContent = await fs.promises.readFile(filePath, "utf8");
			const newContent = oldContent.replace("Hello from", "Hot reloadin'");

			await new Promise((resolve) => setTimeout(resolve, 500));
			await fs.promises.writeFile(filePath, newContent);

			await page.goto(TEST_HOST);

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

	afterAll(async () => {
		await kill(3000, "tcp").catch(() => {
			// Do nothing
		});
	});
});

afterAll(async () => {
	await browser.close();
});
