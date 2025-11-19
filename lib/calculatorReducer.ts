import { CalculatorFormData, FormErrors } from '@/types';

/**
 * Calculator State
 */
export interface CalculatorState {
  formData: CalculatorFormData;
  errors: FormErrors;
  isLoading: boolean;
  showResumePrompt: boolean;
}

/**
 * Action Types
 */
export type CalculatorAction =
  | { type: 'SET_FIELD'; field: keyof CalculatorFormData; value: CalculatorFormData[keyof CalculatorFormData] }
  | { type: 'SET_FORM_DATA'; data: CalculatorFormData }
  | { type: 'SET_ERRORS'; errors: FormErrors }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_RESUME_PROMPT'; show: boolean }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET_FORM'; initialData: CalculatorFormData };

/**
 * Initial State Factory
 */
export function createInitialState(initialFormData: CalculatorFormData): CalculatorState {
  return {
    formData: initialFormData,
    errors: {},
    isLoading: false,
    showResumePrompt: false,
  };
}

/**
 * Calculator Reducer
 */
export function calculatorReducer(state: CalculatorState, action: CalculatorAction): CalculatorState {
  switch (action.type) {
    case 'SET_FIELD': {
      const newState = {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
      };

      // Clear error for this field if it exists
      if (state.errors[action.field as string]) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [action.field as string]: _, ...remainingErrors } = state.errors;
        newState.errors = remainingErrors;
      }

      return newState;
    }

    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: action.data,
      };

    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.errors,
      };

    case 'CLEAR_ERROR': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [action.field]: _, ...remainingErrors } = state.errors;
      return {
        ...state,
        errors: remainingErrors,
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading,
      };

    case 'SET_RESUME_PROMPT':
      return {
        ...state,
        showResumePrompt: action.show,
      };

    case 'NEXT_STEP': {
      const maxStep = 7; // Total steps in the calculator

      // Check bounds first - don't allow incrementing past max
      if (state.formData.currentStep >= maxStep) {
        return state; // Already at max, no change
      }

      let nextStep: number;

      // Skip steps 3 and 4 (Health Profile and Current Insurance) in simple mode
      if (state.formData.simpleMode && state.formData.currentStep === 2) {
        // From step 2 (Household), jump to step 5 (Budget)
        nextStep = 5;
      } else {
        nextStep = state.formData.currentStep + 1;
      }

      return {
        ...state,
        formData: {
          ...state.formData,
          currentStep: nextStep,
        },
      };
    }

    case 'PREV_STEP': {
      let prevStep = state.formData.currentStep - 1;

      // Skip steps 3 and 4 (Health Profile and Current Insurance) in simple mode
      if (state.formData.simpleMode) {
        // From step 5 (Budget), jump back to step 2 (Household)
        if (state.formData.currentStep === 5) {
          prevStep = 2; // Jump directly to Household
        }
      }

      // Bounds checking - ensure we don't go below minimum step
      const minStep = 1; // First step in the calculator
      if (prevStep < minStep) {
        prevStep = minStep;
      }

      return {
        ...state,
        formData: {
          ...state.formData,
          currentStep: prevStep,
        },
        errors: {}, // Clear errors when going back
      };
    }

    case 'RESET_FORM':
      return {
        ...state,
        formData: action.initialData,
        errors: {},
        showResumePrompt: false,
      };

    default:
      return state;
  }
}
