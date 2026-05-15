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

/**
 * @example
 * type Result = ReadonlyRecursive<{
 *   a: string;
 *   b: {
 *     c: number;
 *   };
 * }>;
 * //   ^? => {
 * //     readonly a: string;
 * //     readonly b: {
 * //       readonly c: number;
 * //     };
 * //   }
 * }
 */
export type ReadonlyRecursive<T> = T extends Function
	? T
	: T extends object
		? {
				readonly [K in keyof T]: ReadonlyRecursive<T[K]>;
			}
		: T;
