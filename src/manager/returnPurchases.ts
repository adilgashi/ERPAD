

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { ReturnPurchaseInvoice, ReturnPurchaseInvoiceItem, Supplier, Product, Business, PurchaseInvoice, PurchaseInvoiceItem } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import * as uiUtils from '../core/ui'; 
import { setActiveManagerView } from './index';
import { createJournalEntryForPurchaseReturn } from './accountingUtils';

interface TempReturnItemUI {
    productId: string;
    productCode: string;
    productName: string;
    productUnitOfMeasure: string;
    originalQuantity: number;
    returnQuantity: number; 
    returnPriceWithoutVAT: number;
    vatRate: number;
    returnPriceWithVAT: number;
    totalReturnValueWithVAT: number;
}


let currentReturnPurchaseItems: TempReturnItemUI[] = [];
let currentEditingReturnPurchaseInvoiceId: string | null = null;
let originalPurchaseForReturnCache: PurchaseInvoice | null = null;
let selectedSupplierIdForReturnPurchase: string | null = null;


// --- Event Listeners and Initial Setup ---

export function initReturnPurchasesEventListeners(): void {
    const formContainer = dom.managerContentAddReturnPurchase;
    formContainer?.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        if (target.matches('#save-return-purchase-btn')) {
            handleSaveReturnPurchase(event);
        } else if (target.matches('#cancel-return-purchase-form-btn')) {
            currentEditingReturnPurchaseInvoiceId = null;
            resetReturnPurchaseFormState();
            setActiveManagerView('return_purchases_list');
        }
    });
    formContainer?.querySelector('#return-purchase-form')?.addEventListener('submit', handleSaveReturnPurchase);
    formContainer?.querySelector('#rp-supplier-select')?.addEventListener('change', handleSupplierSelectionChange);
    formContainer?.querySelector('#rp-items-tbody')?.addEventListener('input', handleReturnTableItemInputChange);
    
    const listContainer = dom.returnPurchaseManagementPanel;
    listContainer?.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const viewButton = target.closest<HTMLButtonElement>('.view-rp-details-btn');
        const editButton = target.closest<HTMLButtonElement>('.edit-rp-btn');
        const deleteButton = target.closest<HTMLButtonElement>('.delete-rp-btn');

        if (viewButton) {
            const invoiceId = viewButton.dataset.invoiceId;
            if (invoiceId) openReturnPurchaseDetailsModal(invoiceId);
        } else if (editButton) {
            const invoiceId = editButton.dataset.invoiceId;
            if (invoiceId) {
                openReturnPurchaseFormModal(invoiceId);
                setActiveManagerView('add_return_purchase', `Modifiko Kthimin ${invoiceId}`);
            }
        } else if (deleteButton) {
            const invoiceId = deleteButton.dataset.invoiceId;
            const invoiceNumber = deleteButton.dataset.invoiceNumber;
            if (invoiceId && invoiceNumber) {
                handleDeleteReturnPurchaseInvoice(invoiceId, invoiceNumber);
            }
        }
    });

    dom.rpDetailsModalCloseBtn?.addEventListener('click', closeReturnPurchaseDetailsModal);
    dom.rpDetailsCloseModalActionBtn?.addEventListener('click', closeReturnPurchaseDetailsModal);
    dom.rpDetailsPrintInvoiceBtn?.addEventListener('click', handlePrintReturnPurchaseInvoice);
}

function resetReturnPurchaseFormState(): void {
    originalPurchaseForReturnCache = null;
    currentReturnPurchaseItems = [];
    selectedSupplierIdForReturnPurchase = null;
    if (dom.rpSupplierSelect) dom.rpSupplierSelect.value = '';
    const rpSupplierPurchasesListContainer = document.getElementById('rp-supplier-purchases-list-container') as HTMLDivElement | null;
    if (rpSupplierPurchasesListContainer) {
        rpSupplierPurchasesListContainer.innerHTML = '<p class="info-message secondary text-center">Zgjidhni një furnitor për të parë historikun e blerjeve.</p>';
        rpSupplierPurchasesListContainer.style.display = 'none';
    }
    const rpOriginalPurchaseDetails = document.getElementById('rp-original-purchase-details') as HTMLDivElement | null;
    if (rpOriginalPurchaseDetails) {
        rpOriginalPurchaseDetails.innerHTML = '';
        rpOriginalPurchaseDetails.style.display = 'none';
    }
    if (dom.rpItemsTbody) dom.rpItemsTbody.innerHTML = '<tr><td colspan="8" class="text-center">Zgjidhni një furnitor dhe pastaj një faturë blerjeje për të parë artikujt.</td></tr>';
    updateReturnTotals();
}

