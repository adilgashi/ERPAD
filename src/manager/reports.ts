/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as toast from '../core/toast';
import { getTodayDateString } from '../core/utils';
import { SaleRecord, PurchaseInvoice, BusinessDetails, LocalSaleInvoice, Account, JournalEntry, ReportTypeEnum, SalesReturnInvoice, CreditNote, DebitNote, Recipe, ProductionOrder, ReturnPurchaseInvoice, OutgoingPayment, ClearedSaleLogEntry, SaleItem, Customer } from '../models'; 
import { generateReportHeaderHTML, generateReportFooterHTML, reportCategories, openPrintPreviewModal } from '../core/ui';

export type ReportType = `${ReportTypeEnum}`;
export type SetActiveManagerViewCallback = (viewName: string, title?: string, reportTypeContext?: ReportType) => void;

export interface ReportFilterConfig {
    id: string;
    label: string;
    type: 'DATE_RANGE' | 'SINGLE_DATE' | 'MONTH_YEAR' | 'MONTH_YEAR_COMPARISON' | 'SELECT';
    optionsSource?: 'sellers' | 'shifts' | 'months' | 'years' | 'customers' | 'categories' | 'products' | 'suppliers';
    defaultValue?: any;
    renderFunction: (id: string, label: string, defaultValue?: any, options?: { value: string, text: string }[]) => string;
}

// --- Filter Rendering Helper Functions ---
function renderSingleDateFilter(id: string, label: string, defaultValue?: string): string {
    const today = getTodayDateString();
    return `
        <div class="form-group filter-group">
            <label for="${id}">${label}</label>
            <input type="date" id="${id}" value="${defaultValue || today}" class="form-control">
        </div>
    `;
}

function renderDateRangeFilter(id: string, label: string): string {
    const today = getTodayDateString();
    return `
        <div class="form-group filter-group">
            <label for="${id}-start">${label} (Nga):</label>
            <input type="date" id="${id}-start" value="${today}" class="form-control">
        </div>
        <div class="form-group filter-group">
            <label for="${id}-end">${label} (Deri):</label>
            <input type="date" id="${id}-end" value="${today}" class="form-control">
        </div>
    `;
}

function renderMonthYearFilter(id: string, label: string): string {
    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
    return `
        <div class="form-group filter-group">
            <label for="${id}">${label}</label>
            <input type="month" id="${id}" value="${currentYear}-${currentMonth}" class="form-control">
        </div>
    `;
}

function renderMonthAndTwoYearsFilter(id: string, label: string): string {
    const currentYear = new Date().getFullYear();
    const currentMonth = (new Date().getMonth() + 1);
    
    let monthOptions = '';
    for(let i=1; i<=12; i++) {
        const monthName = new Date(currentYear, i-1, 1).toLocaleString('sq-AL', { month: 'long' });
        monthOptions += `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${monthName}</option>`;
    }

    return `
        <div class="form-group filter-group">
            <label for="${id}-month">Zgjidh Muajin:</label>
            <select id="${id}-month" class="form-control">${monthOptions}</select>
        </div>
        <div class="form-group filter-group">
            <label for="${id}-year1">Viti 1:</label>
            <input type="number" id="${id}-year1" value="${currentYear}" class="form-control" placeholder="YYYY">
        </div>
        <div class="form-group filter-group">
            <label for="${id}-year2">Viti 2 (për krahasim):</label>
            <input type="number" id="${id}-year2" value="${currentYear - 1}" class="form-control" placeholder="YYYY">
        </div>
    `;
}


