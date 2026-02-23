import { WebRtcServerProviderError } from "../../interface.ts";

export class CfRealtimeWebRtcServerProviderError extends WebRtcServerProviderError {
	/**
	 * @throws {@link CfRealtimeApiError} Always
	 */
	static #rethrowWithWrapping = (thrown: unknown): never => {
		throw thrown instanceof CfRealtimeWebRtcServerProviderError
			? thrown
			: thrown instanceof Error
				? new CfRealtimeWebRtcServerProviderError(thrown.message, { cause: thrown })
				: new CfRealtimeWebRtcServerProviderError("Thrown unknown object", { cause: thrown });
	};

	/**
	 * @throws {@link CfRealtimeWebRtcServerProviderError} When the given {@link process} function throws any objetct
	 */
	static wrapThrown<R>(process: () => R): R;
	static wrapThrown<R>(process: () => Promise<R>): Promise<R>;
	static wrapThrown<R>(process: () => R | Promise<R>): R | Promise<R> {
		try {
			const return_ = process();
			return return_ instanceof Promise
				? return_.catch(CfRealtimeWebRtcServerProviderError.#rethrowWithWrapping)
				: return_;
		} catch (thrown) {
			return CfRealtimeWebRtcServerProviderError.#rethrowWithWrapping(thrown);
		}
	}

	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "CfRealtimeWebRtcServerProviderError";
	}
}
