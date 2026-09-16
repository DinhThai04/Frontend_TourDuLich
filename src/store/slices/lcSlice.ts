import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
type LCState = {
	currency: string;
	language: string;
};

const initialState: LCState = {
	currency: 'VNĐ',
	language: 'VN',
};

const lcSlice = createSlice({
	name: 'lc',
	initialState,
	reducers: {
		setCurrency(state, action: PayloadAction<string>) {
			state.currency = action.payload;
		},
		setLanguage(state, action: PayloadAction<string>) {
			state.language = action.payload;
		},
	},
});

export const { setCurrency, setLanguage } = lcSlice.actions;
export default lcSlice.reducer;
