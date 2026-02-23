// @ts-check
"use strict";

/**
 * @typedef {import("../../backend/index").BackendApiSchema} BackendApiSchema
 * @typedef {import("hono/types").Endpoint} Endpoint
 * @typedef {import("hono/utils/http-status").SuccessStatusCode} SuccessStatusCode
 */
import { CONSTS } from "../consts.js";
import { loggerOf } from "./logger.js";

/**
 * Type helper
 * @template {Endpoint} TEndpoint
 * @template {number} TStatusCode
 * @typedef {TEndpoint extends { status: infer TIStatus; output: infer TIOutput; }
 *   ? TIStatus extends TStatusCode
 *     ? TIOutput
 *     : never
 *   : never
 * } ResponseSchemaOf<TEndpoint, TStatusCode>
 */

/**
 * @template {keyof BackendApiSchema} TPath
 * @template {keyof BackendApiSchema[TPath]} TMethod
 * @param {TPath} path
 * @param {(
 *   TMethod extends `$${infer TMethodWithOutPrefix}`
 *     ? Uppercase<TMethodWithOutPrefix>
 *     : never
 * )} method
 * @param {(
 *   {}
 *   & BackendApiSchema[TPath][TMethod] extends {
 *     input: {
 *       json: infer TBody;
 *     };
 *   } ? { body: TBody }
 *     : { body?: never }
 * )} opts
 * @returns {Promise<
 *   ResponseSchemaOf<
 *     Extract<
 *       BackendApiSchema[TPath][TMethod],
 *       Endpoint
 *     >,
 *     SuccessStatusCode
 *   >
 * >}
 */
export const callBackendApi = async (path, method, { body }) => {
	const logger = loggerOf("callBackendApi");

	const headers = {
		"Content-Type": "application/json",
		...(body ? { "Content-Type": "application/json" } : {}),
	};
	const response = await fetch(`${CONSTS.baseUrl}${path}`, {
		method,
		headers,
		// oxlint-disable-next-line unicorn/no-invalid-fetch-options
		body: body ? JSON.stringify(body) : null,
	});
	if (!response.ok) {
		logger.error("Failed status response:", response);
		throw new Error(`API call failed: ${response.statusText}`);
	}

	return response.status === 204
		? // @ts-expect-error
			null
		: response.json();
};
