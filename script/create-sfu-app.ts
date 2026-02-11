#!/usr/bin/env node
console.warn(
	"The Cloudflare Calls app creation API might be broken. (The API token could be rejected.)",
);
console.warn("If you encounter an error, Use the Cloudflare dashboard to create the app instead.");

import Cloudflare from "cloudflare";

import type { NeedsAsync } from "../src/util/contextual/core.ts";

import {
	getEnvironmentVariables as getEnvironmentVariablesGlobal,
	runWithEnvironmentVariables,
	type EnvironmentVariablesContext,
} from "../src/env/variables/context.ts";
import { ENVIRONMENT_VARIABLE_KEYS } from "../src/env/variables/keys.ts";
import { EnvironmentVariableValidators } from "../src/env/variables/validator.ts";

interface EnvironmentVariables {
	CLOUDFLARE_ACCOUNT_ID: string;
	CLOUDFLARE_CALLS_API_TOKEN: string;
}
async function* getEnvironmentVariables(): NeedsAsync<
	EnvironmentVariablesContext,
	EnvironmentVariables
> {
	const globalVariables = yield* getEnvironmentVariablesGlobal();
	const { required } = new EnvironmentVariableValidators(globalVariables);
	const KEYS = ENVIRONMENT_VARIABLE_KEYS;
	return {
		CLOUDFLARE_ACCOUNT_ID: required(KEYS.CLOUDFLARE_ACCOUNT_ID),
		CLOUDFLARE_CALLS_API_TOKEN: required(KEYS.CLOUDFLARE_CALLS_API_TOKEN),
	} as const;
}

async function* createSfuApp(): NeedsAsync<
	EnvironmentVariablesContext,
	Cloudflare.Calls.SFU.SFUCreateResponse
> {
	const env = yield* getEnvironmentVariables();
	const client = new Cloudflare({
		apiToken: env.CLOUDFLARE_CALLS_API_TOKEN,
	});

	return await client.calls.sfu.create({
		account_id: env.CLOUDFLARE_ACCOUNT_ID,
		name: "mogomogo", // TODO: Retrieve from argv
	});
}

const printAppInfo = ({ name, uid, secret }: Cloudflare.Calls.SFU.SFUCreateResponse) => {
	console.info("Created:");
	console.info(`# Cloudflare SFU app (${name})
CLOUDFLARE_SFU_APP_ID=${uid}
CLOUDFLARE_SFU_API_TOKEN=${secret}`);
};

await runWithEnvironmentVariables(async function* () {
	const sfuApp = yield* createSfuApp();
	printAppInfo(sfuApp);
});
