import { NestFactory } from "@nestjs/core";
import type { Express } from "express";
import { IncomingMessage, ServerResponse } from "http";
import viteDevServer from "vavite/vite-dev-server";
import { AppModule } from "./app.module";

bootstrap();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	if (viteDevServer) {
		await app.init();
		resolveHandler(await app.getHttpAdapter().getInstance());
	} else {
		const port = process.env.PORT || 3000;
		app.listen(port);
	}
}

let resolveHandler: (value: Express) => void;
let expressHandler: Express | Promise<Express> = new Promise((resolve) => {
	resolveHandler = resolve;
});

export default async function handler(
	request: IncomingMessage,
	reply: ServerResponse,
) {
	if (expressHandler instanceof Promise) {
		expressHandler = await expressHandler;
	}

	expressHandler(request, reply);
}
