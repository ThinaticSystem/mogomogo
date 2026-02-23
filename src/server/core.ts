import type { StorageProvider } from "./storage-provider/interface.ts";
import type { WebRtcServerProvider } from "./web-rtc-server-provider/interface.ts";

export interface MogomogoConfig {
	debugMode?: boolean;
}

export class Mogomogo<TConfig extends MogomogoConfig> {
	readonly #webRtcServerProvider: WebRtcServerProvider;
	readonly #storageProvider: StorageProvider;
	readonly #config: Required<TConfig>;

	static readonly #MOGOMOGO_DEFAULT_CONFIG = {
		debugMode: false,
	} as const satisfies Required<MogomogoConfig>;

	constructor({
		webRtcServerProvider,
		storageProvider,
		config = Mogomogo.#MOGOMOGO_DEFAULT_CONFIG as TConfig,
	}: {
		webRtcServerProvider: WebRtcServerProvider;
		storageProvider: StorageProvider;
		config?: TConfig;
	}) {
		this.#webRtcServerProvider = webRtcServerProvider;
		this.#storageProvider = storageProvider;
		this.#config = {
			...Mogomogo.#MOGOMOGO_DEFAULT_CONFIG,
			...config,
		} as Required<TConfig>;
	}

	/**
	 * @returns The given data when `debugMode` is `true`, otherwise an empty object
	 */
	#withDebugInfo<TData>(data: TData): TConfig["debugMode"] extends true ? TData : {} {
		return this.#config.debugMode
			? // @ts-expect-error
				data
			: // @ts-expect-error
				{};
	}

	async #createSession() {
		const mogomogoSessionId = crypto.randomUUID();
		const { sessionId: webRtcServerSessionId } = await this.#webRtcServerProvider.createSession();

		return {
			mogomogoSessionId,
			webRtcServerSessionId,
		};
	}

	async startMuttering({
		fromBrowser,
	}: {
		fromBrowser: {
			sessionDescription: {
				sdp: string;
			};
			tracks: readonly {
				trackName: string;
				mid: string;
			}[];
		};
	}) {
		const session = await this.#createSession();

		const track = await this.#webRtcServerProvider.createTrack({
			kind: "send",
			sessionId: session.webRtcServerSessionId,
			sessionDescription: fromBrowser.sessionDescription,
			tracks: fromBrowser.tracks,
		});

		await this.#storageProvider.saveMuttererSession(session.mogomogoSessionId, {
			webRtcServerSessionId: session.webRtcServerSessionId,
			tracks: fromBrowser.tracks,
			createdAt: new Date(),
		});

		return {
			session: {
				mogomogoSessionId: session.mogomogoSessionId,
				...this.#withDebugInfo({
					webRtcServerSessionId: session.webRtcServerSessionId,
				}),
			},
			toBrowser: track,
		};
	}

	async startTapping({ muttererMogomogoSessionId }: { muttererMogomogoSessionId: string }) {
		const tapperSession = await this.#createSession();

		const muttererSession =
			await this.#storageProvider.loadMuttererSession(muttererMogomogoSessionId);
		if (!muttererSession)
			throw new Error(`Session with mogomogoSessionId not found: ${muttererMogomogoSessionId}`);

		const track = await this.#webRtcServerProvider.createTrack({
			kind: "receive",
			sessionId: tapperSession.webRtcServerSessionId,
			tracks: muttererSession.tracks.map(({ trackName }) => ({
				sessionId: muttererSession.webRtcServerSessionId,
				trackName,
			})),
		});

		await this.#storageProvider.saveTapperSession(tapperSession.mogomogoSessionId, {
			webRtcServerSessionId: tapperSession.webRtcServerSessionId,
			createdAt: new Date(),
		});

		return {
			session: {
				mogomogoSessionId: tapperSession.mogomogoSessionId,
				...this.#withDebugInfo({
					webRtcServerSessionId: tapperSession.webRtcServerSessionId,
				}),
			},
			toBrowser: track,
		};
	}

	async renegotiateTapperSession({
		mogomogoSessionId,
		sessionDescription,
	}: {
		mogomogoSessionId: string;
		sessionDescription: {
			sdp: string;
		};
	}) {
		const session = await this.#storageProvider.loadTapperSession(mogomogoSessionId);
		if (!session) throw new Error(`Session with mogomogoSessionId not found: ${mogomogoSessionId}`);

		await this.#webRtcServerProvider.renegotiateSession({
			sessionId: session.webRtcServerSessionId,
			sessionDescription,
		});
	}

	async stopMuttering({
		mogomogoSessionId,
		sessionDescription,
	}: {
		mogomogoSessionId: string;
		sessionDescription: {
			sdp: string;
		};
	}) {
		const muttererSession = await this.#storageProvider.loadMuttererSession(mogomogoSessionId);
		if (!muttererSession)
			throw new Error(`Session with mogomogoSessionId not found: ${mogomogoSessionId}`);

		await this.#webRtcServerProvider.closeTrack({
			kind: "send",
			sessionId: muttererSession.webRtcServerSessionId,
			sessionDescription: sessionDescription,
			tracks: muttererSession.tracks,
		});
	}

	async stopTapping({
		mogomogoSessionId,
		muttererMogomogoSessionId,
		sessionDescription,
	}: {
		mogomogoSessionId: string;
		muttererMogomogoSessionId: string;
		sessionDescription: {
			sdp: string;
		};
	}) {
		const tapperSession = await this.#storageProvider.loadTapperSession(mogomogoSessionId);
		if (!tapperSession)
			throw new Error(`Session with mogomogoSessionId not found: ${mogomogoSessionId}`);

		const muttererSession =
			await this.#storageProvider.loadMuttererSession(muttererMogomogoSessionId);
		if (!muttererSession)
			throw new Error(`Session with mogomogoSessionId not found: ${muttererMogomogoSessionId}`);

		await this.#webRtcServerProvider.closeTrack({
			kind: "receive",
			sessionId: tapperSession.webRtcServerSessionId,
			sessionDescription: sessionDescription,
			tracks: muttererSession.tracks,
		});
	}
}
