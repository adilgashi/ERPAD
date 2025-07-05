/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { PayrollEntry, Employee } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import { showCustomConfirm, isAnyOtherModalOrDropdownActive, openPrintPreviewModal } from '../core/ui';

export function initPayrollManagementEventListeners(): void {
    // Event listeners are attached in initPayrollManagementView
}

export function initPayrollManagementView(viewName: string, targetContainer: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container for payroll management not found.");
        return;
    }

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Menaxhimi i Pagave</h2>
        <div class="report-filters-dynamic" id="payroll-filters-area">
            <div class="form-group filter-group">
                <label for="payroll-period-input">Zgjidh Periudhën (Muaj/Vit):</label>
                <input type="month" id="payroll-period-input" class="form-control" value="${currentMonth}">
            </div>
            <button id="generate-payroll-btn" class="btn btn-primary">Gjenero Pagat</button>
        </div>
        <div class="table-responsive" style="margin-top: 1.5rem;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>ID Pagese</th>
                        <th>Punonjësi</th>
                        <th>Periudha</th>
                        <th class="text-right">Paga Bruto (€)</th>
                        <th class="text-right">Zbritjet Totale (€)</th>
                        <th class="text-right">Pagesa Finale (€)</th>
                        <th>Statusi</th>
                        <th>Veprime</th>
                    </tr>
                </thead>
                <tbody id="payroll-results-tbody">
                    <tr><td colspan="8" class="text-center">Zgjidhni një periudhë dhe shtypni "Gjenero Pagat".</td></tr>
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('payroll-period-input')?.addEventListener('change', renderPayrollResults);
    document.getElementById('generate-payroll-btn')?.addEventListener('click', handleGeneratePayroll);
    document.getElementById('payroll-results-tbody')?.addEventListener('click', handlePayrollTableActions);
    renderPayrollResults();
}

function handlePayrollTableActions(event: Event) {
    const target = event.target as HTMLElement;
    const viewBtn = target.closest<HTMLButtonElement>('.view-payslip-btn');
    if (viewBtn) {
        const entryId = viewBtn.dataset.entryId;
        if (entryId) {
            openPayslipDetailsModal(entryId);
        }
    }
}

function renderPayrollResults(): void {
    const tbody = document.getElementById('payroll-results-tbody') as HTMLTableSectionElement | null;
    const periodInput = document.getElementById('payroll-period-input') as HTMLInputElement | null;
    if (!tbody || !periodInput) return;

    const [year, month] = periodInput.value.split('-').map(Number);
    if (!year || !month) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Ju lutem zgjidhni një periudhë valide.</td></tr>';
        return;
    }

    const entriesForPeriod = state.payrollEntries.filter(p => p.periodYear === year && p.periodMonth === month);
    tbody.innerHTML = '';
    if (entriesForPeriod.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">Nuk ka të dhëna page për periudhën e zgjedhur. Klikoni "Gjenero Pagat".</td></tr>`;
        return;
    }

    entriesForPeriod.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${entry.id}</td>
            <td>${entry.employeeName}</td>
            <td>${String(entry.periodMonth).padStart(2, '0')}/${entry.periodYear}</td>
            <td class="text-right">${entry.grossSalary.toFixed(2)}</td>
            <td class="text-right">${entry.totalDeductions.toFixed(2)}</td>
            <td class="text-right strong">${entry.netSalary.toFixed(2)}</td>
            <td><span class="status-badge ${entry.status === 'Finalized' ? 'active' : ''}">${entry.status}</span></td>
            <td>
                <button class="btn btn-sm btn-info view-payslip-btn" data-entry-id="${entry.id}">Detajet</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function handleGeneratePayroll(): void {
    const periodInput = document.getElementById('payroll-period-input') as HTMLInputElement | null;
    if (!periodInput || !state.currentManagingBusinessId) return;

    const [year, month] = periodInput.value.split('-').map(Number);
    if (!year || !month) {
        alert("Ju lutem zgjidhni një periudhë valide.");
        return;
    }
    
    const activeEmployees = state.employees.filter(emp => emp.status === 'Aktiv');
    if (activeEmployees.length === 0) {
        alert("Nuk ka punonjës aktivë për të gjeneruar pagat.");
        return;
    }

    const newPayrollEntries: PayrollEntry[] = [];
    let business = state.businesses.find(b => b.id === state.currentManagingBusinessId)!;
    let payrollSeed = business.payrollEntryIdSeed || 1;

    activeEmployees.forEach(employee => {
        const baseSalary = employee.salary || 0;
        const additions = employee.recurringAdditions || [];
        const deductions = employee.recurringDeductions || [];

        const grossSalary = baseSalary + additions.reduce((sum, item) => sum + item.amount, 0);
        const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
        const netSalary = grossSalary - totalDeductions;
        
        const newEntry: PayrollEntry = {
            id: `PAY-${year}-${String(month).padStart(2, '0')}-${payrollSeed++}`,
            businessId: state.currentManagingBusinessId!,
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            periodMonth: month,
            periodYear: year,
            baseSalary,
            additions,
            deductions,
            grossSalary,
            totalDeductions,
            netSalary,
            runAt: Date.now(),
            status: 'Draft'
        };
        newPayrollEntries.push(newEntry);
    });

    const confirmAction = () => {
        // Remove existing draft entries for this period
        state.setPayrollEntries(state.payrollEntries.filter(p => !(p.periodYear === year && p.periodMonth === month && p.status === 'Draft')));
        // Add new entries
        state.payrollEntries.push(...newPayrollEntries);
        // Update seed
        business.payrollEntryIdSeed = payrollSeed;
        storage.saveAllBusinesses(state.businesses);
        storage.savePayrollEntries(state.currentManagingBusinessId!, state.payrollEntries);
        alert(`U gjeneruan ${newPayrollEntries.length} listëpagesa për periudhën ${month}/${year}.`);
        renderPayrollResults();
    }
    
    const existingDraft = state.payrollEntries.some(p => p.periodYear === year && p.periodMonth === month && p.status === 'Draft');
    if (existingDraft) {
        showCustomConfirm("Listëpagesa Draft ekziston për këtë periudhë. Dëshironi ta mbishkruani?", confirmAction);
    } else {
        confirmAction();
    }
}

