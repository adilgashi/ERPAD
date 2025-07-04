/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as toast from '../core/toast';
import { Customer } from '../models';
import { generateUniqueId } from '../core/utils';
import { showCustomConfirm } from '../core/ui';
import { populateSellerCustomerSelect } from '../seller';

let currentCustomerFilter: 'all' | 'vip' | 'regular' | 'at_risk' = 'all';

export function initCustomerManagementEventListeners(): void {
    dom.showAddCustomerModalBtn?.addEventListener('click', () => openCustomerFormModal());
    dom.customerForm?.addEventListener('submit', handleSaveCustomer);
    dom.cancelCustomerFormBtn?.addEventListener('click', closeCustomerFormModal);
    if (dom.customerFormModalCloseBtn) dom.customerFormModalCloseBtn.addEventListener('click', closeCustomerFormModal);
}

export function showCustomerManagementPanelFromManager(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Customer Management panel.");
        return;
    }
    const panel = dom.customerManagementPanel;
    if (panel) {
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }

        if (!panel.querySelector('.customer-segment-filters')) {
            const adminPanelHeader = panel.querySelector('.admin-panel-header');
            if(adminPanelHeader) {
                const filterContainer = document.createElement('div');
                filterContainer.className = 'customer-segment-filters';
                filterContainer.innerHTML = `
                    <button class="segment-filter-btn active" data-filter="all">Të Gjithë</button>
                    <button class="segment-filter-btn" data-filter="vip">VIP</button>
                    <button class="segment-filter-btn" data-filter="regular">Të Rregullt</button>
                    <button class="segment-filter-btn" data-filter="at_risk">Në Risk</button>
                `;
                adminPanelHeader.insertAdjacentElement('afterend', filterContainer);

                filterContainer.addEventListener('click', (event) => {
                    const target = event.target as HTMLButtonElement;
                    if (target.matches('.segment-filter-btn')) {
                        const filter = target.dataset.filter as 'all' | 'vip' | 'regular' | 'at_risk';
                        currentCustomerFilter = filter;
                        
                        filterContainer.querySelectorAll('.segment-filter-btn').forEach(btn => btn.classList.remove('active'));
                        target.classList.add('active');
                        
                        renderCustomerListForManager();
                    }
                });
            }
        }
        
        panel.style.display = 'block';
        currentCustomerFilter = 'all'; 
        const filterButtons = panel.querySelectorAll('.segment-filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === 'all');
        });
        renderCustomerListForManager();
    } else {
        targetContainer.innerHTML = '<p class="error-message">Paneli i menaxhimit të blerësve nuk u gjet.</p>';
    }
}

function generateCustomerCode(): string {
    const lastCustomerCode = state.customers
        .map(c => parseInt(c.code, 10))
        .filter(num => !isNaN(num))
        .sort((a, b) => b - a)[0]; 

    const nextCodeNumber = lastCustomerCode ? lastCustomerCode + 1 : 1;
    return nextCodeNumber.toString().padStart(3, '0'); 
}

export function openCustomerFormModal(customerId?: string): void {
    if (!dom.customerFormModal || !dom.customerForm || !dom.customerFormModalTitle || !dom.editCustomerIdInput ||
        !dom.customerFormCodeInput || !dom.customerFormNameInput || !dom.customerFormUniqueIdInput ||
        !dom.customerFormPhoneInput || !dom.customerFormEmailInput || !dom.customerFormAddressInput ||
        !dom.customerFormNotesInput || !dom.customerFormErrorElement) return;

    dom.customerForm.reset();
    dom.customerFormErrorElement.textContent = '';

    if (customerId) {
        const customer = state.customers.find(c => c.id === customerId);
        if (customer) {
            dom.customerFormModalTitle.textContent = "Modifiko Blerësin";
            dom.editCustomerIdInput.value = customer.id;
            dom.customerFormCodeInput.value = customer.code || '';
            dom.customerFormNameInput.value = customer.name;
            dom.customerFormUniqueIdInput.value = customer.uniqueId || '';
            dom.customerFormPhoneInput.value = customer.phone || '';
            dom.customerFormEmailInput.value = customer.email || '';
            dom.customerFormAddressInput.value = customer.address || '';
            dom.customerFormNotesInput.value = customer.notes || '';
        } else {
            dom.customerFormErrorElement.textContent = "Blerësi nuk u gjet.";
            return;
        }
    } else {
        dom.customerFormModalTitle.textContent = "Shto Blerës të Ri";
        dom.editCustomerIdInput.value = '';
        dom.customerFormCodeInput.value = generateCustomerCode();
    }
    dom.customerFormModal.style.display = 'block';
}