export function showReturnPurchaseManagementPanelFromManager(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Return Purchase panel.");
        return;
    }
    const panel = dom.returnPurchaseManagementPanel;
    if (panel) {
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        const tbody = panel.querySelector('#return-purchase-list-tbody');
        renderReturnPurchaseList(tbody as HTMLTableSectionElement);
        const addButton = panel.querySelector('#show-add-return-purchase-form-btn');
        addButton?.removeEventListener('click', openReturnPurchaseFormForNew);
        addButton?.addEventListener('click', openReturnPurchaseFormForNew);
    } else {
        targetContainer.innerHTML = '<p class="error-message">Paneli i menaxhimit të kthimeve të blerjeve nuk u gjet.</p>';
    }
}

function openReturnPurchaseFormForNew() {
    openReturnPurchaseFormModal();
    setActiveManagerView('add_return_purchase', 'Shto Kthim Blerjeje');
}

export function openReturnPurchaseFormModal(returnPurchaseIdToEdit?: string): void {
    const container = dom.managerContentAddReturnPurchase;
    if (!container) return;

    resetReturnPurchaseFormState();
    currentEditingReturnPurchaseInvoiceId = returnPurchaseIdToEdit || null;
    
    const formTitle = container.querySelector('#return-purchase-form-title') as HTMLHeadingElement;
    const form = container.querySelector('#return-purchase-form') as HTMLFormElement;
    const editIdInput = container.querySelector('#edit-return-purchase-id') as HTMLInputElement;
    const systemIdInput = container.querySelector('#rp-system-invoice-number') as HTMLInputElement;
    const supplierSelect = container.querySelector('#rp-supplier-select') as HTMLSelectElement;
    const returnDateInput = container.querySelector('#rp-invoice-date') as HTMLInputElement;
    const supplierInvoiceInput = container.querySelector('#rp-supplier-invoice-number') as HTMLInputElement;
    const reasonInput = container.querySelector('#rp-reason') as HTMLInputElement;
    
    if(!formTitle || !form || !editIdInput || !systemIdInput || !supplierSelect || !returnDateInput || !supplierInvoiceInput) return;
    
    form.reset();
    if(returnDateInput) returnDateInput.value = getTodayDateString();
    
    populateRPSupplierSelect();

    if(returnPurchaseIdToEdit) {
        // Edit logic would go here
    } else {
        formTitle.textContent = "Shto Kthim të Ri Blerjeje";
        const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
        const seed = business?.returnPurchaseInvoiceIdSeed || 1;
        const fiscalYear = business?.fiscalYear || new Date().getFullYear();
        systemIdInput.value = `KTHBL-${String(seed).padStart(3, '0')}-${fiscalYear}`;
    }
}

