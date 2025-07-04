/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import { PurchaseInvoice, ReturnPurchaseInvoice, Supplier, OutgoingPayment } from '../models';
import { getTodayDateString } from '../core/utils';
import { openPrintPreviewModal } from '../core/ui';

interface LedgerEntry {
    date: number; // Timestamp for sorting
    displayDate: string;
    type: string; 
    documentNumber: string;
    debit: number; // Represents an increase in what we owe the supplier (e.g., a purchase)
    credit: number; // Represents a decrease in what we owe the supplier (e.g., a payment or return)
    balance: number; // Positive means we owe the supplier, negative means supplier owes us or we have credit
    description?: string;
}

export function initSupplierLedgerEventListeners(): void {
    dom.generateSupplierLedgerBtn?.addEventListener('click', handleGenerateSupplierLedger);
    dom.supplierLedgerSupplierSelect?.addEventListener('change', () => {
        if (dom.supplierLedgerContentArea) {
            dom.supplierLedgerContentArea.innerHTML = '<p class="text-center info-message info">Zgjidhni një furnitor dhe periudhën për të parë kartelën.</p>';
        }
        if(dom.exportSupplierLedgerPdfBtn) dom.exportSupplierLedgerPdfBtn.disabled = true;
        if(dom.printSupplierLedgerBtn) dom.printSupplierLedgerBtn.disabled = true;
    });
    dom.exportSupplierLedgerPdfBtn?.addEventListener('click', () => handleExportSupplierLedger('pdf'));
    dom.printSupplierLedgerBtn?.addEventListener('click', () => handleExportSupplierLedger('print'));
}

export function initSupplierLedgerView(): void {
    if (!dom.supplierLedgerSupplierSelect || !dom.supplierLedgerStartDateInput || !dom.supplierLedgerEndDateInput || !dom.supplierLedgerContentArea) return;

    populateSupplierLedgerSupplierSelect();
    const today = getTodayDateString();
    dom.supplierLedgerStartDateInput.value = today;
    dom.supplierLedgerEndDateInput.value = today;
    dom.supplierLedgerContentArea.innerHTML = '<p class="text-center info-message info">Zgjidhni një furnitor dhe periudhën për të parë kartelën.</p>';
    if(dom.exportSupplierLedgerPdfBtn) dom.exportSupplierLedgerPdfBtn.disabled = true;
    if(dom.printSupplierLedgerBtn) dom.printSupplierLedgerBtn.disabled = true;
}

function populateSupplierLedgerSupplierSelect(): void {
    if (!dom.supplierLedgerSupplierSelect) return;
    dom.supplierLedgerSupplierSelect.innerHTML = '<option value="">-- Zgjidh Furnitorin --</option>';
    state.suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = `${supplier.name} (Kodi: ${supplier.code})`;
        dom.supplierLedgerSupplierSelect?.appendChild(option);
    });
}

function handleGenerateSupplierLedger(): void {
    if (!dom.supplierLedgerSupplierSelect || !dom.supplierLedgerStartDateInput || !dom.supplierLedgerEndDateInput || !dom.supplierLedgerContentArea) return;

    const supplierId = dom.supplierLedgerSupplierSelect.value;
    const startDateStr = dom.supplierLedgerStartDateInput.value;
    const endDateStr = dom.supplierLedgerEndDateInput.value;

    if (!supplierId) {
        dom.supplierLedgerContentArea.innerHTML = '<p class="error-message">Ju lutem zgjidhni një furnitor.</p>';
        return;
    }
    if (!startDateStr || !endDateStr) {
        dom.supplierLedgerContentArea.innerHTML = '<p class="error-message">Ju lutem zgjidhni periudhën e datave.</p>';
        return;
    }

    const supplier = state.suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        dom.supplierLedgerContentArea.innerHTML = '<p class="error-message">Furnitori i zgjedhur nuk u gjet.</p>';
        return;
    }

    dom.supplierLedgerContentArea.innerHTML = '<p class="loading-message">Duke gjeneruar kartelën...</p>';

    const startDate = new Date(startDateStr + "T00:00:00").getTime();
    const endDate = new Date(endDateStr + "T23:59:59").getTime();
    
    const ledgerEntries: LedgerEntry[] = [];
    // Initial balance for the ledger starts with the supplier's openingBalance
    let balanceBeforePeriod = supplier.openingBalance || 0;

    // Adjust balanceBeforePeriod with transactions before startDate
    state.purchaseInvoices.filter(inv => inv.supplierId === supplierId && inv.timestamp < startDate)
        .forEach(inv => balanceBeforePeriod += inv.totalAmountWithVAT);
    state.returnPurchaseInvoices.filter(inv => inv.supplierId === supplierId && inv.timestamp < startDate)
        .forEach(inv => balanceBeforePeriod -= inv.totalReturnAmountWithVAT);
    state.outgoingPayments.filter(payment => payment.supplierId === supplierId && payment.timestamp < startDate)
        .forEach(payment => balanceBeforePeriod -= payment.totalPaidAmount);


    // Collect transactions within the period
    // Purchase Invoices
    state.purchaseInvoices.filter(inv => inv.supplierId === supplierId && inv.timestamp >= startDate && inv.timestamp <= endDate)
        .forEach(inv => {
            ledgerEntries.push({
                date: inv.timestamp,
                displayDate: new Date(inv.invoiceDate + "T00:00:00").toLocaleDateString('sq-AL'),
                type: 'Blerje Vendore',
                documentNumber: inv.id,
                debit: inv.totalAmountWithVAT, 
                credit: 0,
                balance: 0, 
                description: `Faturë Furnitori: ${inv.supplierInvoiceNumber}`
            });
        });

    // Return Purchase Invoices
    state.returnPurchaseInvoices.filter(inv => inv.supplierId === supplierId && inv.timestamp >= startDate && inv.timestamp <= endDate)
        .forEach(inv => {
            ledgerEntries.push({
                date: inv.timestamp,
                displayDate: new Date(inv.invoiceDate + "T00:00:00").toLocaleDateString('sq-AL'),
                type: 'Kthim Blerje',
                documentNumber: inv.id,
                debit: 0,
                credit: inv.totalReturnAmountWithVAT, 
                balance: 0,
                description: `Ref. Faturës Furnitorit: ${inv.supplierInvoiceNumber || '-'}`
            });
        });
    
    // Outgoing Payments
    state.outgoingPayments.filter(payment => payment.supplierId === supplierId && payment.timestamp >= startDate && payment.timestamp <= endDate)
        .forEach(payment => {
            ledgerEntries.push({
                date: payment.timestamp,
                displayDate: new Date(payment.paymentDate + "T00:00:00").toLocaleDateString('sq-AL'),
                type: 'Pagesë Dalëse',
                documentNumber: payment.id,
                debit: 0,
                credit: payment.totalPaidAmount, 
                balance: 0,
                description: `Mënyra: ${payment.paymentMethod}${payment.reference ? ', Ref: ' + payment.reference : ''}`
            });
        });
    
    ledgerEntries.sort((a, b) => a.date - b.date);

    let currentBalance = balanceBeforePeriod;
    ledgerEntries.forEach(entry => {
        currentBalance += entry.debit;
        currentBalance -= entry.credit;
        entry.balance = currentBalance;
    });

    renderSupplierLedgerTable(ledgerEntries, balanceBeforePeriod, supplier);
    
    if(dom.exportSupplierLedgerPdfBtn) dom.exportSupplierLedgerPdfBtn.disabled = ledgerEntries.length === 0 && balanceBeforePeriod === 0 && (supplier.openingBalance || 0) === 0;
    if(dom.printSupplierLedgerBtn) dom.printSupplierLedgerBtn.disabled = ledgerEntries.length === 0 && balanceBeforePeriod === 0 && (supplier.openingBalance || 0) === 0;
}

