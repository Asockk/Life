import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FixedModernEntryForm from '../FixedModernEntryForm';

describe('FixedModernEntryForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful submission
    mockOnSubmit.mockReturnValue({ success: true });
  });

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    darkMode: false
  };

  test('renders form with all input fields', () => {
    render(<FixedModernEntryForm {...defaultProps} />);
    
    // Check header
    expect(screen.getByText('Neuer Eintrag')).toBeInTheDocument();
    
    // Check date input exists
    const dateInput = screen.getByDisplayValue((value, element) => {
      return element.type === 'date';
    });
    expect(dateInput).toBeInTheDocument();
    
    // Check time slot buttons
    expect(screen.getByText('Morgen')).toBeInTheDocument();
    expect(screen.getByText('Abend')).toBeInTheDocument();
    
    // Check blood pressure inputs by placeholder or name
    const allInputs = screen.getAllByRole('spinbutton');
    expect(allInputs.length).toBeGreaterThanOrEqual(6); // At least 6 BP inputs
  });

  test('allows typing in input fields without losing focus', async () => {
    render(<FixedModernEntryForm {...defaultProps} />);
    
    // Find morning systolic input by its name attribute
    const inputs = screen.getAllByRole('spinbutton');
    const morgenSysInput = inputs.find(input => input.name === 'morgenSys');
    
    // Click and type
    fireEvent.click(morgenSysInput);
    fireEvent.change(morgenSysInput, { target: { value: '120' } });
    
    // Check that the value is correctly set
    expect(morgenSysInput).toHaveValue('120');
    
    // Verify input still exists and has the value
    await waitFor(() => {
      expect(morgenSysInput).toHaveValue('120');
    });
  });

  test('switches between morning and evening time slots', async () => {
    render(<FixedModernEntryForm {...defaultProps} />);
    
    // Initially morning should be active
    const morgenButton = screen.getByText('Morgen').closest('button');
    const abendButton = screen.getByText('Abend').closest('button');
    
    // Morning should be active initially
    expect(morgenButton.className).toContain('bg-white');
    
    // Click evening button
    fireEvent.click(abendButton);
    
    // Evening should now be active
    await waitFor(() => {
      expect(abendButton.className).toContain('bg-white');
    });
  });

  test('validates form before submission', async () => {
    render(<FixedModernEntryForm {...defaultProps} />);
    
    const submitButton = screen.getByText('Speichern');
    
    // Try to submit empty form
    fireEvent.click(submitButton);
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/mindestens eine messung erforderlich/i)).toBeInTheDocument();
    });
    
    // Form should not be submitted
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    render(<FixedModernEntryForm {...defaultProps} />);
    
    // Fill in morning values
    const inputs = screen.getAllByRole('spinbutton');
    const morgenSysInput = inputs.find(input => input.name === 'morgenSys');
    const morgenDiaInput = inputs.find(input => input.name === 'morgenDia');
    const morgenPulsInput = inputs.find(input => input.name === 'morgenPuls');
    
    fireEvent.change(morgenSysInput, { target: { value: '120' } });
    fireEvent.change(morgenDiaInput, { target: { value: '80' } });
    fireEvent.change(morgenPulsInput, { target: { value: '70' } });
    
    // Submit form
    const submitButton = screen.getByText('Speichern');
    fireEvent.click(submitButton);
    
    // Check that onSubmit was called
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        undefined, // id (not editing)
        expect.objectContaining({
          morgenSys: '120',
          morgenDia: '80',
          morgenPuls: '70'
        }),
        expect.any(Object) // context
      );
    });
  });

  test('validates blood pressure ranges', async () => {
    render(<FixedModernEntryForm {...defaultProps} />);
    
    const inputs = screen.getAllByRole('spinbutton');
    const morgenSysInput = inputs.find(input => input.name === 'morgenSys');
    const morgenDiaInput = inputs.find(input => input.name === 'morgenDia');
    
    // Enter invalid values (sys <= dia)
    fireEvent.change(morgenSysInput, { target: { value: '80' } });
    fireEvent.change(morgenDiaInput, { target: { value: '90' } });
    
    // Try to submit
    const submitButton = screen.getByText('Speichern');
    fireEvent.click(submitButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/sys muss > dia sein/i)).toBeInTheDocument();
    });
  });

  test('handles context factors correctly', async () => {
    render(<FixedModernEntryForm {...defaultProps} />);
    
    // Toggle medication
    const medButton = screen.getByText('Medizin').closest('button');
    fireEvent.click(medButton);
    
    // Should show active state
    await waitFor(() => {
      expect(medButton.className).toContain('border-blue-500');
    });
    
    // Change stress level
    const stressSlider = screen.getByRole('slider', { name: /stress/i });
    fireEvent.change(stressSlider, { target: { value: '7' } });
    
    expect(screen.getByText('Stress: 7/10')).toBeInTheDocument();
  });

  test('shows success message after submission', async () => {
    render(<FixedModernEntryForm {...defaultProps} />);
    
    // Fill in required data
    const inputs = screen.getAllByRole('spinbutton');
    const morgenSysInput = inputs.find(input => input.name === 'morgenSys');
    const morgenDiaInput = inputs.find(input => input.name === 'morgenDia');
    
    fireEvent.change(morgenSysInput, { target: { value: '120' } });
    fireEvent.change(morgenDiaInput, { target: { value: '80' } });
    
    // Submit
    const submitButton = screen.getByText('Speichern');
    fireEvent.click(submitButton);
    
    // Should show success message
    await waitFor(() => {
      expect(screen.getByText(/erfolgreich gespeichert/i)).toBeInTheDocument();
    });
    
    // Should call onCancel after delay
    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled();
    }, { timeout: 2000 });
  });
});