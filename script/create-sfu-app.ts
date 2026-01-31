#!/usr/bin/env node
import Cloudflare from "cloudflare";

import type { NeedsAsync } from "../src/util/contextual/core.ts";

import {
	getEnvironmentVariables,
	runWithEnvironmentVariables,
	type EnvironmentVariablesContext,
} from "../src/env/variables/context.ts";

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

await runWithEnvironmentVariables(async function* () {
	const sfuApp = yield* createSfuApp();
	console.table(sfuApp);
});
