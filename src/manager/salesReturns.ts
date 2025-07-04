

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { SaleRecord, SaleItem, Business, Product, SalesReturnInvoice, SalesReturnInvoiceItem, Customer, LocalSaleInvoice, LocalSaleInvoiceItem } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import { setActiveManagerView } from './index';
import * as uiUtils from '../core/ui';
import { createJournalEntryForSalesReturn } from './accountingUtils';

let originalSaleCache: SaleRecord | LocalSaleInvoice | null = null;
let currentReturnItems: { 
    productId: string, 
    name: string, 
    originalQuantity: number, 
    returnQuantity: number, 
    unitPriceWithVAT: number, 
    unitPriceWithoutVAT: number,
    vatRate: number,
    isDealItem?: boolean, 
    originalItemType?: 'pos' | 'local' 
}[] = [];
let currentEditingSalesReturnInvoiceId: string | null = null;
let selectedCustomerIdForReturn: string | null = null;

export function initSalesReturnsEventListeners(): void {
    dom.srCustomerSearchInput?.addEventListener('input', handleSalesReturnCustomerSearch);
    dom.srCustomerSearchInput?.addEventListener('focus', () => {
        if (dom.srCustomerSearchInput && dom.srCustomerSearchInput.value.trim().length > 0) {
            handleSalesReturnCustomerSearch(); 
        }
    });
    document.addEventListener('click', handleClickOutsideSalesReturnCustomerDropdown);


    dom.salesReturnForm?.addEventListener('submit', handleSaveSalesReturn); 

    dom.cancelSalesReturnFormBtn?.addEventListener('click', () => {
        currentEditingSalesReturnInvoiceId = null;
        resetSalesReturnFormState();
        setActiveManagerView('sales_returns_list');
    });

    dom.srItemsToReturnTbody?.addEventListener('input', (event) => {
        const target = event.target as HTMLInputElement;
        if (target && target.type === 'number' && target.classList.contains('sr-return-quantity-input')) {
            handleReturnQuantityChange(event);
        }
    });
    
    const addButton = document.getElementById('btn-add-new-sales-return');
    addButton?.removeEventListener('click', openSalesReturnFormForNew); 
    addButton?.addEventListener('click', openSalesReturnFormForNew);

    // Event listeners for Details Modal
    dom.srDetailsModalCloseBtn?.addEventListener('click', closeSalesReturnDetailsModal);
    dom.srDetailsCloseModalActionBtn?.addEventListener('click', closeSalesReturnDetailsModal);
    dom.srDetailsPrintInvoiceBtn?.addEventListener('click', handlePrintSalesReturnInvoice);


    // Event delegation for Details and Delete buttons in the list
    dom.salesReturnsListTbody?.addEventListener('click', (event) => {
        const target = event.target as HTMLElement;
        const viewButton = target.closest<HTMLButtonElement>('.view-sr-details-btn');
        const deleteButton = target.closest<HTMLButtonElement>('.delete-sr-btn');

        if (viewButton) {
            const returnId = viewButton.dataset.returnId;
            if (returnId) {
                openSalesReturnDetailsModal(returnId);
            }
        } else if (deleteButton) {
            const returnId = deleteButton.dataset.returnId;
            const displayId = deleteButton.dataset.displayId || returnId;
            if (returnId && displayId) {
                handleDeleteSalesReturnInvoice(returnId, displayId);
            }
        }
    });
}

function openSalesReturnFormForNew() {
    currentEditingSalesReturnInvoiceId = null;
    resetSalesReturnFormState();
    openSalesReturnFormUI(); // This will call generateSystemReturnInvoiceNumber
    setActiveManagerView('add_sales_return');
}


function resetSalesReturnFormState(): void {
    originalSaleCache = null;
    currentReturnItems = [];
    selectedCustomerIdForReturn = null;
    if (dom.srCustomerSearchInput) dom.srCustomerSearchInput.value = '';
    if (dom.srCustomerDropdownPanel) dom.srCustomerDropdownPanel.style.display = 'none';
    if (dom.srCustomerSalesListContainer) {
        dom.srCustomerSalesListContainer.innerHTML = '<p class="info-message secondary text-center">Zgjidhni një blerës për të parë historikun e shitjeve.</p>';
        dom.srCustomerSalesListContainer.style.display = 'none';
    }
    if (dom.srOriginalSaleDetailsDiv) {
        dom.srOriginalSaleDetailsDiv.innerHTML = '';
        dom.srOriginalSaleDetailsDiv.style.display = 'none';
    }
    if (dom.srItemsToReturnTbody) dom.srItemsToReturnTbody.innerHTML = '<tr><td colspan="7" class="text-center">Zgjidhni një blerës dhe pastaj një faturë për të parë artikujt.</td></tr>';
    updateReturnTotalsUI();
}


