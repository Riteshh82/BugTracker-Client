import { createContext, useContext, useReducer, useCallback } from 'react';

const FilterContext = createContext(null);

const initialState = {
  project: '',
  module: '',
  feature: '',
  priority: [],   // multi-select array
  status: [],     // multi-select array
  type: [],       // multi-select array
  tags: [],       // multi-select array
  search: '',
  sortBy: 'createdAt',
  sortDir: 'desc',
};

function filterReducer(state, action) {
  switch (action.type) {
    case 'SET':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return { ...initialState };
    case 'SET_MANY':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

export function FilterProvider({ children }) {
  const [filters, dispatch] = useReducer(filterReducer, initialState);

  const setFilter = useCallback((field, value) => {
    dispatch({ type: 'SET', field, value });
  }, []);

  const resetFilters = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const setMany = useCallback((payload) => {
    dispatch({ type: 'SET_MANY', payload });
  }, []);

  // Check if any filter is active
  const hasActiveFilters = (
    filters.project ||
    filters.module ||
    filters.feature ||
    filters.priority.length > 0 ||
    filters.status.length > 0 ||
    filters.type.length > 0 ||
    filters.tags.length > 0 ||
    filters.search
  );

  // Convert filters to API query params
  const toQueryParams = (overrides = {}) => {
    const merged = { ...filters, ...overrides };
    const params = {};
    if (merged.project) params.project = merged.project;
    if (merged.module) params.module = merged.module;
    if (merged.feature) params.feature = merged.feature;
    if (merged.priority.length) params.priority = merged.priority.join(',');
    if (merged.status.length) params.status = merged.status.join(',');
    if (merged.type.length) params.type = merged.type.join(',');
    if (merged.tags.length) params.tags = merged.tags.join(',');
    if (merged.search) params.search = merged.search;
    params.sortBy = merged.sortBy;
    params.sortDir = merged.sortDir;
    return params;
  };

  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters, setMany, hasActiveFilters, toQueryParams }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilters must be used within FilterProvider');
  return ctx;
}
