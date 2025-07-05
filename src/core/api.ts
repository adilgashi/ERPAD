/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file simulates a backend API client.
// It uses localStorage for persistence, falling back to db.json for initial data.

import * as state from './state';
import * as config from './config';
import { 
    User, Product, Category, ItemType, DailyCashEntry, SaleRecord, 
    ClearedSaleLogEntry, BusinessDetails, Deal, Customer, Supplier, 
    PurchaseInvoice, ReturnPurchaseInvoice, SalesReturnInvoice, OutgoingPayment, 
    IncomingPayment, LocalSaleInvoice, CreditNote, DebitNote, Recipe, 
    ProductionOrder, ProductionStage, ProductionRouting, SubscriptionPackage, 
    MenuCategoryConfig, Business, Employee, TimeLog, LeaveRequest, Overtime, PayrollEntry,
    Group, Privilege, GroupPrivilege, Account, JournalEntry, AccountingSettings,
    PettyCashEntry,
    SuperAdminAppSettings
} from '../models';
import { simpleHash } from './utils';

// --- Caching for db.json ---
let dbData: any = null;
let dbLoadPromise: Promise<any> | null = null;

async function getDbData(): Promise<any> {
    if (dbData) {
        return dbData;
    }
    if (dbLoadPromise) {
        return dbLoadPromise;
    }

    dbLoadPromise = new Promise(async (resolve) => {
        try {
            const response = await fetch('/db.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch db.json: ${response.statusText}`);
            }
            const data = await response.json();
            dbData = data;
            resolve(data);
        } catch (error) {
            console.error("Could not fetch or parse db.json. Falling back to empty data.", error);
            dbData = {}; // Fallback to an empty object on error
            resolve(dbData);
        } finally {
            dbLoadPromise = null;
        }
    });
    return dbLoadPromise;
}

// --- Key Management ---
export function getBusinessStorageKey(baseKey: string, businessId: string): string {
    return `${config.BUSINESS_DATA_PREFIX}${businessId}_${baseKey}`;
}

// --- Generic Helpers for Business Data ---

async function getBusinessData<T>(businessId: string, baseKey: string, dbKey: string): Promise<T[]> {
    const storageKey = getBusinessStorageKey(baseKey, businessId);
    const fromStorage = localStorage.getItem(storageKey);
    if (fromStorage) {
        return JSON.parse(fromStorage);
    }
    const db = await getDbData();
    const businessDbData = db?.businessData?.[businessId];
    return businessDbData?.[dbKey] || [];
}

async function saveBusinessData<T>(businessId: string, baseKey: string, data: T[]): Promise<void> {
    const storageKey = getBusinessStorageKey(baseKey, businessId);
    localStorage.setItem(storageKey, JSON.stringify(data));
}

async function getBusinessObject<T>(businessId: string, baseKey: string, dbKey: string): Promise<T | null> {
    const storageKey = getBusinessStorageKey(baseKey, businessId);
    const fromStorage = localStorage.getItem(storageKey);
    if (fromStorage) {
        return JSON.parse(fromStorage);
    }
    const db = await getDbData();
    const businessDbData = db?.businessData?.[businessId];
    return businessDbData?.[dbKey] || null;
}

async function saveBusinessObject<T>(businessId: string, baseKey: string, data: T): Promise<void> {
    const storageKey = getBusinessStorageKey(baseKey, businessId);
    localStorage.setItem(storageKey, JSON.stringify(data));
}

async function getBusinessString(businessId: string, baseKey: string, dbKey: string, defaultValue: string): Promise<string> {
    const storageKey = getBusinessStorageKey(baseKey, businessId);
    const fromStorage = localStorage.getItem(storageKey);
    if (fromStorage) {
        return fromStorage;
    }
    const db = await getDbData();
    const businessDbData = db?.businessData?.[businessId];
    return businessDbData?.[dbKey] || defaultValue;
}

async function saveBusinessString(businessId: string, baseKey: string, data: string): Promise<void> {
    const storageKey = getBusinessStorageKey(baseKey, businessId);
    localStorage.setItem(storageKey, data);
}


// --- Session Storage Functions ---

export function getCurrentUserIdFromSessionStorage(): string | null {
    return sessionStorage.getItem(config.CURRENT_USER_ID_SESSION_KEY);
}

export function saveCurrentUserIdToSessionStorage(userId: string | null): void {
    if (userId) {
        sessionStorage.setItem(config.CURRENT_USER_ID_SESSION_KEY, userId);
    } else {
        sessionStorage.removeItem(config.CURRENT_USER_ID_SESSION_KEY);
    }
}

