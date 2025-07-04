
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import { Account, JournalEntry } from '../models';
import { getTodayDateString } from '../core/utils';
import { openPrintPreviewModal, generateReportHeaderHTML, generateReportFooterHTML } from '../core/ui';

interface LedgerEntry {
    date: number;
    displayDate: string;
    description: string;
    documentNumber: string;
    debit: number;
    credit: number;
    balance: number;
}

export function initAccountLedgerView(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) return;
    
    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Kartela e Llogarisë Kontabël</h2>
        <div class="report-filters-dynamic" id="account-ledger-filters-area">
            <div class="form-group filter-group">
                <label for="account-ledger-account-select">Zgjidh Llogarinë:</label>
                <select id="account-ledger-account-select" name="accountLedgerAccount" class="form-control"></select>
            </div>
            <div class="form-group filter-group">
                <label for="account-ledger-start-date">Nga Data:</label>
                <input type="date" id="account-ledger-start-date" name="accountLedgerStartDate">
            </div>
            <div class="form-group filter-group">
                <label for="account-ledger-end-date">Deri më Datë:</label>
                <input type="date" id="account-ledger-end-date" name="accountLedgerEndDate">
            </div>
            <button id="generate-account-ledger-btn" class="btn btn-primary">Gjenero Kartelën</button>
        </div>
        <div id="account-ledger-content-area" class="report-content" style="margin-top: 1.5rem;">
            <p class="text-center info-message info">Zgjidhni një llogari dhe periudhën për të parë kartelën.</p>
        </div>
        <div class="report-actions-bar" style="margin-top: 1.5rem; justify-content: flex-end;">
            <button id="export-account-ledger-pdf-btn" class="btn btn-info" disabled><span class="icon">📄</span> Eksporto PDF</button>
            <button id="print-account-ledger-btn" class="btn btn-primary" disabled><span class="icon">🖨️</span> Shtyp Kartelën</button>
        </div>
    `;

    initAccountLedgerEventListeners();
    
    const accountSelect = document.getElementById('account-ledger-account-select') as HTMLSelectElement;
    const startDateInput = document.getElementById('account-ledger-start-date') as HTMLInputElement;
    const endDateInput = document.getElementById('account-ledger-end-date') as HTMLInputElement;

    populateAccountLedgerAccountSelect(accountSelect);
    
    const today = getTodayDateString();
    startDateInput.value = today;
    endDateInput.value = today;

    if (state.preselectedAccountIdForLedger) {
        accountSelect.value = state.preselectedAccountIdForLedger;
        state.setPreselectedAccountIdForLedger(null); // Consume it
        handleGenerateAccountLedger(); // Automatically generate
    }
}

export function initAccountLedgerEventListeners(): void {
    document.getElementById('generate-account-ledger-btn')?.addEventListener('click', handleGenerateAccountLedger);
    document.getElementById('export-account-ledger-pdf-btn')?.addEventListener('click', () => handleExportAccountLedger('pdf'));
    document.getElementById('print-account-ledger-btn')?.addEventListener('click', () => handleExportAccountLedger('print'));
}

function populateAccountLedgerAccountSelect(selectEl: HTMLSelectElement): void {
    selectEl.innerHTML = '<option value="">-- Zgjidh Llogarinë --</option>';
    state.accounts
        .sort((a,b) => a.accountNumber.localeCompare(b.accountNumber))
        .forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.accountNumber} - ${account.name}`;
            selectEl.appendChild(option);
        });
}

function handleGenerateAccountLedger(): void {
    const accountSelect = document.getElementById('account-ledger-account-select') as HTMLSelectElement;
    const startDateInput = document.getElementById('account-ledger-start-date') as HTMLInputElement;
    const endDateInput = document.getElementById('account-ledger-end-date') as HTMLInputElement;
    const contentArea = document.getElementById('account-ledger-content-area');

    if (!accountSelect || !startDateInput || !endDateInput || !contentArea) return;

    const accountId = accountSelect.value;
    const startDateStr = startDateInput.value;
    const endDateStr = endDateInput.value;

    if (!accountId) { contentArea.innerHTML = '<p class="error-message">Ju lutem zgjidhni një llogari.</p>'; return; }
    if (!startDateStr || !endDateStr) { contentArea.innerHTML = '<p class="error-message">Ju lutem zgjidhni periudhën e datave.</p>'; return; }

    const account = state.accounts.find(a => a.id === accountId);
    if (!account) { contentArea.innerHTML = '<p class="error-message">Llogaria nuk u gjet.</p>'; return; }

    contentArea.innerHTML = '<p class="loading-message">Duke gjeneruar kartelën...</p>';

    const startDate = new Date(startDateStr + "T00:00:00").getTime();
    const endDate = new Date(endDateStr + "T23:59:59").getTime();

    let balanceBeforePeriod = 0;
    state.journalEntries
        .filter(entry => new Date(entry.date + "T00:00:00").getTime() < startDate)
        .forEach(entry => {
            entry.lines.forEach(line => {
                if (line.accountId === accountId) {
                    balanceBeforePeriod += (line.debit - line.credit);
                }
            });
        });

    const ledgerEntries: LedgerEntry[] = [];
    state.journalEntries
        .filter(entry => {
            const entryDate = new Date(entry.date + "T00:00:00").getTime();
            return entryDate >= startDate && entryDate <= endDate;
        })
        .forEach(entry => {
            entry.lines.forEach(line => {
                if (line.accountId === accountId) {
                    ledgerEntries.push({
                        date: entry.timestamp,
                        displayDate: new Date(entry.date + "T00:00:00").toLocaleDateString('sq-AL'),
                        description: line.description || entry.description,
                        documentNumber: entry.id,
                        debit: line.debit,
                        credit: line.credit,
                        balance: 0
                    });
                }
            });
        });

    ledgerEntries.sort((a, b) => a.date - b.date);

    let currentBalance = balanceBeforePeriod;
    ledgerEntries.forEach(entry => {
        currentBalance += (entry.debit - entry.credit);
        entry.balance = currentBalance;
    });

    renderAccountLedgerTable(ledgerEntries, balanceBeforePeriod, account);

    const exportPdfBtn = document.getElementById('export-account-ledger-pdf-btn') as HTMLButtonElement | null;
    const printBtn = document.getElementById('print-account-ledger-btn') as HTMLButtonElement | null;
    const hasData = ledgerEntries.length > 0 || balanceBeforePeriod !== 0;
    if (exportPdfBtn) exportPdfBtn.disabled = !hasData;
    if (printBtn) printBtn.disabled = !hasData;
}

