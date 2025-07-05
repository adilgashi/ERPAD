/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Super Admin & Menu Config ---
export interface SuperAdminAppSettings {
    mainAppName?: string;
    mainAppLogoUrl?: string;
    mainAppAddress?: string;
    mainAppNipt?: string;
    mainAppBankName?: string;
    mainAppBankAccountNumber?: string;
    mainAppIban?: string;
    mainAppSwift?: string;
    loginShowcaseTitlePrefix?: string;
    loginShowcaseSubtitle?: string;
}

export interface MenuItemConfig {
    id: string;
    name: string;
    icon: string;
    dataView: string;
    order: number;
}

export interface MenuCategoryConfig {
    id: string;
    name: string;
    icon: string;
    order: number;
    defaultOpen: boolean;
    items: MenuItemConfig[];
}

// --- New Interfaces for Groups & Privileges ---
export interface Group {
    id: string;
    businessId: string;
    name: string;
    description?: string;
}

export interface Privilege {
    id: string; // e.g., 'products.create'
    name: string; // e.g., 'Create Products'
    category: string; // e.g., 'Products'
    description?: string;
}

export interface GroupPrivilege {
    groupId: string;
    privilegeId: string;
    businessId: string;
}

// --- User Roles ---
export type UserRole = 'shites' | 'menaxher' | 'kalkulant' | 'faturist' | 'financa' | 'hr';

// --- New Accounting Models ---
export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface Account {
  id: string; // e.g., 'acc-1010'
  businessId: string;
  accountNumber: string; // e.g., '1010'
  name: string; // e.g., 'Arka (Cash)'
  type: AccountType;
  description?: string;
  isSystemAccount?: boolean; // To protect core accounts from deletion/modification
  balance: number; // Current balance of the account
}

export interface JournalEntryLine {
    accountId: string;
    description?: string;
    debit: number;
    credit: number;
}

export interface JournalEntry {
    id: string;
    businessId: string;
    date: string; // YYYY-MM-DD
    description: string;
    lines: JournalEntryLine[];
    recordedByManagerId: string;
    recordedByManagerUsername: string;
    timestamp: number;
}

export interface AccountingSettings {
    businessId?: string; // To link settings to a business
    defaultCashAccountId?: string;
    defaultBankAccountId?: string;
    defaultAccountsReceivableId?: string;
    defaultAccountsPayableId?: string;
    defaultSalesRevenueId?: string;
    defaultInventoryId?: string;
    defaultVatPayableId?: string;
    defaultVatReceivableId?: string;
    defaultCogsId?: string;
    defaultSalesReturnsId?: string;
    defaultPurchaseReturnsId?: string;
    defaultPayrollExpenseId?: string;
    defaultPayrollLiabilitiesId?: string;
}


// --- Existing Interfaces ---
export interface Category {
    id: string;
    businessId: string;
    name: string;
}

export interface ItemType { // New Interface
    id: string;
    businessId: string;
    name: string;
    description?: string;
}

export interface Product {
    id: string;
    code: string; 
    name: string;
    price: number; // Selling price
    stock: number;
    categoryId?: string; 
    itemTypeId?: string; 
    unitOfMeasure: string; 
    quantityPerPackage?: number; 
    barcode?: string;            // New: Barcode for the product
    isActive: boolean;           // New: Is the product active for sale?
    vatRate: number;             // New: VAT rate for the product (e.g., 18 for 18%)
    description?: string;        // New: Longer description for the product
    purchasePrice?: number;      // New: Cost price of the product
    minimumStockLevel?: number;  // New: Minimum stock level for alerts
    primarySupplierId?: string;  // New: ID of the primary supplier
    imageUrl?: string;           // New: URL or Data URL for the product image
    recipeId?: string;           // New: ID of the recipe if this is a final product
}

export interface DealItem {
    productId: string;
    quantity: number;
}

export interface Deal {
    id: string;
    name: string;
    price: number; 
    items: DealItem[]; // MODIFIED: Changed from itemIds: string[] to reflect new DealItem structure
    isActive: boolean;
    description?: string;
}

