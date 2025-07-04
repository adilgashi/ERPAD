

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { LocalSaleInvoice, LocalSaleInvoiceItem, Customer, Product, Business } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import * as uiUtils from '../core/ui';
import { setActiveManagerView } from './index';
import { createJournalEntryForSale } from './accountingUtils';

let currentLocalSaleItems: LocalSaleInvoiceItem[] = [];
let currentEditingLocalSaleInvoiceId: string | null = null;

// --- Event Listeners Setup ---
export function initLocalSalesEventListeners(): void {
    // Event listeners are attached dynamically when views are rendered
}

// --- Local Sales List View ---
export function initLocalSalesManagementView(): void {
    const container = dom.managerContentLocalSalesManagement;
    if (!container) {
        console.error("Local sales management content area not found.");
        return;
    }
    
    container.innerHTML = `
        <h2 class="manager-section-title">Menaxhimi i Shitjeve Vendore</h2>
        <div class="admin-panel-actions" style="margin-bottom: 1rem;">
            <button id="btn-add-new-local-sale" class="btn btn-primary">
                <span class="icon">➕</span> Shto Faturë të Re Shitjeje Vendore
            </button>
        </div>
        <div class="table-container">
            <table class="admin-table" id="local-sales-list-table">
                <thead>
                    <tr>
                        <th>ID Fature</th>
                        <th>Data</th>
                        <th>Blerësi</th>
                        <th class="text-right">Totali (€)</th>
                        <th>Regjistruar Nga</th>
                        <th>Veprime</th>
                    </tr>
                </thead>
                <tbody id="local-sales-list-tbody">
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('btn-add-new-local-sale')?.addEventListener('click', () => {
        currentEditingLocalSaleInvoiceId = null; 
        currentLocalSaleItems = []; 
        setActiveManagerView('add_local_sale', 'Shto Faturë Shitje Vendore');
    });

    renderLocalSalesList();
}

function renderLocalSalesList(): void {
    const tbody = document.getElementById('local-sales-list-tbody');
    if (!tbody || !state.currentManagingBusinessId) return;
    tbody.innerHTML = '';

    if (state.localSalesInvoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nuk ka fatura shitjesh vendore të regjistruara.</td></tr>';
        return;
    }

    const sortedInvoices = [...state.localSalesInvoices].sort((a, b) => b.timestamp - a.timestamp);

    sortedInvoices.forEach(invoice => {
        const tr = document.createElement('tr');
        const customerName = invoice.customerName || (invoice.customerId ? state.customers.find(c => c.id === invoice.customerId)?.name : 'Klient Standard') || 'Klient Standard';
        tr.innerHTML = `
            <td>${invoice.id}</td>
            <td>${new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${customerName}</td>
            <td class="text-right">${invoice.totalAmountWithVAT.toFixed(2)} €</td>
            <td>${invoice.recordedByManagerUsername}</td>
            <td>
                <button class="btn btn-info btn-sm view-ls-details-btn" data-invoice-id="${invoice.id}">Detajet</button>
                <button class="btn btn-warning btn-sm edit-ls-btn" data-invoice-id="${invoice.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm delete-ls-btn" data-invoice-id="${invoice.id}" data-invoice-number="${invoice.id}">Fshij</button>
            </td>
        `;
        
        tr.querySelector<HTMLButtonElement>('.edit-ls-btn')?.addEventListener('click', () => {
            currentEditingLocalSaleInvoiceId = invoice.id;
            setActiveManagerView('add_local_sale', `Modifiko Faturën ${invoice.id}`);
        });
        tr.querySelector<HTMLButtonElement>('.view-ls-details-btn')?.addEventListener('click', () => openLocalSaleDetailsModal(invoice.id));
        tr.querySelector<HTMLButtonElement>('.delete-ls-btn')?.addEventListener('click', () => handleDeleteLocalSaleInvoice(invoice.id, invoice.id));

        tbody.appendChild(tr);
    });
}

// --- Add/Edit Local Sale Form View ---
export function initAddLocalSaleView(): void {
    const container = dom.managerContentAddLocalSale;
    if (!container) {
        console.error("Add local sale content area not found.");
        return;
    }
    container.classList.add('purchase-form-section');

    const isEditing = !!currentEditingLocalSaleInvoiceId;
    let title = isEditing ? `Modifiko Faturën: ${currentEditingLocalSaleInvoiceId}` : 'Shto Faturë të Re Shitjeje Vendore';
    
    let systemInvoiceNumber = '';
    if (!isEditing) {
        const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
        const fiscalYear = business ? business.fiscalYear : new Date().getFullYear();
        const seed = business ? business.localSaleInvoiceIdSeed : 1;
        systemInvoiceNumber = `SHV-${String(seed).padStart(3, '0')}-${fiscalYear}`;
    }

    container.innerHTML = ` 
        <h2 class="manager-section-title" id="add-local-sale-form-title">${title}</h2>
        <form id="local-sale-form"> 
            <input type="hidden" id="edit-local-sale-id" value="${currentEditingLocalSaleInvoiceId || ''}">
            
            <div class="modal-section">
                <div class="form-grid-3-cols">
                    <div class="form-group">
                        <label for="ls-customer-select">Blerësi:</label>
                        <select id="ls-customer-select" name="customerId" class="form-control">
                            <option value="">-- Klient Standard --</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="ls-invoice-date">Data e Faturës:</label>
                        <input type="date" id="ls-invoice-date" name="invoiceDate" class="form-control" value="${getTodayDateString()}">
                    </div>
                    <div class="form-group">
                        <label for="ls-system-invoice-number">Nr. Faturës (Sistem):</label>
                        <input type="text" id="ls-system-invoice-number" name="systemInvoiceNumber" readonly class="readonly-field form-control" value="${systemInvoiceNumber}" style="font-weight: bold; color: #0056b3; background-color: #e9ecef;">
                    </div>
                </div>
            </div>
            
            <hr class="modal-divider">
            
            <div class="modal-section">
                <h3 class="modal-section-title">Shto Artikuj në Faturë</h3>
                <div class="item-entry-grid">
                     <div class="form-group">
                        <label for="ls-product-select">Produkti:</label>
                        <select id="ls-product-select" name="productId" class="form-control">
                            <option value="">-- Zgjidh Produktin --</option>
                        </select>
                    </div>
                    <div class="lp-item-actions">
                        <button type="button" id="ls-add-item-to-invoice-btn" class="btn btn-info">Shto Artikull</button>
                    </div>
                </div>
            </div>

            <div class="modal-section table-section">
                <div class="table-responsive">
                    <table class="admin-table items-table" id="ls-items-table">
                        <thead>
                            <tr>
                                <th>Kodi</th>
                                <th>Emërtimi</th>
                                <th>Sasia</th>
                                <th class="text-right">Çm. Shitjes (pa TVSH)</th>
                                <th class="text-right">TVSH (%)</th>
                                <th class="text-right">Çm. Shitjes (me TVSH)</th>
                                <th class="text-right">Vlera Tot. (pa TVSH)</th>
                                <th class="text-right">Vlera Tot. (me TVSH)</th>
                                <th>Veprim</th>
                            </tr>
                        </thead>
                        <tbody id="ls-items-tbody">
                            <tr><td colspan="9" class="text-center">Asnjë artikull i shtuar në faturë.</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="modal-section summary-section">
                <div class="sale-summary">
                    <div class="summary-row">
                        <span>Nëntotali (pa TVSH):</span>
                        <span id="ls-summary-subtotal-no-vat">0.00 €</span>
                    </div>
                    <div class="summary-row">
                        <span>Vlera e TVSH-së:</span>
                        <span id="ls-summary-vat-amount">0.00 €</span>
                    </div>
                    <div class="summary-row total-row">
                        <span><strong>TOTALI (me TVSH):</strong></span>
                        <span id="ls-summary-grand-total-with-vat"><strong>0.00 €</strong></span>
                    </div>
                </div>
            </div>
            
            <p id="local-sale-form-error" class="error-message" aria-live="polite"></p>
            <div class="form-actions-group" style="justify-content: flex-end;"> 
                <button type="submit" id="save-local-sale-btn" class="btn btn-primary">Ruaj Faturën</button>
                <button type="button" id="cancel-local-sale-form-btn" class="btn btn-secondary">Anulo</button>
            </div>
        </form>
    `;
    
    populateLSCustomerSelect();
    populateLSProductSelect();

    document.getElementById('cancel-local-sale-form-btn')?.addEventListener('click', () => {
        currentEditingLocalSaleInvoiceId = null;
        currentLocalSaleItems = [];
        setActiveManagerView('local_sales_management');
    });

    document.getElementById('local-sale-form')?.addEventListener('submit', handleSaveLocalSaleInvoice);
    document.getElementById('ls-add-item-to-invoice-btn')?.addEventListener('click', handleAddItemToLocalSaleTable);
    
    const itemsTbody = document.getElementById('ls-items-tbody');
    itemsTbody?.addEventListener('click', (event) => {
        const target = event.target as HTMLButtonElement;
        if (target && target.classList.contains('remove-ls-item-btn')) {
            const itemIndex = parseInt(target.dataset.index || '-1', 10);
            if (itemIndex !== -1) handleRemoveItemFromLocalSaleTable(itemIndex);
        }
    });
    itemsTbody?.addEventListener('input', handleLSTableItemInputChange);
    itemsTbody?.addEventListener('keydown', handleLSEnterKeyNavigation);

    if (isEditing && currentEditingLocalSaleInvoiceId) {
        const invoiceToEdit = state.localSalesInvoices.find(inv => inv.id === currentEditingLocalSaleInvoiceId);
        if (invoiceToEdit) {
            const customerSelect = document.getElementById('ls-customer-select') as HTMLSelectElement | null;
            const invoiceDateInput = document.getElementById('ls-invoice-date') as HTMLInputElement | null;
            const systemInvoiceInput = document.getElementById('ls-system-invoice-number') as HTMLInputElement | null;

            if (customerSelect) customerSelect.value = invoiceToEdit.customerId || '';
            if (invoiceDateInput) invoiceDateInput.value = invoiceToEdit.invoiceDate;
            if (systemInvoiceInput) systemInvoiceInput.value = invoiceToEdit.id; 
            
            currentLocalSaleItems = JSON.parse(JSON.stringify(invoiceToEdit.items)); 
        } else {
            console.error("Local Sale Invoice to edit not found:", currentEditingLocalSaleInvoiceId);
            currentEditingLocalSaleInvoiceId = null; 
            currentLocalSaleItems = [];
            const formTitleEl = document.getElementById('add-local-sale-form-title');
            if(formTitleEl) formTitleEl.textContent = 'Shto Faturë të Re Shitjeje Vendore';
        }
    } else {
        currentLocalSaleItems = [];
    }
    renderLocalSaleItemsTable();
}

function populateLSCustomerSelect(): void {
    const select = document.getElementById('ls-customer-select') as HTMLSelectElement | null;
    if (!select) return;
    select.innerHTML = '<option value="">-- Klient Standard --</option>';
    state.customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (Kodi: ${customer.code})`;
        select.appendChild(option);
    });
}