function renderReturnPurchaseList(tbodyElement: HTMLTableSectionElement | null): void {
    if (!tbodyElement || !state.currentManagingBusinessId) return;
    tbodyElement.innerHTML = '';
    const sortedInvoices = [...state.returnPurchaseInvoices].sort((a, b) => b.timestamp - a.timestamp);

    if (sortedInvoices.length === 0) {
        tbodyElement.innerHTML = '<tr><td colspan="6" class="text-center">Nuk ka kthime blerjesh të regjistruara.</td></tr>';
        return;
    }
    sortedInvoices.forEach(invoice => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${invoice.id}</td>
            <td>${invoice.supplierName}</td>
            <td>${invoice.supplierInvoiceNumber || '-'}</td>
            <td>${new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td class="text-right">${invoice.totalReturnAmountWithVAT.toFixed(2)} €</td>
            <td>
                <button class="btn btn-info btn-sm view-rp-details-btn" data-invoice-id="${invoice.id}">Detajet</button>
            </td>
        `;
        tbodyElement.appendChild(tr);
    });
}

function populateRPSupplierSelect(): void {
    const select = dom.rpSupplierSelect;
    if (!select) return;
    select.innerHTML = '<option value="">-- Zgjidh Furnitorin --</option>';
    state.suppliers.sort((a,b) => a.name.localeCompare(b.name)).forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = `${supplier.name} (Kodi: ${supplier.code})`;
        select.appendChild(option);
    });
}

function handleSupplierSelectionChange(): void {
    resetReturnPurchaseFormState();
    selectedSupplierIdForReturnPurchase = dom.rpSupplierSelect?.value || null;
    if (selectedSupplierIdForReturnPurchase) {
        displayPurchasesForSelectedSupplier(selectedSupplierIdForReturnPurchase);
    }
}

function displayPurchasesForSelectedSupplier(supplierId: string) {
    const container = document.getElementById('rp-supplier-purchases-list-container') as HTMLDivElement | null;
    if (!container) return;
    container.innerHTML = '';
    container.style.display = 'block';

    const purchases = state.purchaseInvoices.filter(inv => inv.supplierId === supplierId)
        .sort((a, b) => b.timestamp - a.timestamp);

    if (purchases.length === 0) {
        container.innerHTML = '<p class="info-message secondary text-center">Ky furnitor nuk ka fatura blerjeje të regjistruara.</p>';
        return;
    }

    const listTitle = document.createElement('h4');
    listTitle.style.marginTop = '0';
    listTitle.textContent = 'Zgjidh një Blerje për Kthim:';
    container.appendChild(listTitle);

    const ul = document.createElement('ul');
    ul.className = 'list-group';
    purchases.forEach(purchase => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.style.padding = '0.5rem 0.75rem';
        li.style.borderBottom = '1px dashed #eee';
        
        const purchaseInfo = document.createElement('span');
        purchaseInfo.style.flexGrow = "1";
        purchaseInfo.style.marginRight = "10px";
        purchaseInfo.innerHTML = `Nr. Furnitori: <strong>${purchase.supplierInvoiceNumber}</strong>&nbsp;|&nbsp;Data: ${new Date(purchase.invoiceDate + "T00:00:00").toLocaleDateString('sq-AL')}&nbsp;|&nbsp;Totali: ${purchase.totalAmountWithVAT.toFixed(2)} €`;

        const selectBtn = document.createElement('button');
        selectBtn.type = 'button';
        selectBtn.className = 'btn btn-sm btn-outline-primary';
        selectBtn.textContent = 'Zgjidh';
        selectBtn.addEventListener('click', () => loadOriginalPurchaseAndPopulateItems(purchase.id));

        li.appendChild(purchaseInfo);
        li.appendChild(selectBtn);
        ul.appendChild(li);
    });
    container.appendChild(ul);
}

function loadOriginalPurchaseAndPopulateItems(purchaseId: string): void {
    const purchase = state.purchaseInvoices.find(inv => inv.id === purchaseId);
    if (!purchase) {
        alert("Fatura e blerjes nuk u gjet.");
        return;
    }
    originalPurchaseForReturnCache = purchase;
    displayOriginalPurchaseDetails(purchase);
    populateReturnPurchaseItemsTable(purchase.items);
}

function displayOriginalPurchaseDetails(purchase: PurchaseInvoice): void {
    const container = document.getElementById('rp-original-purchase-details') as HTMLDivElement | null;
    if (!container) return;
    container.style.display = 'block';
    container.innerHTML = `
        <p><strong>Faturë Blerje Origjinale:</strong> ${purchase.supplierInvoiceNumber} (Sistem: ${purchase.id})</p>
        <p><strong>Data e Blerjes:</strong> ${new Date(purchase.invoiceDate + "T00:00:00").toLocaleDateString('sq-AL')}</p>
    `;
    const supplierInvoiceInput = document.getElementById('rp-supplier-invoice-number') as HTMLInputElement | null;
    if (supplierInvoiceInput) supplierInvoiceInput.value = purchase.supplierInvoiceNumber;
}

function populateReturnPurchaseItemsTable(originalItems: PurchaseInvoiceItem[]): void {
    const tbody = dom.rpItemsTbody;
    if (!tbody) return;
    tbody.innerHTML = '';
    currentReturnPurchaseItems = [];

    if (originalItems.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Kjo faturë nuk ka artikuj.</td></tr>';
        updateReturnTotals();
        return;
    }

    originalItems.forEach((item, index) => {
        currentReturnPurchaseItems.push({
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            productUnitOfMeasure: item.productUnitOfMeasure,
            originalQuantity: item.quantity,
            returnQuantity: 0,
            returnPriceWithoutVAT: item.purchasePriceWithoutVAT,
            vatRate: item.vatRate,
            returnPriceWithVAT: item.purchasePriceWithVAT,
            totalReturnValueWithVAT: 0
        });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.productCode}</td>
            <td>${item.productName}</td>
            <td class="text-right">${item.quantity} ${item.productUnitOfMeasure}</td>
            <td><input type="number" class="form-control form-control-sm text-right rp-return-quantity-input" value="0" min="0" max="${item.quantity}" data-index="${index}" step="any"></td>
            <td class="text-right">${item.purchasePriceWithoutVAT.toFixed(2)}</td>
            <td class="text-right">${item.vatRate.toFixed(2)}%</td>
            <td class="text-right">${item.purchasePriceWithVAT.toFixed(2)}</td>
            <td class="text-right rp-row-total-value">0.00</td>
        `;
        tbody.appendChild(tr);
    });
    updateReturnTotals();
}

function handleReturnTableItemInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input || !input.classList.contains('rp-return-quantity-input')) return;
    
    const index = parseInt(input.dataset.index || '-1', 10);
    if (index < 0 || index >= currentReturnPurchaseItems.length) return;

    let returnQty = parseFloat(input.value) || 0;
    const item = currentReturnPurchaseItems[index];

    if (returnQty < 0) returnQty = 0;
    if (returnQty > item.originalQuantity) returnQty = item.originalQuantity;

    input.value = String(returnQty);
    item.returnQuantity = returnQty;
    item.totalReturnValueWithVAT = returnQty * item.returnPriceWithVAT;

    const row = input.closest('tr');
    const totalCell = row?.querySelector('.rp-row-total-value');
    if (totalCell) totalCell.textContent = item.totalReturnValueWithVAT.toFixed(2);

    updateReturnTotals();
}

function updateReturnTotals(): void {
    const total = currentReturnPurchaseItems.reduce((sum, item) => sum + item.totalReturnValueWithVAT, 0);
    const totalEl = document.getElementById('rp-summary-grand-total-with-vat');
    if (totalEl) totalEl.innerHTML = `<strong>${total.toFixed(2)} €</strong>`;
}

async function handleSaveReturnPurchase(event: Event): Promise<void> {
    event.preventDefault();
    if (!state.currentManagingBusinessId || !state.currentUser) return;
    const errorEl = dom.returnPurchaseFormErrorElement;
    if (errorEl) errorEl.textContent = '';
    
    const itemsToReturn = currentReturnPurchaseItems.filter(item => item.returnQuantity > 0);
    if (itemsToReturn.length === 0) {
        if (errorEl) errorEl.textContent = "Nuk keni zgjedhur asnjë artikull për kthim.";
        return;
    }

    const supplierId = selectedSupplierIdForReturnPurchase;
    const supplier = state.suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        if (errorEl) errorEl.textContent = "Furnitori nuk është i vlefshëm.";
        return;
    }
    
    const invoiceDate = (dom.rpInvoiceDateInput?.value) || getTodayDateString();
    
    let totalReturnAmountWithVAT = 0;
    const finalItems: ReturnPurchaseInvoiceItem[] = itemsToReturn.map(item => {
        totalReturnAmountWithVAT += item.totalReturnValueWithVAT;
        return {
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            quantity: item.returnQuantity,
            returnPriceWithoutVAT: item.returnPriceWithoutVAT,
            vatRate: item.vatRate
        };
    });

    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId)!;
    const newInvoiceId = `KTHBL-${String(business.returnPurchaseInvoiceIdSeed).padStart(3, '0')}-${business.fiscalYear}`;

    const newInvoice: ReturnPurchaseInvoice = {
        id: newInvoiceId,
        businessId: state.currentManagingBusinessId,
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierInvoiceNumber: originalPurchaseForReturnCache?.supplierInvoiceNumber,
        invoiceDate,
        items: finalItems,
        totalReturnAmountWithVAT: totalReturnAmountWithVAT,
        recordedByManagerId: state.currentUser.id,
        recordedByManagerUsername: state.currentUser.username,
        timestamp: Date.now()
    };
    
    state.returnPurchaseInvoices.push(newInvoice);
    business.returnPurchaseInvoiceIdSeed = (business.returnPurchaseInvoiceIdSeed || 1) + 1;
    await storage.saveAllBusinesses(state.businesses);
    await storage.saveReturnPurchaseInvoices(state.currentManagingBusinessId, state.returnPurchaseInvoices);
    await createJournalEntryForPurchaseReturn(newInvoice);

    // Update stock
    finalItems.forEach(item => {
        const product = state.products.find(p => p.id === item.productId);
        if (product) product.stock -= item.quantity;
    });
    await storage.saveProducts(state.currentManagingBusinessId, state.products);

    uiUtils.showCustomConfirm(`Kthimi i blerjes ${newInvoice.id} u regjistrua me sukses. Stoku u përditësua.`, () => {
        setActiveManagerView('return_purchases_list');
    });
}

