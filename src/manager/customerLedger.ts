
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import { SaleRecord, Customer, IncomingPayment, LocalSaleInvoice, SalesReturnInvoice } from '../models'; // Added LocalSaleInvoice
import { getTodayDateString } from '../core/utils';
import { openPrintPreviewModal } from '../core/ui';

interface LedgerEntry {
    date: number; // Timestamp for sorting
    displayDate: string;
    type: string; 
    documentNumber: string;
    debit: number;
    credit: number;
    balance: number;
    description?: string;
}

export function initCustomerLedgerEventListeners(): void {
    dom.generateCustomerLedgerBtn?.addEventListener('click', handleGenerateCustomerLedger);
    dom.customerLedgerCustomerSelect?.addEventListener('change', () => {
        if (dom.customerLedgerContentArea) {
            dom.customerLedgerContentArea.innerHTML = '<p class="text-center info-message info">Zgjidhni një blerës dhe periudhën për të parë kartelën.</p>';
        }
        if(dom.exportCustomerLedgerPdfBtn) dom.exportCustomerLedgerPdfBtn.disabled = true;
        if(dom.printCustomerLedgerBtn) dom.printCustomerLedgerBtn.disabled = true;
    });
    dom.exportCustomerLedgerPdfBtn?.addEventListener('click', () => handleExportCustomerLedger('pdf'));
    dom.printCustomerLedgerBtn?.addEventListener('click', () => handleExportCustomerLedger('print'));
}

export function initCustomerLedgerView(): void {
    if (!dom.customerLedgerCustomerSelect || !dom.customerLedgerStartDateInput || !dom.customerLedgerEndDateInput || !dom.customerLedgerContentArea) return;

    populateCustomerLedgerCustomerSelect();
    const today = getTodayDateString();
    dom.customerLedgerStartDateInput.value = today;
    dom.customerLedgerEndDateInput.value = today;
    dom.customerLedgerContentArea.innerHTML = '<p class="text-center info-message info">Zgjidhni një blerës dhe periudhën për të parë kartelën.</p>';
    if(dom.exportCustomerLedgerPdfBtn) dom.exportCustomerLedgerPdfBtn.disabled = true;
    if(dom.printCustomerLedgerBtn) dom.printCustomerLedgerBtn.disabled = true;
}

