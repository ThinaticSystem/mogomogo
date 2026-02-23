import type {
	MogomogoSessionId,
	MuttererSession,
	TapperSession,
} from "../../server/storage-provider/interface.ts";
import type { ReadonlyRecursive } from "../../util/type.ts";

export namespace Db {
	export interface Api<TColumns, TKey extends keyof TColumns> {
		Create(columns: ReadonlyRecursive<TColumns>): Promise<void>;
		Read(key: TColumns[TKey]): Promise<null | TColumns>;
		List(condition: (columns: TColumns) => boolean): Promise<TColumns[]>;
		Update(
			condition: (columns: TColumns) => boolean,
			columns: Partial<ReadonlyRecursive<TColumns>>,
		): Promise<Set<TColumns[TKey]>>;
		Delete(condition: (columns: TColumns) => boolean): Promise<Set<TColumns[TKey]>>;
	}

	// Application land schema
	export type UserId = string;
	export type SessionId = string;
	export interface User {
		userId: UserId;
		name: string;
	}
	export interface Session {
		sessionId: SessionId;
		expiresAt: Date;
		userId: UserId;
	}
	export interface MutteringState {
		userId: UserId;
		mogomogoSessionId: MogomogoSessionId;
	}
	export interface TappingState {
		userId: UserId;
		mogomogoSessionId: MogomogoSessionId;
	}

	export interface Tables {
		// Mogomogo land tables
		muttererSessions: Api<
			MuttererSession & { mogomogoSessionId: MogomogoSessionId },
			"mogomogoSessionId"
		>;
		tapperSessions: Api<
			TapperSession & { mogomogoSessionId: MogomogoSessionId },
			"mogomogoSessionId"
		>;

		// Application land tables
		users: Api<User, "userId">;
		sessions: Api<Session, "sessionId">;
		mutteringStates: Api<MutteringState, "userId">;
		tappingStates: Api<TappingState, "userId">;
	}
}

const emptyTable = <V, K extends keyof V>(keyColumn: K): Db.Api<V, K> => {
	const map = new Map<V[K], V>();

	return {
		Create: async (columns) => {
			map.set((columns as V)[keyColumn], columns as V);
		},
		Read: async (key) => map.get(key) ?? null,
		List: async (condition) =>
			map
				.values()
				.filter((columns) => condition(columns))
				.toArray(),
		Update: async (condition, columns) =>
			new Set(
				map
					.entries()
					.filter(([_, v]) => condition(v))
					.map(([key, found]) => {
						// NOTE: For performance reasons, use a shared loop with foreach
						map.set(key, { ...found, ...columns });
						return key;
					}),
			),
		Delete: async (condition) =>
			new Set(
				map
					.entries()
					.filter(([_, v]) => condition(v))
					.map(([key]) => {
						// NOTE: For performance reasons, use a shared loop with foreach
						map.delete(key);
						return key;
					}),
			),
	};
};

export const createDb = (): Db.Tables => {
	// Mogomogo land tables
	const muttererSessions = emptyTable<
		MuttererSession & { mogomogoSessionId: MogomogoSessionId },
		"mogomogoSessionId"
	>("mogomogoSessionId");
	const tapperSessions = emptyTable<
		TapperSession & { mogomogoSessionId: MogomogoSessionId },
		"mogomogoSessionId"
	>("mogomogoSessionId");

	// Application land tables
	const users = emptyTable<Db.User, "userId">("userId");
	const sessions = emptyTable<Db.Session, "sessionId">("sessionId");
	const mutteringStates = emptyTable<Db.MutteringState, "userId">("userId");
	const tappingStates = emptyTable<Db.TappingState, "userId">("userId");

	return {
		muttererSessions,
		tapperSessions,
		users,
		sessions,
		mutteringStates,
		tappingStates,
	};
};