export const reportConfigsData: Record<string, { title: string, categoryViewName: string, filters?: ReportFilterConfig[] }> = {
    // Sales Reports
    [ReportTypeEnum.TodaysSales]: { title: "Shitjet e Sotme", categoryViewName: 'sales_reports' },
    [ReportTypeEnum.DetailedDailySales]: { title: "Shitjet Ditore të Detajuara", categoryViewName: 'sales_reports', filters: [{ id: 'detailed_daily_sales_date', label: 'Zgjidh Datën:', type: 'SINGLE_DATE', renderFunction: (id, label) => renderSingleDateFilter(id, label) }] },
    [ReportTypeEnum.GeneralSales]: { title: "Shitjet e Përgjithshme", categoryViewName: 'sales_reports', filters: [{ id: 'general_sales_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.SalesByProduct]: { title: "Shitjet sipas Produkteve", categoryViewName: 'sales_reports', filters: [{ id: 'sales_by_product_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.SalesByCategory]: { title: "Shitjet sipas Kategorive", categoryViewName: 'sales_reports', filters: [{ id: 'sales_by_category_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.SalesByCustomer]: { title: "Shitjet sipas Blerësve", categoryViewName: 'sales_reports', filters: [{ id: 'sales_by_customer_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.SalesBySeller]: { title: "Shitjet sipas Shitësve", categoryViewName: 'sales_reports', filters: [{ id: 'sales_by_seller_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.TopSellingProducts]: { title: "Produktet më të Shiturat", categoryViewName: 'sales_reports', filters: [{ id: 'top_selling_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    
    // Purchases Reports
    [ReportTypeEnum.LocalPurchasesDetailed]: { title: "Blerjet Vendore të Detajuara", categoryViewName: 'purchases_reports', filters: [{ id: 'local_purchases_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.PurchasesBySupplier]: { title: "Blerjet sipas Furnitorëve", categoryViewName: 'purchases_reports', filters: [{ id: 'purchases_by_supplier_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.PurchasesByProduct]: { title: "Blerjet sipas Produkteve", categoryViewName: 'purchases_reports', filters: [{ id: 'purchases_by_product_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    
    // Production Reports
    [ReportTypeEnum.RecipeListReport]: { title: "Lista e Recetave (BOM)", categoryViewName: 'production_reports' },
    [ReportTypeEnum.ProductionOrdersReport]: { title: "Raporti i Urdhërave të Prodhimit", categoryViewName: 'production_reports', filters: [{ id: 'production_orders_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.DetailedProductionReport]: { title: "Raporti i Detajuar i Prodhimit", categoryViewName: 'production_reports', filters: [{ id: 'detailed_production_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    
    // Returns Reports
    [ReportTypeEnum.ReturnPurchasesReport]: { title: "Raporti i Kthimeve të Blerjeve", categoryViewName: 'returns_reports', filters: [{ id: 'return_purchases_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.SalesReturnsReport]: { title: "Raporti i Kthimeve të Shitjeve", categoryViewName: 'returns_reports', filters: [{ id: 'sales_returns_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    
    // Notes Reports
    [ReportTypeEnum.CreditNotesReport]: { title: "Raporti i Notave të Kreditit", categoryViewName: 'notes_reports', filters: [{ id: 'credit_notes_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.DebitNotesReport]: { title: "Raporti i Notave të Debitit", categoryViewName: 'notes_reports', filters: [{ id: 'debit_notes_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },

    // Cash & Accounting Reports
    [ReportTypeEnum.ReconciliationReport]: { title: "Raporti i Barazimit të Arkës", categoryViewName: 'cash_reports', filters: [{ id: 'reconciliation_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.CashFlowStatement]: { title: "Pasqyra e Rrjedhës së Parave", categoryViewName: 'cash_reports', filters: [{ id: 'cash_flow_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    [ReportTypeEnum.TrialBalance]: { title: "Bilanci Provë", categoryViewName: 'cash_reports', filters: [{ id: 'trial_balance_date', label: 'Data e Raportit:', type: 'SINGLE_DATE', renderFunction: (id, label) => renderSingleDateFilter(id, label) }] },
    [ReportTypeEnum.VatReport]: { title: "Raporti i TVSH-së", categoryViewName: 'cash_reports', filters: [{ id: 'vat_report_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },

    // Logs
    [ReportTypeEnum.ClearedSalesLog]: { title: "Regjistri i Shitjeve të Pastruara", categoryViewName: 'logs', filters: [{ id: 'cleared_sales_date_range', label: 'Periudha', type: 'DATE_RANGE', renderFunction: (id, label) => renderDateRangeFilter(id, label) }] },
    
    // Reports with new filters
    [ReportTypeEnum.MonthlySales]: { 
        title: "Shitjet Mujore", 
        categoryViewName: 'sales_reports', 
        filters: [{ id: 'monthly_sales_period', label: 'Zgjidh Muajin:', type: 'MONTH_YEAR', renderFunction: (id, label) => renderMonthYearFilter(id, label) }] 
    },
    [ReportTypeEnum.MonthlySalesComparison]: { 
        title: "Krahasimi i Shitjeve Mujore", 
        categoryViewName: 'sales_reports', 
        filters: [{ id: 'monthly_comparison', label: 'Periudha Krahasuese', type: 'MONTH_YEAR_COMPARISON', renderFunction: (id, label) => renderMonthAndTwoYearsFilter(id, label) }] 
    },

    // Default fallbacks for reports without explicit entries above
    [ReportTypeEnum.SalesSummary]: { title: "Përmbledhje Shitjesh", categoryViewName: 'sales_reports' },
    [ReportTypeEnum.InventoryStatus]: { title: "Statusi i Inventarit", categoryViewName: 'purchases_reports' },
    [ReportTypeEnum.ItemLedger]: { title: "Kartela e Artikullit", categoryViewName: 'purchases_reports' },
    [ReportTypeEnum.CustomerLedger]: { title: "Kartela e Blerësit", categoryViewName: 'sales_reports' },
    [ReportTypeEnum.SupplierLedger]: { title: "Kartela e Furnitorit", categoryViewName: 'purchases_reports' },
    [ReportTypeEnum.AccountLedger]: { title: "Kartela e Llogarisë", categoryViewName: 'cash_reports' },
    [ReportTypeEnum.ProfitAndLoss]: { title: "Pasqyra e A/SH (P&L)", categoryViewName: 'cash_reports' },
    [ReportTypeEnum.BalanceSheet]: { title: "Bilanci", categoryViewName: 'cash_reports' }
};


export function getReportConfig(reportType: ReportType) {
    return reportConfigsData[reportType];
}

export function initReportEventListeners() {
    // This function is called once. Event listeners for reports are added dynamically.
}

export function setupReportViewStructure(reportType: ReportType, targetContainer: HTMLElement, setActiveCb: SetActiveManagerViewCallback) {
    const reportConfig = getReportConfig(reportType);
    if (!reportConfig) {
        targetContainer.innerHTML = `<p class="error-message">Konfigurimi për raportin '${reportType}' nuk u gjet.</p>`;
        return;
    }
    
    const templateContainer = dom.managerReportViewTemplate;
    if (!templateContainer) {
        targetContainer.innerHTML = `<p class="error-message">Struktura bazë e raportit (template) nuk u gjet.</p>`;
        return;
    }

    targetContainer.innerHTML = templateContainer.innerHTML;

    const titleElement = targetContainer.querySelector<HTMLHeadingElement>('.section-title');
    const filtersArea = targetContainer.querySelector<HTMLDivElement>('.report-filters-dynamic');
    const contentArea = targetContainer.querySelector<HTMLDivElement>('.report-content');
    const exportPdfBtn = targetContainer.querySelector<HTMLButtonElement>('.export-pdf-btn');
    const printBtn = targetContainer.querySelector<HTMLButtonElement>('.print-report-btn');
    const backBtn = targetContainer.querySelector<HTMLButtonElement>('.back-to-reports-btn, .back-to-reports-list-btn');

    if (titleElement) titleElement.textContent = reportConfig.title;
    if (filtersArea && contentArea) {
        filtersArea.innerHTML = '';
        if (reportConfig.filters && reportConfig.filters.length > 0) {
            reportConfig.filters.forEach(filter => {
                filtersArea.innerHTML += filter.renderFunction(filter.id, filter.label, filter.defaultValue);
            });
            const generateBtn = document.createElement('button');
            generateBtn.id = `dynamic-report-generate-btn-active`; // Single active ID is fine
            generateBtn.className = 'btn btn-primary';
            generateBtn.textContent = 'Gjenero Raportin';
            filtersArea.appendChild(generateBtn);
            generateBtn.addEventListener('click', () => {
                generateAndDisplayReport(reportType, filtersArea, contentArea);
            });
        } else {
            filtersArea.style.display = 'none';
            generateAndDisplayReport(reportType, null, contentArea);
        }
    }

    backBtn?.addEventListener('click', () => setActiveCb(reportConfig.categoryViewName, undefined, undefined));
    
    const handleExport = (format: 'pdf' | 'print') => {
        if (!contentArea) return;
        const contentToPrint = contentArea.querySelector('.printable-area');
        if (!contentToPrint || contentToPrint.innerHTML.includes("Nuk ka të dhëna")) {
            alert("Nuk ka të dhëna për të eksportuar/printuar.");
            return;
        }
        if (dom.printPreviewContent && dom.printPreviewModalTitle) {
            dom.printPreviewContent.innerHTML = contentToPrint.innerHTML;
            dom.printPreviewModalTitle.textContent = `${format === 'pdf' ? 'Pamje PDF' : 'Shtyp'}: ${reportConfig.title}`;
            openPrintPreviewModal();
            if (format === 'pdf') {
                alert("Për të ruajtur si PDF, zgjidhni 'Ruaj si PDF' ose 'Save as PDF' nga dialogu i printimit.");
            }
        }
    };

    exportPdfBtn?.addEventListener('click', () => handleExport('pdf'));
    printBtn?.addEventListener('click', () => handleExport('print'));
}

export function renderReportCategoryTiles(
    categoryViewName: string,
    targetContainer: HTMLElement | undefined,
    setActiveCb: SetActiveManagerViewCallback
) {
    if (!targetContainer) return;

    const categoryConfig = reportCategories.find(cat => cat.id === categoryViewName);
    if (!categoryConfig) {
        targetContainer.innerHTML = `<p class="error-message">Kategoria e raportit '${categoryViewName}' nuk u gjet.</p>`;
        return;
    }
    
    const tilesGrid = document.createElement('div');
    tilesGrid.className = 'report-category-tiles-grid';
    
    categoryConfig.reports.forEach(reportInfo => {
        const reportConfig = getReportConfig(reportInfo.type as ReportType);
        if (!reportConfig) return;

        const tile = document.createElement('div');
        tile.className = 'report-action-button';
        tile.dataset.reportType = reportInfo.type;
        tile.dataset.reportTitle = reportConfig.title;
        tile.setAttribute('role', 'button');
        tile.tabIndex = 0;
        tile.setAttribute('aria-label', `Gjenero raportin ${reportConfig.title}`);
        
        tile.innerHTML = `
            <span class="report-tile-icon" aria-hidden="true">📈</span>
            <span class="report-tile-title">${reportConfig.title}</span>
        `;

        const openReport = () => setActiveCb(reportInfo.type, reportConfig.title, reportInfo.type as ReportType);
        
        tile.addEventListener('click', openReport);
        tile.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openReport();
            }
        });
        tilesGrid.appendChild(tile);
    });

    targetContainer.innerHTML = ''; // Clear previous content
    targetContainer.appendChild(tilesGrid);
}

// --- HTML Generation Functions ---

function generateTrialBalanceHTML(asOfDate: string): string {
    const reportTitle = "BILANCI PROVË";
    const headerHtml = generateReportHeaderHTML(reportTitle, `Për Datën: ${new Date(asOfDate + 'T00:00:00').toLocaleDateString('sq-AL')}`);

    const balances = new Map<string, number>();
    const reportEndDate = new Date(asOfDate + "T23:59:59").getTime();

    state.accounts.forEach(acc => balances.set(acc.id, 0));
    state.journalEntries
        .filter(entry => new Date(entry.date + "T00:00:00").getTime() <= reportEndDate)
        .forEach(entry => {
            entry.lines.forEach(line => {
                const currentBalance = balances.get(line.accountId) || 0;
                balances.set(line.accountId, currentBalance + line.debit - line.credit);
            });
        });

    let tableRowsHtml = '';
    let totalDebit = 0;
    let totalCredit = 0;

    state.accounts.sort((a,b) => a.accountNumber.localeCompare(b.accountNumber)).forEach(account => {
        const balance = balances.get(account.id) || 0;
        let debit = 0;
        let credit = 0;

        if (['Asset', 'Expense'].includes(account.type)) {
            if (balance > 0) debit = balance;
            else credit = -balance;
        } else { // Liability, Equity, Revenue
            if (balance < 0) debit = -balance;
            else credit = balance;
        }
        
        if (debit > 0.001 || credit > 0.001) {
            tableRowsHtml += `
                <tr>
                    <td>${account.accountNumber}</td>
                    <td>${account.name}</td>
                    <td class="text-right">${debit > 0 ? debit.toFixed(2) : '-'}</td>
                    <td class="text-right">${credit > 0 ? credit.toFixed(2) : '-'}</td>
                </tr>
            `;
            totalDebit += debit;
            totalCredit += credit;
        }
    });

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Nr. Llogarisë</th><th>Emri i Llogarisë</th><th class="text-right">Debi (€)</th><th class="text-right">Kredi (€)</th></tr></thead>
                <tbody>${tableRowsHtml}</tbody>
                <tfoot>
                    <tr class="grand-total-row" style="font-weight: bold; border-top: 2px solid #333;">
                        <td colspan="2" class="text-right">TOTALET:</td>
                        <td class="text-right">${totalDebit.toFixed(2)} €</td>
                        <td class="text-right">${totalCredit.toFixed(2)} €</td>
                    </tr>
                    <tr>
                        <td colspan="4" class="text-center strong ${isBalanced ? 'cash-value positive' : 'cash-value negative'}">
                            ${isBalanced ? '✔ I BALANCUAR' : '✖ I PA BALANCUAR'}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>`;
    
    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateVatReportHTML(startDateStr: string, endDateStr: string): string {
    const reportTitle = "RAPORTI I TVSH-SË";
    const period = `${new Date(startDateStr + "T00:00:00").toLocaleDateString('sq-AL')} - ${new Date(endDateStr + "T23:59:59").toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML(reportTitle, `Periudha: ${period}`);
    
    const startTs = new Date(startDateStr + "T00:00:00").getTime();
    const endTs = new Date(endDateStr + "T23:59:59").getTime();

    const sales = [...state.salesLog, ...state.localSalesInvoices]
        .filter(sale => sale.timestamp >= startTs && sale.timestamp <= endTs);
    let totalVatCollected = 0;
    let totalSalesValue = 0;
    sales.forEach(sale => {
        const totalWithVAT = 'grandTotal' in sale ? sale.grandTotal : sale.totalAmountWithVAT;
        const totalWithoutVAT = 'subtotal' in sale ? sale.subtotal : sale.totalAmountWithoutVAT;
        totalVatCollected += (totalWithVAT - totalWithoutVAT);
        totalSalesValue += totalWithoutVAT;
    });

    const purchases = state.purchaseInvoices
        .filter(inv => inv.timestamp >= startTs && inv.timestamp <= endTs);
    let totalVatDeductible = 0;
    let totalPurchasesValue = 0;
    purchases.forEach(inv => {
        totalVatDeductible += inv.totalVATAmount;
        totalPurchasesValue += inv.totalAmountWithoutVAT;
    });
    
    const vatLiability = totalVatCollected - totalVatDeductible;

    const reportContent = `
        <div class="report-table-container" style="margin-bottom: 2rem;">
            <h3 class="section-subtitle">TVSH e Mbledhur (nga Shitjet)</h3>
            <table class="admin-table">
                <tbody>
                    <tr><td>Vlera e Shitjeve pa TVSH</td><td class="text-right">${totalSalesValue.toFixed(2)} €</td></tr>
                    <tr><td>TVSH e Mbledhur</td><td class="text-right">${totalVatCollected.toFixed(2)} €</td></tr>
                </tbody>
            </table>
        </div>
        <div class="report-table-container">
            <h3 class="section-subtitle">TVSH e Zbritshme (nga Blerjet)</h3>
            <table class="admin-table">
                <tbody>
                    <tr><td>Vlera e Blerjeve pa TVSH</td><td class="text-right">${totalPurchasesValue.toFixed(2)} €</td></tr>
                    <tr><td>TVSH e Zbritshme</td><td class="text-right">${totalVatDeductible.toFixed(2)} €</td></tr>
                </tbody>
            </table>
        </div>
        <div class="report-summary" style="margin-top: 2rem; padding: 1rem; text-align: center;">
             <p style="font-size: 1.2rem;"><strong>DETYRIMI / KREDIA E TVSH-së: <span class="${vatLiability >= 0 ? 'cash-value' : 'cash-value positive'}">${vatLiability.toFixed(2)} €</span></strong></p>
             <p class="info-message secondary" style="font-size: 0.9em; text-align: left;">Shënim: Vlera pozitive tregon detyrim për pagesë. Vlera negative tregon TVSH të tepërt për kreditim/rimbursim.</p>
        </div>
    `;

    return `<div class="printable-area">${headerHtml}${reportContent}${generateReportFooterHTML()}</div>`;
}

function generateGeneralSalesReportHTML(startDate: string, endDate: string, title: string): string {
    const startTs = new Date(startDate + "T00:00:00").getTime();
    const endTs = new Date(endDate + "T23:59:59").getTime();

    const allSales: (SaleRecord | LocalSaleInvoice)[] = [
        ...state.salesLog.filter(s => s.timestamp >= startTs && s.timestamp <= endTs),
        ...state.localSalesInvoices.filter(s => s.timestamp >= startTs && s.timestamp <= endTs)
    ];

    if (allSales.length === 0) {
        return '<p class="info-message">Nuk ka shitje për periudhën e zgjedhur.</p>';
    }

    allSales.sort((a,b) => a.timestamp - b.timestamp);
    let totalSum = 0;
    
    const rows = allSales.map(sale => {
        const isPosSale = 'sellerUsername' in sale;
        const total = isPosSale ? sale.grandTotal : sale.totalAmountWithVAT;
        const invoiceNum = isPosSale ? sale.invoiceNumber : sale.id;
        const customerName = sale.customerName || (sale.customerId ? state.customers.find(c => c.id === sale.customerId)?.name : 'Klient Standard') || 'Klient Standard';
        
        totalSum += total;

        return `
            <tr>
                <td>${new Date(sale.timestamp).toLocaleString('sq-AL')}</td>
                <td>${invoiceNum}</td>
                <td>${isPosSale ? 'POS' : 'Faturë Lokale'}</td>
                <td>${customerName}</td>
                <td>${isPosSale ? sale.sellerUsername : sale.recordedByManagerUsername}</td>
                <td class="text-right">${total.toFixed(2)} €</td>
            </tr>
        `;
    }).join('');

    const period = `${new Date(startDate + "T00:00:00").toLocaleDateString('sq-AL')} - ${new Date(endDate + "T00:00:00").toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML(title, `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Data/Ora</th><th>Nr. Faturës</th><th>Lloji</th><th>Blerësi</th><th>Lëshuar Nga</th><th class="text-right">Totali (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td colspan="5" class="text-right">TOTALI:</td><td class="text-right">${totalSum.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;

    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateSalesByProductReportHTML(startDate: string, endDate: string): string {
    const startTs = new Date(startDate + "T00:00:00").getTime();
    const endTs = new Date(endDate + "T23:59:59").getTime();
    const sales = [...state.salesLog, ...state.localSalesInvoices].filter(s => s.timestamp >= startTs && s.timestamp <= endTs);

    const productMap = new Map<string, { name: string; quantity: number; total: number }>();

    sales.forEach(sale => {
        sale.items.forEach(item => {
            const productId = 'productId' in item ? item.productId : item.id;
            const product = state.products.find(p => p.id === productId);
            if(!product) return;
            
            const existing = productMap.get(productId) || { name: product.name, quantity: 0, total: 0 };
            const itemPrice = 'priceWithVAT' in item ? item.priceWithVAT : item.price;
            
            existing.quantity += item.quantity;
            existing.total += item.quantity * itemPrice;
            productMap.set(productId, existing);
        });
    });

    if (productMap.size === 0) {
        return '<p class="info-message">Nuk ka shitje për periudhën e zgjedhur.</p>';
    }

    const sortedProducts = Array.from(productMap.values()).sort((a, b) => b.total - a.total);

    const rows = sortedProducts.map(p => `
        <tr>
            <td>${p.name}</td>
            <td class="text-right">${p.quantity.toFixed(2)}</td>
            <td class="text-right">${p.total.toFixed(2)} €</td>
        </tr>
    `).join('');

    const totalValue = sortedProducts.reduce((sum, p) => sum + p.total, 0);

    const period = `${new Date(startDate).toLocaleDateString('sq-AL')} - ${new Date(endDate).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Shitjet sipas Produkteve", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Produkti</th><th class="text-right">Sasia e Shitur</th><th class="text-right">Vlera Totale (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td colspan="2" class="text-right">TOTALI I PËRGJITHSHËM:</td><td class="text-right">${totalValue.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;
        
    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateSalesByCustomerReportHTML(startDate: string, endDate: string): string {
    const startTs = new Date(startDate + "T00:00:00").getTime();
    const endTs = new Date(endDate + "T23:59:59").getTime();
    const sales = [...state.salesLog, ...state.localSalesInvoices].filter(s => s.timestamp >= startTs && s.timestamp <= endTs);

    const customerMap = new Map<string, { name: string; total: number }>();
    const defaultCustomerKey = 'standard_client';
    customerMap.set(defaultCustomerKey, {name: 'Klient Standard', total: 0});

    sales.forEach(sale => {
        const key = sale.customerId || defaultCustomerKey;
        const name = sale.customerName || (sale.customerId ? state.customers.find(c=>c.id === sale.customerId)?.name : 'Klient Standard') || 'Klient Standard';
        const total = 'grandTotal' in sale ? sale.grandTotal : sale.totalAmountWithVAT;
        
        const existing = customerMap.get(key) || { name: name, total: 0 };
        existing.total += total;
        customerMap.set(key, existing);
    });

    if (customerMap.get(defaultCustomerKey)?.total === 0) {
        customerMap.delete(defaultCustomerKey);
    }
    
    if (customerMap.size === 0) return '<p class="info-message">Nuk ka shitje për periudhën e zgjedhur.</p>';
    
    const sortedCustomers = Array.from(customerMap.values()).sort((a,b) => b.total - a.total);
    const rows = sortedCustomers.map(c => `
        <tr><td>${c.name}</td><td class="text-right">${c.total.toFixed(2)} €</td></tr>
    `).join('');
    const totalValue = sortedCustomers.reduce((sum, c) => sum + c.total, 0);

    const period = `${new Date(startDate).toLocaleDateString('sq-AL')} - ${new Date(endDate).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Shitjet sipas Blerësve", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Blerësi</th><th class="text-right">Vlera Totale (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td class="text-right">TOTALI:</td><td class="text-right">${totalValue.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;
        
    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateSalesByCategoryReportHTML(startDate: string, endDate: string): string {
    const startTs = new Date(startDate + "T00:00:00").getTime();
    const endTs = new Date(endDate + "T23:59:59").getTime();
    
    const categoryMap = new Map<string, { name: string; total: number }>();
    const defaultCategoryKey = 'uncategorized';

    // Process POS Sales
    state.salesLog.filter(s => s.timestamp >= startTs && s.timestamp <= endTs).forEach(sale => {
        sale.items.forEach(item => {
            const categoryId = item.categoryId || defaultCategoryKey;
            const categoryName = item.categoryName || 'E Pa Kategorizuar';
            const itemTotal = item.quantity * item.price;
            
            const existing = categoryMap.get(categoryId) || { name: categoryName, total: 0 };
            existing.total += itemTotal;
            categoryMap.set(categoryId, existing);
        });
    });

    // Process Local Sales
    state.localSalesInvoices.filter(s => s.timestamp >= startTs && s.timestamp <= endTs).forEach(sale => {
        sale.items.forEach(item => {
            const product = state.products.find(p => p.id === item.productId);
            const categoryId = product?.categoryId || defaultCategoryKey;
            const category = state.categories.find(c => c.id === categoryId);
            const categoryName = category?.name || 'E Pa Kategorizuar';
            const itemTotal = item.totalValueWithVAT;

            const existing = categoryMap.get(categoryId) || { name: categoryName, total: 0 };
            existing.total += itemTotal;
            categoryMap.set(categoryId, existing);
        });
    });
    
    if (categoryMap.get(defaultCategoryKey)?.total === 0) {
        categoryMap.delete(defaultCategoryKey);
    }
    
    if (categoryMap.size === 0) {
        return '<p class="info-message">Nuk ka shitje për periudhën e zgjedhur.</p>';
    }
    
    const sortedCategories = Array.from(categoryMap.values()).sort((a,b) => b.total - a.total);
    const rows = sortedCategories.map(c => `
        <tr><td>${c.name}</td><td class="text-right">${c.total.toFixed(2)} €</td></tr>
    `).join('');
    const totalValue = sortedCategories.reduce((sum, c) => sum + c.total, 0);

    const period = `${new Date(startDate).toLocaleDateString('sq-AL')} - ${new Date(endDate).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Shitjet sipas Kategorive", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Kategoria</th><th class="text-right">Vlera Totale (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td class="text-right">TOTALI:</td><td class="text-right">${totalValue.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;
        
    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateSalesBySellerReportHTML(startDate: string, endDate: string): string {
    const startTs = new Date(startDate + "T00:00:00").getTime();
    const endTs = new Date(endDate + "T23:59:59").getTime();
    const sales = state.salesLog.filter(s => s.timestamp >= startTs && s.timestamp <= endTs);

    const sellerMap = new Map<string, { name: string; total: number; count: number }>();

    sales.forEach(sale => {
        const key = sale.sellerId;
        const name = sale.sellerUsername;
        
        const existing = sellerMap.get(key) || { name: name, total: 0, count: 0 };
        existing.total += sale.grandTotal;
        existing.count += 1;
        sellerMap.set(key, existing);
    });

    if (sellerMap.size === 0) {
        return '<p class="info-message">Nuk ka shitje (POS) për periudhën e zgjedhur.</p>';
    }
    
    const sortedSellers = Array.from(sellerMap.values()).sort((a,b) => b.total - a.total);
    const rows = sortedSellers.map(s => `
        <tr>
            <td>${s.name}</td>
            <td class="text-right">${s.count}</td>
            <td class="text-right">${s.total.toFixed(2)} €</td>
        </tr>
    `).join('');
    const totalValue = sortedSellers.reduce((sum, s) => sum + s.total, 0);
    const totalCount = sortedSellers.reduce((sum, s) => sum + s.count, 0);

    const period = `${new Date(startDate).toLocaleDateString('sq-AL')} - ${new Date(endDate).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Shitjet sipas Shitësve", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Shitësi</th><th class="text-right">Nr. Faturave</th><th class="text-right">Vlera Totale (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot>
                    <tr style="font-weight: bold; border-top: 2px solid #333;">
                        <td class="text-right">TOTALI:</td>
                        <td class="text-right">${totalCount}</td>
                        <td class="text-right">${totalValue.toFixed(2)} €</td>
                    </tr>
                </tfoot>
            </table>
        </div>`;
        
    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateLocalPurchasesDetailedReportHTML(startDate: string, endDate: string): string {
    const startTs = new Date(startDate + "T00:00:00").getTime();
    const endTs = new Date(endDate + "T23:59:59").getTime();
    const invoices = state.purchaseInvoices.filter(inv => inv.timestamp >= startTs && inv.timestamp <= endTs).sort((a,b) => a.timestamp - b.timestamp);
    if(invoices.length === 0) return '<p class="info-message">Nuk ka blerje për periudhën e zgjedhur.</p>';

    const totalSum = invoices.reduce((sum, inv) => sum + inv.totalAmountWithVAT, 0);
    const rows = invoices.map(inv => `
        <tr>
            <td>${new Date(inv.timestamp).toLocaleDateString('sq-AL')}</td>
            <td>${inv.id}</td>
            <td>${inv.supplierName}</td>
            <td>${inv.supplierInvoiceNumber}</td>
            <td class="text-right">${inv.totalAmountWithVAT.toFixed(2)} €</td>
        </tr>`).join('');
    
    const period = `${new Date(startDate).toLocaleDateString('sq-AL')} - ${new Date(endDate).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Blerjet Vendore të Detajuara", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Data</th><th>Nr. Sistemi</th><th>Furnitori</th><th>Nr. Furnitori</th><th class="text-right">Totali (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td colspan="4" class="text-right">TOTALI:</td><td class="text-right">${totalSum.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;
        
    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}
function generateSalesReturnsReportHTML(startDate: string, endDate: string): string {
    const startTs = new Date(startDate + "T00:00:00").getTime();
    const endTs = new Date(endDate + "T23:59:59").getTime();
    const invoices = state.salesReturnInvoices.filter(inv => inv.timestamp >= startTs && inv.timestamp <= endTs).sort((a,b) => a.timestamp - b.timestamp);
    if(invoices.length === 0) return '<p class="info-message">Nuk ka kthime shitjesh për periudhën e zgjedhur.</p>';

    const totalSum = invoices.reduce((sum, inv) => sum + inv.totalReturnAmountWithVAT, 0);
    const rows = invoices.map(inv => `
        <tr>
            <td>${new Date(inv.timestamp).toLocaleDateString('sq-AL')}</td>
            <td>${inv.id}</td>
            <td>${inv.customerName || 'Klient Standard'}</td>
            <td>${inv.originalSaleInvoiceNumber}</td>
            <td>${inv.reason || '-'}</td>
            <td class="text-right">${inv.totalReturnAmountWithVAT.toFixed(2)} €</td>
        </tr>`).join('');
    
    const period = `${new Date(startDate).toLocaleDateString('sq-AL')} - ${new Date(endDate).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Raporti i Kthimeve të Shitjeve", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Data</th><th>Nr. Kthimi</th><th>Blerësi</th><th>Fatura Origj.</th><th>Arsyeja</th><th class="text-right">Vlera (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td colspan="5" class="text-right">TOTALI:</td><td class="text-right">${totalSum.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;
        
    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateReturnPurchasesReportHTML(startDateStr: string, endDateStr: string): string {
    const startTs = new Date(startDateStr + "T00:00:00").getTime();
    const endTs = new Date(endDateStr + "T23:59:59").getTime();
    const invoices = state.returnPurchaseInvoices.filter(inv => inv.timestamp >= startTs && inv.timestamp <= endTs).sort((a, b) => a.timestamp - b.timestamp);

    if (invoices.length === 0) {
        return '<p class="info-message">Nuk ka kthime blerjesh për periudhën e zgjedhur.</p>';
    }

    const totalSum = invoices.reduce((sum, inv) => sum + inv.totalReturnAmountWithVAT, 0);
    const rows = invoices.map(inv => `
        <tr>
            <td>${new Date(inv.invoiceDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${inv.id}</td>
            <td>${inv.supplierName}</td>
            <td>${inv.supplierInvoiceNumber || '-'}</td>
            <td class="text-right">${inv.totalReturnAmountWithVAT.toFixed(2)} €</td>
        </tr>
    `).join('');

    const period = `${new Date(startDateStr).toLocaleDateString('sq-AL')} - ${new Date(endDateStr).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Raporti i Kthimeve të Blerjeve", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Data</th><th>Nr. Kthimi</th><th>Furnitori</th><th>Nr. Faturës Origj.</th><th class="text-right">Vlera Totale (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td colspan="4" class="text-right">TOTALI:</td><td class="text-right">${totalSum.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;

    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateCreditNotesReportHTML(startDateStr: string, endDateStr: string): string {
    const startTs = new Date(startDateStr + "T00:00:00").getTime();
    const endTs = new Date(endDateStr + "T23:59:59").getTime();
    const notes = state.creditNotes.filter(n => n.timestamp >= startTs && n.timestamp <= endTs).sort((a, b) => a.timestamp - b.timestamp);

    if (notes.length === 0) {
        return '<p class="info-message">Nuk ka nota krediti për periudhën e zgjedhur.</p>';
    }

    const totalSum = notes.reduce((sum, n) => sum + n.totalAmount, 0);
    const rows = notes.map(n => `
        <tr>
            <td>${new Date(n.date + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${n.id}</td>
            <td>${n.customerName || 'N/A'}</td>
            <td>${n.reason || '-'}</td>
            <td class="text-right">${n.totalAmount.toFixed(2)} €</td>
        </tr>
    `).join('');

    const period = `${new Date(startDateStr).toLocaleDateString('sq-AL')} - ${new Date(endDateStr).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Raporti i Notave të Kreditit", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Data</th><th>Nr.</th><th>Blerësi</th><th>Arsyeja</th><th class="text-right">Shuma (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td colspan="4" class="text-right">TOTALI:</td><td class="text-right">${totalSum.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;

    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateDebitNotesReportHTML(startDateStr: string, endDateStr: string): string {
    const startTs = new Date(startDateStr + "T00:00:00").getTime();
    const endTs = new Date(endDateStr + "T23:59:59").getTime();
    const notes = state.debitNotes.filter(n => n.timestamp >= startTs && n.timestamp <= endTs).sort((a, b) => a.timestamp - b.timestamp);

    if (notes.length === 0) {
        return '<p class="info-message">Nuk ka nota debiti për periudhën e zgjedhur.</p>';
    }

    const totalSum = notes.reduce((sum, n) => sum + n.totalAmount, 0);
    const rows = notes.map(n => `
        <tr>
            <td>${new Date(n.date + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${n.id}</td>
            <td>${n.supplierName}</td>
            <td>${n.reason || '-'}</td>
            <td class="text-right">${n.totalAmount.toFixed(2)} €</td>
        </tr>
    `).join('');

    const period = `${new Date(startDateStr).toLocaleDateString('sq-AL')} - ${new Date(endDateStr).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Raporti i Notave të Debitit", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Data</th><th>Nr.</th><th>Furnitori</th><th>Arsyeja</th><th class="text-right">Shuma (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td colspan="4" class="text-right">TOTALI:</td><td class="text-right">${totalSum.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;

    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateClearedSalesLogHTML(startDateStr: string, endDateStr: string): string {
    const startTs = new Date(startDateStr + "T00:00:00").getTime();
    const endTs = new Date(endDateStr + "T23:59:59").getTime();
    const logs = state.clearedSalesLog.filter(log => log.clearedAt >= startTs && log.clearedAt <= endTs).sort((a, b) => a.clearedAt - b.clearedAt);
    
    if (logs.length === 0) {
        return '<p class="info-message">Nuk ka shitje të pastruara për periudhën e zgjedhur.</p>';
    }

    const totalSum = logs.reduce((sum, log) => sum + log.totalClearedAmount, 0);
    const rows = logs.map(log => `
        <tr>
            <td>${new Date(log.clearedAt).toLocaleString('sq-AL')}</td>
            <td>${log.sellerUsername}</td>
            <td>${log.items.map(i => `${i.name} (x${i.quantity})`).join('<br>')}</td>
            <td class="text-right">${log.totalClearedAmount.toFixed(2)} €</td>
        </tr>
    `).join('');

    const period = `${new Date(startDateStr).toLocaleDateString('sq-AL')} - ${new Date(endDateStr).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Regjistri i Shitjeve të Pastruara", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Data/Ora e Pastrimit</th><th>Shitësi</th><th>Artikujt e Pastruar</th><th class="text-right">Vlera (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td colspan="3" class="text-right">TOTALI:</td><td class="text-right">${totalSum.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;

    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateRecipeListReportHTML(): string {
    if (state.recipes.length === 0) {
        return '<p class="info-message">Nuk ka receta të regjistruara.</p>';
    }

    const reportTitle = "Lista e Recetave (BOM)";
    const period = `Gjeneruar më: ${new Date().toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML(reportTitle, period);
    
    const rows = state.recipes.map(recipe => {
        const finalProduct = state.products.find(p => p.id === recipe.finalProductId);
        const ingredients = recipe.ingredients.map(ing => {
            const product = state.products.find(p => p.id === ing.productId);
            return `<li>${product?.name || 'I panjohur'} - ${ing.quantity.toFixed(2)} ${ing.unit}</li>`;
        }).join('');
        return `
            <tr>
                <td><strong>${recipe.name}</strong></td>
                <td>${finalProduct?.name || 'N/A'}</td>
                <td><ul>${ingredients}</ul></td>
                <td>${recipe.notes || '-'}</td>
            </tr>
        `;
    }).join('');

    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Emri i Recetës</th><th>Produkti Final</th><th>Përbërësit</th><th>Shënime</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;

    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateProductionOrdersReportHTML(startDateStr: string, endDateStr: string): string {
    const startTs = new Date(startDateStr + "T00:00:00").getTime();
    const endTs = new Date(endDateStr + "T23:59:59").getTime();
    const orders = state.productionOrders.filter(order => order.createdAt >= startTs && order.createdAt <= endTs).sort((a, b) => a.createdAt - b.createdAt);
    
    if (orders.length === 0) {
        return '<p class="info-message">Nuk ka urdhëra prodhimi për periudhën e zgjedhur.</p>';
    }
    
    const rows = orders.map(order => `
        <tr>
            <td>${new Date(order.createdAt).toLocaleDateString('sq-AL')}</td>
            <td>${order.id}</td>
            <td>${order.finalProductName}</td>
            <td class="text-right">${order.quantityToProduce}</td>
            <td>${order.status}</td>
            <td>${order.createdByUsername}</td>
        </tr>
    `).join('');

    const period = `${new Date(startDateStr).toLocaleDateString('sq-AL')} - ${new Date(endDateStr).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Raporti i Urdhërave të Prodhimit", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Data e Krijimit</th><th>ID Urdhëri</th><th>Produkti Final</th><th class="text-right">Sasia</th><th>Statusi</th><th>Krijuar Nga</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;

    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}


function generateReconciliationReportHTML(startDate: string, endDate: string): string {
    const startTs = new Date(startDate + "T00:00:00").getTime();
    const endTs = new Date(endDate + "T23:59:59").getTime();

    const reconciledEntries = state.dailyCashLog.filter(entry => {
        if (!entry.isReconciled || !entry.reconciliationInfo) return false;
        const entryDate = new Date(entry.date + "T00:00:00").getTime();
        return entryDate >= startTs && entryDate <= endTs;
    }).sort((a,b) => a.reconciliationInfo!.reconciliationTimestamp - b.reconciliationInfo!.reconciliationTimestamp);

    if (reconciledEntries.length === 0) {
        return '<p class="info-message">Nuk ka barazime arke për periudhën e zgjedhur.</p>';
    }

    let totalDifference = 0;
    const rows = reconciledEntries.map(entry => {
        const info = entry.reconciliationInfo!;
        const systemSales = state.salesLog
            .filter(s => s.sellerId === entry.sellerId && s.dailyCashEntryDate === entry.date && s.shift === entry.shift)
            .reduce((sum, s) => sum + s.grandTotal, 0);
        totalDifference += info.difference;
        return `
            <tr>
                <td>${new Date(info.reconciliationTimestamp).toLocaleString('sq-AL')}</td>
                <td>${entry.sellerUsername} (${entry.shift})</td>
                <td class="text-right">${entry.initialCash.toFixed(2)}</td>
                <td class="text-right">${systemSales.toFixed(2)}</td>
                <td class="text-right">${(entry.initialCash + systemSales).toFixed(2)}</td>
                <td class="text-right">${info.actualCashCounted.toFixed(2)}</td>
                <td class="text-right ${info.difference === 0 ? '' : 'cash-value ' + (info.difference > 0 ? 'positive' : 'negative')}">${info.difference.toFixed(2)}</td>
                <td>${info.reconciledByManagerUsername}</td>
            </tr>
        `;
    }).join('');

    const period = `${new Date(startDate).toLocaleDateString('sq-AL')} - ${new Date(endDate).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Raporti i Barazimit të Arkës", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Data/Ora Barazimit</th><th>Shitësi (Ndërrimi)</th><th class="text-right">Arka Fill. (€)</th><th class="text-right">Shitjet (€)</th><th class="text-right">Gjendja Pritshme (€)</th><th class="text-right">Gjendja Numëruar (€)</th><th class="text-right">Diferenca (€)</th><th>Barazuar Nga</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td colspan="6" class="text-right">TOTALI DIFERENCAVE:</td><td class="text-right ${totalDifference === 0 ? '' : 'cash-value ' + (totalDifference > 0 ? 'positive' : 'negative')}">${totalDifference.toFixed(2)} €</td><td></td></tr></tfoot>
            </table>
        </div>`;

    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateMonthlySalesReportHTML(period: string): string {
    const [year, month] = period.split('-').map(Number);
    
    const salesInMonth = [...state.salesLog, ...state.localSalesInvoices].filter(s => {
        const saleDate = 'sellerUsername' in s ? new Date(s.timestamp) : new Date(s.invoiceDate + 'T00:00:00');
        return saleDate.getFullYear() === year && (saleDate.getMonth() + 1) === month;
    });

    if (salesInMonth.length === 0) {
        return '<p class="info-message">Nuk ka shitje për muajin e zgjedhur.</p>';
    }

    const salesByDay = new Map<number, { count: number, total: number }>();
    for (let i = 1; i <= new Date(year, month, 0).getDate(); i++) {
        salesByDay.set(i, { count: 0, total: 0 });
    }

    salesInMonth.forEach(s => {
        const day = 'sellerUsername' in s ? new Date(s.timestamp).getDate() : new Date(s.invoiceDate + 'T00:00:00').getDate();
        const saleTotal = 'grandTotal' in s ? s.grandTotal : s.totalAmountWithVAT;
        const currentDay = salesByDay.get(day)!;
        currentDay.count += 1;
        currentDay.total += saleTotal;
    });

    let rowsHtml = '';
    let totalOfMonth = 0;
    salesByDay.forEach((data, day) => {
        rowsHtml += `
            <tr>
                <td>${day}/${month}/${year}</td>
                <td class="text-right">${data.count}</td>
                <td class="text-right">${data.total.toFixed(2)} €</td>
            </tr>
        `;
        totalOfMonth += data.total;
    });

    const monthName = new Date(year, month - 1, 1).toLocaleString('sq-AL', { month: 'long' });
    const headerHtml = generateReportHeaderHTML("Shitjet Mujore", `Muaji: ${monthName} ${year}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Data</th><th class="text-right">Nr. Faturave</th><th class="text-right">Vlera Totale (€)</th></tr></thead>
                <tbody>${rowsHtml}</tbody>
                <tfoot><tr style="font-weight: bold; border-top: 2px solid #333;"><td colspan="2" class="text-right">TOTALI:</td><td class="text-right">${totalOfMonth.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;
    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateMonthlySalesComparisonReportHTML(month: number, year1: number, year2: number): string {
    const monthName = new Date(year1, month - 1, 1).toLocaleString('sq-AL', { month: 'long' });
    const headerHtml = generateReportHeaderHTML("Krahasimi i Shitjeve Mujore", `Muaji: ${monthName}, Vitet: ${year1} vs ${year2}`);
    
    const getSalesForPeriod = (y: number) => {
        const salesInMonth = [...state.salesLog, ...state.localSalesInvoices].filter(s => {
            const saleDate = 'sellerUsername' in s ? new Date(s.timestamp) : new Date(s.invoiceDate + 'T00:00:00');
            return saleDate.getFullYear() === y && (saleDate.getMonth() + 1) === month;
        });
        const salesByDay = new Map<number, number>();
        for (let i = 1; i <= new Date(y, month, 0).getDate(); i++) {
            salesByDay.set(i, 0);
        }
        salesInMonth.forEach(s => {
            const day = 'sellerUsername' in s ? new Date(s.timestamp).getDate() : new Date(s.invoiceDate + 'T00:00:00').getDate();
            const saleTotal = 'grandTotal' in s ? s.grandTotal : s.totalAmountWithVAT;
            salesByDay.set(day, (salesByDay.get(day) || 0) + saleTotal);
        });
        return salesByDay;
    };

    const salesYear1 = getSalesForPeriod(year1);
    const salesYear2 = getSalesForPeriod(year2);
    const daysInMonth = Math.max(salesYear1.size, salesYear2.size);

    if (daysInMonth === 0) return '<p class="info-message">Nuk ka shitje për asnjë nga periudhat e zgjedhura.</p>';

    let rowsHtml = '';
    let totalYear1 = 0;
    let totalYear2 = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const sales1 = salesYear1.get(day) || 0;
        const sales2 = salesYear2.get(day) || 0;
        const difference = sales1 - sales2;
        const percentageDiff = sales2 !== 0 ? (difference / sales2) * 100 : (sales1 !== 0 ? 100 : 0);
        const diffClass = difference > 0 ? 'positive' : (difference < 0 ? 'negative' : 'zero');

        rowsHtml += `
            <tr>
                <td>${day}</td>
                <td class="text-right">${sales1.toFixed(2)}</td>
                <td class="text-right">${sales2.toFixed(2)}</td>
                <td class="text-right cash-value ${diffClass}">${difference.toFixed(2)}</td>
                <td class="text-right cash-value ${diffClass}">${percentageDiff.toFixed(1)}%</td>
            </tr>
        `;
        totalYear1 += sales1;
        totalYear2 += sales2;
    }

    const totalDifference = totalYear1 - totalYear2;
    const totalPercentageDiff = totalYear2 !== 0 ? (totalDifference / totalYear2) * 100 : (totalYear1 !== 0 ? 100 : 0);
    const totalDiffClass = totalDifference > 0 ? 'positive' : (totalDifference < 0 ? 'negative' : 'zero');

    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Dita</th><th class="text-right">Shitjet ${year1} (€)</th><th class="text-right">Shitjet ${year2} (€)</th><th class="text-right">Diferenca (€)</th><th class="text-right">Diferenca (%)</th></tr></thead>
                <tbody>${rowsHtml}</tbody>
                <tfoot>
                    <tr class="grand-total-row" style="font-weight: bold; border-top: 2px solid #333;">
                        <td>TOTALI:</td>
                        <td class="text-right">${totalYear1.toFixed(2)}</td>
                        <td class="text-right">${totalYear2.toFixed(2)}</td>
                        <td class="text-right cash-value ${totalDiffClass}">${totalDifference.toFixed(2)}</td>
                        <td class="text-right cash-value ${totalDiffClass}">${totalPercentageDiff.toFixed(1)}%</td>
                    </tr>
                </tfoot>
            </table>
        </div>`;
    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generatePurchasesBySupplierReportHTML(startDate: string, endDate: string): string {
    const startTs = new Date(startDate + "T00:00:00").getTime();
    const endTs = new Date(endDate + "T23:59:59").getTime();
    const invoices = state.purchaseInvoices.filter(inv => inv.timestamp >= startTs && inv.timestamp <= endTs);
    
    if (invoices.length === 0) {
        return '<p class="info-message">Nuk ka blerje për periudhën e zgjedhur.</p>';
    }

    const supplierMap = new Map<string, { name: string; invoiceCount: number; totalValue: number }>();

    invoices.forEach(inv => {
        const supplier = supplierMap.get(inv.supplierId) || { name: inv.supplierName, invoiceCount: 0, totalValue: 0 };
        supplier.invoiceCount++;
        supplier.totalValue += inv.totalAmountWithVAT;
        supplierMap.set(inv.supplierId, supplier);
    });
    
    const sortedSuppliers = Array.from(supplierMap.values()).sort((a,b) => b.totalValue - a.totalValue);

    const rows = sortedSuppliers.map(s => `
        <tr>
            <td>${s.name}</td>
            <td class="text-right">${s.invoiceCount}</td>
            <td class="text-right">${s.totalValue.toFixed(2)} €</td>
        </tr>
    `).join('');
    
    const grandTotal = sortedSuppliers.reduce((sum, s) => sum + s.totalValue, 0);

    const period = `${new Date(startDate).toLocaleDateString('sq-AL')} - ${new Date(endDate).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Blerjet sipas Furnitorëve", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Furnitori</th><th class="text-right">Nr. Faturave</th><th class="text-right">Vlera Totale (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr class="grand-total-row"><td colspan="2" class="text-right">TOTALI:</td><td class="text-right">${grandTotal.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;

    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generatePurchasesByProductReportHTML(startDate: string, endDate: string): string {
    const startTs = new Date(startDate + "T00:00:00").getTime();
    const endTs = new Date(endDate + "T23:59:59").getTime();
    const invoices = state.purchaseInvoices.filter(inv => inv.timestamp >= startTs && inv.timestamp <= endTs);
    
    if (invoices.length === 0) {
        return '<p class="info-message">Nuk ka blerje për periudhën e zgjedhur.</p>';
    }

    const productMap = new Map<string, { name: string; quantity: number; totalValue: number }>();

    invoices.forEach(inv => {
        inv.items.forEach(item => {
            const product = productMap.get(item.productId) || { name: item.productName, quantity: 0, totalValue: 0 };
            product.quantity += item.quantity;
            product.totalValue += item.totalValueWithVAT;
            productMap.set(item.productId, product);
        });
    });
    
    const sortedProducts = Array.from(productMap.values()).sort((a,b) => b.totalValue - a.totalValue);

    const rows = sortedProducts.map(p => `
        <tr>
            <td>${p.name}</td>
            <td class="text-right">${p.quantity.toFixed(2)}</td>
            <td class="text-right">${p.totalValue.toFixed(2)} €</td>
        </tr>
    `).join('');

    const grandTotal = sortedProducts.reduce((sum, p) => sum + p.totalValue, 0);

    const period = `${new Date(startDate).toLocaleDateString('sq-AL')} - ${new Date(endDate).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Blerjet sipas Produkteve", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead><tr><th>Produkti</th><th class="text-right">Sasia e Blerë</th><th class="text-right">Vlera Totale (€)</th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr class="grand-total-row"><td colspan="2" class="text-right">TOTALI:</td><td class="text-right">${grandTotal.toFixed(2)} €</td></tr></tfoot>
            </table>
        </div>`;
    
    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateDetailedProductionReportHTML(startDate: string, endDate: string): string {
    const startTs = new Date(startDate + "T00:00:00").getTime();
    const endTs = new Date(endDate + "T23:59:59").getTime();
    const orders = state.productionOrders.filter(o => o.createdAt >= startTs && o.createdAt <= endTs).sort((a,b) => a.createdAt - b.createdAt);

    if (orders.length === 0) {
        return '<p class="info-message">Nuk ka urdhëra prodhimi për periudhën e zgjedhur.</p>';
    }

    let reportBody = '';
    orders.forEach(order => {
        const recipe = state.recipes.find(r => r.id === order.recipeId);
        let ingredientsHtml = '<p>Receta nuk u gjet.</p>';
        if (recipe) {
            ingredientsHtml = '<ul>' + recipe.ingredients.map(ing => {
                const product = state.products.find(p => p.id === ing.productId);
                return `<li>${product?.name || 'I panjohur'}: ${ing.quantity * order.quantityToProduce} ${ing.unit}</li>`;
            }).join('') + '</ul>';
        }

        reportBody += `
            <tbody class="production-order-row">
                <tr>
                    <td><strong>${order.id}</strong></td>
                    <td>${new Date(order.createdAt).toLocaleDateString('sq-AL')}</td>
                    <td>${order.finalProductName}</td>
                    <td class="text-right">${order.quantityToProduce}</td>
                    <td class="text-right">${order.lostQuantity || 0}</td>
                    <td>${order.status}</td>
                </tr>
                <tr>
                    <td colspan="6" style="padding-left: 2rem; background: #fdfdfd;">
                        <strong>Përbërësit e Përdorur:</strong>
                        ${ingredientsHtml}
                    </td>
                </tr>
            </tbody>
        `;
    });

    const period = `${new Date(startDate).toLocaleDateString('sq-AL')} - ${new Date(endDate).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML("Raporti i Detajuar i Prodhimit", `Periudha: ${period}`);
    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID Urdhëri</th>
                        <th>Data</th>
                        <th>Produkti Final</th>
                        <th class="text-right">Sasia Prodhuar</th>
                        <th class="text-right">Sasia Humbur</th>
                        <th>Statusi</th>
                    </tr>
                </thead>
                ${reportBody}
            </table>
        </div>
    `;
    return `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function generateAndDisplayReport(reportType: ReportType, filtersArea: HTMLElement | null, contentArea: HTMLElement | null) {
    if (!contentArea) return;
    
    const getFilterValue = (id: string, suffix: string = '') => (filtersArea?.querySelector(`#${id}${suffix}`) as HTMLInputElement)?.value || '';

    let reportHtml = `<p class="error-message">Raporti i kërkuar (${reportType}) nuk është implementuar ende ose nuk ka të dhëna.</p>`;
    
    try {
        switch (reportType) {
            case ReportTypeEnum.TrialBalance: {
                const date = getFilterValue('trial_balance_date');
                reportHtml = generateTrialBalanceHTML(date);
                break;
            }
            case ReportTypeEnum.VatReport: {
                const startDate = getFilterValue('vat_report_date_range', '-start');
                const endDate = getFilterValue('vat_report_date_range', '-end');
                reportHtml = generateVatReportHTML(startDate, endDate);
                break;
            }
            case ReportTypeEnum.TodaysSales: {
                const today = getTodayDateString();
                reportHtml = generateGeneralSalesReportHTML(today, today, "Shitjet e Sotme");
                break;
            }
            case ReportTypeEnum.DetailedDailySales: {
                const date = getFilterValue('detailed_daily_sales_date');
                reportHtml = generateGeneralSalesReportHTML(date, date, "Shitjet Ditore të Detajuara");
                break;
            }
            case ReportTypeEnum.GeneralSales: {
                const startDate = getFilterValue('general_sales_date_range', '-start');
                const endDate = getFilterValue('general_sales_date_range', '-end');
                reportHtml = generateGeneralSalesReportHTML(startDate, endDate, "Shitjet e Përgjithshme");
                break;
            }
            case ReportTypeEnum.SalesByProduct: {
                const startDate = getFilterValue('sales_by_product_date_range', '-start');
                const endDate = getFilterValue('sales_by_product_date_range', '-end');
                reportHtml = generateSalesByProductReportHTML(startDate, endDate);
                break;
            }
             case ReportTypeEnum.SalesByCategory: {
                const startDate = getFilterValue('sales_by_category_date_range', '-start');
                const endDate = getFilterValue('sales_by_category_date_range', '-end');
                reportHtml = generateSalesByCategoryReportHTML(startDate, endDate);
                break;
            }
            case ReportTypeEnum.SalesByCustomer: {
                const startDate = getFilterValue('sales_by_customer_date_range', '-start');
                const endDate = getFilterValue('sales_by_customer_date_range', '-end');
                reportHtml = generateSalesByCustomerReportHTML(startDate, endDate);
                break;
            }
            case ReportTypeEnum.SalesBySeller: {
                const startDate = getFilterValue('sales_by_seller_date_range', '-start');
                const endDate = getFilterValue('sales_by_seller_date_range', '-end');
                reportHtml = generateSalesBySellerReportHTML(startDate, endDate);
                break;
            }
            case ReportTypeEnum.LocalPurchasesDetailed: {
                const startDate = getFilterValue('local_purchases_date_range', '-start');
                const endDate = getFilterValue('local_purchases_date_range', '-end');
                reportHtml = generateLocalPurchasesDetailedReportHTML(startDate, endDate);
                break;
            }
            case ReportTypeEnum.SalesReturnsReport: {
                const startDate = getFilterValue('sales_returns_date_range', '-start');
                const endDate = getFilterValue('sales_returns_date_range', '-end');
                reportHtml = generateSalesReturnsReportHTML(startDate, endDate);
                break;
            }
            case ReportTypeEnum.ReturnPurchasesReport: {
                const startDate = getFilterValue('return_purchases_date_range', '-start');
                const endDate = getFilterValue('return_purchases_date_range', '-end');
                reportHtml = generateReturnPurchasesReportHTML(startDate, endDate);
                break;
            }
            case ReportTypeEnum.CreditNotesReport: {
                const startDate = getFilterValue('credit_notes_date_range', '-start');
                const endDate = getFilterValue('credit_notes_date_range', '-end');
                reportHtml = generateCreditNotesReportHTML(startDate, endDate);
                break;
            }
            case ReportTypeEnum.DebitNotesReport: {
                const startDate = getFilterValue('debit_notes_date_range', '-start');
                const endDate = getFilterValue('debit_notes_date_range', '-end');
                reportHtml = generateDebitNotesReportHTML(startDate, endDate);
                break;
            }
            case ReportTypeEnum.ClearedSalesLog: {
                 const startDate = getFilterValue('cleared_sales_date_range', '-start');
                 const endDate = getFilterValue('cleared_sales_date_range', '-end');
                 reportHtml = generateClearedSalesLogHTML(startDate, endDate);
                 break;
            }
             case ReportTypeEnum.RecipeListReport: {
                reportHtml = generateRecipeListReportHTML();
                break;
            }
            case ReportTypeEnum.ProductionOrdersReport: {
                const startDate = getFilterValue('production_orders_date_range', '-start');
                const endDate = getFilterValue('production_orders_date_range', '-end');
                reportHtml = generateProductionOrdersReportHTML(startDate, endDate);
                break;
            }
            case ReportTypeEnum.ReconciliationReport: {
                 const startDate = getFilterValue('reconciliation_date_range', '-start');
                 const endDate = getFilterValue('reconciliation_date_range', '-end');
                 reportHtml = generateReconciliationReportHTML(startDate, endDate);
                 break;
            }
            case ReportTypeEnum.TopSellingProducts: {
                const startDate = getFilterValue('top_selling_date_range', '-start');
                const endDate = getFilterValue('top_selling_date_range', '-end');
                reportHtml = generateSalesByProductReportHTML(startDate, endDate);
                break;
            }
             case ReportTypeEnum.MonthlySales: {
                const period = getFilterValue('monthly_sales_period');
                if(period) {
                    reportHtml = generateMonthlySalesReportHTML(period);
                } else {
                    reportHtml = '<p class="error-message">Ju lutem zgjidhni një muaj.</p>';
                }
                break;
            }
            case ReportTypeEnum.MonthlySalesComparison: {
                const month = parseInt(getFilterValue('monthly_comparison-month'), 10);
                const year1 = parseInt(getFilterValue('monthly_comparison-year1'), 10);
                const year2 = parseInt(getFilterValue('monthly_comparison-year2'), 10);
                if (month && year1 && year2) {
                    reportHtml = generateMonthlySalesComparisonReportHTML(month, year1, year2);
                } else {
                    reportHtml = '<p class="error-message">Ju lutem zgjidhni muajin dhe të dy vitet për krahasim.</p>';
                }
                break;
            }
            case ReportTypeEnum.PurchasesBySupplier: {
                const startDate = getFilterValue('purchases_by_supplier_date_range', '-start');
                const endDate = getFilterValue('purchases_by_supplier_date_range', '-end');
                reportHtml = generatePurchasesBySupplierReportHTML(startDate, endDate);
                break;
            }
            case ReportTypeEnum.PurchasesByProduct: {
                 const startDate = getFilterValue('purchases_by_product_date_range', '-start');
                const endDate = getFilterValue('purchases_by_product_date_range', '-end');
                reportHtml = generatePurchasesByProductReportHTML(startDate, endDate);
                break;
            }
             case ReportTypeEnum.DetailedProductionReport: {
                const startDate = getFilterValue('detailed_production_date_range', '-start');
                const endDate = getFilterValue('detailed_production_date_range', '-end');
                reportHtml = generateDetailedProductionReportHTML(startDate, endDate);
                break;
            }
        }
    } catch(e: any) {
        console.error("Error generating report:", reportType, e);
        reportHtml = `<p class="error-message">Gabim i papritur gjatë gjenerimit të raportit: ${e.message}</p>`;
    }

    contentArea.innerHTML = reportHtml;
}

export {
    generateGeneralSalesReportHTML,
};