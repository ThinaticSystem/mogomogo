import type { DeepReadonly } from "../../util/type.ts";
import type { CommonOpts } from "../common.ts";
import type { paths } from "../schema.ts";

import { handleResponse, CfRealtimeApiError } from "../common.ts";

type Schema = paths["/apps/{appId}/sessions/{sessionId}/renegotiate"]["put"];

export namespace RenegotiateSession {
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
 * PUT `/apps/:appId/sessions/:sessionId/renegotiate`
 * @throws {@link CfRealtimeApiError}
 */
export const renegotiateSession = async (
	{ path: { appId, sessionId }, header: { apiToken }, body }: RenegotiateSession.Request,
	{
		fetch = globalThis.fetch,
		baseUrl = "https://rtc.live.cloudflare.com/v1",
	}: RenegotiateSession.Opts = {},
) =>
	CfRealtimeApiError.wrapThrown(async () => {
		const response = await fetch(
			new URL(`/apps/${appId}/sessions/${sessionId}/renegotiate`, baseUrl),
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${apiToken}`,
				},
				body: body ? JSON.stringify(body) : null,
			},
		);
		return handleResponse<RenegotiateSession.Response>(response);
	});
