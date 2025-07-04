/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from './core/dom';
import * as state from './core/state';
import * as storage from './core/storage';
import { Product, SaleItem, SaleRecord, ClearedSaleLogEntry, Deal, Customer, DealItem, PettyCashEntry } from './models';
import { comparePassword, generateUniqueId } from './core/utils';
import { showCustomConfirm, openPrintPreviewModal, isAnyOtherModalOrDropdownActive, generatePrintableSalesReportHTML } from './core/ui';
import { createJournalEntryForSale } from './manager/accountingUtils';

function handleProductTableClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLButtonElement>('.btn-add-to-sale-table');
    
    if (!button || button.disabled) return;

    const productId = button.dataset.productId;
    const dealId = button.dataset.dealId;

    if (productId) {
        addProductToSale(productId);
    } else if (dealId) {
        addDealToSale(dealId);
    }
}


export function initSellerEventListeners(): void {
    dom.productSearchInput?.addEventListener('input', renderProductsForSale);
    dom.triggerCompleteSaleBtn?.addEventListener('click', triggerCompleteSale);
    dom.clearSaleBtn?.addEventListener('click', clearSale);
    
    dom.customerSearchInput?.addEventListener('input', handleCustomerSearchInput);
    dom.customerSearchInput?.addEventListener('focus', () => {
        if (dom.customerSearchInput && dom.customerSearchInput.value.trim().length > 0) {
            handleCustomerSearchInput(); 
        } else if (dom.customerSearchInput && dom.customerSearchInput.value.trim().length === 0 && state.customers.length > 0) {
            // Optionally show all customers if input is focused and empty
            // renderCustomerDropdown(state.customers, ''); 
        }
    });
    document.addEventListener('click', handleClickOutsideCustomerDropdown);


    dom.sellerViewShiftSalesBtn?.addEventListener('click', showSellerShiftSalesModal);
    dom.closeSellerShiftSalesModalBtn?.addEventListener('click', closeSellerShiftSalesModal);
    if (dom.sellerShiftSalesModalCloseBtn) dom.sellerShiftSalesModalCloseBtn.addEventListener('click', closeSellerShiftSalesModal);
    
    const printSellerShiftSalesBtn = document.getElementById('print-seller-shift-sales-btn');
    printSellerShiftSalesBtn?.addEventListener('click', handlePrintSellerShiftSales);


    // Payment Modal Listeners
    dom.confirmPaymentBtn?.addEventListener('click', handleConfirmPayment);
    dom.cancelPaymentBtn?.addEventListener('click', closePaymentModal);
    if (dom.paymentModalCloseBtn) dom.paymentModalCloseBtn.addEventListener('click', closePaymentModal);
    dom.paymentAmountReceivedInput?.addEventListener('input', calculateChangeInPaymentModal);

    // Clear Sale Confirmation Modal Listeners
    dom.confirmClearSaleWithPinBtn?.addEventListener('click', handleConfirmClearSaleWithPIN);
    dom.cancelClearSaleConfirmationBtn?.addEventListener('click', closeClearSaleConfirmationModal);
    if (dom.clearSaleConfirmationModalCloseBtn) dom.clearSaleConfirmationModalCloseBtn.addEventListener('click', closeClearSaleConfirmationModal);

    // Event delegation for the product table
    dom.productTableBodyElement?.addEventListener('click', handleProductTableClick);

    // Petty Cash Modal Listeners
    dom.recordPettyCashBtn?.addEventListener('click', openPettyCashModal);
    dom.pettyCashForm?.addEventListener('submit', handleSavePettyCash);
    dom.cancelPettyCashBtn?.addEventListener('click', closePettyCashModal);
    dom.pettyCashModalCloseBtn?.addEventListener('click', closePettyCashModal);
}


