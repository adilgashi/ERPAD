


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { Recipe, ProductionOrder, RecipeIngredient, Product, ProductionOrderStage, ProductionRoutingStage } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import { showCustomConfirm, isAnyOtherModalOrDropdownActive } from '../core/ui';

let currentRecipeIngredients: RecipeIngredient[] = [];

// --- RECIPE MANAGEMENT ---

function renderRecipeList(): void {
    if (!dom.recipeListTbody) return;
    dom.recipeListTbody.innerHTML = '';
    
    if (state.recipes.length === 0) {
        dom.recipeListTbody.innerHTML = '<tr><td colspan="4" class="text-center">Nuk ka receta të regjistruara. Shtypni "Shto Recetë të Re" për të filluar.</td></tr>';
        return;
    }

    state.recipes.forEach(recipe => {
        const finalProduct = state.products.find(p => p.id === recipe.finalProductId);
        const ingredients = recipe.ingredients.map(ing => {
            const product = state.products.find(p => p.id === ing.productId);
            return `${product?.name || 'I panjohur'} (x${ing.quantity} ${ing.unit})`;
        }).join(', ');

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${recipe.name}</td>
            <td>${finalProduct?.name || 'Produkt i panjohur'}</td>
            <td>${ingredients.length > 100 ? ingredients.substring(0, 97) + '...' : ingredients}</td>
            <td>
                <button class="btn btn-danger btn-sm" data-recipe-id="${recipe.id}">Fshij</button>
            </td>
        `;
        tr.querySelector('.btn-danger')?.addEventListener('click', () => {
            handleDeleteRecipe(recipe.id, recipe.name);
        });
        dom.recipeListTbody?.appendChild(tr);
    });
}

function handleDeleteRecipe(recipeId: string, recipeName: string): void {
    const isInUse = state.productionOrders.some(order => order.recipeId === recipeId && order.status !== 'Cancelled');
    if (isInUse) {
        alert(`Receta "${recipeName}" është në përdorim nga një urdhër prodhimi dhe nuk mund të fshihet.`);
        return;
    }
    showCustomConfirm(`Jeni i sigurt që doni të fshini recetën "${recipeName}"?`, () => {
        state.setRecipes(state.recipes.filter(r => r.id !== recipeId));
        storage.saveRecipesToLocalStorage(state.currentManagingBusinessId!, state.recipes);
        renderRecipeList();
    });
}

export function openRecipeFormModal(): void {
    if (!dom.recipeFormModal || !dom.recipeForm || !dom.recipeFinalProductSelect || !dom.recipeIngredientSelect || !dom.recipeIngredientsTbody || !dom.recipeFormModalTitle || !dom.recipeFormError) return;
    
    dom.recipeForm.reset();
    currentRecipeIngredients = [];
    dom.recipeFormModalTitle.textContent = "Shto Recetë të Re";
    dom.recipeFormError.textContent = '';

    const populateSelect = (selectEl: HTMLSelectElement, placeholder: string, products: Product[]) => {
        selectEl.innerHTML = `<option value="">-- ${placeholder} --</option>`;
        products.forEach(p => {
            const option = document.createElement('option');
            option.value = p.id;
            option.textContent = `${p.name} (Stoku: ${p.stock} ${p.unitOfMeasure})`;
            selectEl.appendChild(option);
        });
    };
    
    const pfItemType = state.itemTypes.find(it => it.name.trim().toUpperCase() === 'PF');
    const pfItemTypeId = pfItemType ? pfItemType.id : null;

    const finalProducts = pfItemTypeId
        ? state.products.filter(p => p.itemTypeId === pfItemTypeId)
        : state.products.filter(p => !state.itemTypes.some(it => it.id === p.itemTypeId && it.name.trim().toUpperCase() === 'LP'));
        
    populateSelect(dom.recipeFinalProductSelect, "Zgjidh Produktin Final", finalProducts);
    
    const lpItemType = state.itemTypes.find(it => it.name.trim().toUpperCase() === 'LP');
    const lpItemTypeId = lpItemType ? lpItemType.id : null;

    const ingredientProducts = lpItemTypeId
        ? state.products.filter(p => p.itemTypeId === lpItemTypeId)
        : [];

    populateSelect(dom.recipeIngredientSelect, "Zgjidh Përbërësin", ingredientProducts);

    dom.recipeIngredientSelect.onchange = () => {
        const selectedId = dom.recipeIngredientSelect!.value;
        const product = state.products.find(p => p.id === selectedId);
        if (dom.recipeIngredientUnitInput) dom.recipeIngredientUnitInput.value = product?.unitOfMeasure || '';
    };

    renderRecipeIngredientsTable();
    dom.recipeFormModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function closeRecipeFormModal(): void {
    if (dom.recipeFormModal) {
        dom.recipeFormModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('recipeFormModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

function handleAddIngredientToRecipe(): void {
    if (!dom.recipeIngredientSelect || !dom.recipeIngredientQuantityInput) return;
    const productId = dom.recipeIngredientSelect.value;
    const quantity = parseFloat(dom.recipeIngredientQuantityInput.value);
    const product = state.products.find(p => p.id === productId);

    if (!productId || !product || isNaN(quantity) || quantity <= 0) {
        alert("Ju lutem zgjidhni një përbërës dhe futni një sasi valide.");
        return;
    }
    if (currentRecipeIngredients.some(ing => ing.productId === productId)) {
        alert("Ky përbërës është shtuar tashmë.");
        return;
    }

    currentRecipeIngredients.push({ productId, quantity, unit: product.unitOfMeasure });
    renderRecipeIngredientsTable();
    dom.recipeIngredientSelect.value = '';
    dom.recipeIngredientQuantityInput.value = '';
    if (dom.recipeIngredientUnitInput) dom.recipeIngredientUnitInput.value = '';
}

function renderRecipeIngredientsTable(): void {
    if (!dom.recipeIngredientsTbody) return;
    dom.recipeIngredientsTbody.innerHTML = '';
    currentRecipeIngredients.forEach((ing, index) => {
        const product = state.products.find(p => p.id === ing.productId);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product?.code || 'N/A'}</td>
            <td>${product?.name || 'I panjohur'}</td>
            <td class="text-right">${ing.quantity}</td>
            <td>${ing.unit}</td>
            <td><button type="button" class="btn btn-sm btn-danger" data-index="${index}">Hiqe</button></td>
        `;
        tr.querySelector('button')?.addEventListener('click', () => {
            currentRecipeIngredients.splice(index, 1);
            renderRecipeIngredientsTable();
        });
        dom.recipeIngredientsTbody.appendChild(tr);
    });
}

