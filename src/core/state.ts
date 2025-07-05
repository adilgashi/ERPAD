

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, User, DailyCashEntry, SaleRecord, BusinessDetails, Business, SaleItem, DailyCashEntry as DailyCashEntryType, ClearedSaleLogEntry, Deal, Customer, Category, ItemType, SuperAdminAppSettings, Supplier, PurchaseInvoice, ReturnPurchaseInvoice, OutgoingPayment, SubscriptionPackage, MenuCategoryConfig, LocalSaleInvoice, IncomingPayment, SalesReturnInvoice, CreditNote, DebitNote, Recipe, ProductionOrder, ProductionStage, ProductionRouting, Employee, TimeLog, LeaveRequest, Overtime, PayrollEntry, Group, Privilege, GroupPrivilege, Account, JournalEntry, AccountingSettings, PettyCashEntry } from '../models'; 

// --- Application State ---
export let products: Product[] = [];
export let users: User[] = []; 
export let groups: Group[] = [];
export let privileges: Privilege[] = [];
export let groupPrivileges: GroupPrivilege[] = [];
export let employees: Employee[] = [];
export let dailyCashLog: DailyCashEntryType[] = [];
export let salesLog: SaleRecord[] = []; 
export let clearedSalesLog: ClearedSaleLogEntry[] = [];
export let pettyCashLog: PettyCashEntry[] = [];
export let businessDetails: BusinessDetails | null = null;
export let deals: Deal[] = [];
export let customers: Customer[] = [];
export let categories: Category[] = []; 
export let itemTypes: ItemType[] = [];
export let suppliers: Supplier[] = []; 
export let accounts: Account[] = [];
export let journalEntries: JournalEntry[] = [];
export let accountingSettings: AccountingSettings | null = null;
export let purchaseInvoices: PurchaseInvoice[] = []; 
export let returnPurchaseInvoices: ReturnPurchaseInvoice[] = []; 
export let outgoingPayments: OutgoingPayment[] = [];
export let incomingPayments: IncomingPayment[] = [];
export let localSalesInvoices: LocalSaleInvoice[] = [];
export let salesReturnInvoices: SalesReturnInvoice[] = []; 
export let creditNotes: CreditNote[] = []; 
export let debitNotes: DebitNote[] = [];   
export let recipes: Recipe[] = [];
export let productionOrders: ProductionOrder[] = [];
export let productionStages: ProductionStage[] = [];
export let productionRoutings: ProductionRouting[] = [];
export let timeLogs: TimeLog[] = [];
export let leaveRequests: LeaveRequest[] = [];
export let overtimeEntries: Overtime[] = [];
export let payrollEntries: PayrollEntry[] = [];
export let payrollEntries: PayrollEntry[] = [];


export let businesses: Business[] = []; 
export let currentUser: User | null = null; 
export let superAdminPasswordHash: string | null = null;
export let currentManagingBusinessId: string | null = null; 
export let superAdminAppSettings: SuperAdminAppSettings | null = null;
export let subscriptionPackages: SubscriptionPackage[] = []; 
export let managerMenuConfig: MenuCategoryConfig[] = []; 

// --- Volatile/Session State ---
export let currentSale: SaleItem[] = [];
export let currentSellerDailyCashEntry: DailyCashEntryType | null = null;
export let currentSellerTotalCashSales: number = 0;
export let currentSaleGrandTotalForPayment: number = 0; 
export let currentSaleSelectedCustomerId: string | null = null; 
export let selectedDailyEntryForReconciliation: DailyCashEntryType | null = null;
export let expectedCashForReconciliation: number = 0;
export let selectedEntryForEditing: DailyCashEntryType | null = null;
export let currentUserFormModalContext: 'manager' | 'superAdmin' = 'manager'; 
export let currentOnConfirmCallback: (() => void) | null = null;
export let itemToClearFromSale: { id: string, isDeal: boolean } | null = null;
export let preselectedAccountIdForLedger: string | null = null;

