/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../../core/dom';
import * as state from '../../core/state';
import * as ui from '../../core/ui';
import * as toast from '../../core/toast';
import { getTodayDateString } from '../../core/utils';
import { openPrintPreviewModal } from '../../core/ui';

export function initProfitAndLossReport(container: HTMLElement): void {
  container.innerHTML = `
    <h2 class="manager-section-title">Pasqyra e të Ardhurave dhe Shpenzimeve (P&L)</h2>
    <div class="report-filters-dynamic" id="pnl-filters">
      <div class="form-group filter-group">
        <label for="pnl-start-date">Nga Data:</label>
        <input type="date" id="pnl-start-date" class="form-control" value="${getTodayDateString()}">
      </div>
      <div class="form-group filter-group">
        <label for="pnl-end-date">Deri më Datë:</label>
        <input type="date" id="pnl-end-date" class="form-control" value="${getTodayDateString()}">
      </div>
      <button id="generate-pnl-btn" class="btn btn-primary">Gjenero Raportin</button>
    </div>
    <div id="pnl-content" class="report-content" style="margin-top: 1.5rem;">
      <p class="text-center info-message info">Zgjidhni një periudhë dhe gjeneroni raportin.</p>
    </div>
    <div class="report-actions-bar" style="margin-top: 1.5rem; justify-content: flex-end;">
      <button id="export-pnl-pdf-btn" class="btn btn-info" disabled><span class="icon">📄</span> Eksporto PDF</button>
      <button id="print-pnl-btn" class="btn btn-primary" disabled><span class="icon">🖨️</span> Shtyp Raportin</button>
    </div>
  `;

  // Attach event listeners
  document.getElementById('generate-pnl-btn')?.addEventListener('click', handleGenerateProfitAndLoss);
  document.getElementById('export-pnl-pdf-btn')?.addEventListener('click', () => handleExportProfitAndLoss('pdf'));
  document.getElementById('print-pnl-btn')?.addEventListener('click', () => handleExportProfitAndLoss('print'));
}

function handleGenerateProfitAndLoss(): void {
  const startDateInput = document.getElementById('pnl-start-date') as HTMLInputElement;
  const endDateInput = document.getElementById('pnl-end-date') as HTMLInputElement;
  const contentArea = document.getElementById('pnl-content') as HTMLDivElement;
  const exportPdfBtn = document.getElementById('export-pnl-pdf-btn') as HTMLButtonElement;
  const printBtn = document.getElementById('print-pnl-btn') as HTMLButtonElement;
  
  if (!startDateInput || !endDateInput || !contentArea) {
    toast.showErrorToast("Elementet e nevojshme të raportit nuk u gjetën.");
    return;
  }
  
  const reportDateStart = startDateInput.value;
  const reportDateEnd = endDateInput.value;
  
  if (!reportDateStart || !reportDateEnd) {
    toast.showWarningToast("Ju lutem zgjidhni një periudhë të plotë datash.");
    return;
  }
  
  if (new Date(reportDateStart) > new Date(reportDateEnd)) {
    toast.showErrorToast("Data e fillimit nuk mund të jetë pas datës së mbarimit.");
    return;
  }
  
  contentArea.innerHTML = '<p class="loading-message">Duke gjeneruar raportin...</p>';
  
  try {
    renderProfitAndLossReport(reportDateStart, reportDateEnd, contentArea);
    
    // Enable export/print buttons
    if (exportPdfBtn) exportPdfBtn.disabled = false;
    if (printBtn) printBtn.disabled = false;
    
    toast.showSuccessToast("Raporti u gjenerua me sukses.");
  } catch (error) {
    console.error("Error generating P&L report:", error);
    contentArea.innerHTML = '<p class="error-message">Ndodhi një gabim gjatë gjenerimit të raportit.</p>';
    toast.showErrorToast("Ndodhi një gabim gjatë gjenerimit të raportit.");
    
    // Disable export/print buttons
    if (exportPdfBtn) exportPdfBtn.disabled = true;
    if (printBtn) printBtn.disabled = true;
  }
}

