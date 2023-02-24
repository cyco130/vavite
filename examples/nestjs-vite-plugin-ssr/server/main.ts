import { NestFactory } from "@nestjs/core";
import type { Express } from "express";
import { IncomingMessage, ServerResponse } from "node:http";
import { AppModule } from "./app.module";

bootstrap();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	await app.init();
	resolveHandler(await app.getHttpAdapter().getInstance());
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
