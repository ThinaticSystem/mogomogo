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
	const KEYS = ENVIRONMENT_VARIABLE_KEYS;
	return {
		CLOUDFLARE_CALLS_API_TOKEN: optional(KEYS.CLOUDFLARE_CALLS_API_TOKEN),
		CLOUDFLARE_ACCOUNT_ID: optional(KEYS.CLOUDFLARE_ACCOUNT_ID),
	} as const;
});
export type EnvironmentVariables = Awaited<ReturnType<typeof getEnvironmentVariables>>;
