import React, { useEffect, useState } from 'react';
import { useLayout } from '../context/LayoutContext';
import { useUserType } from '../context/UserTypeContext';
import { useAuth } from '../context/AuthContext';
import VSCodeLayout from './VSCodeLayout';
import { getLayoutConfig } from '../config/layoutConfig';

/**
 * FlexiblePageLayout Component
 * Renders pages with flexible, configurable VSCode-like layout
 * 
 * Props:
 * - pageId: string - Unique page identifier for config lookup
 * - pageTitle: string - Title shown in breadcrumbs and tab
 * - children: ReactNode - Page content
 * - config: object - Override configuration
 * - secondaryContent: ReactNode - Right panel content
 * - bottomContent: ReactNode - Bottom panel content
 * - onConfigChange: function - Callback when layout changes
 */
export const FlexiblePageLayout = ({
  pageId,
  pageTitle = 'Page',
  children,
  config: customConfig = {},
  secondaryContent = null,
  bottomContent = null,
  onConfigChange = null
}) => {
  const { user } = useAuth();
  const { getMenuItems } = useUserType();
  const {
    updatePageInfo,
    addTab,
    activeTabId,
    openTabs,
    setActive,
    removeTab,
    setSidebarWidth,
    setBottomPanelHeight
  } = useLayout();

  const [menuItems, setMenuItems] = useState([]);
  const [layoutConfig, setLayoutConfig] = useState({});
  const [loading, setLoading] = useState(true);

  // Get layout configuration based on pageId
  useEffect(() => {
    const config = getLayoutConfig(pageId, customConfig);
    setLayoutConfig(config);
    
    if (onConfigChange) {
      onConfigChange(config);
    }
  }, [pageId, customConfig, onConfigChange]);

  // Fetch dynamic menu items
  useEffect(() => {
    if (!user?.role) {
      setLoading(false);
      return;
    }

    const fetchMenuItems = async () => {
      try {
        const result = await getMenuItems(user.role);
        if (result.success) {
          setMenuItems(result.data || []);
        }
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, [user?.role, getMenuItems]);

  // Update page info on mount
  useEffect(() => {
    updatePageInfo(pageId, pageTitle);
  }, [pageId, pageTitle, updatePageInfo]);

  // Add tab for current page
  useEffect(() => {
    const tabId = `page-${pageId}`;
    addTab({
      id: tabId,
      label: pageTitle,
      icon: '📄',
      path: window.location.pathname
    });
  }, [pageId, pageTitle, addTab]);

  const handleMenuClick = (item) => {
    if (item.path) {
      window.location.href = item.path;
    }
  };

  const handleTabClick = (tabId) => {
    setActive(tabId);
  };

  const handleTabClose = (tabId) => {
    removeTab(tabId);
  };

  // Don't render layout if config says no
  if (layoutConfig.showSidebar === false && !layoutConfig.showSecondaryPanel) {
    return (
      <div style={{ width: '100%', height: '100vh', overflow: 'auto' }}>
        {children}
      </div>
    );
  }

  return (
    <VSCodeLayout
      menuItems={layoutConfig.showSidebar !== false ? menuItems : []}
      onMenuClick={handleMenuClick}
      tabs={openTabs}
      activeTabId={activeTabId}
      onTabClick={handleTabClick}
      onTabClose={handleTabClose}
      secondaryPanelContent={layoutConfig.showSecondaryPanel ? secondaryContent : null}
      secondaryPanelTitle={layoutConfig.secondaryPanelTitle}
      bottomPanelContent={layoutConfig.showBottomPanel ? bottomContent : null}
      bottomPanelTitle={layoutConfig.bottomPanelTitle}
    >
      {children}
    </VSCodeLayout>
  );
};

/**
 * SimplePageLayout Component
 * Simplified wrapper for quick page creation
 */
export const SimplePageLayout = ({
  title,
  children,
  showSidebar = true,
  showRightPanel = false,
  showBottomPanel = false,
  rightPanelTitle = 'Properties',
  rightPanelContent = null,
  bottomPanelTitle = 'Console',
  bottomPanelContent = null
}) => {
  return (
    <FlexiblePageLayout
      pageId={title.toLowerCase().replace(/\s+/g, '-')}
      pageTitle={title}
      config={{
        showSidebar,
        showSecondaryPanel: showRightPanel,
        showBottomPanel,
        secondaryPanelTitle: rightPanelTitle,
        bottomPanelTitle
      }}
      secondaryContent={rightPanelContent}
      bottomContent={bottomPanelContent}
    >
      {children}
    </FlexiblePageLayout>
  );
};

/**
 * CenteredLayout Component
 * For pages that don't need sidebar
 */
export const CenteredLayout = ({ title, children }) => {
  return (
    <SimplePageLayout
      title={title}
      showSidebar={false}
      showRightPanel={false}
      showBottomPanel={false}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100%'
      }}>
        {children}
      </div>
    </SimplePageLayout>
  );
};

/**
 * SplitPanelLayout Component
 * For layouts with main content and right panel
 */
export const SplitPanelLayout = ({
  title,
  mainContent,
  rightTitle = 'Properties',
  rightContent,
  showBottomPanel = false,
  bottomTitle = 'Console',
  bottomContent = null
}) => {
  return (
    <FlexiblePageLayout
      pageId={title.toLowerCase().replace(/\s+/g, '-')}
      pageTitle={title}
      config={{
        mainPanelFlex: 65,
        showSecondaryPanel: true,
        showBottomPanel
      }}
      secondaryContent={rightContent}
      bottomContent={bottomContent}
    >
      {mainContent}
    </FlexiblePageLayout>
  );
};

export default FlexiblePageLayout;

