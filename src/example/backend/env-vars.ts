import type { EnvironmentVariablesContext } from "../../env/variables/context.ts";
import type { Needs } from "../../util/contextual/core.ts";

import { getEnvironmentVariables as getEnvironmentVariablesGlobal } from "../../env/variables/context.ts";
import { ENVIRONMENT_VARIABLE_KEYS } from "../../env/variables/keys.ts";
import { EnvironmentVariableValidators } from "../../env/variables/validator.ts";

export interface GetEnvironmentVariablesResult {
	CLOUDFLARE_SFU_APP_ID: string;
	CLOUDFLARE_SFU_APP_API_TOKEN: string;
}

export function* getEnvironmentVariables(): Needs<
	EnvironmentVariablesContext,
	Readonly<GetEnvironmentVariablesResult>
> {
	const globalVariables = yield* getEnvironmentVariablesGlobal();
	const { required } = new EnvironmentVariableValidators(globalVariables);
	const KEYS = ENVIRONMENT_VARIABLE_KEYS;
	return {
		CLOUDFLARE_SFU_APP_ID: required(KEYS.CLOUDFLARE_SFU_APP_ID),
		CLOUDFLARE_SFU_APP_API_TOKEN: required(KEYS.CLOUDFLARE_SFU_APP_API_TOKEN),
	} as const;
}
