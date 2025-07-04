/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { DebitNote, Supplier, PurchaseInvoice } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import { showCustomConfirm, isAnyOtherModalOrDropdownActive } from '../core/ui'; // Corrected import
import { setActiveManagerView } from './index';


let currentEditingDebitNoteId: string | null = null;

export function initDebitNotesEventListeners(): void {
    document.getElementById('btn-add-new-debit-note')?.addEventListener('click', () => openDebitNoteFormModal());
    
    dom.debitNoteForm?.addEventListener('submit', handleSaveDebitNote);
    dom.cancelDebitNoteFormBtn?.addEventListener('click', closeDebitNoteFormModal);
    dom.debitNoteFormModalCloseBtn?.addEventListener('click', closeDebitNoteFormModal);
}

export function initDebitNotesView(viewName: string, targetContainer: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container is not defined for Debit Notes view.");
        return;
    }

    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Note Debiti (Blerje)</h2>
        <div class="admin-panel-actions" style="margin-bottom: 1rem;">
            <button id="btn-add-new-debit-note" class="btn btn-primary">
                <span class="icon">➕</span> Shto Note Debiti të Re
            </button>
        </div>
        <div id="debit-notes-table-container" class="table-container">
            <table id="debit-notes-table" class="admin-table">
                <thead>
                    <tr>
                        <th>ID Note Debiti</th>
                        <th>Data</th>
                        <th>Furnitori</th>
                        <th class="text-right">Vlera Totale (€)</th>
                        <th>Fatura e Lidhur</th>
                        <th>Arsyeja</th>
                        <th>Veprime</th>
                    </tr>
                </thead>
                <tbody id="debit-notes-tbody"></tbody>
            </table>
        </div>
    `;
    
    // Re-attach listeners after innerHTML change
    document.getElementById('btn-add-new-debit-note')?.addEventListener('click', () => openDebitNoteFormModal());
    renderDebitNoteList();
}

function renderDebitNoteList(): void {
    const tbody = document.getElementById('debit-notes-tbody');
    if (!tbody || !state.currentManagingBusinessId) return;
    tbody.innerHTML = '';

    if (state.debitNotes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nuk ka nota debiti të regjistruara.</td></tr>';
        return;
    }
    
    const sortedNotes = [...state.debitNotes].sort((a,b) => b.timestamp - a.timestamp);

    sortedNotes.forEach(note => {
        const supplierName = note.supplierName || (note.supplierId ? state.suppliers.find(s => s.id === note.supplierId)?.name : 'N/A') || 'N/A';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${note.id}</td>
            <td>${new Date(note.date + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${supplierName}</td>
            <td class="text-right">${note.totalAmount.toFixed(2)} €</td>
            <td>${note.linkedInvoiceId || '-'}</td>
            <td>${note.reason || '-'}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-note-id="${note.id}" disabled title="Modifikimi do të implementohet së shpejti">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-note-id="${note.id}" data-note-display-id="${note.id}">Fshij</button>
            </td>
        `;
        // tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openDebitNoteFormModal(note.id));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteDebitNote(note.id, note.id));
        tbody.appendChild(tr);
    });
}

function generateDebitNoteSystemId(): string {
    if (!state.currentManagingBusinessId) return "ND-GABIM";
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    const seed = business ? (business.debitNoteIdSeed || 1) : 1;
    const fiscalYear = business ? business.fiscalYear : new Date().getFullYear();
    return `ND-${String(seed).padStart(3, '0')}-${fiscalYear}`;
}


function openDebitNoteFormModal(debitNoteId?: string): void {
    currentEditingDebitNoteId = debitNoteId || null;

    if (!dom.debitNoteFormModal || !dom.debitNoteForm || !dom.debitNoteFormModalTitle || !dom.editDebitNoteIdInput ||
        !dom.dnSystemIdInput || !dom.dnSupplierSelect || !dom.dnDateInput ||
        !dom.dnTotalAmountInput || !dom.dnReasonTextarea || !dom.dnLinkedInvoiceIdInput || !dom.debitNoteFormErrorElement) {
        console.error("DOM elements for debit note form modal are missing.");
        return;
    }

    dom.debitNoteForm.reset();
    dom.debitNoteFormErrorElement.textContent = '';
    dom.dnDateInput.value = getTodayDateString();
    
    // Populate supplier dropdown
    dom.dnSupplierSelect.innerHTML = '<option value="">-- Zgjidh Furnitorin --</option>';
    state.suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = `${supplier.name} (Kodi: ${supplier.code})`;
        dom.dnSupplierSelect?.appendChild(option);
    });
    
    if (debitNoteId) {
        const note = state.debitNotes.find(n => n.id === debitNoteId);
        if (note) {
            dom.debitNoteFormModalTitle.textContent = "Modifiko Notën e Debitit";
            dom.editDebitNoteIdInput.value = note.id;
            dom.dnSystemIdInput.value = note.id;
            dom.dnSupplierSelect.value = note.supplierId;
            dom.dnDateInput.value = note.date;
            dom.dnTotalAmountInput.value = note.totalAmount.toString();
            dom.dnReasonTextarea.value = note.reason || '';
            dom.dnLinkedInvoiceIdInput.value = note.linkedInvoiceId || '';
            // Disable edit for now
            Array.from(dom.debitNoteForm.elements).forEach(el => (el as HTMLElement).setAttribute('disabled', 'true'));
            const saveBtn = dom.debitNoteForm.querySelector<HTMLButtonElement>('#save-debit-note-btn');
            if(saveBtn) saveBtn.disabled = true;
        } else {
            dom.debitNoteFormErrorElement.textContent = "Nota e debitit nuk u gjet.";
            dom.dnSystemIdInput.value = generateDebitNoteSystemId();
            // Re-enable form
            Array.from(dom.debitNoteForm.elements).forEach(el => (el as HTMLElement).removeAttribute('disabled'));
        }
    } else {
        dom.debitNoteFormModalTitle.textContent = "Shto Note Debiti";
        dom.editDebitNoteIdInput.value = '';
        dom.dnSystemIdInput.value = generateDebitNoteSystemId();
        Array.from(dom.debitNoteForm.elements).forEach(el => (el as HTMLElement).removeAttribute('disabled'));
        dom.dnSystemIdInput.readOnly = true; 
    }
    dom.debitNoteFormModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function closeDebitNoteFormModal(): void {
    if (dom.debitNoteFormModal) {
        dom.debitNoteFormModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('debitNoteFormModal')) {
             dom.pageBlurOverlay?.classList.remove('active');
        }
    }
    currentEditingDebitNoteId = null;
}

