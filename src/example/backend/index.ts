import type { HonoBase } from "hono/hono-base";

import path from "node:path";

import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { validator } from "hono/validator";

import { runWithEnvironmentVariables } from "../../env/variables/context.ts";
import { Mogomogo } from "../../server/core.ts";
import { CfRealtimeWebRtcServerProvider } from "../../server/web-rtc-server-provider/provider/cf-realtime/provider.ts";
import { createDb } from "./db.ts";
import { getEnvironmentVariables } from "./env-vars.ts";
import { loggerOf } from "./logger.ts";
import { Session } from "./session.ts";

const db = createDb();
await Promise.all([
	db.users.Create({ userId: "userA", name: "User A" }),
	db.users.Create({ userId: "userB", name: "User B" }),
]);

const api = await runWithEnvironmentVariables(async function* () {
	const env = yield* getEnvironmentVariables();

	const mgmg = new Mogomogo({
		webRtcServerProvider: new CfRealtimeWebRtcServerProvider({
			apiToken: env.CLOUDFLARE_SFU_APP_API_TOKEN,
			appId: env.CLOUDFLARE_SFU_APP_ID,
		}),
		storageProvider: {
			saveMuttererSession: async (mogomogoSessionId, relations) => {
				await db.muttererSessions.Create({ mogomogoSessionId, ...relations });
			},
			loadMuttererSession: async (mogomogoSessionId) => {
				return await db.muttererSessions.Read(mogomogoSessionId);
			},
			deleteOutdatedMuttererSessions: async (olderThan) => {
				await db.muttererSessions.Delete(
					({ createdAt }) => createdAt.getTime() < olderThan.getTime(),
				);
			},
			deleteOutdatedTapperSessions: async (olderThan) => {
				await db.tapperSessions.Delete(
					({ createdAt }) => createdAt.getTime() < olderThan.getTime(),
				);
			},
			saveTapperSession: async (mogomogoSessionId, relations) => {
				await db.tapperSessions.Create({ mogomogoSessionId, ...relations });
			},
			loadTapperSession: async (mogomogoSessionId) => {
				return await db.tapperSessions.Read(mogomogoSessionId);
			},
		},
		config: {
			debugMode: true,
		},
	});

	const api = new Hono()
		.get("/login-state", async (ctx) => {
			const logger = loggerOf("API(GET /login-state)");

			const session = await Session.tryVerify(ctx, db.sessions);
			if (!session) {
				logger.info("No valid session found.");
				return ctx.json({ isLoggedIn: false });
			}
			logger.info(`Valid session found for user ID ${session.userId}.`);

			// NOTE: User deletion is not implemented, so if a session exists, the user is guaranteed to exist
			const user = (await db.users.Read(session.userId))!;

			return ctx.json({
				isLoggedIn: true,
				user: {
					id: session.userId,
					name: user.name,
				},
			});
		})
		.post(
			"/login",
			validator(
				"json",
				(value) =>
					value as {
						idToken: string;
					},
			),
			async (ctx) => {
				const logger = loggerOf("API(POST /login)");

				const userId = ((): string => {
					const { idToken } = ctx.req.valid("json");
					const [, payloadBase64] = idToken.split(".");
					// Skips signature verification (wild etiquette)
					const payload = JSON.parse(atob(payloadBase64!));
					return payload.sub;
				})();

				const user = await db.users.Read(userId);
				if (!user) {
					logger.warn(`User with ID ${userId} not found.`);
					return ctx.body(null, 401);
				}

				const session = await Session.issueFor(userId, db.sessions, ctx);
				logger.info(`New session issued for user ID ${userId}.`);

				return ctx.json({
					user: {
						id: session.userId,
						name: user.name,
					},
				});
			},
		)
		.post("/logout", Session.sessionValidator(db.sessions), async (ctx) => {
			const logger = loggerOf("API(POST /logout)");

			const session = ctx.req.valid("cookie");

			await session.destroy(db.sessions, ctx);
			logger.info(`User with ID ${session.userId} logged out.`);

			return ctx.body(null, 204);
		})
		.post(
			"/start-muttering",
			Session.sessionValidator(db.sessions),
			validator(
				"json",
				(value) =>
					value as {
						sessionDescription: {
							sdp: string;
						};
						tracks: {
							trackName: string;
							mid: string;
						}[];
					},
			),
			async (ctx) => {
				const logger = loggerOf("API(POST /start-muttering)");

				const session = ctx.req.valid("cookie");
				const body = ctx.req.valid("json");

				const muttererSession = await mgmg.startMuttering({
					fromBrowser: {
						sessionDescription: body.sessionDescription,
						tracks: body.tracks,
					},
				});
				logger.debug(`Mogomogo session started on web RTC server for user ID ${session.userId}.`);

				// Stores muttering session in the database
				// to find the muttering session later when the tapper starts tapping or stopping muttering
				await db.mutteringStates.Create({
					userId: session.userId,
					mogomogoSessionId: muttererSession.session.mogomogoSessionId,
				});

				logger.info(
					`User with ID ${session.userId} started muttering with Mogomogo session ID ${muttererSession.session.mogomogoSessionId}.`,
				);

				// Returns session ID and SDP to the Mutterer client
				return ctx.json(muttererSession.toBrowser);
			},
		)
		.get("/mutterings", Session.sessionValidator(db.sessions), async (ctx) => {
			const logger = loggerOf("API(GET /mutterings)");

			// Loads mutterings list from the database
			const mutterings = (await db.mutteringStates.List(() => true)).map(
				({ userId, mogomogoSessionId }) => ({
					userId,
					mogomogoSessionId,
				}),
			);
			logger.info(`Loaded mutterings list with ${mutterings.length} entries.`);

			return ctx.json(mutterings);
		})
		.post(
			"/start-tapping",
			Session.sessionValidator(db.sessions),
			validator(
				"json",
				(value) =>
					value as {
						muttererSessionId: string;
					},
			),
			async (ctx) => {
				const logger = loggerOf("API(POST /start-tapping)");

				const session = ctx.req.valid("cookie");
				const body = ctx.req.valid("json");

				const tapperSession = await mgmg.startTapping({
					muttererMogomogoSessionId: body.muttererSessionId,
				});
				logger.debug(`Tapper session started on web RTC server for user ID ${session.userId}.`);

				// Stores tapping session in the database
				// to find the tapping session later when renegotiating or stopping tapping
				await db.tappingStates.Create({
					userId: session.userId,
					mogomogoSessionId: tapperSession.session.mogomogoSessionId,
				});
				logger.info(
					`User with ID ${session.userId} started tapping with Mogomogo session ID ${tapperSession.session.mogomogoSessionId}.`,
				);

				// Returns session ID and SDP to the Tapper client
				return ctx.json(tapperSession.toBrowser);
			},
		)
		.post(
			"/renegotiate-tapping",
			Session.sessionValidator(db.sessions),
			validator(
				"json",
				(value) =>
					value as {
						sessionDescription: {
							sdp: string;
						};
					},
			),
			async (ctx) => {
				const logger = loggerOf("API(POST /renegotiate-tapping)");

				const session = ctx.req.valid("cookie");
				const body = ctx.req.valid("json");

				// Loads tapping state from the database
				const tappingState = await db.tappingStates.Read(session.userId);
				if (!tappingState) {
					logger.warn(
						`User with ID ${session.userId} attempted to renegotiate tapping but is not tapping.`,
					);
					return ctx.json({ error: "Not tapping" }, 409);
				}

				await mgmg.renegotiateTapperSession({
					mogomogoSessionId: tappingState.mogomogoSessionId,
					sessionDescription: body.sessionDescription,
				});
				logger.info(
					`User with ID ${session.userId} renegotiated tapping session with Mogomogo session ID ${tappingState.mogomogoSessionId}.`,
				);

				return ctx.body(null, 204);
			},
		)
		.post(
			"/stop-muttering",
			Session.sessionValidator(db.sessions),
			validator(
				"json",
				(value) =>
					value as {
						sessionDescription: {
							sdp: string;
						};
					},
			),
			async (ctx) => {
				const logger = loggerOf("API(POST /stop-muttering)");

				const session = ctx.req.valid("cookie");
				const body = ctx.req.valid("json");

				// Loads muttering state from the database
				const mutteringState = await db.mutteringStates.Read(session.userId);
				if (!mutteringState) {
					logger.warn(
						`User with ID ${session.userId} attempted to close track but is not muttering.`,
					);
					return ctx.json({ error: "Not muttering" }, 409);
				}

				await mgmg.stopMuttering({
					mogomogoSessionId: mutteringState.mogomogoSessionId,
					sessionDescription: body.sessionDescription,
				});
				logger.info(
					`User with ID ${session.userId} closed track on muttering session with Mogomogo session ID ${mutteringState.mogomogoSessionId}.`,
				);

				return ctx.body(null, 204);
			},
		)
		.post(
			"/stop-tapping",
			Session.sessionValidator(db.sessions),
			validator(
				"json",
				(value) =>
					value as {
						muttererSessionId: string;
						sessionDescription: {
							sdp: string;
						};
					},
			),
			async (ctx) => {
				const logger = loggerOf("API(POST /stop-tapping)");

				const session = ctx.req.valid("cookie");
				const body = ctx.req.valid("json");

				// Loads tapping state from the database
				const tappingState = await db.tappingStates.Read(session.userId);
				if (!tappingState) {
					logger.warn(
						`User with ID ${session.userId} attempted to stop tapping but is not tapping.`,
					);
					return ctx.json({ error: "Not tapping" }, 409);
				}

				await mgmg.stopTapping({
					mogomogoSessionId: tappingState.mogomogoSessionId,
					muttererMogomogoSessionId: body.muttererSessionId,
					sessionDescription: body.sessionDescription,
				});
				logger.info(
					`User with ID ${session.userId} stopped tapping session with Mogomogo session ID ${tappingState.mogomogoSessionId}.`,
				);

				return ctx.body(null, 204);
			},
		);

	return api;
});

const frontend = new Hono() //
	.use("/*", serveStatic({ root: path.resolve(import.meta.dirname, "..", "frontend") + "/" }));

const app = new Hono() //
	.route("/api", api)
	.route("/", frontend);

const logger = loggerOf("Server");
serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	({ port }) => {
		logger.info(`Server is running on http://localhost:${port}`);
	},
);

export type BackendApiSchema = typeof api extends HonoBase<any, infer TSchema> ? TSchema : never;
