

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { showCustomConfirm } from '../core/ui';
import { JournalEntry, JournalEntryLine } from '../models';
import { calculatePeriodPnL } from './accountingUtils';

export function initPeriodClosingEventListeners(): void {
    // Event listeners are attached dynamically when the view is rendered
}

export function initPeriodClosingView(viewName: string, targetContainer: HTMLElement): void {
    if (!targetContainer) return;

    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business) {
        targetContainer.innerHTML = '<p class="error-message">Detajet e biznesit nuk u gjetën.</p>';
        return;
    }
    
    const lastClosedDate = business.lastClosedPeriodEndDate ? new Date(business.lastClosedPeriodEndDate) : new Date(business.fiscalYear - 1, 11, 31);
    const nextPeriodStartDate = new Date(lastClosedDate);
    nextPeriodStartDate.setDate(nextPeriodStartDate.getDate() + 1);
    
    const nextPeriodEndDate = new Date(nextPeriodStartDate.getFullYear(), nextPeriodStartDate.getMonth() + 1, 0); // Last day of the month

    const { netIncome } = calculatePeriodPnL(nextPeriodStartDate, nextPeriodEndDate);

    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Mbyllja e Periudhës Fiskale</h2>
        <div id="period-closing-content">
            <div class="info-message secondary">
                <p>Periudha e fundit e mbyllur: <strong>${lastClosedDate.toLocaleDateString('sq-AL')}</strong></p>
                <p>Periudha e radhës për mbyllje: <strong>${nextPeriodStartDate.toLocaleDateString('sq-AL')} - ${nextPeriodEndDate.toLocaleDateString('sq-AL')}</strong></p>
            </div>
            <div class="widget-card" style="margin-top: 1.5rem;">
                <div class="widget-card-header">
                    <h4>Përmbledhje e Periudhës</h4>
                </div>
                <p class="widget-label">Fitimi / Humbja Neto e Llogaritur:</p>
                <p class="large-stat ${netIncome >= 0 ? 'cash-value positive' : 'cash-value negative'}">${netIncome.toFixed(2)} €</p>
            </div>
            <div class="form-actions-group" style="margin-top: 1.5rem;">
                <button id="confirm-period-close-btn" class="btn btn-danger">Mbyll Periudhën ${nextPeriodStartDate.toLocaleString('sq-AL', { month: 'long' })} ${nextPeriodStartDate.getFullYear()}</button>
            </div>
            <p class="error-message" style="margin-top: 1rem;"><strong>KUJDES:</strong> Mbyllja e periudhës është një veprim i pakthyeshëm. Të gjitha transaksionet brenda kësaj periudhe do të bllokohen nga modifikimet e mëtejshme.</p>
        </div>
    `;

    document.getElementById('confirm-period-close-btn')?.addEventListener('click', () => {
        handlePeriodClose(nextPeriodStartDate, nextPeriodEndDate);
    });
}

function handlePeriodClose(startDate: Date, endDate: Date) {
    const { netIncome } = calculatePeriodPnL(startDate, endDate);

    showCustomConfirm(`Jeni i sigurt që doni të mbyllni periudhën deri më ${endDate.toLocaleDateString('sq-AL')}? Fitimi/Humbja neto prej ${netIncome.toFixed(2)} € do të transferohet në kapital. Ky veprim nuk mund të kthehet.`, async () => {
        const retainedEarningsAccount = state.accounts.find(acc => acc.name === 'Fitimi i Mbartur');
        if (!retainedEarningsAccount) {
            alert("Llogaria 'Fitimi i Mbartur' nuk u gjet. Mbyllja e periudhës dështoi.");
            return;
        }

        const revenueAccountIds = state.accounts.filter(a => a.type === 'Revenue').map(a => a.id);
        const expenseAccountIds = state.accounts.filter(a => a.type === 'Expense').map(a => a.id);
        const balancesToClose = new Map<string, number>();

        state.journalEntries
            .filter(entry => {
                const entryDate = new Date(entry.date).getTime();
                return entryDate >= startDate.getTime() && entryDate <= endDate.getTime();
            })
            .forEach(entry => {
                entry.lines.forEach(line => {
                    const accountId = line.accountId;
                    if (revenueAccountIds.includes(accountId) || expenseAccountIds.includes(accountId)) {
                        const currentBalance = balancesToClose.get(accountId) || 0;
                        balancesToClose.set(accountId, currentBalance + line.debit - line.credit);
                    }
                });
            });

        const closingLines: JournalEntryLine[] = [];
        let netChange = 0;

        balancesToClose.forEach((balance, accountId) => {
            if (Math.abs(balance) > 0.001) {
                const account = state.accounts.find(a => a.id === accountId)!;
                if (account.type === 'Revenue') {
                    // Revenues have credit balances, so we debit them to close
                    closingLines.push({ accountId, debit: -balance, credit: 0, description: "Mbyllje Periudhe" });
                    netChange += -balance; // Debit to P/L summary
                } else { // Expense
                    // Expenses have debit balances, so we credit them to close
                    closingLines.push({ accountId, debit: 0, credit: balance, description: "Mbyllje Periudhe" });
                    netChange -= balance; // Credit to P/L summary
                }
            }
        });

        // The final line to transfer net income to retained earnings
        if (netChange > 0) { // Net Profit
            closingLines.push({ accountId: retainedEarningsAccount.id, debit: 0, credit: netChange, description: "Transferim Fitimi Neto" });
        } else if (netChange < 0) { // Net Loss
            closingLines.push({ accountId: retainedEarningsAccount.id, debit: -netChange, credit: 0, description: "Transferim Humbje Neto" });
        }
        
        if (closingLines.length > 0) {
            const business = state.businesses.find(b => b.id === state.currentManagingBusinessId)!;
            const closingEntry: JournalEntry = {
                id: `MBP-${business.fiscalYear}-${endDate.getMonth() + 1}`,
                businessId: state.currentManagingBusinessId!,
                date: endDate.toISOString().split('T')[0],
                description: `Veprim Mbyllës për periudhën që mbaron më ${endDate.toLocaleDateString('sq-AL')}`,
                lines: closingLines,
                recordedByManagerId: state.currentUser!.id,
                recordedByManagerUsername: state.currentUser!.username,
                timestamp: Date.now()
            };
            state.journalEntries.push(closingEntry);
            await storage.saveJournalEntries(state.currentManagingBusinessId!, state.journalEntries);
        }

        // Update business's last closed date
        const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
        if (business) {
            business.lastClosedPeriodEndDate = endDate.toISOString().split('T')[0];
            await storage.saveAllBusinesses(state.businesses);
        }

        alert("Periudha u mbyll me sukses!");
        initPeriodClosingView('period_closing', document.getElementById('manager-content-period_closing')!);
    });
}
