

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as toast from '../core/toast';
import { Product, Category, Supplier, ItemType, Recipe, RecipeIngredient } from '../models';
import { generateUniqueId, readFileAsDataURL } from '../core/utils';
import { showCustomConfirm } from '../core/ui';

let currentEditingProductId: string | null = null;
let currentProductRecipeIngredients: RecipeIngredient[] = [];

export function initProductManagementEventListeners(): void {
    dom.showAddProductModalBtn?.addEventListener('click', () => openProductFormModal());
    dom.productForm?.addEventListener('submit', handleSaveProduct);
    dom.cancelProductFormBtn?.addEventListener('click', closeProductFormModal);
    if (dom.productFormModalCloseBtn) dom.productFormModalCloseBtn.addEventListener('click', closeProductFormModal);
    
    dom.productFormImageInput?.addEventListener('change', handleProductImagePreview);
}

export function generateProductCode(): string {
    const lastProduct = state.products.length > 0 ? state.products.reduce((max, p) => parseInt(p.code) > parseInt(max.code) ? p : max) : { code: '0' };
    const nextCodeNumber = parseInt(lastProduct.code) + 1;
    return nextCodeNumber.toString().padStart(3, '0');
}

export function populateProductCategoryDropdown(selectElement: HTMLSelectElement, selectedCategoryId?: string): void {
    selectElement.innerHTML = '<option value="">-- Zgjidh Kategorinë --</option>';
    state.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        if (selectedCategoryId && category.id === selectedCategoryId) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}

function populateItemTypeDropdown(selectElement: HTMLSelectElement, selectedItemTypeId?: string): void {
    selectElement.innerHTML = '<option value="">-- Zgjidh Llojin e Artikullit --</option>';
    state.itemTypes.forEach(itemType => {
        const option = document.createElement('option');
        option.value = itemType.id;
        option.textContent = itemType.name;
        if (selectedItemTypeId && itemType.id === selectedItemTypeId) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}

function populatePrimarySupplierDropdown(selectElement: HTMLSelectElement, selectedSupplierId?: string): void {
    selectElement.innerHTML = '<option value="">-- Zgjidh Furnitorin Primar (Opsional) --</option>';
    state.suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = supplier.name;
        if (selectedSupplierId && supplier.id === selectedSupplierId) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}

const defaultUnitsOfMeasure = ["copë", "kg", "L", "m", "pako", "shishe", "gr", "ml", "set"];

function populateUnitOfMeasureDropdown(selectElement: HTMLSelectElement, selectedUnit?: string): void {
    selectElement.innerHTML = ''; // Clear existing options
    defaultUnitsOfMeasure.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit.charAt(0).toUpperCase() + unit.slice(1); // Capitalize first letter
        if (selectedUnit && unit === selectedUnit) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
    // If a custom unit was previously saved and is not in default, add it and select it
    if (selectedUnit && !defaultUnitsOfMeasure.includes(selectedUnit)) {
        const customOption = document.createElement('option');
        customOption.value = selectedUnit;
        customOption.textContent = selectedUnit.charAt(0).toUpperCase() + selectedUnit.slice(1);
        customOption.selected = true;
        selectElement.appendChild(customOption);
    }
}

function handleProductImagePreview(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0] && dom.productFormImagePreview) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (dom.productFormImagePreview && e.target?.result) {
                dom.productFormImagePreview.src = e.target.result as string;
                dom.productFormImagePreview.style.display = 'block';
            }
        }
        reader.readAsDataURL(input.files[0]);
    } else if (dom.productFormImagePreview) {
        const currentProduct = currentEditingProductId ? state.products.find(p => p.id === currentEditingProductId) : null;
        if (!currentProduct?.imageUrl) { 
            dom.productFormImagePreview.style.display = 'none';
            dom.productFormImagePreview.src = '#';
        }
    }
}

