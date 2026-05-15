// @ts-check
"use strict";

import { CONSTS } from "./consts.js";
import { startMuttering, startTapping, stopMuttering, stopTapping } from "./service.js";
import { callBackendApi } from "./util/backend-api.js";
import { loggerOf } from "./util/logger.js";
import { $ } from "./util/view/dom.js";
import { Scene } from "./util/view/scene.js";

const $main = $("main");
export const $console = $("pre");
$(/** @type {HTMLDivElement} */ (document.getElementById("container")), ($) => {
	$("header", ($) => {
		$("h1", ($) => {
			$.textContent = "Mogomogo Test Client";
		});
	});

	$($main);

	$("section", ($) => {
		$("h2", ($) => {
			$.textContent = "Console";
		});
		$($console);
	});
});

/**
 * @satisfies {Record<string, (...args: any[]) => HTMLElement>}
 */
const components = {
	/**
	 * @param {{ onClicked: () => void }} opts
	 */
	LoggedOutButton: ({ onClicked }) =>
		$("button", ($) => {
			$.textContent = "Log out";
			$.addEventListener("click", async () => {
				await callBackendApi("/logout", "POST", {});
				onClicked();
			});
		}),
};

/**
 * @type {Scene<{
 *   loggedOut: undefined;
 *   loggedIn: {
 *     user: {
 *       id: string;
 *       name: string;
 *     },
 *   };
 * }>}
 */
export const rootScene = new Scene($main, {
	loggedOut: ({ scene }) =>
		$("div", ($) => {
			$("h2", ($) => {
				$.textContent = "Welcome to the Calls API demo app";
			});
			const USER_SELECT_ID = "user-select";
			$("label", ($) => {
				$.textContent = "Login as:";
				$.htmlFor = USER_SELECT_ID;
			});
			const $userSelect = $("select", ($) => {
				$.id = USER_SELECT_ID;
				for (const [key, user] of Object.entries(CONSTS.users)) {
					$("option", ($) => {
						$.value = key;
						$.textContent = user.name;
					});
				}
			});
			$("button", ($) => {
				$.textContent = "Log in";
				$.addEventListener("click", async () => {
					const selectedUser = /** @type {keyof typeof CONSTS.users} */ ($userSelect.value);
					const { user } = await callBackendApi("/login", "POST", {
						body: {
							idToken: CONSTS.users[selectedUser].idToken,
						},
					});
					scene.goto("loggedIn", {
						user,
					});
				});
			});
		}),

	loggedIn: ({ scene, args: { user } }) =>
		$("div", ($) => {
			$("div", ($) => {
				$("h2", ($) => {
					$.textContent = `You are ${user.name}`;
				});
				$(
					components.LoggedOutButton({
						onClicked: () => scene.goto("loggedOut"),
					}),
				);
			});
			const $video = $("video", ($) => {
				$.id = "my-video";
				$.autoplay = true;
				$.muted = true;
				$.playsInline = true;
			});

			/**
			 * @type {Scene<{
			 *   stopped: undefined;
			 *   started: {
			 *     sessionDescription: RTCSessionDescriptionInit;
			 *   };
			 * }>}
			 */
			const mutteringScene = new Scene($, {
				stopped: ({ scene }) =>
					$("button", ($) => {
						$.textContent = "Start muttering";
						$.addEventListener("click", async () => {
							const logger = loggerOf("startMutteringHandler");

							$.textContent = "Starting muttering...";
							(await startMuttering({ $video }))
								.map({
									success: ({ sessionDescription }) => {
										scene.goto("started", { sessionDescription });
									},
									error: (value) => {
										logger.error(value);
										alert("Failed to start muttering.\nPlease check the console for details.");
										$.textContent = "Start muttering";
									},
								})
								.unwrapOrThrow();
						});
					}),
				started: ({ scene, args: { sessionDescription } }) =>
					$("button", ($) => {
						const logger = loggerOf("stopMutteringHandler");

						$.textContent = "Stop muttering";
						$.addEventListener("click", async () => {
							(await stopMuttering({ sessionDescription }))
								.map({
									success: () => {
										scene.goto("stopped");
									},
									error: (value) => {
										logger.error(value);
										alert("Failed to stop muttering.\nPlease check the console for details.");
										$.textContent = "Stop muttering";
									},
								})
								.unwrapOrThrow();
						});
					}),
			});
			mutteringScene.goto("stopped");

			$("div", ($) => {
				const MUTTERING_LIST_ID = "muttering-list";
				$("label", ($) => {
					$.textContent = "Mutterings:";
					$.htmlFor = MUTTERING_LIST_ID;
				});
				$("select", async ($) => {
					$.id = MUTTERING_LIST_ID;
					void callBackendApi("/mutterings", "GET", {}).then((mutterings) => {
						const options = mutterings.map((muttering) =>
							$("option", ($) => {
								$.value = muttering.mogomogoSessionId;
								$.textContent = `${muttering.userId}`;
							}),
						);
						// NOTE: This is an asynchronous context
						// the parent element has already been rendered, and we need to call append() ourselves
						$.append(...options);
					});
				});
			});

			/**
			 * @type {Scene<{
			 *   stopped: undefined;
			 *   started: {
			 *     sessionDescription: RTCSessionDescriptionInit;
			 *     muttererSessionId: string;
			 *   };
			 * }>}
			 */
			const tappingScene = new Scene($, {
				stopped: ({ scene }) =>
					$("button", ($) => {
						$.textContent = "Start tapping";
						$.addEventListener("click", async () => {
							const logger = loggerOf("startTappingHandler");

							$.textContent = "Starting tapping...";
							const mutteringSelect = /** @type {HTMLSelectElement} */ (
								document.getElementById("muttering-list")
							);
							const muttererSessionId = mutteringSelect.value;
							(await startTapping({ muttererSessionId, $video }))
								.map({
									success: ({ sessionDescription }) => {
										scene.goto("started", { sessionDescription, muttererSessionId });
									},
									error: (value) => {
										logger.error(value);
										alert("Failed to start tapping.\nPlease check the console for details.");
										$.textContent = "Start tapping";
									},
								})
								.unwrapOrThrow();
						});
					}),
				started: ({ scene, args: { sessionDescription, muttererSessionId } }) =>
					$("button", ($) => {
						const logger = loggerOf("stopTappingHandler");

						$.textContent = "Stop tapping";
						$.addEventListener("click", async () => {
							(await stopTapping({ sessionDescription, muttererSessionId }))
								.map({
									success: () => {
										scene.goto("stopped");
									},
									error: (value) => {
										logger.error(value);
										alert("Failed to stop tapping.\nPlease check the console for details.");
										$.textContent = "Stop tapping";
									},
								})
								.unwrapOrThrow();
						});
					}),
			});
			tappingScene.goto("stopped");
		}),
});
