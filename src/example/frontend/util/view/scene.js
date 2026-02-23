// @ts-check
"use strict";

/**
 * @template {Record<string, unknown>} TArgs
 */
export class Scene {
	/**
	 * @readonly
	 */
	#parentNode;

	/**
	 * @readonly
	 */
	#states;

	/**
	 * @type {null | Element}
	 */
	#currentElement = null;

	/**
	 * @param {Node} parentNode
	 * @param {{ [K in keyof TArgs]: (opts: { scene: Scene<TArgs>, args: TArgs[K] }) => Element }} states
	 */
	constructor(parentNode, states) {
		this.#parentNode = parentNode;
		this.#states = states;
	}

	/**
	 * @template {{ [K in keyof TArgs]: TArgs[K] extends undefined ? K : never }[keyof TArgs]} TState
	 * @overload
	 * @param {TState} state
	 * @returns {void}
	 */
	/**
	 * @template {keyof TArgs} TState
	 * @overload
	 * @param {TState} state
	 * @param {TArgs[TState]} stateArgs
	 * @returns {void}
	 */
	/**
	 * @param {keyof TArgs} state
	 * @param {TArgs[keyof TArgs]} [args]
	 * @returns {void}
	 */
	goto(state, args) {
		this.#currentElement?.remove();
		this.#currentElement = this.#states[state](
			// @ts-expect-error
			{
				scene: this,
				args,
			},
		);
		this.#parentNode.appendChild(this.#currentElement);
	}
}
