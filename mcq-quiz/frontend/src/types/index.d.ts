/**
 * Frontend Type Definitions
 * React, Context, Components
 */

// Context Types
declare namespace Contexts {
  interface LayoutContextType {
    // Sidebar
    sidebarCollapsed: boolean;
    sidebarWidth: number;
    toggleSidebar: () => void;
    setSidebarWidth: (width: number) => void;

    // Secondary Sidebar
    secondarySidebarCollapsed: boolean;
    secondarySidebarWidth: number;
    toggleSecondarySidebar: () => void;
    setSecondarySidebarWidth: (width: number) => void;

    // Panels
    activePanels: string[];
    panelLayout: 'single' | 'split' | 'grid';
    mainPanelWidth: number;
    addActivePanel: (panelName: string) => void;
    removeActivePanel: (panelName: string) => void;
    changeLayout: (layout: string) => void;
    setMainPanelWidth: (width: number) => void;

    // Tabs
    openTabs: Tab[];
    activeTabId: string | null;
    addTab: (tab: Tab) => void;
    removeTab: (tabId: string) => void;
    setActive: (tabId: string) => void;

    // Breadcrumbs & Navigation
    breadcrumbs: BreadcrumbItem[];
    setBreadcrumbsPath: (path: BreadcrumbItem[]) => void;
    activePage: string;
    pageTitle: string;
    updatePageInfo: (page: string, title: string) => void;

    // Bottom Panel
    bottomPanelHeight: number;
    bottomPanelCollapsed: boolean;
    toggleBottomPanel: () => void;
    setBottomPanelHeight: (height: number) => void;

    // Utils
    resetLayout: () => void;
  }

  interface UserTypeContextType {
    getAllUserTypes: () => Promise<ApiResponse<any[]>>;
    getUserTypeById: (id: string) => Promise<ApiResponse<any>>;
    getUserTypeByName: (name: string) => Promise<ApiResponse<any>>;
    getMenuItems: (userTypeName: string) => Promise<ApiResponse<MenuItem[]>>;
    getPermissions: (userTypeName: string) => Promise<ApiResponse<string[]>>;
    hasPermission: (userTypeName: string, permission: string) => Promise<ApiResponse<boolean>>;
    getFeatures: (userTypeName: string) => Promise<ApiResponse<Feature[]>>;
    isFeatureEnabled: (userTypeName: string, featureName: string) => Promise<ApiResponse<boolean>>;
  }
}

// Component Types
declare namespace Components {
  interface Tab {
    id: string;
    label: string;
    icon?: string;
    path?: string;
  }

  interface BreadcrumbItem {
    label: string;
    path?: string;
  }

  interface MenuItem {
    id: string;
    label: string;
    path: string;
    icon?: string;
    visible: boolean;
    order: number;
  }

  interface Feature {
    name: string;
    enabled: boolean;
  }

  interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message: string;
  }

  interface VSCodeLayoutProps {
    menuItems?: MenuItem[];
    onMenuClick?: (item: MenuItem) => void;
    tabs?: Tab[];
    activeTabId?: string | null;
    onTabClick?: (tabId: string) => void;
    onTabClose?: (tabId: string) => void;
    secondaryPanelContent?: React.ReactNode;
    secondaryPanelTitle?: string;
    bottomPanelContent?: React.ReactNode;
    bottomPanelTitle?: string;
    children?: React.ReactNode;
  }

  interface FlexiblePageLayoutProps {
    pageId: string;
    pageTitle?: string;
    children: React.ReactNode;
    config?: Record<string, any>;
    secondaryContent?: React.ReactNode;
    bottomContent?: React.ReactNode;
    onConfigChange?: (config: any) => void;
  }

  interface SimplePageLayoutProps {
    title: string;
    children: React.ReactNode;
    showSidebar?: boolean;
    showRightPanel?: boolean;
    showBottomPanel?: boolean;
    rightPanelTitle?: string;
    rightPanelContent?: React.ReactNode;
    bottomPanelTitle?: string;
    bottomPanelContent?: React.ReactNode;
  }
}

// Utilities
declare namespace Utils {
  interface LayoutConfig {
    showSidebar: boolean;
    sidebarCollapsible: boolean;
    showSecondaryPanel: boolean;
    showBottomPanel: boolean;
    mainPanelFlex: number;
    bottomPanelHeight?: number;
    secondaryPanelTitle?: string;
    bottomPanelTitle?: string;
  }
}

export { Contexts, Components, Utils };
