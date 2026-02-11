import { throws } from "../../util/throw.ts";

export class InvalidEnvironmentVariableError extends Error {
	readonly key: string;

	constructor(key: string, message: string) {
		super(message);
		this.name = "InvalidEnvironmentVariableError";

		this.key = key;
	}
}

export class EnvironmentVariableValidators {
	readonly #variables: Record<string, undefined | string>;

	constructor(variables: Record<string, undefined | string>) {
		this.#variables = variables;
	}

	/**
	 * Get optional environment variable or throw
	 * @throws If the value is empty
	 */
	optional = (key: string) => {
		const value = this.#variables[key];
		if (value === "")
			throw new InvalidEnvironmentVariableError(
				key,
				`Optional environment variable "${key}" is empty`,
			);
		return value;
	};

	/**
	 * Get required environment variable or throw
	 * @throws If the value is missing or empty
	 */
	required = (key: string) =>
		(this.#variables[key] ??
			throws(
				new InvalidEnvironmentVariableError(
					key,
					`Required environment variable "${key}" is missing`,
				),
			)) ||
		throws(
			new InvalidEnvironmentVariableError(key, `Required environment variable "${key}" is empty`),
		);
}