// --- Seller POS Functions ---
export function renderProductsForSale(): void {
    if (!dom.productTableBodyElement || !state.currentUser || state.currentUser.role !== 'shites' || !state.currentManagingBusinessId) return;

    const searchTerm = dom.productSearchInput ? dom.productSearchInput.value.toLowerCase().trim() : '';
    dom.productTableBodyElement.innerHTML = '';
    const isSellerDayActiveAndNotReconciled = state.currentSellerDailyCashEntry && !state.currentSellerDailyCashEntry.isReconciled;
    let itemsFound = false;

    // Display Products
    state.products.forEach(product => {
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm) && !product.code.toLowerCase().includes(searchTerm)  && !(product.barcode && product.barcode.toLowerCase().includes(searchTerm))) {
            return;
        }
        itemsFound = true;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.name}</td>
            <td class="text-right">${product.price.toFixed(2)}</td>
            <td class="text-right">${product.stock}</td>
            <td>
                <button class="btn btn-sm btn-add-to-sale-table" data-product-id="${product.id}" ${!isSellerDayActiveAndNotReconciled || !product.isActive ? 'disabled' : ''}>Shto</button>
            </td>
        `;
        dom.productTableBodyElement.appendChild(tr);
    });

    // Display Active Deals
    state.deals.filter(deal => deal.isActive).forEach(deal => {
        if (searchTerm && !deal.name.toLowerCase().includes(searchTerm)) {
            return;
        }
        itemsFound = true;
        const tr = document.createElement('tr');
        tr.classList.add('deal-row'); 
        tr.innerHTML = `
            <td>${deal.name} <span class="deal-badge">OFERTË</span></td>
            <td class="text-right">${deal.price.toFixed(2)}</td>
            <td class="text-right">Ofertë</td>
            <td>
                <button class="btn btn-sm btn-add-to-sale-table" data-deal-id="${deal.id}" ${!isSellerDayActiveAndNotReconciled ? 'disabled' : ''}>Shto</button>
            </td>
        `;
        dom.productTableBodyElement.appendChild(tr);
    });


    if (!itemsFound) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="4" class="text-center">Asnjë produkt ose ofertë nuk përputhet me kërkimin, ose nuk ka produkte/oferta të disponueshme.</td>`;
        dom.productTableBodyElement.appendChild(tr);
    }
}

export function addProductToSale(productId: string): void {
    if (!state.currentManagingBusinessId || !state.currentSellerDailyCashEntry || state.currentSellerDailyCashEntry.isReconciled) {
        alert("Arka nuk është aktive ose është barazuar. Nuk mund të shtohen produkte.");
        return;
    }
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    if (!product.isActive) {
        alert(`Produkti "${product.name}" nuk është aktiv dhe nuk mund të shtohet në shitje.`);
        return;
    }

    const category = product.categoryId ? state.categories.find(c => c.id === product.categoryId) : undefined;

    const existingItem = state.currentSale.find(item => item.id === productId && !item.isDeal);
    if (existingItem) {
        if(product.stock < (existingItem.quantity + 1)) {
            alert(`Stoku i pamjaftueshëm për produktin "${product.name}". Stoku aktual: ${product.stock}.`);
            return;
        }
        existingItem.quantity++;
    } else {
        if(product.stock < 1) {
            alert(`Stoku i pamjaftueshëm për produktin "${product.name}". Stoku aktual: ${product.stock}.`);
            return;
        }
        state.currentSale.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            stock: product.stock, 
            isDeal: false,
            categoryId: product.categoryId,
            categoryName: category?.name
        });
    }
    renderSaleItems();
    updateTotals();
}

export function addDealToSale(dealId: string): void {
    if (!state.currentManagingBusinessId || !state.currentSellerDailyCashEntry || state.currentSellerDailyCashEntry.isReconciled) {
        alert("Arka nuk është aktive ose është barazuar. Nuk mund të shtohen oferta.");
        return;
    }
    const deal = state.deals.find(d => d.id === dealId && d.isActive);
    if (!deal) {
        alert("Oferta nuk u gjet ose nuk është aktive.");
        return;
    }
    
    // Check stock for all items in the deal before adding
    for (const dealItem of deal.items) {
        const productInDeal = state.products.find(p => p.id === dealItem.productId);
        if (!productInDeal) {
            alert(`Produkti me ID ${dealItem.productId} brenda ofertës "${deal.name}" nuk u gjet. Oferta nuk mund të shtohet.`);
            return;
        }
        if (productInDeal.stock < dealItem.quantity) { // Check if stock is enough for ONE unit of the deal
            alert(`Stoku i pamjaftueshëm për produktin "${productInDeal.name}" (pjesë e ofertës "${deal.name}"). Nevojitet: ${dealItem.quantity}, Stoku aktual: ${productInDeal.stock}. Oferta nuk mund të shtohet.`);
            return;
        }
    }


    const existingItem = state.currentSale.find(item => item.id === dealId && item.isDeal);
    if (existingItem) {
        // Check stock for increasing quantity of existing deal in cart
        for (const dealItem of deal.items) {
            const productInDeal = state.products.find(p => p.id === dealItem.productId);
            if (productInDeal && productInDeal.stock < (dealItem.quantity * (existingItem.quantity + 1))) {
                 alert(`Stoku i pamjaftueshëm për të rritur sasinë e ofertës "${deal.name}". Produkti "${productInDeal.name}" ka vetëm ${productInDeal.stock} në stok.`);
                return;
            }
        }
        existingItem.quantity++;
    } else {
        state.currentSale.push({
            id: deal.id,
            name: deal.name,
            price: deal.price, 
            quantity: 1,
            isDeal: true,
            dealItems: deal.items 
        });
    }
    renderSaleItems();
    updateTotals();
}

