/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Manager Content Area IDs ---
export const managerContentDashboard = document.getElementById('manager-content-dashboard') as HTMLDivElement | null;
export const managerContentActions = document.getElementById('manager-content-actions') as HTMLDivElement | null;
export const managerContentTodaysSales = document.getElementById('manager-content-todays_sales') as HTMLDivElement | null;
export const managerContentProductManagement = document.getElementById('manager-content-product_management') as HTMLDivElement | null;
export const managerContentCategoryManagement = document.getElementById('manager-content-category_management') as HTMLDivElement | null;
export const managerContentItemTypeManagement = document.getElementById('manager-content-item_type_management') as HTMLDivElement | null;
export const managerContentDealManagement = document.getElementById('manager-content-deal_management') as HTMLDivElement | null;
export const managerContentUserManagement = document.getElementById('manager-content-user_management') as HTMLDivElement | null;
export const managerContentGroupManagement = document.getElementById('manager-content-group_management') as HTMLDivElement | null;
export const managerContentCustomerManagement = document.getElementById('manager-content-customer_management') as HTMLDivElement | null;
export const managerContentSupplierManagement = document.getElementById('manager-content-supplier_management') as HTMLDivElement | null;
export const managerContentStockOverview = document.getElementById('manager-content-stock_overview') as HTMLDivElement | null;
export const managerContentItemLedger = document.getElementById('manager-content-item_ledger') as HTMLDivElement | null;
export const managerContentSupplierLedger = document.getElementById('manager-content-supplier_ledger') as HTMLDivElement | null;
export const managerContentSupplierBalances = document.getElementById('manager-content-supplier_balances') as HTMLDivElement | null;
export const managerContentCustomerLedger = document.getElementById('manager-content-customer_ledger') as HTMLDivElement | null;
export const managerContentCustomerBalances = document.getElementById('manager-content-customer_balances') as HTMLDivElement | null;
export const managerContentInitialBalances = document.getElementById('manager-content-initial_balances') as HTMLDivElement | null;
export const managerContentLocalPurchases = document.getElementById('manager-content-local_purchases') as HTMLDivElement | null;
export const managerContentAddLocalPurchase = document.getElementById('manager-content-add_local_purchase') as HTMLDivElement | null;
export const managerContentReturnPurchasesList = document.getElementById('manager-content-return_purchases_list') as HTMLDivElement | null; // Alias for managerContentReturnPurchases
export const managerContentAddReturnPurchase = document.getElementById('manager-content-add_return_purchase') as HTMLDivElement | null;
export const managerContentOutgoingPayments = document.getElementById('manager-content-outgoing_payments') as HTMLDivElement | null;
export const managerContentIncomingPayments = document.getElementById('manager-content-incoming_payments') as HTMLDivElement | null;
export const managerContentLocalSalesManagement = document.getElementById('manager-content-local_sales_management') as HTMLDivElement | null;
export const managerContentAddLocalSale = document.getElementById('manager-content-add_local_sale') as HTMLDivElement | null;
export const managerContentSalesReturnsList = document.getElementById('manager-content-sales_returns_list') as HTMLDivElement | null;
export const managerContentAddSalesReturn = document.getElementById('manager-content-add_sales_return') as HTMLDivElement | null;
export const managerContentCreditNotes = document.getElementById('manager-content-credit_notes') as HTMLDivElement | null;
export const managerContentDebitNotes = document.getElementById('manager-content-debit_notes') as HTMLDivElement | null;
export const managerContentReportsSales = document.getElementById('manager-content-sales_reports') as HTMLDivElement | null;
export const managerContentReportsCash = document.getElementById('manager-content-cash_reports') as HTMLDivElement | null;
export const managerContentReportsLogs = document.getElementById('manager-content-logs') as HTMLDivElement | null;
export const managerContentDataManagement = document.getElementById('manager-content-data_management') as HTMLDivElement | null;
export const managerContentSubscription = document.getElementById('manager-content-subscription') as HTMLDivElement | null;

// --- Manager - Dashboard Summary Elements ---
export const dashSubPackageNameElement = document.getElementById('dash-sub-package-name') as HTMLSpanElement | null;
export const dashSubExpiryDateElement = document.getElementById('dash-sub-expiry-date') as HTMLSpanElement | null;
export const dashSubStatusElement = document.getElementById('dash-sub-status') as HTMLSpanElement | null;
export const dashboardOpenShiftsSummary = document.getElementById('dashboard-open-shifts-summary') as HTMLDivElement | null;

