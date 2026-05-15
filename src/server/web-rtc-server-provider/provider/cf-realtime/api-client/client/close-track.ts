import type { DeepReadonly } from "../../util/type.ts";
import type { CommonOpts } from "../common.ts";
import type { paths } from "../schema.ts";

import { handleResponse, CfRealtimeApiError } from "../common.ts";

type Schema = paths["/apps/{appId}/sessions/{sessionId}/tracks/close"]["put"];

export namespace CloseTrack {
	export type Request = DeepReadonly<
		Omit<Schema["parameters"], "header"> & {
			header: {
				apiToken: string;
			};
		} & {
			body?: NonNullable<Schema["requestBody"]>["content"]["application/json"];
		}
	>;
	export type Response = Schema["responses"]["200"]["content"]["application/json"];
	export type Opts = CommonOpts;
}

/**
 * PUT `/apps/:appId/sessions/:sessionId/tracks/close`
 * @throws {@link CfRealtimeApiError}
 */
export const closeTrack = async (
	{ path: { appId, sessionId }, header: { apiToken }, body }: CloseTrack.Request,
	{
		fetch = globalThis.fetch,
		baseUrl = "https://rtc.live.cloudflare.com/v1",
	}: CloseTrack.Opts = {},
) =>
	CfRealtimeApiError.wrapThrown(async () => {
		const response = await fetch(
			new URL(`/apps/${appId}/sessions/${sessionId}/tracks/close`, baseUrl),
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiToken}`,
				},
				body: body ? JSON.stringify(body) : null,
			},
		);
		return handleResponse<CloseTrack.Response>(response);
	});