function populateLSProductSelect(): void {
    const select = document.getElementById('ls-product-select') as HTMLSelectElement | null;
    if (!select) return;
    select.innerHTML = '<option value="">-- Zgjidh Produktin --</option>';
    state.products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (Kodi: ${product.code}) (Stoku: ${product.stock})`;
        select.appendChild(option);
    });
}

function renderLocalSaleItemsTable(): void {
    const tbody = document.getElementById('ls-items-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (currentLocalSaleItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Asnjë artikull i shtuar në faturë.</td></tr>';
        return;
    }

    currentLocalSaleItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.productCode}</td>
            <td>${item.productName}</td>
            <td><input type="number" class="form-control form-control-sm text-right editable-ls-item-field" data-index="${index}" data-field="quantity" value="${item.quantity}" min="0.01" step="any"> ${item.productUnitOfMeasure}</td>
            <td class="text-right"><input type="number" class="form-control form-control-sm text-right editable-ls-item-field" data-index="${index}" data-field="priceWithoutVAT" value="${item.priceWithoutVAT.toFixed(2)}" min="0" step="any"></td>
            <td class="text-right"><input type="number" class="form-control form-control-sm text-right editable-ls-item-field" data-index="${index}" data-field="vatRate" value="${item.vatRate}" min="0" step="any"></td>
            <td class="text-right"><input type="number" class="form-control form-control-sm text-right editable-ls-item-field" data-index="${index}" data-field="priceWithVAT" value="${item.priceWithVAT.toFixed(2)}" min="0" step="any"></td>
            <td class="text-right" id="ls-row-total-novat-${index}">${item.totalValueWithoutVAT.toFixed(2)}</td>
            <td class="text-right" id="ls-row-total-vat-${index}">${item.totalValueWithVAT.toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-danger btn-sm remove-ls-item-btn" data-index="${index}">Hiqe</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    updateLocalSaleTotals();
}

function handleAddItemToLocalSaleTable(): void {
    const productSelect = document.getElementById('ls-product-select') as HTMLSelectElement | null;
    if (!productSelect) return;

    const productId = productSelect.value;
    const quantity = 1; 

    if (!productId) { uiUtils.showCustomConfirm("Ju lutem zgjidhni një produkt.", () => {}); return; }

    const product = state.products.find(p => p.id === productId);
    if (!product) { uiUtils.showCustomConfirm("Produkti i zgjedhur nuk u gjet.", () => {}); return; }

    if (currentLocalSaleItems.some(item => item.productId === productId)) {
        uiUtils.showCustomConfirm("Ky produkt është shtuar tashmë. Modifikoni sasinë ose çmimin direkt në tabelë.", () => {});
        return;
    }

    const defaultVatRate = product.vatRate || 18; 
    const priceWithVAT = product.price; 
    const priceWithoutVAT = parseFloat((priceWithVAT / (1 + defaultVatRate / 100)).toFixed(2));

    const newItem: LocalSaleInvoiceItem = {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        productUnitOfMeasure: product.unitOfMeasure,
        productQuantityPerPackage: product.quantityPerPackage,
        quantity: quantity,
        priceWithoutVAT: priceWithoutVAT,
        vatRate: defaultVatRate,
        priceWithVAT: priceWithVAT,
        totalValueWithoutVAT: parseFloat((quantity * priceWithoutVAT).toFixed(2)),
        totalValueWithVAT: parseFloat((quantity * priceWithVAT).toFixed(2)),
    };
    
    currentLocalSaleItems.push(newItem);
    renderLocalSaleItemsTable();
    productSelect.value = '';
}

function handleRemoveItemFromLocalSaleTable(index: number): void {
    if (index >= 0 && index < currentLocalSaleItems.length) {
        currentLocalSaleItems.splice(index, 1);
        renderLocalSaleItemsTable();
    }
}

function handleLSTableItemInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target || !target.classList.contains('editable-ls-item-field')) return;

    const itemIndex = parseInt(target.dataset.index || '-1', 10);
    const field = target.dataset.field as keyof LocalSaleInvoiceItem;
    
    if (itemIndex === -1 || !field || !currentLocalSaleItems[itemIndex]) return;
    
    const item = currentLocalSaleItems[itemIndex];
    let value = parseFloat(target.value);

    if (field === 'quantity') {
        if (target.value === "" || isNaN(value) || value <= 0) {
            item.quantity = 1;
            target.value = String(item.quantity);
        } else {
            item.quantity = value;
        }
    } else if (field === 'priceWithoutVAT' || field === 'vatRate' || field === 'priceWithVAT') {
        if (isNaN(value) || value < 0) {
            target.value = String(item[field as keyof Pick<LocalSaleInvoiceItem, 'priceWithoutVAT' | 'vatRate' | 'priceWithVAT'>]);
            item.priceWithVAT = parseFloat((item.priceWithoutVAT * (1 + item.vatRate / 100)).toFixed(2));
        } else {
            (item[field as keyof Pick<LocalSaleInvoiceItem, 'priceWithoutVAT' | 'vatRate' | 'priceWithVAT'>] as number) = value;
            if (field === 'priceWithoutVAT' || field === 'vatRate') {
                item.priceWithVAT = parseFloat((item.priceWithoutVAT * (1 + item.vatRate / 100)).toFixed(2));
            } else if (field === 'priceWithVAT') {
                item.priceWithoutVAT = parseFloat((item.priceWithVAT / (1 + item.vatRate / 100)).toFixed(2));
            }
        }
    }

    item.totalValueWithoutVAT = parseFloat((item.quantity * item.priceWithoutVAT).toFixed(2));
    item.totalValueWithVAT = parseFloat((item.quantity * item.priceWithVAT).toFixed(2));

    const rowElement = target.closest('tr');
    if (rowElement) {
        if (field !== 'priceWithVAT') {
            const priceWithVatInput = rowElement.querySelector<HTMLInputElement>(`input[data-field="priceWithVAT"]`);
            if (priceWithVatInput) priceWithVatInput.value = item.priceWithVAT.toFixed(2);
        }
        if (field !== 'priceWithoutVAT' && (field === 'priceWithVAT' || field === 'vatRate')) {
            const priceWithoutVatInput = rowElement.querySelector<HTMLInputElement>(`input[data-field="priceWithoutVAT"]`);
            if (priceWithoutVatInput) priceWithoutVatInput.value = item.priceWithoutVAT.toFixed(2);
        }
        const totalNoVatCell = document.getElementById(`ls-row-total-novat-${itemIndex}`);
        if (totalNoVatCell) totalNoVatCell.textContent = item.totalValueWithoutVAT.toFixed(2);
        const totalVatCell = document.getElementById(`ls-row-total-vat-${itemIndex}`);
        if (totalVatCell) totalVatCell.textContent = item.totalValueWithVAT.toFixed(2);
    }
    updateLocalSaleTotals();
}

function handleLSEnterKeyNavigation(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;

    const target = event.target as HTMLInputElement;
    if (!target || !target.classList.contains('editable-ls-item-field')) {
        return;
    }

    event.preventDefault();

    const currentRow = target.closest('tr');
    if (!currentRow) return;

    const currentFieldType = target.dataset.field;
    let nextFieldType: string | null = null;
    let focusProductSelect = false;

    switch (currentFieldType) {
        case 'quantity': nextFieldType = 'priceWithoutVAT'; break;
        case 'priceWithoutVAT': nextFieldType = 'vatRate'; break;
        case 'vatRate': nextFieldType = 'priceWithVAT'; break;
        case 'priceWithVAT': focusProductSelect = true; break;
    }

    if (focusProductSelect) {
        const productSelect = document.getElementById('ls-product-select') as HTMLSelectElement | null;
        productSelect?.focus();
    } else if (nextFieldType) {
        const nextInput = currentRow.querySelector(`input[data-field="${nextFieldType}"]`) as HTMLInputElement | null;
        nextInput?.focus();
        nextInput?.select(); 
    }
}


function updateLocalSaleTotals(): void {
    const subtotalNoVat = currentLocalSaleItems.reduce((sum, item) => sum + item.totalValueWithoutVAT, 0);
    const totalVat = currentLocalSaleItems.reduce((sum, item) => sum + (item.totalValueWithVAT - item.totalValueWithoutVAT), 0);
    const grandTotalWithVat = currentLocalSaleItems.reduce((sum, item) => sum + item.totalValueWithVAT, 0);

    const subtotalEl = document.getElementById('ls-summary-subtotal-no-vat');
    const vatAmountEl = document.getElementById('ls-summary-vat-amount');
    const grandTotalEl = document.getElementById('ls-summary-grand-total-with-vat');

    if (subtotalEl) subtotalEl.textContent = `${subtotalNoVat.toFixed(2)} €`;
    if (vatAmountEl) vatAmountEl.textContent = `${totalVat.toFixed(2)} €`;
    if (grandTotalEl) grandTotalEl.innerHTML = `<strong>${grandTotalWithVat.toFixed(2)} €</strong>`;
}

async function handleSaveLocalSaleInvoice(event: Event) {
    event.preventDefault();
    const customerSelect = document.getElementById('ls-customer-select') as HTMLSelectElement | null;
    const invoiceDateInput = document.getElementById('ls-invoice-date') as HTMLInputElement | null;
    const systemInvoiceInput = document.getElementById('ls-system-invoice-number') as HTMLInputElement | null;
    const errorElement = document.getElementById('local-sale-form-error') as HTMLParagraphElement | null;

    if (!customerSelect || !invoiceDateInput || !systemInvoiceInput || !errorElement || !state.currentUser || !state.currentManagingBusinessId) {
        uiUtils.showCustomConfirm("Gabim: Mungojnë elemente të formularit.", () => {}); return;
    }

    const customerId = customerSelect.value || undefined;
    const invoiceDate = invoiceDateInput.value;
    let systemInvoiceNumber = systemInvoiceInput.value;

    errorElement.textContent = '';
    if (!invoiceDate) { errorElement.textContent = "Data e faturës është e detyrueshme."; return; }
    if (currentLocalSaleItems.length === 0) { errorElement.textContent = "Shtoni të paktën një artikull."; return; }
    
    for (const item of currentLocalSaleItems) {
        if (item.quantity == null || isNaN(item.quantity) || item.quantity <= 0) {
            errorElement.textContent = `Sasia për produktin "${item.productName}" duhet të jetë numër pozitiv.`; return;
        }
        const productInState = state.products.find(p => p.id === item.productId);
        if (!currentEditingLocalSaleInvoiceId && productInState && productInState.stock < item.quantity) { 
             errorElement.textContent = `Stoku i pamjaftueshëm për "${item.productName}". Stoku aktual: ${productInState.stock}.`; return;
        }
    }

    const customer = customerId ? state.customers.find(c => c.id === customerId) : undefined;
    const totalAmountWithoutVAT = currentLocalSaleItems.reduce((sum, item) => sum + item.totalValueWithoutVAT, 0);
    const totalVATAmount = currentLocalSaleItems.reduce((sum, item) => sum + (item.totalValueWithVAT - item.totalValueWithoutVAT), 0);
    const totalAmountWithVAT = currentLocalSaleItems.reduce((sum, item) => sum + item.totalValueWithVAT, 0);
    const editingInvoiceId = currentEditingLocalSaleInvoiceId; 

    if (editingInvoiceId) {
        const invoiceIndex = state.localSalesInvoices.findIndex(inv => inv.id === editingInvoiceId);
        if (invoiceIndex > -1) {
            const invoiceToUpdate = state.localSalesInvoices[invoiceIndex];
            invoiceToUpdate.items.forEach(oldItem => { 
                const product = state.products.find(p => p.id === oldItem.productId);
                if (product) product.stock += oldItem.quantity;
            });
            let stockError = false;
            currentLocalSaleItems.forEach(newItem => { 
                const product = state.products.find(p => p.id === newItem.productId);
                if (product) {
                    if (product.stock < newItem.quantity) {
                        errorElement.textContent = `Stoku i pamjaftueshëm për "${newItem.productName}" pas modifikimit. Stoku aktual: ${product.stock}. Nevojitet: ${newItem.quantity}.`;
                        stockError = true;
                         invoiceToUpdate.items.forEach(oldItem => {
                            const p = state.products.find(px => px.id === oldItem.productId);
                            if (p) p.stock -= oldItem.quantity; 
                         });
                        return; 
                    }
                    product.stock -= newItem.quantity;
                }
            });
            if (stockError) return; 
            
            Object.assign(invoiceToUpdate, {
                customerId, customerName: customer?.name, invoiceDate, items: [...currentLocalSaleItems],
                totalAmountWithoutVAT, totalVATAmount, totalAmountWithVAT,
                recordedByManagerId: state.currentUser.id, recordedByManagerUsername: state.currentUser.username,
                timestamp: Date.now()
            });
            systemInvoiceNumber = invoiceToUpdate.id; 
            await createJournalEntryForSale(invoiceToUpdate);
        }
    } else {
        const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
        if (!business) { uiUtils.showCustomConfirm("Biznesi nuk u gjet.", () => {}); return; }
        
        const newInvoice: LocalSaleInvoice = {
            id: systemInvoiceNumber, businessId: state.currentManagingBusinessId, customerId, customerName: customer?.name,
            invoiceDate, items: [...currentLocalSaleItems], totalAmountWithoutVAT, totalVATAmount, totalAmountWithVAT,
            amountPaid: 0, recordedByManagerId: state.currentUser.id, recordedByManagerUsername: state.currentUser.username,
            timestamp: Date.now(),
        };
        state.localSalesInvoices.push(newInvoice);
        business.localSaleInvoiceIdSeed = (business.localSaleInvoiceIdSeed || 1) + 1;
        await storage.saveAllBusinesses(state.businesses);

        currentLocalSaleItems.forEach(item => {
            const product = state.products.find(p => p.id === item.productId);
            if (product) product.stock -= item.quantity;
        });
        await createJournalEntryForSale(newInvoice);
    }
    
    await storage.saveProductsToLocalStorage(state.currentManagingBusinessId, state.products);
    await storage.saveLocalSalesInvoicesToLocalStorage(state.currentManagingBusinessId, state.localSalesInvoices);

    const successMessage = `Fatura e shitjes vendore ${systemInvoiceNumber} u ruajt!`;
    uiUtils.showCustomConfirm(successMessage, () => {
        currentEditingLocalSaleInvoiceId = null;
        currentLocalSaleItems = [];
        setActiveManagerView('local_sales_management');
    });
}

function openLocalSaleDetailsModal(invoiceId: string): void {
    // This function can reuse the local purchase details modal structure if it's generic enough
    // For now, it's just a placeholder.
    const invoice = state.localSalesInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) { uiUtils.showCustomConfirm("Fatura e shitjes vendore nuk u gjet.", () => {}); return; }
    alert(`Showing details for ${invoiceId}: Customer: ${invoice.customerName || 'Standard'}, Total: ${invoice.totalAmountWithVAT.toFixed(2)}€`);
}

function handleDeleteLocalSaleInvoice(invoiceId: string, invoiceNumberForDisplay: string): void {
    if (!state.currentManagingBusinessId) return;

    uiUtils.showCustomConfirm(
        `Jeni i sigurt që doni të fshini faturën "${invoiceNumberForDisplay}"? Ky veprim do të kthejë stokun e produkteve.`,
        async () => {
            if (!state.currentManagingBusinessId) return;
            const invoiceIndex = state.localSalesInvoices.findIndex(inv => inv.id === invoiceId);
            if (invoiceIndex === -1) { alert("Fatura nuk u gjet."); return; }
            const invoiceToDelete = state.localSalesInvoices[invoiceIndex];

            invoiceToDelete.items.forEach(item => {
                const product = state.products.find(p => p.id === item.productId);
                if (product) product.stock += item.quantity; 
            });
            await storage.saveProductsToLocalStorage(state.currentManagingBusinessId, state.products);

            state.localSalesInvoices.splice(invoiceIndex, 1);
            await storage.saveLocalSalesInvoicesToLocalStorage(state.currentManagingBusinessId, state.localSalesInvoices);
            renderLocalSalesList();
            uiUtils.showCustomConfirm(`Fatura "${invoiceNumberForDisplay}" u fshi dhe stoku u përditësua.`, () => {});
        }
    );
}
