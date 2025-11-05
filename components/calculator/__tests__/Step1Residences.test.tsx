import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Step1Residences from '../Step1Residences';
import { Residence, FormErrors } from '@/types';
import * as zipCodeApi from '@/lib/zipCodeApi';

describe('Step1Residences Component', () => {
  const mockOnUpdate = jest.fn();
  const mockOnNext = jest.fn();

  const defaultResidences: Residence[] = [
    { zip: '', state: '', isPrimary: true, monthsPerYear: 0 },
    { zip: '', state: '', isPrimary: false, monthsPerYear: 0 },
  ];

  const defaultErrors: FormErrors = {};

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the ZIP code validation API
    jest.spyOn(zipCodeApi, 'validateZipCode').mockImplementation((zip: string) => {
      // Return mock location data for known ZIPs
      const zipMap: { [key: string]: { stateAbbr: string; city: string; county: string } } = {
        '12345': { stateAbbr: 'NY', city: 'Schenectady', county: 'Schenectady County' },
        '10001': { stateAbbr: 'NY', city: 'New York', county: 'New York County' },
        '90001': { stateAbbr: 'CA', city: 'Los Angeles', county: 'Los Angeles County' },
      };

      return Promise.resolve(zipMap[zip] || null);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('should call onUpdate when ZIP code is changed', async () => {
    render(
      <Step1Residences
        residences={defaultResidences}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const zipInput = screen.getByRole('textbox', { name: /ZIP code.*Primary/i });

    // Verify input exists
    expect(zipInput).toBeInTheDocument();

    fireEvent.change(zipInput, { target: { value: '12345' } });

    // First check that onUpdate is called with the ZIP (immediate call)
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    }, { timeout: 1000 });

    // Then wait for the auto-populated state (after async validation)
    await waitFor(() => {
      const lastCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1];
      expect(lastCall).toBeDefined();
      expect(lastCall[0]).toBe('residences');
      const residences = lastCall[1];
      expect(residences[0]).toMatchObject({
        zip: '12345',
        state: 'NY',
        isPrimary: true,
        monthsPerYear: 0
      });
    }, { timeout: 3000 });
  });

  it('should sanitize ZIP code input (remove non-numeric characters)', async () => {
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

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('residences', expect.arrayContaining([
        expect.objectContaining({ zip: '12345', state: 'NY', isPrimary: true, monthsPerYear: 0 }),
        expect.objectContaining({ zip: '', state: '', isPrimary: false, monthsPerYear: 0 }),
      ]));
    }, { timeout: 3000 });
  });

  it('should truncate ZIP codes to 5 digits', async () => {
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

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('residences', expect.arrayContaining([
        expect.objectContaining({ zip: '12345', state: 'NY', isPrimary: true, monthsPerYear: 0 }),
        expect.objectContaining({ zip: '', state: '', isPrimary: false, monthsPerYear: 0 }),
      ]));
    }, { timeout: 3000 });
  });

  it('should auto-populate state when valid ZIP code is entered', async () => {
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

    fireEvent.change(primaryZipInput, { target: { value: '10001' } });

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('residences', expect.arrayContaining([
        expect.objectContaining({ zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 0 }),
        expect.objectContaining({ zip: '', state: '', isPrimary: false, monthsPerYear: 0 }),
      ]));
    }, { timeout: 3000 });
  });

  it('should auto-populate state for California ZIP code', async () => {
    render(
      <Step1Residences
        residences={defaultResidences}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const zipInputs = screen.getAllByLabelText(/ZIP code/i);
    const secondaryZipInput = zipInputs[1];

    fireEvent.change(secondaryZipInput, { target: { value: '90001' } });

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('residences', expect.arrayContaining([
        expect.objectContaining({ zip: '', state: '', isPrimary: true, monthsPerYear: 0 }),
        expect.objectContaining({ zip: '90001', state: 'CA', isPrimary: false, monthsPerYear: 0 }),
      ]));
    }, { timeout: 3000 });
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
      { zip: '', state: 'NY', isPrimary: true, monthsPerYear: 0 },
      { zip: '', state: '', isPrimary: false, monthsPerYear: 0 },
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
      { zip: '', state: '', isPrimary: true, monthsPerYear: 0 },
      { zip: '', state: '', isPrimary: false, monthsPerYear: 0 },
      { zip: '', state: '', isPrimary: false, monthsPerYear: 0 },
    ]);
  });

  it('should display additional residence with correct label', () => {
    const residencesWithThree: Residence[] = [
      { zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 0 },
      { zip: '33101', state: 'FL', isPrimary: false, monthsPerYear: 0 },
      { zip: '90001', state: 'CA', isPrimary: false, monthsPerYear: 0 },
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
      { zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 0 },
      { zip: '33101', state: 'FL', isPrimary: false, monthsPerYear: 0 },
      { zip: '90001', state: 'CA', isPrimary: false, monthsPerYear: 0 },
    ];

    render(
      <Step1Residences
        residences={residencesWithThree}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    // Should have 2 remove buttons (for Secondary Residence and Residence 3)
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    expect(removeButtons).toHaveLength(2);
    expect(removeButtons[0]).toHaveAccessibleName('Remove Secondary Residence');
    expect(removeButtons[1]).toHaveAccessibleName('Remove Residence 3');
  });

  it('should remove residence when Remove button is clicked', () => {
    const residencesWithThree: Residence[] = [
      { zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 0 },
      { zip: '33101', state: 'FL', isPrimary: false, monthsPerYear: 0 },
      { zip: '90001', state: 'CA', isPrimary: false, monthsPerYear: 0 },
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
      { zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 0 },
      { zip: '33101', state: 'FL', isPrimary: false, monthsPerYear: 0 },
    ]);
  });

  it('should not remove residences if only 1 remains (required minimum)', () => {
    const singleResidence: Residence[] = [
      { zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 0 },
    ];

    render(
      <Step1Residences
        residences={singleResidence}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    // Should not have any remove buttons when only 1 residence
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
      { zip: '10001', state: 'NY', isPrimary: true, monthsPerYear: 0 },
      { zip: '33101', state: 'FL', isPrimary: false, monthsPerYear: 0 },
      { zip: '90001', state: 'CA', isPrimary: false, monthsPerYear: 0 },
    ];

    const { container } = render(
      <Step1Residences
        residences={residencesWithThree}
        errors={defaultErrors}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
      />
    );

    const residenceDivs = container.querySelectorAll('.p-6.rounded-lg.border-2');

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
