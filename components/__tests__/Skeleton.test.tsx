/**
 * Tests for Skeleton component
 */

import { render } from '@testing-library/react';
import Skeleton, { SkeletonCard, SkeletonListItem } from '../Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('bg-gray-200', 'rounded', 'h-4', 'animate-pulse');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders text variant', () => {
    const { container } = render(<Skeleton variant="text" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded', 'h-4');
  });

  it('renders circular variant', () => {
    const { container } = render(<Skeleton variant="circular" width={48} />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-full');
  });

  it('renders rectangular variant', () => {
    const { container } = render(<Skeleton variant="rectangular" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded');
  });

  it('applies custom width and height', () => {
    const { container } = render(<Skeleton width={200} height={100} />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ width: '200px', height: '100px' });
  });

  it('supports different animations', () => {
    const { container, rerender } = render(<Skeleton animation="pulse" />);

    let skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('animate-pulse');

    rerender(<Skeleton animation="wave" />);
    skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('animate-shimmer');

    rerender(<Skeleton animation="none" />);
    skeleton = container.firstChild as HTMLElement;
    expect(skeleton).not.toHaveClass('animate-pulse');
    expect(skeleton).not.toHaveClass('animate-shimmer');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="my-custom-class" />);

    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('my-custom-class');
  });
});

describe('SkeletonCard', () => {
  it('renders card skeleton structure', () => {
    const { container } = render(<SkeletonCard />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('bg-white', 'rounded-xl', 'shadow-lg', 'p-6');

    // Should have multiple skeleton elements
    const skeletons = card.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(3);
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonCard className="mb-8" />);

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('mb-8');
  });
});

describe('SkeletonListItem', () => {
  it('renders list item skeleton structure', () => {
    const { container } = render(<SkeletonListItem />);

    const listItem = container.firstChild as HTMLElement;
    expect(listItem).toHaveClass('flex', 'items-start', 'gap-3', 'p-4');

    // Should have skeleton elements
    const skeletons = listItem.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBeGreaterThan(1);
  });

  it('applies custom className', () => {
    const { container } = render(<SkeletonListItem className="border-b" />);

    const listItem = container.firstChild as HTMLElement;
    expect(listItem).toHaveClass('border-b');
  });
});
