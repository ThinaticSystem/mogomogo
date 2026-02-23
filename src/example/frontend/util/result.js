// @ts-check
"use strict";

import { loggerOf } from "./logger.js";

const logger = loggerOf("Result");

/**
 * @template TSuccessValue
 * @template {'success' | 'error'} [TStatus='success' | 'error']
 */
export class Result {
	/**
	 * @readonly
	 * @type {TStatus}
	 */
	status;

	/**
	 * @readonly
	 * @type {TStatus extends "success" ? TSuccessValue : unknown}
	 */
	value;

	/**
	 * @template TSuccessValue
	 * @param {TSuccessValue} value
	 * @returns {Result<TSuccessValue, "success">}
	 */
	static success(value) {
		return new Result("success", value);
	}

	/**
	 * @template TErrorValue
	 * @param {TErrorValue} value
	 * @returns {Result<unknown, "error">}
	 */
	static error(value) {
		return new Result("error", value);
	}

	/**
	 * @template TResult
	 * @param {() => Promise<TResult>} process
	 * @returns {Promise<Result<TResult>>}
	 */
	static wrapAsyncProcess = (process) =>
		process()
			.then((data) => new Result("success", data))
			.catch((error) => new Result("error", error));

	/**
	 * @param {TStatus} status
	 * @param {TStatus extends "success" ? TSuccessValue : unknown} value
	 */
	constructor(status, value) {
		this.status = status;
		this.value = value;
	}

	/**
	 * @template TSuccessMapped
	 * @template TErrorMapped
	 * @param {{
	 *   success: (value: TSuccessValue) => TSuccessMapped,
	 *   error: (value: unknown) => TErrorMapped,
	 * }} handlers
	 * @returns {Result<TSuccessMapped | TErrorMapped>}
	 */
	map(handlers) {
		try {
			switch (this.status) {
				case "success": {
					const mappedValue = handlers.success(/** @type {TSuccessValue} */ (this.value));
					return Result.success(mappedValue);
				}
				case "error": {
					const mappedError = handlers.error(/** @type {unknown} */ (this.value));
					// @ts-expect-error
					return Result.error(mappedError);
				}
			}
		} catch (mappingError) {
			logger.error("Error occurred while mapping Result:", mappingError);
			// @ts-expect-error
			return Result.error(mappingError);
		}
	}

	unwrapOrThrow() {
		switch (this.status) {
			case "success":
				return /** @type {TSuccessValue} */ (this.value);
			case "error":
				logger.error("Error occurred while unwrapping Result:", this.value);
				throw this.value;
		}
	}

	/**
	 * @template TDefaultValue
	 * @param {TDefaultValue} defaultValue
	 */
	unwrapOr(defaultValue) {
		const mapped = this.map({
			success: (value) => value,
			error: () => defaultValue,
		});
		return mapped.unwrapOrThrow();
	}
}
