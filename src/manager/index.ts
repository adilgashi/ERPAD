

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as ui from '../core/ui';
import * as dashboardManager from './dashboard';
import * as userManager from './userManagement';
import * as productManager from './productManagement';
import * as categoryManager from './categoryManagement';
import * as itemTypeManager from './itemTypeManagement';
import * as dealManager from './dealManagement';
import * as customerManager from './customerManagement';
import * as supplierManager from './supplierManagement';
import * as stockManager from './stockManagement';
import * as localPurchaseManager from './localPurchases';
import * as returnPurchaseManager from './returnPurchases';
import * as outgoingPaymentsManager from './outgoingPayments';
import * as incomingPaymentsManager from './incomingPayments';
import * as reportManager from './reports';
import * as subscriptionManager from './subscription';
import * as todaysSalesManager from './todaysSales';
import * as managerActions from './actions';
import * as managerDataManagement from './dataManagement';
import * as itemLedgerManager from './itemLedger';
import * as supplierLedgerManager from './supplierLedger';
import * as supplierBalancesManager from './supplierBalances';
import * as customerLedgerManager from './customerLedger';
import CustomerBalances from './customerBalances';
import InitialBalances from './initialBalances';
import * as salesReturnsManager from './salesReturns';
import { initCreditNotesView, initCreditNotesEventListeners } from './creditNotes';
import { initDebitNotesView, initDebitNotesEventListeners } from './debitNotes';
import * as productionManager from './production';
import * as hrManagement from './hrManagement';
import * as payrollManagement from './payrollManagement';
import * as payrollManagement from './payrollManagement';
import * as groupManager from './groupManagement';
import * as accountingManager from './accounting';
import * as accountLedger from './accountLedger';
import * as periodClosing from './periodClosing';
import * as localSalesManager from './localSales';
import { ReportType } from './reports';
import { ReportTypeEnum } from '../models';
import { showCashFlowStatementPanel } from './accounting';

export interface TabInfo {
    id: string;
    title: string;
    viewName: string;
    isInitialized: boolean;
    isPanelAppended: boolean;
    contentElement: HTMLElement;
    reportType?: ReportType;
    isReportCategoryView?: boolean;
}

let openTabs: TabInfo[] = [];
let activeTabId: string | null = null;
export let allowedViewsForCurrentSession: string[] = [];

