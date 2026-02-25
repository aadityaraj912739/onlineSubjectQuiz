import React, { useState } from 'react';

const Tabs = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleKeyDown = (e, index) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTab((index + 1) % tabs.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTab((index - 1 + tabs.length) % tabs.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveTab(tabs.length - 1);
    }
  };

  return (
    <div className="w-full">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav 
          className="-mb-px flex space-x-8" 
          aria-label="Tabs"
          role="tablist"
        >
          {tabs.map((tab, index) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="tab"
              aria-selected={activeTab === index}
              aria-controls={`tabpanel-${index}`}
              id={`tab-${index}`}
              tabIndex={activeTab === index ? 0 : -1}
              className={`
                ${activeTab === index
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      <div 
        className="pt-8 animate-fadeIn"
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {tabs[activeTab] && tabs[activeTab].content}
      </div>
    </div>
  );
};

export default React.memo(Tabs);