export function openSalesReturnFormUI(salesReturnIdToEdit?: string): void { 
    resetSalesReturnFormState(); 
    currentEditingSalesReturnInvoiceId = salesReturnIdToEdit || null;

    if (dom.salesReturnFormTitle) dom.salesReturnFormTitle.textContent = salesReturnIdToEdit ? "Modifiko Kthimin e Shitjes" : "Shto Kthim të Ri Shitjeje";
    if (dom.editSalesReturnIdInput) dom.editSalesReturnIdInput.value = salesReturnIdToEdit || '';
    if (dom.srReturnDateInput) dom.srReturnDateInput.value = getTodayDateString();
    if (dom.srCustomerSearchInput) dom.srCustomerSearchInput.placeholder = "Kërko Blerësin (Emri, Kodi)...";
    if (dom.srReasonInput) dom.srReasonInput.value = '';
    if (dom.salesReturnFormErrorElement) dom.salesReturnFormErrorElement.textContent = '';
    
    if (salesReturnIdToEdit) {
        const invoice = state.salesReturnInvoices.find(inv => inv.id === salesReturnIdToEdit);
        if (invoice) {
            if (dom.srSystemInvoiceNumberInput) dom.srSystemInvoiceNumberInput.value = invoice.id;
            if (dom.srReturnDateInput) dom.srReturnDateInput.value = invoice.returnDate;
            if (dom.srReasonInput) dom.srReasonInput.value = invoice.reason || '';
            
            selectedCustomerIdForReturn = invoice.customerId || null;
            const customer = selectedCustomerIdForReturn ? state.customers.find(c => c.id === selectedCustomerIdForReturn) : null;
            if (dom.srCustomerSearchInput && customer) dom.srCustomerSearchInput.value = `${customer.name} (${customer.code})`;
            else if (dom.srCustomerSearchInput && !customer && invoice.customerName) dom.srCustomerSearchInput.value = invoice.customerName; 
            
            // If editing, load original sale and populate items. If returnedItems exist, they will be used.
            loadOriginalSaleAndPopulateItems(invoice.originalSaleInvoiceNumber, invoice.items);

        } else {
             generateSystemReturnInvoiceNumber(); // Fallback if invoice not found, though unlikely
        }
    } else {
        generateSystemReturnInvoiceNumber();
    }
    updateReturnTotalsUI();
}

// Async function to allow DOM to update before attempting to pre-fill returned quantities
async function loadOriginalSaleAndPopulateItems(originalInvoiceNumber: string, returnedItems?: SalesReturnInvoiceItem[]): Promise<void> {
    const posSale = state.salesLog.find(sale => sale.invoiceNumber === originalInvoiceNumber && sale.businessId === state.currentManagingBusinessId);
    const localSale = state.localSalesInvoices.find(inv => inv.id === originalInvoiceNumber && inv.businessId === state.currentManagingBusinessId);

    if (posSale) {
        originalSaleCache = posSale;
        displayOriginalSaleDetails(posSale, 'POS');
        populateReturnItemsTable(posSale.items.map(item => ({...item, type: 'pos' as 'pos' | 'local'})));
    } else if (localSale) {
        originalSaleCache = localSale;
        displayOriginalSaleDetails(localSale, 'Shitje Lokale');
        populateReturnItemsTable(localSale.items.map(item => ({...item, id: item.productId, price: item.priceWithVAT, type: 'local' as 'pos' | 'local'})));
    } else {
        if (dom.srOriginalSaleDetailsDiv) {
            dom.srOriginalSaleDetailsDiv.textContent = `Fatura origjinale ${originalInvoiceNumber} nuk u gjet.`;
            dom.srOriginalSaleDetailsDiv.style.display = 'block';
        }
        // Clear the items table if original sale not found
        if (dom.srItemsToReturnTbody) dom.srItemsToReturnTbody.innerHTML = '<tr><td colspan="7" class="text-center">Fatura origjinale nuk u gjet.</td></tr>';
        currentReturnItems = [];
        updateReturnTotalsUI();
        return;
    }
    
    // Pre-fill returned quantities if editing an existing sales return
    if (returnedItems && dom.srItemsToReturnTbody) {
        // Allow DOM to update from populateReturnItemsTable before setting values
        await new Promise(resolve => setTimeout(resolve, 0)); 

        returnedItems.forEach(returnedItem => {
            const currentItemIndex = currentReturnItems.findIndex(ci => ci.productId === returnedItem.productId);
            if (currentItemIndex > -1) {
                currentReturnItems[currentItemIndex].returnQuantity = returnedItem.quantityReturned;
                // Find the input element specifically
                const inputEl = dom.srItemsToReturnTbody!.querySelector<HTMLInputElement>(`input[data-item-index="${currentItemIndex}"]`);
                if (inputEl) inputEl.value = returnedItem.quantityReturned.toString();
            }
        });
        updateReturnTotalsUI(); // Update totals after pre-filling
    }
}


function generateSystemReturnInvoiceNumber(): void {
    if (!dom.srSystemInvoiceNumberInput || !state.currentManagingBusinessId) return;
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (business) {
        const seed = business.salesReturnInvoiceIdSeed || 1;
        const fiscalYear = business.fiscalYear || new Date().getFullYear();
        dom.srSystemInvoiceNumberInput.value = `KTHSH-${String(seed).padStart(3, '0')}-${fiscalYear}`;
    }
}

function handleSalesReturnCustomerSearch() {
    if (!dom.srCustomerSearchInput || !dom.srCustomerDropdownPanel) return;
    const searchTerm = dom.srCustomerSearchInput.value.toLowerCase().trim();

    // Only show dropdown if search term is present, unless a customer is already selected (then show to allow changing)
    if (searchTerm.length < 1 && !selectedCustomerIdForReturn) { 
        hideSalesReturnCustomerDropdown();
        if (dom.srCustomerSalesListContainer) dom.srCustomerSalesListContainer.style.display = 'none';
        return;
    }

    const filteredCustomers = state.customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.code.toLowerCase().includes(searchTerm)
    );
    renderSalesReturnCustomerDropdown(filteredCustomers);
}

