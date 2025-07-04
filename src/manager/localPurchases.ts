

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as toast from '../core/toast';
import { PurchaseInvoice, PurchaseInvoiceItem, Supplier, Product, Business } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import { showCustomConfirm, generatePrintablePurchaseInvoiceHTML, openPrintPreviewModal } from '../core/ui';
import { setActiveManagerView } from './index'; // Import setActiveManagerView
import { createJournalEntryForPurchase, isDateInClosedPeriod } from './accountingUtils';

let currentPurchaseItems: PurchaseInvoiceItem[] = [];
let currentEditingPurchaseInvoiceId: string | null = null;

export function getCurrentEditingPurchaseInvoiceId(): string | null {
    return currentEditingPurchaseInvoiceId;
}

// --- Internal Helper Function Definitions ---

function renderLocalPurchaseList(tbodyElement: HTMLTableSectionElement | null): void {
    if (!tbodyElement || !state.currentManagingBusinessId) {
        if (tbodyElement) {
            tbodyElement.innerHTML = '<tr><td colspan="7" class="text-center">Nuk ka blerje të regjistruara ose të dhënat e biznesit mungojnë.</td></tr>';
        }
        return;
    }
    tbodyElement.innerHTML = '';

    if (state.purchaseInvoices.length === 0) {
        tbodyElement.innerHTML = '<tr><td colspan="8" class="text-center">Nuk ka blerje të regjistruara. Shtyp "Shto Blerje të Re".</td></tr>';
        return;
    }
    
    const sortedInvoices = [...state.purchaseInvoices].sort((a, b) => b.timestamp - a.timestamp);

    sortedInvoices.forEach(invoice => {
        const tr = document.createElement('tr');
        const supplierName = state.suppliers.find(s => s.id === invoice.supplierId)?.name || 'I Panjohur';
        const paymentStatus = invoice.amountPaid >= invoice.totalAmountWithVAT ? 'E Paguar' : (invoice.amountPaid > 0 ? 'Pjesërisht e Paguar' : 'E Papaguar');
        const isClosed = isDateInClosedPeriod(invoice.invoiceDate);
        tr.innerHTML = `
            <td>${invoice.id}</td>
            <td>${supplierName}</td>
            <td>${invoice.supplierInvoiceNumber}</td>
            <td>${new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${new Date(invoice.receiptDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td class="text-right">${invoice.totalAmountWithVAT.toFixed(2)} €</td>
            <td>${paymentStatus}</td>
            <td>
                <button class="btn btn-info btn-sm view-lp-details-btn" data-invoice-id="${invoice.id}">Detajet</button>
                <button class="btn btn-warning btn-sm edit-lp-btn" data-invoice-id="${invoice.id}" ${isClosed ? 'disabled' : ''}>Modifiko</button>
                <button class="btn btn-danger btn-sm delete-lp-btn" data-invoice-id="${invoice.id}" data-invoice-number="${invoice.id}" ${isClosed ? 'disabled' : ''}>Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.view-lp-details-btn')?.addEventListener('click', () => openLocalPurchaseDetailsModal(invoice.id));
        tr.querySelector<HTMLButtonElement>('.edit-lp-btn')?.addEventListener('click', () => {
            setActiveManagerView('add_local_purchase');
            openLocalPurchaseFormModal(invoice.id);
        });
        tr.querySelector<HTMLButtonElement>('.delete-lp-btn')?.addEventListener('click', () => handleDeletePurchaseInvoice(invoice.id, invoice.id)); // Pass invoice.id as invoiceNumber for display
        tbodyElement.appendChild(tr);
    });
}


function populateLPSupplierSelect(): void {
    if (!dom.lpSupplierSelect) return;
    dom.lpSupplierSelect.innerHTML = '<option value="">-- Zgjidh Furnitorin --</option>';
    state.suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = `${supplier.name} (Kodi: ${supplier.code})`;
        dom.lpSupplierSelect?.appendChild(option);
    });
}

function populateLPProductSelect(): void {
    if (!dom.lpProductSelect) return;
    dom.lpProductSelect.innerHTML = '<option value="">-- Zgjidh Produktin --</option>';
    state.products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (Kodi: ${product.code}) (Stoku: ${product.stock})`;
        dom.lpProductSelect?.appendChild(option);
    });
}


