/**
 * Playwright selectors for portal navigation and interaction
 * Based on actual component structure from codebase analysis
 */

export const Selectors = {
  // Authentication
  auth: {
    loginButton: 'button:has-text("Log in")',
    welcomeText: ':has-text("Welcome")',
  },

  // Navigation
  nav: {
    clientsAndContacts: 'a:has-text("Clients & Contacts")',
    home: 'a:has-text("Home")',
    timesheet: 'a:has-text("Timesheet")',
    engagements: 'a:has-text("Engagements")',
  },

  // Clients & Contacts - Container
  clientsAndContacts: {
    // Tabs (top navigation)
    tabs: {
      clients: 'app-page-header a:has-text("Clients")',
      contacts: 'app-page-header a:has-text("Contacts")',
      clientGroups: 'app-page-header a:has-text("Client Groups")',
    },

    // Action buttons
    newClientButton: 'button:has-text("New Client...")',
    newContactButton: 'button:has-text("New Contact...")',
    newClientGroupButton: 'button:has-text("New Client Group...")',

    // Menu buttons
    clientMenu: 'button[matMenuTriggerFor="clientMenu"]',
    contactMenu: 'button[matMenuTriggerFor="contactMenu"]',

    // Duplicate resolution
    resolveDuplicatesLink: 'a:has-text("Resolve Duplicates")',
    reviewDuplicatesButton: 'button:has-text("Review duplicates")',
  },

  // Clients Table
  clients: {
    // Table structure
    table: 'ag-grid-angular',
    row: '.ag-row',
    cell: '.ag-cell',
    cellLink: '.ag-cell-link',

    // Filters & Search
    searchInput: 'input.form-input--search',
    allClientsTab: 'button.table-filter-tab:has-text("All Clients")',
    myClientsTab: 'button.table-filter-tab:has-text("My Clients")',
    showInactiveToggle: 'toggle', // or specific mat-slide-toggle

    // Actions menu (row-level)
    actionsButton: 'button.button--sm.button--text',
    actionsMenu: {
      edit: 'mat-menu-item:has-text("Edit client...")',
      viewEngagements: 'mat-menu-item:has-text("View engagements")',
      viewProjects: 'mat-menu-item:has-text("View projects")',
      viewDraftInvoices: 'mat-menu-item:has-text("View draft invoices")',
      viewTransactions: 'mat-menu-item:has-text("View transactions")',
      viewInvoices: 'mat-menu-item:has-text("View invoices")',
      viewPaymentHistory: 'mat-menu-item:has-text("View payment history")',
      viewPaymentPlans: 'mat-menu-item:has-text("View payment plans")',
      viewCollections: 'mat-menu-item:has-text("View collections")',
      goToClientPortal: 'mat-menu-item:has-text("Go to client portal")',
      deactivate: 'mat-menu-item:has-text("Deactivate Client...")',
      reactivate: 'mat-menu-item:has-text("Reactivate Client...")',
    },

    // Bulk actions
    batchActionsToolbar: 'app-batch-actions-toolbar',
    createClientGroup: 'button:has-text("Create Client Group")',
    createEngagements: 'button:has-text("Create Engagements")',
    editClients: 'button:has-text("Edit Clients")',

    // Export
    exportButton: 'app-export-all-button button',

    // Status indicators
    inactivePill: '.inactive-pill',
  },

  // Contacts Table
  contacts: {
    // Table structure
    table: 'ag-grid-angular',
    row: '.ag-row',
    searchInput: 'input.form-input--search',

    // Filters
    allContactsTab: 'button.table-filter-tab:has-text("All Contacts")',
    myContactsTab: 'button.table-filter-tab:has-text("My Contacts")',
    showInactiveToggle: 'toggle',

    // Actions menu (row-level)
    actionsButton: 'button[matMenuTriggerFor="menu"]',
    actionsMenu: {
      edit: 'mat-menu-item:has-text("Edit contact...")',
      linkClients: 'mat-menu-item:has-text("Link clients...")',
      sendMagicLink: 'mat-menu-item:has-text("Send magic sign-in link")',
      resetPortalLogin: 'mat-menu-item:has-text("Reset portal login...")',
    },

    // Right drawer (when contact selected)
    drawer: 'mat-drawer[position="end"]',
    drawerActionsButton: 'button:has-text("Actions...")',
  },

  // Client Groups
  clientGroups: {
    table: 'ag-grid-angular',
    row: '.ag-row',
    allClientGroupsTab: 'button.table-filter-tab:has-text("All Client Groups")',
    myClientGroupsTab: 'button.table-filter-tab:has-text("My Client Groups")',
  },

  // Client Detail View
  clientDetail: {
    // Header
    inactivePill: '.inactive-pill',
    newTransactionButton: 'button:has-text("New Transaction")',
    toggleSidebarButton: 'button[color="ghost"]',
    actionsButton: 'button:has-text("Actions...")',

    // Actions menu
    actionsMenu: {
      edit: 'mat-menu-item:has-text("Edit client...")',
      newEngagement: 'mat-menu-item:has-text("New engagement...")',
      newProject: 'mat-menu-item:has-text("New project...")',
      createInvoice: 'mat-menu-item:has-text("Create invoice...")',
      deactivate: 'mat-menu-item:has-text("Deactivate Client...")',
      reactivate: 'mat-menu-item:has-text("Reactivate Client...")',
    },

    // Tab navigation
    tabs: {
      engagements: 'a[routerLink*="engagements"]',
      transactions: 'a[routerLink*="transactions"]',
      invoices: 'a[routerLink*="invoices"]',
      paymentHistory: 'a[routerLink*="payment-history"]',
      draftInvoices: 'a[routerLink*="draft-invoices"]',
      projects: 'a[routerLink*="projects"]',
      documents: 'a[routerLink*="documents"]',
      paymentPlans: 'a[routerLink*="payment-plans"]',
      collections: 'a[routerLink*="collections"]',
    },

    // Right drawer tabs
    drawerTabs: {
      details: 'mat-tab:has-text("Client Details")',
      contacts: 'mat-tab:has-text("Contacts")',
      notes: 'mat-tab:has-text("Notes")',
    },
  },

  // Dialogs
  dialogs: {
    // Generic
    container: 'mat-dialog-container',
    appDialog: 'app-dialog',
    confirmationModal: 'app-confirmation-modal',

    // Add/Edit Client
    addEditClient: 'app-add-edit-client-dialog',

    // Add/Edit Contact
    addEditContact: 'app-add-edit-contact-dialog',

    // Deactivate
    deactivateEntity: 'app-deactivate-entity-dialog',
    deactivateButton: 'button[color="negative"]:has-text("Deactivate")',

    // Reactivate confirmation
    reactivateButton: 'button:has-text("Reactivate")',

    // Common dialog buttons
    saveButton: 'button:has-text("Save")',
    cancelButton: 'button:has-text("Cancel")',
    closeButton: 'button[mat-dialog-close]',
  },

  // Common elements
  common: {
    // Buttons by color
    primaryButton: 'button[color="primary"]',
    ghostButton: 'button[color="ghost"]',
    negativeButton: 'button[color="negative"]',

    // Menus
    matMenu: 'mat-menu',
    matMenuItem: 'mat-menu-item',
    menuTrigger: 'button[matMenuTriggerFor]',

    // Alerts
    alertWarning: '.alert--warning',
    alertError: '.alert--error',
    alertSuccess: '.alert--success',
    alertActionButton: '.alert__action-button',
    alertClose: '.alert__close',

    // Loading
    loading: ':has-text("Loading")',
    spinner: 'mat-spinner',

    // Drawers
    drawer: 'mat-drawer',
    drawerEnd: 'mat-drawer[position="end"]',

    // Overlay (blocks clicks)
    overlay: '.cdk-overlay-backdrop',
  },
};

export const Routes = {
  clientsAndContacts: {
    base: '/clients-and-contacts',
    clients: '/clients-and-contacts/clients',
    contacts: '/clients-and-contacts/contacts',
    clientGroups: '/clients-and-contacts/client-groups',
    clientDetail: (clientId: number) => `/clients-and-contacts/clients/${clientId}`,
    clientGroupDetail: (groupId: number) => `/clients-and-contacts/client-groups/${groupId}`,
  },
};
