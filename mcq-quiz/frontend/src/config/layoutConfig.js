/**
 * Layout Configuration System
 * Define layout for each page dynamically
 */

export const LAYOUT_PRESETS = {
  // Default - full layout with all panels
  DEFAULT: {
    id: 'default',
    name: 'Default Layout',
    showSidebar: true,
    sidebarCollapsible: true,
    showSecondaryPanel: true,
    showBottomPanel: true,
    mainPanelFlex: 70
  },

  // Minimal - sidebar only
  MINIMAL: {
    id: 'minimal',
    name: 'Minimal Layout',
    showSidebar: true,
    sidebarCollapsible: true,
    showSecondaryPanel: false,
    showBottomPanel: false,
    mainPanelFlex: 100
  },

  // Editor - main + right panel
  EDITOR: {
    id: 'editor',
    name: 'Editor Layout',
    showSidebar: true,
    sidebarCollapsible: true,
    showSecondaryPanel: true,
    showBottomPanel: true,
    mainPanelFlex: 65
  },

  // Dashboard - full with all panels
  DASHBOARD: {
    id: 'dashboard',
    name: 'Dashboard Layout',
    showSidebar: true,
    sidebarCollapsible: true,
    showSecondaryPanel: true,
    showBottomPanel: false,
    mainPanelFlex: 70
  },

  // Fullscreen - no sidebar
  FULLSCREEN: {
    id: 'fullscreen',
    name: 'Fullscreen Layout',
    showSidebar: false,
    sidebarCollapsible: false,
    showSecondaryPanel: false,
    showBottomPanel: false,
    mainPanelFlex: 100
  },

  // Split - equal panels
  SPLIT: {
    id: 'split',
    name: 'Split Layout',
    showSidebar: true,
    sidebarCollapsible: true,
    showSecondaryPanel: true,
    showBottomPanel: false,
    mainPanelFlex: 50
  },

  // Console - with large bottom panel
  CONSOLE: {
    id: 'console',
    name: 'Console Layout',
    showSidebar: true,
    sidebarCollapsible: true,
    showSecondaryPanel: false,
    showBottomPanel: true,
    mainPanelFlex: 70,
    bottomPanelHeight: 300
  }
};

/**
 * Page Layout Configuration
 * Maps pages to their layout presets
 */
export const PAGE_LAYOUT_CONFIG = {
  // Teacher Routes
  'teacher-dashboard': {
    preset: LAYOUT_PRESETS.DASHBOARD,
    secondaryPanelTitle: 'Quick Stats',
    bottomPanelTitle: 'Recent Activity',
    showBottomPanel: false
  },
  'create-exam': {
    preset: LAYOUT_PRESETS.EDITOR,
    secondaryPanelTitle: 'Exam Properties',
    bottomPanelTitle: 'Validation'
  },
  'teacher-exams': {
    preset: LAYOUT_PRESETS.DEFAULT,
    secondaryPanelTitle: 'Exam Details',
    bottomPanelTitle: 'Console'
  },
  'exam-results': {
    preset: LAYOUT_PRESETS.DASHBOARD,
    secondaryPanelTitle: 'Statistics',
    bottomPanelTitle: null
  },

  // Student Routes
  'student-dashboard': {
    preset: LAYOUT_PRESETS.DASHBOARD,
    secondaryPanelTitle: 'Your Progress',
    bottomPanelTitle: null
  },
  'exams': {
    preset: LAYOUT_PRESETS.DEFAULT,
    secondaryPanelTitle: 'Exam Info',
    bottomPanelTitle: 'Filter'
  },
  'take-exam': {
    preset: LAYOUT_PRESETS.EDITOR,
    secondaryPanelTitle: 'Question Navigator',
    bottomPanelTitle: 'Timer'
  },

  // Common Routes
  'profile': {
    preset: LAYOUT_PRESETS.MINIMAL,
    secondaryPanelTitle: null,
    bottomPanelTitle: null
  },
  'study-materials': {
    preset: LAYOUT_PRESETS.DEFAULT,
    secondaryPanelTitle: 'Material Details',
    bottomPanelTitle: null
  },
  'forums': {
    preset: LAYOUT_PRESETS.DEFAULT,
    secondaryPanelTitle: 'Forum Info',
    bottomPanelTitle: null
  },
  'forums-thread': {
    preset: LAYOUT_PRESETS.EDITOR,
    secondaryPanelTitle: 'Thread Info',
    bottomPanelTitle: null
  },
  'contact': {
    preset: LAYOUT_PRESETS.MINIMAL,
    secondaryPanelTitle: null,
    bottomPanelTitle: null
  }
};

/**
 * Get layout configuration for a page
 * @param {string} pageName - Page identifier
 * @param {object} customConfig - Override configuration
 * @returns {object} Layout configuration
 */
export function getLayoutConfig(pageName, customConfig = {}) {
  const pageConfig = PAGE_LAYOUT_CONFIG[pageName] || {
    preset: LAYOUT_PRESETS.DEFAULT
  };

  return {
    ...pageConfig.preset,
    secondaryPanelTitle: pageConfig.secondaryPanelTitle || 'Properties',
    bottomPanelTitle: pageConfig.bottomPanelTitle || 'Console',
    showSecondaryPanel: pageConfig.secondaryPanelTitle !== null,
    showBottomPanel: pageConfig.bottomPanelTitle !== null,
    ...customConfig
  };
}

/**
 * Create custom layout configuration
 */
export function createLayoutConfig(options = {}) {
  return {
    showSidebar: options.showSidebar ?? true,
    sidebarCollapsible: options.sidebarCollapsible ?? true,
    showSecondaryPanel: options.showSecondaryPanel ?? false,
    showBottomPanel: options.showBottomPanel ?? false,
    mainPanelFlex: options.mainPanelFlex ?? 100,
    bottomPanelHeight: options.bottomPanelHeight ?? 200,
    secondaryPanelTitle: options.secondaryPanelTitle || 'Properties',
    bottomPanelTitle: options.bottomPanelTitle || 'Console',
    ...options
  };
}

/**
 * Layout component configuration template
 */
export const LAYOUT_COMPONENT_DEFAULTS = {
  sidebar: {
    width: 250,
    collapsedWidth: 50,
    animationDuration: 200
  },
  secondaryPanel: {
    width: 300,
    minWidth: 150,
    maxWidth: 400
  },
  bottomPanel: {
    height: 200,
    minHeight: 100,
    maxHeight: 500
  },
  tabBar: {
    height: 35
  },
  colors: {
    sidebar: '#252526',
    editor: '#1e1e1e',
    tabBar: '#2d2d30',
    border: '#3e3e42'
  }
};
