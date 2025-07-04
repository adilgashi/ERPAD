

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { Deal, DealItem } from '../models'; // MODIFIED: Imported DealItem
import { generateUniqueId } from '../core/utils';
import { showCustomConfirm } from '../core/ui';

export function initDealManagementEventListeners(): void {
    dom.showAddDealModalBtn?.addEventListener('click', () => openDealFormModal());
    dom.dealForm?.addEventListener('submit', handleSaveDeal);
    dom.cancelDealFormBtn?.addEventListener('click', closeDealFormModal);
    if (dom.dealFormModalCloseBtn) dom.dealFormModalCloseBtn.addEventListener('click', closeDealFormModal);
    dom.dealProductSearchInputModal?.addEventListener('input', () => {
        const editingDealId = dom.editDealIdInput?.value;
        renderProductsForDealSelection(editingDealId || undefined);
    });
}

export function showDealManagementPanelFromManager(viewName: string, targetContainer?: HTMLElement) {
    if (!targetContainer) {
        console.error("Target container not provided for Deal Management panel.");
        return;
    }
    const panel = dom.dealManagementPanel;
    if (panel) {
        // Move the panel from the staging area to the active tab's content area
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        renderDealListForManager();
    } else {
        // Fallback if the panel itself isn't found in the DOM
        targetContainer.innerHTML = '<p class="error-message">Paneli i menaxhimit të ofertave nuk u gjet.</p>';
    }
}


export function renderProductsForDealSelection(dealIdToEdit?: string) {
    if (!dom.dealFormProductSelectionDiv || !dom.dealProductSearchInputModal) return;

    const searchTerm = dom.dealProductSearchInputModal.value.toLowerCase().trim();
    dom.dealFormProductSelectionDiv.innerHTML = '';

    let productsForSelection = [...state.products];
    let selectedProductItems: DealItem[] = [];

    if (dealIdToEdit) {
        const currentDeal = state.deals.find(d => d.id === dealIdToEdit);
        if (currentDeal) {
            selectedProductItems = [...currentDeal.items];
        }
    }
    
    if (productsForSelection.length === 0) {
        dom.dealFormProductSelectionDiv.innerHTML = '<p class="empty-list-message">Nuk ka produkte për të zgjedhur. Shtoni produkte fillimisht.</p>';
        return;
    }

    productsForSelection = productsForSelection.filter(product => 
        product.name.toLowerCase().includes(searchTerm)
    );

    if (productsForSelection.length === 0 && searchTerm) {
        dom.dealFormProductSelectionDiv.innerHTML = '<p class="empty-list-message">Asnjë produkt nuk përputhet me kërkimin.</p>';
        return;
    }

    productsForSelection.forEach(product => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'deal-product-item-selection'; 
        itemDiv.style.display = 'grid'; // Use grid for better alignment
        itemDiv.style.gridTemplateColumns = 'auto 1fr auto auto'; // Checkbox, Label, Quantity Input, Price Ref
        itemDiv.style.gap = '0.5rem';
        itemDiv.style.alignItems = 'center';

        const checkboxId = `deal-product-${product.id}`;
        const existingItem = selectedProductItems.find(item => item.productId === product.id);
        const isChecked = !!existingItem;
        const quantity = existingItem ? existingItem.quantity : 1;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = checkboxId;
        checkbox.name = 'dealProducts';
        checkbox.value = product.id;
        checkbox.checked = isChecked;
        
        const label = document.createElement('label');
        label.htmlFor = checkboxId;
        label.textContent = product.name;
        label.style.cursor = 'pointer';

        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.min = '1';
        quantityInput.value = quantity.toString();
        quantityInput.dataset.productId = product.id;
        quantityInput.className = 'form-control form-control-sm deal-product-quantity-input'; // Added class
        quantityInput.style.width = '70px';
        quantityInput.style.textAlign = 'right';
        quantityInput.disabled = !isChecked;

        const priceRef = document.createElement('span');
        priceRef.className = 'product-price-ref';
        priceRef.textContent = `(${product.price.toFixed(2)} €)`;
        priceRef.style.justifySelf = 'end';

        checkbox.addEventListener('change', () => {
            quantityInput.disabled = !checkbox.checked;
            if (!checkbox.checked) {
                 // Optionally reset quantity or keep it if user re-checks
                // quantityInput.value = '1'; 
            } else {
                quantityInput.focus();
                quantityInput.select();
            }
        });

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(label);
        itemDiv.appendChild(quantityInput);
        itemDiv.appendChild(priceRef);
        dom.dealFormProductSelectionDiv.appendChild(itemDiv);
    });
}


export function openDealFormModal(dealId?: string): void {
    if (!dom.dealFormModal || !dom.dealForm || !dom.dealFormModalTitle || !dom.editDealIdInput ||
        !dom.dealFormNameInput || !dom.dealFormPriceInput || !dom.dealFormDescriptionInput ||
        !dom.dealFormIsActiveCheckbox || !dom.dealFormProductSelectionDiv || !dom.dealFormErrorElement || !dom.dealProductSearchInputModal) return;

    dom.dealForm.reset();
    dom.dealFormErrorElement.textContent = '';
    dom.dealProductSearchInputModal.value = ''; 
    dom.dealFormIsActiveCheckbox.checked = true; 

    if (dealId) {
        const deal = state.deals.find(d => d.id === dealId);
        if (deal) {
            dom.dealFormModalTitle.textContent = "Modifiko Ofertën";
            dom.editDealIdInput.value = deal.id;
            dom.dealFormNameInput.value = deal.name;
            dom.dealFormPriceInput.value = deal.price.toString();
            dom.dealFormDescriptionInput.value = deal.description || '';
            dom.dealFormIsActiveCheckbox.checked = deal.isActive;
            renderProductsForDealSelection(deal.id); 
        } else {
            dom.dealFormErrorElement.textContent = "Oferta nuk u gjet.";
            renderProductsForDealSelection(); 
            return;
        }
    } else {
        dom.dealFormModalTitle.textContent = "Shto Ofertë të Re";
        dom.editDealIdInput.value = '';
        renderProductsForDealSelection(); 
    }
    dom.dealFormModal.style.display = 'block';
}