export const viewInitializationFunctions: Record<string, (viewNameOrReportType: string, targetContainer?: HTMLElement) => void> = {

    'recipeListReport': (_viewName, container) => {
        reportManager.setupReportViewStructure(ReportTypeEnum.RecipeListReport, container!, () => {});
    },

    'trial_balance': (_viewName, container) => {
        reportManager.setupReportViewStructure(ReportTypeEnum.TrialBalance, container!, () => {});
    },
    'vat_report': (_viewName, container) => {
        reportManager.setupReportViewStructure(ReportTypeEnum.VatReport, container!, () => {});
    },
    'dashboard': dashboardManager.renderDashboardSummary,
    'actions': () => { /* Handled by event listeners in managerActions.ts */ },
    'todays_sales': todaysSalesManager.initTodaysSalesView,
    'product_management': productManager.showProductManagementPanelFromManager,
    'category_management': categoryManager.showCategoryManagementPanelFromManager,
    'item_type_management': itemTypeManager.showItemTypeManagementPanelFromManager,
    'deal_management': dealManager.showDealManagementPanelFromManager,
    'user_management': userManager.showUserManagementPanelFromManager,
    'group_management': groupManager.showGroupManagementPanelFromManager,
    'customer_management': customerManager.showCustomerManagementPanelFromManager,
    'supplier_management': supplierManager.showSupplierManagementPanelFromManager,
    'hr_management': hrManagement.showEmployeeManagementPanel,
    'hr_schedule_management': hrManagement.showScheduleManagementView,
    'hr_time_tracking': hrManagement.showTimeTrackingView,
    'hr_leave_overtime': hrManagement.showLeaveOvertimeView,
    'hr_holidays': hrManagement.showHolidaysView,
    'payroll_management': payrollManagement.initPayrollManagementView,
    'payroll_management': payrollManagement.initPayrollManagementView,
    'stock_overview': stockManager.renderStockOverview,
    'item_ledger': itemLedgerManager.initItemLedgerView,
    'supplier_ledger': supplierLedgerManager.initSupplierLedgerView,
    'supplier_balances': supplierBalancesManager.initSupplierBalancesView,
    'customer_ledger': customerLedgerManager.initCustomerLedgerView,
    'customer_balances': CustomerBalances.initCustomerBalancesView,
    'initial_balances': () => InitialBalances.init(),
    'local_purchases': localPurchaseManager.showLocalPurchaseManagementPanelFromManager,
    'add_local_purchase': localPurchaseManager.openLocalPurchaseFormModal,
    'return_purchases_list': returnPurchaseManager.showReturnPurchaseManagementPanelFromManager,
    'add_return_purchase': returnPurchaseManager.openReturnPurchaseFormModal,
    'outgoing_payments': outgoingPaymentsManager.initOutgoingPaymentsView,
    'incoming_payments': incomingPaymentsManager.initIncomingPaymentsView,
    'local_sales_management': localSalesManager.initLocalSalesManagementView,
    'add_local_sale': localSalesManager.initAddLocalSaleView,
    'sales_returns_list': salesReturnsManager.initSalesReturnsManagementView,
    'add_sales_return': salesReturnsManager.openSalesReturnFormUI,
    'credit_notes': initCreditNotesView,
    'debit_notes': initDebitNotesView,
    'recipe_management': productionManager.showRecipeManagementPanel,
    'production_orders': productionManager.showProductionOrderPanel,
    'production_stages': productionManager.showProductionStagePanel,
    'production_routings': productionManager.showProductionRoutingPanel,
    'chart_of_accounts': accountingManager.showChartOfAccountsPanel,
    'general_ledger': accountingManager.showGeneralLedgerPanel,
    'balance_sheet': accountingManager.showBalanceSheetPanel,
    'profit_and_loss': accountingManager.showProfitAndLossPanel,
    'cashFlowStatement': accountingManager.showCashFlowStatementPanel,
    'accountLedger': accountLedger.initAccountLedgerView,
    'accounting_settings': accountingManager.showAccountingSettingsPanel,
    'period_closing': periodClosing.initPeriodClosingView,
    'sales_reports': (viewName, targetContainer) => {
        reportManager.renderReportCategoryTiles('sales_reports', targetContainer, setActiveManagerView);
    },
    'purchases_reports': (viewName, targetContainer) => {
        reportManager.renderReportCategoryTiles('purchases_reports', targetContainer, setActiveManagerView);
    },
    'production_reports': (viewName, targetContainer) => {
        reportManager.renderReportCategoryTiles('production_reports', targetContainer, setActiveManagerView);
    },
    'returns_reports': (viewName, targetContainer) => {
        reportManager.renderReportCategoryTiles('returns_reports', targetContainer, setActiveManagerView);
    },
    'notes_reports': (viewName, targetContainer) => {
        reportManager.renderReportCategoryTiles('notes_reports', targetContainer, setActiveManagerView);
    },
    'cash_reports': (viewName, targetContainer) => {
        reportManager.renderReportCategoryTiles('cash_reports', targetContainer, setActiveManagerView);
    },
    'logs': (viewName, targetContainer) => {
        reportManager.renderReportCategoryTiles('logs', targetContainer, setActiveManagerView);
    },
    'data_management': () => { /* Handled by event listeners in managerDataManagement.ts */ },
    'subscription': subscriptionManager.renderSubscriptionInfoView,
};

// Add report types to the initialization map dynamically
Object.values(ReportTypeEnum || {}).forEach(reportTypeKey => {
    const reportType = reportTypeKey as ReportType;
    if (!viewInitializationFunctions[reportType]) {
        viewInitializationFunctions[reportType] = (rt: string, container: HTMLElement | undefined) => {
            if (container) {
                reportManager.setupReportViewStructure(rt as ReportType, container, setActiveManagerView);
            } else {
                console.error(`Target container not provided for report type: ${rt}`);
            }
        };
    }
});

function getTabInstanceContentId(viewName: string, reportType?: ReportType): string {
    let identifier = viewName;
    if (reportType) {
        identifier = `${viewName}_${reportType.replace(/\s+/g, '_').replace(/\//g, '_')}`;
    }
    return `tab-instance-content-${identifier.replace(/\s+/g, '_').replace(/\//g, '_')}`;
}

function getTabButtonId(viewName: string, reportType?: ReportType): string {
    let identifier = viewName;
     if (reportType && !['sales_reports', 'cash_reports', 'logs', 'purchases_reports', 'returns_reports', 'notes_reports', 'production_reports'].includes(viewName)) {
        identifier = `${viewName}_${reportType.replace(/\s+/g, '_').replace(/\//g, '_')}`;
    }
    return `tab-button-${identifier.replace(/\s+/g, '_').replace(/\//g, '_')}`;
}

