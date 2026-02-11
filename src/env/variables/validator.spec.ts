import { suite, test } from "vitest";

import { assertInstance } from "../../util/test/matcher.ts";
import { EnvironmentVariableValidators, InvalidEnvironmentVariableError } from "./validator.ts";

suite.concurrent("EnvironmentVariableValidators", () => {
	suite.concurrent("optional()", () => {
		test("throws when key exists with empty value", ({ expect }) => {
			const key = "emptyKey";
			const env = { [key]: "" };
			const instance = new EnvironmentVariableValidators(env);

			try {
				instance.optional(key);
				expect.fail("Expected to throw");
			} catch (error) {
				assertInstance(InvalidEnvironmentVariableError, error);

				expect(error.key).toBe(key);
				expect(error.message).toBe(`Optional environment variable "${key}" is empty`);
			}
		});

		test("returns value when key does not exist", ({ expect }) => {
			const key = "missingKey";
			const env = {};
			const instance = new EnvironmentVariableValidators(env);

			const result = instance.optional(key);
			expect(result).toBeUndefined();
		});

		test("returns value when key exists with non-empty value", ({ expect }) => {
			const key = "nonEmptyKey";
			const value = "v";
			const env = { [key]: value };
			const instance = new EnvironmentVariableValidators(env);

			const result = instance.optional(key);
			expect(result).toBe(value);
		});
	});

	suite.concurrent("required()", () => {
		test("throws when non-existent key", ({ expect }) => {
			const env = { other: "otherValue" };
			const instance = new EnvironmentVariableValidators(env);
			const missingKey = "missingKey";

			try {
				instance.required(missingKey);
				expect.fail("Expected to throw");
			} catch (error) {
				assertInstance(InvalidEnvironmentVariableError, error);

				expect(error.key).toBe(missingKey);
				expect(error.message).toBe(`Required environment variable "${missingKey}" is missing`);
			}
		});

		test("throws when key exists with empty value", ({ expect }) => {
			const key = "emptyKey";
			const env = { [key]: "" };
			const instance = new EnvironmentVariableValidators(env);

			try {
				instance.required(key);
				expect.fail("Expected to throw");
			} catch (error) {
				assertInstance(InvalidEnvironmentVariableError, error);

				expect(error.key).toBe(key);
				expect(error.message).toBe(`Required environment variable "${key}" is empty`);
			}
		});

		test("returns value when key exists with non-empty value", ({ expect }) => {
			const key = "nonEmptyKey";
			const value = "v";
			const env = { [key]: value };
			const instance = new EnvironmentVariableValidators(env);

			const result = instance.required(key);
			expect(result).toBe(value);
		});
	});
});
