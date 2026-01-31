export const memoize = <T>(computation: () => T) => {
	let cache: T;
	return () => (cache ??= computation());
};
