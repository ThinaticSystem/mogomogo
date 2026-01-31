import type { Needs } from "./core.ts";

export function* getContext<TContext>(): Needs<TContext, Readonly<TContext>> {
	return yield (context) => context;
}