export function closeCustomerFormModal(): void {
    if (dom.customerFormModal) dom.customerFormModal.style.display = 'none';
}

export function handleSaveCustomer(event: Event): void {
    event.preventDefault();
    if (!dom.customerFormNameInput || !dom.customerFormErrorElement || !dom.editCustomerIdInput ||
        !state.currentManagingBusinessId || !dom.customerFormCodeInput || !dom.customerFormUniqueIdInput ||
        !dom.customerFormPhoneInput || !dom.customerFormEmailInput || !dom.customerFormAddressInput ||
        !dom.customerFormNotesInput) return;

    const name = dom.customerFormNameInput.value.trim();
    const code = dom.customerFormCodeInput.value.trim();
    const uniqueId = dom.customerFormUniqueIdInput.value.trim() || undefined;
    const phone = dom.customerFormPhoneInput.value.trim() || undefined;
    const email = dom.customerFormEmailInput.value.trim() || undefined;
    const address = dom.customerFormAddressInput.value.trim() || undefined;
    const notes = dom.customerFormNotesInput.value.trim() || undefined;
    const editingCustomerId = dom.editCustomerIdInput.value;
    dom.customerFormErrorElement.textContent = '';

    if (!name) {
        dom.customerFormErrorElement.textContent = "Emri i blerësit është i detyrueshëm.";
        return;
    }
    if (!code) {
        toast.showErrorToast(`Furnitori "${supplierName}" është në përdorim nga një ose më shumë produkte dhe nuk mund të fshihet. Ju lutem hiqni këtë furnitor nga produktet përkatëse fillimisht.`);
        return;
    }

    const existingCustomerByCode = state.customers.find(c => c.code === code);
    if (existingCustomerByCode && existingCustomerByCode.id !== editingCustomerId) {
        dom.customerFormErrorElement.textContent = `Blerësi me kodin "${code}" ekziston tashmë. (${existingCustomerByCode.name})`;
        return;
    }
    
    if (editingCustomerId) {
        const customerToEdit = state.customers.find(c => c.id === editingCustomerId);
        if (customerToEdit) {
            customerToEdit.name = name;
            customerToEdit.code = code;
            customerToEdit.uniqueId = uniqueId;
            customerToEdit.phone = phone;
            customerToEdit.email = email;
            customerToEdit.address = address;
            customerToEdit.notes = notes;
        }
    } else {
        const newCustomer: Customer = {
            id: generateUniqueId('cust-'),
            businessId: state.currentManagingBusinessId,
            code: code,
            name: name,
            uniqueId: uniqueId,
            phone: phone,
            email: email,
            address: address,
            notes: notes,
        };
        state.customers.push(newCustomer);
    }

    storage.saveCustomersToLocalStorage(state.currentManagingBusinessId, state.customers);
    closeCustomerFormModal();
    renderCustomerListForManager();
    populateSellerCustomerSelect(); 
}

export function handleDeleteCustomer(customerId: string, customerName: string): void {
    if (!state.currentManagingBusinessId) return;

    showCustomConfirm(`Jeni i sigurt që doni të fshini blerësin "${customerName}"?`, () => {
        if (!state.currentManagingBusinessId) return;
        
        const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
        if (business && business.defaultCustomerId === customerId) {
            business.defaultCustomerId = undefined; 
            storage.saveAllBusinesses(state.businesses); 
        }

        state.setCustomers(state.customers.filter(c => c.id !== customerId));
        storage.saveCustomersToLocalStorage(state.currentManagingBusinessId, state.customers);
        renderCustomerListForManager();
        populateSellerCustomerSelect(); 
        toast.showSuccessToast(`Blerësi "${customerName}" u fshi me sukses.`);
    });
}

