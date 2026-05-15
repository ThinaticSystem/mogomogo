export interface WebRtcServerProvider {
	createSession: () => Promise<{
		sessionId: string;
	}>;

	createTrack: {
		(opts: {
			kind: "send";
			sessionId: string;
			sessionDescription: {
				sdp: string;
			};
			tracks: readonly {
				trackName: string;
				mid: string;
			}[];
		}): Promise<{
			sessionDescription: RTCSessionDescriptionInit;
		}>;

		(opts: {
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
	};

	renegotiateSession: (opts: {
		sessionId: string;
		sessionDescription: {
			sdp: string;
		};
	}) => Promise<void>;

	closeTrack: (opts: {
		kind: "send" | "receive";
		sessionId: string;
		sessionDescription: {
			sdp: string;
		};
		tracks: readonly {
			mid: string;
		}[];
	}) => Promise<void>;
}

export class WebRtcServerProviderError extends Error {
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "WebRtcServerProviderError";
	}
}
