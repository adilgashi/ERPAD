/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JournalEntry, JournalEntryLine, SaleRecord, LocalSaleInvoice, PurchaseInvoice, OutgoingPayment, IncomingPayment, SalesReturnInvoice, ReturnPurchaseInvoice } from '../models';
import * as state from '../core/state';
import * as storage from '../core/storage';

// Hardcoded map for system accounts. A better implementation would have these configurable.
const SYSTEM_ACCOUNTS_MAP = {
    CASH: '1010', // Arka
    ACCOUNTS_RECEIVABLE: '1210', // Klientë
    INVENTORY: '3010', // Inventari
    ACCOUNTS_PAYABLE: '4010', // Furnitorë
    VAT_PAYABLE: '4470', // TVSH e mbledhur
    VAT_RECEIVABLE: '1410', // TVSH e zbritshme
    SALES_REVENUE: '6010', // Të ardhurat nga shitjet
    COGS: '7010', // Kosto e mallrave të shitura
    SALES_RETURNS: '6011', // Kthimet e shitjeve (llogari kunder te ardhurave)
    PURCHASE_RETURNS: '3011', // Kthimet e blerjeve (llogari kunder inventarit)
};

function findAccountIdByNumber(accountNumber: string): string | null {
    const account = state.accounts.find(acc => acc.accountNumber === accountNumber);
    if (!account) {
        console.warn(`System account with number ${accountNumber} not found in Chart of Accounts.`);
    }
    return account ? account.id : null;
}

async function createAndSaveJournalEntry(description: string, date: string, lines: JournalEntryLine[]) {
    if (!state.currentManagingBusinessId || !state.currentUser) return;

    // Filter out lines with no accountId or zero values
    const validLines = lines.filter(line => line.accountId && (line.debit > 0 || line.credit > 0));

    if (validLines.length < 2) {
        console.warn(`Journal entry "${description}" skipped: not enough valid lines.`);
        return;
    }

    const debitTotal = validLines.reduce((sum, l) => sum + l.debit, 0);
    const creditTotal = validLines.reduce((sum, l) => sum + l.credit, 0);

    if (Math.abs(debitTotal - creditTotal) > 0.01) {
        console.error(`Journal entry "${description}" is not balanced. Debit: ${debitTotal}, Credit: ${creditTotal}. Entry will not be saved.`);
        return;
    }

    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId)!;

    const newEntry: JournalEntry = {
        id: `VEP-${business.fiscalYear}-${Date.now().toString().slice(-5)}`,
        businessId: state.currentManagingBusinessId,
        date,
        description,
        lines: validLines,
        recordedByManagerId: state.currentUser.id,
        recordedByManagerUsername: state.currentUser.username,
        timestamp: Date.now()
    };
    
    state.journalEntries.push(newEntry);
    await storage.saveJournalEntries(state.currentManagingBusinessId, state.journalEntries);
    console.log(`Journal entry created: ${description}`);
}

export async function createJournalEntryForSale(sale: SaleRecord | LocalSaleInvoice) {
    const isPosSale = 'sellerUsername' in sale;
    const date = isPosSale ? (sale as SaleRecord).dailyCashEntryDate : sale.invoiceDate;
    const description = `Shitje - Fatura ${isPosSale ? (sale as SaleRecord).invoiceNumber : sale.id}`;
    const totalAmountWithVAT = isPosSale ? (sale as SaleRecord).grandTotal : sale.totalAmountWithVAT;
    const totalAmountWithoutVAT = 'subtotal' in sale ? sale.subtotal : sale.totalAmountWithoutVAT;
    const totalVATAmount = totalAmountWithVAT - totalAmountWithoutVAT;
    
    const lines: JournalEntryLine[] = [];

    const debitAccountId = sale.customerId ? findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.ACCOUNTS_RECEIVABLE) : findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.CASH);
    lines.push({ accountId: debitAccountId!, debit: totalAmountWithVAT, credit: 0 });

    const revenueAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.SALES_REVENUE);
    lines.push({ accountId: revenueAccountId!, debit: 0, credit: totalAmountWithoutVAT });
    
    const vatPayableAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.VAT_PAYABLE);
    lines.push({ accountId: vatPayableAccountId!, debit: 0, credit: totalVATAmount });

    let totalCOGS = 0;
    sale.items.forEach(item => {
        const productId = 'productId' in item ? item.productId : item.id;
        const product = state.products.find(p => p.id === productId);
        if (product?.purchasePrice) {
            totalCOGS += product.purchasePrice * item.quantity;
        }
    });

    if (totalCOGS > 0) {
        const cogsAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.COGS);
        const inventoryAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.INVENTORY);
        lines.push({ accountId: cogsAccountId!, debit: totalCOGS, credit: 0 });
        lines.push({ accountId: inventoryAccountId!, debit: 0, credit: totalCOGS });
    }

    await createAndSaveJournalEntry(description, date, lines);
}

export async function createJournalEntryForPurchase(invoice: PurchaseInvoice) {
    const description = `Blerje - Fatura e Furnitorit ${invoice.supplierInvoiceNumber}`;
    const lines: JournalEntryLine[] = [];
    
    const inventoryAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.INVENTORY);
    lines.push({ accountId: inventoryAccountId!, debit: invoice.totalAmountWithoutVAT, credit: 0 });
    
    const vatReceivableAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.VAT_RECEIVABLE);
    lines.push({ accountId: vatReceivableAccountId!, debit: invoice.totalVATAmount, credit: 0 });
    
    const accountsPayableAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.ACCOUNTS_PAYABLE);
    lines.push({ accountId: accountsPayableAccountId!, debit: 0, credit: invoice.totalAmountWithVAT });
    
    await createAndSaveJournalEntry(description, invoice.invoiceDate, lines);
}