function createTabButton(tab: TabInfo): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'manager-tab-button';
    button.id = getTabButtonId(tab.viewName, tab.reportType);

    const titleSpan = document.createElement('span');
    titleSpan.className = 'manager-tab-title-text';
    titleSpan.textContent = tab.title;
    button.appendChild(titleSpan);

    button.dataset.tabTargetId = tab.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', tab.id);
    button.setAttribute('aria-selected', tab.id === activeTabId ? 'true' : 'false');

    if (tab.id === activeTabId) {
        button.classList.add('active');
    }

    button.addEventListener('click', () => {
        setActiveManagerView(tab.viewName, tab.title, tab.reportType);
    });

    if (tab.viewName !== 'dashboard' && tab.contentElement?.id !== 'manager-content-dashboard') {
        const closeBtn = document.createElement('span');
        closeBtn.className = 'manager-tab-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.setAttribute('aria-label', `Mbyll skedën ${tab.title}`);
        closeBtn.tabIndex = 0;
        closeBtn.setAttribute('role', 'button');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });
        closeBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                closeTab(tab.id);
            }
        });
        button.appendChild(closeBtn);
    }
    return button;
}

function renderTabNavigation(): void {
    const managerTabNavigation = document.getElementById('manager-tab-navigation');
    if (!managerTabNavigation) return;
    managerTabNavigation.innerHTML = '';

    // Helper to determine if a tab is for reports
    const isReport = (tab: TabInfo): boolean => !!tab.isReportCategoryView || !!tab.reportType;

    // Separate tabs into two groups
    const operationalTabs = openTabs.filter(tab => !isReport(tab));
    const reportTabs = openTabs.filter(tab => isReport(tab));
    
    // Create fragments for each group
    const operationalTabsFragment = document.createDocumentFragment();
    operationalTabs.forEach(tab => operationalTabsFragment.appendChild(createTabButton(tab)));
    
    const reportTabsFragment = document.createDocumentFragment();
    reportTabs.forEach(tab => reportTabsFragment.appendChild(createTabButton(tab)));

    // Append operational tabs
    managerTabNavigation.appendChild(operationalTabsFragment);

    // Add a visual separator if both groups have tabs
    if (operationalTabs.length > 0 && reportTabs.length > 0) {
        const separator = document.createElement('div');
        separator.style.borderLeft = '2px solid #ced4da'; // A subtle color from the theme
        separator.style.height = '28px'; // Adjust based on tab height
        separator.style.alignSelf = 'center';
        separator.style.margin = '0 0.4rem'; // Vertical and horizontal margin
        managerTabNavigation.appendChild(separator);
    }
    
    // Append report tabs
    managerTabNavigation.appendChild(reportTabsFragment);
    
    // Scroll the active tab into view
    const activeButton = managerTabNavigation.querySelector<HTMLButtonElement>('.manager-tab-button.active');
    activeButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}


function closeTab(tabIdToClose: string): void {
    const tabIndex = openTabs.findIndex(t => t.id === tabIdToClose);
    if (tabIndex === -1) return;

    const closedTabInfo = openTabs[tabIndex];
    const managerPanelStagingArea = document.getElementById('manager-panel-staging-area');
    const managerTabContentArea = document.getElementById('manager-tab-content-area');

    if (closedTabInfo.isPanelAppended && managerPanelStagingArea && closedTabInfo.contentElement.parentElement !== managerPanelStagingArea) {
        managerPanelStagingArea.appendChild(closedTabInfo.contentElement);
        closedTabInfo.contentElement.style.display = 'none';
    }

    const tabContentWrapper = document.getElementById(tabIdToClose);
    if (tabContentWrapper && tabContentWrapper.parentElement === managerTabContentArea) {
        if (tabIdToClose.startsWith('manager-content-')) { 
            tabContentWrapper.style.display = 'none';
            tabContentWrapper.classList.remove('active-tab-pane');
        } else { 
            tabContentWrapper.remove();
        }
    }

    openTabs.splice(tabIndex, 1);

    if (activeTabId === tabIdToClose) {
        const newActiveTabIndex = Math.max(0, tabIndex > 0 ? tabIndex - 1 : 0);
        if (openTabs.length > 0) {
            setActiveManagerView(openTabs[newActiveTabIndex].viewName, openTabs[newActiveTabIndex].title, openTabs[newActiveTabIndex].reportType);
        } else {
            activeTabId = null;
            setActiveManagerView('dashboard', 'Përmbledhje');
        }
    }
    renderTabNavigation();
}

