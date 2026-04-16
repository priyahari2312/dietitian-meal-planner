// Dog CEO API — free, no API key needed
// Docs: https://dog.ceo/dog-api/

interface DogApiResponse {
	message: string;
	status: string;
}

/**
 * Fetches a random dog image URL from the Dog CEO API.
 *
 * The API returns a JSON object like `{ message: "https://...jpg", status: "success" }`.
 * This function unwraps that and gives you just the image URL as a string.
 *
 * Use this with TanStack Query's `useQuery` hook in your components:
 *
 * ```ts
 * const { data: imageUrl } = useQuery({
 *   queryKey: ["randomDog"],
 *   queryFn: fetchRandomDog,
 * });
 * ```
 */
export async function fetchRandomDog(): Promise<string> {
	const res = await fetch("https://dog.ceo/api/breeds/image/random");
	if (!res.ok) throw new Error(`API error: ${res.status}`);
	const data: DogApiResponse = await res.json();
	return data.message;
}
