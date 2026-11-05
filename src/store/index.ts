// src/store/index.ts
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createTransform, FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from 'redux-persist';
import type { PersistConfig } from 'redux-persist';
import storage from 'redux-persist/lib/storage/session'; // sessionStorage
import authReduder from '@/store/slices/authSlice';
import type { AuthState } from '@/types/Auth';

const rootReducer = combineReducers({
	auth: authReduder,
});

type RootShape = ReturnType<typeof rootReducer>;

// sessionService owns the token; redux-persist must not keep a second copy.
const dropToken = createTransform<AuthState, AuthState>(
	(inbound) => ({ ...inbound, token: null }),
	(outbound) => outbound,
	{ whitelist: ['auth'] },
);

const persistConfig: PersistConfig<RootShape> = {
	key: 'root',
	storage,
	whitelist: ['auth'],
	transforms: [dropToken],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
	reducer: persistedReducer,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				// purge()/flush() dispatch a `result` callback and PERSIST carries a `register`
				// callback, so every lifecycle action must stay off the check.
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;