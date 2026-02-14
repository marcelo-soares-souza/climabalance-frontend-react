import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CompensationMode } from '@/types/compensation';

interface CompensationSelection {
  areaId: string | null;
  areaName: string | null;
  calculationId: string | null;
  compensationMode: CompensationMode | null;
  treesRequested: number | null;
  totalTCO2e: number | null;
  totalAmount: number | null;
  currency: string;
}

interface CompensationStore extends CompensationSelection {
  setSelection: (data: Partial<CompensationSelection>) => void;
  clearSelection: () => void;
}

const initialState: CompensationSelection = {
  areaId: null,
  areaName: null,
  calculationId: null,
  compensationMode: null,
  treesRequested: null,
  totalTCO2e: null,
  totalAmount: null,
  currency: 'BRL',
};

export const useCompensationStore = create<CompensationStore>()(
  persist(
    (set) => ({
      ...initialState,
      setSelection: (data) => set((state) => ({ ...state, ...data })),
      clearSelection: () => set(initialState),
    }),
    { name: 'cb_compensation' },
  ),
);
