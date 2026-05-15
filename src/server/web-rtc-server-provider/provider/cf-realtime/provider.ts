import type { WebRtcServerProvider } from "../../interface.ts";

import { closeTrack } from "./api-client/client/close-track.ts";
import { createSession } from "./api-client/client/create-session.ts";
import { createTrack } from "./api-client/client/create-track.ts";
import { renegotiateSession } from "./api-client/client/renegotiate-session.ts";
import { CfRealtimeWebRtcServerProviderError } from "./error.ts";

export interface CfRealtimeWebRtcServerProviderConfig {
	apiToken: string;
	appId: string;
}

export class CfRealtimeWebRtcServerProvider implements WebRtcServerProvider {
	readonly #apiToken: string;
	readonly #appId: string;

	constructor({ apiToken, appId }: CfRealtimeWebRtcServerProviderConfig) {
		this.#apiToken = apiToken;
		this.#appId = appId;
	}

	async createSession(): Promise<{
		sessionId: string;
	}> {
		return CfRealtimeWebRtcServerProviderError.wrapThrown(async () => {
			const result = await createSession({
				path: {
					appId: this.#appId,
				},
				header: {
					apiToken: this.#apiToken,
				},
			});
			return {
				sessionId: result.sessionId,
			};
		});
	}

	// #region Overload declarations
	createTrack(opts: {
		kind: "send";
		sessionId: string;
		sessionDescription: {
			sdp: string;
		};
		tracks: readonly {
			mid: string;
			trackName: string;
		}[];
	}): Promise<{
		sessionDescription: RTCSessionDescriptionInit;
	}>;
	createTrack(opts: {
		kind: "receive";
		sessionId: string;
		tracks: readonly {
			sessionId: string;
			trackName: string;
		}[];
	}): Promise<
		{
			tracks: {
				mid: string;
			}[];
		} & (
			| {
					requiresImmediateRenegotiation: false;
			  }
			| {
					requiresImmediateRenegotiation: true;
					sessionDescription: RTCSessionDescriptionInit;
			  }
		)
	>;
	// #endregion
	async createTrack(
		opts:
			| {
					kind: "send";
					sessionId: string;
					sessionDescription: {
						sdp: string;
					};
					tracks: readonly {
						trackName: string;
						mid: string;
					}[];
			  }
			| {
					kind: "receive";
					sessionId: string;
					tracks: readonly {
						sessionId: string;
						trackName: string;
					}[];
			  },
	): Promise<{
		tracks: {
			mid: string;
		}[];
		requiresImmediateRenegotiation: boolean;
		sessionDescription: RTCSessionDescriptionInit;
	}> {
		return CfRealtimeWebRtcServerProviderError.wrapThrown(async () => {
			const result = await createTrack({
				path: {
					appId: this.#appId,
					sessionId: opts.sessionId,
				},
				header: {
					apiToken: this.#apiToken,
				},
				body:
					opts.kind === "send"
						? // send
							{
								sessionDescription: {
									type: "offer",
									sdp: opts.sessionDescription.sdp,
								},
								tracks: opts.tracks.map((track) => ({
									...track,
									location: "local",
								})),
							}
						: // receive
							{
								tracks: opts.tracks.map((track) => ({
									...track,
									location: "remote",
								})),
							},
			});

			return {
				sessionDescription: result.sessionDescription as Required<
					NonNullable<typeof result.sessionDescription>
				>,
				tracks: result.tracks as Required<NonNullable<typeof result.tracks>[number]>[],
				requiresImmediateRenegotiation: result.requiresImmediateRenegotiation!,
			};
		});
	}

	async renegotiateSession(opts: {
		sessionId: string;
		sessionDescription: {
			sdp: string;
		};
	}): Promise<void> {
		return CfRealtimeWebRtcServerProviderError.wrapThrown(async () => {
			await renegotiateSession({
				path: {
					appId: this.#appId,
					sessionId: opts.sessionId,
				},
				header: {
					apiToken: this.#apiToken,
				},
				body: {
					sessionDescription: {
						type: "answer",
						sdp: opts.sessionDescription.sdp,
					},
				},
			});
		});
	}

	async closeTrack(opts: {
		kind: "send" | "receive";
		sessionId: string;
		sessionDescription: {
			sdp: string;
		};
		tracks: readonly {
			mid: string;
		}[];
	}): Promise<void> {
		return CfRealtimeWebRtcServerProviderError.wrapThrown(async () => {
			await closeTrack({
				path: {
					appId: this.#appId,
					sessionId: opts.sessionId,
				},
				header: {
					apiToken: this.#apiToken,
				},
				body: {
					sessionDescription: {
						type: opts.kind === "send" ? "offer" : "answer",
						sdp: opts.sessionDescription.sdp,
					},
					tracks: opts.tracks,
				},
			});
		});
	}
}