function promptClearSingleSaleItem(itemId: string, isDealItem: boolean): void {
    if (!state.currentSellerDailyCashEntry || state.currentSellerDailyCashEntry.isReconciled) {
        alert("Arka nuk është aktive ose është barazuar. Nuk mund të hiqet artikulli.");
        return;
    }
    state.setItemToClearFromSale({ id: itemId, isDeal: isDealItem });
    openClearSaleConfirmationModal();
}

export function renderSaleItems(): void {
    if (!dom.saleItemsListElement) return;
    dom.saleItemsListElement.innerHTML = '';
    if (state.currentSale.length === 0) {
        const p = document.createElement('p');
        p.className = 'empty-sale-message';
        p.textContent = 'Asnjë produkt në shitje.';
        dom.saleItemsListElement.appendChild(p);
        return;
    }

    state.currentSale.forEach(item => {
        const itemRow = document.createElement('div');
        itemRow.className = 'sale-item-row';
        itemRow.innerHTML = `
            <span class="sale-item-name">${item.name} ${item.isDeal ? '<span class="deal-badge">OFERTË</span>' : ''}</span>
            <span class="sale-item-unit-price">${item.price.toFixed(2)} €/copë</span>
            <div class="sale-item-quantity-controls">
                <button class="btn-quantity-adjust btn-sm" data-item-id="${item.id}" data-is-deal="${item.isDeal || false}" data-delta="-1">-</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="btn-quantity-adjust btn-sm" data-item-id="${item.id}" data-is-deal="${item.isDeal || false}" data-delta="1">+</button>
            </div>
            <span class="sale-item-price">${(item.price * item.quantity).toFixed(2)} €</span>
            <button class="btn-item-remove btn-sm btn-danger" data-item-id="${item.id}" data-is-deal="${item.isDeal || false}">X</button>
        `;
        itemRow.querySelectorAll<HTMLButtonElement>('.btn-quantity-adjust').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.itemId!;
                const isDeal = btn.dataset.isDeal === 'true';
                const delta = parseInt(btn.dataset.delta!, 10);
                const currentItem = state.currentSale.find(ci => ci.id === itemId && (ci.isDeal || false) === isDeal);
                if (currentItem) {
                    updateQuantity(itemId, currentItem.quantity + delta, isDeal);
                }
            });
        });
        itemRow.querySelector<HTMLButtonElement>('.btn-item-remove')?.addEventListener('click', () => {
             const itemId = (itemRow.querySelector<HTMLButtonElement>('.btn-item-remove')!).dataset.itemId!;
             const isDeal = (itemRow.querySelector<HTMLButtonElement>('.btn-item-remove')!).dataset.isDeal === 'true';
             promptClearSingleSaleItem(itemId, isDeal);
        });
        dom.saleItemsListElement.appendChild(itemRow);
    });
}

export function updateQuantity(itemId: string, newQuantity: number, isDealItem: boolean): void {
    const itemIndex = state.currentSale.findIndex(item => item.id === itemId && (item.isDeal || false) === isDealItem);
    if (itemIndex > -1) {
        const saleItem = state.currentSale[itemIndex];
        if (newQuantity > saleItem.quantity) { // If increasing quantity
            if (saleItem.isDeal && saleItem.dealItems) {
                for (const dealProd of saleItem.dealItems) {
                    const product = state.products.find(p => p.id === dealProd.productId);
                    if (product && product.stock < (dealProd.quantity * newQuantity)) {
                        alert(`Stoku i pamjaftueshëm për të rritur sasinë e ofertës "${saleItem.name}". Produkti "${product.name}" ka vetëm ${product.stock} në stok (nevojiten: ${dealProd.quantity * newQuantity}).`);
                        return; 
                    }
                }
            } else if (!saleItem.isDeal) {
                const product = state.products.find(p => p.id === saleItem.id);
                if (product && product.stock < newQuantity) {
                     alert(`Stoku i pamjaftueshëm për produktin "${saleItem.name}". Stoku aktual: ${product.stock}.`);
                    return;
                }
            }
        }

        if (newQuantity <= 0) {
            state.currentSale.splice(itemIndex, 1);
        } else {
            state.currentSale[itemIndex].quantity = newQuantity;
        }
        renderSaleItems();
        updateTotals();
    }
}

