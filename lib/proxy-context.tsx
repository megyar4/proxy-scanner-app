import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { ProxyResult, ScanOptions, ProxyType } from './proxy-scanner';

export interface ProxyScanState {
  results: ProxyResult[];
  isScanning: boolean;
  progress: {
    completed: number;
    total: number;
  };
  error: string | null;
  scanOptions: ScanOptions;
  proxyInput: string;
  selectedTypes: ProxyType[];
}

type ProxyAction =
  | { type: 'SET_PROXY_INPUT'; payload: string }
  | { type: 'SET_SELECTED_TYPES'; payload: ProxyType[] }
  | { type: 'SET_SCAN_OPTIONS'; payload: Partial<ScanOptions> }
  | { type: 'START_SCAN'; payload: { total: number } }
  | { type: 'ADD_RESULT'; payload: ProxyResult }
  | { type: 'UPDATE_PROGRESS'; payload: { completed: number } }
  | { type: 'COMPLETE_SCAN' }
  | { type: 'CLEAR_RESULTS' }
  | { type: 'SET_ERROR'; payload: string | null };

const defaultScanOptions: ScanOptions = {
  timeout: 10000,
  testUrl: 'http://httpbin.org/ip',
  threadCount: 5,
  types: ['http', 'https', 'socks4', 'socks5'],
};

const initialState: ProxyScanState = {
  results: [],
  isScanning: false,
  progress: { completed: 0, total: 0 },
  error: null,
  scanOptions: defaultScanOptions,
  proxyInput: '',
  selectedTypes: ['http', 'https', 'socks4', 'socks5'],
};

function proxyReducer(state: ProxyScanState, action: ProxyAction): ProxyScanState {
  switch (action.type) {
    case 'SET_PROXY_INPUT':
      return { ...state, proxyInput: action.payload };
    
    case 'SET_SELECTED_TYPES':
      return { ...state, selectedTypes: action.payload };
    
    case 'SET_SCAN_OPTIONS':
      return {
        ...state,
        scanOptions: { ...state.scanOptions, ...action.payload },
      };
    
    case 'START_SCAN':
      return {
        ...state,
        isScanning: true,
        results: [],
        progress: { completed: 0, total: action.payload.total },
        error: null,
      };
    
    case 'ADD_RESULT':
      return {
        ...state,
        results: [...state.results, action.payload],
      };
    
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        progress: { ...state.progress, completed: action.payload.completed },
      };
    
    case 'COMPLETE_SCAN':
      return {
        ...state,
        isScanning: false,
      };
    
    case 'CLEAR_RESULTS':
      return {
        ...state,
        results: [],
        progress: { completed: 0, total: 0 },
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isScanning: false,
      };
    
    default:
      return state;
  }
}

interface ProxyContextType {
  state: ProxyScanState;
  setProxyInput: (input: string) => void;
  setSelectedTypes: (types: ProxyType[]) => void;
  setScanOptions: (options: Partial<ScanOptions>) => void;
  startScan: (total: number) => void;
  addResult: (result: ProxyResult) => void;
  updateProgress: (completed: number) => void;
  completeScan: () => void;
  clearResults: () => void;
  setError: (error: string | null) => void;
}

const ProxyContext = createContext<ProxyContextType | undefined>(undefined);

export function ProxyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(proxyReducer, initialState);

  const setProxyInput = useCallback((input: string) => {
    dispatch({ type: 'SET_PROXY_INPUT', payload: input });
  }, []);

  const setSelectedTypes = useCallback((types: ProxyType[]) => {
    dispatch({ type: 'SET_SELECTED_TYPES', payload: types });
  }, []);

  const setScanOptions = useCallback((options: Partial<ScanOptions>) => {
    dispatch({ type: 'SET_SCAN_OPTIONS', payload: options });
  }, []);

  const startScan = useCallback((total: number) => {
    dispatch({ type: 'START_SCAN', payload: { total } });
  }, []);

  const addResult = useCallback((result: ProxyResult) => {
    dispatch({ type: 'ADD_RESULT', payload: result });
  }, []);

  const updateProgress = useCallback((completed: number) => {
    dispatch({ type: 'UPDATE_PROGRESS', payload: { completed } });
  }, []);

  const completeScan = useCallback(() => {
    dispatch({ type: 'COMPLETE_SCAN' });
  }, []);

  const clearResults = useCallback(() => {
    dispatch({ type: 'CLEAR_RESULTS' });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const value: ProxyContextType = {
    state,
    setProxyInput,
    setSelectedTypes,
    setScanOptions,
    startScan,
    addResult,
    updateProgress,
    completeScan,
    clearResults,
    setError,
  };

  return (
    <ProxyContext.Provider value={value}>
      {children}
    </ProxyContext.Provider>
  );
}

export function useProxyContext() {
  const context = useContext(ProxyContext);
  if (!context) {
    throw new Error('useProxyContext must be used within a ProxyProvider');
  }
  return context;
}
