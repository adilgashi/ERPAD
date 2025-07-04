/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { PurchaseInvoice, OutgoingPayment, OutgoingPaymentAllocation, Supplier, Business } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import { showCustomConfirm, openPrintPreviewModal, generatePrintableOutgoingPaymentHTML } from '../core/ui';
import { setActiveManagerView } from './index';
import { createJournalEntryForOutgoingPayment } from './accountingUtils';

let currentPaymentAllocations: OutgoingPaymentAllocation[] = [];
let currentEditingOutgoingPaymentId: string | null = null;

export function initOutgoingPaymentsEventListeners(): void {
    dom.opSupplierSelect?.addEventListener('change', handleSupplierOrAmountChangeForAllocation);
    dom.opTotalPaidAmountInput?.addEventListener('input', handleSupplierOrAmountChangeForAllocation);
    dom.saveOutgoingPaymentBtn?.addEventListener('click', handleSaveOutgoingPayment);
    dom.cancelOutgoingPaymentFormBtn?.addEventListener('click', () => {
        resetOutgoingPaymentForm();
        // No need to change view here, user might want to stay on the payments page
    });

    dom.opInvoicesToAllocateTbody?.addEventListener('input', handleInvoiceAllocationInputChange);

    dom.opDetailsModalCloseBtn?.addEventListener('click', closeOutgoingPaymentDetailsModal);
    dom.opDetailsCloseModalActionBtn?.addEventListener('click', closeOutgoingPaymentDetailsModal);
    dom.opDetailsPrintPaymentBtn?.addEventListener('click', handlePrintOutgoingPaymentReceipt);
}

export function initOutgoingPaymentsView(): void {
    if (!state.currentManagingBusinessId) return;
    resetOutgoingPaymentForm();
    populateSupplierSelectForPayments();
    renderExistingOutgoingPayments();
}

function resetOutgoingPaymentForm(): void {
    if (dom.outgoingPaymentForm) dom.outgoingPaymentForm.reset();
    if (dom.editOutgoingPaymentIdInput) dom.editOutgoingPaymentIdInput.value = '';
    if (dom.opPaymentDateInput) dom.opPaymentDateInput.value = getTodayDateString();
    if (dom.opInvoiceAllocationSection) dom.opInvoiceAllocationSection.style.display = 'none';
    if (dom.opInvoicesToAllocateTbody) dom.opInvoicesToAllocateTbody.innerHTML = '';
    if (dom.opRemainingAllocationAmountSpan) dom.opRemainingAllocationAmountSpan.textContent = '0.00';
    if (dom.outgoingPaymentFormError) dom.outgoingPaymentFormError.textContent = '';
    currentPaymentAllocations = [];
    currentEditingOutgoingPaymentId = null;
    if (dom.opSupplierSelect) dom.opSupplierSelect.value = '';
    if (dom.opTotalPaidAmountInput) dom.opTotalPaidAmountInput.value = '';
    
    const formTitleElement = document.getElementById('outgoing-payment-form-title');
    if (formTitleElement) {
        formTitleElement.textContent = "Regjistro Pagesë të Re";
    }
    updateAllocationTableFooterTotals(); // Reset footer totals
}

function populateSupplierSelectForPayments(): void {
    if (!dom.opSupplierSelect) return;
    dom.opSupplierSelect.innerHTML = '<option value="">-- Zgjidh Furnitorin --</option>';
    state.suppliers.sort((a,b) => a.name.localeCompare(b.name)).forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = `${supplier.name} (Kodi: ${supplier.code})`;
        dom.opSupplierSelect?.appendChild(option);
    });
}

function handleSupplierOrAmountChangeForAllocation(): void {
    if (!dom.opSupplierSelect || !dom.opTotalPaidAmountInput || !dom.opInvoiceAllocationSection || !dom.opInvoicesToAllocateTbody) return;

    const supplierId = dom.opSupplierSelect.value;
    let totalPaidAmount = parseFloat(dom.opTotalPaidAmountInput.value);
    if (isNaN(totalPaidAmount) || totalPaidAmount < 0) {
        totalPaidAmount = 0; 
    }


    if (supplierId) { 
        dom.opInvoiceAllocationSection.style.display = 'block';
        renderInvoicesForAllocation(supplierId, totalPaidAmount);
    } else { 
        dom.opInvoiceAllocationSection.style.display = 'none';
        dom.opInvoicesToAllocateTbody.innerHTML = '';
        if (dom.opRemainingAllocationAmountSpan) dom.opRemainingAllocationAmountSpan.textContent = '0.00';
        currentPaymentAllocations = [];
        updateAllocationTableFooterTotals(); // Update footer even when no supplier
    }
}