function displayActiveTabContent(): void {
    const managerTabContentArea = document.getElementById('manager-tab-content-area');
    if (!managerTabContentArea) return;

    const activeTabInfo = openTabs.find(tab => tab.id === activeTabId);

    openTabs.forEach(tab => {
        const tabElement = document.getElementById(tab.id);
        if (tabElement && tab.id !== activeTabId) {
            tabElement.style.display = 'none';
            tabElement.classList.remove('active-tab-pane');
        }
    });

    if (activeTabInfo) {
        const activeTabElement = document.getElementById(activeTabInfo.id);

        if (activeTabInfo.isPanelAppended && activeTabElement && activeTabElement.parentElement !== managerTabContentArea) {
            managerTabContentArea.appendChild(activeTabElement);
        }
        
        if (activeTabElement) {
            activeTabElement.style.display = 'block';
            activeTabElement.classList.add('active-tab-pane');

            if (!activeTabInfo.isInitialized) {
                initializeView(activeTabInfo.viewName, activeTabInfo.reportType, activeTabElement);
                activeTabInfo.isInitialized = true;
            } else {
                refreshActiveViewData(activeTabInfo.viewName, activeTabInfo.reportType, activeTabInfo.contentElement);
            }
        } else {
            console.error(`Error: Tab content element with ID '${activeTabInfo.id}' not found in DOM for view '${activeTabInfo.viewName}'.`);
        }
    }
    renderTabNavigation();
}

const specificStagedPanelIds: Record<string, string> = {
    'user_management': 'user-management-panel',
    'group_management': 'group-management-panel',
    'product_management': 'product-management-panel',
    'category_management': 'category-management-panel',
    'item_type_management': 'item-type-management-panel',
    'deal_management': 'deal-management-panel',
    'customer_management': 'customer-management-panel',
    'supplier_management': 'supplier-management-panel',
    'hr_management': 'employee-management-panel',
    'local_purchases': 'local-purchase-management-panel',
    'return_purchases_list': 'return-purchase-management-panel',
    'recipe_management': 'recipe-management-panel',
    'production_orders': 'production-order-panel',
    'production_stages': 'production-stage-panel',
    'production_routings': 'production-routing-panel',
    'chart_of_accounts': 'manager-content-chart_of_accounts',
    'general_ledger': 'manager-content-general_ledger',
    'balance_sheet': 'manager-content-balance_sheet',
    'accounting_settings': 'manager-content-accounting_settings'
};

function openOrSwitchToTab(viewName: string, title: string, reportType?: ReportType): void {
    const managerTabContentArea = document.getElementById('manager-tab-content-area');
    if (!managerTabContentArea) {
        console.error("Tab content area not found."); return;
    }

    const isReportCategoryView = ['sales_reports', 'purchases_reports', 'returns_reports', 'notes_reports', 'cash_reports', 'logs', 'production_reports'].includes(viewName);
    const isSpecificReportInstance = !!reportType && !isReportCategoryView;

    let tab = openTabs.find(t => {
        if (isReportCategoryView) return t.viewName === viewName;
        if (isSpecificReportInstance) return t.viewName === viewName && t.reportType === reportType;
        return t.viewName === viewName && !t.reportType;
    });

    if (!tab) {
        let contentElementForTab: HTMLElement;
        let tabIdToUse: string;
        let isPanelAppended = false;

        const staticContentDivId = `manager-content-${viewName}`;
        const existingStaticDiv = document.getElementById(staticContentDivId);

        const stagedPanelId = specificStagedPanelIds[viewName];
        const stagedPanelElement = stagedPanelId ? document.getElementById(stagedPanelId) : null;

        if (existingStaticDiv && !isSpecificReportInstance && !stagedPanelId) {
            tabIdToUse = existingStaticDiv.id;
            contentElementForTab = existingStaticDiv;
            isPanelAppended = false;
        } else if (stagedPanelElement) {
            tabIdToUse = stagedPanelElement.id;
            contentElementForTab = stagedPanelElement;
            isPanelAppended = true;
        } else {
            tabIdToUse = getTabInstanceContentId(viewName, reportType);
            const newTabDiv = document.createElement('div');
            newTabDiv.id = tabIdToUse;
            if (isSpecificReportInstance || viewName === 'accountLedger' || viewName === 'period_closing') { 
                newTabDiv.className = 'manager-content-section';
            } else {
                newTabDiv.className = 'manager-content-section';
            }
            managerTabContentArea.appendChild(newTabDiv);
            contentElementForTab = newTabDiv;
            isPanelAppended = false;
        }

        tab = { id: tabIdToUse, title, viewName, isInitialized: false, isPanelAppended, contentElement: contentElementForTab, reportType: reportType, isReportCategoryView: isReportCategoryView };
        openTabs.push(tab);
    } else {
        if (title && tab.title !== title) tab.title = title;
    }

    activeTabId = tab.id;
    displayActiveTabContent();

    const managerSidebar = document.getElementById('manager-sidebar');
    managerSidebar?.querySelectorAll<HTMLLIElement>('li[data-view]').forEach(li => {
        const liViewName = li.dataset.view;
        let isActive = false;
        if (isSpecificReportInstance && reportType) {
            const currentReportConfig = reportManager.getReportConfig(reportType);
            isActive = currentReportConfig?.categoryViewName === liViewName;
        } else {
            isActive = liViewName === viewName;
        }
        li.classList.toggle('active', isActive);
    });
}