// --- Manager - Stock Management ---
export const stockOverviewSearchInput = document.getElementById('stock-overview-search-input') as HTMLInputElement | null;
export const stockOverviewTbody = document.getElementById('stock-overview-tbody') as HTMLTableSectionElement | null;

// --- Manager - Item Ledger ---
export const itemLedgerProductSelect = document.getElementById('item-ledger-product-select') as HTMLSelectElement | null;
export const itemLedgerStartDateInput = document.getElementById('item-ledger-start-date') as HTMLInputElement | null;
export const itemLedgerEndDateInput = document.getElementById('item-ledger-end-date') as HTMLInputElement | null;
export const generateItemLedgerBtn = document.getElementById('generate-item-ledger-btn') as HTMLButtonElement | null;
export const itemLedgerContentArea = document.getElementById('item-ledger-content-area') as HTMLDivElement | null;
export const exportItemLedgerPdfBtn = document.getElementById('export-item-ledger-pdf-btn') as HTMLButtonElement | null;
export const printItemLedgerBtn = document.getElementById('print-item-ledger-btn') as HTMLButtonElement | null;

// --- Manager - Supplier Ledger ---
export const supplierLedgerSupplierSelect = document.getElementById('supplier-ledger-supplier-select') as HTMLSelectElement | null;
export const supplierLedgerStartDateInput = document.getElementById('supplier-ledger-start-date') as HTMLInputElement | null;
export const supplierLedgerEndDateInput = document.getElementById('supplier-ledger-end-date') as HTMLInputElement | null;
export const generateSupplierLedgerBtn = document.getElementById('generate-supplier-ledger-btn') as HTMLButtonElement | null;
export const supplierLedgerContentArea = document.getElementById('supplier-ledger-content-area') as HTMLDivElement | null;
export const exportSupplierLedgerPdfBtn = document.getElementById('export-supplier-ledger-pdf-btn') as HTMLButtonElement | null;
export const printSupplierLedgerBtn = document.getElementById('print-supplier-ledger-btn') as HTMLButtonElement | null;

// --- Manager - Supplier Balances ---
export const supplierBalancesSearchInput = document.getElementById('supplier-balances-search-input') as HTMLInputElement | null;
export const supplierBalancesTbody = document.getElementById('supplier-balances-tbody') as HTMLTableSectionElement | null;

// --- Manager - Customer Ledger ---
export const customerLedgerCustomerSelect = document.getElementById('customer-ledger-customer-select') as HTMLSelectElement | null;
export const customerLedgerStartDateInput = document.getElementById('customer-ledger-start-date') as HTMLInputElement | null;
export const customerLedgerEndDateInput = document.getElementById('customer-ledger-end-date') as HTMLInputElement | null;
export const generateCustomerLedgerBtn = document.getElementById('generate-customer-ledger-btn') as HTMLButtonElement | null;
export const customerLedgerContentArea = document.getElementById('customer-ledger-content-area') as HTMLDivElement | null;
export const exportCustomerLedgerPdfBtn = document.getElementById('export-customer-ledger-pdf-btn') as HTMLButtonElement | null;
export const printCustomerLedgerBtn = document.getElementById('print-customer-ledger-btn') as HTMLButtonElement | null;

// --- Manager - Customer Balances ---
export const customerBalancesSearchInput = document.getElementById('customer-balances-search-input') as HTMLInputElement | null;
export const customerBalancesTbody = document.getElementById('customer-balances-tbody') as HTMLTableSectionElement | null;

