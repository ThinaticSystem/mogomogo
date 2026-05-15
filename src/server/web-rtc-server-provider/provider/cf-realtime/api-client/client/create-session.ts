import type { DeepReadonly } from "../../util/type.ts";
import type { CommonOpts } from "../common.ts";
import type { paths } from "../schema.ts";

import { queryStringFrom } from "../../../../../../util/url.ts";
import { handleResponse, CfRealtimeApiError } from "../common.ts";

type Schema = paths["/apps/{appId}/sessions/new"]["post"];

export namespace CreateSession {
	export type Request = DeepReadonly<
		Omit<Schema["parameters"], "header"> & {
			header: {
				apiToken: string;
			};
		}
	>;
	export type Response = Schema["responses"]["201"]["content"]["application/json"];
	export type Opts = CommonOpts;
}

/**
 * POST `/apps/:appId/sessions/new`
 * @throws {@link CfRealtimeApiError}
 */
export const createSession = async (
	{ path: { appId }, query, header: { apiToken } }: CreateSession.Request,
	{
		fetch = globalThis.fetch,
		baseUrl = "https://rtc.live.cloudflare.com/v1",
	}: CreateSession.Opts = {},
): Promise<CreateSession.Response> =>
	CfRealtimeApiError.wrapThrown(async () => {
		const response = await fetch(
			new URL(`/apps/${appId}/sessions/new${query ? `?${queryStringFrom(query)}` : ""}`, baseUrl),
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiToken}`,
				},
			},
		);
		return handleResponse<CreateSession.Response>(response);
	});