function handleFinalProductCheckboxChange() {
    const checkbox = dom.productFormIsFinalProductCheckbox;
    const itemTypeSelect = dom.productFormItemTypeSelect;
    const recipeSection = dom.productFormRecipeCreationSection;

    if (!checkbox || !itemTypeSelect || !recipeSection) return;

    const isFinalProduct = checkbox.checked;

    if (isFinalProduct) {
        const pfItemType = state.itemTypes.find(it => it.name.trim().toUpperCase() === 'PF');
        if (pfItemType) {
            itemTypeSelect.value = pfItemType.id;
        } else {
            console.warn("Item Type 'PF' (Produkt Final) nuk u gjet. Ju lutem krijoni atë në Menaxhimin e Llojeve të Artikujve.");
        }
        itemTypeSelect.disabled = true;
        recipeSection.style.display = 'block';
    } else {
        itemTypeSelect.disabled = false;
        recipeSection.style.display = 'none';
        currentProductRecipeIngredients = []; 
        renderProductRecipeIngredientsTable(); 
    }
}

function populateRecipeIngredientSelect() {
    if (!dom.pfrIngredientSelect) return;
    const selectEl = dom.pfrIngredientSelect;
    selectEl.innerHTML = `<option value="">-- Zgjidh Përbërësin --</option>`;
    
    // Assuming 'Lëndë e Parë' is an item type for raw materials
    const lpItemType = state.itemTypes.find(it => it.name.trim().toUpperCase() === 'LP');
    const lpItemTypeId = lpItemType ? lpItemType.id : null;

    const ingredientProducts = lpItemTypeId
        ? state.products.filter(p => p.itemTypeId === lpItemTypeId)
        : [];

    ingredientProducts.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.name} (Stoku: ${p.stock} ${p.unitOfMeasure})`;
        selectEl.appendChild(option);
    });
}

function handleAddIngredientToProductRecipe() {
    if (!dom.pfrIngredientSelect || !dom.pfrIngredientQuantityInput) return;
    const productId = dom.pfrIngredientSelect.value;
    const quantity = parseFloat(dom.pfrIngredientQuantityInput.value);
    const product = state.products.find(p => p.id === productId);

    if (!productId || !product || isNaN(quantity) || quantity <= 0) {
        alert("Ju lutem zgjidhni një përbërës dhe futni një sasi valide.");
        return;
    }
    if (currentProductRecipeIngredients.some(ing => ing.productId === productId)) {
        alert("Ky përbërës është shtuar tashmë.");
        return;
    }
    currentProductRecipeIngredients.push({ productId, quantity, unit: product.unitOfMeasure });
    renderProductRecipeIngredientsTable();

    dom.pfrIngredientSelect.value = '';
    dom.pfrIngredientQuantityInput.value = '';
    if (dom.pfrIngredientUnitInput) dom.pfrIngredientUnitInput.value = '';
}

function handleRemoveIngredientFromProductRecipe(index: number) {
    if (index >= 0 && index < currentProductRecipeIngredients.length) {
        currentProductRecipeIngredients.splice(index, 1);
        renderProductRecipeIngredientsTable();
    }
}

function renderProductRecipeIngredientsTable() {
    if (!dom.pfrIngredientsTbody) return;
    dom.pfrIngredientsTbody.innerHTML = '';
    
    currentProductRecipeIngredients.forEach((ing, index) => {
        const product = state.products.find(p => p.id === ing.productId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product?.code || 'N/A'}</td>
            <td>${product?.name || 'I panjohur'}</td>
            <td class="text-right">${ing.quantity}</td>
            <td>${ing.unit}</td>
            <td><button type="button" class="btn btn-sm btn-danger" data-index="${index}">Hiqe</button></td>
        `;
        tr.querySelector('button')?.addEventListener('click', () => handleRemoveIngredientFromProductRecipe(index));
        dom.pfrIngredientsTbody.appendChild(tr);
    });
}

function attachRecipeBuilderEventListeners() {
    dom.pfrAddIngredientBtn?.addEventListener('click', handleAddIngredientToProductRecipe);
    dom.pfrIngredientSelect?.addEventListener('change', () => {
        if (!dom.pfrIngredientSelect || !dom.pfrIngredientUnitInput) return;
        const selectedId = dom.pfrIngredientSelect.value;
        const product = state.products.find(p => p.id === selectedId);
        dom.pfrIngredientUnitInput.value = product?.unitOfMeasure || '';
    });
}