function renderSalesReturnCustomerDropdown(customers: Customer[]) {
    if (!dom.srCustomerDropdownPanel) return;
    dom.srCustomerDropdownPanel.innerHTML = '';

    if (customers.length === 0) {
        const noResultsItem = document.createElement('div');
        noResultsItem.className = 'no-results-message';
        noResultsItem.textContent = 'Asnjë blerës nuk u gjet.';
        dom.srCustomerDropdownPanel.appendChild(noResultsItem);
    } else {
        customers.forEach(customer => {
            const item = document.createElement('div');
            item.className = 'customer-dropdown-item'; // Ensure this class exists in CSS
            item.textContent = `${customer.name} (Kodi: ${customer.code})`;
            item.dataset.customerId = customer.id;
            item.addEventListener('click', () => selectCustomerForSalesReturn(customer));
            dom.srCustomerDropdownPanel.appendChild(item);
        });
    }
    dom.srCustomerDropdownPanel.style.display = 'block';
}

function selectCustomerForSalesReturn(customer: Customer) {
    if (!dom.srCustomerSearchInput || !dom.srCustomerSalesListContainer) return;
    selectedCustomerIdForReturn = customer.id;
    dom.srCustomerSearchInput.value = `${customer.name} (${customer.code})`;
    hideSalesReturnCustomerDropdown();
    // Clear previous sale details and items before displaying new ones
    if (dom.srOriginalSaleDetailsDiv) {
        dom.srOriginalSaleDetailsDiv.innerHTML = '';
        dom.srOriginalSaleDetailsDiv.style.display = 'none';
    }
    if (dom.srItemsToReturnTbody) dom.srItemsToReturnTbody.innerHTML = '<tr><td colspan="7" class="text-center">Zgjidhni një faturë për të parë artikujt.</td></tr>';
    originalSaleCache = null;
    currentReturnItems = [];
    updateReturnTotalsUI();
    
    displaySalesForSelectedCustomer(customer.id);
}

function hideSalesReturnCustomerDropdown() {
    if (dom.srCustomerDropdownPanel) dom.srCustomerDropdownPanel.style.display = 'none';
}

function handleClickOutsideSalesReturnCustomerDropdown(event: MouseEvent) {
    if (dom.srCustomerSearchInput && dom.srCustomerDropdownPanel) {
        const target = event.target as Node;
        if (!dom.srCustomerSearchInput.contains(target) && !dom.srCustomerDropdownPanel.contains(target)) {
            hideSalesReturnCustomerDropdown();
        }
    }
}

function displaySalesForSelectedCustomer(customerId: string) {
    if (!dom.srCustomerSalesListContainer) return;
    dom.srCustomerSalesListContainer.innerHTML = ''; // Clear previous list
    dom.srCustomerSalesListContainer.style.display = 'block';

    const posSales = state.salesLog.filter(sale => sale.customerId === customerId && sale.businessId === state.currentManagingBusinessId);
    const localSales = state.localSalesInvoices.filter(inv => inv.customerId === customerId && inv.businessId === state.currentManagingBusinessId);
    
    const allSales = [
        ...posSales.map(s => ({ ...s, type: 'POS' as const, date: new Date(s.timestamp), displayId: s.invoiceNumber, total: s.grandTotal })),
        ...localSales.map(s => ({ ...s, type: 'Shitje Lokale' as const, date: new Date(s.invoiceDate + "T00:00:00"), displayId: s.id, total: s.totalAmountWithVAT }))
    ].sort((a,b) => b.date.getTime() - a.date.getTime()); // Newest first

    if (allSales.length === 0) {
        dom.srCustomerSalesListContainer.innerHTML = '<p class="info-message secondary text-center">Ky blerës nuk ka fatura të regjistruara.</p>';
        return;
    }
    
    const listTitle = document.createElement('h4');
    listTitle.style.marginTop = '0';
    listTitle.style.marginBottom = '0.5rem';
    listTitle.style.fontSize = '1.1rem';
    listTitle.style.color = '#555';
    listTitle.textContent = 'Zgjidh një Shitje për Kthim:';
    dom.srCustomerSalesListContainer.appendChild(listTitle);

    const ul = document.createElement('ul');
    ul.className = 'list-group'; // For Bootstrap-like styling if available
    allSales.forEach(sale => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center'; // This already has flex
        li.style.padding = '0.5rem 0.75rem';
        li.style.borderBottom = '1px dashed #eee';
        
        const saleInfo = document.createElement('span'); 
        saleInfo.style.flexGrow = "1"; // Allow text to take space
        saleInfo.style.marginRight = "10px"; // Space before button
        saleInfo.innerHTML = `<strong>${sale.type}</strong> - Nr: ${sale.displayId}&nbsp;&nbsp;|&nbsp;&nbsp;Data: ${sale.date.toLocaleDateString('sq-AL')}&nbsp;&nbsp;|&nbsp;&nbsp;Totali: ${sale.total.toFixed(2)} €`;
        
        const selectBtn = document.createElement('button');
        selectBtn.type = 'button';
        selectBtn.className = 'btn btn-sm btn-outline-primary'; // Bootstrap classes
        selectBtn.textContent = 'Zgjidh';
        selectBtn.style.flexShrink = "0"; // Prevent button from shrinking

        selectBtn.addEventListener('click', () => {
            originalSaleCache = sale.type === 'POS' ? posSales.find(s => s.invoiceNumber === sale.displayId)! : localSales.find(s => s.id === sale.displayId)!;
            displayOriginalSaleDetails(originalSaleCache, sale.type);
            const itemsToPopulate = sale.type === 'POS' 
                ? (originalSaleCache as SaleRecord).items.map(item => ({...item, type: 'pos' as 'pos' | 'local'}))
                : (originalSaleCache as LocalSaleInvoice).items.map(item => ({...item, id: item.productId, price: item.priceWithVAT, type: 'local' as 'pos' | 'local'})); // Map LocalSaleInvoiceItem to a common structure
            populateReturnItemsTable(itemsToPopulate);
        });

        li.appendChild(saleInfo);
        li.appendChild(selectBtn);
        ul.appendChild(li);
    });
    dom.srCustomerSalesListContainer.appendChild(ul);
}

