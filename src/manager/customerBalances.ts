

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import { SaleRecord, LocalSaleInvoice, IncomingPayment, Customer, SalesReturnInvoice } from '../models';
import { showCustomConfirm } from '../core/ui';

function initCustomerBalancesView(): void {
    if (!dom.managerContentCustomerBalances) {
        console.error("Elementi i pamjes së saldove të blerësve nuk u gjet.");
        return;
    }
    addRefreshButtonToCustomerBalances();
    if (dom.customerBalancesSearchInput) dom.customerBalancesSearchInput.value = '';
    renderCustomerBalancesTable();
}

function addRefreshButtonToCustomerBalances(): void {
    const container = dom.managerContentCustomerBalances;
    if (!container) return;

    let titleElementQuery = container.querySelector('h2.manager-section-title');
    let titleElement: HTMLElement | null = null;

    if (titleElementQuery instanceof HTMLElement) {
        titleElement = titleElementQuery;
    } else if (!titleElementQuery) {
        titleElement = document.createElement('h2');
        titleElement.className = 'manager-section-title';
        titleElement.textContent = 'Salldo e Blerësve';
        container.insertBefore(titleElement, container.firstChild);
    }


    if (document.getElementById('refresh-customer-balances-btn')) return;

    const refreshButton = document.createElement('button');
    refreshButton.id = 'refresh-customer-balances-btn';
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
    
    refreshButton.addEventListener('click', handleRefreshCustomerBalances);
}

function handleRefreshCustomerBalances() {
    renderCustomerBalancesTable();
    showCustomConfirm("Saldot e blerësve u rifreskuan.", () => {});
}


function renderCustomerBalancesTable(): void {
    const tbody = dom.customerBalancesTbody ?? document.getElementById('customer-balances-tbody') as HTMLTableSectionElement | null;
    
    if (!tbody || !state.currentManagingBusinessId) {
        console.error("Tabela e saldove të blerësve (tbody) #customer-balances-tbody nuk u gjet.");
        return;
    }
    
    const searchTerm = dom.customerBalancesSearchInput ? dom.customerBalancesSearchInput.value.toLowerCase().trim() : '';
    tbody.innerHTML = '';


    let filteredCustomers = state.customers;
    if (searchTerm) {
        filteredCustomers = state.customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm) ||
            (customer.code && customer.code.toLowerCase().includes(searchTerm))
        );
    }

    if (filteredCustomers.length === 0) {
        const message = searchTerm ? 'Asnjë blerës nuk përputhet me kërkimin.' : 'Nuk ka blerës të regjistruar.';
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">${message}</td></tr>`;
        return;
    }
    
    const sortedCustomers = [...filteredCustomers].sort((a,b) => a.name.localeCompare(b.name));

    sortedCustomers.forEach(customer => {
        let totalDebitFromSales = 0;
        let totalCreditFromPaymentsAndReturns = 0; // Modified to include returns
        const openingBalance = customer.openingBalance || 0;

        // Calculate total debit from POS Sales and Local Sales Invoices
        state.salesLog
            .filter(sale => sale.customerId === customer.id && sale.businessId === state.currentManagingBusinessId)
            .forEach(sale => {
                totalDebitFromSales += sale.grandTotal;
            });
        state.localSalesInvoices
            .filter(invoice => invoice.customerId === customer.id && invoice.businessId === state.currentManagingBusinessId)
            .forEach(invoice => {
                totalDebitFromSales += invoice.totalAmountWithVAT;
            });

        // Calculate total credit from Incoming Payments
        state.incomingPayments
            .filter(payment => payment.customerId === customer.id && payment.businessId === state.currentManagingBusinessId)
            .forEach(payment => {
                totalCreditFromPaymentsAndReturns += payment.totalReceivedAmount;
            });
        
        // Add total credit from Sales Returns
        state.salesReturnInvoices
            .filter(sri => sri.customerId === customer.id && sri.businessId === state.currentManagingBusinessId)
            .forEach(sri => {
                totalCreditFromPaymentsAndReturns += sri.totalReturnAmountWithVAT;
            });
        
        const overallDebit = (openingBalance > 0 ? openingBalance : 0) + totalDebitFromSales;
        const overallCredit = (openingBalance < 0 ? Math.abs(openingBalance) : 0) + totalCreditFromPaymentsAndReturns;
        
        const balance = openingBalance + totalDebitFromSales - totalCreditFromPaymentsAndReturns;


        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${customer.code}</td>
            <td>${customer.name}</td>
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
        if (sortedCustomers.length > 0 && !noteElement) {
            const note = document.createElement('p');
            note.className = 'info-message secondary balance-interpretation-note';
            note.style.marginTop = "1rem";
            note.style.fontSize = "0.85em";
            note.innerHTML = "<strong>Shënim:</strong> Salldo pozitive (+) do të thotë që blerësi i detyrohet biznesit. Salldo negative (-) do të thotë që biznesi i detyrohet blerësit ose blerësi ka kredi.";
            tableContainer.appendChild(note);
        } else if (sortedCustomers.length === 0 && noteElement) {
            noteElement.remove();
        }
    }
}

function initCustomerBalancesEventListeners(): void {
    dom.customerBalancesSearchInput?.removeEventListener('input', renderCustomerBalancesTable); 
    dom.customerBalancesSearchInput?.addEventListener('input', renderCustomerBalancesTable);
}

const CustomerBalances = {
    initCustomerBalancesView,
    initCustomerBalancesEventListeners,
    renderCustomerBalancesTable 
};

export default CustomerBalances;