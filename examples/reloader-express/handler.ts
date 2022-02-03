import { RequestHandler } from "express";

export const handler: RequestHandler = async (req, res) => {
	res.send("Hello World!");
};