function displayOriginalSaleDetails(saleData: SaleRecord | LocalSaleInvoice, saleType: 'POS' | 'Shitje Lokale'): void {
    if (!dom.srOriginalSaleDetailsDiv) return;
    
    let invoiceNumber: string;
    let saleDate: Date;
    let customerName: string | undefined;
    let sellerOrRecorder: string;

    if (saleType === 'POS') {
        const posSale = saleData as SaleRecord;
        invoiceNumber = posSale.invoiceNumber;
        saleDate = new Date(posSale.timestamp);
        customerName = posSale.customerName;
        sellerOrRecorder = posSale.sellerUsername;
    } else { // 'Shitje Lokale'
        const localSale = saleData as LocalSaleInvoice;
        invoiceNumber = localSale.id;
        saleDate = new Date(localSale.invoiceDate + "T00:00:00"); // Ensure date is parsed correctly
        customerName = localSale.customerName;
        sellerOrRecorder = localSale.recordedByManagerUsername;
    }
    const customer = customerName ? state.customers.find(c => c.name === customerName) : (selectedCustomerIdForReturn ? state.customers.find(c=>c.id === selectedCustomerIdForReturn) : null);
    
    dom.srOriginalSaleDetailsDiv.innerHTML = `
        <p><strong>Faturë Origjinale (${saleType}):</strong> ${invoiceNumber}</p>
        <p><strong>Data e Shitjes:</strong> ${saleDate.toLocaleString('sq-AL')}</p>
        <p><strong>Blerësi:</strong> ${customer ? `${customer.name} (${customer.code})` : (customerName || 'Klient Standard')}</p>
        <p><strong>${saleType === 'POS' ? 'Shitësi' : 'Regjistruar Nga'}:</strong> ${sellerOrRecorder}</p>
    `;
    dom.srOriginalSaleDetailsDiv.style.display = 'block';
}


function populateReturnItemsTable(originalItems: (SaleItem & {type: 'pos' | 'local'})[] | (LocalSaleInvoiceItem & {type: 'pos' | 'local', id: string, price: number})[]): void {
    if (!dom.srItemsToReturnTbody) return;
    dom.srItemsToReturnTbody.innerHTML = '';
    currentReturnItems = []; // Clear previous items

    if (originalItems.length === 0) {
        dom.srItemsToReturnTbody.innerHTML = '<tr><td colspan="7" class="text-center">Fatura origjinale nuk ka artikuj.</td></tr>';
        updateReturnTotalsUI();
        return;
    }
    
    originalItems.forEach((item, index) => {
        const tr = document.createElement('tr');
        tr.dataset.itemIndex = index.toString();
        
        const isItemFromLocalSale = item.type === 'local';
        // 'id' property is mapped for LocalSaleInvoiceItem to be item.productId during itemsToPopulate creation
        const productId = (item as any).id; 
        
        let productNameToDisplay: string;
        if (isItemFromLocalSale) {
            // For local sales, 'productName' is the original property
            productNameToDisplay = (item as any).productName;
        } else {
            // For POS sales, 'name' is the original property
            productNameToDisplay = (item as any).name;
        }
        
        // Robust fallback for name, looking up in state.products
        if (productNameToDisplay === undefined && productId) {
            const productFromState = state.products.find(p => p.id === productId);
            if (productFromState) {
                productNameToDisplay = productFromState.name;
            }
        }
        if (productNameToDisplay === undefined) {
            productNameToDisplay = "Artikull i Panjohur"; // Final fallback
        }

        const originalQuantity = item.quantity;
        // 'price' property is mapped for LocalSaleInvoiceItem to be item.priceWithVAT during itemsToPopulate creation
        const unitPriceWithVAT = (item as any).price; 
        
        let vatRate = 18; // Default VAT rate
        const productDetails = state.products.find(p => p.id === productId);
        if (isItemFromLocalSale && typeof (item as any).vatRate === 'number') {
            vatRate = (item as any).vatRate;
        } else if (productDetails?.itemTypeId) { // Fallback to item type for POS or if local sale didn't store VAT
            const itemType = state.itemTypes.find(it => it.id === productDetails.itemTypeId);
            if (itemType?.name.toLowerCase().includes("pa tvsh") || itemType?.name.toLowerCase().includes("0%")) {
                 vatRate = 0;
            } else if (itemType?.name.toLowerCase().includes("tvsh te reduktuar") || itemType?.name.toLowerCase().includes("10%")) { 
                 vatRate = 10; 
            }
        }
        
        const unitPriceWithoutVAT = parseFloat((unitPriceWithVAT / (1 + vatRate / 100)).toFixed(2));
        
        currentReturnItems.push({
            productId: productId,
            name: productNameToDisplay,
            originalQuantity: originalQuantity,
            returnQuantity: 0,
            unitPriceWithVAT: unitPriceWithVAT,
            unitPriceWithoutVAT: unitPriceWithoutVAT,
            vatRate: vatRate,
            isDealItem: 'isDeal' in item ? (item as any).isDeal : false,
            originalItemType: item.type
        });

        tr.innerHTML = `
            <td>${productNameToDisplay} ${('isDeal' in item && (item as any).isDeal) ? '<span class="deal-badge">OFERTË</span>':''}</td>
            <td class="text-right">${originalQuantity}</td>
            <td>
                <input type="number" class="form-control form-control-sm text-right sr-return-quantity-input" 
                       value="0" min="0" max="${originalQuantity}" data-item-id="${productId}" data-item-index="${index}" step="1">
            </td>
            <td class="text-right">${unitPriceWithoutVAT.toFixed(2)}</td>
            <td class="text-right">${vatRate.toFixed(2)}%</td>
            <td class="text-right">${unitPriceWithVAT.toFixed(2)}</td>
            <td class="text-right sr-row-total-value">0.00</td>
        `;
        dom.srItemsToReturnTbody.appendChild(tr);
    });
    updateReturnTotalsUI();
}


function handleReturnQuantityChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const itemIndex = parseInt(inputElement.dataset.itemIndex || '-1', 10);
    
    if (itemIndex >= 0 && itemIndex < currentReturnItems.length) {
        let newQuantity = parseInt(inputElement.value, 10);
        const item = currentReturnItems[itemIndex];

        if (isNaN(newQuantity) || newQuantity < 0) {
            newQuantity = 0;
        } else if (newQuantity > item.originalQuantity) {
            newQuantity = item.originalQuantity;
        }
        inputElement.value = newQuantity.toString(); 
        item.returnQuantity = newQuantity;

        // Update the specific row's total value
        const row = inputElement.closest('tr');
        if (row) {
            const rowTotalEl = row.querySelector<HTMLTableCellElement>('.sr-row-total-value');
            if (rowTotalEl) {
                rowTotalEl.textContent = (newQuantity * item.unitPriceWithVAT).toFixed(2);
            }
        }
        updateReturnTotalsUI();
    }
}

function updateReturnTotalsUI(): void {
    let totalWithoutVAT = 0;
    let totalVAT = 0;
    let totalWithVAT = 0;

    currentReturnItems.forEach(item => {
        if (item.returnQuantity > 0) {
            const itemTotalWithVAT = item.returnQuantity * item.unitPriceWithVAT;
            // Recalculate itemTotalWithoutVAT based on possibly edited unitPriceWithoutVAT and vatRate from currentReturnItems
            // For simplicity, assuming unitPriceWithoutVAT and unitPriceWithVAT on currentReturnItems[idx] are correct.
            const itemTotalWithoutVAT = item.returnQuantity * item.unitPriceWithoutVAT;
            const itemVatValue = itemTotalWithVAT - itemTotalWithoutVAT;

            totalWithVAT += itemTotalWithVAT;
            totalWithoutVAT += itemTotalWithoutVAT;
            totalVAT += itemVatValue;
        }
    });

    if (dom.srTotalWithoutVatElement) dom.srTotalWithoutVatElement.textContent = `${totalWithoutVAT.toFixed(2)} €`;
    if (dom.srTotalVatElement) dom.srTotalVatElement.textContent = `${totalVAT.toFixed(2)} €`;
    if (dom.srTotalWithVatElement) dom.srTotalWithVatElement.innerHTML = `<strong>${totalWithVAT.toFixed(2)} €</strong>`;
}