export function updateTotals(): void {
    if (!dom.subtotalElement || !dom.grandTotalElement) return;
    const subtotal = state.currentSale.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    dom.subtotalElement.textContent = `${subtotal.toFixed(2)} €`;
    dom.grandTotalElement.innerHTML = `<strong>${subtotal.toFixed(2)} €</strong>`;
}

export function clearSale(): void {
    if (!state.currentSellerDailyCashEntry || state.currentSellerDailyCashEntry.isReconciled) {
         alert("Arka nuk është aktive ose është barazuar. Nuk mund të pastrohet shitja.");
        return;
    }
    if (state.currentSale.length === 0) {
        alert("Nuk ka asgjë për të pastruar.");
        return;
    }

    // This function will now always open the confirmation modal for clearing the whole sale
    state.setItemToClearFromSale(null); 
    openClearSaleConfirmationModal();
}


function openClearSaleConfirmationModal() {
    if (!dom.clearSaleConfirmationModal || !dom.clearSalePinInput || !dom.clearSaleErrorElement) return;
    
    const modalTitleElement = document.getElementById('clear-sale-confirmation-modal-title') as HTMLHeadingElement | null;
    if (modalTitleElement) {
        if (state.itemToClearFromSale) {
            modalTitleElement.textContent = "Konfirmo Fshirjen e Artikullit";
        } else {
            modalTitleElement.textContent = "Konfirmo Pastrimin e Shitjes";
        }
    }

    dom.clearSalePinInput.value = '';
    dom.clearSaleErrorElement.textContent = '';
    dom.clearSaleConfirmationModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
    dom.clearSalePinInput.focus();
}

export function closeClearSaleConfirmationModal() {
    if (dom.clearSaleConfirmationModal) {
        dom.clearSaleConfirmationModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('clearSaleConfirmationModal')) {
             dom.pageBlurOverlay?.classList.remove('active');
        }
    }
    state.setItemToClearFromSale(null); 
}

export async function handleConfirmClearSaleWithPIN(): Promise<void> {
    if (!dom.clearSalePinInput || !dom.clearSaleErrorElement || !state.currentManagingBusinessId) return;

    try {
        const pin = dom.clearSalePinInput.value;
        const storedPinHash = await storage.getClearSalePinHash(state.currentManagingBusinessId);

        if (comparePassword(pin, storedPinHash)) {
            dom.clearSaleErrorElement.textContent = '';
            if (state.itemToClearFromSale) {
                // Clearing a single item
                updateQuantity(state.itemToClearFromSale.id, 0, state.itemToClearFromSale.isDeal);
                alert("Artikulli u hoq nga shitja.");
            } else {
                // Clearing the whole sale
                if (!state.currentManagingBusinessId || !state.currentUser || !state.currentSellerDailyCashEntry) {
                    alert("Gabim sistemi: Mungojnë të dhënat për të pastruar shitjen.");
                    closeClearSaleConfirmationModal(); // Close modal on error
                    return;
                }
                if (state.currentSale.length === 0) {
                     alert("Nuk ka asgjë për të pastruar.");
                     closeClearSaleConfirmationModal();
                     return;
                }
                const logEntry: ClearedSaleLogEntry = {
                    id: generateUniqueId('clear-'),
                    businessId: state.currentManagingBusinessId,
                    sellerId: state.currentUser.id,
                    sellerUsername: state.currentUser.username,
                    items: [...state.currentSale],
                    totalClearedAmount: state.currentSale.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                    clearedAt: Date.now(),
                    originalSaleDailyCashEntryDate: state.currentSellerDailyCashEntry.date,
                    originalSaleShift: state.currentSellerDailyCashEntry.shift,
                };
                state.clearedSalesLog.push(logEntry);
                await storage.saveClearedSalesLog(state.currentManagingBusinessId, state.clearedSalesLog);
                
                state.setCurrentSale([]);
                renderSaleItems();
                updateTotals();
                alert("Shitja aktuale u pastrua.");
            }

            // Close modal for both successful cases
            closeClearSaleConfirmationModal();
            
        } else {
            dom.clearSaleErrorElement.textContent = "PIN i pasaktë.";
            dom.clearSalePinInput.value = '';
            dom.clearSalePinInput.focus();
        }
    } catch (error) {
        console.error("Error during PIN confirmation for sale clear:", error);
        if (dom.clearSaleErrorElement) {
            dom.clearSaleErrorElement.textContent = "Ndodhi një gabim i papritur. Ju lutem provoni përsëri.";
        }
        closeClearSaleConfirmationModal();
    }
}

