import { useContext } from 'react';
import { HouseholdContext, type HouseholdContextValue } from '../context/HouseholdContext';

export const useHousehold = (): HouseholdContextValue => {
  const context = useContext(HouseholdContext);
  if (!context) throw new Error('useHousehold, HouseholdProvider içinde kullanılmalıdır.');
  return context;
};