async function handleSaveSalesReturn(event: Event) {
    event.preventDefault();
     if (!dom.salesReturnFormErrorElement || !state.currentUser || !state.currentManagingBusinessId ||
        !dom.srSystemInvoiceNumberInput || !dom.srReturnDateInput || !originalSaleCache) {
        if(dom.salesReturnFormErrorElement) dom.salesReturnFormErrorElement.textContent = "Ju lutem plotësoni të gjitha fushat e kërkuara dhe zgjidhni faturën origjinale nga lista.";
        return;
    }

    const itemsToReturn = currentReturnItems.filter(item => item.returnQuantity > 0);
    if (itemsToReturn.length === 0) {
        dom.salesReturnFormErrorElement.textContent = "Nuk keni zgjedhur asnjë artikull për kthim ose sasitë janë zero.";
        return;
    }
    
    const returnDate = dom.srReturnDateInput.value;
    const reason = dom.srReasonInput?.value.trim() || undefined;
    const systemReturnInvoiceNumber = dom.srSystemInvoiceNumberInput.value;

    let totalReturnAmountWithoutVAT = 0;
    let totalReturnVATAmount = 0;
    let totalReturnAmountWithVAT = 0;

    const returnedInvoiceItems: SalesReturnInvoiceItem[] = itemsToReturn.map(item => {
        const productDetails = state.products.find(p => p.id === item.productId);
        const itemTotalWithVAT = item.returnQuantity * item.unitPriceWithVAT;
        const itemTotalWithoutVAT = item.returnQuantity * item.unitPriceWithoutVAT;
        const itemVatValue = itemTotalWithVAT - itemTotalWithoutVAT;

        totalReturnAmountWithoutVAT += itemTotalWithoutVAT;
        totalReturnVATAmount += itemVatValue;
        totalReturnAmountWithVAT += itemTotalWithVAT;

        return {
            productId: item.productId,
            productCode: productDetails?.code || 'N/A',
            productName: item.name, // Use the name from currentReturnItems which has fallback logic
            productUnitOfMeasure: productDetails?.unitOfMeasure || 'copë',
            productQuantityPerPackage: productDetails?.quantityPerPackage,
            quantityReturned: item.returnQuantity,
            returnPriceWithoutVAT: parseFloat(item.unitPriceWithoutVAT.toFixed(2)),
            vatRate: item.vatRate,
            returnPriceWithVAT: item.unitPriceWithVAT,
            totalValueWithoutVAT: parseFloat(itemTotalWithoutVAT.toFixed(2)),
            totalValueWithVAT: parseFloat(itemTotalWithVAT.toFixed(2)),
        };
    });

    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business) {
        dom.salesReturnFormErrorElement.textContent = "Biznesi nuk u gjet.";
        return;
    }
    
    const originalInvoiceNumber = 'invoiceNumber' in originalSaleCache ? originalSaleCache.invoiceNumber : originalSaleCache.id;
    const originalCustomerId = originalSaleCache.customerId;
    const originalCustomerName = originalSaleCache.customerName;


    const newSalesReturnInvoice: SalesReturnInvoice = {
        id: systemReturnInvoiceNumber,
        businessId: state.currentManagingBusinessId,
        originalSaleInvoiceNumber: originalInvoiceNumber,
        customerId: originalCustomerId,
        customerName: originalCustomerName,
        returnDate: returnDate,
        reason: reason,
        items: returnedInvoiceItems,
        totalReturnAmountWithoutVAT: parseFloat(totalReturnAmountWithoutVAT.toFixed(2)),
        totalReturnVATAmount: parseFloat(totalReturnVATAmount.toFixed(2)),
        totalReturnAmountWithVAT: parseFloat(totalReturnAmountWithVAT.toFixed(2)),
        recordedByManagerId: state.currentUser.id,
        recordedByManagerUsername: state.currentUser.username,
        timestamp: Date.now(),
    };

    state.salesReturnInvoices.push(newSalesReturnInvoice);
    business.salesReturnInvoiceIdSeed = (business.salesReturnInvoiceIdSeed || 1) + 1;
    
    await storage.saveSalesReturnInvoicesToLocalStorage(state.currentManagingBusinessId, state.salesReturnInvoices);
    await storage.saveAllBusinesses(state.businesses);
    await createJournalEntryForSalesReturn(newSalesReturnInvoice);

    // Update stock for returned items
    returnedInvoiceItems.forEach(returnedItem => {
        const product = state.products.find(p => p.id === returnedItem.productId);
        if (product) {
            product.stock += returnedItem.quantityReturned; // Add back to stock
        }
    });
    await storage.saveProductsToLocalStorage(state.currentManagingBusinessId, state.products);

    uiUtils.showCustomConfirm(`Kthimi i shitjes ${systemReturnInvoiceNumber} u regjistrua me sukses. Stoku u përditësua.`, () => {
        resetSalesReturnFormState();
        setActiveManagerView('sales_returns_list');
    });
}


export function renderSalesReturnList(): void {
    if (!dom.salesReturnsListTbody) return;
    dom.salesReturnsListTbody.innerHTML = '';

    if (state.salesReturnInvoices.length === 0) {
        dom.salesReturnsListTbody.innerHTML = '<tr><td colspan="6" class="text-center">Nuk ka kthime shitjesh të regjistruara.</td></tr>';
        return;
    }

    const sortedReturns = [...state.salesReturnInvoices].sort((a,b) => b.timestamp - a.timestamp);

    sortedReturns.forEach(ret => {
        const tr = document.createElement('tr');
        const customerName = ret.customerName || (ret.customerId ? state.customers.find(c=>c.id===ret.customerId)?.name : 'Klient Standard') || 'Klient Standard';
        tr.innerHTML = `
            <td>${ret.id}</td>
            <td>${new Date(ret.returnDate+'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${ret.originalSaleInvoiceNumber}</td>
            <td>${customerName}</td>
            <td class="text-right">${ret.totalReturnAmountWithVAT.toFixed(2)} €</td>
            <td>
                <button class="btn btn-info btn-sm view-sr-details-btn" data-return-id="${ret.id}">Detajet</button>
                <button class="btn btn-danger btn-sm delete-sr-btn" data-return-id="${ret.id}" data-display-id="${ret.id}">Fshij</button>
            </td>
        `;
        dom.salesReturnsListTbody.appendChild(tr);
    });
}

