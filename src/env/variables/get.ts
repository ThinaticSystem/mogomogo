import { memoize } from "../../util/function.ts";
import { ENVIRONMENT_VARIABLE_KEYS } from "./keys.ts";
import { loadDotEnv } from "./load.ts";
import { EnvironmentVariableValidators } from "./validator.ts";

/**
 * This function is memoized to ensure that the .env file is loaded only once
 * @throws If any value is invalid
 */
export const getEnvironmentVariables = memoize(async () => {
	await loadDotEnv();

	const { optional } = new EnvironmentVariableValidators(process.env);
	return Object //
		.values(ENVIRONMENT_VARIABLE_KEYS)
		.reduce(
			(acc, key) => Object.assign(acc, { [key]: optional(key) }),
			{} as { [_ in keyof typeof ENVIRONMENT_VARIABLE_KEYS]: undefined | string },
		);
});
export type EnvironmentVariables = Awaited<ReturnType<typeof getEnvironmentVariables>>;
