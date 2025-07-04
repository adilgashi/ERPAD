

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { Account, AccountType, JournalEntry, JournalEntryLine, AccountingSettings } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import { showCustomConfirm, isAnyOtherModalOrDropdownActive, generateReportHeaderHTML, generateReportFooterHTML } from '../core/ui';
import { setActiveManagerView } from './index';
import { isDateInClosedPeriod, calculatePeriodPnL } from './accountingUtils';

let currentEditingAccountId: string | null = null;

const accountTypeToAlbanian: Record<AccountType, string> = {
    'Asset': 'Pasuri (Asete)',
    'Liability': 'Detyrim',
    'Equity': 'Kapital',
    'Revenue': 'Të ardhura',
    'Expense': 'Shpenzim'
};

// Wrapper function to fix event listener signature mismatch
function handleOpenJournalEntryModal() {
    openJournalEntryFormModal();
}

// --- CHART OF ACCOUNTS (Plani Kontabël) ---

export function showChartOfAccountsPanel(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Chart of Accounts panel.");
        return;
    }
    const panel = dom.managerContentChartOfAccounts;
    if (panel) {
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        renderChartOfAccounts();
    } else {
        targetContainer.innerHTML = '<p class="error-message">Paneli i Planit Kontabël nuk u gjet.</p>';
    }
}

function renderChartOfAccounts(): void {
    const tbody = dom.chartOfAccountsTbody;
    if (!tbody) { return; }
    tbody.innerHTML = '';
    const accounts = state.accounts;
    const accountTypes: AccountType[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'];

    if (accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nuk ka llogari të regjistruara.</td></tr>';
        return;
    }

    accountTypes.forEach(type => {
        const accountsOfType = accounts.filter(acc => acc.type === type).sort((a, b) => a.accountNumber.localeCompare(b.accountNumber));
        if (accountsOfType.length > 0) {
            const headerRow = document.createElement('tr');
            const typeName = accountTypeToAlbanian[type] || type;
            headerRow.innerHTML = `<th colspan="4" style="background-color: #e9ecef; color: #495057; text-align: left; padding-left: 1rem;">${typeName}</th>`;
            tbody.appendChild(headerRow);

            accountsOfType.forEach(account => {
                const tr = document.createElement('tr');
                tr.dataset.accountId = account.id;
                tr.innerHTML = `
                    <td><a href="#" class="account-ledger-link" data-account-id="${account.id}">${account.accountNumber}</a></td>
                    <td><a href="#" class="account-ledger-link" data-account-id="${account.id}">${account.name}</a></td>
                    <td>${account.description || '-'}</td>
                    <td class="text-center">
                        <button class="btn btn-warning btn-sm" data-account-id="${account.id}">Modifiko</button>
                        <button class="btn btn-danger btn-sm" data-account-id="${account.id}" ${account.isSystemAccount ? 'disabled title="Llogaritë e sistemit nuk mund të fshihen"' : ''}>Fshij</button>
                    </td>
                `;
                tr.querySelectorAll<HTMLAnchorElement>('.account-ledger-link').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const accId = link.dataset.accountId;
                        if (accId) {
                            state.setPreselectedAccountIdForLedger(accId);
                            setActiveManagerView('accountLedger', `Kartela: ${account.name}`, 'accountLedger');
                        }
                    });
                });
                tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openAccountFormModal(account.id));
                tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteAccount(account.id, account.name));
                tbody.appendChild(tr);
            });
        }
    });
}

