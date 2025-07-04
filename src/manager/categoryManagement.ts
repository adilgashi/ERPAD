
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { Category } from '../models';
import { generateUniqueId } from '../core/utils';
import { showCustomConfirm } from '../core/ui';
import { populateProductCategoryDropdown } from './productManagement'; // For updating product form

export function initCategoryManagementEventListeners(): void {
    dom.showAddCategoryModalBtn?.addEventListener('click', () => openCategoryFormModal());
    dom.categoryForm?.addEventListener('submit', handleSaveCategory);
    dom.cancelCategoryFormBtn?.addEventListener('click', closeCategoryFormModal);
    if (dom.categoryFormModalCloseBtn) dom.categoryFormModalCloseBtn.addEventListener('click', closeCategoryFormModal);
}

export function showCategoryManagementPanelFromManager(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Category Management panel.");
        return;
    }
    const panel = dom.categoryManagementPanel;
    if (panel) {
        // Move the panel from the staging area to the active tab's content area
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        renderCategoryListForManager();
    } else {
        // Fallback if the panel itself isn't found in the DOM
        targetContainer.innerHTML = '<p class="error-message">Paneli i menaxhimit të kategorive nuk u gjet.</p>';
    }
}


export function renderCategoryListForManager(): void {
    if (!dom.categoryListTbody || !state.currentManagingBusinessId) return;
    dom.categoryListTbody.innerHTML = '';

    if (state.categories.length === 0) {
        dom.categoryListTbody.innerHTML = '<tr><td colspan="2" class="text-center">Nuk ka kategori të regjistruara. Shtyp "Shto Kategori të Re".</td></tr>';
        return;
    }

    state.categories.forEach(category => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${category.name}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-category-id="${category.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-category-id="${category.id}" data-category-name="${category.name}">Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openCategoryFormModal(category.id));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteCategory(category.id, category.name));
        dom.categoryListTbody.appendChild(tr);
    });
}

export function openCategoryFormModal(categoryId?: string): void {
    if (!dom.categoryFormModal || !dom.categoryForm || !dom.categoryFormModalTitle || !dom.editCategoryIdInput ||
        !dom.categoryFormNameInput || !dom.categoryFormErrorElement) return;

    dom.categoryForm.reset();
    dom.categoryFormErrorElement.textContent = '';

    if (categoryId) {
        const category = state.categories.find(c => c.id === categoryId);
        if (category) {
            dom.categoryFormModalTitle.textContent = "Modifiko Kategorinë";
            dom.editCategoryIdInput.value = category.id;
            dom.categoryFormNameInput.value = category.name;
        } else {
            dom.categoryFormErrorElement.textContent = "Kategoria nuk u gjet.";
            return;
        }
    } else {
        dom.categoryFormModalTitle.textContent = "Shto Kategori të Re";
        dom.editCategoryIdInput.value = '';
    }
    dom.categoryFormModal.style.display = 'block';
}

export function closeCategoryFormModal(): void {
    if (dom.categoryFormModal) dom.categoryFormModal.style.display = 'none';
}

export function handleSaveCategory(event: Event): void {
    event.preventDefault();
    if (!dom.categoryFormNameInput || !dom.categoryFormErrorElement || !dom.editCategoryIdInput || !state.currentManagingBusinessId) return;

    const name = dom.categoryFormNameInput.value.trim();
    const editingCategoryId = dom.editCategoryIdInput.value;
    dom.categoryFormErrorElement.textContent = '';

    if (!name) {
        dom.categoryFormErrorElement.textContent = "Emri i kategorisë është i detyrueshëm.";
        return;
    }

    const existingCategoryByName = state.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existingCategoryByName && existingCategoryByName.id !== editingCategoryId) {
        dom.categoryFormErrorElement.textContent = "Ky emër kategorie ekziston tashmë.";
        return;
    }

    if (editingCategoryId) {
        const categoryToEdit = state.categories.find(c => c.id === editingCategoryId);
        if (categoryToEdit) {
            categoryToEdit.name = name;
        }
    } else {
        const newCategory: Category = {
            id: generateUniqueId('cat-'),
            businessId: state.currentManagingBusinessId,
            name: name,
        };
        state.categories.push(newCategory);
    }

    storage.saveCategoriesToLocalStorage(state.currentManagingBusinessId, state.categories);
    closeCategoryFormModal();
    renderCategoryListForManager();
    if (dom.productFormModal?.style.display === 'block' && dom.productFormCategorySelect) {
        populateProductCategoryDropdown(dom.productFormCategorySelect);
    }
}

export function handleDeleteCategory(categoryId: string, categoryName: string): void {
    if (!state.currentManagingBusinessId) return;

    const isCategoryInUse = state.products.some(p => p.categoryId === categoryId);
    if (isCategoryInUse) {
        alert(`Kategoria "${categoryName}" është në përdorim nga një ose më shumë produkte dhe nuk mund të fshihet. Ju lutem hiqni këtë kategori nga produktet përkatëse fillimisht.`);
        return;
    }

    showCustomConfirm(`Jeni i sigurt që doni të fshini kategorinë "${categoryName}"?`, () => {
        if (!state.currentManagingBusinessId) return; 
        state.setCategories(state.categories.filter(c => c.id !== categoryId));
        storage.saveCategoriesToLocalStorage(state.currentManagingBusinessId, state.categories);
        renderCategoryListForManager();
        if (dom.productFormModal?.style.display === 'block' && dom.productFormCategorySelect) {
            populateProductCategoryDropdown(dom.productFormCategorySelect);
        }
        alert(`Kategoria "${categoryName}" u fshi me sukses.`);
    });
}
