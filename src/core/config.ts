/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Constants ---
export const DEFAULT_CLEAR_SALE_PIN = "123";

// --- LocalStorage Keys ---
export const SUPER_ADMIN_PASSWORD_STORAGE_KEY = 'posSuperAdminPassword';
export const SUPER_ADMIN_APP_SETTINGS_STORAGE_KEY = 'posSuperAdminAppSettings';
export const ALL_BUSINESSES_STORAGE_KEY = 'posAllBusinesses';
export const SUPER_ADMIN_SUBSCRIPTION_PACKAGES_KEY = 'posSuperAdminSubscriptionPackages';
export const CURRENT_USER_ID_SESSION_KEY = 'currentUserId';
export const CURRENT_MANAGING_BUSINESS_ID_SESSION_KEY = 'currentManagingBusinessId';
export const MANAGER_MENU_CONFIG_STORAGE_KEY = 'posManagerMenuConfig_v1';

export const BUSINESS_DATA_PREFIX = 'business_';
export const BASE_USERS_STORAGE_KEY = 'posUsers';
export const BASE_GROUPS_STORAGE_KEY = 'posGroups_v1';
export const BASE_PRIVILEGES_STORAGE_KEY = 'posPrivileges_v1';
export const BASE_GROUP_PRIVILEGES_STORAGE_KEY = 'posGroupPrivileges_v1';
export const BASE_EMPLOYEES_STORAGE_KEY = 'posEmployees_hr';
export const BASE_TIME_LOGS_STORAGE_KEY = 'posTimeLogs_hr';
export const BASE_LEAVE_REQUESTS_STORAGE_KEY = 'posLeaveRequests_hr';
export const BASE_OVERTIME_ENTRIES_STORAGE_KEY = 'posOvertimeEntries_hr';
export const BASE_PAYROLL_ENTRIES_STORAGE_KEY = 'posPayrollEntries_v1'; // Konstanta për ruajtjen e payrollEntries
export const BASE_PRODUCTS_STORAGE_KEY = 'posProducts';
export const BASE_DAILY_CASH_LOG_KEY = 'posDailyCashLog';
export const BASE_SALES_LOG_STORAGE_KEY = 'posSalesLog';
export const BASE_CLEARED_SALES_LOG_KEY = 'posClearedSalesLog';
export const BASE_BUSINESS_DETAILS_STORAGE_KEY = 'posBusinessDetails';
export const BASE_CLEAR_SALE_PIN_HASH_STORAGE_KEY = 'posClearSalePinHash';
export const BASE_DEALS_STORAGE_KEY = 'posDeals';
export const BASE_CUSTOMERS_STORAGE_KEY = 'posCustomers';
export const BASE_CATEGORIES_STORAGE_KEY = 'posCategories_v1';
export const BASE_ITEM_TYPES_STORAGE_KEY = 'posItemTypes_v1';
export const BASE_SUPPLIERS_STORAGE_KEY = 'posSuppliers_v1';
export const BASE_ACCOUNTS_STORAGE_KEY = 'posAccounts_v1';
export const BASE_ACCOUNTING_SETTINGS_STORAGE_KEY = 'posAccountingSettings_v1';
export const BASE_JOURNAL_ENTRIES_STORAGE_KEY = 'posJournalEntries_v1';
export const BASE_PURCHASE_INVOICES_STORAGE_KEY = 'posPurchaseInvoices_v1';
export const BASE_RETURN_PURCHASE_INVOICES_STORAGE_KEY = 'posReturnPurchaseInvoices_v1';
export const BASE_SALES_RETURN_INVOICES_STORAGE_KEY = 'posSalesReturnInvoices_v1';
export const BASE_OUTGOING_PAYMENTS_STORAGE_KEY = 'posOutgoingPayments_v1';
export const BASE_INCOMING_PAYMENTS_STORAGE_KEY = 'posIncomingPayments_v1';
export const BASE_LOCAL_SALES_INVOICES_STORAGE_KEY = 'posLocalSalesInvoices_v1';
export const BASE_CREDIT_NOTES_STORAGE_KEY = 'posCreditNotes_v1';
export const BASE_DEBIT_NOTES_STORAGE_KEY = 'posDebitNotes_v1';
export const BASE_RECIPES_STORAGE_KEY = 'posRecipes_v1';
export const BASE_PRODUCTION_ORDERS_STORAGE_KEY = 'posProductionOrders_v1';
export const BASE_PRODUCTION_STAGES_STORAGE_KEY = 'posProductionStages_v1';
export const BASE_PRODUCTION_ROUTINGS_STORAGE_KEY = 'posProductionRoutings_v1';
export const BASE_PURCHASE_ORDERS_STORAGE_KEY = 'posPurchaseOrders_v1';
export const BASE_SALES_ORDERS_STORAGE_KEY = 'posSalesOrders_v1';

// --- Default Package Permissions (Fallback) ---
const defaultAllowedViews: string[] = [
    'dashboard',
    'actions',
    'todays_sales',
    'product_management',
    'category_management',
    'item_type_management',
    'stock_overview',
    'item_ledger',
    'sales_reports',
    'user_management',
    'group_management',
    'data_management',
    'subscription',
    'local_sales_management',
    'add_local_sale',
    'sales_returns_list',
    'add_sales_return',
    'hr_management',
    'payroll_management'
];

/**
 * Gets default permissions, typically for a basic or restricted set.
 * @returns An array of allowed view names.
 */
export function getDefaultPermissions(): string[] {
    return [...defaultAllowedViews]; // Return a copy
}