function renderInvoicesForAllocation(supplierId: string, totalPaymentAmount: number): void {
    if (!dom.opInvoicesToAllocateTbody || !dom.opRemainingAllocationAmountSpan) return;
    dom.opInvoicesToAllocateTbody.innerHTML = '';
    currentPaymentAllocations = []; 

    const unpaidInvoices = state.purchaseInvoices.filter(inv =>
        inv.supplierId === supplierId &&
        (inv.amountPaid === undefined || inv.amountPaid < inv.totalAmountWithVAT)
    ).sort((a,b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()); 

    if (unpaidInvoices.length === 0) {
        dom.opInvoicesToAllocateTbody.innerHTML = '<tr><td colspan="7" class="text-center">Ky furnitor nuk ka fatura të papaguara ose të paguara pjesërisht.</td></tr>';
        updateRemainingAllocationDisplay(totalPaymentAmount);
        updateAllocationTableFooterTotals(); // Ensure footer is updated/reset
        return;
    }

    let remainingAmountToAutoAllocate = totalPaymentAmount > 0 ? totalPaymentAmount : 0;

    unpaidInvoices.forEach(invoice => {
        const tr = document.createElement('tr');
        const amountAlreadyPaid = invoice.amountPaid || 0;
        const balanceDue = invoice.totalAmountWithVAT - amountAlreadyPaid;
        
        let amountToAllocateForThisInvoice = 0;
        if (remainingAmountToAutoAllocate > 0 && balanceDue > 0) {
            amountToAllocateForThisInvoice = Math.min(balanceDue, remainingAmountToAutoAllocate);
        }
        
        tr.innerHTML = `
            <td>${invoice.id}</td>
            <td>${invoice.supplierInvoiceNumber}</td>
            <td>${new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td class="text-right op-invoice-total">${invoice.totalAmountWithVAT.toFixed(2)}</td>
            <td class="text-right op-invoice-paid-so-far">${amountAlreadyPaid.toFixed(2)}</td>
            <td class="text-right op-invoice-balance">${balanceDue.toFixed(2)}</td>
            <td>
                <input type="number" class="form-control op-allocate-input" data-invoice-id="${invoice.id}" 
                       value="${amountToAllocateForThisInvoice.toFixed(2)}" 
                       min="0" max="${balanceDue.toFixed(2)}" step="any" 
                       style="width: 120px; text-align: right;">
            </td>
        `;
        dom.opInvoicesToAllocateTbody?.appendChild(tr);

        if (amountToAllocateForThisInvoice > 0) {
            currentPaymentAllocations.push({
                purchaseInvoiceId: invoice.id,
                allocatedAmount: amountToAllocateForThisInvoice
            });
            remainingAmountToAutoAllocate -= amountToAllocateForThisInvoice;
        }
    });
    updateRemainingAllocationDisplay(totalPaymentAmount);
    updateAllocationTableFooterTotals();
}

function handleInvoiceAllocationInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target || !target.classList.contains('op-allocate-input')) return;

    const invoiceId = target.dataset.invoiceId;
    if (!invoiceId) return;

    const invoice = state.purchaseInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    let allocatedAmount = parseFloat(target.value);
    const amountAlreadyPaid = invoice.amountPaid || 0;
    const balanceDue = invoice.totalAmountWithVAT - amountAlreadyPaid;
    
    let totalPayment = parseFloat(dom.opTotalPaidAmountInput?.value || '0');
    if(isNaN(totalPayment) || totalPayment < 0) totalPayment = 0;


    if (isNaN(allocatedAmount) || allocatedAmount < 0) {
        allocatedAmount = 0;
        target.value = '0.00';
    }
    if (allocatedAmount > balanceDue) {
        allocatedAmount = balanceDue;
        target.value = balanceDue.toFixed(2);
        if (dom.outgoingPaymentFormError) dom.outgoingPaymentFormError.textContent = `Shuma e alokuar për faturën ${invoice.id} nuk mund të kalojë balancën e mbetur prej ${balanceDue.toFixed(2)} €.`;
    } else {
         if (dom.outgoingPaymentFormError && dom.outgoingPaymentFormError.textContent?.includes(`faturën ${invoice.id}`)) {
            dom.outgoingPaymentFormError.textContent = ''; 
        }
    }
    
    const existingAllocationIndex = currentPaymentAllocations.findIndex(alloc => alloc.purchaseInvoiceId === invoiceId);
    if (allocatedAmount > 0) {
        if (existingAllocationIndex > -1) {
            currentPaymentAllocations[existingAllocationIndex].allocatedAmount = allocatedAmount;
        } else {
            currentPaymentAllocations.push({ purchaseInvoiceId: invoiceId, allocatedAmount });
        }
    } else {
        if (existingAllocationIndex > -1) {
            currentPaymentAllocations.splice(existingAllocationIndex, 1);
        }
    }
    updateRemainingAllocationDisplay(totalPayment);
    updateAllocationTableFooterTotals();
}

