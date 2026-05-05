import React, { useState } from 'react';
import { useLayout } from '../context/LayoutContext';
import './VSCodeLayout.css';

/**
 * ResizeHandle Component
 * Allows resizing of panels by dragging
 */
export const ResizeHandle = ({ onResize, direction = 'vertical' }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      onResize(e);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onResize]);

  return (
    <div
      className={`resize-handle ${direction} ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
    />
  );
};

/**
 * Sidebar Component
 * Left navigation panel with collapsible menu
 */
export const Sidebar = ({ menuItems, onMenuClick }) => {
  const { sidebarCollapsed, toggleSidebar, sidebarWidth, setSidebarWidth } = useLayout();

  const handleResize = (e) => {
    const newWidth = e.clientX;
    if (newWidth > 150 && newWidth < 400) {
      setSidebarWidth(newWidth);
    }
  };

  return (
    <div
      className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}
      style={{ width: sidebarCollapsed ? '50px' : `${sidebarWidth}px` }}
    >
      <div className="sidebar-header">
        <button
          className="sidebar-toggle"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
          </svg>
        </button>
        {!sidebarCollapsed && <span className="sidebar-title">Navigation</span>}
      </div>

      <nav className="sidebar-menu">
        {menuItems?.map((item, index) => (
          <button
            key={index}
            className="menu-item"
            onClick={() => onMenuClick(item)}
            title={item.label}
          >
            {item.icon && <span className="menu-icon">{item.icon}</span>}
            {!sidebarCollapsed && <span className="menu-label">{item.label}</span>}
          </button>
        ))}
      </nav>

      <ResizeHandle onResize={handleResize} direction="vertical" />
    </div>
  );
};

/**
 * TabBar Component
 * Tab navigation for open files/pages
 */
export const TabBar = ({ tabs, activeTabId, onTabClick, onTabClose }) => {
  const { sidebarCollapsed, sidebarWidth } = useLayout();

  return (
    <div className="tab-bar">
      <div className="tabs-container">
        {tabs?.map((tab) => (
          <div
            key={tab.id}
            className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
            onClick={() => onTabClick(tab.id)}
          >
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            <span className="tab-label">{tab.label}</span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * MainPanel Component
 * Central content area
 */
export const MainPanel = ({ children, style }) => {
  return (
    <div className="main-panel" style={style}>
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

/**
 * SecondaryPanel Component
 * Right sidebar for additional information/tools
 */
export const SecondaryPanel = ({ children, title }) => {
  const {
    secondarySidebarCollapsed,
    toggleSecondarySidebar,
    secondarySidebarWidth,
    setSecondarySidebarWidth
  } = useLayout();

  const handleResize = (e) => {
    const newWidth = 400 - e.clientX;
    if (newWidth > 150 && newWidth < 400) {
      setSecondarySidebarWidth(newWidth);
    }
  };

  if (secondarySidebarCollapsed) {
    return null;
  }

  return (
    <>
      <ResizeHandle onResize={handleResize} direction="vertical" />
      <div
        className="secondary-panel"
        style={{ width: `${secondarySidebarWidth}px` }}
      >
        <div className="secondary-header">
          <h3>{title}</h3>
          <button
            className="secondary-toggle"
            onClick={toggleSecondarySidebar}
            title="Close panel"
          >
            ×
          </button>
        </div>
        <div className="secondary-content">
          {children}
        </div>
      </div>
    </>
  );
};

/**
 * BottomPanel Component
 * Bottom area for logs, console, etc.
 */
export const BottomPanel = ({ children, title }) => {
  const {
    bottomPanelCollapsed,
    toggleBottomPanel,
    bottomPanelHeight,
    setBottomPanelHeight
  } = useLayout();

  const handleResize = (e) => {
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight > 100 && newHeight < 500) {
      setBottomPanelHeight(newHeight);
    }
  };

  if (bottomPanelCollapsed) {
    return null;
  }

  return (
    <>
      <ResizeHandle onResize={handleResize} direction="horizontal" />
      <div className="bottom-panel" style={{ height: `${bottomPanelHeight}px` }}>
        <div className="bottom-header">
          <h3>{title}</h3>
          <button
            className="bottom-toggle"
            onClick={toggleBottomPanel}
            title="Close panel"
          >
            ×
          </button>
        </div>
        <div className="bottom-content">
          {children}
        </div>
      </div>
    </>
  );
};

/**
 * Main VSCode Layout Component
 */
export const VSCodeLayout = ({
  menuItems = [],
  children,
  onMenuClick = () => {},
  tabs = [],
  activeTabId = null,
  onTabClick = () => {},
  onTabClose = () => {},
  secondaryPanelContent = null,
  secondaryPanelTitle = 'Properties',
  bottomPanelContent = null,
  bottomPanelTitle = 'Console'
}) => {
  const { sidebarCollapsed, sidebarWidth } = useLayout();

  return (
    <div className="vscode-layout">
      <Sidebar menuItems={menuItems} onMenuClick={onMenuClick} />

      <div className="main-area">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={onTabClick}
          onTabClose={onTabClose}
        />

        <div className="editor-container">
          <MainPanel>{children}</MainPanel>
          {secondaryPanelContent && (
            <SecondaryPanel title={secondaryPanelTitle}>
              {secondaryPanelContent}
            </SecondaryPanel>
          )}
        </div>

        {bottomPanelContent && (
          <BottomPanel title={bottomPanelTitle}>
            {bottomPanelContent}
          </BottomPanel>
        )}
      </div>
    </div>
  );
};

export default VSCodeLayout;