function renderAccountLedgerTable(entries: LedgerEntry[], initialBalance: number, account: Account): void {
    const contentArea = document.getElementById('account-ledger-content-area');
    if (!contentArea) return;

    const startDateVal = (document.getElementById('account-ledger-start-date') as HTMLInputElement)?.value;
    const endDateVal = (document.getElementById('account-ledger-end-date') as HTMLInputElement)?.value;
    const periodDisplay = `${new Date(startDateVal).toLocaleDateString('sq-AL')} - ${new Date(endDateVal).toLocaleDateString('sq-AL')}`;

    const reportTitle = "KARTELA E LLOGARISË";
    const subTitle = `Llogaria: <strong>${account.accountNumber} - ${account.name}</strong>`;
    const headerHtml = generateReportHeaderHTML(reportTitle, `Periudha: ${periodDisplay} <br> ${subTitle}`);

    let tableRowsHtml = `
        <tr>
            <td>-</td>
            <td colspan="2"><strong>Balanca Fillestare e Periudhës</strong></td>
            <td class="text-right">-</td>
            <td class="text-right">-</td>
            <td class="text-right"><strong>${initialBalance.toFixed(2)}</strong></td>
        </tr>
    `;

    if (entries.length === 0) {
        tableRowsHtml += `<tr><td colspan="6" class="text-center">Nuk ka lëvizje për këtë llogari në periudhën e zgjedhur.</td></tr>`;
    } else {
        entries.forEach(entry => {
            tableRowsHtml += `
                <tr>
                    <td>${entry.displayDate}</td>
                    <td>${entry.documentNumber}</td>
                    <td>${entry.description}</td>
                    <td class="text-right">${entry.debit > 0 ? entry.debit.toFixed(2) : '-'}</td>
                    <td class="text-right">${entry.credit > 0 ? entry.credit.toFixed(2) : '-'}</td>
                    <td class="text-right">${entry.balance.toFixed(2)}</td>
                </tr>
            `;
        });
    }

    const tableHtml = `<div class="report-table-container">
        <table class="admin-table account-ledger-table">
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Nr. Dokumentit</th>
                    <th>Përshkrimi</th>
                    <th class="text-right">Debi (€)</th>
                    <th class="text-right">Kredi (€)</th>
                    <th class="text-right">Balanca (€)</th>
                </tr>
            </thead>
            <tbody>${tableRowsHtml}</tbody>
        </table>
    </div>`;

    contentArea.innerHTML = `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

function handleExportAccountLedger(format: 'pdf' | 'print') {
    const accountSelect = document.getElementById('account-ledger-account-select') as HTMLSelectElement;
    const contentArea = document.getElementById('account-ledger-content-area');
    if (!contentArea || !accountSelect) return;
    
    const accountId = accountSelect.value;
    const account = state.accounts.find(a => a.id === accountId);
    if (!account) { alert("Zgjidhni një llogari së pari."); return; }

    const contentToPrint = contentArea.querySelector('.printable-area');
    if (!contentToPrint || contentToPrint.innerHTML.includes("Nuk ka lëvizje")) {
        alert("Nuk ka të dhëna për të eksportuar/printuar.");
        return;
    }
    
    const reportTitle = `Kartela e Llogarisë - ${account.name}`;
    if (dom.printPreviewContent && dom.printPreviewModalTitle) {
        dom.printPreviewContent.innerHTML = contentToPrint.innerHTML;
        dom.printPreviewModalTitle.textContent = format === 'pdf' ? `Pamje PDF: ${reportTitle}` : `Shtyp: ${reportTitle}`;
        openPrintPreviewModal();
        if (format === 'pdf') {
            alert("Për të ruajtur si PDF, zgjidhni 'Ruaj si PDF' ose 'Save as PDF' nga dialogu i printimit.");
        }
    }
}
