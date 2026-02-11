import { suite, test } from "vitest";

import { runWithContext } from "./core.ts";
import { getContext } from "./util.ts";

suite.concurrent("getContext()", () => {
	suite.concurrent("provides same context value", () => {
		test("sync", ({ expect }) => {
			const ExpectedToken = Symbol("Expected");
			const ExpectedValue = Symbol("ExpectedValue");
			const ExpectedContext = { [ExpectedToken]: ExpectedValue };

			runWithContext([ExpectedContext], function* () {
				const context = yield* getContext();
				expect(context).toStrictEqual(ExpectedContext);
			});

			expect.assertions(1);
		});

		test("async", async ({ expect }) => {
			const ExpectedToken = Symbol("Expected");
			const ExpectedValue = Symbol("ExpectedValue");
			const ExpectedContext = { [ExpectedToken]: ExpectedValue };

			await runWithContext([ExpectedContext], async function* () {
				await Promise.resolve();
				const context = yield* getContext();
				expect(context).toStrictEqual(ExpectedContext);
			});

			expect.assertions(1);
		});
	});

	suite.concurrent("when empty context, provides empty context", () => {
		test("sync", ({ expect }) => {
			runWithContext([], function* () {
				const context = yield* getContext();
				expect(context).toStrictEqual({});
			});

			expect.assertions(1);
		});

		test("async", async ({ expect }) => {
			await runWithContext([], async function* () {
				await Promise.resolve();
				const context = yield* getContext();
				expect(context).toStrictEqual({});
			});

			expect.assertions(1);
		});
	});
});
