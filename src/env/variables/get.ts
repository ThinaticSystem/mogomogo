import { memoize } from "../../util/function.ts";
import { throws } from "../../util/throw.ts";
import { loadDotEnv } from "./load.ts";

/**
 * Get required environment variable or throw
 * @throws If the environment variable is missing or empty
 */
const require = (key: string) =>
	(process.env[key] ?? throws(new Error(`Required environment variable "${key}" is missing`))) ||
	throws(new Error(`Required environment variable "${key}" is empty`));

/**
 * This function is memoized to ensure that the .env file is loaded only once
 * @throws If any required environment variable is missing or empty
 */
export const getEnvironmentVariables = memoize(async () => {
	await loadDotEnv();

	return {
		CLOUDFLARE_CALLS_API_TOKEN: require("CLOUDFLARE_CALLS_API_TOKEN"),
		CLOUDFLARE_ACCOUNT_ID: require("CLOUDFLARE_ACCOUNT_ID"),
	} as const;
});
export type EnvironmentVariables = Awaited<ReturnType<typeof getEnvironmentVariables>>;
