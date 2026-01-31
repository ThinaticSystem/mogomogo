/** Creates an async generator that maps each element of a {@link collection} using an async {@link mapper} function */
export const mapAsync = async function* <TSource, TMapped>(
	collection: Iterable<TSource>,
	mapper: (item: TSource) => Promise<TMapped>,
) {
	for (const element of collection) {
		yield await mapper(element);
	}
};