// --- Manager - Initial Balances ---
export const ibProductSearchInput = document.getElementById('ib-product-search-input') as HTMLInputElement | null;
export const ibCustomerSearchInput = document.getElementById('ib-customer-search-input') as HTMLInputElement | null;
export const ibSupplierSearchInput = document.getElementById('ib-supplier-search-input') as HTMLInputElement | null;
export const ibSaveProductStockBtn = document.getElementById('ib-save-product-stock-btn') as HTMLButtonElement | null;
export const ibSaveCustomerBalancesBtn = document.getElementById('ib-save-customer-balances-btn') as HTMLButtonElement | null;
export const ibSaveSupplierBalancesBtn = document.getElementById('ib-save-supplier-balances-btn') as HTMLButtonElement | null;
export const ibProductStockTbody = document.getElementById('ib-product-stock-tbody') as HTMLTableSectionElement | null;
export const ibCustomerBalanceTbody = document.getElementById('ib-customer-balance-tbody') as HTMLTableSectionElement | null;
export const ibSupplierBalanceTbody = document.getElementById('ib-supplier-balance-tbody') as HTMLTableSectionElement | null;

// --- Manager - Reports ---
export const managerReportViewTemplate = document.getElementById('manager-report-view-template') as HTMLDivElement | null;
export const commonReportFiltersTemplate = document.getElementById('common-report-filters-template') as HTMLDivElement | null;
export const salesReportsCategoryTiles = document.getElementById('sales-reports-category-tiles') as HTMLDivElement | null;
export const cashReportsCategoryTiles = document.getElementById('cash-reports-category-tiles') as HTMLDivElement | null;
export const logsCategoryTiles = document.getElementById('logs-category-tiles') as HTMLDivElement | null;

// --- Manager - Today's Sales View ---
export const todaysSalesFilterInput = document.getElementById('todays-sales-filter-input') as HTMLInputElement | null;
export const todaysSalesTbody = document.getElementById('todays-sales-tbody') as HTMLTableSectionElement | null;
export const todaysSalesSummary = document.getElementById('todays-sales-summary') as HTMLDivElement | null;

// --- Manager - Data Management ---
export const downloadBusinessBackupBtn = document.getElementById('download-business-backup-btn') as HTMLButtonElement | null;

// --- Manager - Subscription View ---
export const subInfoPackageNameElement = document.getElementById('sub-info-package-name') as HTMLSpanElement | null;
export const subInfoExpiryDateElement = document.getElementById('sub-info-expiry-date') as HTMLSpanElement | null;
export const subInfoStatusElement = document.getElementById('sub-info-status') as HTMLSpanElement | null;
export const subInfoFeaturesList = document.getElementById('sub-info-features-list') as HTMLUListElement | null;
export const expiredSubscriptionActivationForm = document.getElementById('expired-subscription-activation-form') as HTMLDivElement | null;
export const expiredSubMessageElement = document.getElementById('expired-sub-message') as HTMLParagraphElement | null;
export const expiredSubInstructionElement = document.getElementById('expired-sub-instruction') as HTMLParagraphElement | null;
export const activationCodeInputGroup = document.getElementById('activation-code-input-group') as HTMLDivElement | null;
export const newSubscriptionActivationCodeInput = document.getElementById('new-subscription-activation-code') as HTMLInputElement | null;
export const activateNewSubscriptionBtn = document.getElementById('activate-new-subscription-btn') as HTMLButtonElement | null;
export const subscriptionActivationErrorElement = document.getElementById('subscription-activation-error') as HTMLParagraphElement | null;
export const upgradeOptionsSection = document.getElementById('subscription-upgrade-options-container') as HTMLDivElement | null;
export const upgradeOptionsListDiv = document.getElementById('upgrade-options-list') as HTMLDivElement | null;
export const noUpgradeOptionsMessage = document.getElementById('no-upgrade-options-message') as HTMLParagraphElement | null;
export const managerUpgradeRequestStatus = document.getElementById('manager-upgrade-request-status') as HTMLParagraphElement | null;

// --- Staged panels (to be moved into managerTabContentArea) ---
export const userManagementPanel = document.getElementById('user-management-panel') as HTMLDivElement | null;
export const productManagementPanel = document.getElementById('product-management-panel') as HTMLDivElement | null;
export const categoryManagementPanel = document.getElementById('category-management-panel') as HTMLDivElement | null;
export const customerManagementPanel = document.getElementById('customer-management-panel') as HTMLDivElement | null;
export const dealManagementPanel = document.getElementById('deal-management-panel') as HTMLDivElement | null;
export const itemTypeManagementPanel = document.getElementById('item-type-management-panel') as HTMLDivElement | null;
export const supplierManagementPanel = document.getElementById('supplier-management-panel') as HTMLDivElement | null;
export const localPurchaseManagementPanel = document.getElementById('local-purchase-management-panel') as HTMLDivElement | null;
export const returnPurchaseManagementPanel = document.getElementById('return-purchase-management-panel') as HTMLDivElement | null;