export function closeDealFormModal(): void {
    if (dom.dealFormModal) dom.dealFormModal.style.display = 'none';
}

export function handleSaveDeal(event: Event): void {
    event.preventDefault();
    if (!dom.dealFormNameInput || !dom.dealFormPriceInput || !dom.dealFormDescriptionInput ||
        !dom.dealFormIsActiveCheckbox || !dom.dealFormErrorElement || !dom.editDealIdInput ||
        !state.currentManagingBusinessId || !dom.dealFormProductSelectionDiv) return;

    const name = dom.dealFormNameInput.value.trim();
    const price = parseFloat(dom.dealFormPriceInput.value);
    const description = dom.dealFormDescriptionInput.value.trim() || undefined;
    const isActive = dom.dealFormIsActiveCheckbox.checked;
    const editingDealId = dom.editDealIdInput.value;
    dom.dealFormErrorElement.textContent = '';

    if (!name) {
        dom.dealFormErrorElement.textContent = "Emri i ofertës është i detyrueshëm.";
        return;
    }
    if (isNaN(price) || price < 0) {
        dom.dealFormErrorElement.textContent = "Çmimi i ofertës është i pavlefshëm.";
        return;
    }

    const dealItems: DealItem[] = [];
    const selectedProductElements = dom.dealFormProductSelectionDiv.querySelectorAll<HTMLInputElement>('input[name="dealProducts"]:checked');
    
    selectedProductElements.forEach(checkbox => {
        const productId = checkbox.value;
        const quantityInput = dom.dealFormProductSelectionDiv.querySelector<HTMLInputElement>(`.deal-product-quantity-input[data-product-id="${productId}"]`);
        const quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
        
        if (isNaN(quantity) || quantity < 1) {
            dom.dealFormErrorElement.textContent = `Sasia për produktin ID ${productId} duhet të jetë së paku 1.`;
            // Potentially return early or mark an error state
            return;
        }
        dealItems.push({ productId, quantity });
    });
    
    if (dom.dealFormErrorElement.textContent) return; // If an error was set in the loop

    if (dealItems.length === 0) {
        dom.dealFormErrorElement.textContent = "Ju lutem zgjidhni të paktën një produkt dhe specifikoni sasinë për ofertën.";
        return;
    }

    const existingDealByName = state.deals.find(d => d.name.toLowerCase() === name.toLowerCase());
    if (existingDealByName && existingDealByName.id !== editingDealId) {
        dom.dealFormErrorElement.textContent = `Oferta me emrin "${name}" ekziston tashmë.`;
        return;
    }

    if (editingDealId) {
        const dealToEdit = state.deals.find(d => d.id === editingDealId);
        if (dealToEdit) {
            dealToEdit.name = name;
            dealToEdit.price = price;
            dealToEdit.description = description;
            dealToEdit.isActive = isActive;
            dealToEdit.items = dealItems; // MODIFIED
        }
    } else {
        const newDeal: Deal = {
            id: generateUniqueId('deal-'),
            name: name,
            price: price,
            description: description,
            isActive: isActive,
            items: dealItems, // MODIFIED
        };
        state.deals.push(newDeal);
    }

    storage.saveDealsToLocalStorage(state.currentManagingBusinessId, state.deals);
    closeDealFormModal();
    renderDealListForManager();
}

export function handleDeleteDeal(dealId: string, dealName: string): void {
    if (!state.currentManagingBusinessId) return;

    showCustomConfirm(`Jeni i sigurt që doni të fshini ofertën "${dealName}"?`, () => {
        if (!state.currentManagingBusinessId) return;
        state.setDeals(state.deals.filter(d => d.id !== dealId));
        storage.saveDealsToLocalStorage(state.currentManagingBusinessId, state.deals);
        renderDealListForManager();
        alert(`Oferta "${dealName}" u fshi me sukses.`);
    });
}

export function renderDealListForManager(): void {
    if (!dom.dealListTbody) return;
    dom.dealListTbody.innerHTML = '';
    if (state.deals.length === 0) {
        dom.dealListTbody.innerHTML = '<tr><td colspan="5" class="text-center">Nuk ka oferta të regjistruara. Shtyp "Shto Ofertë të Re".</td></tr>';
        return;
    }

    state.deals.forEach(deal => {
        const tr = document.createElement('tr');
        const includedItemsNames = deal.items.map(item => { // MODIFIED
            const product = state.products.find(p => p.id === item.productId);
            return product ? `${product.name} (Sasia: ${item.quantity})` : `Produkt i panjohur (ID: ${item.productId}, Sasia: ${item.quantity})`;
        }).join(', ');

        tr.innerHTML = `
            <td>${deal.name}</td>
            <td class="text-right">${deal.price.toFixed(2)}</td>
            <td>${includedItemsNames.length > 60 ? includedItemsNames.substring(0, 57) + "..." : includedItemsNames}</td>
            <td><span class="status-badge ${deal.isActive ? 'active' : 'inactive'}">${deal.isActive ? 'Aktive' : 'Joaktive'}</span></td>
            <td>
                <button class="btn btn-warning btn-sm" data-deal-id="${deal.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-deal-id="${deal.id}" data-deal-name="${deal.name}">Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openDealFormModal(deal.id));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteDeal(deal.id, deal.name));
        dom.dealListTbody.appendChild(tr);
    });
}