export function handleSetDefaultCustomer(customerId: string) {
    if (!state.currentManagingBusinessId) return;
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (business) {
        business.defaultCustomerId = customerId;
        storage.saveAllBusinesses(state.businesses);
        renderCustomerListForManager(); 
        populateSellerCustomerSelect(); 
        toast.showSuccessToast(`Blerësi u caktua si default.`);
    }
}

export function renderCustomerListForManager(): void {
    if (!dom.customerListTbody || !state.currentManagingBusinessId) return;
    dom.customerListTbody.innerHTML = '';

    const now = Date.now();
    const ninetyDaysAgo = now - (90 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = now - (60 * 24 * 60 * 60 * 1000);

    const getCustomerMetrics = (customer: Customer) => {
        const sales = [...state.salesLog, ...state.localSalesInvoices].filter(s => s.customerId === customer.id);
        const totalSpent = sales.reduce((sum, s) => sum + ('grandTotal' in s ? s.grandTotal : s.totalAmountWithVAT), 0);
        const recentSales = sales.filter(s => s.timestamp >= ninetyDaysAgo);
        const recentSalesCount = recentSales.length;
        const lastPurchaseTimestamp = sales.length > 0 ? Math.max(...sales.map(s => s.timestamp)) : 0;
        
        return { totalSpent, recentSalesCount, lastPurchaseTimestamp };
    };

    const filteredCustomers = state.customers.filter(customer => {
        if (currentCustomerFilter === 'all') return true;

        const metrics = getCustomerMetrics(customer);

        if (currentCustomerFilter === 'vip') return metrics.totalSpent > 500;
        if (currentCustomerFilter === 'regular') return metrics.recentSalesCount > 5;
        if (currentCustomerFilter === 'at_risk') return metrics.lastPurchaseTimestamp > 0 && metrics.lastPurchaseTimestamp < sixtyDaysAgo;

        return false;
    });

    if (filteredCustomers.length === 0) {
        let message = 'Nuk ka blerës të regjistruar.';
        if(currentCustomerFilter !== 'all') {
            message = 'Asnjë blerës nuk përputhet me këtë segment.';
        }
        dom.customerListTbody.innerHTML = `<tr><td colspan="3" class="text-center">${message}</td></tr>`;
        return;
    }
    
    const currentBusiness = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    const defaultCustomerId = currentBusiness?.defaultCustomerId;

    filteredCustomers.forEach(customer => {
        const tr = document.createElement('tr');
        const isDefault = customer.id === defaultCustomerId;

        const metrics = getCustomerMetrics(customer);
        let tagsHtml = '<div class="customer-tag-container">';
        if (metrics.totalSpent > 500) {
            tagsHtml += '<span class="customer-tag tag-vip" title="Shpenzime totale > 500€">VIP</span>';
        }
        if (metrics.recentSalesCount > 5) {
            tagsHtml += '<span class="customer-tag tag-regular" title="Më shumë se 5 blerje në 90 ditët e fundit">I Rregullt</span>';
        }
        if (metrics.lastPurchaseTimestamp > 0 && metrics.lastPurchaseTimestamp < sixtyDaysAgo) {
            tagsHtml += '<span class="customer-tag tag-risk" title="Më shumë se 60 ditë pa blerje">Në Risk</span>';
        }
        tagsHtml += '</div>';

        tr.innerHTML = `
            <td>${customer.name} (Kodi: ${customer.code}) ${tagsHtml}</td>
            <td>${isDefault ? '<span class="status-badge default">Default</span>' : ''}</td>
            <td>
                <button class="btn btn-info btn-sm set-default-customer-btn" data-customer-id="${customer.id}" ${isDefault ? 'disabled' : ''}>Cakto Default</button>
                <button class="btn btn-warning btn-sm" data-customer-id="${customer.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-customer-id="${customer.id}" data-customer-name="${customer.name}">Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.set-default-customer-btn')?.addEventListener('click', () => handleSetDefaultCustomer(customer.id));
        tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openCustomerFormModal(customer.id));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteCustomer(customer.id, customer.name));
        dom.customerListTbody.appendChild(tr);
    });
}