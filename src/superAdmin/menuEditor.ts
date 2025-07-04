
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as toast from '../core/toast';
import { MenuCategoryConfig, MenuItemConfig } from '../models';
import * as utils from '../core/utils';
import { showCustomConfirm } from '../core/ui';
import { hideAllSuperAdminContentSections, highlightActiveSidebarAction } from './ui';
import { updateAppTitle } from '../core/ui';
import { toggleSuperAdminAppSettingsControls } from './appSettings';
import { toggleBusinessSpecificSAControls } from './businessManagement';


export function showSuperAdminManagerMenuEditorView() {
    hideAllSuperAdminContentSections();
    if (dom.superAdminContentManagerMenu) dom.superAdminContentManagerMenu.style.display = 'block';
    
    state.setCurrentManagingBusinessId(null);
    storage.saveCurrentManagingBusinessIdToSessionStorage(null);

    renderManagerMenuEditor();
    updateAppTitle();
    highlightActiveSidebarAction('manageManagerMenu');
    toggleBusinessSpecificSAControls(false);
    toggleSuperAdminAppSettingsControls(false);
}

export function renderManagerMenuEditor(): void {
    if (!dom.managerMenuEditorContainer) {
        console.error("Manager menu editor container not found!");
        return;
    }
    dom.managerMenuEditorContainer.innerHTML = '';

    const menuConfig = state.managerMenuConfig;

    menuConfig.sort((a, b) => a.order - b.order).forEach((category, catIndex) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'menu-editor-category';
        categoryDiv.dataset.categoryId = category.id;

        categoryDiv.innerHTML = `
            <div class="menu-editor-category-header">
                <span class="drag-handle category-drag-handle" draggable="true" title="Zvarrit për të rirenditur">↕️</span>
                <input type="text" value="${category.name}" class="menu-editor-input category-name-input" placeholder="Emri Kategorisë">
                <input type="text" value="${category.icon}" class="menu-editor-input category-icon-input" placeholder="Ikona" size="2">
                <input type="checkbox" id="defaultOpen-${category.id}" class="category-default-open-checkbox" ${category.defaultOpen ? 'checked' : ''}> 
                <label for="defaultOpen-${category.id}" class="small-label">Hapur si Default</label>
                <button class="btn btn-sm btn-danger remove-category-btn" title="Hiq Kategorinë">🗑️</button>
            </div>
            <ul class="menu-editor-item-list" data-category-id="${category.id}"></ul>
            <button class="btn btn-sm add-menu-item-btn" data-category-id="${category.id}">Shto Artikull Menusë</button>
        `;

        const itemListUl = categoryDiv.querySelector('.menu-editor-item-list') as HTMLUListElement;
        category.items.sort((a, b) => a.order - b.order).forEach((item, itemIndex) => {
            const itemLi = createManagerMenuItemEditorElement(item, category.id);
            itemListUl.appendChild(itemLi);
        });
        
        dom.managerMenuEditorContainer.appendChild(categoryDiv);
    });
    
    const addCategoryBtn = document.createElement('button');
    addCategoryBtn.className = 'btn btn-primary add-category-btn';
    addCategoryBtn.textContent = 'Shto Kategori të Re';
    addCategoryBtn.type = 'button';
    dom.managerMenuEditorContainer.appendChild(addCategoryBtn);

    attachMenuEditorEventListeners();
}

function createManagerMenuItemEditorElement(item: MenuItemConfig, categoryId: string): HTMLLIElement {
    const itemLi = document.createElement('li');
    itemLi.className = 'menu-editor-item';
    itemLi.dataset.itemId = item.id;
    itemLi.dataset.categoryId = categoryId;
    itemLi.draggable = true;

    itemLi.innerHTML = `
        <span class="drag-handle item-drag-handle" title="Zvarrit për të rirenditur">↕️</span>
        <input type="text" value="${item.name}" class="menu-editor-input item-name-input" placeholder="Emri Artikullit">
        <input type="text" value="${item.icon}" class="menu-editor-input item-icon-input" placeholder="Ikona" size="2">
        <input type="text" value="${item.dataView}" class="menu-editor-input item-dataview-input" placeholder="data-view">
        <button class="btn btn-sm btn-danger remove-menu-item-btn" title="Hiq Artikullin">🗑️</button>
    `;
    return itemLi;
}

function attachMenuEditorEventListeners() {
    dom.managerMenuEditorContainer?.querySelector('.add-category-btn')?.addEventListener('click', handleAddMenuCategory);

    dom.managerMenuEditorContainer?.querySelectorAll('.menu-editor-category').forEach(categoryDiv => {
        categoryDiv.querySelector('.remove-category-btn')?.addEventListener('click', (e) => handleRemoveMenuCategory(e));
        categoryDiv.querySelector('.add-menu-item-btn')?.addEventListener('click', (e) => handleAddMenuItem(e));
        
        categoryDiv.querySelectorAll('.menu-editor-item').forEach(itemLi => {
            itemLi.querySelector('.remove-menu-item-btn')?.addEventListener('click', (e) => handleRemoveMenuItem(e));
        });
    });
    // Drag and drop listeners will be added later if requested
}

