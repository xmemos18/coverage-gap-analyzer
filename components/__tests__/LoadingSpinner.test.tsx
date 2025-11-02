/**
 * Tests for LoadingSpinner component
 */

import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);

    // Should have status role for accessibility
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();

    // Should have sr-only text
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom label', () => {
    render(<LoadingSpinner label="Processing..." />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    let spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('h-4', 'w-4', 'border-2');

    rerender(<LoadingSpinner size="md" />);
    spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('h-8', 'w-8', 'border-2');

    rerender(<LoadingSpinner size="lg" />);
    spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('h-12', 'w-12');

    rerender(<LoadingSpinner size="xl" />);
    spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('h-16', 'w-16', 'border-4');
  });

  it('applies custom className', () => {
    render(<LoadingSpinner className="my-custom-class" />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveClass('my-custom-class');
  });

  it('has aria-live="polite" for screen readers', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-live', 'polite');
  });

  it('has spinning animation', () => {
    render(<LoadingSpinner />);

    const spinner = screen.getByRole('status');
    expect(spinner.firstChild).toHaveClass('animate-spin');
  });
});