export function openProductFormModal(productId?: string): void {
    currentEditingProductId = productId || null;
    currentProductRecipeIngredients = []; 

    if (!dom.productFormModal || !dom.productForm || !dom.productFormModalTitle || !dom.editProductIdInput ||
        !dom.productFormNameInput || !dom.productFormPriceInput || !dom.productFormErrorElement ||
        !dom.productFormCodeInput || !dom.productFormCategorySelect || !dom.productFormUnitInput ||
        !dom.productFormQtyPerPackageInput || !dom.productFormBarcode || !dom.productFormItemTypeSelect ||
        !dom.productFormIsActiveCheckbox || !dom.productFormVatRateInput || !dom.productFormDescriptionTextarea ||
        !dom.productFormPurchasePriceInput || !dom.productFormMinStockInput || !dom.productFormPrimarySupplierSelect ||
        !dom.productFormImageInput || !dom.productFormImagePreview || !dom.productFormIsFinalProductCheckbox || 
        !dom.productFormRecipeCreationSection || !dom.pfrRecipeNotes
    ) {
        console.error("Missing one or more DOM elements for the product form modal.");
        return;
    }

    dom.productForm.reset();
    dom.productFormErrorElement.textContent = '';
    dom.productFormImagePreview.style.display = 'none';
    dom.productFormImagePreview.src = '#';
    dom.productFormImageInput.value = '';
    dom.productFormRecipeCreationSection.style.display = 'none';

    attachRecipeBuilderEventListeners();
    dom.productFormIsFinalProductCheckbox.removeEventListener('change', handleFinalProductCheckboxChange);
    dom.productFormIsFinalProductCheckbox.addEventListener('change', handleFinalProductCheckboxChange);

    populateProductCategoryDropdown(dom.productFormCategorySelect);
    populateItemTypeDropdown(dom.productFormItemTypeSelect);
    populatePrimarySupplierDropdown(dom.productFormPrimarySupplierSelect);
    populateUnitOfMeasureDropdown(dom.productFormUnitInput, 'copë');
    populateRecipeIngredientSelect();

    if (productId) {
        const product = state.products.find(p => p.id === productId);
        if (product) {
            dom.productFormModalTitle.textContent = "Modifiko Produktin";
            dom.editProductIdInput.value = product.id;
            dom.productFormCodeInput.value = product.code || '';
            dom.productFormNameInput.value = product.name;
            dom.productFormPriceInput.value = product.price.toString();
            if (product.categoryId) dom.productFormCategorySelect.value = product.categoryId;
            populateUnitOfMeasureDropdown(dom.productFormUnitInput, product.unitOfMeasure);
            dom.productFormQtyPerPackageInput.value = product.quantityPerPackage?.toString() || '';
            dom.productFormBarcode.value = product.barcode || '';
            if (product.itemTypeId) dom.productFormItemTypeSelect.value = product.itemTypeId;
            dom.productFormIsActiveCheckbox.checked = product.isActive;
            dom.productFormVatRateInput.value = product.vatRate.toString();
            dom.productFormDescriptionTextarea.value = product.description || '';
            dom.productFormPurchasePriceInput.value = product.purchasePrice?.toString() || '';
            dom.productFormMinStockInput.value = product.minimumStockLevel?.toString() || '';
            if (product.primarySupplierId) dom.productFormPrimarySupplierSelect.value = product.primarySupplierId;
            if (product.imageUrl) {
                dom.productFormImagePreview.src = product.imageUrl;
                dom.productFormImagePreview.style.display = 'block';
            }

            const pfItemType = state.itemTypes.find(it => it.name.trim().toUpperCase() === 'PF');
            dom.productFormIsFinalProductCheckbox.checked = pfItemType ? product.itemTypeId === pfItemType.id : false;
            
            if (product.recipeId) {
                const existingRecipe = state.recipes.find(r => r.id === product.recipeId);
                if (existingRecipe) {
                    currentProductRecipeIngredients = JSON.parse(JSON.stringify(existingRecipe.ingredients)); // Deep copy
                    dom.pfrRecipeNotes.value = existingRecipe.notes || '';
                }
            }
            renderProductRecipeIngredientsTable();
            handleFinalProductCheckboxChange(); 
        } else {
            dom.productFormErrorElement.textContent = "Produkti nuk u gjet.";
            return;
        }
    } else {
        dom.productFormModalTitle.textContent = "Shto Produkt të Ri";
        dom.editProductIdInput.value = '';
        dom.productFormCodeInput.value = generateProductCode();
        dom.productFormIsActiveCheckbox.checked = true; 
        dom.productFormVatRateInput.value = '18'; 
        populateUnitOfMeasureDropdown(dom.productFormUnitInput, 'copë');
        dom.productFormIsFinalProductCheckbox.checked = false;
        handleFinalProductCheckboxChange();
        renderProductRecipeIngredientsTable();
    }
    dom.productFormModal.style.display = 'block';
}