function renderPurchaseItemsTable(): void {
    if (!dom.lpItemsTbody) return;
    dom.lpItemsTbody.innerHTML = '';

    if (currentPurchaseItems.length === 0) {
        dom.lpItemsTbody.innerHTML = '<tr><td colspan="9" class="text-center">Asnjë artikull i shtuar.</td></tr>';
        return;
    }

    currentPurchaseItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.productCode}</td>
            <td>${item.productName}</td>
            <td><input type="number" class="form-control form-control-sm text-right editable-lp-item-field" data-index="${index}" data-field="quantity" value="${item.quantity}" min="0.01" step="any"> ${item.productUnitOfMeasure}</td>
            <td class="text-right"><input type="number" class="form-control form-control-sm text-right editable-lp-item-field" data-index="${index}" data-field="purchasePriceWithoutVAT" value="${item.purchasePriceWithoutVAT.toFixed(2)}" min="0" step="any"></td>
            <td class="text-right"><input type="number" class="form-control form-control-sm text-right editable-lp-item-field" data-index="${index}" data-field="vatRate" value="${item.vatRate}" min="0" step="any"></td>
            <td class="text-right"><input type="number" class="form-control form-control-sm text-right editable-lp-item-field" data-index="${index}" data-field="purchasePriceWithVAT" value="${item.purchasePriceWithVAT.toFixed(2)}" min="0" step="any"></td>
            <td class="text-right" id="lp-row-total-novat-${index}">${item.totalValueWithoutVAT.toFixed(2)}</td>
            <td class="text-right" id="lp-row-total-vat-${index}">${item.totalValueWithVAT.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger btn-sm remove-lp-item-btn" data-index="${index}">Hiqe</button>
            </td>
        `;
        dom.lpItemsTbody?.appendChild(tr);
    });
     updatePurchaseTotals();
}

function updatePurchaseTotals(): void {
    const totalWithoutVAT = currentPurchaseItems.reduce((sum, item) => sum + item.totalValueWithoutVAT, 0);
    const totalVATAmount = currentPurchaseItems.reduce((sum, item) => sum + (item.totalValueWithVAT - item.totalValueWithoutVAT), 0);
    const totalWithVAT = currentPurchaseItems.reduce((sum, item) => sum + item.totalValueWithVAT, 0);

    if (dom.lpTotalWithoutVatElement) dom.lpTotalWithoutVatElement.textContent = `${totalWithoutVAT.toFixed(2)} €`;
    if (dom.lpTotalVatElement) dom.lpTotalVatElement.textContent = `${totalVATAmount.toFixed(2)} €`;
    if (dom.lpTotalWithVatElement) dom.lpTotalWithVatElement.textContent = `${totalWithVAT.toFixed(2)} €`;
}

function handleTableItemInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (!target || !target.classList.contains('editable-lp-item-field')) return;

    const itemIndex = parseInt(target.dataset.index || '-1', 10);
    const field = target.dataset.field as keyof PurchaseInvoiceItem;
    
    if (itemIndex === -1 || !field || !currentPurchaseItems[itemIndex]) {
        return;
    }
    
    const item = currentPurchaseItems[itemIndex];
    let value = parseFloat(target.value);


    if (field === 'quantity') {
        if (target.value === "" || isNaN(value) || value <= 0) {
            item.quantity = 1; 
            target.value = String(item.quantity);
        } else {
            item.quantity = value;
        }
    } else if (field === 'purchasePriceWithoutVAT' || field === 'vatRate' || field === 'purchasePriceWithVAT') {
         if (isNaN(value) || value < 0) { 
            target.value = String(item[field as keyof Pick<PurchaseInvoiceItem, 'purchasePriceWithoutVAT' | 'vatRate' | 'purchasePriceWithVAT'>]); 
            item.purchasePriceWithVAT = parseFloat((item.purchasePriceWithoutVAT * (1 + item.vatRate / 100)).toFixed(2));
        } else {
            (item[field as keyof Pick<PurchaseInvoiceItem, 'purchasePriceWithoutVAT' | 'vatRate' | 'purchasePriceWithVAT'>] as number) = value;
            if (field === 'purchasePriceWithoutVAT' || field === 'vatRate') {
                item.purchasePriceWithVAT = parseFloat((item.purchasePriceWithoutVAT * (1 + item.vatRate / 100)).toFixed(2));
            } else if (field === 'purchasePriceWithVAT') {
                item.purchasePriceWithoutVAT = parseFloat((item.purchasePriceWithVAT / (1 + item.vatRate / 100)).toFixed(2));
            }
        }
    }

    item.totalValueWithoutVAT = parseFloat((item.quantity * item.purchasePriceWithoutVAT).toFixed(2));
    item.totalValueWithVAT = parseFloat((item.quantity * item.purchasePriceWithVAT).toFixed(2));

    const rowElement = target.closest('tr');
    if (rowElement) {
        if (field !== 'purchasePriceWithVAT') {
            const priceWithVatInput = rowElement.querySelector<HTMLInputElement>(`input[data-field="purchasePriceWithVAT"]`);
            if (priceWithVatInput) priceWithVatInput.value = item.purchasePriceWithVAT.toFixed(2);
        }
         if (field !== 'purchasePriceWithoutVAT' && (field === 'purchasePriceWithVAT' || field === 'vatRate')) {
            const priceWithoutVatInput = rowElement.querySelector<HTMLInputElement>(`input[data-field="purchasePriceWithoutVAT"]`);
            if (priceWithoutVatInput) priceWithoutVatInput.value = item.purchasePriceWithoutVAT.toFixed(2);
        }
        
        const totalNoVatCell = document.getElementById(`lp-row-total-novat-${itemIndex}`);
        if (totalNoVatCell) totalNoVatCell.textContent = item.totalValueWithoutVAT.toFixed(2);
        const totalVatCell = document.getElementById(`lp-row-total-vat-${itemIndex}`);
        if (totalVatCell) totalVatCell.textContent = item.totalValueWithVAT.toFixed(2);
    }

    updatePurchaseTotals();
}

function handleLPItemTableKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;

    const target = event.target as HTMLInputElement;
    if (!target || !target.classList.contains('editable-lp-item-field')) return;

    const itemIndexStr = target.dataset.index;
    const currentField = target.dataset.field;

    if (!itemIndexStr || !currentField) return;
    
    const itemIndex = parseInt(itemIndexStr, 10);

    let nextFieldSelector: string | null = null;

    if (currentField === 'quantity') {
        nextFieldSelector = `input[data-index="${itemIndex}"][data-field="purchasePriceWithoutVAT"]`;
    } else if (currentField === 'purchasePriceWithoutVAT') {
        nextFieldSelector = `input[data-index="${itemIndex}"][data-field="vatRate"]`;
    } else if (currentField === 'vatRate') {
        nextFieldSelector = `input[data-index="${itemIndex}"][data-field="purchasePriceWithVAT"]`;
    } else if (currentField === 'purchasePriceWithVAT') {
        // If on the last input of the row, focus the main product select to add a new item
        const productSelect = document.getElementById('lp-product-select') as HTMLSelectElement | null;
        if (productSelect) {
            event.preventDefault();
            productSelect.focus();
            return; // Exit early as we are not focusing another input in the table
        }
    }


    if (nextFieldSelector) {
        event.preventDefault();
        const nextElement = document.querySelector(nextFieldSelector) as HTMLInputElement | null;
        if (nextElement) {
            nextElement.focus();
            nextElement.select();
        }
    }
}


function handleAddItemToLocalPurchaseTable(): void {
    if (!dom.lpProductSelect || !state.currentManagingBusinessId) return;

    const productId = dom.lpProductSelect.value;
    if (!productId) {
        alert("Ju lutem zgjidhni një produkt.");
        return;
    }

    const product = state.products.find(p => p.id === productId);
    if (!product) {
        alert("Produkti i zgjedhur nuk u gjet.");
        return;
    }

    if (currentPurchaseItems.some(item => item.productId === productId)) {
        alert("Ky produkt është shtuar tashmë në faturë. Modifikoni sasinë ose çmimin direkt në tabelë.");
        return;
    }

    const newItem: PurchaseInvoiceItem = {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        productUnitOfMeasure: product.unitOfMeasure,
        productQuantityPerPackage: product.quantityPerPackage,
        quantity: 1, 
        purchasePriceWithoutVAT: product.purchasePrice || 0.00, 
        vatRate: product.vatRate || 18, 
        purchasePriceWithVAT: parseFloat(((product.purchasePrice || 0.00) * (1 + (product.vatRate || 18) / 100)).toFixed(2)),
        totalValueWithoutVAT: parseFloat((1 * (product.purchasePrice || 0.00)).toFixed(2)),
        totalValueWithVAT: parseFloat((1 * ((product.purchasePrice || 0.00) * (1 + (product.vatRate || 18) / 100))).toFixed(2)),
        currentStock: product.stock,
    };
    
    currentPurchaseItems.push(newItem);
    renderPurchaseItemsTable();
    updatePurchaseTotals();

    dom.lpProductSelect.value = ''; 
}


function handleRemoveItemFromPurchaseTable(index: number): void {
    if (index >= 0 && index < currentPurchaseItems.length) {
        currentPurchaseItems.splice(index, 1);
        renderPurchaseItemsTable();
        updatePurchaseTotals();
    }
}

export function initLocalPurchasesEventListeners(): void {
    dom.showAddLocalPurchaseModalBtn?.addEventListener('click', () => {
        setActiveManagerView('add_local_purchase');
        openLocalPurchaseFormModal(); 
    });
    dom.localPurchaseForm?.addEventListener('submit', handleSaveLocalPurchase);
    dom.cancelLocalPurchaseFormBtn?.addEventListener('click', () => {
        currentEditingPurchaseInvoiceId = null;
        setActiveManagerView('local_purchases');
    });
    
    dom.lpAddItemBtn?.addEventListener('click', handleAddItemToLocalPurchaseTable);

    dom.lpItemsTbody?.addEventListener('click', (event) => {
        const target = event.target as HTMLButtonElement;
        if (target && target.classList.contains('remove-lp-item-btn')) {
            const itemIndex = parseInt(target.dataset.index || '-1', 10);
            if (itemIndex !== -1) {
                handleRemoveItemFromPurchaseTable(itemIndex);
            }
        }
    });
    dom.lpItemsTbody?.addEventListener('input', handleTableItemInputChange);
    dom.lpItemsTbody?.addEventListener('keydown', handleLPItemTableKeyDown);


    dom.lpDetailsModalCloseBtn?.addEventListener('click', closeLocalPurchaseDetailsModal);
    dom.lpDetailsCloseModalActionBtn?.addEventListener('click', closeLocalPurchaseDetailsModal);
    dom.lpDetailsPrintInvoiceBtn?.addEventListener('click', handlePrintLocalPurchaseInvoice);
}

export function showLocalPurchaseManagementPanelFromManager(viewName?: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for local purchase panel.");
        return;
    }
    const panel = dom.localPurchaseManagementPanel;
    if (panel) {
        if (!targetContainer.contains(panel)) {
             targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        currentEditingPurchaseInvoiceId = null; 
        const localPurchaseListTbody = panel.querySelector<HTMLTableSectionElement>('#local-purchase-list-tbody');
        renderLocalPurchaseList(localPurchaseListTbody);
    } else {
        targetContainer.innerHTML = '<p class="error-message">Paneli i menaxhimit të blerjeve vendore nuk u gjet.</p>';
    }
}

export function openLocalPurchaseFormModal(purchaseInvoiceIdToEdit?: string): void {
    if (!dom.localPurchaseForm || !dom.localPurchaseFormModalTitle || !dom.editLocalPurchaseIdInput ||
        !dom.lpSupplierSelect || !dom.lpSystemInvoiceNumberInput || !dom.lpSupplierInvoiceNumberInput ||
        !dom.lpInvoiceDateInput || !dom.lpReceiptDateInput || !dom.lpProductSelect ||
        !dom.localPurchaseFormErrorElement) {
        console.error("Disa elemente të formularit të blerjes lokale mungojnë.");
        return;
    }

    dom.localPurchaseForm.reset();
    dom.localPurchaseFormErrorElement.textContent = '';
    currentPurchaseItems = [];
    
    populateLPSupplierSelect();
    populateLPProductSelect();

    const today = getTodayDateString();
    dom.lpInvoiceDateInput.value = today;
    dom.lpReceiptDateInput.value = today;
    
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    const fiscalYear = business ? business.fiscalYear : new Date().getFullYear();
    const seed = business ? business.purchaseInvoiceIdSeed : 1;

    if (purchaseInvoiceIdToEdit) {
        const invoice = state.purchaseInvoices.find(inv => inv.id === purchaseInvoiceIdToEdit);
        if (invoice) {
            currentEditingPurchaseInvoiceId = invoice.id; 
            dom.localPurchaseFormModalTitle.textContent = `Modifiko Blerjen Vendore: ${invoice.id}`;
            dom.editLocalPurchaseIdInput.value = invoice.id;
            dom.lpSystemInvoiceNumberInput.value = invoice.id;
            dom.lpSupplierSelect.value = invoice.supplierId;
            dom.lpSupplierInvoiceNumberInput.value = invoice.supplierInvoiceNumber;
            dom.lpInvoiceDateInput.value = invoice.invoiceDate;
            dom.lpReceiptDateInput.value = invoice.receiptDate;
            currentPurchaseItems = JSON.parse(JSON.stringify(invoice.items)); 

            const isClosed = isDateInClosedPeriod(invoice.invoiceDate);
            if (isClosed) {
                const formElements = Array.from(dom.localPurchaseForm.elements) as (HTMLInputElement | HTMLSelectElement | HTMLButtonElement)[];
                formElements.forEach(el => {
                    if (el.id !== 'cancel-local-purchase-form-btn') {
                        el.disabled = true;
                    }
                });
                if (dom.localPurchaseFormErrorElement) {
                    dom.localPurchaseFormErrorElement.textContent = "Kjo faturë është në një periudhë të mbyllur dhe nuk mund të modifikohet.";
                }
            } else {
                 const formElements = Array.from(dom.localPurchaseForm.elements) as (HTMLInputElement | HTMLSelectElement | HTMLButtonElement)[];
                 formElements.forEach(el => el.disabled = false);
            }
        } else {
            currentEditingPurchaseInvoiceId = null; 
            dom.localPurchaseFormErrorElement.textContent = "Fatura e blerjes nuk u gjet.";
            dom.lpSystemInvoiceNumberInput.value = `BLV-${String(seed).padStart(3, '0')}-${fiscalYear}`;
            dom.localPurchaseFormModalTitle.textContent = "Shto Blerje të Re Vendore";
        }
    } else {
        currentEditingPurchaseInvoiceId = null; 
        dom.localPurchaseFormModalTitle.textContent = "Shto Blerje të Re Vendore";
        dom.editLocalPurchaseIdInput.value = '';
        dom.lpSystemInvoiceNumberInput.value = `BLV-${String(seed).padStart(3, '0')}-${fiscalYear}`;
        const formElements = Array.from(dom.localPurchaseForm.elements) as (HTMLInputElement | HTMLSelectElement | HTMLButtonElement)[];
        formElements.forEach(el => el.disabled = false);
    }
    dom.lpSystemInvoiceNumberInput.readOnly = true;

    renderPurchaseItemsTable();
    updatePurchaseTotals();
}


export async function handleSaveLocalPurchase(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.lpSupplierSelect || !dom.lpSystemInvoiceNumberInput || !dom.lpSupplierInvoiceNumberInput ||
        !dom.lpInvoiceDateInput || !dom.lpReceiptDateInput || !dom.localPurchaseFormErrorElement ||
        !state.currentUser || !state.currentManagingBusinessId) {
        alert("Gabim: Mungojnë elemente të formularit.");
        return;
    }

    const supplierId = dom.lpSupplierSelect.value;
    const systemInvoiceNumberFromInput = dom.lpSystemInvoiceNumberInput.value; 
    const supplierInvoiceNumber = dom.lpSupplierInvoiceNumberInput.value.trim();
    const invoiceDate = dom.lpInvoiceDateInput.value;
    const receiptDate = dom.lpReceiptDateInput.value;

    dom.localPurchaseFormErrorElement.textContent = '';
    
    if (isDateInClosedPeriod(invoiceDate)) {
        dom.localPurchaseFormErrorElement.textContent = `Data e faturës (${new Date(invoiceDate).toLocaleDateString('sq-AL')}) është në një periudhë të mbyllur dhe nuk mund të modifikohet.`;
        return;
    }

    if (!supplierId) {
        dom.localPurchaseFormErrorElement.textContent = "Ju lutem zgjidhni furnitorin.";
        return;
    }
    if (!supplierInvoiceNumber) {
        dom.localPurchaseFormErrorElement.textContent = "Numri i faturës së furnitorit është i detyrueshëm.";
        return;
    }
    if (!invoiceDate) {
        dom.localPurchaseFormErrorElement.textContent = "Data e faturës së furnitorit është e detyrueshme.";
        return;
    }
    if (!receiptDate) {
        dom.localPurchaseFormErrorElement.textContent = "Data e pranimit është e detyrueshme.";
        return;
    }
    if (currentPurchaseItems.length === 0) {
        dom.localPurchaseFormErrorElement.textContent = "Ju lutem shtoni të paktën një artikull në faturë.";
        return;
    }
    
    for (const item of currentPurchaseItems) {
        if (item.quantity == null || isNaN(item.quantity) || item.quantity <= 0) {
            dom.localPurchaseFormErrorElement.textContent = `Sasia për produktin "${item.productName}" duhet të jetë një numër pozitiv dhe më e madhe se zero.`;
            return;
        }
    }

    const supplier = state.suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        toast.showErrorToast("Furnitori i zgjedhur nuk është valid.");
        return;
    }

    const totalAmountWithoutVAT = currentPurchaseItems.reduce((sum, item) => sum + item.totalValueWithoutVAT, 0);
    const totalVATAmount = currentPurchaseItems.reduce((sum, item) => sum + (item.totalValueWithVAT - item.totalValueWithoutVAT), 0);
    const totalAmountWithVAT = currentPurchaseItems.reduce((sum, item) => sum + item.totalValueWithVAT, 0);

    if (currentEditingPurchaseInvoiceId) {
        const invoiceIndex = state.purchaseInvoices.findIndex(inv => inv.id === currentEditingPurchaseInvoiceId);
        if (invoiceIndex > -1) {
            const invoiceToUpdate = state.purchaseInvoices[invoiceIndex];
            
            currentPurchaseItems.forEach(newItem => {
                const product = state.products.find(p => p.id === newItem.productId);
                const oldItem = invoiceToUpdate.items.find(oi => oi.productId === newItem.productId);
                const quantityDifference = newItem.quantity - (oldItem ? oldItem.quantity : 0);
                if (product) {
                    product.stock += quantityDifference;
                }
            });
            invoiceToUpdate.items.forEach(oldItem => {
                if (!currentPurchaseItems.some(ni => ni.productId === oldItem.productId)) {
                    const product = state.products.find(p => p.id === oldItem.productId);
                    if (product) {
                        product.stock -= oldItem.quantity; 
                    }
                }
            });

            invoiceToUpdate.supplierId = supplierId;
            invoiceToUpdate.supplierName = supplier.name;
            invoiceToUpdate.supplierInvoiceNumber = supplierInvoiceNumber;
            invoiceToUpdate.invoiceDate = invoiceDate;
            invoiceToUpdate.receiptDate = receiptDate;
            invoiceToUpdate.items = [...currentPurchaseItems]; 
            invoiceToUpdate.totalAmountWithoutVAT = totalAmountWithoutVAT;
            invoiceToUpdate.totalVATAmount = totalVATAmount;
            invoiceToUpdate.totalAmountWithVAT = totalAmountWithVAT;
            invoiceToUpdate.recordedByManagerId = state.currentUser.id; 
            invoiceToUpdate.recordedByManagerUsername = state.currentUser.username;
            invoiceToUpdate.timestamp = Date.now(); 
        }
    } else {
        const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
        if (!business) {
            alert("Gabim: Biznesi nuk u gjet."); return;
        }
        
        const newInvoice: PurchaseInvoice = {
            id: systemInvoiceNumberFromInput, 
            businessId: state.currentManagingBusinessId,
            supplierId: supplierId,
            supplierName: supplier.name,
            supplierInvoiceNumber: supplierInvoiceNumber,
            invoiceDate: invoiceDate,
            receiptDate: receiptDate,
            items: [...currentPurchaseItems],
            totalAmountWithoutVAT: totalAmountWithoutVAT,
            totalVATAmount: totalVATAmount,
            totalAmountWithVAT: totalAmountWithVAT,
            recordedByManagerId: state.currentUser.id,
            recordedByManagerUsername: state.currentUser.username,
            timestamp: Date.now(),
            amountPaid: 0, 
        };
        state.purchaseInvoices.push(newInvoice);
        business.purchaseInvoiceIdSeed = business.purchaseInvoiceIdSeed + 1; 
        await storage.saveAllBusinesses(state.businesses);
        await createJournalEntryForPurchase(newInvoice);

        currentPurchaseItems.forEach(item => {
            const product = state.products.find(p => p.id === item.productId);
            if (product) {
                product.stock += item.quantity;
            }
        });
    }
    
    await storage.saveProductsToLocalStorage(state.currentManagingBusinessId, state.products);
    await storage.savePurchaseInvoicesToLocalStorage(state.currentManagingBusinessId, state.purchaseInvoices);
    
    const successMessage = `Fatura e blerjes u ruajt me sukses! (${currentEditingPurchaseInvoiceId ? 'Modifikuar' : 'Shtuar'})`;
    showCustomConfirm(successMessage, () => {
        currentEditingPurchaseInvoiceId = null;
        openLocalPurchaseFormModal(); // Reset the form for a new entry
        
        if (typeof (window as any).renderManagerStockOverview === 'function') (window as any).renderManagerStockOverview();
        if (typeof (window as any).renderManagerSupplierBalances === 'function') (window as any).renderManagerSupplierBalances();
        if (dom.managerContentSupplierLedger?.style.display === 'block' && typeof (window as any).refreshSupplierLedger === 'function') {
           (window as any).refreshSupplierLedger();
        }
    });
}


function openLocalPurchaseDetailsModal(invoiceId: string): void {
    if (!dom.localPurchaseDetailsModal || !dom.lpDetailsSupplierName || !dom.lpDetailsSystemInvoiceNumber ||
        !dom.lpDetailsSupplierInvoiceNumber || !dom.lpDetailsInvoiceDate || !dom.lpDetailsReceiptDate ||
        !dom.lpDetailsItemsTbody || !dom.lpDetailsTotalWithoutVat || !dom.lpDetailsTotalVat ||
        !dom.lpDetailsTotalWithVat || !dom.lpDetailsPrintInvoiceBtn || !dom.lpDetailsPaymentStatus || !dom.lpDetailsAmountPaid ) return;

    const invoice = state.purchaseInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        toast.showErrorToast("Fatura e blerjes nuk u gjet.");
        return;
    }

    dom.lpDetailsSupplierName.textContent = invoice.supplierName;
    dom.lpDetailsSystemInvoiceNumber.textContent = invoice.id;
    dom.lpDetailsSupplierInvoiceNumber.textContent = invoice.supplierInvoiceNumber;
    dom.lpDetailsInvoiceDate.textContent = new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('sq-AL');
    dom.lpDetailsReceiptDate.textContent = new Date(invoice.receiptDate + 'T00:00:00').toLocaleDateString('sq-AL');
    
    const amountPaid = invoice.amountPaid || 0;
    dom.lpDetailsAmountPaid.textContent = `${amountPaid.toFixed(2)} €`;
    if (amountPaid >= invoice.totalAmountWithVAT) {
        dom.lpDetailsPaymentStatus.textContent = "E Paguar";
        dom.lpDetailsPaymentStatus.className = 'status-badge active';
    } else if (amountPaid > 0) {
        dom.lpDetailsPaymentStatus.textContent = "Pjesërisht e Paguar";
        dom.lpDetailsPaymentStatus.className = 'status-badge warning'; 
    } else {
        dom.lpDetailsPaymentStatus.textContent = "E Papaguar";
        dom.lpDetailsPaymentStatus.className = 'status-badge inactive';
    }


    dom.lpDetailsItemsTbody.innerHTML = '';
    invoice.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.productCode}</td>
            <td>${item.productName}</td>
            <td>${item.quantity} ${item.productUnitOfMeasure}</td>
            <td class="text-right">${item.purchasePriceWithoutVAT.toFixed(2)}</td>
            <td class="text-right">${item.vatRate.toFixed(2)}%</td>
            <td class="text-right">${item.purchasePriceWithVAT.toFixed(2)}</td>
            <td class="text-right">${item.totalValueWithoutVAT.toFixed(2)}</td>
            <td class="text-right">${item.totalValueWithVAT.toFixed(2)}</td>
        `;
        dom.lpDetailsItemsTbody.appendChild(tr);
    });

    dom.lpDetailsTotalWithoutVat.textContent = `${invoice.totalAmountWithoutVAT.toFixed(2)} €`;
    dom.lpDetailsTotalVat.textContent = `${invoice.totalVATAmount.toFixed(2)} €`;
    dom.lpDetailsTotalWithVat.textContent = `${invoice.totalAmountWithVAT.toFixed(2)} €`;
    
    dom.lpDetailsPrintInvoiceBtn.dataset.invoiceId = invoice.id;
    dom.localPurchaseDetailsModal.style.display = 'block';
}