function handleAddMenuCategory() {
    if (!dom.managerMenuEditorContainer) return;

    const newCategoryId = `cat_${utils.generateUniqueId()}`;
    const newOrder = state.managerMenuConfig.reduce((max, cat) => Math.max(max, cat.order), 0) + 1;
    const newCategory: MenuCategoryConfig = {
        id: newCategoryId, name: "Kategori e Re", icon: "🆕",
        items: [], order: newOrder, defaultOpen: false
    };
    state.managerMenuConfig.push(newCategory);
    state.setManagerMenuConfig([...state.managerMenuConfig]);
    
    const addCatBtn = dom.managerMenuEditorContainer.querySelector('.add-category-btn');
    addCatBtn?.remove();

    const categoryDiv = document.createElement('div');
    categoryDiv.className = 'menu-editor-category';
    categoryDiv.dataset.categoryId = newCategory.id;
    categoryDiv.innerHTML = `
        <div class="menu-editor-category-header">
             <span class="drag-handle category-drag-handle" draggable="true" title="Zvarrit për të rirenditur">↕️</span>
            <input type="text" value="${newCategory.name}" class="menu-editor-input category-name-input" placeholder="Emri Kategorisë">
            <input type="text" value="${newCategory.icon}" class="menu-editor-input category-icon-input" placeholder="Ikona" size="2">
            <input type="checkbox" id="defaultOpen-${newCategory.id}" class="category-default-open-checkbox" ${newCategory.defaultOpen ? 'checked' : ''}> 
            <label for="defaultOpen-${newCategory.id}" class="small-label">Hapur si Default</label>
            <button class="btn btn-sm btn-danger remove-category-btn" title="Hiq Kategorinë">🗑️</button>
        </div>
        <ul class="menu-editor-item-list" data-category-id="${newCategory.id}"></ul>
        <button class="btn btn-sm add-menu-item-btn" data-category-id="${newCategory.id}">Shto Artikull Menusë</button>
    `;
    dom.managerMenuEditorContainer.appendChild(categoryDiv);
    if (addCatBtn) dom.managerMenuEditorContainer.appendChild(addCatBtn);

    categoryDiv.querySelector('.remove-category-btn')?.addEventListener('click', (e) => handleRemoveMenuCategory(e));
    categoryDiv.querySelector('.add-menu-item-btn')?.addEventListener('click', (e) => handleAddMenuItem(e));
}

function handleRemoveMenuCategory(event: Event) {
    const target = event.currentTarget as HTMLButtonElement;
    const categoryDiv = target.closest('.menu-editor-category') as HTMLDivElement | null;
    if (!categoryDiv || !categoryDiv.dataset.categoryId) return;

    const categoryIdToRemove = categoryDiv.dataset.categoryId;
    state.setManagerMenuConfig(state.managerMenuConfig.filter(cat => cat.id !== categoryIdToRemove));
    categoryDiv.remove();
}

function handleAddMenuItem(event: Event) {
    const target = event.currentTarget as HTMLButtonElement;
    const categoryId = target.dataset.categoryId;
    if (!categoryId) return;

    const category = state.managerMenuConfig.find(cat => cat.id === categoryId);
    if (!category) return;

    const newItemId = `item_${utils.generateUniqueId()}`;
    const newOrder = category.items.reduce((max, item) => Math.max(max, item.order), 0) + 1;
    const newItem: MenuItemConfig = {
        id: newItemId, name: "Artikull i Ri", icon: "📄",
        dataView: "new_view", order: newOrder
    };
    category.items.push(newItem);
    state.setManagerMenuConfig([...state.managerMenuConfig]);

    const itemListUl = document.querySelector(`.menu-editor-item-list[data-category-id="${categoryId}"]`) as HTMLUListElement | null;
    if (itemListUl) {
        const itemLi = createManagerMenuItemEditorElement(newItem, categoryId);
        itemListUl.appendChild(itemLi);
        itemLi.querySelector('.remove-menu-item-btn')?.addEventListener('click', (e) => handleRemoveMenuItem(e));
    }
}

function handleRemoveMenuItem(event: Event) {
    const target = event.currentTarget as HTMLButtonElement;
    const itemLi = target.closest('.menu-editor-item') as HTMLLIElement | null;
    if (!itemLi || !itemLi.dataset.itemId || !itemLi.dataset.categoryId) return;

    const itemIdToRemove = itemLi.dataset.itemId;
    const categoryId = itemLi.dataset.categoryId;

    const category = state.managerMenuConfig.find(cat => cat.id === categoryId);
    if (category) {
        category.items = category.items.filter(item => item.id !== itemIdToRemove);
        state.setManagerMenuConfig([...state.managerMenuConfig]);
    }
    itemLi.remove();
}