export async function createJournalEntryForOutgoingPayment(payment: OutgoingPayment) {
    const description = `Pagesë për Furnitorin ${payment.supplierName} - Ref: ${payment.reference || payment.id}`;
    const lines: JournalEntryLine[] = [];

    const accountsPayableAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.ACCOUNTS_PAYABLE);
    lines.push({ accountId: accountsPayableAccountId!, debit: payment.totalPaidAmount, credit: 0 });

    const cashAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.CASH);
    lines.push({ accountId: cashAccountId!, debit: 0, credit: payment.totalPaidAmount });
    
    await createAndSaveJournalEntry(description, payment.paymentDate, lines);
}

export async function createJournalEntryForIncomingPayment(payment: IncomingPayment) {
    const description = `Pagesë nga Klienti ${payment.customerName || 'Standard'} - Ref: ${payment.reference || payment.id}`;
    const lines: JournalEntryLine[] = [];

    const cashAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.CASH);
    lines.push({ accountId: cashAccountId!, debit: payment.totalReceivedAmount, credit: 0 });

    const accountsReceivableAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.ACCOUNTS_RECEIVABLE);
    lines.push({ accountId: accountsReceivableAccountId!, debit: 0, credit: payment.totalReceivedAmount });

    await createAndSaveJournalEntry(description, payment.paymentDate, lines);
}

export async function createJournalEntryForSalesReturn(invoice: SalesReturnInvoice) {
    const description = `Kthim Shitje - Ref. Fatura Origjinale ${invoice.originalSaleInvoiceNumber}`;
    const lines: JournalEntryLine[] = [];
    
    const salesReturnsAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.SALES_RETURNS);
    lines.push({ accountId: salesReturnsAccountId!, debit: invoice.totalReturnAmountWithoutVAT, credit: 0 });
    
    const vatPayableAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.VAT_PAYABLE);
    lines.push({ accountId: vatPayableAccountId!, debit: invoice.totalReturnVATAmount, credit: 0 });
    
    const accountsReceivableAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.ACCOUNTS_RECEIVABLE);
    lines.push({ accountId: accountsReceivableAccountId!, debit: 0, credit: invoice.totalReturnAmountWithVAT });

    let totalCOGS = 0;
    invoice.items.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (product?.purchasePrice) {
            totalCOGS += product.purchasePrice * item.quantityReturned;
        }
    });

    if (totalCOGS > 0) {
        const cogsAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.COGS);
        const inventoryAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.INVENTORY);
        lines.push({ accountId: inventoryAccountId!, debit: totalCOGS, credit: 0 });
        lines.push({ accountId: cogsAccountId!, debit: 0, credit: totalCOGS });
    }

    await createAndSaveJournalEntry(description, invoice.returnDate, lines);
}

export async function createJournalEntryForPurchaseReturn(invoice: ReturnPurchaseInvoice) {
    const description = `Kthim Blerje - Ref. Fatura Furnitorit ${invoice.supplierInvoiceNumber || invoice.id}`;
    const lines: JournalEntryLine[] = [];
    
    const totalAmountWithoutVAT = invoice.items.reduce((sum, item) => sum + (item.returnPriceWithoutVAT * item.quantity), 0);
    const totalVATAmount = invoice.totalReturnAmountWithVAT - totalAmountWithoutVAT;
    
    const accountsPayableAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.ACCOUNTS_PAYABLE);
    lines.push({ accountId: accountsPayableAccountId!, debit: invoice.totalReturnAmountWithVAT, credit: 0 });

    const purchaseReturnsAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.PURCHASE_RETURNS); // Could be Inventory directly
    lines.push({ accountId: purchaseReturnsAccountId!, debit: 0, credit: totalAmountWithoutVAT });

    const vatReceivableAccountId = findAccountIdByNumber(SYSTEM_ACCOUNTS_MAP.VAT_RECEIVABLE);
    lines.push({ accountId: vatReceivableAccountId!, debit: 0, credit: totalVATAmount });

    await createAndSaveJournalEntry(description, invoice.invoiceDate, lines);
}

export function isDateInClosedPeriod(date: string | Date): boolean {
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business || !business.lastClosedPeriodEndDate) {
        return false; // No period is closed yet
    }

    const checkDate = new Date(date);
    const lastClosedDate = new Date(business.lastClosedPeriodEndDate);

    // Normalize both dates to avoid time zone issues by comparing just the date parts.
    checkDate.setHours(0, 0, 0, 0);
    lastClosedDate.setHours(0, 0, 0, 0);

    return checkDate <= lastClosedDate;
}

export function calculatePeriodPnL(startDate: Date, endDate: Date): { totalRevenue: number, totalExpenses: number, netIncome: number } {
    let totalRevenue = 0;
    let totalExpenses = 0;

    const startTs = startDate.getTime();
    const endTs = new Date(endDate).setHours(23, 59, 59, 999);

    const revenueAccountIds = state.accounts.filter(a => a.type === 'Revenue').map(a => a.id);
    const expenseAccountIds = state.accounts.filter(a => a.type === 'Expense').map(a => a.id);

    state.journalEntries
        .filter(entry => {
            const entryDate = new Date(entry.date).getTime();
            return entryDate >= startTs && entryDate <= endTs;
        })
        .forEach(entry => {
            entry.lines.forEach(line => {
                if (revenueAccountIds.includes(line.accountId)) {
                    totalRevenue += (line.credit - line.debit);
                } else if (expenseAccountIds.includes(line.accountId)) {
                    totalExpenses += (line.debit - line.credit);
                }
            });
        });

    return { totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
}
