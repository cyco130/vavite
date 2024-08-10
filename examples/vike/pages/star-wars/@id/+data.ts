// https://vike.dev/data
export { data };
export type Data = Awaited<ReturnType<typeof data>>;

import type { MovieDetails } from "../types";
import type { PageContextServer } from "vike/types";

const data = async (pageContext: PageContextServer) => {
	await sleep(300); // Simulate slow network

	const response = await fetch(
		`https://brillout.github.io/star-wars/api/films/${pageContext.routeParams!.id}.json`,
	);
	let movie = (await response.json()) as MovieDetails;

	// We remove data we don't need because the data is passed to the client; we should
	// minimize what is sent over the network.
	movie = minimize(movie);

	return {
		movie,
		// The page's <title>
		title: movie.title,
	};
};

function minimize(movie: MovieDetails & Record<string, unknown>): MovieDetails {
	const { id, title, release_date, director, producer } = movie;
	movie = { id, title, release_date, director, producer };
	return movie;
}

function sleep(milliseconds: number) {
	return new Promise((r) => setTimeout(r, milliseconds));
}
