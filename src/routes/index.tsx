// =====================================================================
// EXAMPLE PAGE — Replace this with your own home page!
//
// This page demonstrates how to:
//   1. Fetch data from an API using TanStack Query  (src/lib/api.ts)
//   2. Store client-side state using Zustand         (src/stores/example.ts)
//
// When you're ready, delete everything below and build your own thing.
// =====================================================================

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchRandomDog } from "@/lib/api";
import { useFavoritesStore } from "@/stores/example";

export const Route = createFileRoute("/")({
	component: HomePage,
});

function HomePage() {
	// Fetch a random dog image from the API (server state)
	const {
		data: imageUrl,
		isFetching,
		refetch,
	} = useQuery({
		queryKey: ["randomDog"],
		queryFn: fetchRandomDog,
		// By default, React Query refetches when the browser tab regains focus.
		// We turn that off here so you don't lose the current dog unexpectedly.
		// Docs: https://tanstack.com/query/latest/docs/framework/react/guides/window-focus-refetching
		refetchOnWindowFocus: false,
	});

	// Read and write favorites from the Zustand store (client state)
	const { favorites, addFavorite, removeFavorite, isFavorite } =
		useFavoritesStore();

	const saved = imageUrl ? isFavorite(imageUrl) : false;

	return (
		<div className="mx-auto max-w-2xl p-8">
			<p className="mb-6 rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
				This is a demo page. Replace it with your own code in{" "}
				<code className="rounded bg-muted px-1">src/routes/index.tsx</code>.
			</p>

			<h1 className="mb-2 text-3xl font-bold">Random Dogs</h1>
			<p className="mb-6 text-muted-foreground">
				Fetch a random dog from the internet. Save your favorites.
			</p>

			<Card className="mb-6 overflow-hidden bg-black">
				<CardContent>
					{isFetching ? (
						<div className="h-72 animate-pulse bg-muted" />
					) : imageUrl ? (
						<img
							src={imageUrl}
							alt="A random dog"
							className="h-72 w-full object-contain"
						/>
					) : null}
				</CardContent>
			</Card>

			<div className="mb-8 flex gap-2">
				<Button onClick={() => refetch()}>Next dog</Button>
				{imageUrl && (
					<Button
						variant="outline"
						onClick={() =>
							saved ? removeFavorite(imageUrl) : addFavorite(imageUrl)
						}
					>
						<Heart className={saved ? "fill-current" : ""} />
						{saved ? "Saved" : "Save"}
					</Button>
				)}
			</div>

			{favorites.length > 0 && (
				<>
					<div className="mb-4 flex items-center gap-2">
						<h2 className="text-xl font-semibold">Favorites</h2>
						<Badge variant="secondary">{favorites.length}</Badge>
					</div>
					<div className="grid grid-cols-2 gap-4">
						{favorites.map((url) => (
							<Card key={url} className="overflow-hidden bg-black">
								<CardContent>
									<img
										src={url}
										alt="A favorite dog"
										className="h-32 w-full object-contain"
									/>
								</CardContent>
							</Card>
						))}
					</div>
				</>
			)}
		</div>
	);
}
