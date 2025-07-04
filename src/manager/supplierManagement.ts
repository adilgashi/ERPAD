

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as toast from '../core/toast';
import { Customer, Supplier } from '../models';
import { generateUniqueId } from '../core/utils';
import { showCustomConfirm } from '../core/ui';
import { populateSellerCustomerSelect } from '../seller';

function generateCustomerCode(): string {
    const lastCustomerCode = state.customers
        .map(c => parseInt(c.code, 10))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a)[0] || 0;

    const nextCodeNumber = lastCustomerCode + 1;
    return nextCodeNumber.toString().padStart(3, '0'); 
}

export function initSupplierManagementEventListeners(): void {
    dom.showAddSupplierModalBtn?.addEventListener('click', () => openSupplierFormModal());
    dom.supplierForm?.addEventListener('submit', handleSaveSupplier);
    dom.cancelSupplierFormBtn?.addEventListener('click', closeSupplierFormModal);
    if (dom.supplierFormModalCloseBtn) dom.supplierFormModalCloseBtn.addEventListener('click', closeSupplierFormModal);
}

export function showSupplierManagementPanelFromManager(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Supplier Management panel.");
        return;
    }
    const panel = dom.supplierManagementPanel;
    if (panel) {
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        renderSupplierListForManager();
    } else {
        targetContainer.innerHTML = '<p class="error-message">Paneli i menaxhimit të furnitorëve nuk u gjet.</p>';
    }
}

function generateSupplierCode(): string {
    const lastSupplierCode = state.suppliers
        .map(s => parseInt(s.code, 10))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a)[0]; 

    const nextCodeNumber = lastSupplierCode ? lastSupplierCode + 1 : 1;
    return nextCodeNumber.toString().padStart(3, '0');
}

export function renderSupplierListForManager(): void {
    if (!dom.supplierListTbody || !state.currentManagingBusinessId) return;
    dom.supplierListTbody.innerHTML = '';

    if (state.suppliers.length === 0) {
        dom.supplierListTbody.innerHTML = '<tr><td colspan="6" class="text-center">Nuk ka furnitorë të regjistruar. Shtyp "Shto Furnitor të Ri".</td></tr>';
        return;
    }

    const sortedSuppliers = [...state.suppliers].sort((a, b) => (a.code || "").localeCompare(b.code || ""));

    sortedSuppliers.forEach(supplier => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${supplier.code || 'N/A'}</td>
            <td>${supplier.name}</td>
            <td>${supplier.contactPerson || '-'}</td>
            <td>${supplier.phone || '-'}</td>
            <td>${supplier.nipt || '-'}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-supplier-id="${supplier.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-supplier-id="${supplier.id}" data-supplier-name="${supplier.name}">Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openSupplierFormModal(supplier.id));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteSupplier(supplier.id, supplier.name));
        dom.supplierListTbody.appendChild(tr);
    });
}

export function openSupplierFormModal(supplierId?: string): void {
    const supplierFormCodeInput = document.getElementById('supplier-form-code') as HTMLInputElement | null;

    if (!dom.supplierFormModal || !dom.supplierForm || !dom.supplierFormModalTitle || !dom.editSupplierIdInput ||
        !dom.supplierFormNameInput || !dom.supplierFormContactPersonInput || !dom.supplierFormPhoneInput ||
        !dom.supplierFormEmailInput || !dom.supplierFormAddressInput || !dom.supplierFormNiptInput ||
        !dom.supplierFormErrorElement || !supplierFormCodeInput || !dom.supplierFormCreateAsCustomerCheckbox) return;

    dom.supplierForm.reset();
    dom.supplierFormErrorElement.textContent = '';
    dom.supplierFormCreateAsCustomerCheckbox.checked = false;

    if (supplierId) {
        const supplier = state.suppliers.find(s => s.id === supplierId);
        if (supplier) {
            dom.supplierFormModalTitle.textContent = "Modifiko Furnitorin";
            dom.editSupplierIdInput.value = supplier.id;
            supplierFormCodeInput.value = supplier.code || '';
            dom.supplierFormNameInput.value = supplier.name;
            dom.supplierFormContactPersonInput.value = supplier.contactPerson || '';
            dom.supplierFormPhoneInput.value = supplier.phone || '';
            dom.supplierFormEmailInput.value = supplier.email || '';
            dom.supplierFormAddressInput.value = supplier.address || '';
            dom.supplierFormNiptInput.value = supplier.nipt || '';
        } else {
            dom.supplierFormErrorElement.textContent = "Furnitori nuk u gjet.";
            return;
        }
    } else {
        dom.supplierFormModalTitle.textContent = "Shto Furnitor të Ri";
        dom.editSupplierIdInput.value = '';
        supplierFormCodeInput.value = generateSupplierCode();
    }
    dom.supplierFormModal.style.display = 'block';
    dom.supplierFormNameInput.focus();
}

export function closeSupplierFormModal(): void {
    if (dom.supplierFormModal) dom.supplierFormModal.style.display = 'none';
}