function updateRemainingAllocationDisplay(totalPaymentAmount: number): void {
    if (!dom.opRemainingAllocationAmountSpan || !dom.outgoingPaymentFormError) return;
    
    const totalAllocated = currentPaymentAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
    const remainingForAllocation = totalPaymentAmount - totalAllocated;
    dom.opRemainingAllocationAmountSpan.textContent = `${remainingForAllocation.toFixed(2)}`;

    if (dom.outgoingPaymentFormError.textContent?.startsWith("Kujdes: Shuma totale e alokuar")) {
        dom.outgoingPaymentFormError.textContent = '';
    }

    if (totalAllocated > totalPaymentAmount + 0.001) { 
        if (!dom.outgoingPaymentFormError.textContent?.includes("nuk mund të kalojë balancën e mbetur")) { 
             dom.outgoingPaymentFormError.textContent = `Kujdes: Shuma totale e alokuar (${totalAllocated.toFixed(2)}€) tejkalon shumën totale të pagesës (${totalPaymentAmount.toFixed(2)}€).`;
        }
    }
}

function updateAllocationTableFooterTotals(): void {
    if (!dom.opInvoicesToAllocateTfoot || !dom.opInvoicesToAllocateTbody) {
        console.warn("Allocation table tfoot or tbody not found for updating totals.");
        return;
    }

    const rows = Array.from(dom.opInvoicesToAllocateTbody.querySelectorAll('tr'));
    let totalInvoiceAmount = 0;
    let totalPaidSoFar = 0;
    let totalRemainingBalance = 0;
    let totalPayingNow = 0;

    rows.forEach(row => {
        const tr = row as HTMLTableRowElement;
        const totalCell = tr.querySelector('.op-invoice-total') as HTMLTableCellElement | null;
        const paidCell = tr.querySelector('.op-invoice-paid-so-far') as HTMLTableCellElement | null;
        const balanceCell = tr.querySelector('.op-invoice-balance') as HTMLTableCellElement | null;
        const payingInput = tr.querySelector('.op-allocate-input') as HTMLInputElement | null;

        if (totalCell) totalInvoiceAmount += parseFloat(totalCell.textContent?.replace('€', '').trim() || '0');
        if (paidCell) totalPaidSoFar += parseFloat(paidCell.textContent?.replace('€', '').trim() || '0');
        if (balanceCell) totalRemainingBalance += parseFloat(balanceCell.textContent?.replace('€', '').trim() || '0');
        if (payingInput) totalPayingNow += parseFloat(payingInput.value || '0');
    });
    
    if (dom.opAllocTotalInvoiceAmount) dom.opAllocTotalInvoiceAmount.textContent = `${totalInvoiceAmount.toFixed(2)} €`;
    if (dom.opAllocTotalPaidSoFar) dom.opAllocTotalPaidSoFar.textContent = `${totalPaidSoFar.toFixed(2)} €`;
    if (dom.opAllocTotalRemainingBalance) dom.opAllocTotalRemainingBalance.textContent = `${totalRemainingBalance.toFixed(2)} €`;
    if (dom.opAllocTotalPayingNow) dom.opAllocTotalPayingNow.textContent = `${totalPayingNow.toFixed(2)} €`;
    
    if (rows.length === 0 || (rows[0] as HTMLTableRowElement).textContent?.includes("nuk ka fatura")) {
        if (dom.opAllocTotalInvoiceAmount) dom.opAllocTotalInvoiceAmount.textContent = `0.00 €`;
        if (dom.opAllocTotalPaidSoFar) dom.opAllocTotalPaidSoFar.textContent = `0.00 €`;
        if (dom.opAllocTotalRemainingBalance) dom.opAllocTotalRemainingBalance.textContent = `0.00 €`;
        if (dom.opAllocTotalPayingNow) dom.opAllocTotalPayingNow.textContent = `0.00 €`;
    }
}


