/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { Product, Customer, Supplier } from '../models';
import { showCustomConfirm } from '../core/ui'; 

const InitialBalances = {
    init: function() {
        this.setupEventListeners();
        this.addRefreshButton(); // Add the refresh button
        this.renderInitialProductStockTable();
        this.renderInitialCustomerBalancesTable();
        this.renderInitialSupplierBalancesTable();
        this.handleTabSwitch(); 
    },

    addRefreshButton: function() {
        const managerContentDiv = document.getElementById('manager-content-initial_balances');
        if (!managerContentDiv) return;

        let titleElement = managerContentDiv.querySelector('h2.manager-section-title') as HTMLElement | null;
        
        // If title element doesn't exist, create it (though it should from the main structure)
        if (!titleElement) {
            titleElement = document.createElement('h2');
            titleElement.className = 'manager-section-title';
            titleElement.textContent = 'Saldot Fillestare';
            managerContentDiv.insertBefore(titleElement, managerContentDiv.firstChild);
        }

        // Check if button already exists to avoid duplicates during hot reloads or multiple inits
        if (document.getElementById('refresh-initial-balances-btn')) {
            return;
        }

        const refreshButton = document.createElement('button');
        refreshButton.id = 'refresh-initial-balances-btn';
        refreshButton.className = 'btn btn-info btn-sm';
        refreshButton.innerHTML = '<span class="icon">🔄</span> Rifresko Gjendjet';
        refreshButton.style.marginLeft = 'auto'; // Push to the right if in a flex container

        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.justifyContent = 'space-between';
        titleContainer.style.alignItems = 'center';
        if (titleElement) {
            titleContainer.style.marginBottom = titleElement.style.marginBottom || '1.5rem'; // Preserve original margin-bottom
        }


        // Move title into new container
        if (titleElement) {
            titleElement.style.marginBottom = '0'; // Reset title's own margin if it was moved
            titleContainer.appendChild(titleElement);
        }
        titleContainer.appendChild(refreshButton);
        
        // Insert the new container before the tab navigation or as the first child if tabs not present
        const tabNavContainer = managerContentDiv.querySelector('.tab-navigation-container');
        if (tabNavContainer) {
            managerContentDiv.insertBefore(titleContainer, tabNavContainer);
        } else if (titleElement) { // Ensure titleElement exists before using it as reference for insertion
            managerContentDiv.insertBefore(titleContainer, managerContentDiv.firstChild);
        } else { // Fallback if titleElement was not found and not created (should not happen with above logic)
            managerContentDiv.prepend(titleContainer);
        }


        refreshButton.addEventListener('click', () => this.handleRefreshBalances());
    },

    handleRefreshBalances: function() {
        const tabContainer = document.getElementById('manager-content-initial_balances');
        if (!tabContainer) return;

        const activeTabContent = tabContainer.querySelector<HTMLDivElement>('.tab-content.active');
        if (activeTabContent) {
            if (activeTabContent.id === 'initial-balances-products-tab') {
                this.renderInitialProductStockTable();
                showCustomConfirm("Gjendjet e stoqeve të artikujve u rifreskuan.", () => {});
            } else if (activeTabContent.id === 'initial-balances-customers-tab') {
                this.renderInitialCustomerBalancesTable();
                showCustomConfirm("Saldot fillestare të blerësve u rifreskuan.", () => {});
            } else if (activeTabContent.id === 'initial-balances-suppliers-tab') {
                this.renderInitialSupplierBalancesTable();
                showCustomConfirm("Saldot fillestare të furnitorëve u rifreskuan.", () => {});
            } else {
                 showCustomConfirm("Skeda aktive nuk u njoh. Rifreskimi nuk u krye.", () => {});
            }
        } else {
            showCustomConfirm("Nuk ka skedë aktive për të rifreskuar.", () => {});
        }
    },

    setupEventListeners: function() {
        dom.ibProductSearchInput?.addEventListener('input', () => this.renderInitialProductStockTable());
        dom.ibCustomerSearchInput?.addEventListener('input', () => this.renderInitialCustomerBalancesTable());
        dom.ibSupplierSearchInput?.addEventListener('input', () => this.renderInitialSupplierBalancesTable());

        dom.ibSaveProductStockBtn?.addEventListener('click', () => this.handleSaveProductStock());
        dom.ibSaveCustomerBalancesBtn?.addEventListener('click', () => this.handleSaveCustomerBalances());
        dom.ibSaveSupplierBalancesBtn?.addEventListener('click', () => this.handleSaveSupplierBalances());
        
        const tabContainer = document.getElementById('manager-content-initial_balances');
        const tabButtons = tabContainer?.querySelectorAll<HTMLButtonElement>('.tab-button');
        tabButtons?.forEach(button => {
            button.addEventListener('click', () => {
                this.handleTabSwitch(button as HTMLButtonElement);
            });
        });
    },

    handleTabSwitch: function(clickedButton?: HTMLButtonElement) {
        const tabContainer = document.getElementById('manager-content-initial_balances');
        if (!tabContainer) return;

        const tabButtons = tabContainer.querySelectorAll<HTMLButtonElement>('.tab-button');
        const tabContents = tabContainer.querySelectorAll<HTMLDivElement>('.tab-content');

        let targetTabId: string | null = null;

        if (clickedButton) {
            targetTabId = clickedButton.dataset.tabTarget || null;
        } else {
            const activeButton = tabContainer.querySelector<HTMLButtonElement>('.tab-button.active');
            targetTabId = activeButton?.dataset.tabTarget || (tabButtons[0] ? tabButtons[0].dataset.tabTarget : null);
        }

        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        if (targetTabId) {
            const targetButton = tabContainer.querySelector<HTMLButtonElement>(`.tab-button[data-tab-target="${targetTabId}"]`);
            const targetContent = document.querySelector<HTMLDivElement>(targetTabId); 
            targetButton?.classList.add('active');
            targetContent?.classList.add('active');
        }
    },

    renderInitialProductStockTable: function() {
        if (!dom.ibProductStockTbody || !state.currentManagingBusinessId) return;
        const searchTerm = dom.ibProductSearchInput?.value.toLowerCase().trim() || '';
        dom.ibProductStockTbody.innerHTML = '';

        const productsToDisplay = state.products.filter(p => 
            p.name.toLowerCase().includes(searchTerm) || 
            p.code.toLowerCase().includes(searchTerm)
        ).sort((a,b) => (a.code || "").localeCompare(b.code || ""));

        if (productsToDisplay.length === 0) {
            dom.ibProductStockTbody.innerHTML = `<tr><td colspan="5" class="text-center">${searchTerm ? 'Asnjë artikull nuk përputhet me kërkimin.' : 'Nuk ka artikuj të regjistruar.'}</td></tr>`;
            return;
        }

        productsToDisplay.forEach(product => {
            const categoryName = product.categoryId ? state.categories.find(c => c.id === product.categoryId)?.name || 'E Pa Kategorizuar' : 'E Pa Kategorizuar';
            const tr = document.createElement('tr');
            tr.dataset.productId = product.id;
            tr.innerHTML = `
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>${categoryName}</td>
                <td class="text-right">
                    <input type="number" value="${product.stock}" class="form-control form-control-sm text-right" style="width: 100px;" data-field="stock" min="0" step="any">
                </td>
                <td>${product.unitOfMeasure || 'copë'}</td>
            `;
            dom.ibProductStockTbody.appendChild(tr);
        });
    },

    renderInitialCustomerBalancesTable: function() {
        if (!dom.ibCustomerBalanceTbody || !state.currentManagingBusinessId) return;
        const searchTerm = dom.ibCustomerSearchInput?.value.toLowerCase().trim() || '';
        dom.ibCustomerBalanceTbody.innerHTML = '';

        const customersToDisplay = state.customers.filter(c => 
            c.name.toLowerCase().includes(searchTerm) ||
            (c.code && c.code.toLowerCase().includes(searchTerm))
        ).sort((a,b) => a.name.localeCompare(b.name));

        if (customersToDisplay.length === 0) {
            dom.ibCustomerBalanceTbody.innerHTML = `<tr><td colspan="3" class="text-center">${searchTerm ? 'Asnjë blerës nuk përputhet me kërkimin.' : 'Nuk ka blerës të regjistruar.'}</td></tr>`;
            return;
        }

        customersToDisplay.forEach(customer => {
            const tr = document.createElement('tr');
            tr.dataset.customerId = customer.id;
            tr.innerHTML = `
                <td>${customer.code}</td>
                <td>${customer.name}</td>
                <td class="text-right">
                    <input type="number" value="${customer.openingBalance || 0}" class="form-control form-control-sm text-right" style="width: 120px;" data-field="openingBalance" step="any">
                </td>
            `;
            dom.ibCustomerBalanceTbody.appendChild(tr);
        });
    },

    renderInitialSupplierBalancesTable: function() {
         if (!dom.ibSupplierBalanceTbody || !state.currentManagingBusinessId) return;
        const searchTerm = dom.ibSupplierSearchInput?.value.toLowerCase().trim() || '';
        dom.ibSupplierBalanceTbody.innerHTML = '';

        const suppliersToDisplay = state.suppliers.filter(s => 
            s.name.toLowerCase().includes(searchTerm) ||
            (s.code && s.code.toLowerCase().includes(searchTerm))
        ).sort((a,b) => a.name.localeCompare(b.name));
        
        if (suppliersToDisplay.length === 0) {
            dom.ibSupplierBalanceTbody.innerHTML = `<tr><td colspan="3" class="text-center">${searchTerm ? 'Asnjë furnitor nuk përputhet me kërkimin.' : 'Nuk ka furnitorë të regjistruar.'}</td></tr>`;
            return;
        }

        suppliersToDisplay.forEach(supplier => {
            const tr = document.createElement('tr');
            tr.dataset.supplierId = supplier.id;
            tr.innerHTML = `
                <td>${supplier.code}</td>
                <td>${supplier.name}</td>
                <td class="text-right">
                    <input type="number" value="${supplier.openingBalance || 0}" class="form-control form-control-sm text-right" style="width: 120px;" data-field="openingBalance" step="any">
                </td>
            `;
            dom.ibSupplierBalanceTbody.appendChild(tr);
        });
    },

    handleSaveProductStock: function() {
        if (!dom.ibProductStockTbody || !state.currentManagingBusinessId) return;
        const rows = dom.ibProductStockTbody.querySelectorAll<HTMLTableRowElement>('tr[data-product-id]');
        let changesMade = false;
        rows.forEach(row => {
            const productId = row.dataset.productId;
            const stockInput = row.querySelector<HTMLInputElement>('input[data-field="stock"]');
            if (productId && stockInput) {
                const newStock = parseFloat(stockInput.value);
                if (!isNaN(newStock) && newStock >= 0) {
                    const product = state.products.find(p => p.id === productId);
                    if (product && product.stock !== newStock) {
                        product.stock = newStock;
                        changesMade = true;
                    }
                } else if (stockInput.value.trim() !== '') {
                     alert(`Vlera e stokut për produktin me ID ${productId} është e pavlefshme. Ju lutem futni një numër pozitiv ose zero.`);
                     stockInput.value = state.products.find(p => p.id === productId)?.stock.toString() || '0';
                }
            }
        });
        if (changesMade) {
            storage.saveProductsToLocalStorage(state.currentManagingBusinessId, state.products);
            showCustomConfirm("Stoku fillestar i artikujve u ruajt me sukses.", () => {
                this.renderInitialProductStockTable(); 
                if (typeof (window as any).renderManagerStockOverview === 'function') (window as any).renderManagerStockOverview();
            });
        } else {
            showCustomConfirm("Nuk ka ndryshime për të ruajtur në stoqet e artikujve.", () => {});
        }
    },

    handleSaveCustomerBalances: function() {
        if (!dom.ibCustomerBalanceTbody || !state.currentManagingBusinessId) return;
        const rows = dom.ibCustomerBalanceTbody.querySelectorAll<HTMLTableRowElement>('tr[data-customer-id]');
        let changesMade = false;
        rows.forEach(row => {
            const customerId = row.dataset.customerId;
            const balanceInput = row.querySelector<HTMLInputElement>('input[data-field="openingBalance"]');
            if (customerId && balanceInput) {
                const newBalance = parseFloat(balanceInput.value);
                if (!isNaN(newBalance)) {
                    const customer = state.customers.find(c => c.id === customerId);
                    if (customer && (customer.openingBalance || 0) !== newBalance) {
                        customer.openingBalance = newBalance;
                        changesMade = true;
                    }
                } else if (balanceInput.value.trim() !== '') {
                     alert(`Vlera e saldos për blerësin me ID ${customerId} është e pavlefshme.`);
                     balanceInput.value = (state.customers.find(c => c.id === customerId)?.openingBalance || 0).toString();
                }
            }
        });
        if (changesMade) {
            storage.saveCustomersToLocalStorage(state.currentManagingBusinessId, state.customers);
            showCustomConfirm("Saldot fillestare të blerësve u ruajtën me sukses.", () => {
                this.renderInitialCustomerBalancesTable();
                if (typeof (window as any).renderManagerCustomerBalances === 'function') (window as any).renderManagerCustomerBalances();
                if (state.currentUser?.role === 'menaxher' && dom.managerContentCustomerLedger?.style.display === 'block') {
                     if (typeof (window as any).refreshCustomerLedger === 'function') {
                        (window as any).refreshCustomerLedger();
                    }
                }
            });
        } else {
            showCustomConfirm("Nuk ka ndryshime për të ruajtur në saldot e blerësve.", () => {});
        }
    },

    handleSaveSupplierBalances: function() {
        if (!dom.ibSupplierBalanceTbody || !state.currentManagingBusinessId) return;
        const rows = dom.ibSupplierBalanceTbody.querySelectorAll<HTMLTableRowElement>('tr[data-supplier-id]');
        let changesMade = false;
        rows.forEach(row => {
            const supplierId = row.dataset.supplierId;
            const balanceInput = row.querySelector<HTMLInputElement>('input[data-field="openingBalance"]');
            if (supplierId && balanceInput) {
                const newBalance = parseFloat(balanceInput.value);
                if (!isNaN(newBalance)) {
                    const supplier = state.suppliers.find(s => s.id === supplierId);
                    if (supplier && (supplier.openingBalance || 0) !== newBalance) {
                        supplier.openingBalance = newBalance;
                        changesMade = true;
                    }
                } else if (balanceInput.value.trim() !== '') {
                     alert(`Vlera e saldos për furnitorin me ID ${supplierId} është e pavlefshme.`);
                     balanceInput.value = (state.suppliers.find(s => s.id === supplierId)?.openingBalance || 0).toString();
                }
            }
        });
        if (changesMade) {
            storage.saveSuppliersToLocalStorage(state.currentManagingBusinessId, state.suppliers);
            showCustomConfirm("Saldot fillestare të furnitorëve u ruajtën me sukses.", () => {
                this.renderInitialSupplierBalancesTable();
                if (typeof (window as any).renderManagerSupplierBalances === 'function') (window as any).renderManagerSupplierBalances();
                if (state.currentUser?.role === 'menaxher' && dom.managerContentSupplierLedger?.style.display === 'block') {
                     if (typeof (window as any).refreshSupplierLedger === 'function') {
                        (window as any).refreshSupplierLedger();
                    }
                }
            });
        } else {
            showCustomConfirm("Nuk ka ndryshime për të ruajtur në saldot e furnitorëve.", () => {});
        }
    }
};

export default InitialBalances;