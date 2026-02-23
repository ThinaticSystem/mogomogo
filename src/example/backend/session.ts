import type { Db } from "./db.ts";
import type { Context, MiddlewareHandler, TypedResponse } from "hono";

import { randomUUID } from "node:crypto";

import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import { validator } from "hono/validator";

import { loggerOf } from "./logger.ts";

export namespace SessionClass {
	export interface Static {
		issueFor(userId: string, sessionsTable: Db.Tables["sessions"], ctx: Context): Promise<Instance>;
		tryVerify(ctx: Context, sessionsTable: Db.Tables["sessions"]): Promise<null | Instance>;
		sessionValidator(
			sessionsTables: Db.Tables["sessions"],
		): MiddlewareHandler<
			any,
			string,
			{ out: { cookie: Instance } },
			TypedResponse<null, 401, "body">
		>;
		deleteCookie(ctx: Context): void;
	}
	export interface Instance {
		id: string;
		expiresAt: Date;
		userId: string;
		destroy(sessionsTable: Db.Tables["sessions"], ctx: Context): Promise<void>;
	}

	export type Type = Static & (new (...args: any) => Instance);
}

export const Session: SessionClass.Type = class Session implements SessionClass.Instance {
	static readonly #SESSION_ID_COOKIE_NAME = "session_id";
	static readonly #SESSION_ID_COOKIE_SECRET_KEY = "honi";

	id: string;
	expiresAt: Date;
	userId: string;

	constructor({ id, expiresAt, userId }: { id: string; expiresAt: Date; userId: string }) {
		this.id = id;
		this.expiresAt = expiresAt;
		this.userId = userId;
	}

	static async issueFor(userId: string, sessionsTable: Db.Tables["sessions"], ctx: Context) {
		const id = randomUUID();
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1_000);

		await sessionsTable.Create({
			sessionId: id,
			expiresAt,
			userId,
		});

		await setSignedCookie(
			ctx,
			Session.#SESSION_ID_COOKIE_NAME,
			id,
			Session.#SESSION_ID_COOKIE_SECRET_KEY,
			{
				// secure: true,
				sameSite: "Strict",
				path: "/",
				httpOnly: true,
				expires: expiresAt,
			},
		);

		return new Session({
			id,
			expiresAt,
			userId,
		});
	}

	get isExpired() {
		return this.expiresAt < new Date();
	}

	get shouldRefresh() {
		// Less than 1 hour remaining
		return this.expiresAt.getTime() - Date.now() < 60 * 60 * 1_000;
	}

	static async #getIdFromCookie(ctx: Context): Promise<string | null> {
		const sessionId = await getSignedCookie(
			ctx,
			Session.#SESSION_ID_COOKIE_SECRET_KEY,
			Session.#SESSION_ID_COOKIE_NAME,
		);
		return sessionId || null;
	}

	static async tryVerify(
		ctx: Context,
		sessionsTable: Db.Tables["sessions"],
	): Promise<null | Session> {
		const logger = loggerOf("SessionImpl.tryVerify");

		const sessionId = await Session.#getIdFromCookie(ctx);
		if (!sessionId) {
			logger.debug("No session ID found in cookies.");
			return null;
		}

		const sessionRecord = await sessionsTable.Read(sessionId);
		if (!sessionRecord) {
			logger.warn(`No session record found for ID ${sessionId}`, "Deleting cookie.");
			Session.deleteCookie(ctx);
			return null;
		}

		const session = new Session({ id: sessionId, ...sessionRecord });
		if (session.isExpired) {
			logger.debug(`Session with ID ${sessionId} is expired.`, "Destroying session.");
			await session.destroy(sessionsTable, ctx);
			logger.debug(`Session with ID ${sessionId} destroyed due to expiration.`, "Deleting cookie.");
			return null;
		}
		if (session.shouldRefresh) {
			logger.debug(`Session with ID ${sessionId} is nearing expiration.`, "Refreshing session.");
			await session.destroy(sessionsTable, ctx);
			logger.debug(`Session with ID ${sessionId} destroyed for refresh.`, "Issuing new session.");
			const newSession = await Session.issueFor(session.userId, sessionsTable, ctx);
			logger.debug(`New session with ID ${newSession.id} issued for user ID ${session.userId}.`);
			return newSession;
		}

		return session;
	}

	static sessionValidator(sessionsTable: Db.Tables["sessions"]) {
		return validator("cookie", async (_value, ctx) => {
			const logger = loggerOf("SessionImpl.sessionValidator");

			const session = await Session.tryVerify(ctx, sessionsTable);
			if (!session) {
				logger.debug("Session validation failed: No valid session found.");
				return ctx.body(null, 401);
			}
			logger.info(`Session verified for user ID: ${session.userId}.`);

			return session;
		});
	}

	static deleteCookie(ctx: Context) {
		deleteCookie(ctx, Session.#SESSION_ID_COOKIE_NAME);
	}

	async destroy(sessionsTable: Db.Tables["sessions"], ctx: Context) {
		await sessionsTable.Delete(({ sessionId }) => sessionId === this.id);
		Session.deleteCookie(ctx);
	}
};