function renderProfitAndLossReport(startDateStr: string, endDateStr: string, container: HTMLElement): void {
  const reportTitle = "PASQYRA E TË ARDHURAVE DHE SHPENZIMEVE (P&L)";
  const period = `${new Date(startDateStr + "T00:00:00").toLocaleDateString('sq-AL')} - ${new Date(endDateStr + "T00:00:00").toLocaleDateString('sq-AL')}`;
  const headerHtml = ui.generateReportHeaderHTML(reportTitle, `Periudha: ${period}`);

  const startDate = new Date(startDateStr + "T00:00:00");
  const endDate = new Date(endDateStr + "T23:59:59");

  const accountPeriodChanges = new Map<string, number>();

  // Process journal entries within the date range
  state.journalEntries
    .filter(entry => {
      const entryDate = new Date(entry.date + "T00:00:00");
      return entryDate >= startDate && entryDate <= endDate;
    })
    .forEach(entry => {
      entry.lines.forEach(line => {
        const currentChange = accountPeriodChanges.get(line.accountId) || 0;
        const change = line.credit - line.debit; // Credit increases revenue, debit increases expenses
        accountPeriodChanges.set(line.accountId, currentChange + change);
      });
    });

  // Generate revenue section
  let revenueHtml = '';
  let totalRevenue = 0;
  const revenueAccounts = state.accounts.filter(acc => acc.type === 'Revenue').sort((a,b) => a.accountNumber.localeCompare(b.accountNumber));
  
  revenueAccounts.forEach(acc => {
    const change = accountPeriodChanges.get(acc.id) || 0;
    if (change !== 0) {
      totalRevenue += change;
      revenueHtml += `<tr><td>${acc.accountNumber} - ${acc.name}</td><td class="text-right">${change.toFixed(2)}</td></tr>`;
    }
  });

  // Generate expense section
  let expenseHtml = '';
  let totalExpenses = 0;
  const expenseAccounts = state.accounts.filter(acc => acc.type === 'Expense').sort((a,b) => a.accountNumber.localeCompare(b.accountNumber));

  expenseAccounts.forEach(acc => {
    const change = accountPeriodChanges.get(acc.id) || 0;
    const expenseAmount = -change; // Expenses are debits, so we negate the change
    if (expenseAmount !== 0) {
      totalExpenses += expenseAmount;
      expenseHtml += `<tr><td>${acc.accountNumber} - ${acc.name}</td><td class="text-right">${expenseAmount.toFixed(2)}</td></tr>`;
    }
  });
  
  // Calculate net income
  const netIncome = totalRevenue - totalExpenses;
  const netIncomeClass = netIncome >= 0 ? 'cash-value positive' : 'cash-value negative';

  // Build the report HTML
  const tableHtml = `
    <div class="report-table-container">
      <h3 class="section-subtitle" style="margin-top: 1.5rem;">Të Ardhurat</h3>
      <table class="admin-table">
        <thead><tr><th>Llogaria</th><th class="text-right">Shuma (€)</th></tr></thead>
        <tbody>${revenueHtml || `<tr><td colspan="2" class="text-center">Nuk ka të ardhura për periudhën e zgjedhur.</td></tr>`}</tbody>
        <tfoot><tr class="grand-total-row"><td class="text-right"><strong>TOTALI I TË ARDHURAVE:</strong></td><td class="text-right"><strong>${totalRevenue.toFixed(2)} €</strong></td></tr></tfoot>
      </table>

      <h3 class="section-subtitle" style="margin-top: 1.5rem;">Shpenzimet</h3>
      <table class="admin-table">
        <thead><tr><th>Llogaria</th><th class="text-right">Shuma (€)</th></tr></thead>
        <tbody>${expenseHtml || `<tr><td colspan="2" class="text-center">Nuk ka shpenzime për periudhën e zgjedhur.</td></tr>`}</tbody>
        <tfoot><tr class="grand-total-row"><td class="text-right"><strong>TOTALI I SHPENZIMEVE:</strong></td><td class="text-right"><strong>${totalExpenses.toFixed(2)} €</strong></td></tr></tfoot>
      </table>
    </div>
    <div class="report-summary" style="text-align: right; margin-top: 1rem; border-top: 2px solid #333; padding-top: 1rem;">
      <p style="font-size: 1.2rem;"><strong>FITIMI / HUMBJA NETO: <span class="${netIncomeClass}" style="font-size: 1.3em;">${netIncome.toFixed(2)} €</span></strong></p>
    </div>
  `;

  container.innerHTML = `<div class="printable-area">${headerHtml}${tableHtml}${ui.generateReportFooterHTML()}</div>`;
}

function handleExportProfitAndLoss(format: 'pdf' | 'print'): void {
  const contentArea = document.getElementById('pnl-content');
  const startDateInput = document.getElementById('pnl-start-date') as HTMLInputElement;
  const endDateInput = document.getElementById('pnl-end-date') as HTMLInputElement;
  
  if (!contentArea || !startDateInput || !endDateInput) {
    toast.showErrorToast("Elementet e nevojshme të raportit nuk u gjetën.");
    return;
  }
  
  const contentToPrint = contentArea.querySelector('.printable-area');
  if (!contentToPrint || contentToPrint.innerHTML.includes("Zgjidhni një periudhë") || contentToPrint.innerHTML.includes("Duke gjeneruar")) {
    toast.showWarningToast("Nuk ka të dhëna për të eksportuar/printuar. Gjeneroni raportin së pari.");
    return;
  }
  
  const startDate = new Date(startDateInput.value + "T00:00:00").toLocaleDateString('sq-AL');
  const endDate = new Date(endDateInput.value + "T00:00:00").toLocaleDateString('sq-AL');
  const reportTitle = `Pasqyra e të Ardhurave dhe Shpenzimeve (${startDate} - ${endDate})`;
  
  if (dom.printPreviewContent && dom.printPreviewModalTitle) {
    dom.printPreviewContent.innerHTML = contentToPrint.innerHTML;
    dom.printPreviewModalTitle.textContent = format === 'pdf' ? `Pamje PDF: ${reportTitle}` : `Shtyp: ${reportTitle}`;
    openPrintPreviewModal();
    
    if (format === 'pdf') {
      toast.showInfoToast("Për të ruajtur si PDF, zgjidhni 'Ruaj si PDF' ose 'Save as PDF' nga dialogu i printimit.");
    }
  }
}