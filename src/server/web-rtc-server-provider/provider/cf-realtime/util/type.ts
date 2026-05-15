type Primitive = undefined | null | boolean | number | string | symbol | bigint | Function;
export type DeepReadonly<T> = T extends Primitive
	? T
	: T extends Array<infer U>
		? ReadonlyArray<U>
		: T extends Set<infer U>
			? ReadonlySet<U>
			: T extends Map<infer K, infer V>
				? ReadonlyMap<K, V>
				: { readonly [K in keyof T]: DeepReadonly<T[K]> };
