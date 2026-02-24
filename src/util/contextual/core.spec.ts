import type { Needs, NeedsAsync } from "./core.ts";

import { suite, test } from "vitest";

import { runWithContext, withContext, withContextAsync } from "./core.ts";

suite.concurrent("runWithContext()", () => {
	suite.concurrent("provides same context values", () => {
		suite.concurrent("top-level", () => {
			test("sync", ({ expect }) => {
				const AToken = Symbol("A");
				const AValue = Symbol("AValue");
				const AContext = { [AToken]: AValue };
				type AContext = typeof AContext;
				const BToken = Symbol("B");
				const BValue = Symbol("BValue");
				const BContext = { [BToken]: BValue };
				type BContext = typeof BContext;

				runWithContext([AContext, BContext], function* () {
					yield (context) => {
						expect(context[AToken]).toBe(AValue);
						expect(context[BToken]).toBe(BValue);

						const expectedTokens = [AToken, BToken];
						for (const key of Object.getOwnPropertySymbols(context)) {
							expect(expectedTokens).toContain(key);
						}
					};
				});

				expect.assertions(/* Value assertions: */ 2 + /* Key assertions: */ 2);
			});

			test("async", async ({ expect }) => {
				const AToken = Symbol("A");
				const AValue = Symbol("AValue");
				const AContext = { [AToken]: AValue };
				type AContext = typeof AContext;
				const BToken = Symbol("B");
				const BValue = Symbol("BValue");
				const BContext = { [BToken]: BValue };
				type BContext = typeof BContext;

				await runWithContext([AContext, BContext], async function* () {
					await Promise.resolve();
					yield (context: Readonly<AContext & BContext>) => {
						expect(context[AToken]).toBe(AValue);
						expect(context[BToken]).toBe(BValue);

						const expectedTokens = [AToken, BToken];
						for (const key of Object.getOwnPropertySymbols(context)) {
							expect(expectedTokens).toContain(key);
						}
					};
				});

				expect.assertions(/* Value assertions: */ 2 + /* Key assertions: */ 2);
			});
		});

		suite.concurrent("delegated consumer", () => {
			test("sync", ({ expect }) => {
				const AToken = Symbol("A");
				const AValue = Symbol("AValue");
				const AContext = { [AToken]: AValue };
				type AContext = typeof AContext;
				const BToken = Symbol("B");
				const BValue = Symbol("BValue");
				const BContext = { [BToken]: BValue };
				type BContext = typeof BContext;

				runWithContext([AContext, BContext], function* () {
					function* consumer(): Needs<AContext & BContext, void> {
						yield (context) => {
							expect(context[AToken]).toBe(AValue);
							expect(context[BToken]).toBe(BValue);
						};
					}
					yield* consumer();
				});

				expect.assertions(2);
			});

			test("async", async ({ expect }) => {
				const AToken = Symbol("A");
				const AValue = Symbol("AValue");
				const AContext = { [AToken]: AValue };
				type AContext = typeof AContext;
				const BToken = Symbol("B");
				const BValue = Symbol("BValue");
				const BContext = { [BToken]: BValue };
				type BContext = typeof BContext;

				await runWithContext([AContext, BContext], async function* () {
					async function* consumer(): NeedsAsync<AContext & BContext, void> {
						await Promise.resolve();
						yield (context) => {
							expect(context[AToken]).toBe(AValue);
							expect(context[BToken]).toBe(BValue);
						};
					}
					yield* consumer();
				});

				expect.assertions(2);
			});
		});
	});

	suite.concurrent("returns return value", () => {
		test("sync", ({ expect }) => {
			const ReturnValue = Symbol("ReturnValue");

			const result = runWithContext(
				[],
				// oxlint-disable-next-line require-yield
				function* () {
					return ReturnValue;
				},
			);

			expect(result).toBe(ReturnValue);
		});

		test("async", async ({ expect }) => {
			const ReturnValue = Symbol("ReturnValue");

			const result = await runWithContext(
				[],
				// oxlint-disable-next-line require-yield
				async function* () {
					await Promise.resolve();
					return ReturnValue;
				},
			);

			expect(result).toBe(ReturnValue);
		});
	});

	suite.concurrent("provides context multiple times", () => {
		test("sync", ({ expect }) => {
			const ExpectedToken = Symbol("Expected");
			const ExpectedValue = Symbol("ExpectedValue");
			const ExpectedContext = { [ExpectedToken]: ExpectedValue };

			const nofYields = 2;

			runWithContext([ExpectedContext], function* () {
				for (let i = 0; i < nofYields; i++) {
					yield (context) => {
						expect(context[ExpectedToken]).toBe(ExpectedValue);
					};
				}
			});

			expect.assertions(nofYields);
		});

		test("async", async ({ expect }) => {
			const ExpectedToken = Symbol("Expected");
			const ExpectedValue = Symbol("ExpectedValue");
			const ExpectedContext = { [ExpectedToken]: ExpectedValue };
			type ExpectedContext = typeof ExpectedContext;

			const nofYields = 2;

			await runWithContext([ExpectedContext], async function* () {
				await Promise.resolve();
				for (let i = 0; i < nofYields; i++) {
					await Promise.resolve();
					yield (context: Readonly<ExpectedContext>) => {
						expect(context[ExpectedToken]).toBe(ExpectedValue);
					};
				}
			});

			expect.assertions(nofYields);
		});
	});

	suite.concurrent("when empty context, provides empty context", () => {
		test("sync", ({ expect }) => {
			runWithContext([], function* () {
				yield (context) => {
					expect(context).toStrictEqual({});
				};
			});

			expect.assertions(1);
		});

		test("async", async ({ expect }) => {
			await runWithContext([], async function* () {
				await Promise.resolve();
				yield (context: Readonly<unknown>) => {
					expect(context).toStrictEqual({});
				};
			});

			expect.assertions(1);
		});
	});
});