export function handleSaveManagerMenuConfig() {
    if (!dom.managerMenuEditorContainer) return;

    const updatedConfig: MenuCategoryConfig[] = [];
    const categoryDivsNodeList = dom.managerMenuEditorContainer.querySelectorAll('.menu-editor-category');
    const categoryDivs: HTMLElement[] = Array.from(categoryDivsNodeList) as HTMLElement[];
    const defaultConfig = storage.getDefaultManagerMenuConfig(); 

    categoryDivs.forEach((categoryDiv, catIndex) => {
        const categoryIdFromDOM = categoryDiv.dataset.categoryId || utils.generateUniqueId('cat_');
        const categoryNameInput = categoryDiv.querySelector('.category-name-input') as HTMLInputElement;
        const categoryIconInput = categoryDiv.querySelector('.category-icon-input') as HTMLInputElement;
        const categoryDefaultOpenCheckbox = categoryDiv.querySelector('.category-default-open-checkbox') as HTMLInputElement;

        const newCategory: MenuCategoryConfig = {
            id: categoryIdFromDOM,
            name: categoryNameInput.value.trim() || "Kategori e Paemërtuar",
            icon: categoryIconInput.value.trim() || "❓",
            order: catIndex + 1,
            items: [],
            defaultOpen: categoryDefaultOpenCheckbox.checked
        };

        const itemLisNodeList = categoryDiv.querySelectorAll('.menu-editor-item');
        const itemLis: HTMLElement[] = Array.from(itemLisNodeList) as HTMLElement[];
        itemLis.forEach((itemLi, itemIndex) => {
            const itemIdFromDOM = itemLi.dataset.itemId || utils.generateUniqueId('item_');
            const itemNameInput = itemLi.querySelector('.item-name-input') as HTMLInputElement;
            const itemIconInput = itemLi.querySelector('.item-icon-input') as HTMLInputElement;
            const itemDataViewInput = itemLi.querySelector('.item-dataview-input') as HTMLInputElement;

            let dataViewFromInputValue = itemDataViewInput.value.trim();
            let finalDataView = dataViewFromInputValue;

            if (!dataViewFromInputValue) { 
                let foundInDefault = false;
                for (const defaultCat of defaultConfig) {
                    const defaultItem = defaultCat.items.find(it => it.id === itemIdFromDOM); 
                    if (defaultItem && defaultItem.dataView) {
                        finalDataView = defaultItem.dataView;
                        foundInDefault = true;
                        break;
                    }
                }
                if (!foundInDefault) {
                    finalDataView = "unknown_view"; 
                }
            }

            const newItem: MenuItemConfig = {
                id: itemIdFromDOM,
                name: itemNameInput.value.trim() || "Artikull i Paemërtuar",
                icon: itemIconInput.value.trim() || "📄",
                dataView: finalDataView,
                order: itemIndex + 1
            };
            newCategory.items.push(newItem);
        });
        updatedConfig.push(newCategory);
    });

    state.setManagerMenuConfig(updatedConfig); 
    storage.saveManagerMenuConfig(state.managerMenuConfig); 
    toast.showSuccessToast("Konfigurimi i menysë së menaxherit u ruajt me sukses!");
    
    renderManagerMenuEditor(); 
     
    if (state.currentUser?.role === 'menaxher' && dom.managerDashboardView?.style.display === 'flex') {
        if (typeof (window as any).refreshManagerSidebar === 'function') {
            (window as any).refreshManagerSidebar();
        } else if (dom.dynamicManagerMenuContainer) { 
            console.warn("Attempting basic sidebar rebuild. For full reactivity, ensure refreshManagerSidebar is available.");
            dom.dynamicManagerMenuContainer.innerHTML = ''; 
            const dynamicMenu = storage.buildManagerMenuFromConfig(state.managerMenuConfig);
            if(dynamicMenu) dom.dynamicManagerMenuContainer.appendChild(dynamicMenu);
             if (typeof (window as any).setupManagerSidebarFromApp === 'function') {
                (window as any).setupManagerSidebarFromApp();
            }
        }
    }
}

export function handleResetManagerMenuConfig() {
    showCustomConfirm("Jeni i sigurt që doni të riktheni menynë e menaxherit në konfigurimin fillestar?", () => {
        state.setManagerMenuConfig(storage.getDefaultManagerMenuConfig());
        storage.saveManagerMenuConfig(state.managerMenuConfig);
        renderManagerMenuEditor(); 
        toast.showSuccessToast("Menyja e menaxherit u rikthye në konfigurimin fillestar.");
        
        if(state.currentUser?.role === 'menaxher' && dom.managerDashboardView?.style.display === 'flex') {
            if (typeof (window as any).refreshManagerSidebar === 'function') {
                (window as any).refreshManagerSidebar();
            } else if (dom.dynamicManagerMenuContainer) {
                dom.dynamicManagerMenuContainer.innerHTML = ''; 
                const dynamicMenu = storage.buildManagerMenuFromConfig(state.managerMenuConfig);
                if(dynamicMenu) dom.dynamicManagerMenuContainer.appendChild(dynamicMenu);
                 if (typeof (window as any).setupManagerSidebarFromApp === 'function') {
                    (window as any).setupManagerSidebarFromApp();
                }
            }
        }
    });
}
