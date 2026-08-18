import { useContext } from 'react';
import {
  HouseholdDataContext,
  type HouseholdDataContextValue,
} from '../context/HouseholdDataContext';

export const useHouseholdData = (): HouseholdDataContextValue => {
  const context = useContext(HouseholdDataContext);
  if (!context) {
    throw new Error('useHouseholdData, HouseholdDataProvider içinde kullanılmalıdır.');
  }
  return context;
};
