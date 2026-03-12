import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import type { NestExpressApplication } from "@nestjs/platform-express";

const app = await NestFactory.create<NestExpressApplication>(AppModule);
await app.init();

const instance = app.getHttpAdapter().getInstance();

// Default export a Connect-compatible handler for dev
export default instance;

if (import.meta.env.COMMAND === "build") {
	// Start the NestJS server in production mode
	await app.listen(3000);
	console.log("Server is running on http://localhost:3000");
}

if (import.meta.hot) {
	import.meta.hot.accept();
	import.meta.hot.dispose(() => app.close());
}