export function initSalesReturnsManagementView(): void {
    const salesReturnsListContainer = dom.managerContentSalesReturnsList; // Assuming this is the main container for the list view
    if (!salesReturnsListContainer) {
        console.error("Sales returns list container not found.");
        return;
    }
    renderSalesReturnList(); // Renders the table within this container
}

function openSalesReturnDetailsModal(returnInvoiceId: string): void {
    if (!dom.salesReturnDetailsModal || !dom.srDetailsSystemInvoiceNumber || !dom.srDetailsOriginalInvoiceNumber ||
        !dom.srDetailsCustomerName || !dom.srDetailsReturnDate || !dom.srDetailsReason ||
        !dom.srDetailsItemsTbody || !dom.srDetailsTotalWithoutVat || !dom.srDetailsTotalVat ||
        !dom.srDetailsTotalWithVat || !dom.srDetailsPrintInvoiceBtn) {
        console.error("Sales return details modal elements not found.");
        return;
    }

    const invoice = state.salesReturnInvoices.find(inv => inv.id === returnInvoiceId);
    if (!invoice) {
        alert("Fatura e kthimit nuk u gjet.");
        return;
    }

    dom.srDetailsSystemInvoiceNumber.textContent = invoice.id;
    dom.srDetailsOriginalInvoiceNumber.textContent = invoice.originalSaleInvoiceNumber;
    dom.srDetailsCustomerName.textContent = invoice.customerName || (invoice.customerId ? state.customers.find(c=>c.id===invoice.customerId)?.name : 'Klient Standard') || 'Klient Standard';
    dom.srDetailsReturnDate.textContent = new Date(invoice.returnDate + 'T00:00:00').toLocaleDateString('sq-AL');
    dom.srDetailsReason.textContent = invoice.reason || '-';

    dom.srDetailsItemsTbody.innerHTML = '';
    invoice.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.productCode}</td>
            <td>${item.productName}</td>
            <td class="text-right">${item.quantityReturned} ${item.productUnitOfMeasure}</td>
            <td class="text-right">${item.returnPriceWithoutVAT.toFixed(2)}</td>
            <td class="text-right">${item.vatRate.toFixed(2)}%</td>
            <td class="text-right">${item.returnPriceWithVAT.toFixed(2)}</td>
            <td class="text-right">${item.totalValueWithVAT.toFixed(2)}</td>
        `;
        dom.srDetailsItemsTbody.appendChild(tr);
    });

    dom.srDetailsTotalWithoutVat.textContent = `${invoice.totalReturnAmountWithoutVAT.toFixed(2)} €`;
    dom.srDetailsTotalVat.textContent = `${invoice.totalReturnVATAmount.toFixed(2)} €`;
    dom.srDetailsTotalWithVat.innerHTML = `<strong>${invoice.totalReturnAmountWithVAT.toFixed(2)} €</strong>`;
    
    dom.srDetailsPrintInvoiceBtn.dataset.returnInvoiceId = invoice.id;
    dom.salesReturnDetailsModal.style.display = 'block';
    uiUtils.showPageBlurOverlay();
}

function closeSalesReturnDetailsModal(): void {
    if (dom.salesReturnDetailsModal) dom.salesReturnDetailsModal.style.display = 'none';
    uiUtils.hidePageBlurOverlay();
}

function handlePrintSalesReturnInvoice(event: Event): void {
    const button = event.currentTarget as HTMLButtonElement; // Use currentTarget for delegated events
    const returnInvoiceId = button.dataset.returnInvoiceId;
    if (!returnInvoiceId) {
        alert("ID e faturës së kthimit mungon.");
        return;
    }

    const invoice = state.salesReturnInvoices.find(inv => inv.id === returnInvoiceId);
    if (!invoice) {
        alert("Fatura e kthimit nuk u gjet për printim.");
        return;
    }
    
    // Placeholder for print content generation, similar to other print functions
    const businessDetails = state.businessDetails;
    let itemsHtml = '';
    invoice.items.forEach((item, index) => {
        itemsHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.productCode}</td>
                <td>${item.productName}</td>
                <td class="text-right">${item.quantityReturned} ${item.productUnitOfMeasure}</td>
                <td class="text-right">${item.returnPriceWithoutVAT.toFixed(2)}</td>
                <td class="text-right">${item.vatRate.toFixed(2)}%</td>
                <td class="text-right">${item.returnPriceWithVAT.toFixed(2)}</td>
                <td class="text-right">${item.totalValueWithVAT.toFixed(2)}</td>
            </tr>
        `;
    });

    const invoiceHtml = `
        <div class="printable-invoice-area">
            <div class="invoice-header-print">
                ${businessDetails?.logoUrl ? `<div class="invoice-logo"><img src="${businessDetails.logoUrl}" alt="Logo e Biznesit"></div>` : ''}
                <div class="invoice-business-details">
                    <h2>${businessDetails?.name || ''}</h2>
                    ${businessDetails?.address ? `<p>${businessDetails.address}</p>` : ''}
                    ${businessDetails?.nipt ? `<p>NIPT: ${businessDetails.nipt}</p>` : ''}
                </div>
                <div class="invoice-meta">
                    <h1>KTHIM MALLI (SHITJE)</h1>
                    <p>Nr. Sistemi: <strong>${invoice.id}</strong></p>
                    <p>Fatura Origjinale: <strong>${invoice.originalSaleInvoiceNumber}</strong></p>
                    <p>Data e Kthimit: <strong>${new Date(invoice.returnDate+'T00:00:00').toLocaleDateString('sq-AL')}</strong></p>
                </div>
            </div>
            <div class="invoice-parties">
                 <div class="invoice-seller-details"> {/* Using seller-details class for customer here */}
                    <h3>Blerësi:</h3>
                    <p><strong>${invoice.customerName || (invoice.customerId ? state.customers.find(c=>c.id===invoice.customerId)?.name : 'Klient Standard') || 'Klient Standard'}</strong></p>
                     ${invoice.customerId && state.customers.find(c => c.id === invoice.customerId)?.address ? `<p>Adresa: ${state.customers.find(c => c.id === invoice.customerId)?.address}</p>` : ''}
                    ${invoice.customerId && state.customers.find(c => c.id === invoice.customerId)?.uniqueId ? `<p>NIPT/ID: ${state.customers.find(c => c.id === invoice.customerId)?.uniqueId}</p>` : ''}
                 </div>
                 <div class="invoice-issuer-details">
                    <h3>Lëshuar Nga (Biznesi Juaj):</h3>
                     <p>${invoice.recordedByManagerUsername}</p>
                     <p>Data Regjistrimit: ${new Date(invoice.timestamp).toLocaleString('sq-AL')}</p>
                     ${invoice.reason ? `<p>Arsyeja: ${invoice.reason}</p>` : ''}
                </div>
            </div>
            <table class="invoice-items-table">
                <thead>
                    <tr>
                        <th>Nr.</th>
                        <th>Kodi</th>
                        <th>Përshkrimi</th>
                        <th class="text-right">Sasia Kthyer</th>
                        <th class="text-right">Çm. Kthimit (pa TVSH)</th>
                        <th class="text-right">TVSH (%)</th>
                        <th class="text-right">Çm. Kthimit (me TVSH)</th>
                        <th class="text-right">Vlera Tot. Kthimit (me TVSH)</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                    <tr><td colspan="7" class="text-right strong">Nëntotali i Kthimit (pa TVSH):</td><td class="text-right strong">${invoice.totalReturnAmountWithoutVAT.toFixed(2)} €</td></tr>
                    <tr><td colspan="7" class="text-right strong">Vlera e TVSH-së së Kthimit:</td><td class="text-right strong">${invoice.totalReturnVATAmount.toFixed(2)} €</td></tr>
                    <tr><td colspan="7" class="text-right strong">TOTALI i KTHIMIT (me TVSH):</td><td class="text-right strong">${invoice.totalReturnAmountWithVAT.toFixed(2)} €</td></tr>
                </tfoot>
            </table>
            <div class="signatures-and-stamp-container">
                <div class="signature-area">
                    <p class="signature-label">Nënshkrimi i Lëshuesit (Biznesi Juaj):</p>
                    <div class="signature-line"></div>
                </div>
                <div class="signature-area">
                    <p class="signature-label">Nënshkrimi i Pranuesit (Blerësi):</p>
                    <div class="signature-line"></div>
                </div>
            </div>
            <div class="invoice-thank-you-message">
                <p>Ky dokument është gjeneruar nga sistemi ${state.superAdminAppSettings?.mainAppName || 'Arka Elektronike'}.</p>
                <p class="generation-time">Gjeneruar më: ${new Date().toLocaleString('sq-AL')}</p>
            </div>
        </div>
    `;

    if (dom.printPreviewContent && dom.printPreviewModalTitle) {
        dom.printPreviewContent.innerHTML = invoiceHtml;
        dom.printPreviewModalTitle.textContent = `Faturë Kthimi Shitje: ${invoice.id}`;
        uiUtils.openPrintPreviewModal();
    }
}

