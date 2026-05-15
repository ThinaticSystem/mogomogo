// @ts-check
"use strict";

/**
 * @typedef {import("../backend/index").BackendApiSchema} BackendApiSchema
 * @typedef {import("hono/types").Endpoint} Endpoint
 */

export const CONSTS = {
	baseUrl: `${location.origin}/api`,
	users: {
		userA: {
			name: "User A",
			idToken: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyQSJ9.",
		},
		userB: {
			name: "User B",
			idToken: "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyQiJ9.",
		},
	},
};