export function closeProductFormModal(): void {
    if (dom.productFormModal) {
        dom.productFormModal.style.display = 'none';
        if (dom.productFormImagePreview) {
            dom.productFormImagePreview.style.display = 'none';
            dom.productFormImagePreview.src = '#';
        }
        if (dom.productFormImageInput) dom.productFormImageInput.value = '';
    }
    currentEditingProductId = null;
    currentProductRecipeIngredients = [];
}

export async function handleSaveProduct(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.productFormNameInput || !dom.productFormPriceInput || !dom.productFormErrorElement ||
        !dom.editProductIdInput || !state.currentManagingBusinessId || !dom.productFormCodeInput ||
        !dom.productFormCategorySelect || !dom.productFormUnitInput || !dom.productFormQtyPerPackageInput ||
        !dom.productFormBarcode || !dom.productFormItemTypeSelect ||
        !dom.productFormIsActiveCheckbox || !dom.productFormVatRateInput || !dom.productFormDescriptionTextarea ||
        !dom.productFormPurchasePriceInput || !dom.productFormMinStockInput || !dom.productFormPrimarySupplierSelect ||
        !dom.productFormImageInput || !dom.productFormImagePreview || !dom.productFormIsFinalProductCheckbox || !dom.pfrRecipeNotes
    ) return;

    const name = dom.productFormNameInput.value.trim();
    const price = parseFloat(dom.productFormPriceInput.value);
    const code = dom.productFormCodeInput.value.trim();
    const categoryId = dom.productFormCategorySelect.value || undefined;
    const unitOfMeasure = dom.productFormUnitInput.value;
    const quantityPerPackage = dom.productFormQtyPerPackageInput.value ? parseInt(dom.productFormQtyPerPackageInput.value, 10) : undefined;
    const barcode = dom.productFormBarcode.value.trim() || undefined;
    let itemTypeId = dom.productFormItemTypeSelect.value || undefined;
    const isActive = dom.productFormIsActiveCheckbox.checked;
    const vatRate = parseFloat(dom.productFormVatRateInput.value);
    const description = dom.productFormDescriptionTextarea.value.trim() || undefined;
    const purchasePrice = dom.productFormPurchasePriceInput.value ? parseFloat(dom.productFormPurchasePriceInput.value) : undefined;
    const minimumStockLevel = dom.productFormMinStockInput.value ? parseInt(dom.productFormMinStockInput.value, 10) : undefined;
    const primarySupplierId = dom.productFormPrimarySupplierSelect.value || undefined;
    const imageFile = dom.productFormImageInput.files?.[0];
    let imageUrl: string | undefined = dom.productFormImagePreview.src !== '#' && dom.productFormImagePreview.style.display !== 'none' ? dom.productFormImagePreview.src : undefined;
    const isFinalProduct = dom.productFormIsFinalProductCheckbox.checked;
    let recipeId: string | undefined = undefined;
    const editingProductId = dom.editProductIdInput.value;
    const wasEditing = !!editingProductId;
    dom.productFormErrorElement.textContent = '';

    if (!name) { dom.productFormErrorElement.textContent = "Emri i produktit është i detyrueshëm."; return; }
    if (isNaN(price) || price < 0) { dom.productFormErrorElement.textContent = "Çmimi është i pavlefshëm."; return; }
    if (isFinalProduct && currentProductRecipeIngredients.length === 0) { dom.productFormErrorElement.textContent = "Një produkt final duhet të ketë të paktën një përbërës në recetë."; return; }

    const pfItemType = state.itemTypes.find(it => it.name.trim().toUpperCase() === 'PF');
    if (isFinalProduct && pfItemType) {
        itemTypeId = pfItemType.id;
    }

    if (imageFile) {
        try { imageUrl = await readFileAsDataURL(imageFile); }
        catch (error) { dom.productFormErrorElement.textContent = "Gabim gjatë përpunimit të imazhit."; return; }
    }

    if (isFinalProduct) {
        const productBeingEdited = wasEditing ? state.products.find(p => p.id === editingProductId) : null;
        const existingRecipeId = productBeingEdited?.recipeId;
        const recipeNotes = dom.pfrRecipeNotes.value.trim() || undefined;

        if (existingRecipeId) {
            const recipeToUpdate = state.recipes.find(r => r.id === existingRecipeId);
            if (recipeToUpdate) {
                recipeToUpdate.ingredients = [...currentProductRecipeIngredients];
                recipeToUpdate.name = `${name} Recipe`;
                recipeToUpdate.notes = recipeNotes;
                recipeToUpdate.updatedAt = Date.now();
                recipeId = recipeToUpdate.id;
            } else {
                // If recipe was deleted or unlinked, create a new one
                const newRecipe: Recipe = { id: generateUniqueId('rec-'), businessId: state.currentManagingBusinessId, name: `${name} Recipe`, finalProductId: editingProductId!, ingredients: [...currentProductRecipeIngredients], notes: recipeNotes, createdAt: Date.now(), updatedAt: Date.now() };
                state.recipes.push(newRecipe);
                recipeId = newRecipe.id;
            }
        } else {
            const tempProductId = wasEditing ? editingProductId! : generateUniqueId('prod-');
            const newRecipe: Recipe = { id: generateUniqueId('rec-'), businessId: state.currentManagingBusinessId, name: `${name} Recipe`, finalProductId: tempProductId, ingredients: [...currentProductRecipeIngredients], notes: recipeNotes, createdAt: Date.now(), updatedAt: Date.now() };
            state.recipes.push(newRecipe);
            recipeId = newRecipe.id;
            // If we generated a temp ID for a new product, we need to ensure the final product gets it
            if (!wasEditing) {
                newRecipe.finalProductId = 'PLACEHOLDER_FOR_NEW_PRODUCT_ID';
            }
        }
        storage.saveRecipesToLocalStorage(state.currentManagingBusinessId, state.recipes);
    }
    
    if (editingProductId) {
        const productToEdit = state.products.find(p => p.id === editingProductId);
        if (productToEdit) {
            Object.assign(productToEdit, { name, price, code, categoryId, unitOfMeasure, quantityPerPackage, barcode, itemTypeId, isActive, vatRate, description, purchasePrice, minimumStockLevel, primarySupplierId, recipeId: isFinalProduct ? recipeId : undefined, imageUrl: (imageFile || imageUrl === undefined) ? imageUrl : productToEdit.imageUrl });
        }
    } else {
        const newProduct: Product = { id: generateUniqueId('prod-'), code, name, price, stock: 0, categoryId, unitOfMeasure, quantityPerPackage, barcode, isActive, vatRate, itemTypeId, description, purchasePrice, minimumStockLevel, primarySupplierId, imageUrl, recipeId: isFinalProduct ? recipeId : undefined };
        state.products.push(newProduct);
        if (recipeId && state.recipes.find(r => r.id === recipeId)?.finalProductId === 'PLACEHOLDER_FOR_NEW_PRODUCT_ID') {
            state.recipes.find(r => r.id === recipeId)!.finalProductId = newProduct.id;
            storage.saveRecipesToLocalStorage(state.currentManagingBusinessId, state.recipes);
        }
    }

    storage.saveProductsToLocalStorage(state.currentManagingBusinessId, state.products);
    renderProductListForManager();
    if (typeof (window as any).renderManagerStockOverview === 'function') (window as any).renderManagerStockOverview();
    
    showCustomConfirm(`Produkti "${name}" u ${wasEditing ? 'modifikua' : 'shtua'} me sukses.`, () => {
        closeProductFormModal();
    });
}