function handleSaveRecipe(e: Event): void {
    e.preventDefault();
    if (!dom.recipeNameInput || !dom.recipeFinalProductSelect || !state.currentManagingBusinessId || !dom.recipeFormError) return;

    const name = dom.recipeNameInput.value.trim();
    const finalProductId = dom.recipeFinalProductSelect.value;

    if (!name || !finalProductId || currentRecipeIngredients.length === 0) {
        dom.recipeFormError.textContent = "Ju lutem plotësoni emrin, produktin final dhe shtoni të paktën një përbërës.";
        return;
    }

    const newRecipe: Recipe = {
        id: generateUniqueId('rec-'),
        businessId: state.currentManagingBusinessId,
        name,
        finalProductId,
        ingredients: [...currentRecipeIngredients],
        notes: dom.recipeNotesTextarea?.value.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    state.recipes.push(newRecipe);
    storage.saveRecipesToLocalStorage(state.currentManagingBusinessId, state.recipes);
    renderRecipeList();
    closeRecipeFormModal();
}

// --- PRODUCTION ORDER MANAGEMENT ---

function renderProductionOrderList(): void {
    if (!dom.productionOrderListTbody) return;
    dom.productionOrderListTbody.innerHTML = '';

    if (state.productionOrders.length === 0) {
        dom.productionOrderListTbody.innerHTML = '<tr><td colspan="8" class="text-center">Nuk ka urdhëra prodhimi. Shtyp "Krijo Urdhër Prodhimi".</td></tr>';
        return;
    }

    state.productionOrders.sort((a,b) => b.createdAt - a.createdAt).forEach(order => {
        const tr = document.createElement('tr');
        const statusClass = order.status === 'Completed' ? 'active' : (order.status === 'Cancelled' ? 'inactive' : '');
        const dueDateDisplay = order.dueDate ? new Date(order.dueDate + "T00:00:00").toLocaleDateString('sq-AL') : '-';
        
        let dueDateClass = '';
        if (order.status === 'Pending' && order.dueDate) {
            const today = new Date();
            today.setHours(0, 0, 0, 0); 
            const dueDate = new Date(order.dueDate + "T00:00:00");
            if (dueDate < today) {
                dueDateClass = 'warning-text';
            }
        }

        tr.innerHTML = `
            <td>${order.id}</td>
            <td>${new Date(order.orderDate + "T00:00:00").toLocaleDateString('sq-AL')}</td>
            <td class="${dueDateClass}">${dueDateDisplay}</td>
            <td>${order.finalProductName}</td>
            <td class="text-right">${order.quantityToProduce}</td>
            <td><span class="status-badge ${statusClass}">${order.status}</span></td>
            <td>${order.createdByUsername}</td>
            <td>
                ${order.status === 'Pending' ? `<button class="btn btn-success btn-sm btn-complete-order" data-order-id="${order.id}">Përfundo</button>` : ''}
                ${order.status === 'Pending' ? `<button class="btn btn-danger btn-sm btn-cancel-order" data-order-id="${order.id}">Anulo</button>` : ''}
            </td>
        `;
        dom.productionOrderListTbody?.appendChild(tr);
    });
}

export function openProductionOrderFormModal(): void {
    if (!dom.productionOrderFormModal || !dom.productionOrderForm || !dom.productionOrderRecipeSelect || !dom.productionOrderMaterialsPreview || !dom.productionOrderFormModalTitle || !dom.productionOrderFormError || !dom.productionOrderDueDateInput) return;
    
    dom.productionOrderForm.reset();
    dom.productionOrderFormModalTitle.textContent = "Krijo Urdhër Prodhimi";
    dom.productionOrderFormError.textContent = '';
    dom.productionOrderMaterialsPreview.style.display = 'none';
    dom.productionOrderMaterialsPreview.innerHTML = '';

    dom.productionOrderRecipeSelect.innerHTML = '<option value="">-- Zgjidh Recetën --</option>';
    state.recipes.forEach(r => {
        const option = document.createElement('option');
        option.value = r.id;
        option.textContent = r.name;
        dom.productionOrderRecipeSelect!.appendChild(option);
    });
    
    if (dom.productionOrderDateInput) dom.productionOrderDateInput.value = getTodayDateString();
    if (dom.productionOrderDueDateInput) dom.productionOrderDueDateInput.value = ''; // Optional, start empty
    handleProductionRecipeSelectionChange(); 

    dom.productionOrderFormModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function closeProductionOrderFormModal(): void {
    if (dom.productionOrderFormModal) {
        dom.productionOrderFormModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('productionOrderFormModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

function handleProductionRecipeSelectionChange() {
    if (!dom.productionOrderRecipeSelect || !dom.productionOrderQuantityInput || !dom.productionOrderMaterialsPreview || !dom.saveProductionOrderBtn) return;
    
    const recipeId = dom.productionOrderRecipeSelect.value;
    const quantityToProduce = parseInt(dom.productionOrderQuantityInput.value, 10);
    const recipe = state.recipes.find(r => r.id === recipeId);

    if (!recipe || isNaN(quantityToProduce) || quantityToProduce <= 0) {
        dom.productionOrderMaterialsPreview.style.display = 'none';
        dom.saveProductionOrderBtn.disabled = true;
        return;
    }

    let previewHtml = '<h4>Materialet e Nevojshme:</h4><ul>';
    let hasEnoughStock = true;

    recipe.ingredients.forEach(ing => {
        const product = state.products.find(p => p.id === ing.productId);
        const requiredQty = ing.quantity * quantityToProduce;
        const stockStatus = product ? (product.stock >= requiredQty ? '✔️' : '❌') : '❓';
        if (stockStatus !== '✔️') hasEnoughStock = false;
        previewHtml += `<li>${stockStatus} ${product?.name || 'Përbërës i panjohur'}: Nevojiten <strong>${requiredQty.toFixed(2)} ${ing.unit}</strong> (Stoku: ${product?.stock || 'N/A'})</li>`;
    });
    previewHtml += '</ul>';
    
    if (!hasEnoughStock) {
        previewHtml += '<p class="error-message" style="border-left:none; padding-left:0;">Stoku i pamjaftueshëm për disa materiale!</p>';
    }

    dom.saveProductionOrderBtn.disabled = !hasEnoughStock;
    dom.productionOrderMaterialsPreview.innerHTML = previewHtml;
    dom.productionOrderMaterialsPreview.style.display = 'block';
}

function handleCreateProductionOrder(e: Event): void {
    e.preventDefault();
    if (!dom.productionOrderRecipeSelect || !dom.productionOrderQuantityInput || !dom.productionOrderLostQuantityInput || !state.currentManagingBusinessId || !state.currentUser || !dom.productionOrderFormError || !dom.productionOrderDueDateInput) return;
    
    const recipeId = dom.productionOrderRecipeSelect.value;
    const quantityToProduce = parseInt(dom.productionOrderQuantityInput.value, 10);
    const lostQuantity = dom.productionOrderLostQuantityInput.value ? parseFloat(dom.productionOrderLostQuantityInput.value) : undefined;
    const dueDate = dom.productionOrderDueDateInput.value || undefined;
    const recipe = state.recipes.find(r => r.id === recipeId);

    if (!recipe || isNaN(quantityToProduce) || quantityToProduce <= 0) {
        dom.productionOrderFormError.textContent = "Ju lutem zgjidhni një recetë dhe sasi valide.";
        return;
    }

    if (lostQuantity !== undefined && (isNaN(lostQuantity) || lostQuantity < 0 || lostQuantity > quantityToProduce)) {
        dom.productionOrderFormError.textContent = "Sasia e humbur nuk mund të jetë negative ose më e madhe se sasia e prodhimit.";
        return;
    }
    
    let stockError = false;
    recipe.ingredients.forEach(ing => {
        const product = state.products.find(p => p.id === ing.productId);
        const requiredQty = ing.quantity * quantityToProduce;
        if (!product || product.stock < requiredQty) {
            dom.productionOrderFormError.textContent = `Stoku i pamjaftueshëm për "${product?.name || 'I panjohur'}".`;
            stockError = true;
        }
    });
    if (stockError) return;

    let orderStages: ProductionOrderStage[] = [];
    if (recipe.routingId) {
        const routing = state.productionRoutings.find(r => r.id === recipe.routingId);
        if (routing) {
            orderStages = routing.stages.map(stage => {
                const stageInfo = state.productionStages.find(s => s.id === stage.stageId);
                return {
                    stageId: stage.stageId,
                    stageName: stageInfo?.name || 'Faza e Panjohur',
                    order: stage.order,
                    status: 'Pending',
                };
            });
        }
    }


    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business) { alert("Biznesi nuk u gjet."); return; }

    const finalProduct = state.products.find(p => p.id === recipe.finalProductId);

    const newOrder: ProductionOrder = {
        id: `PROD-${business.productionOrderIdSeed || 1}-${new Date().getFullYear()}`,
        businessId: state.currentManagingBusinessId,
        recipeId,
        recipeName: recipe.name,
        finalProductId: recipe.finalProductId,
        finalProductName: finalProduct?.name || "Produkti Final",
        quantityToProduce,
        lostQuantity: (lostQuantity && !isNaN(lostQuantity)) ? lostQuantity : undefined,
        orderDate: dom.productionOrderDateInput?.value || getTodayDateString(),
        dueDate: dueDate,
        status: 'Pending',
        stages: orderStages,
        createdByUserId: state.currentUser.id,
        createdByUsername: state.currentUser.username,
        createdAt: Date.now(),
    };
    
    state.productionOrders.push(newOrder);
    business.productionOrderIdSeed = (business.productionOrderIdSeed || 1) + 1;
    storage.saveAllBusinesses(state.businesses);
    storage.saveProductionOrdersToLocalStorage(state.currentManagingBusinessId, state.productionOrders);
    
    renderProductionOrderList();
    closeProductionOrderFormModal();
    showCustomConfirm(`Urdhri i prodhimit ${newOrder.id} u krijua. Përfundojeni për të ndryshuar stokun.`, () => {});
}

function handleCompleteProductionOrder(orderId: string): void {
    const orderIndex = state.productionOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    const order = state.productionOrders[orderIndex];
    const recipe = state.recipes.find(r => r.id === order.recipeId);
    
    if (!recipe) {
        alert(`Receta për urdhrin ${orderId} nuk u gjet. Veprimi u anulua.`);
        return;
    }

    // Final stock check
    let stockError = false;
    recipe.ingredients.forEach(ing => {
        const product = state.products.find(p => p.id === ing.productId);
        const requiredQty = ing.quantity * order.quantityToProduce;
        if (!product || product.stock < requiredQty) {
            alert(`Stoku i pamjaftueshëm për "${product?.name || 'I panjohur'}". Veprimi u anulua.`);
            stockError = true;
        }
    });
    if (stockError) return;

    // Adjust stock
    recipe.ingredients.forEach(ing => {
        const product = state.products.find(p => p.id === ing.productId)!;
        product.stock -= ing.quantity * order.quantityToProduce;
    });
    const finalProduct = state.products.find(p => p.id === recipe.finalProductId)!;
    const actualYield = order.quantityToProduce - (order.lostQuantity || 0);
    finalProduct.stock += actualYield;
    
    storage.saveProductsToLocalStorage(state.currentManagingBusinessId!, state.products);

    order.status = 'Completed';
    order.completedAt = Date.now();
    storage.saveProductionOrdersToLocalStorage(state.currentManagingBusinessId!, state.productionOrders);

    renderProductionOrderList();
    showCustomConfirm(`Urdhri ${orderId} u përfundua dhe stoku u përditësua.`, () => {});
}

function handleCancelProductionOrder(orderId: string): void {
    const orderIndex = state.productionOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    const order = state.productionOrders[orderIndex];
    if (order.status !== 'Pending') {
        alert("Vetëm urdhërat në pritje mund të anulohen.");
        return;
    }
    
    order.status = 'Cancelled';
    storage.saveProductionOrdersToLocalStorage(state.currentManagingBusinessId!, state.productionOrders);
    renderProductionOrderList();
}

// --- PRODUCTION STAGE MANAGEMENT ---

function renderProductionStageList(): void {
    if (!dom.productionStageListTbody) return;
    dom.productionStageListTbody.innerHTML = '';
    
    if (state.productionStages.length === 0) {
        dom.productionStageListTbody.innerHTML = '<tr><td colspan="3" class="text-center">Nuk ka faza prodhimi të regjistruara. Shtyp "Shto Fazë të Re".</td></tr>';
        return;
    }

    state.productionStages.forEach(stage => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${stage.name}</td>
            <td>${stage.description || '-'}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-stage-id="${stage.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-stage-id="${stage.id}" data-stage-name="${stage.name}">Fshij</button>
            </td>
        `;
        tr.querySelector('.btn-warning')?.addEventListener('click', () => openProductionStageFormModal(stage.id));
        tr.querySelector('.btn-danger')?.addEventListener('click', () => handleDeleteProductionStage(stage.id, stage.name));
        dom.productionStageListTbody?.appendChild(tr);
    });
}

function handleDeleteProductionStage(stageId: string, stageName: string): void {
    const isInUse = state.productionRoutings.some(r => r.stages.some(s => s.stageId === stageId));
    if (isInUse) {
        alert(`Faza "${stageName}" është në përdorim nga një ose më shumë procese teknologjike dhe nuk mund të fshihet.`);
        return;
    }
    showCustomConfirm(`Jeni i sigurt që doni të fshini fazën "${stageName}"?`, () => {
        state.setProductionStages(state.productionStages.filter(s => s.id !== stageId));
        storage.saveProductionStagesToLocalStorage(state.currentManagingBusinessId!, state.productionStages);
        renderProductionStageList();
    });
}

export function openProductionStageFormModal(stageId?: string): void {
    if (!dom.productionStageFormModal || !dom.productionStageForm || !dom.productionStageFormModalTitle || !dom.editProductionStageIdInput || !dom.productionStageNameInput || !dom.productionStageDescriptionInput || !dom.productionStageFormError) return;
    
    dom.productionStageForm.reset();
    dom.productionStageFormModalTitle.textContent = stageId ? "Modifiko Fazën e Prodhimit" : "Shto Fazë të Re Prodhimi";
    dom.editProductionStageIdInput.value = stageId || '';
    dom.productionStageFormError.textContent = '';

    if (stageId) {
        const stage = state.productionStages.find(s => s.id === stageId);
        if (stage) {
            dom.productionStageNameInput.value = stage.name;
            dom.productionStageDescriptionInput.value = stage.description || '';
        } else {
             dom.productionStageFormError.textContent = "Faza nuk u gjet.";
             return;
        }
    }

    dom.productionStageFormModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function closeProductionStageFormModal(): void {
    if (dom.productionStageFormModal) {
        dom.productionStageFormModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('productionStageFormModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

function handleSaveProductionStage(e: Event): void {
    e.preventDefault();
    if (!dom.productionStageNameInput || !dom.productionStageDescriptionInput || !dom.productionStageFormError || !dom.editProductionStageIdInput || !state.currentManagingBusinessId) return;

    const name = dom.productionStageNameInput.value.trim();
    const description = dom.productionStageDescriptionInput.value.trim() || undefined;
    const editingId = dom.editProductionStageIdInput.value;

    if (!name) {
        dom.productionStageFormError.textContent = "Emri i fazës është i detyrueshëm.";
        return;
    }

    if (editingId) {
        const stage = state.productionStages.find(s => s.id === editingId);
        if (stage) {
            stage.name = name;
            stage.description = description;
        }
    } else {
        const newStage = {
            id: generateUniqueId('stage-'),
            businessId: state.currentManagingBusinessId,
            name,
            description
        };
        state.productionStages.push(newStage);
    }
    storage.saveProductionStagesToLocalStorage(state.currentManagingBusinessId, state.productionStages);
    renderProductionStageList();
    closeProductionStageFormModal();
}


// --- PRODUCTION ROUTING MANAGEMENT ---

function renderProductionRoutingList(): void {
    if (!dom.productionRoutingListTbody) return;
    dom.productionRoutingListTbody.innerHTML = '';
    
    if (state.productionRoutings.length === 0) {
        dom.productionRoutingListTbody.innerHTML = '<tr><td colspan="3" class="text-center">Nuk ka procese teknologjike të regjistruara. Shtyp "Shto Proces të Ri".</td></tr>';
        return;
    }

    state.productionRoutings.forEach(routing => {
        const stages = routing.stages.map(s => {
            const stageInfo = state.productionStages.find(ps => ps.id === s.stageId);
            return stageInfo?.name || 'I panjohur';
        }).join(' -> ');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${routing.name}</td>
            <td>${stages}</td>
            <td>
                <button class="btn btn-danger btn-sm" data-routing-id="${routing.id}" data-routing-name="${routing.name}">Fshij</button>
            </td>
        `;
        tr.querySelector('.btn-danger')?.addEventListener('click', () => handleDeleteProductionRouting(routing.id, routing.name));
        dom.productionRoutingListTbody?.appendChild(tr);
    });
}

function handleDeleteProductionRouting(routingId: string, routingName: string): void {
    const isInUse = state.recipes.some(r => r.routingId === routingId);
    if (isInUse) {
        alert(`Procesi teknologjik "${routingName}" është në përdorim nga një ose më shumë receta dhe nuk mund të fshihet.`);
        return;
    }
    showCustomConfirm(`Jeni i sigurt që doni të fshini procesin "${routingName}"?`, () => {
        state.setProductionRoutings(state.productionRoutings.filter(r => r.id !== routingId));
        storage.saveProductionRoutingsToLocalStorage(state.currentManagingBusinessId!, state.productionRoutings);
        renderProductionRoutingList();
    });
}

export function openProductionRoutingFormModal(): void {
    if (!dom.productionRoutingFormModal || !dom.productionRoutingForm || !dom.productionRoutingFormModalTitle || !dom.productionRoutingNameInput || !dom.productionRoutingStagesListDiv || !dom.productionRoutingFormError) return;
    
    dom.productionRoutingForm.reset();
    dom.productionRoutingFormModalTitle.textContent = "Shto Proces të Ri Teknologjik";
    dom.productionRoutingFormError.textContent = '';
    
    const stagesListDiv = dom.productionRoutingStagesListDiv;
    stagesListDiv.innerHTML = '';
    if(state.productionStages.length === 0) {
        stagesListDiv.innerHTML = '<p class="info-message">Nuk ka faza prodhimi të definuara. Shtoni faza para se të krijoni një proces.</p>';
    } else {
        state.productionStages.forEach(stage => {
            const div = document.createElement('div');
            div.className = 'checkbox-group';
            div.innerHTML = `<input type="checkbox" id="stage-for-routing-${stage.id}" name="routingStages" value="${stage.id}"><label for="stage-for-routing-${stage.id}">${stage.name}</label>`;
            stagesListDiv.appendChild(div);
        });
    }

    dom.productionRoutingFormModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function closeProductionRoutingFormModal(): void {
    if (dom.productionRoutingFormModal) {
        dom.productionRoutingFormModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('productionRoutingFormModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

function handleSaveProductionRouting(e: Event): void {
    e.preventDefault();
    if (!dom.productionRoutingNameInput || !dom.productionRoutingStagesListDiv || !dom.productionRoutingFormError || !state.currentManagingBusinessId) return;

    const name = dom.productionRoutingNameInput.value.trim();
    const selectedStagesCheckboxes = Array.from(dom.productionRoutingStagesListDiv.querySelectorAll<HTMLInputElement>('input[name="routingStages"]:checked'));
    
    if (!name) {
        dom.productionRoutingFormError.textContent = "Emri i procesit është i detyrueshëm.";
        return;
    }
    if (selectedStagesCheckboxes.length === 0) {
        dom.productionRoutingFormError.textContent = "Duhet të zgjidhni të paktën një fazë.";
        return;
    }
    
    const stages: ProductionRoutingStage[] = selectedStagesCheckboxes.map((cb, index) => ({
        stageId: cb.value,
        order: index + 1
    }));
    
    const newRouting = {
        id: generateUniqueId('route-'),
        businessId: state.currentManagingBusinessId,
        name,
        stages
    };
    state.productionRoutings.push(newRouting);
    storage.saveProductionRoutingsToLocalStorage(state.currentManagingBusinessId, state.productionRoutings);
    renderProductionRoutingList();
    closeProductionRoutingFormModal();
}


// --- Main Exports ---

export function initProductionEventListeners(): void {
    // Recipe listeners
    dom.recipeForm?.addEventListener('submit', handleSaveRecipe);
    dom.cancelRecipeFormBtn?.addEventListener('click', closeRecipeFormModal);
    dom.recipeFormModalCloseBtn?.addEventListener('click', closeRecipeFormModal);
    dom.addIngredientToRecipeBtn?.addEventListener('click', handleAddIngredientToRecipe);
    
    // Production Order listeners
    dom.productionOrderForm?.addEventListener('submit', handleCreateProductionOrder);
    dom.cancelProductionOrderFormBtn?.addEventListener('click', closeProductionOrderFormModal);
    dom.productionOrderFormModalCloseBtn?.addEventListener('click', closeProductionOrderFormModal);
    if (dom.productionOrderRecipeSelect) dom.productionOrderRecipeSelect.onchange = handleProductionRecipeSelectionChange;
    if (dom.productionOrderQuantityInput) dom.productionOrderQuantityInput.oninput = handleProductionRecipeSelectionChange;
    dom.productionOrderListTbody?.addEventListener('click', (event) => {
        const target = event.target as HTMLButtonElement;
        const orderId = target.dataset.orderId;
        if (!orderId) return;

        const completeBtn = target.closest('.btn-complete-order');
        const cancelBtn = target.closest('.btn-cancel-order');

        if (completeBtn) {
            handleCompleteProductionOrder(orderId);
        } else if (cancelBtn) {
            handleCancelProductionOrder(orderId);
        }
    });

    // Production Stage listeners
    dom.productionStageForm?.addEventListener('submit', handleSaveProductionStage);
    dom.cancelProductionStageFormBtn?.addEventListener('click', closeProductionStageFormModal);
    dom.productionStageFormModalCloseBtn?.addEventListener('click', closeProductionStageFormModal);
    
    // Production Routing listeners
    dom.productionRoutingForm?.addEventListener('submit', handleSaveProductionRouting);
    dom.cancelProductionRoutingFormBtn?.addEventListener('click', closeProductionRoutingFormModal);
    dom.productionRoutingFormModalCloseBtn?.addEventListener('click', closeProductionRoutingFormModal);
}

export function showRecipeManagementPanel(): void {
    renderRecipeList();
}

export function showProductionOrderPanel(): void {
    renderProductionOrderList();
}

export function showProductionStagePanel(): void {
    renderProductionStageList();
}

export function showProductionRoutingPanel(): void {
    renderProductionRoutingList();
}
