/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { CreditNote, Customer, SaleRecord, LocalSaleInvoice } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import { showCustomConfirm, isAnyOtherModalOrDropdownActive } from '../core/ui'; // Corrected import
import { setActiveManagerView } from './index';


let currentEditingCreditNoteId: string | null = null;
let selectedCustomerIdForCreditNote: string | null = null;

export function initCreditNotesEventListeners(): void {
    document.getElementById('btn-add-new-credit-note')?.addEventListener('click', () => openCreditNoteFormModal());
    
    dom.creditNoteForm?.addEventListener('submit', handleSaveCreditNote);
    dom.cancelCreditNoteFormBtn?.addEventListener('click', closeCreditNoteFormModal);
    dom.creditNoteFormModalCloseBtn?.addEventListener('click', closeCreditNoteFormModal);

    dom.cnCustomerSearchInput?.addEventListener('input', handleCreditNoteCustomerSearch);
    dom.cnCustomerSearchInput?.addEventListener('focus', () => {
        if (dom.cnCustomerSearchInput && dom.cnCustomerSearchInput.value.trim().length > 0) {
            handleCreditNoteCustomerSearch();
        }
    });
    document.addEventListener('click', handleClickOutsideCreditNoteCustomerDropdown);
}

export function initCreditNotesView(viewName: string, targetContainer: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container is not defined for Credit Notes view.");
        return;
    }

    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Note Krediti (Shitje)</h2>
        <div class="admin-panel-actions" style="margin-bottom: 1rem;">
            <button id="btn-add-new-credit-note" class="btn btn-primary">
                <span class="icon">➕</span> Shto Note Krediti të Re
            </button>
        </div>
        <div id="credit-notes-table-container" class="table-container">
            <table id="credit-notes-table" class="admin-table">
                <thead>
                    <tr>
                        <th>ID Note Krediti</th>
                        <th>Data</th>
                        <th>Blerësi</th>
                        <th class="text-right">Vlera Totale (€)</th>
                        <th>Fatura e Lidhur</th>
                        <th>Arsyeja</th>
                        <th>Veprime</th>
                    </tr>
                </thead>
                <tbody id="credit-notes-tbody"></tbody>
            </table>
        </div>
    `;
    
    // Re-attach listeners after innerHTML change
    document.getElementById('btn-add-new-credit-note')?.addEventListener('click', () => openCreditNoteFormModal());
    renderCreditNoteList();
}

function renderCreditNoteList(): void {
    const tbody = document.getElementById('credit-notes-tbody');
    if (!tbody || !state.currentManagingBusinessId) return;
    tbody.innerHTML = '';

    if (state.creditNotes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nuk ka nota krediti të regjistruara.</td></tr>';
        return;
    }
    
    const sortedNotes = [...state.creditNotes].sort((a,b) => b.timestamp - a.timestamp);

    sortedNotes.forEach(note => {
        const customerName = note.customerName || (note.customerId ? state.customers.find(c => c.id === note.customerId)?.name : 'N/A') || 'N/A';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${note.id}</td>
            <td>${new Date(note.date + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${customerName}</td>
            <td class="text-right">${note.totalAmount.toFixed(2)} €</td>
            <td>${note.linkedInvoiceId || '-'}</td>
            <td>${note.reason || '-'}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-note-id="${note.id}" disabled title="Modifikimi do të implementohet së shpejti">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-note-id="${note.id}" data-note-display-id="${note.id}">Fshij</button>
            </td>
        `;
        // tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openCreditNoteFormModal(note.id));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteCreditNote(note.id, note.id));
        tbody.appendChild(tr);
    });
}

function generateCreditNoteSystemId(): string {
    if (!state.currentManagingBusinessId) return "NC-GABIM";
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    const seed = business ? (business.creditNoteIdSeed || 1) : 1;
    const fiscalYear = business ? business.fiscalYear : new Date().getFullYear();
    return `NC-${String(seed).padStart(3, '0')}-${fiscalYear}`;
}

