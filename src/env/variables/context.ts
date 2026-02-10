import { runWithContext, type Needs, type NeedsAsync } from "../../util/contextual/core.ts";
import { getContext } from "../../util/contextual/util.ts";
import {
	getEnvironmentVariables as _getEnvironmentVariables,
	type EnvironmentVariables,
} from "./get.ts";

export const EnvironmentVariablesToken = Symbol("environmentVariables");

export type EnvironmentVariablesContext = {
	[EnvironmentVariablesToken]: EnvironmentVariables;
};

const prepareContext = async () => {
	const value = await _getEnvironmentVariables();
	return { [EnvironmentVariablesToken]: value };
};
export const runWithEnvironmentVariables = async <TReturn>(
	stage:
		| (() => Needs<EnvironmentVariablesContext, TReturn>)
		| (() => NeedsAsync<EnvironmentVariablesContext, TReturn>),
) => {
	const context = await prepareContext();
	return runWithContext([context], stage);
};

export const getEnvironmentVariables = function* (): Needs<
	EnvironmentVariablesContext,
	EnvironmentVariables
> {
	return (yield* getContext<EnvironmentVariablesContext>())[EnvironmentVariablesToken];
};
