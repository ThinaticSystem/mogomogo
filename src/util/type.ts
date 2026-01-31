/**
 * @example
 * type Result = UnionToIntersection<{ a: string } | { b: number }>;
 * //   ^? => { a: string } & { b: number }
 */
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
	k: infer I,
) => void
	? I
	: never;
