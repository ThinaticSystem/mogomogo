/**
 * Build URL query string from the given object
 * @param object An object to be converted to URL query string.\
 *               If the value is `undefined`, the key will be skipped.\
 *               Otherwise, the key and value will be encoded with {@link globalThis.encodeURIComponent}.
 * @returns URL query string (without `?`) of the given object
 */
export const queryStringFrom = (object: Record<string, undefined | string | number | boolean>) =>
	Object.entries(object)
		.values()
		.filter((entry): entry is [(typeof entry)[0], Exclude<(typeof entry)[1], undefined>] => {
			const value = entry[1];
			return value !== undefined;
		})
		// Encode each key and value, and concatenate them with "&"
		.reduce(
			(acc, [key, value]) => `${acc}&${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
			"",
		)
		// Remove the first "&"
		.slice(1);