function openAccountFormModal(accountId?: string): void {
    const modal = dom.accountFormModal;
    const form = dom.accountForm;
    const titleEl = dom.accountFormModalTitle;

    if (!modal || !form || !titleEl || !dom.accountFormTypeSelect) return;
    
    form.reset();
    currentEditingAccountId = accountId || null;
    if(dom.accountFormErrorElement) dom.accountFormErrorElement.textContent = '';
    
    dom.accountFormTypeSelect.innerHTML = '';
    (Object.keys(accountTypeToAlbanian) as AccountType[]).forEach(typeKey => {
        const option = document.createElement('option');
        option.value = typeKey;
        option.textContent = accountTypeToAlbanian[typeKey];
        dom.accountFormTypeSelect?.appendChild(option);
    });
    
    if (accountId) {
        titleEl.textContent = "Modifiko Llogarinë";
        const account = state.accounts.find(acc => acc.id === accountId);
        if (account) {
            if(dom.editAccountIdInput) dom.editAccountIdInput.value = account.id;
            if(dom.accountFormNumberInput) dom.accountFormNumberInput.value = account.accountNumber;
            if(dom.accountFormNameInput) dom.accountFormNameInput.value = account.name;
            if(dom.accountFormTypeSelect) dom.accountFormTypeSelect.value = account.type;
            if(dom.accountFormDescriptionTextarea) dom.accountFormDescriptionTextarea.value = account.description || '';
            if(dom.accountFormIsSystemCheckbox) {
                dom.accountFormIsSystemCheckbox.checked = !!account.isSystemAccount;
                dom.accountFormIsSystemCheckbox.disabled = !!account.isSystemAccount;
            }
        } else {
             if(dom.accountFormErrorElement) dom.accountFormErrorElement.textContent = "Llogaria nuk u gjet.";
            return;
        }
    } else {
        titleEl.textContent = "Shto Llogari të Re";
        if(dom.editAccountIdInput) dom.editAccountIdInput.value = '';
        if(dom.accountFormIsSystemCheckbox) dom.accountFormIsSystemCheckbox.disabled = false;
    }

    modal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function closeAccountFormModal(): void {
    const modal = dom.accountFormModal;
    if (modal) {
        modal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('accountFormModal')) {
             dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

async function handleSaveAccount(event: Event): Promise<void> {
    event.preventDefault();
    const form = dom.accountForm;
    if (!form || !state.currentManagingBusinessId) return;

    const formData = new FormData(form);
    const id = formData.get('editAccountId') as string;
    const accountNumber = formData.get('accountNumber') as string;
    const name = formData.get('name') as string;
    const type = formData.get('accountType') as AccountType;
    const description = formData.get('description') as string;
    const isSystemAccount = (formData.get('isSystemAccount') as string) === 'on';
    
    if(!accountNumber || !name || !type) {
        if(dom.accountFormErrorElement) dom.accountFormErrorElement.textContent = "Numri, Emri, dhe Tipi i llogarisë janë të detyrueshme.";
        return;
    }
    
    const existingAccount = state.accounts.find(acc => acc.accountNumber === accountNumber && acc.id !== id);
    if (existingAccount) {
        if(dom.accountFormErrorElement) dom.accountFormErrorElement.textContent = "Një llogari me këtë numër ekziston tashmë.";
        return;
    }

    if (id) {
        const accountToEdit = state.accounts.find(acc => acc.id === id);
        if (accountToEdit && accountToEdit.isSystemAccount && type !== accountToEdit.type) {
             if(dom.accountFormErrorElement) dom.accountFormErrorElement.textContent = "Tipi i një llogarie sistemi nuk mund të ndryshohet.";
             return;
        }
        const accountIndex = state.accounts.findIndex(acc => acc.id === id);
        if (accountIndex > -1) {
            state.accounts[accountIndex] = { ...state.accounts[accountIndex], accountNumber, name, type, description, isSystemAccount };
        }
    } else {
        const newAccount: Account = { id: generateUniqueId('acc-'), businessId: state.currentManagingBusinessId, accountNumber, name, type, description, isSystemAccount, balance: 0 };
        state.accounts.push(newAccount);
    }
    
    await storage.saveAccounts(state.currentManagingBusinessId, state.accounts);
    renderChartOfAccounts();
    closeAccountFormModal();
}

function handleDeleteAccount(accountId: string, accountName: string): void {
    const account = state.accounts.find(acc => acc.id === accountId);
    if (account?.isSystemAccount) {
        alert("Llogaritë e sistemit nuk mund të fshihen.");
        return;
    }
    
    showCustomConfirm(`Jeni i sigurt që doni të fshini llogarinë "${accountName}" (${account?.accountNumber})?`, async () => {
        if (!state.currentManagingBusinessId) return;
        state.setAccounts(state.accounts.filter(acc => acc.id !== accountId));
        await storage.saveAccounts(state.currentManagingBusinessId, state.accounts);
        renderChartOfAccounts();
    });
}

// --- GENERAL LEDGER (Libri i Përgjithshëm) ---

export function showGeneralLedgerPanel(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for General Ledger panel.");
        return;
    }
    const panel = dom.managerContentGeneralLedger;
    if (panel) {
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        renderGeneralLedger();
        
        dom.showAddJournalEntryModalBtn?.removeEventListener('click', handleOpenJournalEntryModal);
        dom.showAddJournalEntryModalBtn?.addEventListener('click', handleOpenJournalEntryModal);

    } else {
        targetContainer.innerHTML = '<p class="error-message">Paneli i Librit të Madh nuk u gjet.</p>';
    }
}

function renderGeneralLedger(): void {
    const tbody = dom.generalLedgerTbody;
    if(!tbody) return;
    tbody.innerHTML = '';

    const journalEntries = state.journalEntries.sort((a,b) => b.timestamp - a.timestamp);

    if(journalEntries.length === 0){
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nuk ka veprime kontabël të regjistruara.</td></tr>';
        return;
    }
    
    journalEntries.forEach(entry => {
        const tr = document.createElement('tr');
        const debitTotal = entry.lines.reduce((sum, line) => sum + line.debit, 0);
        const creditTotal = entry.lines.reduce((sum, line) => sum + line.credit, 0);
        const isClosed = isDateInClosedPeriod(entry.date);

        tr.innerHTML = `
            <td>${new Date(entry.date + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${entry.id}</td>
            <td>${entry.description}</td>
            <td class="text-right">${debitTotal.toFixed(2)} €</td>
            <td class="text-right">${creditTotal.toFixed(2)} €</td>
            <td>
                <button class="btn btn-sm btn-info view-journal-entry-btn" data-entry-id="${entry.id}" ${isClosed ? 'disabled' : ''}>Detajet</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function openJournalEntryFormModal(entryId?: string): void {
    const modal = dom.journalEntryFormModal;
    const form = dom.journalEntryForm;
    const titleEl = dom.journalEntryFormModalTitle;
    
    if (!modal || !form || !titleEl || !dom.journalEntryDateInput || !dom.journalEntryLinesTbody) {
        console.error("Missing essential DOM elements for Journal Entry modal.");
        return;
    }

    form.reset();
    if(dom.journalEntryFormErrorElement) dom.journalEntryFormErrorElement.textContent = '';
    dom.journalEntryDateInput.value = getTodayDateString();
    
    titleEl.textContent = entryId ? "Modifiko Veprimin Kontabël" : "Shto Veprim të Ri Kontabël";
    // NOTE: Editing is not implemented in this pass
    
    dom.journalEntryLinesTbody.innerHTML = '';
    addJournalEntryLineRow();
    addJournalEntryLineRow();
    
    updateEntryTotals();

    modal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function closeJournalEntryFormModal(): void {
    const modal = dom.journalEntryFormModal;
    if (modal) {
        modal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('journalEntryFormModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

async function handleSaveJournalEntry(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.journalEntryForm || !dom.journalEntryLinesTbody || !state.currentManagingBusinessId || !state.currentUser || !dom.journalEntryFormErrorElement) return;

    const date = dom.journalEntryDateInput?.value;
    if(isDateInClosedPeriod(date)) {
        dom.journalEntryFormErrorElement.textContent = `Data e veprimit (${date}) është në një periudhë të mbyllur.`;
        return;
    }
    const description = dom.journalEntryDescriptionInput?.value.trim();
    if (!date || !description) {
        dom.journalEntryFormErrorElement.textContent = "Data dhe përshkrimi janë të detyrueshme.";
        return;
    }

    const lines: JournalEntryLine[] = [];
    const rows = dom.journalEntryLinesTbody.querySelectorAll('tr');
    for (const row of rows) {
        const accountId = (row.querySelector('.je-account-select') as HTMLSelectElement).value;
        const lineDescription = (row.querySelector('.je-line-description') as HTMLInputElement).value.trim();
        const debit = parseFloat((row.querySelector('.je-debit-input') as HTMLInputElement).value) || 0;
        const credit = parseFloat((row.querySelector('.je-credit-input') as HTMLInputElement).value) || 0;
        if (accountId && (debit > 0 || credit > 0)) {
            lines.push({ accountId, description: lineDescription, debit, credit });
        }
    }
    
    if (lines.length < 2) {
        dom.journalEntryFormErrorElement.textContent = "Duhet të ketë të paktën dy rreshta (një debi dhe një kredi).";
        return;
    }
    
    const debitTotal = lines.reduce((sum, l) => sum + l.debit, 0);
    const creditTotal = lines.reduce((sum, l) => sum + l.credit, 0);
    
    if (Math.abs(debitTotal - creditTotal) > 0.001) {
        dom.journalEntryFormErrorElement.textContent = "Veprimi nuk është i balancuar. Totali i debive duhet të jetë i barabartë me totalin e kredive.";
        return;
    }
    if (debitTotal === 0) {
        dom.journalEntryFormErrorElement.textContent = "Vlera totale e veprimit nuk mund të jetë zero.";
        return;
    }

    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId)!;
    const newEntry: JournalEntry = {
        id: `VEP-${business.fiscalYear}-${Date.now().toString().slice(-5)}`,
        businessId: state.currentManagingBusinessId,
        date,
        description,
        lines,
        recordedByManagerId: state.currentUser.id,
        recordedByManagerUsername: state.currentUser.username,
        timestamp: Date.now()
    };
    
    state.journalEntries.push(newEntry);
    await storage.saveJournalEntries(state.currentManagingBusinessId, state.journalEntries);

    renderGeneralLedger();
    closeJournalEntryFormModal();
    showCustomConfirm("Veprimi kontabël u ruajt me sukses.", () => {});
}

function addJournalEntryLineRow(): void {
    if (!dom.journalEntryLinesTbody) return;
    const tr = document.createElement('tr');
    
    const accountsOptions = state.accounts.sort((a,b) => a.accountNumber.localeCompare(b.accountNumber))
        .map(acc => `<option value="${acc.id}">${acc.accountNumber} - ${acc.name}</option>`).join('');

    tr.innerHTML = `
        <td>
            <select class="form-control form-control-sm je-account-select">
                <option value="">-- Zgjidh Llogarinë --</option>
                ${accountsOptions}
            </select>
        </td>
        <td><input type="text" class="form-control form-control-sm je-line-description" placeholder="Përshkrim rreshti..."></td>
        <td><input type="number" class="form-control form-control-sm text-right je-debit-input" min="0" step="any" placeholder="0.00"></td>
        <td><input type="number" class="form-control form-control-sm text-right je-credit-input" min="0" step="any" placeholder="0.00"></td>
        <td><button type="button" class="btn btn-sm btn-danger je-remove-line-btn">X</button></td>
    `;
    
    const debitInput = tr.querySelector('.je-debit-input') as HTMLInputElement;
    const creditInput = tr.querySelector('.je-credit-input') as HTMLInputElement;

    debitInput.addEventListener('input', () => {
        if (debitInput.value) creditInput.value = '';
        updateEntryTotals();
    });
    creditInput.addEventListener('input', () => {
        if (creditInput.value) debitInput.value = '';
        updateEntryTotals();
    });
    
    tr.querySelector('.je-remove-line-btn')?.addEventListener('click', () => {
        tr.remove();
        updateEntryTotals();
    });

    dom.journalEntryLinesTbody.appendChild(tr);
}

function updateEntryTotals(): void {
    if (!dom.journalEntryLinesTbody || !dom.journalEntryDebitTotal || !dom.journalEntryCreditTotal || !dom.journalEntryBalanceStatus || !dom.saveJournalEntryBtn) return;
    
    const rows = dom.journalEntryLinesTbody.querySelectorAll('tr');
    let debitTotal = 0;
    let creditTotal = 0;

    rows.forEach(row => {
        const debit = parseFloat((row.querySelector('.je-debit-input') as HTMLInputElement).value) || 0;
        const credit = parseFloat((row.querySelector('.je-credit-input') as HTMLInputElement).value) || 0;
        debitTotal += debit;
        creditTotal += credit;
    });

    dom.journalEntryDebitTotal.textContent = `${debitTotal.toFixed(2)} €`;
    dom.journalEntryCreditTotal.textContent = `${creditTotal.toFixed(2)} €`;

    if (Math.abs(debitTotal - creditTotal) < 0.001 && debitTotal > 0) {
        dom.journalEntryBalanceStatus.innerHTML = '<span style="color: green;">✔ Balancuar</span>';
        dom.saveJournalEntryBtn.disabled = false;
    } else if (debitTotal === 0 && creditTotal === 0) {
        dom.journalEntryBalanceStatus.innerHTML = '';
        dom.saveJournalEntryBtn.disabled = true;
    } else {
        dom.journalEntryBalanceStatus.innerHTML = '<span style="color: red;">✖ Pa Balancuar</span>';
        dom.saveJournalEntryBtn.disabled = true;
    }
}


// --- BALANCE SHEET (Bilanci) ---

export function showBalanceSheetPanel(viewName: string, targetContainer: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Balance Sheet panel.");
        return;
    }
    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Bilanci</h2>
        <div class="report-filters-dynamic" id="balance-sheet-filters">
            <div class="form-group filter-group">
                <label for="balance-sheet-date">Data e Raportit:</label>
                <input type="date" id="balance-sheet-date" class="form-control" value="${getTodayDateString()}">
            </div>
            <button id="generate-balance-sheet-btn" class="btn btn-primary">Gjenero Bilancin</button>
        </div>
        <div id="balance-sheet-content" class="report-content" style="margin-top: 1.5rem;">
            <p class="text-center info-message info">Zgjidhni një datë dhe gjeneroni raportin.</p>
        </div>
    `;

    document.getElementById('generate-balance-sheet-btn')?.addEventListener('click', handleGenerateBalanceSheet);
}

function handleGenerateBalanceSheet() {
    const dateInput = document.getElementById('balance-sheet-date') as HTMLInputElement;
    const reportDate = dateInput.value;
    if (!reportDate) {
        alert("Ju lutem zgjidhni një datë.");
        return;
    }

    const balances = calculateAccountBalances(reportDate);
    renderBalanceSheet(balances, reportDate);
}

function calculateAccountBalances(asOfDate: string): Map<string, number> {
    const balances = new Map<string, number>();
    const reportEndDate = new Date(asOfDate + "T23:59:59").getTime();

    // Initialize all accounts with balance 0
    state.accounts.forEach(acc => balances.set(acc.id, 0));

    // Process all journal entries up to the report date
    state.journalEntries
        .filter(entry => new Date(entry.date + "T00:00:00").getTime() <= reportEndDate)
        .forEach(entry => {
            entry.lines.forEach(line => {
                const currentBalance = balances.get(line.accountId) || 0;
                balances.set(line.accountId, currentBalance + line.debit - line.credit);
            });
        });
        
    return balances;
}

function renderBalanceSheet(balances: Map<string, number>, asOfDate: string) {
    const contentArea = document.getElementById('balance-sheet-content');
    if (!contentArea) return;
    
    const renderSection = (title: string, accountType: AccountType): { html: string, total: number } => {
        let sectionHtml = `<h3 class="section-subtitle">${title}</h3><table class="admin-table"><tbody>`;
        let sectionTotal = 0;
        
        const accountsOfType = state.accounts.filter(acc => acc.type === accountType)
                                             .sort((a,b) => a.accountNumber.localeCompare(b.accountNumber));
                                             
        accountsOfType.forEach(acc => {
            const balance = balances.get(acc.id) || 0;
            // For liabilities and equity, positive balances are usually shown as positive numbers in the report.
            // The accounting equation takes care of the signs.
            const displayBalance = (accountType === 'Liability' || accountType === 'Equity') ? -balance : balance;
            sectionTotal += displayBalance;
            sectionHtml += `<tr><td>${acc.accountNumber} - ${acc.name}</td><td class="text-right">${displayBalance.toFixed(2)}</td></tr>`;
        });
        
        sectionHtml += `<tr style="font-weight: bold; border-top: 2px solid #333;"><td class="text-right">TOTALI ${title.toUpperCase()}:</td><td class="text-right">${sectionTotal.toFixed(2)}</td></tr>`;
        sectionHtml += `</tbody></table>`;
        return { html: sectionHtml, total: sectionTotal };
    };

    const assets = renderSection('Asetet', 'Asset');
    const liabilities = renderSection('Detyrimet', 'Liability');
    const equity = renderSection('Kapitali', 'Equity');
    
    const totalLiabilitiesAndEquity = liabilities.total + equity.total;
    const equationCheck = Math.abs(assets.total - totalLiabilitiesAndEquity) < 0.01;

    let reportHtml = `
        <div class="printable-area">
            ${generateReportHeaderHTML('BILANCI', new Date(asOfDate + "T00:00:00").toLocaleDateString('sq-AL'))}
            <div style="display: flex; gap: 2rem; align-items: flex-start;">
                <div style="flex: 1;">${assets.html}</div>
                <div style="flex: 1;">${liabilities.html}${equity.html}</div>
            </div>
            <div class="report-summary" style="margin-top: 2rem; padding: 1rem; text-align: center;">
                <h4>Verifikimi i Ekuacionit Kontabël</h4>
                <p>Asetet Totale: <strong>${assets.total.toFixed(2)} €</strong></p>
                <p>Detyrimet + Kapitali: <strong>${totalLiabilitiesAndEquity.toFixed(2)} €</strong></p>
                <p class="strong ${equationCheck ? 'cash-value positive' : 'cash-value negative'}">
                    Statusi: ${equationCheck ? 'I BALANCUAR ✔' : 'I PA BALANCUAR ✖'}
                </p>
            </div>
            ${generateReportFooterHTML()}
        </div>
    `;

    contentArea.innerHTML = reportHtml;
}

// --- PROFIT AND LOSS STATEMENT (Pasqyra e të Ardhurave dhe Shpenzimeve) ---

export function showProfitAndLossPanel(viewName: string, targetContainer: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for P&L panel.");
        return;
    }
    targetContainer.innerHTML = `
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
    `;

    document.getElementById('generate-pnl-btn')?.addEventListener('click', handleGenerateProfitAndLoss);
}

function handleGenerateProfitAndLoss() {
    const startDateInput = document.getElementById('pnl-start-date') as HTMLInputElement;
    const endDateInput = document.getElementById('pnl-end-date') as HTMLInputElement;
    const reportDateStart = startDateInput.value;
    const reportDateEnd = endDateInput.value;
    if (!reportDateStart || !reportDateEnd) {
        alert("Ju lutem zgjidhni një periudhë.");
        return;
    }

    renderProfitAndLoss(reportDateStart, reportDateEnd);
}

function renderProfitAndLoss(startDateStr: string, endDateStr: string): void {
    const contentArea = document.getElementById('pnl-content');
    if (!contentArea) return;

    const reportTitle = "PASQYRA E TË ARDHURAVE DHE SHPENZIMEVE (P&L)";
    const period = `${new Date(startDateStr + "T00:00:00").toLocaleDateString('sq-AL')} - ${new Date(endDateStr + "T00:00:00").toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML(reportTitle, `Periudha: ${period}`);

    const startDate = new Date(startDateStr + "T00:00:00");
    const endDate = new Date(endDateStr + "T23:59:59");

    const accountPeriodChanges = new Map<string, number>();

    state.journalEntries
        .filter(entry => {
            const entryDate = new Date(entry.date + "T00:00:00");
            return entryDate >= startDate && entryDate <= endDate;
        })
        .forEach(entry => {
            entry.lines.forEach(line => {
                const currentChange = accountPeriodChanges.get(line.accountId) || 0;
                const change = line.credit - line.debit;
                accountPeriodChanges.set(line.accountId, currentChange + change);
            });
        });

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

    let expenseHtml = '';
    let totalExpenses = 0;
    const expenseAccounts = state.accounts.filter(acc => acc.type === 'Expense').sort((a,b) => a.accountNumber.localeCompare(b.accountNumber));

    expenseAccounts.forEach(acc => {
        const change = accountPeriodChanges.get(acc.id) || 0;
        const expenseAmount = -change; 
        if (expenseAmount !== 0) {
            totalExpenses += expenseAmount;
            expenseHtml += `<tr><td>${acc.accountNumber} - ${acc.name}</td><td class="text-right">${expenseAmount.toFixed(2)}</td></tr>`;
        }
    });
    
    const netIncome = totalRevenue - totalExpenses;
    const netIncomeClass = netIncome >= 0 ? 'cash-value positive' : 'cash-value negative';

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

    contentArea.innerHTML = `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}

// --- CASH FLOW STATEMENT ---

export function showCashFlowStatementPanel(viewName: string, targetContainer: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Cash Flow Statement panel.");
        return;
    }
    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Pasqyra e Rrjedhës së Parave (Cash Flow)</h2>
        <div class="report-filters-dynamic" id="cash-flow-filters">
            <div class="form-group filter-group">
                <label for="cash-flow-start-date">Nga Data:</label>
                <input type="date" id="cash-flow-start-date" class="form-control" value="${getTodayDateString()}">
            </div>
            <div class="form-group filter-group">
                <label for="cash-flow-end-date">Deri më Datë:</label>
                <input type="date" id="cash-flow-end-date" class="form-control" value="${getTodayDateString()}">
            </div>
            <button id="generate-cash-flow-btn" class="btn btn-primary">Gjenero Raportin</button>
        </div>
        <div id="cash-flow-content" class="report-content" style="margin-top: 1.5rem;">
            <p class="text-center info-message info">Zgjidhni një periudhë dhe gjeneroni raportin.</p>
        </div>
    `;

    document.getElementById('generate-cash-flow-btn')?.addEventListener('click', handleGenerateCashFlowStatement);
}

function handleGenerateCashFlowStatement() {
    const startDateInput = document.getElementById('cash-flow-start-date') as HTMLInputElement;
    const endDateInput = document.getElementById('cash-flow-end-date') as HTMLInputElement;
    const reportDateStart = startDateInput.value;
    const reportDateEnd = endDateInput.value;
    if (!reportDateStart || !reportDateEnd) {
        alert("Ju lutem zgjidhni një periudhë.");
        return;
    }
    renderCashFlowStatementHTML(reportDateStart, reportDateEnd);
}

function renderCashFlowStatementHTML(startDateStr: string, endDateStr: string): void {
    const contentArea = document.getElementById('cash-flow-content');
    if (!contentArea) return;

    const reportTitle = "PASQYRA E RRJEDHËS SË PARAVE";
    const period = `${new Date(startDateStr).toLocaleDateString('sq-AL')} - ${new Date(endDateStr).toLocaleDateString('sq-AL')}`;
    const headerHtml = generateReportHeaderHTML(reportTitle, `Periudha: ${period}`);

    const startDate = new Date(startDateStr);
    const prevDate = new Date(startDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = prevDate.toISOString().split('T')[0];

    const startBalances = calculateAccountBalances(prevDateStr);
    const endBalances = calculateAccountBalances(endDateStr);
    const { netIncome } = calculatePeriodPnL(startDate, new Date(endDateStr));
    
    const accountChange = (accNum: string) => (endBalances.get(accNum) || 0) - (startBalances.get(accNum) || 0);

    // Cash Flow from Operating Activities
    let cashFromOpsHtml = '';
    let totalCashFromOps = netIncome;
    cashFromOpsHtml += `<tr><td>Fitimi Neto</td><td class="text-right">${netIncome.toFixed(2)}</td></tr>`;
    
    const arChange = -accountChange(state.accountingSettings?.defaultAccountsReceivableId || '1210');
    if (arChange !== 0) {
        cashFromOpsHtml += `<tr><td>Ndryshimet tek Klientët (A/R)</td><td class="text-right">${arChange.toFixed(2)}</td></tr>`;
        totalCashFromOps += arChange;
    }
    const invChange = -accountChange(state.accountingSettings?.defaultInventoryId || '3010');
    if (invChange !== 0) {
        cashFromOpsHtml += `<tr><td>Ndryshimet tek Inventari</td><td class="text-right">${invChange.toFixed(2)}</td></tr>`;
        totalCashFromOps += invChange;
    }
    const apChange = accountChange(state.accountingSettings?.defaultAccountsPayableId || '4010');
     if (apChange !== 0) {
        cashFromOpsHtml += `<tr><td>Ndryshimet tek Furnitorët (A/P)</td><td class="text-right">${apChange.toFixed(2)}</td></tr>`;
        totalCashFromOps += apChange;
    }

    const netCashFromInvesting = 0;
    const netCashFromFinancing = 0;

    const netCashChange = totalCashFromOps + netCashFromInvesting + netCashFromFinancing;
    const beginningCash = startBalances.get(state.accountingSettings?.defaultCashAccountId || '1010') || 0;
    const endingCash = beginningCash + netCashChange;

    const tableHtml = `
        <div class="report-table-container">
            <table class="admin-table">
                <tbody>
                    <tr><td colspan="2"><strong>Aktivitetet Operacionale</strong></td></tr>
                    ${cashFromOpsHtml}
                    <tr class="strong"><td class="text-right">Rrjedha Neto nga Aktivitetet Operacionale</td><td class="text-right">${totalCashFromOps.toFixed(2)}</td></tr>
                    
                    <tr><td colspan="2" style="padding-top:1rem;"><strong>Aktivitetet Investive</strong></td></tr>
                    <tr><td><em>(Nuk ka aktivitet investiv)</em></td><td class="text-right">0.00</td></tr>
                    <tr class="strong"><td class="text-right">Rrjedha Neto nga Aktivitetet Investive</td><td class="text-right">${netCashFromInvesting.toFixed(2)}</td></tr>
                    
                    <tr><td colspan="2" style="padding-top:1rem;"><strong>Aktivitetet Financiare</strong></td></tr>
                    <tr><td><em>(Nuk ka aktivitet financiar)</em></td><td class="text-right">0.00</td></tr>
                    <tr class="strong"><td class="text-right">Rrjedha Neto nga Aktivitetet Financiare</td><td class="text-right">${netCashFromFinancing.toFixed(2)}</td></tr>

                    <tr class="grand-total-row" style="border-top: 2px solid #333;"><td class="text-right">Rritja/Rënia Neto e Arkës</td><td class="text-right">${netCashChange.toFixed(2)}</td></tr>
                    <tr><td class="text-right">Arka në Fillim të Periudhës</td><td class="text-right">${beginningCash.toFixed(2)}</td></tr>
                    <tr class="grand-total-row"><td class="text-right">Arka në Fund të Periudhës</td><td class="text-right">${endingCash.toFixed(2)}</td></tr>
                </tbody>
            </table>
        </div>
    `;

    contentArea.innerHTML = `<div class="printable-area">${headerHtml}${tableHtml}${generateReportFooterHTML()}</div>`;
}



// --- ACCOUNTING SETTINGS ---

export function showAccountingSettingsPanel(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Accounting Settings panel.");
        return;
    }
    const panel = dom.managerContentAccountingSettings;
    if (panel) {
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        renderAccountingSettings(panel); // Always re-render to get fresh data
    } else {
        targetContainer.innerHTML = '<p class="error-message">Paneli i cilësimeve të kontabilitetit nuk u gjet.</p>';
    }
}

function renderAccountingSettings(panel: HTMLElement) {
    // This function will now always re-render the form content
    panel.innerHTML = `
        <form id="accounting-settings-form">
            <h3 class="section-subtitle">Llogaritë Default të Sistemit</h3>
            <p class="info-message secondary">Zgjedhja e këtyre llogarive lejon sistemin të krijojë automatikisht veprimet kontabël për shitjet, blerjet, pagesat, etj.</p>
            <div class="form-grid-2-cols" id="accounting-settings-grid">
                <!-- select elements will be populated here -->
            </div>
            <div class="form-actions-group" style="justify-content: flex-end; margin-top: 1rem;">
                <button type="submit" id="save-accounting-settings-btn" class="btn btn-primary">Ruaj Cilësimet</button>
            </div>
        </form>
    `;
    document.getElementById('accounting-settings-form')?.addEventListener('submit', handleSaveAccountingSettings);
    
    populateAccountingSettingsForm(); // Call populate which now gets fresh data from state
}

function populateAccountingSettingsForm(): void {
    const grid = document.getElementById('accounting-settings-grid');
    if (!grid) return;

    const settingsFields: { key: keyof AccountingSettings, label: string, accountType?: AccountType | AccountType[] }[] = [
        { key: 'defaultCashAccountId', label: 'Llogaria e Arkës (Cash)', accountType: 'Asset' },
        { key: 'defaultBankAccountId', label: 'Llogaria e Bankës', accountType: 'Asset' },
        { key: 'defaultAccountsReceivableId', label: 'Llogaria e Klientëve (A/R)', accountType: 'Asset' },
        { key: 'defaultAccountsPayableId', label: 'Llogaria e Furnitorëve (A/P)', accountType: 'Liability' },
        { key: 'defaultSalesRevenueId', label: 'Llogaria e të Ardhurave nga Shitja', accountType: 'Revenue' },
        { key: 'defaultInventoryId', label: 'Llogaria e Inventarit', accountType: 'Asset' },
        { key: 'defaultVatPayableId', label: 'Llogaria e TVSH-së së Mbledhur', accountType: 'Liability' },
        { key: 'defaultVatReceivableId', label: 'Llogaria e TVSH-së së Zbritshme', accountType: 'Asset' },
        { key: 'defaultCogsId', label: 'Llogaria e Kostos së Mallrave të Shitura (COGS)', accountType: 'Expense' },
        { key: 'defaultSalesReturnsId', label: 'Llogaria e Kthimeve të Shitjeve', accountType: 'Revenue' },
        { key: 'defaultPurchaseReturnsId', label: 'Llogaria e Kthimeve të Blerjeve', accountType: 'Asset' },
        { key: 'defaultPayrollExpenseId', label: 'Llogaria e Shpenzimeve të Pagave', accountType: 'Expense' },
        { key: 'defaultPayrollLiabilitiesId', label: 'Llogaria e Detyrimeve të Pagave', accountType: 'Liability' },
    ];
    
    let formHtml = '';
    const currentSettings = state.accountingSettings || {};

    settingsFields.forEach(field => {
        let options = state.accounts;
        if (field.accountType) {
            const types = Array.isArray(field.accountType) ? field.accountType : [field.accountType];
            options = state.accounts.filter(acc => types.includes(acc.type));
        }

        const selectOptions = options.sort((a,b) => a.accountNumber.localeCompare(b.accountNumber)).map(opt => `<option value="${opt.id}" ${(currentSettings as any)[field.key] === opt.id ? 'selected' : ''}>${opt.accountNumber} - ${opt.name}</option>`).join('');
        
        formHtml += `
            <div class="form-group">
                <label for="as-${String(field.key)}">${field.label}:</label>
                <select id="as-${String(field.key)}" name="${String(field.key)}" class="form-control">
                    <option value="">-- Pa Zgjedhur --</option>
                    ${selectOptions}
                </select>
            </div>
        `;
    });
    
    grid.innerHTML = formHtml;
}

async function handleSaveAccountingSettings(event: Event) {
    event.preventDefault();
    const form = document.getElementById('accounting-settings-form') as HTMLFormElement;
    if (!form || !state.currentManagingBusinessId) return;

    const formData = new FormData(form);
    const newSettings: AccountingSettings = { businessId: state.currentManagingBusinessId };

    for (let [key, value] of formData.entries()) {
        (newSettings as any)[key] = (value as string).trim() || undefined;
    }
    
    state.setAccountingSettings(newSettings);
    await storage.saveAccountingSettings(state.currentManagingBusinessId, newSettings);
    alert('Cilësimet e kontabilitetit u ruajtën me sukses.');
}

// --- Event Listeners ---
export function initAccountingEventListeners(): void {
    dom.showAddAccountModalBtn?.addEventListener('click', () => openAccountFormModal());
    dom.accountForm?.addEventListener('submit', handleSaveAccount);
    dom.cancelAccountFormBtn?.addEventListener('click', closeAccountFormModal);
    dom.accountFormModalCloseBtn?.addEventListener('click', closeAccountFormModal);

    // General Ledger listeners
    dom.showAddJournalEntryModalBtn?.addEventListener('click', handleOpenJournalEntryModal);
    dom.journalEntryForm?.addEventListener('submit', handleSaveJournalEntry);
    dom.addJournalEntryLineBtn?.addEventListener('click', addJournalEntryLineRow);
    dom.cancelJournalEntryFormBtn?.addEventListener('click', closeJournalEntryFormModal);
    dom.journalEntryFormModalCloseBtn?.addEventListener('click', closeJournalEntryFormModal);
}