export function setActiveManagerView(viewName: string, title?: string, reportTypeContext?: ReportType): void {
    const isReportCategoryView = ['sales_reports', 'purchases_reports', 'returns_reports', 'notes_reports', 'cash_reports', 'logs', 'production_reports'].includes(viewName);
    if (!isReportCategoryView && reportTypeContext === undefined && !allowedViewsForCurrentSession.includes(viewName) && viewName !== 'dashboard' && viewName !== 'subscription') {
        console.warn(`Pamja '${viewName}' nuk lejohet.`);
        const currentActiveTab = openTabs.find(tab => tab.id === activeTabId);
        if (currentActiveTab && currentActiveTab.viewName === viewName && currentActiveTab.reportType === reportTypeContext) {
            setActiveManagerView('dashboard', 'Përmbledhje');
        }
        return;
    }

    let tabTitle = title;
    if (!tabTitle) {
        const managerSidebar = document.getElementById('manager-sidebar');
        const menuItemElement = managerSidebar?.querySelector<HTMLLIElement>(`li[data-view="${viewName}"]`);
        let defaultTitleText = viewName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        if (menuItemElement) {
            tabTitle = menuItemElement.querySelector('a')?.textContent?.trim() || defaultTitleText;
        } else {
            const reportConfig = reportManager.getReportConfig(viewName as ReportType);
            tabTitle = reportConfig?.title || defaultTitleText;
        }
    }
    if (!tabTitle || !tabTitle.trim()) tabTitle = 'Skedë e Re';
    openOrSwitchToTab(viewName, tabTitle, reportTypeContext);
}

export function isViewInitialized(viewName: string, reportType?: ReportType): boolean {
    const tab = openTabs.find(t => t.viewName === viewName && t.reportType === reportType);
    return !!tab?.isInitialized;
}

function initializeView(viewName: string, reportTypeContext?: ReportType, targetContainer?: HTMLElement): void {
    let initFn = viewInitializationFunctions[viewName];
    let effectiveViewNameOrType = viewName;

    if (reportTypeContext && viewInitializationFunctions[reportTypeContext]) {
        initFn = viewInitializationFunctions[reportTypeContext];
        effectiveViewNameOrType = reportTypeContext;
    }

    if (!targetContainer) { 
        console.error(`Target container is missing for view initialization: ${effectiveViewNameOrType}`);
        return;
    }

    if (initFn) {
        try {
            initFn(effectiveViewNameOrType, targetContainer); 
        } catch (error: any) {
            console.error(`Gabim gjatë inicializimit të pamjes ${effectiveViewNameOrType}:`, error);
            targetContainer.innerHTML = `<p class="error-message">Gabim gjatë inicializimit të pamjes ${effectiveViewNameOrType}: ${error.message}</p>`; 
        }
    } else {
        console.warn(`Nuk ka funksion inicializimi për pamjen: ${effectiveViewNameOrType}`);
        targetContainer.innerHTML = `<p class="info-message">Pamja '${effectiveViewNameOrType}' nuk është konfiguruar plotësisht.</p>`;
    }
}