function populateCustomerLedgerCustomerSelect(): void {
    if (!dom.customerLedgerCustomerSelect) return;
    dom.customerLedgerCustomerSelect.innerHTML = '<option value="">-- Zgjidh Blerësin --</option>';
    
    const standardClientOption = document.createElement('option');
    standardClientOption.value = "STANDARD_CLIENT"; 
    standardClientOption.textContent = "Klient Standard (Faturat pa blerës të specifikuar)";
    dom.customerLedgerCustomerSelect.appendChild(standardClientOption);

    state.customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (Kodi: ${customer.code})`;
        dom.customerLedgerCustomerSelect?.appendChild(option);
    });
}

function handleGenerateCustomerLedger(): void {
    if (!dom.customerLedgerCustomerSelect || !dom.customerLedgerStartDateInput || !dom.customerLedgerEndDateInput || !dom.customerLedgerContentArea) return;

    const customerIdOrStandard = dom.customerLedgerCustomerSelect.value;
    const startDateStr = dom.customerLedgerStartDateInput.value;
    const endDateStr = dom.customerLedgerEndDateInput.value;

    if (!customerIdOrStandard) {
        dom.customerLedgerContentArea.innerHTML = '<p class="error-message">Ju lutem zgjidhni një blerës.</p>';
        return;
    }
    if (!startDateStr || !endDateStr) {
        dom.customerLedgerContentArea.innerHTML = '<p class="error-message">Ju lutem zgjidhni periudhën e datave.</p>';
        return;
    }

    let customer: Customer | { id: string, name: string, code: string, openingBalance?: number } | null = null;
    if (customerIdOrStandard === "STANDARD_CLIENT") {
        customer = { id: "STANDARD_CLIENT", name: "Klient Standard", code: "N/A", openingBalance: 0 };
    } else {
        customer = state.customers.find(c => c.id === customerIdOrStandard) || null;
    }
    
    if (!customer) {
        dom.customerLedgerContentArea.innerHTML = '<p class="error-message">Blerësi i zgjedhur nuk u gjet.</p>';
        return;
    }

    dom.customerLedgerContentArea.innerHTML = '<p class="loading-message">Duke gjeneruar kartelën...</p>';

    const startDate = new Date(startDateStr + "T00:00:00").getTime();
    const endDate = new Date(endDateStr + "T23:59:59").getTime();
    
    const ledgerEntries: LedgerEntry[] = [];
    let initialBalance = customer.openingBalance || 0;


    state.salesLog.filter(sale => 
        ((customerIdOrStandard === "STANDARD_CLIENT" && !sale.customerId) || sale.customerId === customerIdOrStandard) &&
        sale.timestamp < startDate
    ).forEach(sale => initialBalance += sale.grandTotal);

    state.localSalesInvoices.filter(inv =>
        ((customerIdOrStandard === "STANDARD_CLIENT" && !inv.customerId) || inv.customerId === customerIdOrStandard) &&
        inv.timestamp < startDate
    ).forEach(inv => initialBalance += inv.totalAmountWithVAT);

    state.incomingPayments.filter(payment =>
        ((customerIdOrStandard === "STANDARD_CLIENT" && !payment.customerId) || payment.customerId === customerIdOrStandard) &&
        payment.timestamp < startDate
    ).forEach(payment => initialBalance -= payment.totalReceivedAmount);

    // Account for Sales Returns before the period for initial balance
    state.salesReturnInvoices.filter(inv => 
        ((customerIdOrStandard === "STANDARD_CLIENT" && !inv.customerId) || inv.customerId === customerIdOrStandard) &&
        inv.timestamp < startDate
    ).forEach(inv => initialBalance -= inv.totalReturnAmountWithVAT); // Credit to customer


    state.salesLog.filter(sale => 
        ((customerIdOrStandard === "STANDARD_CLIENT" && !sale.customerId) || sale.customerId === customerIdOrStandard) &&
        sale.timestamp >= startDate && 
        sale.timestamp <= endDate
    ).forEach(sale => {
        ledgerEntries.push({
            date: sale.timestamp,
            displayDate: new Date(sale.timestamp).toLocaleDateString('sq-AL'),
            type: 'Shitje (POS)',
            documentNumber: sale.invoiceNumber,
            debit: sale.grandTotal,
            credit: 0, 
            balance: 0, 
            description: `Shitës: ${sale.sellerUsername}`
        });
    });

    state.localSalesInvoices.filter(inv =>
        ((customerIdOrStandard === "STANDARD_CLIENT" && !inv.customerId) || inv.customerId === customerIdOrStandard) &&
        inv.timestamp >= startDate &&
        inv.timestamp <= endDate
    ).forEach(inv => {
        ledgerEntries.push({
            date: inv.timestamp,
            displayDate: new Date(inv.invoiceDate + "T00:00:00").toLocaleDateString('sq-AL'),
            type: 'Shitje Vendore',
            documentNumber: inv.id,
            debit: inv.totalAmountWithVAT,
            credit: 0,
            balance: 0,
            description: `Regj. nga: ${inv.recordedByManagerUsername}`
        });
    });

    state.incomingPayments.filter(payment =>
        ((customerIdOrStandard === "STANDARD_CLIENT" && !payment.customerId) || payment.customerId === customerIdOrStandard) &&
        payment.timestamp >= startDate &&
        payment.timestamp <= endDate
    ).forEach(payment => {
        ledgerEntries.push({
            date: payment.timestamp,
            displayDate: new Date(payment.paymentDate + "T00:00:00").toLocaleDateString('sq-AL'),
            type: 'Pagesë Hyrëse',
            documentNumber: payment.id,
            debit: 0,
            credit: payment.totalReceivedAmount,
            balance: 0,
            description: `Mënyra: ${payment.paymentMethod}${payment.reference ? ', Ref: ' + payment.reference : ''}${payment.notes ? ', Shënime: ' + payment.notes : ''}`
        });
    });

    // Add Sales Return Invoices to ledger entries for the period
    state.salesReturnInvoices.filter(inv =>
        ((customerIdOrStandard === "STANDARD_CLIENT" && !inv.customerId) || inv.customerId === customerIdOrStandard) &&
        inv.timestamp >= startDate && 
        inv.timestamp <= endDate
    ).forEach(inv => {
        ledgerEntries.push({
            date: inv.timestamp,
            displayDate: new Date(inv.returnDate + "T00:00:00").toLocaleDateString('sq-AL'),
            type: 'Kthim Shitje',
            documentNumber: inv.id,
            debit: 0,
            credit: inv.totalReturnAmountWithVAT, // Credit to customer
            balance: 0,
            description: `Fakt. Origj: ${inv.originalSaleInvoiceNumber}`
        });
    });
    
    ledgerEntries.sort((a, b) => a.date - b.date);

    let currentBalance = initialBalance;
    ledgerEntries.forEach(entry => {
        currentBalance += entry.debit;
        currentBalance -= entry.credit;
        entry.balance = currentBalance;
    });

    renderCustomerLedgerTable(ledgerEntries, initialBalance, customer);
    
    if(dom.exportCustomerLedgerPdfBtn) dom.exportCustomerLedgerPdfBtn.disabled = ledgerEntries.length === 0 && initialBalance === 0;
    if(dom.printCustomerLedgerBtn) dom.printCustomerLedgerBtn.disabled = ledgerEntries.length === 0 && initialBalance === 0;
}

function renderCustomerLedgerTable(entries: LedgerEntry[], initialBalance: number, customer: Customer | { name: string, code: string, openingBalance?: number }): void {
    if (!dom.customerLedgerContentArea) return;

    const businessDetails = state.businessDetails;
    const businessName = businessDetails?.name || "Emri i Biznesit";
    const businessAddress = businessDetails?.address || "";
    const businessNipt = businessDetails?.nipt || "";
    const logoUrl = businessDetails?.logoUrl;
    let logoHtml = '';
    if (logoUrl) {
        logoHtml = `<div class="report-logo"><img src="${logoUrl}" alt="Logo e Biznesit"></div>`;
    }
    const startDateVal = dom.customerLedgerStartDateInput?.value ? new Date(dom.customerLedgerStartDateInput.value + "T00:00:00").toLocaleDateString('sq-AL') : 'N/A';
    const endDateVal = dom.customerLedgerEndDateInput?.value ? new Date(dom.customerLedgerEndDateInput.value + "T00:00:00").toLocaleDateString('sq-AL') : 'N/A';


    let tableHtml = `
      <div class="printable-area">
            <div class="print-header-info">
                ${logoHtml}
                <div class="report-business-details">
                    <h2 class="report-business-name">${businessName}</h2>
                    ${businessAddress ? `<p class="report-business-detail">${businessAddress}</p>` : ''}
                    ${businessNipt ? `<p class="report-business-detail">NIPT: ${businessNipt}</p>` : ''}
                </div>
                <div class="report-meta-info">
                     <h1>KARTELË BLERËSI</h1>
                     <p>Blerësi: <strong>${customer.name} ${customer.code !== "N/A" ? `(Kodi: ${customer.code})` : ''}</strong></p>
                     <p>Periudha: <strong>${startDateVal} - ${endDateVal}</strong></p>
                </div>
            </div>
            
            <div class="report-table-container">
                <table class="admin-table customer-ledger-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Lloji i Dokumentit</th>
                            <th>Nr. Dokumentit</th>
                            <th>Përshkrimi</th>
                            <th class="text-right">Debiti (€)</th>
                            <th class="text-right">Krediti (€)</th>
                            <th class="text-right">Balanca (€)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>-</td>
                            <td colspan="2"><strong>Balanca Fillestare e Periudhës</strong></td>
                            <td>Saldo Fillestare: ${(customer.openingBalance || 0).toFixed(2)} €</td>
                            <td class="text-right">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right"><strong>${initialBalance.toFixed(2)}</strong></td>
                        </tr>
    `;

    if (entries.length === 0) {
        tableHtml += `<tr><td colspan="7" class="text-center">Nuk ka lëvizje për këtë blerës në periudhën e zgjedhur.</td></tr>`;
    } else {
        entries.forEach(entry => {
            tableHtml += `
                <tr>
                    <td>${entry.displayDate}</td>
                    <td>${entry.type}</td>
                    <td>${entry.documentNumber}</td>
                    <td>${entry.description || '-'}</td>
                    <td class="text-right">${entry.debit !== 0 ? entry.debit.toFixed(2) : '-'}</td>
                    <td class="text-right">${entry.credit !== 0 ? entry.credit.toFixed(2) : '-'}</td>
                    <td class="text-right">${entry.balance.toFixed(2)}</td>
                </tr>
            `;
        });
    }

    tableHtml += `
                </tbody>
            </table>
            </div>
            <div class="invoice-print-footer">
                 <p class="generation-time">Gjeneruar më: ${new Date().toLocaleString('sq-AL')}</p>
                 <div class="signatures-and-stamp-container">
                    <div class="signature-area">
                        <p class="signature-label">Përgatiti:</p>
                        <div class="signature-line"></div>
                    </div>
                    <div class="signature-area">
                        <p class="signature-label">Miratoi:</p>
                        <div class="signature-line"></div>
                    </div>
                </div>
            </div>
        </div> 
    `;
    dom.customerLedgerContentArea.innerHTML = tableHtml;
}

function handleExportCustomerLedger(format: 'pdf' | 'print') {
    if (!dom.customerLedgerContentArea || !dom.customerLedgerCustomerSelect || !dom.customerLedgerStartDateInput || !dom.customerLedgerEndDateInput) return;

    const customerIdOrStandard = dom.customerLedgerCustomerSelect.value;
    let customerName = "Klient i Pa Specifikuar";
    if (customerIdOrStandard === "STANDARD_CLIENT") {
        customerName = "Klient Standard";
    } else {
        const customer = state.customers.find(s => s.id === customerIdOrStandard);
        if (!customer) { alert("Zgjidhni një blerës së pari."); return; }
        customerName = customer.name;
    }
    
    const contentToPrint = dom.customerLedgerContentArea.querySelector('.printable-area');
    if (!contentToPrint || contentToPrint.innerHTML.includes("Nuk ka lëvizje")) {
        alert("Nuk ka të dhëna për të eksportuar/printuar.");
        return;
    }
    
    const reportTitle = `Kartela e Blerësit - ${customerName}`;
    
    if (dom.printPreviewContent && dom.printPreviewModalTitle) {
        dom.printPreviewContent.innerHTML = contentToPrint.innerHTML;
        dom.printPreviewModalTitle.textContent = format === 'pdf' ? `Pamje PDF: ${reportTitle}` : `Shtyp: ${reportTitle}`;
        openPrintPreviewModal();
        if (format === 'pdf') {
            alert("Për të ruajtur si PDF, zgjidhni 'Ruaj si PDF' ose 'Save as PDF' nga dialogu i printimit.");
        }
    }
}