function handleDeleteSalesReturnInvoice(returnInvoiceId: string, displayId: string): void {
    if (!state.currentManagingBusinessId) return;

    uiUtils.showCustomConfirm(
        `Jeni i sigurt që doni të fshini faturën e kthimit të shitjes "${displayId}"? Ky veprim do të ndikojë stokun e produkteve (duke e zvogëluar stokun e shtuar nga kthimi). Ky veprim nuk mund të kthehet.`,
        async () => {
            if (!state.currentManagingBusinessId) return;
            const invoiceIndex = state.salesReturnInvoices.findIndex(inv => inv.id === returnInvoiceId);
            if (invoiceIndex === -1) { alert("Fatura e kthimit të shitjes nuk u gjet."); return; }
            const invoiceToDelete = state.salesReturnInvoices[invoiceIndex];

            // Revert stock quantities: stock should decrease by the quantityReturned
            invoiceToDelete.items.forEach(item => {
                const product = state.products.find(p => p.id === item.productId);
                if (product) {
                    product.stock -= item.quantityReturned; // Subtract the returned quantity to reverse the stock increase
                }
            });
            await storage.saveProductsToLocalStorage(state.currentManagingBusinessId, state.products);

            state.salesReturnInvoices.splice(invoiceIndex, 1);
            await storage.saveSalesReturnInvoicesToLocalStorage(state.currentManagingBusinessId, state.salesReturnInvoices);
            renderSalesReturnList(); // Make sure this function exists and is correctly implemented
            alert(`Fatura e kthimit të shitjes "${displayId}" u fshi dhe stoku u përditësua.`);
        }
    );
}