export function refreshActiveViewData(viewName?: string, reportTypeContext?: ReportType, targetContainer?: HTMLElement): void {
    const viewToRefresh = viewName || openTabs.find(t => t.id === activeTabId)?.viewName;
    const currentReportType = reportTypeContext || openTabs.find(t => t.id === activeTabId && t.viewName === viewToRefresh)?.reportType;
    let containerToUse: HTMLElement | undefined = targetContainer;

    if (!containerToUse) {
        const tabToRefreshInfo = openTabs.find(t => t.viewName === viewToRefresh && t.reportType === currentReportType);
        if (tabToRefreshInfo) {
            containerToUse = tabToRefreshInfo.contentElement;
        } else if (activeTabId && viewToRefresh === openTabs.find(t => t.id === activeTabId)?.viewName) {
            const activeTab = openTabs.find(t => t.id === activeTabId);
            if (activeTab) containerToUse = activeTab.contentElement;
        }
    }

    if (!viewToRefresh) { console.warn("refreshActiveViewData called without a view to refresh."); return; }
    if (!containerToUse) { console.warn("refreshActiveViewData: Could not determine target container for view:", viewToRefresh); return; }

    let refreshFn = viewInitializationFunctions[viewToRefresh];
    let effectiveViewNameOrType = viewToRefresh;

    if (currentReportType && viewInitializationFunctions[currentReportType]) {
        refreshFn = viewInitializationFunctions[currentReportType];
        effectiveViewNameOrType = currentReportType;
    }

    if (refreshFn) {
        try { refreshFn(effectiveViewNameOrType, containerToUse); }
        catch (error: any) {
            console.error(`Gabim gjatë rifreskimit të pamjes ${effectiveViewNameOrType}:`, error);
            if (containerToUse) containerToUse.innerHTML = `<p class="error-message">Gabim gjatë rifreskimit të pamjes ${effectiveViewNameOrType}: ${error.message}</p>`;
        }
    } else {
        console.warn(`Nuk ka logjikë rifreskimi/inicializimi për pamjen: ${effectiveViewNameOrType}`);
    }
}

export function initManagerView(): void {
    setupManagerSidebar();
    managerActions.initManagerActionsEventListeners();
    userManager.initUserManagementEventListeners();
    productManager.initProductManagementEventListeners();
    categoryManager.initCategoryManagementEventListeners();
    itemTypeManager.initItemTypeManagementEventListeners();
    dealManager.initDealManagementEventListeners();
    customerManager.initCustomerManagementEventListeners();
    supplierManager.initSupplierManagementEventListeners();
    hrManagement.initEmployeeManagementEventListeners();
    payrollManagement.initPayrollManagementEventListeners();
    payrollManagement.initPayrollManagementEventListeners();
    stockManager.initStockManagementEventListeners();
    localPurchaseManager.initLocalPurchasesEventListeners();
    returnPurchaseManager.initReturnPurchasesEventListeners();
    outgoingPaymentsManager.initOutgoingPaymentsEventListeners();
    incomingPaymentsManager.initIncomingPaymentsEventListeners();
    reportManager.initReportEventListeners();
    subscriptionManager.initSubscriptionEventListeners();
    todaysSalesManager.initTodaysSalesEventListeners();
    managerDataManagement.initDataManagementEventListeners();
    itemLedgerManager.initItemLedgerEventListeners();
    supplierLedgerManager.initSupplierLedgerEventListeners();
    supplierBalancesManager.initSupplierBalancesEventListeners();
    customerLedgerManager.initCustomerLedgerEventListeners();
    CustomerBalances.initCustomerBalancesEventListeners();
    InitialBalances.init();
    localSalesManager.initLocalSalesEventListeners();
    salesReturnsManager.initSalesReturnsEventListeners();
    initCreditNotesEventListeners();
    initDebitNotesEventListeners();
    productionManager.initProductionEventListeners();
    groupManager.initGroupManagementEventListeners();
    accountingManager.initAccountingEventListeners();
    accountLedger.initAccountLedgerEventListeners();
    periodClosing.initPeriodClosingEventListeners();

    dom.managerTabContentArea?.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const addRecipeBtn = target.closest('#show-add-recipe-modal-btn');
        if (addRecipeBtn) { productionManager.openRecipeFormModal(); }
        const addProductionOrderBtn = target.closest('#show-add-production-order-modal-btn');
        if (addProductionOrderBtn) { productionManager.openProductionOrderFormModal(); }
        const addProductionStageBtn = target.closest('#show-add-production-stage-modal-btn');
        if (addProductionStageBtn) { productionManager.openProductionStageFormModal(); }
        const addProductionRoutingBtn = target.closest('#show-add-production-routing-modal-btn');
        if (addProductionRoutingBtn) { productionManager.openProductionRoutingFormModal(); }
        const addLeaveRequestBtn = target.closest('#add-leave-request-btn');
        if (addLeaveRequestBtn) { hrManagement.openLeaveRequestModal(); }
        const addOvertimeBtn = target.closest('#add-overtime-btn');
        if (addOvertimeBtn) { hrManagement.openOvertimeModal(); }
    });

    if (state.currentUser?.role === 'menaxher') {
        showManagerDashboardView();
    }
}