async function handleSaveOutgoingPayment(): Promise<void> {
    if (!dom.opSupplierSelect || !dom.opPaymentDateInput || !dom.opTotalPaidAmountInput ||
        !dom.opPaymentMethodSelect || !dom.outgoingPaymentFormError ||
        !state.currentUser || !state.currentManagingBusinessId) {
        alert("Gabim: Mungojnë elemente të formularit të pagesës.");
        return;
    }

    const supplierId = dom.opSupplierSelect.value;
    const paymentDate = dom.opPaymentDateInput.value;
    const totalPaidAmount = parseFloat(dom.opTotalPaidAmountInput.value);
    const paymentMethod = dom.opPaymentMethodSelect.value as 'Cash' | 'Transfertë Bankare';
    const reference = dom.opReferenceInput?.value.trim() || undefined;
    const notes = dom.opNotesTextarea?.value.trim() || undefined;

    dom.outgoingPaymentFormError.textContent = '';

    if (!supplierId) { dom.outgoingPaymentFormError.textContent = "Zgjidh furnitorin."; return; }
    if (!paymentDate) { dom.outgoingPaymentFormError.textContent = "Zgjidh datën e pagesës."; return; }
    if (isNaN(totalPaidAmount) || totalPaidAmount <= 0) { dom.outgoingPaymentFormError.textContent = "Shuma totale e pagesës është e pavlefshme."; return; }

    const totalAllocatedAmount = currentPaymentAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
    
    if (Math.abs(totalAllocatedAmount - totalPaidAmount) > 0.001) { 
        dom.outgoingPaymentFormError.textContent = `Shuma totale e alokuar (${totalAllocatedAmount.toFixed(2)}€) nuk përputhet saktësisht me shumën totale të pagesës (${totalPaidAmount.toFixed(2)}€). Ju lutem rishikoni alokimet.`;
        return;
    }

    const supplier = state.suppliers.find(s => s.id === supplierId);
    if (!supplier) { dom.outgoingPaymentFormError.textContent = "Furnitori i zgjedhur nuk është valid."; return; }

    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business) { alert("Biznesi nuk u gjet."); return; }
    const fiscalYear = business.fiscalYear;
    const seed = business.outgoingPaymentIdSeed;
    const newPaymentId = `PAG-${String(seed).padStart(3, '0')}-${fiscalYear}`;

    const newPayment: OutgoingPayment = {
        id: newPaymentId,
        businessId: state.currentManagingBusinessId,
        supplierId,
        supplierName: supplier.name,
        paymentDate,
        totalPaidAmount,
        paymentMethod,
        reference,
        notes,
        allocations: [...currentPaymentAllocations], 
        recordedByManagerId: state.currentUser.id,
        recordedByManagerUsername: state.currentUser.username,
        timestamp: Date.now(),
    };

    state.outgoingPayments.push(newPayment);
    business.outgoingPaymentIdSeed = seed + 1;
    await storage.saveAllBusinesses(state.businesses);
    await storage.saveOutgoingPaymentsToLocalStorage(state.currentManagingBusinessId, state.outgoingPayments);
    await createJournalEntryForOutgoingPayment(newPayment);

    currentPaymentAllocations.forEach(alloc => {
        const invoice = state.purchaseInvoices.find(inv => inv.id === alloc.purchaseInvoiceId);
        if (invoice) {
            invoice.amountPaid = (invoice.amountPaid || 0) + alloc.allocatedAmount;
        }
    });
    await storage.savePurchaseInvoicesToLocalStorage(state.currentManagingBusinessId, state.purchaseInvoices);

    alert(`Pagesa me ID ${newPaymentId} u ruajt me sukses.`);
    resetOutgoingPaymentForm();
    renderExistingOutgoingPayments();
    populateSupplierSelectForPayments();
}

