/**
 * Tests for LoadingOverlay component
 */

import { render, screen } from '@testing-library/react';
import LoadingOverlay from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders when visible', () => {
    render(<LoadingOverlay isVisible={true} />);

    const overlay = screen.getByRole('dialog');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('aria-modal', 'true');
  });

  it('does not render when not visible', () => {
    render(<LoadingOverlay isVisible={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('displays custom title', () => {
    render(<LoadingOverlay isVisible={true} title="Processing Payment..." />);

    expect(screen.getByRole('heading', { name: 'Processing Payment...' })).toBeInTheDocument();
  });

  it('displays custom message', () => {
    render(
      <LoadingOverlay
        isVisible={true}
        title="Loading"
        message="Please wait while we fetch your data"
      />
    );

    expect(screen.getByText('Please wait while we fetch your data')).toBeInTheDocument();
  });

  it('uses default title when not provided', () => {
    render(<LoadingOverlay isVisible={true} />);

    expect(screen.getByRole('heading', { name: 'Loading...' })).toBeInTheDocument();
  });

  it('has proper ARIA labels', () => {
    render(
      <LoadingOverlay
        isVisible={true}
        title="Analyzing Coverage"
        message="Finding best options"
      />
    );

    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveAttribute('aria-labelledby', 'loading-title');
    expect(overlay).toHaveAttribute('aria-describedby', 'loading-message');
  });

  it('includes loading spinner', () => {
    render(<LoadingOverlay isVisible={true} />);

    // LoadingSpinner has role="status"
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('has backdrop blur effect', () => {
    render(<LoadingOverlay isVisible={true} />);

    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveClass('backdrop-blur-sm');
  });

  it('is positioned fixed and centered', () => {
    render(<LoadingOverlay isVisible={true} />);

    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveClass('fixed', 'inset-0', 'flex', 'items-center', 'justify-center');
  });

  it('has high z-index for layering', () => {
    render(<LoadingOverlay isVisible={true} />);

    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveClass('z-50');
  });
});