function handleDeleteReturnPurchaseInvoice(invoiceId: string, invoiceNumberForDisplay: string) {
    uiUtils.showCustomConfirm(`Jeni i sigurt që doni të fshini faturën e kthimit "${invoiceNumberForDisplay}"? Ky veprim do të shtojë stokun e kthyer mbrapsht.`, async () => {
        if (!state.currentManagingBusinessId) return;
        const invoiceIndex = state.returnPurchaseInvoices.findIndex(inv => inv.id === invoiceId);
        if (invoiceIndex < 0) return;

        const invoiceToDelete = state.returnPurchaseInvoices[invoiceIndex];
        invoiceToDelete.items.forEach(item => {
            const product = state.products.find(p => p.id === item.productId);
            if(product) product.stock += item.quantity;
        });

        state.returnPurchaseInvoices.splice(invoiceIndex, 1);
        await storage.saveReturnPurchaseInvoices(state.currentManagingBusinessId, state.returnPurchaseInvoices);
        await storage.saveProducts(state.currentManagingBusinessId, state.products);

        renderReturnPurchaseList(dom.returnPurchaseManagementPanel?.querySelector('#return-purchase-list-tbody') as HTMLTableSectionElement);
        alert(`Fatura e kthimit "${invoiceNumberForDisplay}" u fshi dhe stoku u përditësua.`);
    });
}

function openReturnPurchaseDetailsModal(invoiceId: string) {
    if (!dom.returnPurchaseDetailsModal || !dom.rpDetailsSupplierName || !dom.rpDetailsSystemInvoiceNumber ||
        !dom.rpDetailsSupplierInvoiceNumber || !dom.rpDetailsInvoiceDate || !dom.rpDetailsItemsTbody ||
        !dom.rpDetailsTotalWithVat || !dom.rpDetailsPrintInvoiceBtn) return;

    const invoice = state.returnPurchaseInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) { alert("Fatura e kthimit nuk u gjet."); return; }

    dom.rpDetailsSupplierName.textContent = invoice.supplierName;
    dom.rpDetailsSystemInvoiceNumber.textContent = invoice.id;
    dom.rpDetailsSupplierInvoiceNumber.textContent = invoice.supplierInvoiceNumber || '-';
    dom.rpDetailsInvoiceDate.textContent = new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('sq-AL');
    if (dom.rpDetailsReason) dom.rpDetailsReason.textContent = (invoice as any).reason || '-'; // Assuming reason might exist

    dom.rpDetailsItemsTbody.innerHTML = '';
    invoice.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.productCode}</td>
            <td>${item.productName}</td>
            <td class="text-right">${item.quantity}</td>
            <td class="text-right">${item.returnPriceWithoutVAT.toFixed(2)}</td>
            <td class="text-right">${(item.returnPriceWithoutVAT * item.quantity).toFixed(2)}</td>
        `;
        dom.rpDetailsItemsTbody.appendChild(tr);
    });

    dom.rpDetailsTotalWithVat.textContent = `${invoice.totalReturnAmountWithVAT.toFixed(2)} €`;
    dom.rpDetailsPrintInvoiceBtn.dataset.invoiceId = invoice.id;
    dom.returnPurchaseDetailsModal.style.display = 'block';
    uiUtils.showPageBlurOverlay();
}

function closeReturnPurchaseDetailsModal() {
    if (dom.returnPurchaseDetailsModal) {
        dom.returnPurchaseDetailsModal.style.display = 'none';
        uiUtils.hidePageBlurOverlay();
    }
}

function handlePrintReturnPurchaseInvoice(event: Event) {
    const button = event.target as HTMLButtonElement;
    const invoiceId = button.dataset.invoiceId;
    if (!invoiceId) return;

    const invoice = state.returnPurchaseInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) { alert("Fatura nuk u gjet për printim."); return; }

    // Placeholder for actual print HTML generation
    const printContent = `<h1>Kthim Blerje: ${invoice.id}</h1><p>Furnitori: ${invoice.supplierName}</p><p>Totali: ${invoice.totalReturnAmountWithVAT.toFixed(2)} €</p>`;
    
    if (dom.printPreviewContent && dom.printPreviewModalTitle) {
        dom.printPreviewContent.innerHTML = printContent;
        dom.printPreviewModalTitle.textContent = `Printo Kthim Blerje: ${invoice.id}`;
        uiUtils.openPrintPreviewModal();
    }
}