// --- State Setters ---
export function setCurrentUser(user: User | null): void { currentUser = user; }
export function setCurrentManagingBusinessId(id: string | null): void { currentManagingBusinessId = id; }
export function setSuperAdminPasswordHash(hash: string | null): void { superAdminPasswordHash = hash; }
export function setSuperAdminAppSettings(settings: SuperAdminAppSettings | null): void { superAdminAppSettings = settings; }
export function setBusinesses(newBusinesses: Business[]): void { businesses = newBusinesses; }
export function setUsers(newUsers: User[]): void { users = newUsers; }
export function setProducts(newProducts: Product[]): void { products = newProducts; }
export function setDailyCashLog(log: DailyCashEntryType[]): void { dailyCashLog = log; }
export function setSalesLog(log: SaleRecord[]): void { salesLog = log; }
export function setClearedSalesLog(log: ClearedSaleLogEntry[]): void { clearedSalesLog = log; }
export function setPettyCashLog(log: PettyCashEntry[]): void { pettyCashLog = log; }
export function setBusinessDetails(details: BusinessDetails | null): void { businessDetails = details; }
export function setDeals(newDeals: Deal[]): void { deals = newDeals; }
export function setCustomers(newCustomers: Customer[]): void { customers = newCustomers; }
export function setCategories(newCategories: Category[]): void { categories = newCategories; }
export function setItemTypes(newItemTypes: ItemType[]): void { itemTypes = newItemTypes; }
export function setSuppliers(newSuppliers: Supplier[]): void { suppliers = newSuppliers; }
export function setPurchaseInvoices(newPurchaseInvoices: PurchaseInvoice[]): void { purchaseInvoices = newPurchaseInvoices; }
export function setReturnPurchaseInvoices(newReturnPurchaseInvoices: ReturnPurchaseInvoice[]): void { returnPurchaseInvoices = newReturnPurchaseInvoices; }
export function setOutgoingPayments(newOutgoingPayments: OutgoingPayment[]): void { outgoingPayments = newOutgoingPayments; }
export function setIncomingPayments(newIncomingPayments: IncomingPayment[]): void { incomingPayments = newIncomingPayments; }
export function setLocalSalesInvoices(newLocalSalesInvoices: LocalSaleInvoice[]): void { localSalesInvoices = newLocalSalesInvoices; }
export function setSalesReturnInvoices(invoices: SalesReturnInvoice[]): void { salesReturnInvoices = invoices; }
export function setCreditNotes(notes: CreditNote[]): void { creditNotes = notes; }
export function setDebitNotes(notes: DebitNote[]): void { debitNotes = notes; }
export function setRecipes(newRecipes: Recipe[]): void { recipes = newRecipes; }
export function setProductionOrders(newOrders: ProductionOrder[]): void { productionOrders = newOrders; }
export function setProductionStages(stages: ProductionStage[]): void { productionStages = stages; }
export function setProductionRoutings(routings: ProductionRouting[]): void { productionRoutings = routings; }
export function setSubscriptionPackages(packages: SubscriptionPackage[]): void { subscriptionPackages = packages; }
export function setManagerMenuConfig(config: MenuCategoryConfig[]): void { managerMenuConfig = config; }
export function setCurrentSale(sale: SaleItem[]): void { currentSale = sale; }
export function setCurrentSellerDailyCashEntry(entry: DailyCashEntryType | null): void { currentSellerDailyCashEntry = entry; }
export function setCurrentSellerTotalCashSales(total: number): void { currentSellerTotalCashSales = total; }
export function setCurrentSaleGrandTotalForPayment(total: number): void { currentSaleGrandTotalForPayment = total; }
export function setCurrentSaleSelectedCustomerId(customerId: string | null): void { currentSaleSelectedCustomerId = customerId; }
export function setSelectedDailyEntryForReconciliation(entry: DailyCashEntryType | null): void { selectedDailyEntryForReconciliation = entry; }
export function setExpectedCashForReconciliation(amount: number): void { expectedCashForReconciliation = amount; }
export function setSelectedEntryForEditing(entry: DailyCashEntryType | null): void { selectedEntryForEditing = entry; }
export function setCurrentUserFormModalContext(context: 'manager' | 'superAdmin'): void { currentUserFormModalContext = context; }
export function setCurrentOnConfirmCallback(callback: (() => void) | null): void { currentOnConfirmCallback = callback; }
export function setItemToClearFromSale(item: { id: string, isDeal: boolean } | null): void { itemToClearFromSale = item; }
export function setGroups(newGroups: Group[]): void { groups = newGroups; }
export function setPrivileges(newPrivileges: Privilege[]): void { privileges = newPrivileges; }
export function setGroupPrivileges(newGroupPrivileges: GroupPrivilege[]): void { groupPrivileges = newGroupPrivileges; }
export function setEmployees(newEmployees: Employee[]): void { employees = newEmployees; }
export function setTimeLogs(newTimeLogs: TimeLog[]): void { timeLogs = newTimeLogs; }
export function setLeaveRequests(newLeaveRequests: LeaveRequest[]): void { leaveRequests = newLeaveRequests; }
export function setOvertimeEntries(newOvertimeEntries: Overtime[]): void { overtimeEntries = newOvertimeEntries; }
export function setPayrollEntries(newPayrollEntries: PayrollEntry[]): void { payrollEntries = newPayrollEntries; }
export function setPayrollEntries(newPayrollEntries: PayrollEntry[]): void { payrollEntries = newPayrollEntries; }
export function setAccounts(newAccounts: Account[]): void { accounts = newAccounts; }
export function setJournalEntries(newJournalEntries: JournalEntry[]): void { journalEntries = newJournalEntries; }
export function setAccountingSettings(settings: AccountingSettings | null): void { accountingSettings = settings; }
export function setPreselectedAccountIdForLedger(id: string | null): void { preselectedAccountIdForLedger = id; }