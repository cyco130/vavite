import { describe, it, expect } from "vitest";
import fetch from "node-fetch";

const host = process.env.TEST_HOST || "http://localhost:3000";

describe(host, () => {
	it("serves static files", async () => {
		const res = await fetch(`${host}/public.txt`);
		const body = await res.text();
		expect(body).toEqual(
			"I'm a public static asset with non-ASCII characters 😊",
		);
	});

	it("renders HTML", async () => {
		const response = await fetch(host);
		const text = await response.text();
		expect(text).toContain("<h1>Vavite Test Page</h1>");
		expect(text).toContain(`URL: "${host + "/"}"`);
	});

	it("renders React", async () => {
		const response = await fetch(host + "/react");
		const text = await response.text();
		expect(text).toContain("<h1>React</h1>");
	});

	it("renders binary", async () => {
		const response = await fetch(host + "/binary");
		const text = await response.text();
		expect(text).toEqual("This is rendered as binary with non-ASCII chars 😊");
	});

	it("renders string stream", async () => {
		const response = await fetch(host + "/str-stream");
		const text = await response.text();
		expect(text).toEqual(
			"This is rendered as a string stream with non-ASCII chars 😊",
		);
	});

	it("renders binary stream", async () => {
		const response = await fetch(host + "/bin-stream");
		const text = await response.text();
		expect(text).toEqual(
			"This is rendered as binary stream with non-ASCII chars 😊",
		);
	});

	it("echoes text", async () => {
		const response = await fetch(host + "/echo-text", {
			method: "POST",
			body: "Hello world! 😊",
		});
		const text = await response.text();
		expect(text).toEqual("Hello world! 😊");
	});

	it("echoes binary", async () => {
		const response = await fetch(host + "/echo-bin", {
			method: "POST",
			body: "ABC",
		});
		const text = await response.text();
		expect(text).toEqual("65, 66, 67");
	});

	it("echoes binary iterator", async () => {
		const response = await fetch(host + "/echo-stream", {
			method: "POST",
			body: "ABC",
		});
		const text = await response.text();
		expect(text).toEqual("65, 66, 67");
	});

	it("sends multiple cookies", async () => {
		const response = await fetch(host + "/cookies");
		expect(response.headers.raw()["set-cookie"]).toMatchObject([
			"name1=value1",
			"name2=value2",
		]);
	});
});
