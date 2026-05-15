export interface CommonOpts {
	/**
	 * @default globalThis.fetch
	 */
	fetch?: typeof globalThis.fetch;
	/**
	 * @default `https://rtc.live.cloudflare.com/v1`
	 */
	baseUrl?: string;
}

export class CfRealtimeApiError extends Error {
	/**
	 * @throws {@link CfRealtimeApiError} Always
	 */
	static #rethrowWithWrapping = (thrown: unknown): never => {
		throw thrown instanceof CfRealtimeApiError
			? thrown
			: thrown instanceof Error
				? new CfRealtimeApiError(thrown.message, { cause: thrown })
				: new CfRealtimeApiError("Thrown unknown object", { cause: thrown });
	};

	/**
	 * @throws {@link CfRealtimeApiError} When the given {@link process} function throws any objetct
	 */
	static wrapThrown<R>(process: () => R): R;
	static wrapThrown<R>(process: () => Promise<R>): Promise<R>;
	static wrapThrown<R>(process: () => R | Promise<R>): R | Promise<R> {
		try {
			const return_ = process();
			return return_ instanceof Promise
				? return_.catch(CfRealtimeApiError.#rethrowWithWrapping)
				: return_;
		} catch (thrown) {
			return CfRealtimeApiError.#rethrowWithWrapping(thrown);
		}
	}

	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "CfRealtimeError";
	}
}

/**
 * Handle {@link Response}
 * @throws {@link CfRealtimeApiError} When the response is not ok
 */
export const handleResponse = async <TBody>(response: Response): Promise<TBody> => {
	if (!response.ok) {
		console.error("Fetched error response");
		console.error("Status code:", response.status);
		const body = await response.text();
		console.error("Body:", body);

		throw new CfRealtimeApiError(`Fetched error response: ${response.status}`);
	}

	return response.json() as Promise<TBody>;
};
