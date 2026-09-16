import { createSlice } from '@reduxjs/toolkit';

const testSlice = createSlice({
	name: 'test',
	initialState: { value: 0 },
	reducers: {},
});

export default testSlice.reducer;