export function triggerCompleteSale(): void {
    if (state.currentSale.length === 0) {
        alert("Nuk ka produkte në shitje për të përfunduar.");
        return;
    }
     if (!state.currentSellerDailyCashEntry || state.currentSellerDailyCashEntry.isReconciled) {
        alert("Arka nuk është aktive ose është barazuar. Nuk mund të përfundohet shitja.");
        return;
    }
    openPaymentModal();
}

export function openPaymentModal() {
    if (!dom.paymentModal || !dom.paymentModalTotalAmountDisplay || !dom.paymentAmountReceivedInput || !dom.paymentModalChangeAmountDisplay || !dom.paymentModalErrorElement || !dom.quickPayButtonsContainer) return;
    
    const grandTotal = state.currentSale.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    state.setCurrentSaleGrandTotalForPayment(grandTotal);

    dom.paymentModalTotalAmountDisplay.textContent = `${grandTotal.toFixed(2)} €`;
    dom.paymentAmountReceivedInput.value = '';
    dom.paymentModalChangeAmountDisplay.textContent = '0.00 €';
    dom.paymentModalErrorElement.textContent = '';
    
    dom.quickPayButtonsContainer.innerHTML = '';
    const quickPayValues = [grandTotal, 5, 10, 20, 50, 100, 200, 500].filter((v, i, a) => a.indexOf(v) === i && v >= grandTotal).sort((a,b)=> a-b);
    quickPayValues.slice(0, 5).forEach(value => { 
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quick-pay-button';
        button.textContent = `${value.toFixed(value === grandTotal ? 2 : 0)} €`;
        if (value === grandTotal) button.classList.add('exact-amount-btn');
        button.addEventListener('click', () => {
            if(dom.paymentAmountReceivedInput) dom.paymentAmountReceivedInput.value = value.toFixed(2);
            calculateChangeInPaymentModal();
        });
        dom.quickPayButtonsContainer.appendChild(button);
    });

    dom.paymentModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
    dom.paymentAmountReceivedInput.focus();
}

