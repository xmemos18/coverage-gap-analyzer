/**
 * Data Source Badge Component
 *
 * Displays a badge indicating the source of data (API, Database, Cache, or Estimate)
 * with appropriate styling and icons.
 */

interface DataSourceBadgeProps {
  source: 'api' | 'database' | 'estimate' | 'cache';
  className?: string;
  showIcon?: boolean;
}

export function DataSourceBadge({ source, className = '', showIcon = true }: DataSourceBadgeProps) {
  const badges = {
    api: {
      label: 'Real Healthcare.gov Data',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300',
      dotColor: 'bg-green-500',
      animate: true,
    },
    database: {
      label: 'Real CMS Data',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-800',
      borderColor: 'border-emerald-300',
      dotColor: 'bg-emerald-500',
      animate: false,
    },
    cache: {
      label: 'Cached API Data',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300',
      dotColor: 'bg-blue-500',
      animate: false,
    },
    estimate: {
      label: 'Estimated Data',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300',
      dotColor: 'bg-gray-500',
      animate: false,
    },
  };

  const badge = badges[source];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bgColor} ${badge.textColor} border ${badge.borderColor} ${className}`}
    >
      {showIcon && (
        <span
          className={`w-2 h-2 ${badge.dotColor} rounded-full ${badge.animate ? 'animate-pulse' : ''}`}
        ></span>
      )}
      {badge.label}
    </span>
  );
}

/**
 * Compact version of the badge (icon only with tooltip)
 */
interface DataSourceIconProps {
  source: 'api' | 'database' | 'estimate' | 'cache';
  className?: string;
}

export function DataSourceIcon({ source, className = '' }: DataSourceIconProps) {
  const icons = {
    api: {
      title: 'Real Healthcare.gov Data',
      color: 'bg-green-500',
      animate: true,
    },
    database: {
      title: 'Real CMS Data',
      color: 'bg-emerald-500',
      animate: false,
    },
    cache: {
      title: 'Cached API Data',
      color: 'bg-blue-500',
      animate: false,
    },
    estimate: {
      title: 'Estimated Data',
      color: 'bg-gray-500',
      animate: false,
    },
  };

  const icon = icons[source];

  return (
    <span
      className={`inline-block w-2 h-2 ${icon.color} rounded-full ${icon.animate ? 'animate-pulse' : ''} ${className}`}
      title={icon.title}
      aria-label={icon.title}
    ></span>
  );
}