export function handleDeleteProduct(productId: string, productName: string): void {
    if (!state.currentManagingBusinessId) return;

    const isProductInDeal = state.deals.some(deal => deal.items.some(item => item.productId === productId));
    if (isProductInDeal) {
        toast.showErrorToast(`Produkti "${productName}" është pjesë e një ose më shumë ofertave dhe nuk mund të fshihet. Ju lutem hiqni produktin nga ofertat përkatëse fillimisht.`);
        return;
    }
    const isProductInRecipe = state.recipes.some(recipe => recipe.ingredients.some(ing => ing.productId === productId) || recipe.finalProductId === productId);
    if (isProductInRecipe) {
        toast.showErrorToast(`Produkti "${productName}" është në përdorim në një ose më shumë receta dhe nuk mund të fshihet.`);
        return;
    }

    showCustomConfirm(`Jeni i sigurt që doni të fshini produktin "${productName}"?`, () => {
        if (!state.currentManagingBusinessId) return;
        state.setProducts(state.products.filter(p => p.id !== productId));
        storage.saveProductsToLocalStorage(state.currentManagingBusinessId, state.products);
        renderProductListForManager();
        if (state.currentUser?.role === 'menaxher' && dom.sellerPosView?.style.display === 'flex' && typeof window !== 'undefined' && (window as any).renderProductsForSaleSeller) {
            (window as any).renderProductsForSaleSeller();
        }
         if (typeof (window as any).renderManagerStockOverview === 'function') {
            (window as any).renderManagerStockOverview();
        }
        toast.showSuccessToast(`Produkti "${productName}" u fshi me sukses.`);
    });
}