export function closePaymentModal() {
    if (dom.paymentModal) {
        dom.paymentModal.style.display = 'none';
         if (!isAnyOtherModalOrDropdownActive('paymentModal')) {
             dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

export function calculateChangeInPaymentModal() {
    if (!dom.paymentAmountReceivedInput || !dom.paymentModalChangeAmountDisplay || !dom.paymentModalErrorElement) return;
    const amountReceived = parseFloat(dom.paymentAmountReceivedInput.value);
    const totalDue = state.currentSaleGrandTotalForPayment;
    dom.paymentModalErrorElement.textContent = '';

    if (isNaN(amountReceived) || amountReceived < 0) {
        dom.paymentModalChangeAmountDisplay.textContent = '0.00 €';
        dom.paymentModalErrorElement.textContent = 'Sasia e marrë është e pavlefshme.';
        return;
    }
    if (amountReceived < totalDue) {
        dom.paymentModalChangeAmountDisplay.textContent = '0.00 €';
        return;
    }
    const change = amountReceived - totalDue;
    dom.paymentModalChangeAmountDisplay.textContent = `${change.toFixed(2)} €`;
}


export async function handleConfirmPayment(): Promise<void> {
    if (!state.currentManagingBusinessId || !state.currentUser || !state.currentSellerDailyCashEntry || !dom.paymentAmountReceivedInput || !dom.paymentModalErrorElement) {
        alert("Gabim: Mungojnë detajet e nevojshme për të konfirmuar pagesën.");
        return;
    }
    if (state.currentSellerDailyCashEntry.isReconciled) {
        alert("Arka është barazuar. Nuk mund të regjistrohet shitja.");
        closePaymentModal();
        return;
    }

    const amountReceived = parseFloat(dom.paymentAmountReceivedInput.value);
    const totalDue = state.currentSaleGrandTotalForPayment;

    if (isNaN(amountReceived) || amountReceived < 0) {
        dom.paymentModalErrorElement.textContent = 'Sasia e marrë është e pavlefshme.';
        return;
    }
     if (amountReceived < totalDue) {
         dom.paymentModalErrorElement.textContent = 'Sasia e marrë është më e vogël se totali.';
        return;
    }
    const changeGiven = amountReceived - totalDue;


    state.currentSale.forEach(saleItem => {
        if (saleItem.isDeal && saleItem.dealItems) {
            saleItem.dealItems.forEach(dealProd => {
                const product = state.products.find(p => p.id === dealProd.productId);
                if (product) {
                    // Corrected stock deduction:
                    // Multiply quantity of deal sold (saleItem.quantity) 
                    // by quantity of product within one deal (dealProd.quantity)
                    product.stock -= (saleItem.quantity * dealProd.quantity);
                }
            });
        } else if (!saleItem.isDeal) { // Regular product
            const product = state.products.find(p => p.id === saleItem.id);
            if (product) {
                product.stock -= saleItem.quantity;
            }
        }
    });
    await storage.saveProducts(state.currentManagingBusinessId, state.products);

    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    let invoiceIdSeed = business ? business.invoiceIdSeed : 1;
    let fiscalYear = business ? business.fiscalYear : new Date().getFullYear();

    const saleRecord: SaleRecord = {
        invoiceNumber: `${invoiceIdSeed.toString().padStart(3, '0')}-${fiscalYear}`,
        businessId: state.currentManagingBusinessId,
        sellerId: state.currentUser.id,
        sellerUsername: state.currentUser.username,
        items: state.currentSale.map(item => ({ 
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            stock: item.stock,
            isDeal: item.isDeal,
            dealItems: item.dealItems, 
            categoryId: item.categoryId,
            categoryName: item.categoryName,
        })),
        subtotal: totalDue,
        grandTotal: totalDue,
        paymentMethod: 'cash',
        timestamp: Date.now(),
        dailyCashEntryDate: state.currentSellerDailyCashEntry.date,
        shift: state.currentSellerDailyCashEntry.shift,
        amountReceived: amountReceived,
        changeGiven: changeGiven,
        customerId: state.currentSaleSelectedCustomerId || undefined,
        customerName: state.currentSaleSelectedCustomerId ? state.customers.find(c => c.id === state.currentSaleSelectedCustomerId)?.name : undefined,
    };
    state.salesLog.push(saleRecord);
    await storage.saveSalesLog(state.currentManagingBusinessId, state.salesLog);
    await createJournalEntryForSale(saleRecord);

    if(business) {
        business.invoiceIdSeed = invoiceIdSeed + 1;
        await storage.saveAllBusinesses(state.businesses);
    }

    state.setCurrentSale([]);
    state.setCurrentSellerTotalCashSales(state.currentSellerTotalCashSales + totalDue);
    
    
    if (dom.sellerTotalSalesCashElement) dom.sellerTotalSalesCashElement.textContent = state.currentSellerTotalCashSales.toFixed(2);
    if (dom.sellerCurrentCashElement && state.currentSellerDailyCashEntry) {
        const totalPettyCashForShift = state.pettyCashLog
            .filter(e => e.sellerId === state.currentUser.id && e.dailyCashEntryDate === state.currentSellerDailyCashEntry!.date && e.shift === state.currentSellerDailyCashEntry!.shift)
            .reduce((sum, entry) => sum + entry.amount, 0);
        dom.sellerCurrentCashElement.textContent = (state.currentSellerDailyCashEntry.initialCash + state.currentSellerTotalCashSales - totalPettyCashForShift).toFixed(2);
    }
    
    const activeEntry = state.currentSellerDailyCashEntry;
    if (activeEntry && dom.sellerDayStatusMessageElement) {
        const numberOfInvoices = state.salesLog.filter(
            sale => sale.sellerId === state.currentUser!.id && 
                    sale.dailyCashEntryDate === activeEntry.date &&
                    sale.shift === activeEntry.shift
        ).length;
        dom.sellerDayStatusMessageElement.textContent = `Arka është e hapur për shitje (${activeEntry.shift === "paradite" ? "Paradite" : "Masdite"}). (Fatura: ${numberOfInvoices})`;
    }


    renderProductsForSale(); 
    renderSaleItems();    
    updateTotals();       
    closePaymentModal();
    
    resetCustomerSearchInput();
    
    alert(`Shitja u përfundua me sukses! Fatura: ${saleRecord.invoiceNumber}. Kusuri: ${changeGiven.toFixed(2)} €`);
}

export function showSellerShiftSalesModal() {
    if (!dom.sellerShiftSalesModal || !dom.sellerShiftSalesModalTitle || !dom.sellerShiftSalesContent || 
        !state.currentUser || !state.currentSellerDailyCashEntry) {
        alert("Nuk mund të shfaqen shitjet e ndërrimit. Detajet mungojnë.");
        return;
    }

    const entry = state.currentSellerDailyCashEntry;
    const shiftSales = state.salesLog.filter(
        sale => sale.sellerId === state.currentUser!.id && 
                sale.dailyCashEntryDate === entry.date &&
                sale.shift === entry.shift
    );
    
    const shiftPettyCash = state.pettyCashLog.filter(
        e => e.sellerId === state.currentUser!.id && 
             e.dailyCashEntryDate === entry.date &&
             e.shift === entry.shift
    );

    dom.sellerShiftSalesModalTitle.textContent = `Pasqyra e Lëvizjeve - ${entry.sellerUsername} (${entry.date}, ${entry.shift === 'paradite' ? 'Paradite' : 'Masdite'})`;
    
    if (shiftSales.length === 0 && shiftPettyCash.length === 0) {
        dom.sellerShiftSalesContent.innerHTML = "<p class='text-center info-message info'>Nuk ka shitje ose shpenzime të regjistruara për këtë ndërrim.</p>";
    } else {
        const reportHTML = generatePrintableSalesReportHTML(
            shiftSales, 
            `${new Date(entry.date + "T00:00:00").toLocaleDateString('sq-AL')} (${entry.shift === 'paradite' ? 'Paradite' : 'Masdite'})`,
            `Pasqyra e Lëvizjeve të Ndërrimit`,
            'shiftReport',
            shiftPettyCash
        );
        dom.sellerShiftSalesContent.innerHTML = reportHTML;
    }
    dom.sellerShiftSalesModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}


export function closeSellerShiftSalesModal() {
    if (dom.sellerShiftSalesModal) {
        dom.sellerShiftSalesModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('sellerShiftSalesModal')) {
           dom.pageBlurOverlay?.classList.remove('active');
        }
    }
    if (dom.sellerShiftSalesContent) {
        dom.sellerShiftSalesContent.innerHTML = ''; 
    }
}

function handlePrintSellerShiftSales() {
    if (!dom.sellerShiftSalesContent || !dom.printPreviewModalTitle || !dom.printPreviewContent) return;
    
    const contentToPrint = dom.sellerShiftSalesContent.querySelector('.printable-area')?.innerHTML;
    if (!contentToPrint || contentToPrint.includes("Nuk ka shitje ose shpenzime të regjistruara")) {
        alert("Nuk ka përmbajtje për të printuar.");
        return;
    }

    dom.printPreviewModalTitle.textContent = dom.sellerShiftSalesModalTitle?.textContent || "Pasqyra e Lëvizjeve të Ndërrimit";
    dom.printPreviewContent.innerHTML = contentToPrint;
    openPrintPreviewModal();
}


// --- New Customer Search Dropdown Functions ---

function handleCustomerSearchInput() {
    if (!dom.customerSearchInput || !state.currentManagingBusinessId) return;
    const searchTerm = dom.customerSearchInput.value.toLowerCase().trim();

    if (searchTerm === "") {
        hideCustomerDropdown();
        if (state.currentSaleSelectedCustomerId !== null) {
             const currentBusiness = state.businesses.find(b => b.id === state.currentManagingBusinessId);
             const defaultCustomerId = currentBusiness?.defaultCustomerId || null;
             state.setCurrentSaleSelectedCustomerId(defaultCustomerId);
        }
        return;
    }

    const filteredCustomers = state.customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.code.toLowerCase().includes(searchTerm) ||
        (customer.uniqueId && customer.uniqueId.toLowerCase().includes(searchTerm))
    );
    renderCustomerDropdown(filteredCustomers, searchTerm);
}

function renderCustomerDropdown(customers: Customer[], searchTerm: string) {
    if (!dom.customerDropdownPanel) return;
    dom.customerDropdownPanel.innerHTML = '';

    if (customers.length === 0) {
        const noResultsItem = document.createElement('div');
        noResultsItem.className = 'no-results-message';
        noResultsItem.textContent = 'Asnjë blerës nuk u gjet.';
        dom.customerDropdownPanel.appendChild(noResultsItem);
        showCustomerDropdown();
        return;
    }

    customers.forEach(customer => {
        const item = document.createElement('div');
        item.className = 'customer-dropdown-item';
        item.textContent = `${customer.name} (Kodi: ${customer.code})`;
        item.dataset.customerId = customer.id;
        item.setAttribute('role', 'option');
        item.tabIndex = -1; 

        item.addEventListener('click', () => {
            selectCustomerFromDropdown(customer);
        });
        dom.customerDropdownPanel.appendChild(item);
    });
    showCustomerDropdown();
}

function selectCustomerFromDropdown(customer: Customer) {
    if (!dom.customerSearchInput) return;
    dom.customerSearchInput.value = customer.name; 
    state.setCurrentSaleSelectedCustomerId(customer.id);
    hideCustomerDropdown();
}

function resetCustomerSearchInput() {
    if (dom.customerSearchInput) {
        dom.customerSearchInput.value = '';
    }
    const currentBusiness = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    const defaultCustomerId = currentBusiness?.defaultCustomerId || null;
    state.setCurrentSaleSelectedCustomerId(defaultCustomerId); 
    hideCustomerDropdown();
}

function showCustomerDropdown() {
    if (dom.customerDropdownPanel) {
        dom.customerDropdownPanel.style.display = 'block';
        dom.customerDropdownPanel.classList.add('active');
        dom.pageBlurOverlay?.classList.add('active');
    }
}

function hideCustomerDropdown() {
    if (dom.customerDropdownPanel) {
        dom.customerDropdownPanel.style.display = 'none';
        dom.customerDropdownPanel.classList.remove('active');
        if (!isAnyOtherModalOrDropdownActive('customerDropdownPanel')) { 
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}


function handleClickOutsideCustomerDropdown(event: MouseEvent) {
    if (dom.customerSearchInput && dom.customerDropdownPanel) {
        const target = event.target as Node;
        if (!dom.customerSearchInput.contains(target) && !dom.customerDropdownPanel.contains(target)) {
            hideCustomerDropdown();
        }
    }
}

export function populateSellerCustomerSelect() {
    resetCustomerSearchInput();
}
export function handleSellerCustomerSelectionChange(event: Event) {
    // Obsolete
}

// --- Petty Cash Functions ---
function openPettyCashModal(): void {
    if (!state.currentSellerDailyCashEntry || state.currentSellerDailyCashEntry.isReconciled) {
        alert("Ju duhet të keni një arkë të hapur dhe të pa barazuar për të regjistruar një shpenzim.");
        return;
    }
    if (!dom.pettyCashModal || !dom.pettyCashForm || !dom.pettyCashFormError) return;

    dom.pettyCashForm.reset();
    dom.pettyCashFormError.textContent = '';
    dom.pettyCashModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
    dom.pettyCashDescription?.focus();
}

function closePettyCashModal(): void {
    if (!dom.pettyCashModal) return;
    dom.pettyCashModal.style.display = 'none';
    if (!isAnyOtherModalOrDropdownActive('pettyCashModal')) {
        dom.pageBlurOverlay?.classList.remove('active');
    }
}

async function handleSavePettyCash(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.pettyCashDescription || !dom.pettyCashAmount || !dom.pettyCashFormError || !state.currentUser || !state.currentSellerDailyCashEntry || !state.currentManagingBusinessId) {
        alert("Gabim sistemi: Mungojnë të dhënat për të ruajtur shpenzimin.");
        return;
    }

    const description = dom.pettyCashDescription.value.trim();
    const amount = parseFloat(dom.pettyCashAmount.value);

    if (!description || isNaN(amount) || amount <= 0) {
        dom.pettyCashFormError.textContent = "Ju lutem plotësoni përshkrimin dhe një shumë valide.";
        return;
    }

    const totalPettyCashForShift = state.pettyCashLog
        .filter(e => e.sellerId === state.currentUser?.id && e.dailyCashEntryDate === state.currentSellerDailyCashEntry?.date && e.shift === state.currentSellerDailyCashEntry?.shift)
        .reduce((sum, entry) => sum + entry.amount, 0);

    const currentCash = (state.currentSellerDailyCashEntry.initialCash + state.currentSellerTotalCashSales) - totalPettyCashForShift;
    
    if (amount > currentCash) {
        dom.pettyCashFormError.textContent = `Shuma e shpenzimit (${amount.toFixed(2)}€) tejkalon gjendjen aktuale të arkës (${currentCash.toFixed(2)}€).`;
        return;
    }

    const newEntry: PettyCashEntry = {
        id: generateUniqueId('pc-'),
        businessId: state.currentManagingBusinessId,
        sellerId: state.currentUser.id,
        sellerUsername: state.currentUser.username,
        dailyCashEntryDate: state.currentSellerDailyCashEntry.date,
        shift: state.currentSellerDailyCashEntry.shift,
        description: description,
        amount: amount,
        timestamp: Date.now(),
    };
    
    state.pettyCashLog.push(newEntry);
    await storage.savePettyCashLog(state.currentManagingBusinessId, state.pettyCashLog);

    if (dom.sellerCurrentCashElement) {
        const newCurrentCash = currentCash - amount;
        dom.sellerCurrentCashElement.textContent = newCurrentCash.toFixed(2);
    }

    showCustomConfirm("Shpenzimi u regjistrua me sukses.", () => {});
    closePettyCashModal();
}