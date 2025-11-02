/**
 * Skeleton loading placeholder component
 * Used to show content structure while data loads
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export default function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'circular' ? width : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for a card
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <Skeleton variant="rectangular" height={24} className="mb-4 w-3/4" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" className="mb-2" />
      <Skeleton variant="text" className="mb-2 w-5/6" />
      <div className="mt-4 flex gap-3">
        <Skeleton variant="rectangular" height={40} width={100} />
        <Skeleton variant="rectangular" height={40} width={100} />
      </div>
    </div>
  );
}

/**
 * Skeleton for a list item
 */
export function SkeletonListItem({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start gap-3 p-4 ${className}`}>
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" className="mb-2 w-3/4" />
        <Skeleton variant="text" className="w-1/2" />
      </div>
    </div>
  );
}