function initManagerSidebarToggle(): void {
    const sidebar = dom.managerSidebar;
    const mainContent = dom.managerMainContent;
    const toggleBtn = document.getElementById('manager-sidebar-toggle-btn') as HTMLButtonElement | null;
    if (!sidebar || !mainContent || !toggleBtn) return;
    toggleBtn.addEventListener('click', () => {
        const isCollapsed = sidebar.classList.toggle('collapsed');
        if (mainContent) mainContent.classList.toggle('sidebar-collapsed', isCollapsed);
        toggleBtn.innerHTML = isCollapsed ? '&#x00BB;' : '&#x00AB;'; 
        toggleBtn.setAttribute('aria-expanded', (!isCollapsed).toString());
        toggleBtn.setAttribute('aria-label', isCollapsed ? 'Hap panelin anësor' : 'Mbyll panelin anësor');
        localStorage.setItem('managerSidebarState', isCollapsed ? 'collapsed' : 'expanded');
    });
}

function applySidebarStateFromStorage(): void {
    const sidebar = dom.managerSidebar;
    const mainContent = dom.managerMainContent;
    const toggleBtn = document.getElementById('manager-sidebar-toggle-btn') as HTMLButtonElement | null;
    if (!sidebar || !mainContent || !toggleBtn) return;
    const storedState = localStorage.getItem('managerSidebarState');
    if (storedState === 'collapsed') {
        sidebar.classList.add('collapsed');
        if (mainContent) mainContent.classList.add('sidebar-collapsed');
        toggleBtn.innerHTML = '&#x00BB;';
        toggleBtn.setAttribute('aria-expanded', 'false');
    }
}

export function showManagerDashboardView(): void {
    const managerDashboardView = document.getElementById('manager-dashboard-view');
    if (!managerDashboardView || !state.currentUser) return;
    setupManagerSidebar();
    
    allowedViewsForCurrentSession = [];
    allowedViewsForCurrentSession.push('dashboard', 'subscription');

    let rolePermissions: string[] = [];
    if (state.currentUser.role === 'menaxher') {
        const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
        const pkg = business ? state.subscriptionPackages.find(p => p.id === business.subscriptionPackageId) : undefined;
        if (pkg) {
            if (pkg.grantsAllAccess) {
                // If grantsAllAccess is true, give access to all views defined in the menu
                rolePermissions = state.managerMenuConfig.flatMap(category => category.items.map(item => item.dataView));
            } else {
                // Otherwise, use the specific allowed views from the package
                rolePermissions = pkg.allowedViews || [];
            }
        }
    } else {
        // Logic for other roles (based on group privileges)
        rolePermissions = state.privileges
            .filter(p => state.groupPrivileges.some(gp => gp.groupId === state.currentUser?.groupId && gp.privilegeId === p.id))
            .map(p => p.id);
    }
    
    allowedViewsForCurrentSession.push(...rolePermissions);
    allowedViewsForCurrentSession = [...new Set(allowedViewsForCurrentSession)];
    
    updateManagerSidebarBasedOnPermissions(allowedViewsForCurrentSession);
    applySidebarStateFromStorage();
    if (!openTabs.length) {
        setActiveManagerView('dashboard', 'Përmbledhje');
    } else {
        displayActiveTabContent();
    }
}


