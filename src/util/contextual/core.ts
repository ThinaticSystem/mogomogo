import type { UnionToIntersection } from "../type.ts";

import { getContext } from "./util.ts";

/** Generator that requires a context */
export type Needs<TContext, TReturn> = Generator<(context: Readonly<TContext>) => unknown, TReturn>;
/** Async generator that requires a context */
export type NeedsAsync<TContext, TReturn> = AsyncGenerator<
	(context: Readonly<TContext>) => unknown,
	TReturn
>;

type Stage<TContext, TReturn> = () => Needs<TContext, TReturn>;
type ContextFromStage<TStage extends Stage<any, any>> =
	TStage extends Stage<infer T, any> ? T : never;
type ReturnFromStage<TStage extends Stage<any, any>> =
	TStage extends Stage<any, infer R> ? R : never;

type AsyncStage<TContext, TReturn> = () => NeedsAsync<TContext, TReturn>;
type ContextFromAsyncStage<TStage extends AsyncStage<any, any>> =
	TStage extends AsyncStage<infer T, any> ? T : never;
type ReturnFromAsyncStage<TStage extends AsyncStage<any, any>> =
	TStage extends AsyncStage<any, infer R> ? R : never;

type RunWithContext = {
	<TContext, TReturn>(
		contexts: readonly TContext[],
		stage: Stage<NoInfer<UnionToIntersection<TContext>>, TReturn>,
	): TReturn;
	<TContext, TReturn>(
		contexts: readonly TContext[],
		stage: AsyncStage<NoInfer<UnionToIntersection<TContext>>, TReturn>,
	): Promise<TReturn>;
	<TContext, TReturn>(
		contexts: readonly TContext[],
		stage:
			| Stage<NoInfer<UnionToIntersection<TContext>>, TReturn>
			| AsyncStage<NoInfer<UnionToIntersection<TContext>>, TReturn>,
	): Promise<TReturn>;
};
/** Run a stage with the given context */
export const runWithContext: RunWithContext = (contexts, stage) => {
	const mixedContext = contexts.reduce<Partial<UnionToIntersection<(typeof contexts)[number]>>>(
		(acc, cur) => Object.assign(acc, cur),
		{},
	) as UnionToIntersection<(typeof contexts)[number]>;
	const needs = stage();

	if (Symbol.asyncIterator in needs) {
		return (async () => {
			let yielded = await needs.next();
			for (let returned: unknown; !yielded.done; yielded = await needs.next(returned)) {
				returned = yielded.value(mixedContext);
			}
			return yielded.value;
		})();
	} else {
		let yielded = needs.next();
		for (let returned: unknown; !yielded.done; yielded = needs.next(returned)) {
			returned = yielded.value(mixedContext);
		}
		return yielded.value;
	}
};

/** Run a stage with additional contexts merged into the parent context */
export function* withContext<TAdditionalContext, TStage extends Stage<any, any>>(
	additionalContexts: readonly TAdditionalContext[],
	stage: TStage,
): Needs<
	NoInfer<
		/* ParentContext */ Omit<
			/* AllContext */ ContextFromStage<TStage>,
			keyof UnionToIntersection<TAdditionalContext>
		>
	>,
	ReturnFromStage<TStage>
> {
	const parentContext = yield* getContext();
	const contexts = [parentContext, ...additionalContexts];

	return runWithContext(contexts, stage);
}
/** Run an async stage with additional contexts merged into the parent context */
export async function* withContextAsync<TAdditionalContext, TStage extends AsyncStage<any, any>>(
	additionalContexts: readonly TAdditionalContext[],
	stage: TStage,
): NeedsAsync<
	NoInfer<
		/* ParentContext */ Omit<
			/* AllContext */ ContextFromAsyncStage<TStage>,
			keyof UnionToIntersection<TAdditionalContext>
		>
	>,
	ReturnFromAsyncStage<TStage>
> {
	const parentContext = yield* getContext();
	const contexts = [parentContext, ...additionalContexts];

	return runWithContext(contexts, stage);
}