function handleSaveDebitNote(event: Event): void {
    event.preventDefault();
    if (!dom.dnSystemIdInput || !dom.dnSupplierSelect || !dom.dnDateInput || !dom.dnTotalAmountInput ||
        !dom.dnReasonTextarea || !dom.dnLinkedInvoiceIdInput || !dom.debitNoteFormErrorElement ||
        !state.currentUser || !state.currentManagingBusinessId) {
        alert("Gabim: Mungojnë elemente të formularit."); return;
    }
    
    const systemId = dom.dnSystemIdInput.value;
    const supplierId = dom.dnSupplierSelect.value;
    const date = dom.dnDateInput.value;
    const totalAmount = parseFloat(dom.dnTotalAmountInput.value);
    const reason = dom.dnReasonTextarea.value.trim();
    const linkedInvoiceId = dom.dnLinkedInvoiceIdInput.value.trim() || undefined;

    dom.debitNoteFormErrorElement.textContent = '';

    if (!supplierId) { dom.debitNoteFormErrorElement.textContent = "Furnitori është i detyrueshëm."; return; }
    if (!date) { dom.debitNoteFormErrorElement.textContent = "Data është e detyrueshme."; return; }
    if (isNaN(totalAmount) || totalAmount <= 0) { dom.debitNoteFormErrorElement.textContent = "Shuma totale duhet të jetë numër pozitiv."; return; }
    if (!reason) { dom.debitNoteFormErrorElement.textContent = "Arsyeja/Përshkrimi është i detyrueshëm."; return; }

    const supplier = state.suppliers.find(s => s.id === supplierId);
    if (!supplier) { dom.debitNoteFormErrorElement.textContent = "Furnitori i zgjedhur nuk është valid."; return; }

    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business) { dom.debitNoteFormErrorElement.textContent = "Biznesi nuk u gjet."; return; }

    if (currentEditingDebitNoteId) {
        // Editing logic (currently disabled)
        // For now, we'll just show a message as editing is disabled in the form
        showCustomConfirm("Modifikimi i notave të debitit nuk është aktivizuar ende.", () => {
            closeDebitNoteFormModal();
        });
    } else {
        const newDebitNote: DebitNote = {
            id: systemId, 
            businessId: state.currentManagingBusinessId,
            supplierId,
            supplierName: supplier.name,
            date,
            items: [], // Initialize with empty items array
            totalAmount,
            reason,
            linkedInvoiceId,
            recordedByManagerId: state.currentUser.id,
            recordedByManagerUsername: state.currentUser.username,
            timestamp: Date.now(),
        };
        state.debitNotes.push(newDebitNote);
        business.debitNoteIdSeed = (business.debitNoteIdSeed || 1) + 1;
        storage.saveAllBusinesses(state.businesses);
        storage.saveDebitNotesToLocalStorage(state.currentManagingBusinessId, state.debitNotes);

        showCustomConfirm(`Nota e debitit "${systemId}" u ruajt me sukses.`, () => {
            closeDebitNoteFormModal();
            renderDebitNoteList();
            if (dom.managerContentSupplierLedger?.style.display === 'block' && typeof (window as any).refreshSupplierLedger === 'function') {
                (window as any).refreshSupplierLedger();
            }
            if (dom.managerContentSupplierBalances?.style.display === 'block' && typeof (window as any).renderManagerSupplierBalances === 'function') {
                (window as any).renderManagerSupplierBalances();
            }
        });
    }
}

function handleDeleteDebitNote(debitNoteId: string, displayId: string): void {
    showCustomConfirm(`Jeni i sigurt që doni të fshini notën e debitit "${displayId}"?`, () => {
        if (!state.currentManagingBusinessId) return;
        state.setDebitNotes(state.debitNotes.filter(note => note.id !== debitNoteId));
        storage.saveDebitNotesToLocalStorage(state.currentManagingBusinessId, state.debitNotes);
        renderDebitNoteList();
        alert(`Nota e debitit "${displayId}" u fshi.`);
        if (dom.managerContentSupplierLedger?.style.display === 'block' && typeof (window as any).refreshSupplierLedger === 'function') {
            (window as any).refreshSupplierLedger();
        }
        if (dom.managerContentSupplierBalances?.style.display === 'block' && typeof (window as any).renderManagerSupplierBalances === 'function') {
            (window as any).renderManagerSupplierBalances();
        }
    });
}
