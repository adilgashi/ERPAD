
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { ItemType } from '../models';
import { generateUniqueId } from '../core/utils';
import { showCustomConfirm } from '../core/ui';

export function initItemTypeManagementEventListeners(): void {
    dom.showAddItemTypeModalBtn?.addEventListener('click', () => openItemTypeFormModal());
    dom.itemTypeForm?.addEventListener('submit', handleSaveItemType);
    dom.cancelItemTypeFormBtn?.addEventListener('click', closeItemTypeFormModal);
    dom.itemTypeFormModalCloseBtn?.addEventListener('click', closeItemTypeFormModal);
}

export function showItemTypeManagementPanelFromManager(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Item Type Management panel.");
        return;
    }
    const panel = dom.itemTypeManagementPanel;
    if (panel) {
        // Move the panel from the staging area to the active tab's content area
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        renderItemTypeList();
    } else {
        // Fallback if the panel itself isn't found in the DOM
        targetContainer.innerHTML = '<p class="error-message">Paneli i menaxhimit të llojeve të artikujve nuk u gjet.</p>';
    }
}


export function renderItemTypeList(): void {
    if (!dom.itemTypeListTbody || !state.currentManagingBusinessId) {
        console.warn("Item type list table body or business ID not available for rendering.");
        if(dom.itemTypeListTbody) dom.itemTypeListTbody.innerHTML = '<tr><td colspan="3" class="text-center">Gabim në ngarkimin e llojeve të artikujve.</td></tr>';
        return;
    }
    dom.itemTypeListTbody.innerHTML = '';

    if (state.itemTypes.length === 0) {
        dom.itemTypeListTbody.innerHTML = '<tr><td colspan="3" class="text-center">Nuk ka lloje artikujsh të regjistruara. Shtyp "Shto Lloj të Ri Artikulli".</td></tr>';
        return;
    }

    state.itemTypes.forEach(itemType => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${itemType.name}</td>
            <td>${itemType.description || '-'}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-item-type-id="${itemType.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-item-type-id="${itemType.id}" data-item-type-name="${itemType.name}">Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openItemTypeFormModal(itemType.id));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteItemType(itemType.id, itemType.name));
        dom.itemTypeListTbody.appendChild(tr);
    });
}

export function openItemTypeFormModal(itemTypeId?: string): void {
    if (!dom.itemTypeFormModal || !dom.itemTypeForm || !dom.itemTypeFormModalTitle || !dom.editItemTypeIdInput ||
        !dom.itemTypeNameInput || !dom.itemTypeDescriptionInput || !dom.itemTypeFormErrorElement) {
        console.error("DOM elements for item type form modal are missing.");
        return;
    }

    dom.itemTypeForm.reset();
    dom.itemTypeFormErrorElement.textContent = '';

    if (itemTypeId) {
        const itemType = state.itemTypes.find(it => it.id === itemTypeId);
        if (itemType) {
            dom.itemTypeFormModalTitle.textContent = "Modifiko Llojin e Artikullit";
            dom.editItemTypeIdInput.value = itemType.id;
            dom.itemTypeNameInput.value = itemType.name;
            dom.itemTypeDescriptionInput.value = itemType.description || '';
        } else {
            dom.itemTypeFormErrorElement.textContent = "Lloji i artikullit nuk u gjet.";
            return;
        }
    } else {
        dom.itemTypeFormModalTitle.textContent = "Shto Lloj të Ri Artikulli";
        dom.editItemTypeIdInput.value = '';
    }
    dom.itemTypeFormModal.style.display = 'block';
    dom.itemTypeNameInput.focus();
}

export function closeItemTypeFormModal(): void {
    if (dom.itemTypeFormModal) {
        dom.itemTypeFormModal.style.display = 'none';
    }
}

export function handleSaveItemType(event: Event): void {
    event.preventDefault();
    if (!dom.itemTypeNameInput || !dom.itemTypeDescriptionInput || !dom.itemTypeFormErrorElement ||
        !dom.editItemTypeIdInput || !state.currentManagingBusinessId) {
        alert("Gabim: Mungojnë elemente të formularit për llojet e artikujve.");
        return;
    }

    const name = dom.itemTypeNameInput.value.trim();
    const description = dom.itemTypeDescriptionInput.value.trim() || undefined;
    const editingItemTypeId = dom.editItemTypeIdInput.value;
    dom.itemTypeFormErrorElement.textContent = '';

    if (!name) {
        dom.itemTypeFormErrorElement.textContent = "Emri i llojit të artikullit është i detyrueshëm.";
        return;
    }

    const existingItemTypeByName = state.itemTypes.find(it => it.name.toLowerCase() === name.toLowerCase());
    if (existingItemTypeByName && existingItemTypeByName.id !== editingItemTypeId) {
        dom.itemTypeFormErrorElement.textContent = "Ky emër i llojit të artikullit ekziston tashmë.";
        return;
    }

    if (editingItemTypeId) {
        const itemTypeToEdit = state.itemTypes.find(it => it.id === editingItemTypeId);
        if (itemTypeToEdit) {
            itemTypeToEdit.name = name;
            itemTypeToEdit.description = description;
        }
    } else {
        const newItemType: ItemType = {
            id: generateUniqueId('ittype-'),
            businessId: state.currentManagingBusinessId,
            name: name,
            description: description,
        };
        state.itemTypes.push(newItemType);
    }

    storage.saveItemTypesToLocalStorage(state.currentManagingBusinessId, state.itemTypes);
    closeItemTypeFormModal();
    renderItemTypeList();

    // TODO: Update product form if open and item type dropdown needs refresh (if implemented)
}

export function handleDeleteItemType(itemTypeId: string, itemTypeName: string): void {
    if (!state.currentManagingBusinessId) return;

    const isItemTypeInUse = state.products.some(p => p.itemTypeId === itemTypeId);
    if (isItemTypeInUse) {
        alert(`Lloji i artikullit "${itemTypeName}" është në përdorim nga një ose më shumë produkte dhe nuk mund të fshihet. Ju lutem hiqni këtë lloj artikulli nga produktet përkatëse fillimisht.`);
        return;
    }

    showCustomConfirm(`Jeni i sigurt që doni të fshini llojin e artikullit "${itemTypeName}"?`, () => {
        if (!state.currentManagingBusinessId) return; 
        state.setItemTypes(state.itemTypes.filter(it => it.id !== itemTypeId));
        storage.saveItemTypesToLocalStorage(state.currentManagingBusinessId, state.itemTypes);
        renderItemTypeList();
        // TODO: Update product form if open
        alert(`Lloji i artikullit "${itemTypeName}" u fshi me sukses.`);
    });
}