export async function handleSaveSupplier(event: Event): Promise<void> {
    event.preventDefault();
    const supplierFormCodeInput = document.getElementById('supplier-form-code') as HTMLInputElement | null;

    if (!dom.supplierFormNameInput || !dom.supplierFormContactPersonInput || !dom.supplierFormPhoneInput ||
        !dom.supplierFormEmailInput || !dom.supplierFormAddressInput || !dom.supplierFormNiptInput ||
        !dom.supplierFormErrorElement || !dom.editSupplierIdInput || !state.currentManagingBusinessId ||
        !supplierFormCodeInput || !dom.supplierFormCreateAsCustomerCheckbox) return;

    const name = dom.supplierFormNameInput.value.trim();
    const code = supplierFormCodeInput.value.trim();
    const contactPerson = dom.supplierFormContactPersonInput.value.trim() || undefined;
    const phone = dom.supplierFormPhoneInput.value.trim() || undefined;
    const email = dom.supplierFormEmailInput.value.trim() || undefined;
    const address = dom.supplierFormAddressInput.value.trim() || undefined;
    const nipt = dom.supplierFormNiptInput.value.trim() || undefined;
    const editingSupplierId = dom.editSupplierIdInput.value;
    const createAsCustomer = dom.supplierFormCreateAsCustomerCheckbox.checked;

    dom.supplierFormErrorElement.textContent = '';

    if (!name) {
        dom.supplierFormErrorElement.textContent = "Emri i furnitorit është i detyrueshëm.";
        return;
    }
    if (!code) {
        dom.supplierFormErrorElement.textContent = "Kodi i furnitorit mungon.";
        return;
    }

    const existingSupplierByName = state.suppliers.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existingSupplierByName && existingSupplierByName.id !== editingSupplierId) {
        dom.supplierFormErrorElement.textContent = "Ky emër furnitori ekziston tashmë.";
        return;
    }
    if (nipt) {
        const existingSupplierByNIPT = state.suppliers.find(s => s.nipt === nipt);
        if (existingSupplierByNIPT && existingSupplierByNIPT.id !== editingSupplierId) {
            dom.supplierFormErrorElement.textContent = `Furnitori me NIPT "${nipt}" ekziston tashmë (${existingSupplierByNIPT.name}).`;
            return;
        }
    }
    const existingSupplierByCode = state.suppliers.find(s => s.code === code);
    if (existingSupplierByCode && existingSupplierByCode.id !== editingSupplierId) {
        dom.supplierFormErrorElement.textContent = `Furnitori me kodin "${code}" ekziston tashmë (${existingSupplierByCode.name}).`;
        return;
    }

    const wasEditing = !!editingSupplierId;
    let savedSupplier: Supplier | undefined;

    if (editingSupplierId) {
        const supplierToEdit = state.suppliers.find(s => s.id === editingSupplierId);
        if (supplierToEdit) {
            supplierToEdit.name = name;
            supplierToEdit.code = code;
            supplierToEdit.contactPerson = contactPerson;
            supplierToEdit.phone = phone;
            supplierToEdit.email = email;
            supplierToEdit.address = address;
            supplierToEdit.nipt = nipt;
            savedSupplier = supplierToEdit;
        }
    } else {
        const newSupplier: Supplier = {
            id: generateUniqueId('sup-'),
            businessId: state.currentManagingBusinessId,
            code: code,
            name: name,
            contactPerson: contactPerson,
            phone: phone,
            email: email,
            address: address,
            nipt: nipt,
        };
        state.suppliers.push(newSupplier);
        savedSupplier = newSupplier;
    }

    let customerCreatedMessage = '';
    if (createAsCustomer && savedSupplier) {
        const customerExists = state.customers.some(c => 
            c.name.toLowerCase() === savedSupplier!.name.toLowerCase() || 
            (savedSupplier!.nipt && c.uniqueId && c.uniqueId === savedSupplier!.nipt)
        );

        if (!customerExists) {
            const newCustomer: Customer = {
                id: generateUniqueId('cust-'),
                businessId: state.currentManagingBusinessId,
                code: generateCustomerCode(),
                name: savedSupplier.name,
                uniqueId: savedSupplier.nipt,
                phone: savedSupplier.phone,
                email: savedSupplier.email,
                address: savedSupplier.address,
                notes: `Krijuar automatikisht nga furnitori ${savedSupplier.code}.`
            };
            state.customers.push(newCustomer);
            await storage.saveCustomersToLocalStorage(state.currentManagingBusinessId, state.customers);
            customerCreatedMessage = ' Gjithashtu, u krijua një blerës i ri me të dhëna të njëjta.';
        } else {
             customerCreatedMessage = ' Një blerës me këto të dhëna ekzistonte tashmë, kështu që nuk u krijua një i ri.';
        }
    }

    await storage.saveSuppliersToLocalStorage(state.currentManagingBusinessId, state.suppliers);
    closeSupplierFormModal();
    renderSupplierListForManager();
    showCustomConfirm(`Furnitori "${name}" u ${wasEditing ? 'modifikua' : 'shtua'} me sukses.${customerCreatedMessage}`, () => {});
}

export function handleDeleteSupplier(supplierId: string, supplierName: string): void {
    if (!state.currentManagingBusinessId) return;

    // Future check: If suppliers are linked to products/purchases, prevent deletion if in use.
    // const isSupplierInUse = state.products.some(p => p.supplierId === supplierId);
    // if (isSupplierInUse) {
    //     toast.showErrorToast(`Furnitori "${supplierName}" është i lidhur me produkte dhe nuk mund të fshihet.`);
    //     return;
    // }

    showCustomConfirm(`Jeni i sigurt që doni të fshini furnitorin "${supplierName}"?`, () => {
        if (!state.currentManagingBusinessId) return; 
        state.setSuppliers(state.suppliers.filter(s => s.id !== supplierId));
        storage.saveSuppliersToLocalStorage(state.currentManagingBusinessId, state.suppliers);
        renderSupplierListForManager();
        toast.showSuccessToast(`Furnitori "${supplierName}" u fshi me sukses.`);
    });
}