suite.concurrent("withContext(), withContextAsync()", () => {
	suite.concurrent("provides same additional & parent values", () => {
		test("sync (withContext())", ({ expect }) => {
			const ParentToken = Symbol("Parent");
			const ParentValue = Symbol("ParentValue");
			const ParentContext = { [ParentToken]: ParentValue };
			type ParentContext = typeof ParentContext;
			const AdditionalAToken = Symbol("AdditionalA");
			const AdditionalAValue = Symbol("AdditionalAValue");
			const AdditionalAContext = { [AdditionalAToken]: AdditionalAValue };
			type AdditionalAContext = typeof AdditionalAContext;
			const AdditionalBToken = Symbol("AdditionalB");
			const AdditionalBValue = Symbol("AdditionalBValue");
			const AdditionalBContext = { [AdditionalBToken]: AdditionalBValue };
			type AdditionalBContext = typeof AdditionalBContext;

			runWithContext([ParentContext], function* () {
				yield* withContext([AdditionalAContext, AdditionalBContext], function* () {
					yield (context: Readonly<ParentContext & AdditionalAContext & AdditionalBContext>) => {
						expect(context[ParentToken]).toBe(ParentValue);
						expect(context[AdditionalAToken]).toBe(AdditionalAValue);
						expect(context[AdditionalBToken]).toBe(AdditionalBValue);

						const expectedTokens = [ParentToken, AdditionalAToken, AdditionalBToken];
						for (const key of Object.getOwnPropertySymbols(context)) {
							expect(expectedTokens).toContain(key);
						}
					};
				});
			});

			expect.assertions(/* Value assertions: */ 3 + /* Key assertions: */ 3);
		});

		test("async (withContextAsync())", async ({ expect }) => {
			const ParentToken = Symbol("Parent");
			const ParentValue = Symbol("ParentValue");
			const ParentContext = { [ParentToken]: ParentValue };
			type ParentContext = typeof ParentContext;
			const AdditionalAToken = Symbol("AdditionalA");
			const AdditionalAValue = Symbol("AdditionalAValue");
			const AdditionalAContext = { [AdditionalAToken]: AdditionalAValue };
			type AdditionalAContext = typeof AdditionalAContext;
			const AdditionalBToken = Symbol("AdditionalB");
			const AdditionalBValue = Symbol("AdditionalBValue");
			const AdditionalBContext = { [AdditionalBToken]: AdditionalBValue };
			type AdditionalBContext = typeof AdditionalBContext;

			await runWithContext([ParentContext], async function* () {
				yield* withContextAsync([AdditionalAContext, AdditionalBContext], async function* () {
					await Promise.resolve();
					yield (context: Readonly<ParentContext & AdditionalAContext & AdditionalBContext>) => {
						expect(context[ParentToken]).toBe(ParentValue);
						expect(context[AdditionalAToken]).toBe(AdditionalAValue);
						expect(context[AdditionalBToken]).toBe(AdditionalBValue);

						const expectedTokens = [ParentToken, AdditionalAToken, AdditionalBToken];
						for (const key of Object.getOwnPropertySymbols(context)) {
							expect(expectedTokens).toContain(key);
						}
					};
				});
			});

			expect.assertions(/* Value assertions: */ 3 + /* Key assertions: */ 3);
		});
	});

	suite.concurrent("returns return value", () => {
		test("sync (withContext())", ({ expect }) => {
			const ReturnValue = Symbol("ReturnValue");

			const result = runWithContext([], function* () {
				return yield* withContext(
					[],
					// oxlint-disable-next-line require-yield
					function* () {
						return ReturnValue;
					},
				);
			});

			expect(result).toBe(ReturnValue);
		});

		test("async (withContextAsync())", async ({ expect }) => {
			const ReturnValue = Symbol("ReturnValue");

			const result = await runWithContext([], async function* () {
				return yield* withContextAsync(
					[],
					// oxlint-disable-next-line require-yield
					async function* () {
						await Promise.resolve();
						return ReturnValue;
					},
				);
			});

			expect(result).toBe(ReturnValue);
		});
	});

	suite.concurrent("provides context multiple times", () => {
		test("sync (withContext())", ({ expect }) => {
			const ParentToken = Symbol("Parent");
			const ParentValue = Symbol("ParentValue");
			const ParentContext = { [ParentToken]: ParentValue };
			type ParentContext = typeof ParentContext;
			const AdditionalToken = Symbol("Additional");
			const AdditionalValue = Symbol("AdditionalValue");
			const AdditionalContext = { [AdditionalToken]: AdditionalValue };
			type AdditionalContext = typeof AdditionalContext;

			const nofYields = 2;

			runWithContext([ParentContext], function* () {
				yield* withContext([AdditionalContext], function* () {
					for (let i = 0; i < nofYields; i++) {
						yield (context: Readonly<ParentContext & AdditionalContext>) => {
							expect(context[ParentToken]).toBe(ParentValue);
							expect(context[AdditionalToken]).toBe(AdditionalValue);
						};
					}
				});
			});

			expect.assertions(nofYields * 2);
		});

		test("async (withContextAsync())", async ({ expect }) => {
			const ParentToken = Symbol("Parent");
			const ParentValue = Symbol("ParentValue");
			const ParentContext = { [ParentToken]: ParentValue };
			type ParentContext = typeof ParentContext;
			const AdditionalToken = Symbol("Additional");
			const AdditionalValue = Symbol("AdditionalValue");
			const AdditionalContext = { [AdditionalToken]: AdditionalValue };
			type AdditionalContext = typeof AdditionalContext;

			const nofYields = 2;

			await runWithContext([ParentContext], async function* () {
				yield* withContextAsync([AdditionalContext], async function* () {
					await Promise.resolve();
					for (let i = 0; i < nofYields; i++) {
						await Promise.resolve();
						yield (context: Readonly<ParentContext & AdditionalContext>) => {
							expect(context[ParentToken]).toBe(ParentValue);
							expect(context[AdditionalToken]).toBe(AdditionalValue);
						};
					}
				});
			});

			expect.assertions(nofYields * 2);
		});
	});

	suite.concurrent("when empty additional context, provides only parent context", () => {
		test("sync (withContext())", ({ expect }) => {
			const ParentToken = Symbol("Parent");
			const ParentValue = Symbol("ParentValue");
			const ParentContext = { [ParentToken]: ParentValue };
			type ParentContext = typeof ParentContext;

			runWithContext([ParentContext], function* () {
				yield* withContext([], function* () {
					yield (context: Readonly<ParentContext>) => {
						expect(context[ParentToken]).toBe(ParentValue);

						const expectedTokens = [ParentToken];
						for (const key of Object.getOwnPropertySymbols(context)) {
							expect(expectedTokens).toContain(key);
						}
					};
				});
			});

			expect.assertions(/* Value assertions: */ 1 + /* Key assertions: */ 1);
		});

		test("async (withContextAsync())", async ({ expect }) => {
			const ParentToken = Symbol("Parent");
			const ParentValue = Symbol("ParentValue");
			const ParentContext = { [ParentToken]: ParentValue };
			type ParentContext = typeof ParentContext;

			await runWithContext([ParentContext], async function* () {
				yield* withContextAsync([], async function* () {
					await Promise.resolve();
					yield (context: Readonly<ParentContext>) => {
						expect(context[ParentToken]).toBe(ParentValue);
					};
				});
			});

			expect.assertions(1);
		});
	});
});