export function getCurrentManagingBusinessIdFromSessionStorage(): string | null {
    return sessionStorage.getItem(config.CURRENT_MANAGING_BUSINESS_ID_SESSION_KEY);
}

export function saveCurrentManagingBusinessIdToSessionStorage(businessId: string | null): void {
    if (businessId) {
        sessionStorage.setItem(config.CURRENT_MANAGING_BUSINESS_ID_SESSION_KEY, businessId);
    } else {
        sessionStorage.removeItem(config.CURRENT_MANAGING_BUSINESS_ID_SESSION_KEY);
    }
}

// --- Super Admin Data Functions ---

export async function getSuperAdminPasswordHash(): Promise<string | null> {
    const fromStorage = localStorage.getItem(config.SUPER_ADMIN_PASSWORD_STORAGE_KEY);
    if (fromStorage) {
        return fromStorage;
    }
    const db = await getDbData();
    return db?.superAdminPasswordHash || simpleHash('admin');
}

export async function saveSuperAdminPasswordHash(hash: string): Promise<void> {
    localStorage.setItem(config.SUPER_ADMIN_PASSWORD_STORAGE_KEY, hash);
}

export async function getSuperAdminAppSettings(): Promise<SuperAdminAppSettings | null> {
    const fromStorage = localStorage.getItem(config.SUPER_ADMIN_APP_SETTINGS_STORAGE_KEY);
    if (fromStorage) {
        return JSON.parse(fromStorage);
    }
    const db = await getDbData();
    return db?.superAdminAppSettings || {};
}