export interface Customer {
    id: string;
    businessId: string;
    code: string; 
    name: string;
    uniqueId?: string; 
    phone?: string;    
    email?: string;    
    address?: string;  
    notes?: string;    
    openingBalance?: number; 
}

export interface Supplier {
    id: string;
    businessId: string;
    code: string; 
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    nipt?: string;
    openingBalance?: number; 
}

export interface Document {
    id: string;
    fileName: string;
    fileType: string;
    fileDataUrl: string; 
    uploadedAt: number;
}

export interface PositionHistoryEntry {
    position: string;
    department: string;
    startDate: string; 
    endDate: string | null; 
}

export interface Employee {
    id: string;
    businessId: string;
    firstName: string;
    lastName: string;
    personalIdNumber: string;
    dateOfBirth: string; // YYYY-MM-DD
    gender: 'Mashkull' | 'Femer';
    address: string;
    city: string;
    phone: string;
    email: string;
    position: string;
    department: string;
    dateOfHire: string; // YYYY-MM-DD
    contractType: 'I plotë' | 'I pjesshëm' | 'Praktikant';
    salary: number; // Represents the base gross salary
    recurringAdditions?: { description: string, amount: number }[];
    recurringDeductions?: { description: string, amount: number }[];
    status: 'Aktiv' | 'Joaktiv' | 'Me leje';
    userId?: string;
    documents: Document[];
    positionHistory: PositionHistoryEntry[];
    schedule?: { [day: string]: string; }; // e.g., { monday: "09:00-17:00", ... }
}

export interface PayrollEntry {
    id: string;
    businessId: string;
    employeeId: string;
    employeeName: string;
    periodMonth: number;
    periodYear: number;
    baseSalary: number;
    additions: { description: string, amount: number }[];
    deductions: { description: string, amount: number }[];
    grossSalary: number;
    totalDeductions: number;
    netSalary: number; // Simplified: Gross - Deductions
    notes?: string;
    runAt: number;
    status: 'Draft' | 'Finalized';
}
export interface PayrollEntry {
    id: string;
    businessId: string;
    employeeId: string;
    employeeName: string;
    periodMonth: number;
    periodYear: number;
    baseSalary: number;
    additions: { description: string, amount: number }[];
    deductions: { description: string, amount: number }[];
    grossSalary: number;
    totalDeductions: number;
    netSalary: number; // Simplified: Gross - Deductions
    notes?: string;
    runAt: number;
    status: 'Draft' | 'Finalized';
}


export interface TimeLog {
    id: string;
    businessId: string;
    employeeId: string;
    employeeName: string;
    type: 'in' | 'out';
    timestamp: number;
    method: 'manual' | 'qr';
    notes?: string;
}

export interface LeaveRequest {
    id: string;
    businessId: string;
    employeeId: string;
    employeeName: string;
    leaveType: 'Vjetor' | 'Mjekësor' | 'Pa Pagesë' | 'Tjetër';
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    reason?: string;
    status: 'Në Pritje' | 'Miratuar' | 'Refuzuar';
    requestedAt: number;
}

export interface Overtime {
    id: string;
    businessId: string;
    employeeId: string;
    employeeName: string;
    date: string; // YYYY-MM-DD
    hours: number;
    reason: string;
    status: 'E Miratuar' | 'E Paguar';
    recordedAt: number;
}


export interface SaleItem {
    id: string; 
    name: string;
    price: number; 
    quantity: number;
    stock?: number; 
    isDeal?: boolean; 
    dealItems?: DealItem[]; // MODIFIED: Changed from dealItemIds: string[] to reflect new DealItem structure
    categoryId?: string; 
    categoryName?: string; 
}

export interface User {
    id: string;
    username: string;
    passwordHash: string;
    role: UserRole;
    businessId?: string;
    isSuperAdmin?: boolean;
    groupId?: string; 
}

export interface ReconciliationInfo {
    reconciledByManagerId: string;
    reconciledByManagerUsername: string;
    actualCashCounted: number;
    difference: number;
    reconciliationTimestamp: number;
}