function openPayslipDetailsModal(entryId: string): void {
    const modal = document.getElementById('payslip-details-modal') as HTMLDivElement | null;
    const contentDiv = document.getElementById('payslip-details-printable-content') as HTMLDivElement | null;
    const titleEl = document.getElementById('payslip-details-modal-title') as HTMLHeadingElement | null;
    const printBtn = document.getElementById('payslip-details-print-btn') as HTMLButtonElement | null;

    if (!modal || !contentDiv || !titleEl || !printBtn) return;
    
    const entry = state.payrollEntries.find(p => p.id === entryId);
    if (!entry) { alert("Fletëpagesa nuk u gjet."); return; }
    
    titleEl.textContent = `Fletëpagesa për ${entry.employeeName} (${String(entry.periodMonth).padStart(2, '0')}/${entry.periodYear})`;
    printBtn.dataset.entryId = entryId;

    contentDiv.innerHTML = generatePayslipHTML(entry);
    
    modal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');

    document.getElementById('payslip-details-close-action-btn')?.addEventListener('click', closePayslipDetailsModal);
    document.getElementById('payslip-details-modal-close-btn')?.addEventListener('click', closePayslipDetailsModal);
    printBtn.onclick = () => handlePrintPayslip(entryId);
}

function closePayslipDetailsModal(): void {
    const modal = document.getElementById('payslip-details-modal');
    if(modal) {
        modal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('payslipDetailsModal')) {
             dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

function generatePayslipHTML(entry: PayrollEntry): string {
    const businessDetails = state.businessDetails;
    const additionsHtml = entry.additions.map(item => `<tr><td>${item.description}</td><td class="text-right">${item.amount.toFixed(2)}</td></tr>`).join('');
    const deductionsHtml = entry.deductions.map(item => `<tr><td>${item.description}</td><td class="text-right">${item.amount.toFixed(2)}</td></tr>`).join('');

    return `
        <div class="payslip-container">
            <header class="payslip-header">
                <div class="payslip-logo">
                    ${businessDetails?.logoUrl ? `<img src="${businessDetails.logoUrl}" alt="Logo">` : `<h2>${businessDetails?.name || ''}</h2>`}
                </div>
                <div class="payslip-company-details">
                    <p>${businessDetails?.name || ''}</p>
                    <p>${businessDetails?.address || ''}</p>
                    <p>NIPT: ${businessDetails?.nipt || ''}</p>
                </div>
            </header>
            <h1 class="payslip-title">FLETËPAGESA</h1>
            <div class="payslip-employee-details">
                <div>
                    <p><strong>Punonjësi:</strong> ${entry.employeeName}</p>
                    <p><strong>ID Punonjësi:</strong> ${entry.employeeId}</p>
                </div>
                <div>
                    <p><strong>Periudha:</strong> ${String(entry.periodMonth).padStart(2, '0')}/${entry.periodYear}</p>
                    <p><strong>Data e Lëshimit:</strong> ${new Date(entry.runAt).toLocaleDateString('sq-AL')}</p>
                </div>
            </div>
            <div class="payslip-body">
                <div class="payslip-section">
                    <h4>Paga dhe Shtesat</h4>
                    <table>
                        <tr><td>Paga Bazë Bruto</td><td class="text-right">${entry.baseSalary.toFixed(2)}</td></tr>
                        ${additionsHtml}
                        <tr class="total-row"><td><strong>Paga Bruto Totale</strong></td><td class="text-right"><strong>${entry.grossSalary.toFixed(2)}</strong></td></tr>
                    </table>
                </div>
                <div class="payslip-section">
                    <h4>Zbritjet</h4>
                    <table>
                        ${deductionsHtml || '<tr><td colspan="2">Nuk ka zbritje.</td></tr>'}
                        <tr class="total-row"><td><strong>Zbritjet Totale</strong></td><td class="text-right"><strong>${entry.totalDeductions.toFixed(2)}</strong></td></tr>
                    </table>
                </div>
            </div>
            <div class="payslip-summary">
                <p><span>PAGA FINALE (NETO):</span> <span class="final-amount">${entry.netSalary.toFixed(2)} €</span></p>
            </div>
            <footer class="payslip-footer">
                <div class="signature-area"><p>Nënshkrimi i Punonjësit</p></div>
                <div class="signature-area"><p>Nënshkrimi i Kompanisë</p></div>
            </footer>
        </div>
    `;
}

function handlePrintPayslip(entryId: string): void {
    const entry = state.payrollEntries.find(p => p.id === entryId);
    if (!entry) return;

    const contentToPrint = generatePayslipHTML(entry);
    const reportTitle = `Fletëpagesa - ${entry.employeeName} - ${entry.periodMonth}/${entry.periodYear}`;
    
    // Add specific payslip styles for printing
    const payslipStyles = `
        .payslip-container { font-family: 'Segoe UI', sans-serif; color: #333; }
        .payslip-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .payslip-logo img { max-width: 150px; max-height: 70px; }
        .payslip-company-details { text-align: right; font-size: 0.9em; }
        .payslip-title { text-align: center; font-size: 1.5em; margin-bottom: 20px; letter-spacing: 2px; }
        .payslip-employee-details { display: flex; justify-content: space-between; margin-bottom: 20px; background: #f9f9f9; padding: 10px; border-radius: 5px; }
        .payslip-body { display: flex; gap: 20px; justify-content: space-between; }
        .payslip-section { flex: 1; }
        .payslip-section h4 { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
        .payslip-section table { width: 100%; border-collapse: collapse; }
        .payslip-section td { padding: 8px 5px; border-bottom: 1px dotted #eee; }
        .payslip-section .total-row { font-weight: bold; background: #f0f0f0; }
        .text-right { text-align: right; }
        .payslip-summary { text-align: right; margin-top: 20px; padding-top: 10px; border-top: 2px solid #333; }
        .payslip-summary span { font-size: 1.2em; font-weight: bold; }
        .payslip-summary .final-amount { font-size: 1.4em; }
        .payslip-footer { display: flex; justify-content: space-around; margin-top: 50px; }
        .signature-area { border-top: 1px solid #333; width: 40%; text-align: center; padding-top: 5px; font-size: 0.8em; }
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`<html><head><title>${reportTitle}</title><style>${payslipStyles}</style></head><body>${contentToPrint}</body></html>`);
    printWindow?.document.close();
    printWindow?.print();
}