// --- Table Bodies for staged panels ---
export const userListTbody = document.getElementById('user-list-tbody') as HTMLTableSectionElement | null;
export const productListManagerTbody = document.getElementById('product-list-manager-tbody') as HTMLTableSectionElement | null;
export const categoryListTbody = document.getElementById('category-list-tbody') as HTMLTableSectionElement | null;
export const customerListTbody = document.getElementById('customer-list-tbody') as HTMLTableSectionElement | null;
export const dealListTbody = document.getElementById('deal-list-tbody') as HTMLTableSectionElement | null;
export const itemTypeListTbody = document.getElementById('item-type-list-tbody') as HTMLTableSectionElement | null;
export const supplierListTbody = document.getElementById('supplier-list-tbody') as HTMLTableSectionElement | null;
export const localPurchaseListTbody = document.getElementById('local-purchase-list-tbody') as HTMLTableSectionElement | null;

// --- Local Purchases Form ---
export const localPurchaseForm = document.getElementById('local-purchase-form') as HTMLFormElement | null;
export const localPurchaseFormModalTitle = document.getElementById('local-purchase-form-title') as HTMLHeadingElement | null;
export const editLocalPurchaseIdInput = document.getElementById('edit-local-purchase-id') as HTMLInputElement | null;
export const lpSupplierSelect = document.getElementById('lp-supplier-select') as HTMLSelectElement | null;
export const lpSystemInvoiceNumberInput = document.getElementById('lp-system-invoice-number') as HTMLInputElement | null;
export const lpSupplierInvoiceNumberInput = document.getElementById('lp-supplier-invoice-number') as HTMLInputElement | null;
export const lpInvoiceDateInput = document.getElementById('lp-invoice-date') as HTMLInputElement | null;
export const lpReceiptDateInput = document.getElementById('lp-receipt-date') as HTMLInputElement | null;
export const lpProductSelect = document.getElementById('lp-product-select') as HTMLSelectElement | null;
export const localPurchaseFormErrorElement = document.getElementById('local-purchase-form-error') as HTMLParagraphElement | null;
export const lpAddItemBtn = document.getElementById('lp-add-item-btn') as HTMLButtonElement | null;
export const lpItemsTbody = document.getElementById('lp-items-tbody') as HTMLTableSectionElement | null;
export const lpTotalWithoutVatElement = document.getElementById('lp-total-without-vat') as HTMLSpanElement | null;
export const lpTotalVatElement = document.getElementById('lp-total-vat') as HTMLSpanElement | null;
export const lpTotalWithVatElement = document.getElementById('lp-total-with-vat') as HTMLSpanElement | null;
export const cancelLocalPurchaseFormBtn = document.getElementById('cancel-local-purchase-form-btn') as HTMLButtonElement | null;

// --- Return Purchases Form ---
export const returnPurchaseFormErrorElement = document.getElementById('return-purchase-form-error') as HTMLParagraphElement | null;
export const rpInvoiceDateInput = document.getElementById('rp-invoice-date') as HTMLInputElement | null;
export const rpReasonInput = document.getElementById('rp-reason') as HTMLInputElement | null;
export const rpSystemInvoiceNumberInput = document.getElementById('rp-system-invoice-number') as HTMLInputElement | null;
export const rpSupplierSelect = document.getElementById('rp-supplier-select') as HTMLSelectElement | null;
export const rpItemsTbody = document.getElementById('rp-items-tbody') as HTMLTableSectionElement | null;