function updateManagerSidebarBasedOnPermissions(newAllowedViews: string[]): void {
    const dynamicManagerMenuContainer = dom.dynamicManagerMenuContainer;
    if (!dynamicManagerMenuContainer) return;

    // Update individual items
    dynamicManagerMenuContainer.querySelectorAll<HTMLLIElement>('li[data-view]').forEach(item => {
        const viewName = item.dataset.view;
        const isAllowed = viewName && newAllowedViews.includes(viewName);
        item.classList.toggle('menu-item-locked', !isAllowed);
        item.setAttribute('aria-disabled', (!isAllowed).toString());
    });

    // Update category headers
    dynamicManagerMenuContainer.querySelectorAll<HTMLDivElement>('.accordion-header').forEach(header => {
        const contentId = header.getAttribute('aria-controls');
        if (!contentId) return;
        const content = document.getElementById(contentId);
        if (!content) return;

        const allItemsInGroup = Array.from(content.querySelectorAll<HTMLLIElement>('li[data-view]'));
        const allItemsLocked = allItemsInGroup.length > 0 && allItemsInGroup.every(item => item.classList.contains('menu-item-locked'));
        
        header.classList.toggle('menu-group-locked', allItemsLocked);
    });
}


export function setupManagerSidebar(): void {
    const dynamicManagerMenuContainer = dom.dynamicManagerMenuContainer;
    if (!dynamicManagerMenuContainer) return;

    if (!document.getElementById('manager-sidebar-toggle-btn')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'manager-sidebar-toggle-btn';
        toggleBtn.className = 'sidebar-toggle-btn';
        toggleBtn.innerHTML = '&#x00AB;';
        toggleBtn.setAttribute('aria-label', 'Mbyll panelin anësor');
        dom.managerSidebar?.appendChild(toggleBtn);
        initManagerSidebarToggle();
    }
    
    dynamicManagerMenuContainer.innerHTML = '';
    const menuStructure = storage.buildManagerMenuFromConfig(state.managerMenuConfig);
    dynamicManagerMenuContainer.appendChild(menuStructure);
    setupManagerSidebarAccordion();
    setupManagerSidebarSearch();

    dynamicManagerMenuContainer.querySelectorAll<HTMLLIElement>('li[data-view]').forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            if (item.classList.contains('menu-item-locked')) return;
            const viewName = item.dataset.view;
            const title = item.querySelector('a')?.textContent?.trim() || 'Skedë e Re';
            if (viewName) {
                const reportType = Object.values(ReportTypeEnum).find(rt => rt === viewName);
                setActiveManagerView(viewName, title, reportType);
            }
        });
    });
}

function setupManagerSidebarAccordion(): void {
    const menuSourceContainer = dom.dynamicManagerMenuContainer;
    if (!menuSourceContainer) return;
    menuSourceContainer.querySelectorAll<HTMLDivElement>('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            if (header.classList.contains('menu-group-locked')) return;
            const contentId = header.getAttribute('aria-controls');
            if (!contentId) return;
            const content = document.getElementById(contentId) as HTMLUListElement | null;
            if (!content) return;
            const isActive = header.classList.toggle('active-header');
            content.style.maxHeight = isActive ? `${content.scrollHeight}px` : '';
            header.setAttribute('aria-expanded', isActive ? 'true' : 'false');
            const indicator = header.querySelector('.accordion-indicator');
            if (indicator) indicator.textContent = isActive ? '▼' : '►';
        });

        // Initialize based on defaultOpen dataset
        if(header.dataset.defaultOpen === 'true' && !header.classList.contains('active-header')) {
            header.click();
        }
    });
}


function setupManagerSidebarSearch(): void {
    const searchInput = dom.managerSidebarSearchInput;
    const menuContainer = dom.dynamicManagerMenuContainer;
    if (!searchInput || !menuContainer) return;

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        const accordionItems = menuContainer.querySelectorAll<HTMLLIElement>('.accordion-item');
        accordionItems.forEach(category => {
            const menuItems = category.querySelectorAll<HTMLLIElement>('li[data-view]');
            let categoryVisible = false;

            menuItems.forEach(item => {
                const itemName = item.textContent?.toLowerCase() || '';
                if (itemName.includes(searchTerm)) {
                    item.style.display = '';
                    categoryVisible = true;
                } else {
                    item.style.display = 'none';
                }
            });

            const categoryHeader = category.querySelector('.accordion-header');
            const categoryContent = category.querySelector('.accordion-content') as HTMLElement;

            if (categoryVisible) {
                category.style.display = '';
                // If searching, expand the categories that have matches
                if (searchTerm.length > 0) {
                     if (categoryHeader && !categoryHeader.classList.contains('active-header')) {
                         categoryHeader.classList.add('active-header');
                         categoryContent.style.maxHeight = categoryContent.scrollHeight + 'px';
                         const indicator = categoryHeader.querySelector('.accordion-indicator');
                         if(indicator) indicator.textContent = '▼';
                     }
                }
            } else {
                category.style.display = 'none';
            }
        });
    });
}