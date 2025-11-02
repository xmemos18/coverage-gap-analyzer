import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Step1Residences from '../Step1Residences';
import { Residence, FormErrors } from '@/types';

describe('Step1Residences Component', () => {
  const mockOnUpdate = jest.fn();
  const mockOnNext = jest.fn();

  const defaultResidences: Residence[] = [
    { zip: '', state: '', isPrimary: true },
    { zip: '', state: '', isPrimary: false },
  ];

  const defaultErrors: FormErrors = {};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render primary and secondary residence fields', () => {
    render(
      <Step1Residences
        residences={defaultResidences}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText('Primary Residence')).toBeInTheDocument();
    expect(screen.getByText('Secondary Residence')).toBeInTheDocument();
  });

  it('should render heading and description with proper ARIA labels', () => {
    render(
      <Step1Residences
        residences={defaultResidences}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const heading = screen.getByText('Your Residences');
    expect(heading).toHaveAttribute('id', 'residences-heading');

    const form = screen.getByRole('form');
    expect(form).toHaveAttribute('aria-labelledby', 'residences-heading');
  });

  it('should call onUpdate when ZIP code is changed', () => {
    render(
      <Step1Residences
        residences={defaultResidences}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const zipInputs = screen.getAllByLabelText(/ZIP code/i);
    const primaryZipInput = zipInputs[0];

    fireEvent.change(primaryZipInput, { target: { value: '12345' } });

    expect(mockOnUpdate).toHaveBeenCalledWith('residences', [
      { zip: '12345', state: '', isPrimary: true },
      { zip: '', state: '', isPrimary: false },
    ]);
  });

  it('should sanitize ZIP code input (remove non-numeric characters)', () => {
    render(
      <Step1Residences
        residences={defaultResidences}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const zipInputs = screen.getAllByLabelText(/ZIP code/i);
    const primaryZipInput = zipInputs[0];

    fireEvent.change(primaryZipInput, { target: { value: '123-45' } });

    // ZIP should be sanitized to remove dash
    expect(mockOnUpdate).toHaveBeenCalledWith('residences', [
      { zip: '12345', state: '', isPrimary: true },
      { zip: '', state: '', isPrimary: false },
    ]);
  });

  it('should truncate ZIP codes to 5 digits', () => {
    render(
      <Step1Residences
        residences={defaultResidences}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const zipInputs = screen.getAllByLabelText(/ZIP code/i);
    fireEvent.change(zipInputs[0], { target: { value: '123456789' } });

    // ZIP should be truncated to 5 digits
    expect(mockOnUpdate).toHaveBeenCalledWith('residences', [
      { zip: '12345', state: '', isPrimary: true },
      { zip: '', state: '', isPrimary: false },
    ]);
  });

  it('should call onUpdate when state is changed', () => {
    render(
      <Step1Residences
        residences={defaultResidences}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const stateSelects = screen.getAllByLabelText(/State/i);
    const primaryStateSelect = stateSelects[0];

    fireEvent.change(primaryStateSelect, { target: { value: 'NY' } });

    expect(mockOnUpdate).toHaveBeenCalledWith('residences', [
      { zip: '', state: 'NY', isPrimary: true },
      { zip: '', state: '', isPrimary: false },
    ]);
  });

  it('should add a new residence when Add button is clicked', () => {
    render(
      <Step1Residences
        residences={defaultResidences}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const addButton = screen.getByRole('button', { name: /add another property/i });
    fireEvent.click(addButton);

    expect(mockOnUpdate).toHaveBeenCalledWith('residences', [
      { zip: '', state: '', isPrimary: true },
      { zip: '', state: '', isPrimary: false },
      { zip: '', state: '' },
    ]);
  });

  it('should display additional residence with correct label', () => {
    const residencesWithThree: Residence[] = [
      { zip: '10001', state: 'NY', isPrimary: true },
      { zip: '33101', state: 'FL', isPrimary: false },
      { zip: '90001', state: 'CA', isPrimary: false },
    ];

    render(
      <Step1Residences
        residences={residencesWithThree}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText('Primary Residence')).toBeInTheDocument();
    expect(screen.getByText('Secondary Residence')).toBeInTheDocument();
    expect(screen.getByText('Residence 3')).toBeInTheDocument();
  });

  it('should show Remove button for non-required residences', () => {
    const residencesWithThree: Residence[] = [
      { zip: '10001', state: 'NY', isPrimary: true },
      { zip: '33101', state: 'FL', isPrimary: false },
      { zip: '90001', state: 'CA', isPrimary: false },
    ];

    render(
      <Step1Residences
        residences={residencesWithThree}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    // Should only have 1 remove button (for Residence 3)
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons).toHaveLength(1);
    expect(removeButtons[0]).toHaveAccessibleName('Remove Residence 3');
  });

  it('should remove residence when Remove button is clicked', () => {
    const residencesWithThree: Residence[] = [
      { zip: '10001', state: 'NY', isPrimary: true },
      { zip: '33101', state: 'FL', isPrimary: false },
      { zip: '90001', state: 'CA', isPrimary: false },
    ];

    render(
      <Step1Residences
        residences={residencesWithThree}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove residence 3/i });
    fireEvent.click(removeButton);

    expect(mockOnUpdate).toHaveBeenCalledWith('residences', [
      { zip: '10001', state: 'NY', isPrimary: true },
      { zip: '33101', state: 'FL', isPrimary: false },
    ]);
  });

  it('should not remove residences if only 2 remain (required minimum)', () => {
    render(
      <Step1Residences
        residences={defaultResidences}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    // Should not have any remove buttons when only 2 residences
    const removeButtons = screen.queryAllByRole('button', { name: /remove/i });
    expect(removeButtons).toHaveLength(0);
  });

  it('should display ZIP code validation errors', () => {
    const errorsWithZip: FormErrors = {
      residence0Zip: 'Invalid ZIP code',
    };

    render(
      <Step1Residences
        residences={defaultResidences}
        errors={errorsWithZip}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText('Invalid ZIP code')).toBeInTheDocument();
  });

  it('should display state validation errors', () => {
    const errorsWithState: FormErrors = {
      residence1State: 'Please select a state',
    };

    render(
      <Step1Residences
        residences={defaultResidences}
        errors={errorsWithState}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    expect(screen.getByText('Please select a state')).toBeInTheDocument();
  });

  it('should have different background colors for primary, secondary, and additional residences', () => {
    const residencesWithThree: Residence[] = [
      { zip: '10001', state: 'NY', isPrimary: true },
      { zip: '33101', state: 'FL', isPrimary: false },
      { zip: '90001', state: 'CA', isPrimary: false },
    ];

    const { container } = render(
      <Step1Residences
        residences={residencesWithThree}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const residenceDivs = container.querySelectorAll('[class*="bg-"]');

    // Primary should have blue background
    expect(residenceDivs[0]).toHaveClass('bg-blue-50');
    expect(residenceDivs[0]).toHaveClass('border-blue-300');

    // Secondary should have green background
    expect(residenceDivs[1]).toHaveClass('bg-green-50');
    expect(residenceDivs[1]).toHaveClass('border-green-300');

    // Additional should have gray background
    expect(residenceDivs[2]).toHaveClass('bg-gray-50');
    expect(residenceDivs[2]).toHaveClass('border-gray-200');
  });

  it('should mark required fields with aria-required', () => {
    render(
      <Step1Residences
        residences={defaultResidences}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const zipInputs = screen.getAllByLabelText(/ZIP code/i);
    const stateSelects = screen.getAllByLabelText(/State/i);

    // Both primary and secondary should be required
    expect(zipInputs[0]).toHaveAttribute('aria-required', 'true');
    expect(zipInputs[1]).toHaveAttribute('aria-required', 'true');
    expect(stateSelects[0]).toHaveAttribute('aria-required', 'true');
    expect(stateSelects[1]).toHaveAttribute('aria-required', 'true');
  });

  it('should mark invalid fields with aria-invalid when errors present', () => {
    const errorsWithZip: FormErrors = {
      residence0Zip: 'Invalid ZIP code',
    };

    render(
      <Step1Residences
        residences={defaultResidences}
        errors={errorsWithZip}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const zipInputs = screen.getAllByLabelText(/ZIP code/i);
    expect(zipInputs[0]).toHaveAttribute('aria-invalid', 'true');
  });
});
