import { create } from 'zustand';
import dayjs from 'dayjs';
import { EmojiStatus } from '../components/ui/StatusEmoji';

export type Period = 'this_month' | 'last_month' | 'last_30_days' | 'this_year';

export interface TransactionFilters {
  type: 'all' | 'income' | 'expense';
  categories: string[];
  dateRange: { start: string; end: string } | null;
  searchQuery: string;
}

export const getRangeFromPeriod = (period: Period) => {
  switch (period) {
    case 'this_month':
      return {
        start: dayjs().startOf('month').format('YYYY-MM-DD'),
        end: dayjs().endOf('month').format('YYYY-MM-DD'),
      };
    case 'last_month':
      return {
        start: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
        end: dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
      };
    case 'last_30_days':
      return {
        start: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
        end: dayjs().format('YYYY-MM-DD'),
      };
    case 'this_year':
      return {
        start: dayjs().startOf('year').format('YYYY-MM-DD'),
        end: dayjs().endOf('year').format('YYYY-MM-DD'),
      };
    default:
      return {
        start: dayjs().startOf('month').format('YYYY-MM-DD'),
        end: dayjs().endOf('month').format('YYYY-MM-DD'),
      };
  }
};

export const getCurrentMonthRange = () => getRangeFromPeriod('this_month');

export const isDefaultDateRange = (dateRange: { start: string; end: string } | null) => {
  if (!dateRange) return false;
  const def = getCurrentMonthRange();
  return dateRange.start === def.start && dateRange.end === def.end;
};

interface AppState {
  dashboardPeriod: Period;
  refreshKey: number;
  activeFilters: TransactionFilters;
  globalEmojiStatus: EmojiStatus;
  setDashboardPeriod: (period: Period) => void;
  triggerRefresh: () => void;
  setFilters: (filters: Partial<TransactionFilters>) => void;
  setSearchQuery: (query: string) => void;
  clearSpecificFilter: (key: keyof TransactionFilters) => void;
  resetAllFilters: () => void;
  setGlobalEmojiStatus: (status: EmojiStatus) => void;
}

export const initialFilters: TransactionFilters = {
  type: 'all',
  categories: [],
  dateRange: getCurrentMonthRange(),
  searchQuery: '',
};

export const isInitialFilters = (filters: TransactionFilters) => {
  return (
    filters.type === initialFilters.type &&
    filters.categories.length === 0 &&
    filters.searchQuery === '' &&
    isDefaultDateRange(filters.dateRange)
  );
};

export const useStore = create<AppState>((set) => ({
  dashboardPeriod: 'this_month',
  refreshKey: 0,
  activeFilters: initialFilters,
  globalEmojiStatus: 'smile',
  setDashboardPeriod: (period) => set({ dashboardPeriod: period }),
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
  setFilters: (filters) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, ...filters },
      refreshKey: state.refreshKey + 1
    })),
  setSearchQuery: (query) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, searchQuery: query },
      refreshKey: state.refreshKey + 1
    })),
  clearSpecificFilter: (key) =>
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        [key]: initialFilters[key]
      },
      refreshKey: state.refreshKey + 1
    })),
  resetAllFilters: () =>
    set({
      activeFilters: initialFilters,
      refreshKey: Date.now()
    }),
  setGlobalEmojiStatus: (status) => set({ globalEmojiStatus: status }),
}));