export function renderProductListForManager(): void {
    if (!dom.productListManagerTbody) return;
    dom.productListManagerTbody.innerHTML = '';

    if (state.products.length === 0) {
        dom.productListManagerTbody.innerHTML = '<tr><td colspan="8" class="text-center">Nuk ka produkte të regjistruara. Shtyp "Shto Produkt të Ri".</td></tr>'; // Incremented colspan
        return;
    }
    
    const sortedProducts = [...state.products].sort((a, b) => (a.code || "").localeCompare(b.code || ""));

    sortedProducts.forEach(product => {
        const categoryName = product.categoryId ? state.categories.find(c => c.id === product.categoryId)?.name || 'E Pa Kategorizuar' : 'E Pa Kategorizuar';
        let unitDisplay = product.unitOfMeasure;
        if (product.quantityPerPackage) {
            unitDisplay += ` (${product.quantityPerPackage})`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.code || 'N/A'}</td>
            <td>${product.name}</td>
            <td>${categoryName}</td>
            <td class="text-right">${product.price.toFixed(2)}</td>
            <td class="text-right">${product.stock}</td>
            <td>${unitDisplay}</td>
            <td><span class="status-badge ${product.isActive ? 'active' : 'inactive'}">${product.isActive ? 'Aktiv' : 'Joaktiv'}</span></td>
            <td>
                <button class="btn btn-warning btn-sm" data-product-id="${product.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-product-id="${product.id}" data-product-name="${product.name}">Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openProductFormModal(product.id));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteProduct(product.id, product.name));
        dom.productListManagerTbody.appendChild(tr);
    });
}

export function showProductManagementPanelFromManager(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Product Management panel.");
        return;
    }
    const panel = dom.productManagementPanel;
    if (panel) {
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        renderProductListForManager();
    } else {
        targetContainer.innerHTML = '<p class="error-message">Paneli i menaxhimit të produkteve nuk u gjet.</p>';
    }
}
