import { createContext, useContext } from 'react';
export const HomeMotionContext = createContext({ enabled: true, toggle: () => {} });
export const useHomeMotion = () => useContext(HomeMotionContext);
