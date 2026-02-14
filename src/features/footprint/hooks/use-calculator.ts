import { useState, useCallback } from 'react';
import type { ProfileType, FootprintInput, DataQuality } from '@/types/footprint';

export type CalculatorStep = 'profile' | 'energy' | 'transport' | 'fuel' | 'flights' | 'scope1' | 'scope2' | 'scope3' | 'result';

const INDIVIDUAL_STEPS: CalculatorStep[] = ['profile', 'energy', 'transport', 'fuel', 'flights', 'result'];
const LEGAL_ENTITY_STEPS: CalculatorStep[] = ['profile', 'scope1', 'scope2', 'scope3', 'result'];

export interface CalculatorState {
  profileType: ProfileType;
  periodStart: string;
  periodEnd: string;
  dataQuality: DataQuality;
  inputs: FootprintInput[];
  currentStepIndex: number;
}

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>({
    profileType: 'individual',
    periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    periodEnd: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
    dataQuality: 'estimated',
    inputs: [],
    currentStepIndex: 0,
  });

  const steps = state.profileType === 'individual' ? INDIVIDUAL_STEPS : LEGAL_ENTITY_STEPS;
  const currentStep = steps[state.currentStepIndex];
  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === steps.length - 1;
  const totalSteps = steps.length;

  const setProfileType = useCallback((profileType: ProfileType) => {
    setState((prev) => ({ ...prev, profileType, currentStepIndex: 0, inputs: [] }));
  }, []);

  const setPeriod = useCallback((periodStart: string, periodEnd: string) => {
    setState((prev) => ({ ...prev, periodStart, periodEnd }));
  }, []);

  const setDataQuality = useCallback((dataQuality: DataQuality) => {
    setState((prev) => ({ ...prev, dataQuality }));
  }, []);

  const addInputs = useCallback((newInputs: FootprintInput[]) => {
    setState((prev) => {
      const categories = newInputs.map((i) => i.category);
      const filtered = prev.inputs.filter((i) => !categories.includes(i.category));
      return { ...prev, inputs: [...filtered, ...newInputs] };
    });
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: Math.min(prev.currentStepIndex + 1, steps.length - 1),
    }));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: Math.max(prev.currentStepIndex - 1, 0),
    }));
  }, []);

  const goToStep = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: Math.max(0, Math.min(index, steps.length - 1)),
    }));
  }, [steps.length]);

  const reset = useCallback(() => {
    setState({
      profileType: 'individual',
      periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      periodEnd: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0],
      dataQuality: 'estimated',
      inputs: [],
      currentStepIndex: 0,
    });
  }, []);

  return {
    state,
    steps,
    currentStep,
    currentStepIndex: state.currentStepIndex,
    isFirstStep,
    isLastStep,
    totalSteps,
    setProfileType,
    setPeriod,
    setDataQuality,
    addInputs,
    nextStep,
    prevStep,
    goToStep,
    reset,
  };
}