export interface DailyCashEntry {
    date: string;
    initialCash: number;
    productStockUpdates: { productId: string, name: string, oldStock: number, newStock: number }[];
    openedByManagerId: string;
    openedByManagerUsername: string;
    sellerId: string;
    sellerUsername: string;
    timestamp: number;
    isReconciled: boolean;
    reconciliationInfo?: ReconciliationInfo;
    shift: 'paradite' | 'masdite';
    businessId: string; 
}

export interface SaleRecord {
    invoiceNumber: string;
    businessId: string;
    sellerId: string;
    sellerUsername: string;
    items: SaleItem[]; 
    subtotal: number;
    grandTotal: number;
    paymentMethod: 'cash';
    timestamp: number;
    dailyCashEntryDate: string;
    shift: 'paradite' | 'masdite';
    amountReceived?: number;
    changeGiven?: number;
    customerId?: string; 
    customerName?: string; 
}

export interface ClearedSaleLogEntry {
    id: string;
    businessId: string;
    sellerId: string;
    sellerUsername: string;
    items: SaleItem[];
    totalClearedAmount: number;
    clearedAt: number;
    originalSaleDailyCashEntryDate: string;
    originalSaleShift: 'paradite' | 'masdite';
}

export interface PettyCashEntry {
    id: string;
    businessId: string;
    sellerId: string;
    sellerUsername: string;
    dailyCashEntryDate: string;
    shift: 'paradite' | 'masdite';
    description: string;
    amount: number;
    timestamp: number;
}

export interface BusinessDetails {
    name: string;
    address: string;
    nipt: string;
    logoUrl?: string;
}

export interface SubscriptionPackage {
    id: string;
    name: string;
    price: number;
    durationYears: number;
    features: string[];
    allowedViews?: string[]; 
    grantsAllAccess?: boolean; 
}

export interface Business {
    id: string;
    name: string;
    logoUrl?: string;
    isActive: boolean;
    subscriptionPackageId?: string;
    subscriptionActivationCode?: string;
    subscriptionEndDate?: number; 
    futureSubscriptionActivationCode?: string;
    futureSubscriptionPackageId?: string;
    futureSubscriptionGeneratedAt?: number; 
    upgradeRequest?: { packageId: string; requestedAt: number; };
    fiscalYear: number;
    lastClosedPeriodEndDate?: string;
    // Seeds
    invoiceIdSeed: number;
    purchaseInvoiceIdSeed: number; 
    returnPurchaseInvoiceIdSeed: number;
    outgoingPaymentIdSeed: number;
    incomingPaymentIdSeed: number;
    localSaleInvoiceIdSeed: number;
    salesReturnInvoiceIdSeed: number;
    creditNoteIdSeed: number;
    debitNoteIdSeed: number;
    productionOrderIdSeed: number;
    payrollEntryIdSeed: number;
    // Defaults
    defaultCustomerId?: string; 
}

// --- Purchase & Sales Related Interfaces ---
export interface PurchaseInvoiceItem {
    productId: string;
    productCode: string;
    productName: string;
    productUnitOfMeasure: string;
    productQuantityPerPackage?: number;
    quantity: number;
    purchasePriceWithoutVAT: number;
    vatRate: number;
    purchasePriceWithVAT: number;
    totalValueWithoutVAT: number;
    totalValueWithVAT: number;
    currentStock: number;
}

export interface PurchaseInvoice {
    id: string;
    businessId: string;
    supplierId: string;
    supplierName: string;
    supplierInvoiceNumber: string;
    invoiceDate: string; // YYYY-MM-DD
    receiptDate: string; // YYYY-MM-DD
    items: PurchaseInvoiceItem[];
    totalAmountWithoutVAT: number;
    totalVATAmount: number;
    totalAmountWithVAT: number;
    recordedByManagerId: string;
    recordedByManagerUsername: string;
    timestamp: number;
    amountPaid: number;
}

