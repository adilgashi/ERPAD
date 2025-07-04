/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { IncomingPayment, Customer, Business, SaleRecord, LocalSaleInvoice } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import { setActiveManagerView } from './index';
import { createJournalEntryForIncomingPayment } from './accountingUtils';

let currentEditingIncomingPaymentId: string | null = null;
let currentIPAllocations: { invoiceId: string; invoiceType: 'pos' | 'local'; allocatedAmount: number }[] = [];


interface AllocatableInvoiceDisplay {
    id: string; 
    type: 'POS' | 'Shitje Lokale';
    date: string; 
    totalAmount: number;
    paidSoFar: number; 
    balanceDue: number;
}


export function initIncomingPaymentsEventListeners(): void {
    dom.incomingPaymentForm?.addEventListener('submit', handleSaveIncomingPayment);
    dom.cancelIncomingPaymentFormBtn?.addEventListener('click', resetIncomingPaymentForm);
    dom.ipCustomerSelect?.addEventListener('change', handleCustomerOrAmountChangeForIPAllocation);
    dom.ipTotalReceivedAmountInput?.addEventListener('input', handleCustomerOrAmountChangeForIPAllocation);
    dom.ipInvoicesToAllocateTbody?.addEventListener('input', handleIPInvoiceAllocationInputChange);
}

export function initIncomingPaymentsView(): void {
    if (!state.currentManagingBusinessId) {
        console.error("Nuk ka biznes aktiv për të menaxhuar pagesat hyrëse.");
        if (dom.managerContentIncomingPayments) {
            dom.managerContentIncomingPayments.innerHTML = '<p class="error-message">Gabim: Nuk ka biznes aktiv.</p>';
        }
        return;
    }
    populateIPCustomerSelect();
    renderExistingIncomingPaymentsTable();
    resetIncomingPaymentForm(); 
}

