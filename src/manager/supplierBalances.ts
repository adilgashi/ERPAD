

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import { Supplier, PurchaseInvoice, ReturnPurchaseInvoice, OutgoingPayment } from '../models';
import { showCustomConfirm } from '../core/ui';

function initSupplierBalancesView(): void {
    if (!dom.managerContentSupplierBalances) {
        console.error("Elementi i pamjes së saldove të furnitorëve nuk u gjet.");
        return;
    }
    addRefreshButtonToSupplierBalances();
    if (dom.supplierBalancesSearchInput) dom.supplierBalancesSearchInput.value = '';
    renderSupplierBalancesTable();
}

function addRefreshButtonToSupplierBalances(): void {
    const container = dom.managerContentSupplierBalances;
    if (!container) return;

    let titleElementQuery = container.querySelector('h2.manager-section-title');
    let titleElement: HTMLElement | null = null;

    if (titleElementQuery instanceof HTMLElement) {
        titleElement = titleElementQuery;
    } else if (!titleElementQuery) {
        titleElement = document.createElement('h2');
        titleElement.className = 'manager-section-title';
        titleElement.textContent = 'Salldo e Furnitorëve';
        container.insertBefore(titleElement, container.firstChild);
    }

    if (document.getElementById('refresh-supplier-balances-btn')) return;

    const refreshButton = document.createElement('button');
    refreshButton.id = 'refresh-supplier-balances-btn';
    refreshButton.className = 'btn btn-info btn-sm';
    refreshButton.innerHTML = '<span class="icon">🔄</span> Rifresko Saldot';
    refreshButton.style.marginLeft = 'auto';

    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.justifyContent = 'space-between';
    titleContainer.style.alignItems = 'center';
    if (titleElement) {
        titleContainer.style.marginBottom = titleElement.style.marginBottom || '1.5rem';
        titleElement.style.marginBottom = '0';
        titleContainer.appendChild(titleElement);
    }
    titleContainer.appendChild(refreshButton);
    
    const filterContainer = container.querySelector('.filter-container');
    if (filterContainer) {
        container.insertBefore(titleContainer, filterContainer);
    } else if (titleElement) {
        container.insertBefore(titleContainer, container.firstChild);
    } else {
        container.prepend(titleContainer);
    }
    
    refreshButton.addEventListener('click', handleRefreshSupplierBalances);
}

function handleRefreshSupplierBalances() {
    renderSupplierBalancesTable();
    showCustomConfirm("Saldot e furnitorëve u rifreskuan.", () => {});
}


function renderSupplierBalancesTable(): void {
    const tbody = dom.supplierBalancesTbody ?? document.getElementById('supplier-balances-tbody') as HTMLTableSectionElement | null;
    
    if (!tbody || !state.currentManagingBusinessId) {
        console.error("Tabela e saldove të furnitorëve (tbody) #supplier-balances-tbody nuk u gjet.");
        return;
    }
    
    const searchTerm = dom.supplierBalancesSearchInput ? dom.supplierBalancesSearchInput.value.toLowerCase().trim() : '';
    tbody.innerHTML = '';

    let filteredSuppliers = state.suppliers;
    if (searchTerm) {
        filteredSuppliers = state.suppliers.filter(supplier => 
            supplier.name.toLowerCase().includes(searchTerm) ||
            (supplier.code && supplier.code.toLowerCase().includes(searchTerm))
        );
    }
    

    if (filteredSuppliers.length === 0) {
        const message = searchTerm ? 'Asnjë furnitor nuk përputhet me kërkimin.' : 'Nuk ka furnitorë të regjistruar.';
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">${message}</td></tr>`;
        return;
    }

    const sortedSuppliers = [...filteredSuppliers].sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    sortedSuppliers.forEach(supplier => {
        let totalDebitFromPurchases = 0;
        let totalCreditFromReturnsAndPayments = 0;
        const openingBalance = supplier.openingBalance || 0; // Default to 0 if undefined

        // Calculate total debit from Purchases (what we owe initially from purchases)
        state.purchaseInvoices
            .filter(inv => inv.supplierId === supplier.id)
            .forEach(inv => {
                totalDebitFromPurchases += inv.totalAmountWithVAT;
            });

        // Calculate total credit from Returns and Payments (what reduces our debt)
        state.returnPurchaseInvoices
            .filter(inv => inv.supplierId === supplier.id)
            .forEach(inv => {
                totalCreditFromReturnsAndPayments += inv.totalReturnAmountWithVAT; 
            });
        
        state.outgoingPayments
            .filter(payment => payment.supplierId === supplier.id)
            .forEach(payment => {
                totalCreditFromReturnsAndPayments += payment.totalPaidAmount; 
            });

        // Overall Debit: Opening Balance (if positive, we owe them) + Purchases
        const overallDebit = (openingBalance > 0 ? openingBalance : 0) + totalDebitFromPurchases;
        // Overall Credit: Absolute Opening Balance (if negative, they owe us/prepaid) + Returns + Payments
        const overallCredit = (openingBalance < 0 ? Math.abs(openingBalance) : 0) + totalCreditFromReturnsAndPayments;
        
        // Balance: Opening Balance + Purchases - (Returns + Payments)
        // Positive balance means we owe the supplier.
        // Negative balance means the supplier owes us or we have a credit with them.
        const balance = openingBalance + totalDebitFromPurchases - totalCreditFromReturnsAndPayments;


        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${supplier.code}</td>
            <td>${supplier.name}</td>
            <td class="text-right">${overallDebit.toFixed(2)} €</td>
            <td class="text-right">${overallCredit.toFixed(2)} €</td>
            <td class="text-right strong ${balance < 0 ? 'cash-value negative' : (balance > 0 ? 'cash-value' : 'cash-value zero')}">
                ${balance.toFixed(2)} €
            </td>
        `;
        tbody.appendChild(tr);
    });

    const tableContainer = tbody.parentElement?.parentElement; 
    if (tableContainer) {
        let noteElement = tableContainer.querySelector('.balance-interpretation-note');
        if (sortedSuppliers.length > 0 && !noteElement) {
            const note = document.createElement('p');
            note.className = 'info-message secondary balance-interpretation-note';
            note.style.marginTop = "1rem";
            note.style.fontSize = "0.85em";
            note.innerHTML = "<strong>Shënim:</strong> Salldo pozitive (+) do të thotë që biznesi i detyrohet furnitorit. Salldo negative (-) do të thotë që furnitori i detyrohet biznesit ose biznesi ka kredi tek furnitori.";
            tableContainer.appendChild(note);
        } else if (sortedSuppliers.length === 0 && noteElement) {
            noteElement.remove();
        }
    }
}

function initSupplierBalancesEventListeners(): void {
    dom.supplierBalancesSearchInput?.removeEventListener('input', renderSupplierBalancesTable); 
    dom.supplierBalancesSearchInput?.addEventListener('input', renderSupplierBalancesTable);
}

export { initSupplierBalancesView, initSupplierBalancesEventListeners, renderSupplierBalancesTable };