export interface ReturnPurchaseInvoiceItem {
    productId: string;
    productCode: string;
    productName: string;
    quantity: number;
    returnPriceWithoutVAT: number;
    vatRate: number;
}

export interface ReturnPurchaseInvoice {
    id: string;
    businessId: string;
    supplierId: string;
    supplierName: string;
    supplierInvoiceNumber?: string;
    invoiceDate: string; // YYYY-MM-DD
    items: ReturnPurchaseInvoiceItem[];
    totalReturnAmountWithVAT: number;
    recordedByManagerId: string;
    recordedByManagerUsername: string;
    timestamp: number;
}

export interface LocalSaleInvoiceItem {
    productId: string;
    productCode: string;
    productName: string;
    productUnitOfMeasure: string;
    productQuantityPerPackage?: number;
    quantity: number;
    priceWithoutVAT: number;
    vatRate: number;
    priceWithVAT: number;
    totalValueWithoutVAT: number;
    totalValueWithVAT: number;
}

export interface LocalSaleInvoice {
    id: string;
    businessId: string;
    customerId?: string;
    customerName?: string;
    invoiceDate: string; // YYYY-MM-DD
    items: LocalSaleInvoiceItem[];
    totalAmountWithoutVAT: number;
    totalVATAmount: number;
    totalAmountWithVAT: number;
    amountPaid: number;
    recordedByManagerId: string;
    recordedByManagerUsername: string;
    timestamp: number;
}

export interface SalesReturnInvoiceItem {
    productId: string;
    productCode: string;
    productName: string;
    productUnitOfMeasure: string;
    productQuantityPerPackage?: number;
    quantityReturned: number;
    returnPriceWithoutVAT: number;
    vatRate: number;
    returnPriceWithVAT: number;
    totalValueWithoutVAT: number;
    totalValueWithVAT: number;
}

export interface SalesReturnInvoice {
    id: string;
    businessId: string;
    originalSaleInvoiceNumber: string;
    customerId?: string;
    customerName?: string;
    returnDate: string; // YYYY-MM-DD
    reason?: string;
    items: SalesReturnInvoiceItem[];
    totalReturnAmountWithoutVAT: number;
    totalReturnVATAmount: number;
    totalReturnAmountWithVAT: number;
    recordedByManagerId: string;
    recordedByManagerUsername: string;
    timestamp: number;
}

// --- Payment & Credit/Debit Notes ---

export interface OutgoingPaymentAllocation {
    purchaseInvoiceId: string;
    allocatedAmount: number;
}

export interface OutgoingPayment {
    id: string;
    businessId: string;
    supplierId: string;
    supplierName: string;
    paymentDate: string; // YYYY-MM-DD
    totalPaidAmount: number;
    paymentMethod: 'Cash' | 'Transfertë Bankare';
    reference?: string;
    notes?: string;
    allocations: OutgoingPaymentAllocation[];
    recordedByManagerId: string;
    recordedByManagerUsername: string;
    timestamp: number;
}

export interface IncomingPayment {
    id: string;
    businessId: string;
    customerId?: string;
    customerName?: string;
    paymentDate: string; // YYYY-MM-DD
    totalReceivedAmount: number;
    paymentMethod: 'Cash' | 'Transfertë Bankare';
    reference?: string;
    notes?: string;
    recordedByManagerId: string;
    recordedByManagerUsername: string;
    timestamp: number;
}

export interface CreditNoteItem {
    productId: string;
    quantity: number;
    price: number;
}

export interface CreditNote {
    id: string;
    businessId: string;
    customerId?: string;
    customerName?: string;
    date: string; // YYYY-MM-DD
    items: CreditNoteItem[];
    totalAmount: number;
    reason?: string;
    linkedInvoiceId?: string;
    recordedByManagerId: string;
    recordedByManagerUsername: string;
    timestamp: number;
}

export interface DebitNoteItem {
    productId: string;
    quantity: number;
    price: number;
}

