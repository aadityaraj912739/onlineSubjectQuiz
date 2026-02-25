import React from 'react';

const InputField = ({ 
  icon: Icon, 
  error, 
  label, 
  id, 
  required = false,
  ...props 
}) => {
  const inputId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="text-gray-400" aria-hidden="true" />
          </div>
        )}
        <input
          id={inputId}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
          className={`
            block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5
            border rounded-lg leading-5 
            bg-white dark:bg-dark-700 
            text-gray-900 dark:text-white 
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all duration-200
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 dark:border-dark-600'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            sm:text-sm
          `}
        />
      </div>
      {error && (
        <p 
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-600 dark:text-red-400 animate-fadeIn"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default React.memo(InputField);
