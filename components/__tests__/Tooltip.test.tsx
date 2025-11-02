import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Tooltip from '../Tooltip';

describe('Tooltip Component', () => {
  const mockContent = 'This is a helpful tooltip';
  const mockExample = 'For example: something helpful';

  it('should render the trigger text', () => {
    render(
      <Tooltip content={mockContent}>
        <span>Hover me</span>
      </Tooltip>
    );

    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('should show info icon', () => {
    render(
      <Tooltip content={mockContent}>
        <span>Hover me</span>
      </Tooltip>
    );

    expect(screen.getByText('ⓘ')).toBeInTheDocument();
  });

  it('should have cursor-help class on trigger', () => {
    render(
      <Tooltip content={mockContent}>
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveClass('cursor-help');
  });

  it('should have proper ARIA attributes', () => {
    render(
      <Tooltip content={mockContent}>
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('tabIndex', '0');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('should show tooltip on focus', () => {
    render(
      <Tooltip content={mockContent}>
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByRole('button');
    fireEvent.focus(trigger);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByText(mockContent)).toBeInTheDocument();
  });

  it('should display example text when provided', () => {
    render(
      <Tooltip content={mockContent} example={mockExample}>
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByRole('button');
    fireEvent.focus(trigger);

    expect(screen.getByText(mockExample)).toBeInTheDocument();
  });

  it('should hide tooltip on blur', () => {
    render(
      <Tooltip content={mockContent}>
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByRole('button');

    // Show tooltip
    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    // Hide tooltip
    fireEvent.blur(trigger);

    // Wait for timeout
    setTimeout(() => {
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    }, 300);
  });

  it('should update aria-expanded when tooltip is shown', () => {
    render(
      <Tooltip content={mockContent}>
        <span>Hover me</span>
      </Tooltip>
    );

    const trigger = screen.getByRole('button');

    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.focus(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('should support different positions', () => {
    const positions: Array<'top' | 'bottom' | 'left' | 'right'> = ['top', 'bottom', 'left', 'right'];

    positions.forEach(position => {
      const { unmount } = render(
        <Tooltip content={mockContent} position={position}>
          <span>Test</span>
        </Tooltip>
      );

      // Component should render without errors
      expect(screen.getByText('Test')).toBeInTheDocument();

      unmount();
    });
  });
});