export interface DebitNote {
    id: string;
    businessId: string;
    supplierId: string;
    supplierName: string;
    date: string; // YYYY-MM-DD
    items: DebitNoteItem[];
    totalAmount: number;
    reason?: string;
    linkedInvoiceId?: string;
    recordedByManagerId: string;
    recordedByManagerUsername: string;
    timestamp: number;
}

// --- Production Related Interfaces ---

export interface RecipeIngredient {
    productId: string;
    quantity: number;
    unit: string;
}

export interface Recipe {
    id: string;
    businessId: string;
    name: string;
    finalProductId: string;
    ingredients: RecipeIngredient[];
    notes?: string;
    createdAt: number;
    updatedAt: number;
    routingId?: string;
}

export interface ProductionOrderStage {
    stageId: string;
    stageName: string;
    order: number;
    status: 'Pending' | 'In Progress' | 'Completed';
    startedAt?: number;
    completedAt?: number;
}

export interface ProductionOrder {
    id: string;
    businessId: string;
    recipeId: string;
    recipeName: string;
    finalProductId: string;
    finalProductName: string;
    quantityToProduce: number;
    lostQuantity?: number;
    orderDate: string; // YYYY-MM-DD
    dueDate?: string; // YYYY-MM-DD
    status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
    stages: ProductionOrderStage[];
    createdByUserId: string;
    createdByUsername: string;
    createdAt: number;
    completedAt?: number;
}

export interface ProductionStage {
    id: string;
    businessId: string;
    name: string;
    description?: string;
}

export interface ProductionRoutingStage {
    stageId: string;
    order: number;
}

export interface ProductionRouting {
    id: string;
    businessId: string;
    name: string;
    stages: ProductionRoutingStage[];
}

export interface StockAdjustment {
    id: string;
    businessId: string;
    productId: string;
    productName: string;
    productCode: string;
    oldQuantity: number;
    newQuantity: number;
    adjustmentType: 'Inventarizim Fizik' | 'Dëmtim' | 'Skadencë' | 'Hyrje Manuale' | 'Dalje Manuale' | 'Tjetër';
    notes: string;
    recordedByUserId: string;
    recordedByUsername: string;
    timestamp: number;
}

// --- Enums ---
export enum ReportTypeEnum {
    // Sales Reports
    TodaysSales = 'todaysSales',
    DetailedDailySales = 'detailedDailySales',
    MonthlySales = 'monthlySales',
    GeneralSales = 'generalSales',
    SalesByProduct = 'salesByProduct',
    SalesByCategory = 'salesByCategory',
    SalesByCustomer = 'salesByCustomer',
    SalesBySeller = 'salesBySeller',
    TopSellingProducts = 'topSellingProducts',
    MonthlySalesComparison = 'monthlySalesComparison',
    SalesSummary = 'salesSummary',

    // Purchases Reports
    LocalPurchasesDetailed = 'localPurchasesDetailed',
    PurchasesBySupplier = 'purchasesBySupplier',
    PurchasesByProduct = 'purchasesByProduct',

    // Returns Reports
    ReturnPurchasesReport = 'returnPurchasesReport',
    SalesReturnsReport = 'salesReturnsReport',

    // Inventory Reports
    InventoryStatus = 'inventoryStatus',
    ItemLedger = 'itemLedger',

    // Production Reports
    RecipeListReport = 'recipeListReport',
    ProductionOrdersReport = 'productionOrdersReport',
    DetailedProductionReport = 'detailedProductionReport',
    
    // Financial & Cash Reports
    ReconciliationReport = 'reconciliationReport',
    CashFlowStatement = 'cashFlowStatement',
    ProfitAndLoss = 'profitAndLoss',
    
    
    // Ledgers
    CustomerLedger = 'customerLedger',
    SupplierLedger = 'supplierLedger',
    AccountLedger = 'accountLedger',

    // Notes Reports
    CreditNotesReport = 'creditNotesReport',
    DebitNotesReport = 'debitNotesReport',
    
    // Accounting Reports
    TrialBalance = 'trialBalance',
    VatReport = 'vatReport',
    BalanceSheet = 'balanceSheet',

    // Logs
    ClearedSalesLog = 'clearedSalesLog',
}