// --- Incoming Payments ---
export const incomingPaymentForm = document.getElementById('incoming-payment-form') as HTMLFormElement | null;
export const cancelIncomingPaymentFormBtn = document.getElementById('cancel-incoming-payment-form-btn') as HTMLButtonElement | null;
export const ipCustomerSelect = document.getElementById('ip-customer-select') as HTMLSelectElement | null;
export const ipTotalReceivedAmountInput = document.getElementById('ip-total-received-amount') as HTMLInputElement | null;
export const ipInvoicesToAllocateTbody = document.getElementById('ip-invoices-to-allocate-tbody') as HTMLTableSectionElement | null;
export const editIncomingPaymentIdInput = document.getElementById('edit-incoming-payment-id') as HTMLInputElement | null;
export const ipPaymentDateInput = document.getElementById('ip-payment-date') as HTMLInputElement | null;
export const incomingPaymentFormError = document.getElementById('incoming-payment-form-error') as HTMLParagraphElement | null;
export const ipInvoiceAllocationSection = document.getElementById('ip-invoice-allocation-section') as HTMLDivElement | null;
export const ipRemainingAllocationAmountSpan = document.getElementById('ip-remaining-allocation-amount-span') as HTMLSpanElement | null;
export const existingIncomingPaymentsTbody = document.getElementById('existing-incoming-payments-tbody') as HTMLTableSectionElement | null;
export const ipInvoicesToAllocateTfoot = document.getElementById('ip-invoices-to-allocate-tfoot') as HTMLTableSectionElement | null;
export const ipAllocTotalInvoiceAmount = document.getElementById('ip-alloc-total-invoice-amount') as HTMLTableCellElement | null;
export const ipAllocTotalPaidSoFar = document.getElementById('ip-alloc-total-paid-so-far') as HTMLTableCellElement | null;
export const ipAllocTotalRemainingBalance = document.getElementById('ip-alloc-total-remaining-balance') as HTMLTableCellElement | null;
export const ipAllocTotalPayingNow = document.getElementById('ip-alloc-total-paying-now') as HTMLTableCellElement | null;
export const ipPaymentMethodSelect = document.getElementById('ip-payment-method-select') as HTMLSelectElement | null;
export const ipReferenceInput = document.getElementById('ip-reference-input') as HTMLInputElement | null;
export const ipNotesTextarea = document.getElementById('ip-notes-textarea') as HTMLTextAreaElement | null;

// --- Outgoing Payments ---
export const outgoingPaymentForm = document.getElementById('outgoing-payment-form') as HTMLFormElement | null;
export const opSupplierSelect = document.getElementById('op-supplier-select') as HTMLSelectElement | null;
export const opTotalPaidAmountInput = document.getElementById('op-total-paid-amount') as HTMLInputElement | null;
export const saveOutgoingPaymentBtn = document.getElementById('save-outgoing-payment-btn') as HTMLButtonElement | null;
export const cancelOutgoingPaymentFormBtn = document.getElementById('cancel-outgoing-payment-form-btn') as HTMLButtonElement | null;
export const opInvoicesToAllocateTbody = document.getElementById('op-invoices-to-allocate-tbody') as HTMLTableSectionElement | null;
export const editOutgoingPaymentIdInput = document.getElementById('edit-outgoing-payment-id') as HTMLInputElement | null;
export const opPaymentDateInput = document.getElementById('op-payment-date') as HTMLInputElement | null;
export const opInvoiceAllocationSection = document.getElementById('op-invoice-allocation-section') as HTMLDivElement | null;
export const opRemainingAllocationAmountSpan = document.getElementById('op-remaining-allocation-amount-span') as HTMLSpanElement | null;
export const outgoingPaymentFormError = document.getElementById('outgoing-payment-form-error') as HTMLParagraphElement | null;
export const existingOutgoingPaymentsTbody = document.getElementById('existing-outgoing-payments-tbody') as HTMLTableSectionElement | null;
export const opInvoicesToAllocateTfoot = document.getElementById('op-invoices-to-allocate-tfoot') as HTMLTableSectionElement | null;
export const opAllocTotalInvoiceAmount = document.getElementById('op-alloc-total-invoice-amount') as HTMLTableCellElement | null;
export const opAllocTotalPaidSoFar = document.getElementById('op-alloc-total-paid-so-far') as HTMLTableCellElement | null;
export const opAllocTotalRemainingBalance = document.getElementById('op-alloc-total-remaining-balance') as HTMLTableCellElement | null;
export const opAllocTotalPayingNow = document.getElementById('op-alloc-total-paying-now') as HTMLTableCellElement | null;
export const opPaymentMethodSelect = document.getElementById('op-payment-method-select') as HTMLSelectElement | null;
export const opReferenceInput = document.getElementById('op-reference-input') as HTMLInputElement | null;
export const opNotesTextarea = document.getElementById('op-notes-textarea') as HTMLTextAreaElement | null;