function renderExistingOutgoingPayments(): void {
    if (!dom.existingOutgoingPaymentsTbody) return;
    dom.existingOutgoingPaymentsTbody.innerHTML = '';

    if (state.outgoingPayments.length === 0) {
        dom.existingOutgoingPaymentsTbody.innerHTML = '<tr><td colspan="7" class="text-center">Nuk ka pagesa të regjistruara më parë.</td></tr>';
        return;
    }

    const sortedPayments = [...state.outgoingPayments].sort((a, b) => b.timestamp - a.timestamp);

    sortedPayments.forEach(payment => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${payment.id}</td>
            <td>${new Date(payment.paymentDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${payment.supplierName}</td>
            <td class="text-right">${payment.totalPaidAmount.toFixed(2)} €</td>
            <td>${payment.paymentMethod}</td>
            <td>${payment.reference || '-'}</td>
            <td>
                <button class="btn btn-info btn-sm view-op-details-btn" data-payment-id="${payment.id}">Detajet</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.view-op-details-btn')?.addEventListener('click', () => openOutgoingPaymentDetailsModal(payment.id));
        dom.existingOutgoingPaymentsTbody?.appendChild(tr);
    });
}

function openOutgoingPaymentDetailsModal(paymentId: string): void {
    if (!dom.outgoingPaymentDetailsModal || !dom.opDetailsPaymentIdSpan || !dom.opDetailsSupplierNameSpan ||
        !dom.opDetailsPaymentDateSpan || !dom.opDetailsTotalPaidAmountSpan || !dom.opDetailsPaymentMethodSpan ||
        !dom.opDetailsReferenceSpan || !dom.opDetailsNotesSpan || !dom.opDetailsAllocationsTbody ||
        !dom.opDetailsPrintPaymentBtn) return;

    const payment = state.outgoingPayments.find(p => p.id === paymentId);
    if (!payment) {
        alert("Detajet e pagesës nuk u gjetën.");
        return;
    }

    dom.opDetailsPaymentIdSpan.textContent = payment.id;
    dom.opDetailsSupplierNameSpan.textContent = payment.supplierName;
    dom.opDetailsPaymentDateSpan.textContent = new Date(payment.paymentDate + 'T00:00:00').toLocaleDateString('sq-AL');
    dom.opDetailsTotalPaidAmountSpan.textContent = `${payment.totalPaidAmount.toFixed(2)} €`;
    dom.opDetailsPaymentMethodSpan.textContent = payment.paymentMethod;
    dom.opDetailsReferenceSpan.textContent = payment.reference || '-';
    dom.opDetailsNotesSpan.textContent = payment.notes || '-';

    dom.opDetailsAllocationsTbody.innerHTML = '';
    if (payment.allocations.length > 0) {
        payment.allocations.forEach(alloc => {
            const invoice = state.purchaseInvoices.find(inv => inv.id === alloc.purchaseInvoiceId);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${alloc.purchaseInvoiceId}</td>
                <td>${invoice?.supplierInvoiceNumber || 'E Panjohur'}</td>
                <td>${invoice ? new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('sq-AL') : '-'}</td>
                <td class="text-right">${alloc.allocatedAmount.toFixed(2)} €</td>
            `;
            dom.opDetailsAllocationsTbody?.appendChild(tr);
        });
    } else {
        dom.opDetailsAllocationsTbody.innerHTML = '<tr><td colspan="4" class="text-center">Kjo pagesë nuk është alokuar në asnjë faturë specifike.</td></tr>';
    }
    
    dom.opDetailsPrintPaymentBtn.dataset.paymentId = payment.id;
    dom.outgoingPaymentDetailsModal.style.display = 'block';
}

function closeOutgoingPaymentDetailsModal(): void {
    if (dom.outgoingPaymentDetailsModal) dom.outgoingPaymentDetailsModal.style.display = 'none';
}

function handlePrintOutgoingPaymentReceipt(event: Event): void {
    const button = event.target as HTMLButtonElement;
    const paymentId = button.dataset.paymentId;
    if (!paymentId) return;

    const payment = state.outgoingPayments.find(p => p.id === paymentId);
    if (!payment) { alert("Pagesa nuk u gjet për printim."); return; }
    
    const receiptHtml = generatePrintableOutgoingPaymentHTML(payment, state.businessDetails);

    if (dom.printPreviewModalTitle) dom.printPreviewModalTitle.textContent = `Dëftesë Pagese: ${payment.id}`;
    if (dom.printPreviewContent) dom.printPreviewContent.innerHTML = receiptHtml;
    openPrintPreviewModal();
}