function closeLocalPurchaseDetailsModal(): void {
    if (dom.localPurchaseDetailsModal) dom.localPurchaseDetailsModal.style.display = 'none';
}

function handlePrintLocalPurchaseInvoice(event: Event): void {
    const button = event.target as HTMLButtonElement;
    const invoiceId = button.dataset.invoiceId;
    if (!invoiceId) return;

    const invoice = state.purchaseInvoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
        alert("Fatura nuk u gjet për printim.");
        return;
    }
    
    const invoiceHtml = generatePrintablePurchaseInvoiceHTML(invoice, state.businessDetails);
    if (dom.printPreviewModalTitle) dom.printPreviewModalTitle.textContent = `Faturë Blerje: ${invoice.id}`;
    if (dom.printPreviewContent) dom.printPreviewContent.innerHTML = invoiceHtml;
    openPrintPreviewModal();
}

function handleDeletePurchaseInvoice(invoiceId: string, invoiceNumberForDisplay: string): void {
    if (!state.currentManagingBusinessId) return;

    const invoiceToDelete = state.purchaseInvoices.find(inv => inv.id === invoiceId);
    if (!invoiceToDelete) {
        toast.showErrorToast("Fatura nuk u gjet për fshirje.");
        return;
    }

    if (isDateInClosedPeriod(invoiceToDelete.invoiceDate)) {
        toast.showErrorToast(`Fatura "${invoiceNumberForDisplay}" është në një periudhë të mbyllur dhe nuk mund të fshihet.`);
        return;
    }


    showCustomConfirm(
        `Jeni i sigurt që doni të fshini faturën e blerjes "${invoiceNumberForDisplay}"? Ky veprim do të ndikojë edhe stokun e produkteve (duke e zvogëluar). Ky veprim nuk mund të kthehet.`,
        async () => {
            if (!state.currentManagingBusinessId) return;
            const invoiceIndex = state.purchaseInvoices.findIndex(inv => inv.id === invoiceId);
            if (invoiceIndex === -1) {
                alert("Fatura nuk u gjet.");
                return;
            }
            const invoiceToDelete = state.purchaseInvoices[invoiceIndex];

            invoiceToDelete.items.forEach(item => {
                const product = state.products.find(p => p.id === item.productId);
                if (product) {
                    product.stock -= item.quantity;
                }
            });
            await storage.saveProductsToLocalStorage(state.currentManagingBusinessId, state.products);

            state.purchaseInvoices.splice(invoiceIndex, 1);
            await storage.savePurchaseInvoicesToLocalStorage(state.currentManagingBusinessId, state.purchaseInvoices);
            
            state.outgoingPayments.forEach(payment => {
                const initialAllocationCount = payment.allocations.length;
                payment.allocations = payment.allocations.filter(alloc => alloc.purchaseInvoiceId !== invoiceId);
                if (payment.allocations.length < initialAllocationCount) {
                    console.log(`Removed allocation from payment ${payment.id} for deleted purchase invoice ${invoiceId}`);
                }
            });
            await storage.saveOutgoingPaymentsToLocalStorage(state.currentManagingBusinessId, state.outgoingPayments);

            renderLocalPurchaseList(dom.localPurchaseListTbody);
            alert(`Fatura e blerjes "${invoiceNumberForDisplay}" u fshi me sukses dhe stoku u përditësua.`);
        }
    );
}