function populateIPCustomerSelect(): void {
    if (!dom.ipCustomerSelect) return;
    dom.ipCustomerSelect.innerHTML = '<option value="">-- Zgjidh Blerësin --</option>'; 
    
    state.customers.sort((a,b) => a.name.localeCompare(b.name)).forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (Kodi: ${customer.code})`;
        dom.ipCustomerSelect?.appendChild(option);
    });
}

function resetIncomingPaymentForm(): void {
    if (dom.incomingPaymentForm) dom.incomingPaymentForm.reset();
    if (dom.editIncomingPaymentIdInput) dom.editIncomingPaymentIdInput.value = '';
    if (dom.ipPaymentDateInput) dom.ipPaymentDateInput.value = getTodayDateString();
    if (dom.ipCustomerSelect) dom.ipCustomerSelect.value = ''; 
    if (dom.incomingPaymentFormError) dom.incomingPaymentFormError.textContent = '';
    if (dom.ipInvoiceAllocationSection) dom.ipInvoiceAllocationSection.style.display = 'none';
    if (dom.ipInvoicesToAllocateTbody) dom.ipInvoicesToAllocateTbody.innerHTML = '';
    if (dom.ipRemainingAllocationAmountSpan) dom.ipRemainingAllocationAmountSpan.textContent = '0.00';
    
    currentEditingIncomingPaymentId = null;
    currentIPAllocations = [];
    updateIPAllocationTableFooterTotals();
}

function renderExistingIncomingPaymentsTable(): void {
    if (!dom.existingIncomingPaymentsTbody) return;
    dom.existingIncomingPaymentsTbody.innerHTML = '';

    if (state.incomingPayments.length === 0) {
        dom.existingIncomingPaymentsTbody.innerHTML = '<tr><td colspan="6" class="text-center">Nuk ka pagesa hyrëse të regjistruara.</td></tr>';
        return;
    }

    const sortedPayments = [...state.incomingPayments].sort((a, b) => b.timestamp - a.timestamp);

    sortedPayments.forEach(payment => {
        const tr = document.createElement('tr');
        const customerName = payment.customerName || (payment.customerId ? state.customers.find(c => c.id === payment.customerId)?.name : 'I Paidentifikuar') || 'I Paidentifikuar';
        tr.innerHTML = `
            <td>${payment.id}</td>
            <td>${new Date(payment.paymentDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${customerName}</td>
            <td class="text-right">${payment.totalReceivedAmount.toFixed(2)} €</td>
            <td>${payment.paymentMethod}</td>
            <td>${payment.reference || '-'}</td>
        `;
        dom.existingIncomingPaymentsTbody.appendChild(tr);
    });
}

function handleCustomerOrAmountChangeForIPAllocation(): void {
    if (!dom.ipCustomerSelect || !dom.ipTotalReceivedAmountInput || !dom.ipInvoiceAllocationSection || !dom.ipInvoicesToAllocateTbody) return;

    const customerId = dom.ipCustomerSelect.value;
    let totalReceivedAmount = parseFloat(dom.ipTotalReceivedAmountInput.value);
    if (isNaN(totalReceivedAmount) || totalReceivedAmount < 0) {
        totalReceivedAmount = 0;
    }

    if (customerId) {
        dom.ipInvoiceAllocationSection.style.display = 'block';
        renderIPInvoicesForAllocation(customerId, totalReceivedAmount);
    } else {
        dom.ipInvoiceAllocationSection.style.display = 'none';
        dom.ipInvoicesToAllocateTbody.innerHTML = '';
        if (dom.ipRemainingAllocationAmountSpan) dom.ipRemainingAllocationAmountSpan.textContent = '0.00';
        currentIPAllocations = [];
    }
    updateIPAllocationTableFooterTotals();
}

function renderIPInvoicesForAllocation(customerId: string, totalPaymentAmount: number): void {
    if (!dom.ipInvoicesToAllocateTbody || !dom.ipRemainingAllocationAmountSpan) return;
    dom.ipInvoicesToAllocateTbody.innerHTML = '';
    currentIPAllocations = [];

    const allocatableInvoices: AllocatableInvoiceDisplay[] = [];

    // Get Local Sales Invoices
    state.localSalesInvoices
        .filter(inv => inv.customerId === customerId && inv.amountPaid < inv.totalAmountWithVAT)
        .forEach(inv => {
            allocatableInvoices.push({
                id: inv.id,
                type: 'Shitje Lokale',
                date: inv.invoiceDate,
                totalAmount: inv.totalAmountWithVAT,
                paidSoFar: inv.amountPaid,
                balanceDue: inv.totalAmountWithVAT - inv.amountPaid
            });
        });
    
    // Get POS Sales Invoices (SaleRecord)
    // For POS, paidSoFar is assumed 0 for this allocation table as SaleRecord doesn't store it.
    state.salesLog
        .filter(rec => rec.customerId === customerId) // Consider only sales explicitly linked to this customer
        .forEach(rec => {
            // Check if this POS invoice has already been "covered" by previous general payments. This is heuristic.
            // For simplicity in this step, we'll list all POS invoices. A more advanced system would track allocations.
            // A simpler approach: only show POS invoices if the customer has an overall positive balance.
            // Or, show all and let manager decide. For now, let's show all linked POS invoices.
             allocatableInvoices.push({
                id: rec.invoiceNumber,
                type: 'POS',
                date: rec.dailyCashEntryDate, 
                totalAmount: rec.grandTotal,
                paidSoFar: 0, // Assuming 0 paid for POS sales in this context
                balanceDue: rec.grandTotal 
            });
        });
    
    allocatableInvoices.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());


    if (allocatableInvoices.length === 0) {
        dom.ipInvoicesToAllocateTbody.innerHTML = '<tr><td colspan="7" class="text-center">Ky blerës nuk ka fatura të papaguara ose të paguara pjesërisht.</td></tr>';
        updateIPRemainingAllocationDisplay(totalPaymentAmount);
        updateIPAllocationTableFooterTotals();
        return;
    }

    let remainingAmountToAutoAllocate = totalPaymentAmount > 0 ? totalPaymentAmount : 0;

    allocatableInvoices.forEach(invoice => {
        const tr = document.createElement('tr');
        let amountToAllocateForThisInvoice = 0;
        if (remainingAmountToAutoAllocate > 0 && invoice.balanceDue > 0) {
            amountToAllocateForThisInvoice = Math.min(invoice.balanceDue, remainingAmountToAutoAllocate);
        }
        
        tr.innerHTML = `
            <td>${invoice.id}</td>
            <td>${new Date(invoice.date + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${invoice.type}</td>
            <td class="text-right ip-invoice-total">${invoice.totalAmount.toFixed(2)}</td>
            <td class="text-right ip-invoice-paid-so-far">${invoice.paidSoFar.toFixed(2)}</td>
            <td class="text-right ip-invoice-balance">${invoice.balanceDue.toFixed(2)}</td>
            <td>
                <input type="number" class="form-control ip-allocate-input" 
                       data-invoice-id="${invoice.id}" data-invoice-type="${invoice.type === 'POS' ? 'pos' : 'local'}"
                       value="${amountToAllocateForThisInvoice.toFixed(2)}" 
                       min="0" max="${invoice.balanceDue.toFixed(2)}" step="any" 
                       style="width: 120px; text-align: right;">
            </td>
        `;
        dom.ipInvoicesToAllocateTbody?.appendChild(tr);

        if (amountToAllocateForThisInvoice > 0) {
            currentIPAllocations.push({
                invoiceId: invoice.id,
                invoiceType: invoice.type === 'POS' ? 'pos' : 'local',
                allocatedAmount: amountToAllocateForThisInvoice
            });
            remainingAmountToAutoAllocate -= amountToAllocateForThisInvoice;
        }
    });
    updateIPRemainingAllocationDisplay(totalPaymentAmount);
    updateIPAllocationTableFooterTotals();
}

function handleIPInvoiceAllocationInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target || !target.classList.contains('ip-allocate-input')) return;

    const invoiceId = target.dataset.invoiceId;
    const invoiceType = target.dataset.invoiceType as 'pos' | 'local';
    if (!invoiceId || !invoiceType) return;

    const invoice = invoiceType === 'local' 
        ? state.localSalesInvoices.find(inv => inv.id === invoiceId)
        : state.salesLog.find(rec => rec.invoiceNumber === invoiceId);
        
    if (!invoice) return;

    let allocatedAmount = parseFloat(target.value);
    const totalAmountDue = invoiceType === 'local' ? (invoice as LocalSaleInvoice).totalAmountWithVAT : (invoice as SaleRecord).grandTotal;
    const amountAlreadyPaid = invoiceType === 'local' ? (invoice as LocalSaleInvoice).amountPaid || 0 : 0; // POS sales assume 0 paid for this table
    const balanceDue = totalAmountDue - amountAlreadyPaid;
    
    let totalPayment = parseFloat(dom.ipTotalReceivedAmountInput?.value || '0');
    if(isNaN(totalPayment) || totalPayment < 0) totalPayment = 0;

    if (isNaN(allocatedAmount) || allocatedAmount < 0) {
        allocatedAmount = 0;
        target.value = '0.00';
    }
    if (allocatedAmount > balanceDue) {
        allocatedAmount = balanceDue;
        target.value = balanceDue.toFixed(2);
        if (dom.incomingPaymentFormError) dom.incomingPaymentFormError.textContent = `Shuma e alokuar për faturën ${invoiceId} nuk mund të kalojë balancën e mbetur prej ${balanceDue.toFixed(2)} €.`;
    } else {
         if (dom.incomingPaymentFormError && dom.incomingPaymentFormError.textContent?.includes(`faturën ${invoiceId}`)) {
            dom.incomingPaymentFormError.textContent = ''; 
        }
    }
    
    const existingAllocationIndex = currentIPAllocations.findIndex(alloc => alloc.invoiceId === invoiceId && alloc.invoiceType === invoiceType);
    if (allocatedAmount > 0) {
        if (existingAllocationIndex > -1) {
            currentIPAllocations[existingAllocationIndex].allocatedAmount = allocatedAmount;
        } else {
            currentIPAllocations.push({ invoiceId, invoiceType, allocatedAmount });
        }
    } else {
        if (existingAllocationIndex > -1) {
            currentIPAllocations.splice(existingAllocationIndex, 1);
        }
    }
    updateIPRemainingAllocationDisplay(totalPayment);
    updateIPAllocationTableFooterTotals();
}

function updateIPRemainingAllocationDisplay(totalPaymentAmount: number): void {
    if (!dom.ipRemainingAllocationAmountSpan || !dom.incomingPaymentFormError) return;
    
    const totalAllocated = currentIPAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
    const remainingForAllocation = totalPaymentAmount - totalAllocated;
    dom.ipRemainingAllocationAmountSpan.textContent = `${remainingForAllocation.toFixed(2)}`;

    if (dom.incomingPaymentFormError.textContent?.startsWith("Kujdes: Shuma totale e alokuar")) {
        dom.incomingPaymentFormError.textContent = '';
    }
    if (totalAllocated > totalPaymentAmount + 0.001) {
        if (!dom.incomingPaymentFormError.textContent?.includes("nuk mund të kalojë balancën e mbetur")) {
            dom.incomingPaymentFormError.textContent = `Kujdes: Shuma totale e alokuar (${totalAllocated.toFixed(2)}€) tejkalon shumën totale të pagesës (${totalPaymentAmount.toFixed(2)}€).`;
        }
    }
}

function updateIPAllocationTableFooterTotals(): void {
    const tfoot = dom.ipInvoicesToAllocateTfoot;
    if (!tfoot || !dom.ipInvoicesToAllocateTbody) {
        console.warn("IP Allocation table tfoot or tbody not found for updating totals.");
        return;
    }

    const rows = Array.from(dom.ipInvoicesToAllocateTbody.querySelectorAll('tr'));
    let totalInvoiceAmount = 0;
    let totalPaidSoFar = 0;
    let totalRemainingBalance = 0;
    let totalPayingNow = 0;

    rows.forEach(row => {
        const tr = row as HTMLTableRowElement;
        const totalCell = tr.querySelector('.ip-invoice-total') as HTMLTableCellElement | null;
        const paidCell = tr.querySelector('.ip-invoice-paid-so-far') as HTMLTableCellElement | null;
        const balanceCell = tr.querySelector('.ip-invoice-balance') as HTMLTableCellElement | null;
        const payingInput = tr.querySelector('.ip-allocate-input') as HTMLInputElement | null;

        if (totalCell) totalInvoiceAmount += parseFloat(totalCell.textContent?.replace('€', '').trim() || '0');
        if (paidCell) totalPaidSoFar += parseFloat(paidCell.textContent?.replace('€', '').trim() || '0');
        if (balanceCell) totalRemainingBalance += parseFloat(balanceCell.textContent?.replace('€', '').trim() || '0');
        if (payingInput) totalPayingNow += parseFloat(payingInput.value || '0');
    });
    
    if (dom.ipAllocTotalInvoiceAmount) dom.ipAllocTotalInvoiceAmount.textContent = `${totalInvoiceAmount.toFixed(2)} €`;
    if (dom.ipAllocTotalPaidSoFar) dom.ipAllocTotalPaidSoFar.textContent = `${totalPaidSoFar.toFixed(2)} €`;
    if (dom.ipAllocTotalRemainingBalance) dom.ipAllocTotalRemainingBalance.textContent = `${totalRemainingBalance.toFixed(2)} €`;
    if (dom.ipAllocTotalPayingNow) dom.ipAllocTotalPayingNow.textContent = `${totalPayingNow.toFixed(2)} €`;
    
    if (rows.length === 0 || (rows[0] as HTMLTableRowElement).textContent?.includes("nuk ka fatura")) {
        if (dom.ipAllocTotalInvoiceAmount) dom.ipAllocTotalInvoiceAmount.textContent = `0.00 €`;
        if (dom.ipAllocTotalPaidSoFar) dom.ipAllocTotalPaidSoFar.textContent = `0.00 €`;
        if (dom.ipAllocTotalRemainingBalance) dom.ipAllocTotalRemainingBalance.textContent = `0.00 €`;
        if (dom.ipAllocTotalPayingNow) dom.ipAllocTotalPayingNow.textContent = `0.00 €`;
    }
}


async function handleSaveIncomingPayment(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.ipCustomerSelect || !dom.ipPaymentDateInput || !dom.ipTotalReceivedAmountInput ||
        !dom.ipPaymentMethodSelect || !dom.incomingPaymentFormError ||
        !state.currentUser || !state.currentManagingBusinessId) {
        alert("Gabim: Mungojnë elemente të formularit të pagesës hyrëse.");
        return;
    }

    const customerId = dom.ipCustomerSelect.value || undefined;
    const paymentDate = dom.ipPaymentDateInput.value;
    const totalReceivedAmount = parseFloat(dom.ipTotalReceivedAmountInput.value);
    const paymentMethod = dom.ipPaymentMethodSelect.value as 'Cash' | 'Transfertë Bankare';
    const reference = dom.ipReferenceInput?.value.trim() || undefined;
    const notes = dom.ipNotesTextarea?.value.trim() || undefined;

    dom.incomingPaymentFormError.textContent = '';

    if (!paymentDate) { dom.incomingPaymentFormError.textContent = "Data e pagesës është e detyrueshme."; return; }
    if (isNaN(totalReceivedAmount) || totalReceivedAmount <= 0) { dom.incomingPaymentFormError.textContent = "Shuma totale e marrë është e pavlefshme."; return; }
    
    const totalAllocatedAmount = currentIPAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
    if (Math.abs(totalAllocatedAmount - totalReceivedAmount) > 0.001 && currentIPAllocations.length > 0) { 
        dom.incomingPaymentFormError.textContent = `Shuma totale e alokuar (${totalAllocatedAmount.toFixed(2)}€) nuk përputhet saktësisht me shumën totale të pagesës (${totalReceivedAmount.toFixed(2)}€). Ju lutem rishikoni alokimet ose mos alokoni fare nëse është pagesë e përgjithshme.`;
        return;
    }
    
    const customer = customerId ? state.customers.find(c => c.id === customerId) : undefined;
    const customerName = customer ? customer.name : (customerId === "" ? "Pagesë e Paidentifikuar" : undefined);

    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business) { alert("Biznesi nuk u gjet."); return; }
    const fiscalYear = business.fiscalYear; const seed = business.incomingPaymentIdSeed;
    const newPaymentId = `PAGH-${String(seed).padStart(3, '0')}-${fiscalYear}`;

    const newPayment: IncomingPayment = {
        id: newPaymentId, businessId: state.currentManagingBusinessId, customerId, customerName,
        paymentDate, totalReceivedAmount, paymentMethod, reference, notes,
        recordedByManagerId: state.currentUser.id, recordedByManagerUsername: state.currentUser.username,
        timestamp: Date.now(),
    };

    state.incomingPayments.push(newPayment);
    business.incomingPaymentIdSeed = seed + 1;
    await storage.saveAllBusinesses(state.businesses);
    await storage.saveIncomingPaymentsToLocalStorage(state.currentManagingBusinessId, state.incomingPayments);
    await createJournalEntryForIncomingPayment(newPayment);

    // Update amountPaid for LocalSaleInvoices based on allocations
    let localSalesInvoicesUpdated = false;
    currentIPAllocations.forEach(alloc => {
        if (alloc.invoiceType === 'local') {
            const invoiceIndex = state.localSalesInvoices.findIndex(inv => inv.id === alloc.invoiceId);
            if (invoiceIndex > -1) {
                state.localSalesInvoices[invoiceIndex].amountPaid = (state.localSalesInvoices[invoiceIndex].amountPaid || 0) + alloc.allocatedAmount;
                localSalesInvoicesUpdated = true;
            }
        }
        // POS SaleRecords do not have amountPaid, so no direct update here.
    });
    if (localSalesInvoicesUpdated) {
        await storage.saveLocalSalesInvoicesToLocalStorage(state.currentManagingBusinessId, state.localSalesInvoices);
    }


    alert(`Pagesa hyrëse me ID ${newPaymentId} u ruajt me sukses.`);
    resetIncomingPaymentForm();
    renderExistingIncomingPaymentsTable();
    populateIPCustomerSelect(); 
}
