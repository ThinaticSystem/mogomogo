import type { ReadonlyRecursive } from "../../util/type.ts";

// #region Schema
export type MogomogoSessionId = string;
export type WebRtcServerSessionId = string;
export interface MuttererSession {
	webRtcServerSessionId: WebRtcServerSessionId;
	tracks: {
		trackName: string;
		mid: string;
	}[];
	createdAt: Date;
}
export interface TapperSession {
	webRtcServerSessionId: WebRtcServerSessionId;
	createdAt: Date;
}
// #endregion

export interface StorageProvider {
	saveMuttererSession(
		mogomogoSessionId: MogomogoSessionId,
		relations: ReadonlyRecursive<MuttererSession>,
	): Promise<void>;
	loadMuttererSession(mogomogoSessionId: MogomogoSessionId): Promise<null | MuttererSession>;
	deleteOutdatedMuttererSessions(olderThan: Date): Promise<void>;
	saveTapperSession(
		mogomogoSessionId: MogomogoSessionId,
		relations: ReadonlyRecursive<TapperSession>,
	): Promise<void>;
	loadTapperSession(mogomogoSessionId: MogomogoSessionId): Promise<null | TapperSession>;
	deleteOutdatedTapperSessions(olderThan: Date): Promise<void>;
}

export class StorageProviderError extends Error {
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "StorageProviderError";
	}
}
