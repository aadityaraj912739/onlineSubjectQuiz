import React from 'react';

const Loading = ({ size = 'lg', text = 'Loading...', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const Container = fullScreen ? 'div' : React.Fragment;
  const containerProps = fullScreen ? {
    className: "fixed inset-0 bg-white dark:bg-dark-950 flex items-center justify-center z-50",
    role: "status",
    "aria-live": "polite",
    "aria-label": text
  } : {};

  return (
    <Container {...containerProps}>
      <div className="flex flex-col items-center justify-center min-h-[200px] animate-fadeIn">
        <div className={`${sizeClasses[size]} animate-spin`} role="img" aria-label="Loading spinner">
          <svg
            className="w-full h-full text-primary-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        {text && (
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 animate-pulse">
            {text}
          </p>
        )}
      </div>
    </Container>
  );
};

export default React.memo(Loading);