function openCreditNoteFormModal(creditNoteId?: string): void {
    currentEditingCreditNoteId = creditNoteId || null;
    selectedCustomerIdForCreditNote = null;

    if (!dom.creditNoteFormModal || !dom.creditNoteForm || !dom.creditNoteFormModalTitle || !dom.editCreditNoteIdInput ||
        !dom.cnSystemIdInput || !dom.cnCustomerSearchInput || !dom.cnSelectedCustomerIdInput || !dom.cnDateInput ||
        !dom.cnTotalAmountInput || !dom.cnReasonTextarea || !dom.cnLinkedInvoiceIdInput || !dom.creditNoteFormErrorElement) {
        console.error("DOM elements for credit note form modal are missing.");
        return;
    }

    dom.creditNoteForm.reset();
    dom.creditNoteFormErrorElement.textContent = '';
    dom.cnDateInput.value = getTodayDateString();
    
    if (creditNoteId) {
        const note = state.creditNotes.find(n => n.id === creditNoteId);
        if (note) {
            dom.creditNoteFormModalTitle.textContent = "Modifiko Notën e Kreditit";
            dom.editCreditNoteIdInput.value = note.id;
            dom.cnSystemIdInput.value = note.id;
            selectedCustomerIdForCreditNote = note.customerId || null;
            const customer = selectedCustomerIdForCreditNote ? state.customers.find(c => c.id === selectedCustomerIdForCreditNote) : null;
            dom.cnCustomerSearchInput.value = customer ? `${customer.name} (${customer.code})` : (note.customerName || '');
            dom.cnSelectedCustomerIdInput.value = selectedCustomerIdForCreditNote || '';
            dom.cnDateInput.value = note.date;
            dom.cnTotalAmountInput.value = note.totalAmount.toString();
            dom.cnReasonTextarea.value = note.reason || '';
            dom.cnLinkedInvoiceIdInput.value = note.linkedInvoiceId || '';
            // Disable edit for now
            Array.from(dom.creditNoteForm.elements).forEach(el => (el as HTMLElement).setAttribute('disabled', 'true'));
            const saveBtn = dom.creditNoteForm.querySelector<HTMLButtonElement>('#save-credit-note-btn');
            if(saveBtn) saveBtn.disabled = true;

        } else {
            dom.creditNoteFormErrorElement.textContent = "Nota e kreditit nuk u gjet.";
            dom.cnSystemIdInput.value = generateCreditNoteSystemId();
            // Re-enable form if a previous edit attempt failed to find the note
             Array.from(dom.creditNoteForm.elements).forEach(el => (el as HTMLElement).removeAttribute('disabled'));
        }
    } else {
        dom.creditNoteFormModalTitle.textContent = "Shto Note Krediti";
        dom.editCreditNoteIdInput.value = '';
        dom.cnSystemIdInput.value = generateCreditNoteSystemId();
        dom.cnCustomerSearchInput.value = '';
        dom.cnSelectedCustomerIdInput.value = '';
        Array.from(dom.creditNoteForm.elements).forEach(el => (el as HTMLElement).removeAttribute('disabled'));
        dom.cnSystemIdInput.readOnly = true; 
    }
    dom.creditNoteFormModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function closeCreditNoteFormModal(): void {
    if (dom.creditNoteFormModal) {
        dom.creditNoteFormModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('creditNoteFormModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
    currentEditingCreditNoteId = null;
    selectedCustomerIdForCreditNote = null;
}

function handleSaveCreditNote(event: Event): void {
    event.preventDefault();
    if (!dom.cnSystemIdInput || !dom.cnSelectedCustomerIdInput || !dom.cnDateInput || !dom.cnTotalAmountInput ||
        !dom.cnReasonTextarea || !dom.cnLinkedInvoiceIdInput || !dom.creditNoteFormErrorElement ||
        !state.currentUser || !state.currentManagingBusinessId) {
        alert("Gabim: Mungojnë elemente të formularit."); return;
    }
    
    const systemId = dom.cnSystemIdInput.value;
    const customerId = selectedCustomerIdForCreditNote || undefined; // Use the state variable
    const date = dom.cnDateInput.value;
    const totalAmount = parseFloat(dom.cnTotalAmountInput.value);
    const reason = dom.cnReasonTextarea.value.trim();
    const linkedInvoiceId = dom.cnLinkedInvoiceIdInput.value.trim() || undefined;

    dom.creditNoteFormErrorElement.textContent = '';

    if (!customerId) { dom.creditNoteFormErrorElement.textContent = "Blerësi është i detyrueshëm."; return; }
    if (!date) { dom.creditNoteFormErrorElement.textContent = "Data është e detyrueshme."; return; }
    if (isNaN(totalAmount) || totalAmount <= 0) { dom.creditNoteFormErrorElement.textContent = "Shuma totale duhet të jetë numër pozitiv."; return; }
    if (!reason) { dom.creditNoteFormErrorElement.textContent = "Arsyeja/Përshkrimi është i detyrueshëm."; return; }

    const customer = customerId ? state.customers.find(c => c.id === customerId) : undefined;

    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business) { dom.creditNoteFormErrorElement.textContent = "Biznesi nuk u gjet."; return; }

    if (currentEditingCreditNoteId) {
        // Editing logic (currently disabled)
        // For now, we'll just show a message as editing is disabled in the form
        showCustomConfirm("Modifikimi i notave të kreditit nuk është aktivizuar ende.", () => {
            closeCreditNoteFormModal();
        });
    } else {
        const newCreditNote: CreditNote = {
            id: systemId, // Use the pre-generated ID
            businessId: state.currentManagingBusinessId,
            customerId,
            customerName: customer?.name,
            date,
            items: [], // Initialize with empty items array
            totalAmount,
            reason,
            linkedInvoiceId,
            recordedByManagerId: state.currentUser.id,
            recordedByManagerUsername: state.currentUser.username,
            timestamp: Date.now(),
        };
        state.creditNotes.push(newCreditNote);
        business.creditNoteIdSeed = (business.creditNoteIdSeed || 1) + 1;
        storage.saveAllBusinesses(state.businesses);
        storage.saveCreditNotesToLocalStorage(state.currentManagingBusinessId, state.creditNotes);

        showCustomConfirm(`Nota e kreditit "${systemId}" u ruajt me sukses.`, () => {
            closeCreditNoteFormModal();
            renderCreditNoteList();
            if (dom.managerContentCustomerLedger?.style.display === 'block' && typeof (window as any).refreshCustomerLedger === 'function') {
                (window as any).refreshCustomerLedger();
            }
            if (dom.managerContentCustomerBalances?.style.display === 'block' && typeof (window as any).renderManagerCustomerBalances === 'function') {
                (window as any).renderManagerCustomerBalances();
            }
        });
    }
}

function handleDeleteCreditNote(creditNoteId: string, displayId: string): void {
    showCustomConfirm(`Jeni i sigurt që doni të fshini notën e kreditit "${displayId}"?`, () => {
        if (!state.currentManagingBusinessId) return;
        state.setCreditNotes(state.creditNotes.filter(note => note.id !== creditNoteId));
        storage.saveCreditNotesToLocalStorage(state.currentManagingBusinessId, state.creditNotes);
        renderCreditNoteList();
        alert(`Nota e kreditit "${displayId}" u fshi.`);
        if (dom.managerContentCustomerLedger?.style.display === 'block' && typeof (window as any).refreshCustomerLedger === 'function') {
            (window as any).refreshCustomerLedger();
        }
         if (dom.managerContentCustomerBalances?.style.display === 'block' && typeof (window as any).renderManagerCustomerBalances === 'function') {
            (window as any).renderManagerCustomerBalances();
        }
    });
}

// --- Customer Search for Credit Note Modal ---
function handleCreditNoteCustomerSearch() {
    if (!dom.cnCustomerSearchInput || !dom.cnCustomerDropdownPanel) return;
    const searchTerm = dom.cnCustomerSearchInput.value.toLowerCase().trim();
    if (searchTerm.length < 1 && !selectedCustomerIdForCreditNote) {
        hideCreditNoteCustomerDropdown();
        return;
    }
    const filteredCustomers = state.customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.code.toLowerCase().includes(searchTerm)
    );
    renderCreditNoteCustomerDropdown(filteredCustomers);
}

function renderCreditNoteCustomerDropdown(customers: Customer[]) {
    if (!dom.cnCustomerDropdownPanel) return;
    dom.cnCustomerDropdownPanel.innerHTML = '';
    if (customers.length === 0) {
        dom.cnCustomerDropdownPanel.innerHTML = '<div class="no-results-message">Asnjë blerës nuk u gjet.</div>';
    } else {
        customers.forEach(customer => {
            const item = document.createElement('div');
            item.className = 'customer-dropdown-item';
            item.textContent = `${customer.name} (Kodi: ${customer.code})`;
            item.dataset.customerId = customer.id;
            item.addEventListener('click', () => selectCustomerForCreditNote(customer));
            dom.cnCustomerDropdownPanel.appendChild(item);
        });
    }
    dom.cnCustomerDropdownPanel.style.display = 'block';
}

function selectCustomerForCreditNote(customer: Customer) {
    if (!dom.cnCustomerSearchInput || !dom.cnSelectedCustomerIdInput) return;
    selectedCustomerIdForCreditNote = customer.id;
    dom.cnSelectedCustomerIdInput.value = customer.id;
    dom.cnCustomerSearchInput.value = `${customer.name} (${customer.code})`;
    hideCreditNoteCustomerDropdown();
}

function hideCreditNoteCustomerDropdown() {
    if (dom.cnCustomerDropdownPanel) dom.cnCustomerDropdownPanel.style.display = 'none';
}

function handleClickOutsideCreditNoteCustomerDropdown(event: MouseEvent) {
    if (dom.cnCustomerSearchInput && dom.cnCustomerDropdownPanel) {
        const target = event.target as Node;
        if (!dom.cnCustomerSearchInput.contains(target) && !dom.cnCustomerDropdownPanel.contains(target)) {
            hideCreditNoteCustomerDropdown();
        }
    }
}
