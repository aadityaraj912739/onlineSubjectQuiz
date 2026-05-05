import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

const LayoutContext = createContext();

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export const LayoutProvider = ({ children }) => {
  // Get initial state from localStorage or set defaults
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem('layoutState');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const initialState = getInitialState();

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initialState?.sidebarCollapsed ?? false);
  const [sidebarWidth, setSidebarWidth] = useState(initialState?.sidebarWidth ?? 250);

  // Panel state
  const [activePanels, setActivePanels] = useState(initialState?.activePanels ?? ['main']);
  const [panelLayout, setPanelLayout] = useState(initialState?.panelLayout ?? 'split'); // 'single', 'split', 'grid'
  const [mainPanelWidth, setMainPanelWidth] = useState(initialState?.mainPanelWidth ?? 70);

  // Secondary panel (right sidebar)
  const [secondarySidebarCollapsed, setSecondarySidebarCollapsed] = useState(
    initialState?.secondarySidebarCollapsed ?? true
  );
  const [secondarySidebarWidth, setSecondarySidebarWidth] = useState(
    initialState?.secondarySidebarWidth ?? 300
  );

  // Breadcrumb and navigation state
  const [breadcrumbs, setBreadcrumbs] = useState(initialState?.breadcrumbs ?? []);
  const [activePage, setActivePage] = useState(initialState?.activePage ?? 'dashboard');
  const [pageTitle, setPageTitle] = useState(initialState?.pageTitle ?? 'Dashboard');

  // Tab state
  const [openTabs, setOpenTabs] = useState(initialState?.openTabs ?? []);
  const [activeTabId, setActiveTabId] = useState(initialState?.activeTabId ?? null);

  // Bottom panel state
  const [bottomPanelHeight, setBottomPanelHeight] = useState(initialState?.bottomPanelHeight ?? 200);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(
    initialState?.bottomPanelCollapsed ?? true
  );

  // Save layout state to localStorage
  useEffect(() => {
    const layoutState = {
      sidebarCollapsed,
      sidebarWidth,
      activePanels,
      panelLayout,
      mainPanelWidth,
      secondarySidebarCollapsed,
      secondarySidebarWidth,
      breadcrumbs,
      activePage,
      pageTitle,
      openTabs,
      activeTabId,
      bottomPanelHeight,
      bottomPanelCollapsed
    };
    localStorage.setItem('layoutState', JSON.stringify(layoutState));
  }, [
    sidebarCollapsed,
    sidebarWidth,
    activePanels,
    panelLayout,
    mainPanelWidth,
    secondarySidebarCollapsed,
    secondarySidebarWidth,
    breadcrumbs,
    activePage,
    pageTitle,
    openTabs,
    activeTabId,
    bottomPanelHeight,
    bottomPanelCollapsed
  ]);

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // Toggle secondary sidebar
  const toggleSecondarySidebar = useCallback(() => {
    setSecondarySidebarCollapsed(prev => !prev);
  }, []);

  // Toggle bottom panel
  const toggleBottomPanel = useCallback(() => {
    setBottomPanelCollapsed(prev => !prev);
  }, []);

  // Add tab
  const addTab = useCallback((tab) => {
    setOpenTabs(prev => {
      const exists = prev.find(t => t.id === tab.id);
      if (exists) return prev;
      return [...prev, tab];
    });
    setActiveTabId(tab.id);
  }, []);

  // Remove tab
  const removeTab = useCallback((tabId) => {
    setOpenTabs(prev => prev.filter(t => t.id !== tabId));
    if (activeTabId === tabId) {
      setActiveTabId(openTabs.length > 1 ? openTabs[0].id : null);
    }
  }, [activeTabId, openTabs]);

  // Set active tab
  const setActive = useCallback((tabId) => {
    setActiveTabId(tabId);
  }, []);

  // Set breadcrumbs
  const setBreadcrumbsPath = useCallback((path) => {
    setBreadcrumbs(path);
  }, []);

  // Update page info
  const updatePageInfo = useCallback((page, title) => {
    setActivePage(page);
    setPageTitle(title);
  }, []);

  // Add active panel
  const addActivePanel = useCallback((panelName) => {
    setActivePanels(prev => {
      if (prev.includes(panelName)) return prev;
      return [...prev, panelName];
    });
  }, []);

  // Remove active panel
  const removeActivePanel = useCallback((panelName) => {
    setActivePanels(prev => prev.filter(p => p !== panelName));
  }, []);

  // Toggle panel layout
  const changeLayout = useCallback((layout) => {
    setPanelLayout(layout);
  }, []);

  // Reset layout to defaults
  const resetLayout = useCallback(() => {
    setSidebarCollapsed(false);
    setSidebarWidth(250);
    setActivePanels(['main']);
    setPanelLayout('split');
    setMainPanelWidth(70);
    setSecondarySidebarCollapsed(true);
    setSecondarySidebarWidth(300);
    setBreadcrumbs([]);
    setActivePage('dashboard');
    setPageTitle('Dashboard');
    setOpenTabs([]);
    setActiveTabId(null);
    setBottomPanelHeight(200);
    setBottomPanelCollapsed(true);
  }, []);

  // Context value with memoization
  const value = useMemo(
    () => ({
      // Sidebar
      sidebarCollapsed,
      sidebarWidth,
      toggleSidebar,
      setSidebarWidth,

      // Secondary sidebar
      secondarySidebarCollapsed,
      secondarySidebarWidth,
      toggleSecondarySidebar,
      setSecondarySidebarWidth,

      // Panels
      activePanels,
      panelLayout,
      mainPanelWidth,
      addActivePanel,
      removeActivePanel,
      changeLayout,
      setMainPanelWidth,

      // Tabs
      openTabs,
      activeTabId,
      addTab,
      removeTab,
      setActive,

      // Breadcrumbs & Navigation
      breadcrumbs,
      setBreadcrumbsPath,
      activePage,
      pageTitle,
      updatePageInfo,

      // Bottom panel
      bottomPanelHeight,
      bottomPanelCollapsed,
      toggleBottomPanel,
      setBottomPanelHeight,

      // Utils
      resetLayout
    }),
    [
      sidebarCollapsed,
      sidebarWidth,
      toggleSidebar,
      secondarySidebarCollapsed,
      secondarySidebarWidth,
      toggleSecondarySidebar,
      activePanels,
      panelLayout,
      mainPanelWidth,
      addActivePanel,
      removeActivePanel,
      changeLayout,
      openTabs,
      activeTabId,
      addTab,
      removeTab,
      setActive,
      breadcrumbs,
      setBreadcrumbsPath,
      activePage,
      pageTitle,
      updatePageInfo,
      bottomPanelHeight,
      bottomPanelCollapsed,
      toggleBottomPanel,
      resetLayout
    ]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

export default LayoutContext;