export async function saveSuperAdminAppSettings(settings: SuperAdminAppSettings): Promise<void> {
    localStorage.setItem(config.SUPER_ADMIN_APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export async function getSubscriptionPackages(): Promise<SubscriptionPackage[]> {
    const fromStorage = localStorage.getItem(config.SUPER_ADMIN_SUBSCRIPTION_PACKAGES_KEY);
    if (fromStorage) {
        return JSON.parse(fromStorage);
    }
    const db = await getDbData();
    return db?.subscriptionPackages || [];
}

export async function saveSubscriptionPackages(packages: SubscriptionPackage[]): Promise<void> {
    localStorage.setItem(config.SUPER_ADMIN_SUBSCRIPTION_PACKAGES_KEY, JSON.stringify(packages));
}

export async function getAllBusinesses(): Promise<Business[]> {
    const fromStorage = localStorage.getItem(config.ALL_BUSINESSES_STORAGE_KEY);
    if (fromStorage) {
        return JSON.parse(fromStorage);
    }
    const db = await getDbData();
    return db?.businesses || [];
}

export async function saveAllBusinesses(businesses: Business[]): Promise<void> {
    localStorage.setItem(config.ALL_BUSINESSES_STORAGE_KEY, JSON.stringify(businesses));
}

export async function getManagerMenuConfig(): Promise<MenuCategoryConfig[]> {
    const fromStorage = localStorage.getItem(config.MANAGER_MENU_CONFIG_STORAGE_KEY);
    if (fromStorage) {
        return JSON.parse(fromStorage);
    }
    const db = await getDbData();
    return db?.managerMenuConfig || [];
}

export async function saveManagerMenuConfig(menuConfig: MenuCategoryConfig[]): Promise<void> {
    localStorage.setItem(config.MANAGER_MENU_CONFIG_STORAGE_KEY, JSON.stringify(menuConfig));
}

// --- Privileges (Global) ---
export async function getPrivileges(): Promise<Privilege[]> {
    const db = await getDbData();
    return db?.privileges || []; // Privileges are typically not stored in localStorage but defined in db.json
}

// --- Per-Business Data Functions ---

// Users
export async function getUsers(businessId: string): Promise<User[]> {
    return getBusinessData<User>(businessId, config.BASE_USERS_STORAGE_KEY, 'users');
}
export async function saveUsers(businessId: string, users: User[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_USERS_STORAGE_KEY, users);
}

// Groups
export async function getGroups(businessId: string): Promise<Group[]> {
    return getBusinessData<Group>(businessId, config.BASE_GROUPS_STORAGE_KEY, 'groups');
}
export async function saveGroups(businessId: string, groups: Group[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_GROUPS_STORAGE_KEY, groups);
}

// Group Privileges
export async function getGroupPrivileges(businessId: string): Promise<GroupPrivilege[]> {
    return getBusinessData<GroupPrivilege>(businessId, config.BASE_GROUP_PRIVILEGES_STORAGE_KEY, 'groupPrivileges');
}
export async function saveGroupPrivileges(businessId: string, groupPrivileges: GroupPrivilege[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_GROUP_PRIVILEGES_STORAGE_KEY, groupPrivileges);
}

// Products
export async function getProducts(businessId: string): Promise<Product[]> {
    return getBusinessData<Product>(businessId, config.BASE_PRODUCTS_STORAGE_KEY, 'products');
}
export async function saveProducts(businessId: string, products: Product[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_PRODUCTS_STORAGE_KEY, products);
}

// Categories
export async function getCategories(businessId: string): Promise<Category[]> {
    return getBusinessData<Category>(businessId, config.BASE_CATEGORIES_STORAGE_KEY, 'categories');
}
export async function saveCategories(businessId: string, categories: Category[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_CATEGORIES_STORAGE_KEY, categories);
}

// Item Types
export async function getItemTypes(businessId: string): Promise<ItemType[]> {
    return getBusinessData<ItemType>(businessId, config.BASE_ITEM_TYPES_STORAGE_KEY, 'itemTypes');
}
export async function saveItemTypes(businessId: string, itemTypes: ItemType[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_ITEM_TYPES_STORAGE_KEY, itemTypes);
}

// Deals
export async function getDeals(businessId: string): Promise<Deal[]> {
    return getBusinessData<Deal>(businessId, config.BASE_DEALS_STORAGE_KEY, 'deals');
}
export async function saveDeals(businessId: string, deals: Deal[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_DEALS_STORAGE_KEY, deals);
}

// Customers
export async function getCustomers(businessId: string): Promise<Customer[]> {
    return getBusinessData<Customer>(businessId, config.BASE_CUSTOMERS_STORAGE_KEY, 'customers');
}
export async function saveCustomers(businessId: string, customers: Customer[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_CUSTOMERS_STORAGE_KEY, customers);
}

// Suppliers
export async function getSuppliers(businessId: string): Promise<Supplier[]> {
    return getBusinessData<Supplier>(businessId, config.BASE_SUPPLIERS_STORAGE_KEY, 'suppliers');
}
export async function saveSuppliers(businessId: string, suppliers: Supplier[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_SUPPLIERS_STORAGE_KEY, suppliers);
}

// Daily Cash Log
export async function getDailyCashLog(businessId: string): Promise<DailyCashEntry[]> {
    return getBusinessData<DailyCashEntry>(businessId, config.BASE_DAILY_CASH_LOG_KEY, 'dailyCashLog');
}
export async function saveDailyCashLog(businessId: string, log: DailyCashEntry[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_DAILY_CASH_LOG_KEY, log);
}

// Sales Log
export async function getSalesLog(businessId: string): Promise<SaleRecord[]> {
    return getBusinessData<SaleRecord>(businessId, config.BASE_SALES_LOG_STORAGE_KEY, 'salesLog');
}
export async function saveSalesLog(businessId: string, log: SaleRecord[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_SALES_LOG_STORAGE_KEY, log);
}

// Cleared Sales Log
export async function getClearedSalesLog(businessId: string): Promise<ClearedSaleLogEntry[]> {
    return getBusinessData<ClearedSaleLogEntry>(businessId, config.BASE_CLEARED_SALES_LOG_KEY, 'clearedSalesLog');
}
export async function saveClearedSalesLog(businessId: string, log: ClearedSaleLogEntry[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_CLEARED_SALES_LOG_KEY, log);
}

// Petty Cash Log
export async function getPettyCashLog(businessId: string): Promise<PettyCashEntry[]> {
    return getBusinessData<PettyCashEntry>(businessId, config.BASE_PETTY_CASH_LOG_KEY, 'pettyCashLog');
}
export async function savePettyCashLog(businessId: string, log: PettyCashEntry[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_PETTY_CASH_LOG_KEY, log);
}


// Business Details
export async function getBusinessDetails(businessId: string): Promise<BusinessDetails | null> {
    return getBusinessObject<BusinessDetails>(businessId, config.BASE_BUSINESS_DETAILS_STORAGE_KEY, 'businessDetails');
}
export async function saveBusinessDetails(businessId: string, details: BusinessDetails): Promise<void> {
    return saveBusinessObject(businessId, config.BASE_BUSINESS_DETAILS_STORAGE_KEY, details);
}

// Purchase Invoices
export async function getPurchaseInvoices(businessId: string): Promise<PurchaseInvoice[]> {
    return getBusinessData<PurchaseInvoice>(businessId, config.BASE_PURCHASE_INVOICES_STORAGE_KEY, 'purchaseInvoices');
}
export async function savePurchaseInvoices(businessId: string, invoices: PurchaseInvoice[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_PURCHASE_INVOICES_STORAGE_KEY, invoices);
}

// Return Purchase Invoices
export async function getReturnPurchaseInvoices(businessId: string): Promise<ReturnPurchaseInvoice[]> {
    return getBusinessData<ReturnPurchaseInvoice>(businessId, config.BASE_RETURN_PURCHASE_INVOICES_STORAGE_KEY, 'returnPurchaseInvoices');
}
export async function saveReturnPurchaseInvoices(businessId: string, invoices: ReturnPurchaseInvoice[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_RETURN_PURCHASE_INVOICES_STORAGE_KEY, invoices);
}

// Sales Return Invoices
export async function getSalesReturnInvoices(businessId: string): Promise<SalesReturnInvoice[]> {
    return getBusinessData<SalesReturnInvoice>(businessId, config.BASE_SALES_RETURN_INVOICES_STORAGE_KEY, 'salesReturnInvoices');
}
export async function saveSalesReturnInvoices(businessId: string, invoices: SalesReturnInvoice[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_SALES_RETURN_INVOICES_STORAGE_KEY, invoices);
}

// Outgoing Payments
export async function getOutgoingPayments(businessId: string): Promise<OutgoingPayment[]> {
    return getBusinessData<OutgoingPayment>(businessId, config.BASE_OUTGOING_PAYMENTS_STORAGE_KEY, 'outgoingPayments');
}
export async function saveOutgoingPayments(businessId: string, payments: OutgoingPayment[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_OUTGOING_PAYMENTS_STORAGE_KEY, payments);
}

// Incoming Payments
export async function getIncomingPayments(businessId: string): Promise<IncomingPayment[]> {
    return getBusinessData<IncomingPayment>(businessId, config.BASE_INCOMING_PAYMENTS_STORAGE_KEY, 'incomingPayments');
}
export async function saveIncomingPayments(businessId: string, payments: IncomingPayment[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_INCOMING_PAYMENTS_STORAGE_KEY, payments);
}

// Local Sales Invoices
export async function getLocalSalesInvoices(businessId: string): Promise<LocalSaleInvoice[]> {
    return getBusinessData<LocalSaleInvoice>(businessId, config.BASE_LOCAL_SALES_INVOICES_STORAGE_KEY, 'localSalesInvoices');
}
export async function saveLocalSalesInvoices(businessId: string, invoices: LocalSaleInvoice[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_LOCAL_SALES_INVOICES_STORAGE_KEY, invoices);
}

// Credit Notes
export async function getCreditNotes(businessId: string): Promise<CreditNote[]> {
    return getBusinessData<CreditNote>(businessId, config.BASE_CREDIT_NOTES_STORAGE_KEY, 'creditNotes');
}
export async function saveCreditNotes(businessId: string, notes: CreditNote[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_CREDIT_NOTES_STORAGE_KEY, notes);
}

// Debit Notes
export async function getDebitNotes(businessId: string): Promise<DebitNote[]> {
    return getBusinessData<DebitNote>(businessId, config.BASE_DEBIT_NOTES_STORAGE_KEY, 'debitNotes');
}
export async function saveDebitNotes(businessId: string, notes: DebitNote[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_DEBIT_NOTES_STORAGE_KEY, notes);
}

// Recipes
export async function getRecipes(businessId: string): Promise<Recipe[]> {
    return getBusinessData<Recipe>(businessId, config.BASE_RECIPES_STORAGE_KEY, 'recipes');
}
export async function saveRecipes(businessId: string, recipes: Recipe[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_RECIPES_STORAGE_KEY, recipes);
}

// Production Orders
export async function getProductionOrders(businessId: string): Promise<ProductionOrder[]> {
    return getBusinessData<ProductionOrder>(businessId, config.BASE_PRODUCTION_ORDERS_STORAGE_KEY, 'productionOrders');
}
export async function saveProductionOrders(businessId: string, orders: ProductionOrder[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_PRODUCTION_ORDERS_STORAGE_KEY, orders);
}

// Production Stages
export async function getProductionStages(businessId: string): Promise<ProductionStage[]> {
    return getBusinessData<ProductionStage>(businessId, config.BASE_PRODUCTION_STAGES_STORAGE_KEY, 'productionStages');
}
export async function saveProductionStages(businessId: string, stages: ProductionStage[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_PRODUCTION_STAGES_STORAGE_KEY, stages);
}

// Production Routings
export async function getProductionRoutings(businessId: string): Promise<ProductionRouting[]> {
    return getBusinessData<ProductionRouting>(businessId, config.BASE_PRODUCTION_ROUTINGS_STORAGE_KEY, 'productionRoutings');
}
export async function saveProductionRoutings(businessId: string, routings: ProductionRouting[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_PRODUCTION_ROUTINGS_STORAGE_KEY, routings);
}

// Clear Sale PIN
export async function getClearSalePinHash(businessId: string): Promise<string> {
    return getBusinessString(businessId, config.BASE_CLEAR_SALE_PIN_HASH_STORAGE_KEY, 'clearSalePinHash', simpleHash(config.DEFAULT_CLEAR_SALE_PIN));
}
export async function saveClearSalePinHash(businessId: string, pin: string): Promise<void> {
    return saveBusinessString(businessId, config.BASE_CLEAR_SALE_PIN_HASH_STORAGE_KEY, simpleHash(pin));
}

// HR - Employees
export async function getEmployees(businessId: string): Promise<Employee[]> {
    return getBusinessData<Employee>(businessId, config.BASE_EMPLOYEES_STORAGE_KEY, 'employees');
}
export async function saveEmployees(businessId: string, employees: Employee[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_EMPLOYEES_STORAGE_KEY, employees);
}

// HR - Time Logs
export async function getTimeLogs(businessId: string): Promise<TimeLog[]> {
    return getBusinessData<TimeLog>(businessId, config.BASE_TIME_LOGS_STORAGE_KEY, 'timeLogs');
}
export async function saveTimeLogs(businessId: string, logs: TimeLog[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_TIME_LOGS_STORAGE_KEY, logs);
}

// HR - Leave Requests
export async function getLeaveRequests(businessId: string): Promise<LeaveRequest[]> {
    return getBusinessData<LeaveRequest>(businessId, config.BASE_LEAVE_REQUESTS_STORAGE_KEY, 'leaveRequests');
}
export async function saveLeaveRequests(businessId: string, requests: LeaveRequest[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_LEAVE_REQUESTS_STORAGE_KEY, requests);
}

// HR - Overtime
export async function getOvertimeEntries(businessId: string): Promise<Overtime[]> {
    return getBusinessData<Overtime>(businessId, config.BASE_OVERTIME_ENTRIES_STORAGE_KEY, 'overtimeEntries');
}
export async function saveOvertimeEntries(businessId: string, entries: Overtime[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_OVERTIME_ENTRIES_STORAGE_KEY, entries);
}

// HR - Payroll
export async function getPayrollEntries(businessId: string): Promise<PayrollEntry[]> {
    return getBusinessData<PayrollEntry>(businessId, config.BASE_PAYROLL_ENTRIES_STORAGE_KEY, 'payrollEntries');
}
export async function savePayrollEntries(businessId: string, entries: PayrollEntry[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_PAYROLL_ENTRIES_STORAGE_KEY, entries);
}

// Accounting - Accounts
export async function getAccounts(businessId: string): Promise<Account[]> {
    return getBusinessData<Account>(businessId, config.BASE_ACCOUNTS_STORAGE_KEY, 'accounts');
}
export async function saveAccounts(businessId: string, accounts: Account[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_ACCOUNTS_STORAGE_KEY, accounts);
}

// Accounting - Journal Entries
export async function getJournalEntries(businessId: string): Promise<JournalEntry[]> {
    return getBusinessData<JournalEntry>(businessId, config.BASE_JOURNAL_ENTRIES_STORAGE_KEY, 'journalEntries');
}
export async function saveJournalEntries(businessId: string, entries: JournalEntry[]): Promise<void> {
    return saveBusinessData(businessId, config.BASE_JOURNAL_ENTRIES_STORAGE_KEY, entries);
}

// Accounting - Settings
export async function getAccountingSettings(businessId: string): Promise<AccountingSettings | null> {
    return getBusinessObject<AccountingSettings>(businessId, config.BASE_ACCOUNTING_SETTINGS_STORAGE_KEY, 'accountingSettings');
}
export async function saveAccountingSettings(businessId: string, settings: AccountingSettings): Promise<void> {
    return saveBusinessObject(businessId, config.BASE_ACCOUNTING_SETTINGS_STORAGE_KEY, settings);
}
