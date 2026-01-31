import { suite, test } from "vitest";

import { runWithContext } from "./core.ts";
import { getContext } from "./util.ts";

suite.concurrent("getContext()", () => {
	test("returns same context value", ({ expect }) => {
		const ExpectedToken = Symbol("Expected");
		const ExpectedValue = Symbol("ExpectedValue");
		const ExpectedContext = { [ExpectedToken]: ExpectedValue };

		runWithContext([ExpectedContext], function* () {
			const context = yield* getContext();
			expect(context).toStrictEqual(ExpectedContext);
		});

		expect.assertions(1);
	});

	test("when empty context, returns empty object", ({ expect }) => {
		runWithContext([], function* () {
			const context = yield* getContext();
			expect(context).toStrictEqual({});
		});

		expect.assertions(1);
	});
});