function renderSupplierLedgerTable(entries: LedgerEntry[], initialBalanceForPeriod: number, supplier: Supplier): void {
    if (!dom.supplierLedgerContentArea) return;

    const businessDetails = state.businessDetails;
    const businessName = businessDetails?.name || "Emri i Biznesit";
    const businessAddress = businessDetails?.address || "";
    const businessNipt = businessDetails?.nipt || "";
    const logoUrl = businessDetails?.logoUrl;
    let logoHtml = '';
    if (logoUrl) {
        logoHtml = `<div class="report-logo"><img src="${logoUrl}" alt="Logo e Biznesit"></div>`;
    }
    const startDateVal = dom.supplierLedgerStartDateInput?.value ? new Date(dom.supplierLedgerStartDateInput.value + "T00:00:00").toLocaleDateString('sq-AL') : 'N/A';
    const endDateVal = dom.supplierLedgerEndDateInput?.value ? new Date(dom.supplierLedgerEndDateInput.value + "T00:00:00").toLocaleDateString('sq-AL') : 'N/A';


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
                     <h1>KARTELË FURNITORI</h1>
                     <p>Furnitori: <strong>${supplier.name} (Kodi: ${supplier.code})</strong></p>
                     <p>Periudha: <strong>${startDateVal} - ${endDateVal}</strong></p>
                </div>
            </div>
            
            <div class="report-table-container">
                <table class="admin-table supplier-ledger-table">
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
                            <td>Saldo Fillestare e Furnitorit: ${(supplier.openingBalance || 0).toFixed(2)} €</td>
                            <td class="text-right">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right"><strong>${initialBalanceForPeriod.toFixed(2)}</strong></td>
                        </tr>
    `;

    if (entries.length === 0) {
        tableHtml += `<tr><td colspan="7" class="text-center">Nuk ka lëvizje për këtë furnitor në periudhën e zgjedhur.</td></tr>`;
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
    dom.supplierLedgerContentArea.innerHTML = tableHtml;
}

function handleExportSupplierLedger(format: 'pdf' | 'print') {
    if (!dom.supplierLedgerContentArea || !dom.supplierLedgerSupplierSelect || !dom.supplierLedgerStartDateInput || !dom.supplierLedgerEndDateInput) return;

    const supplierId = dom.supplierLedgerSupplierSelect.value;
    const supplier = state.suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        alert("Zgjidhni një furnitor së pari.");
        return;
    }

    const contentToPrint = dom.supplierLedgerContentArea.querySelector('.printable-area');
    if (!contentToPrint || contentToPrint.innerHTML.includes("Nuk ka lëvizje")) {
        alert("Nuk ka të dhëna për të eksportuar/printuar.");
        return;
    }
    
    const reportTitle = `Kartela e Furnitorit - ${supplier.name}`;
    
    if (dom.printPreviewContent && dom.printPreviewModalTitle) {
        dom.printPreviewContent.innerHTML = contentToPrint.innerHTML;
        dom.printPreviewModalTitle.textContent = format === 'pdf' ? `Pamje PDF: ${reportTitle}` : `Shtyp: ${reportTitle}`;
        openPrintPreviewModal();
        if (format === 'pdf') {
            alert("Për të ruajtur si PDF, zgjidhni 'Ruaj si PDF' ose 'Save as PDF' nga dialogu i printimit.");
        }
    }
}
