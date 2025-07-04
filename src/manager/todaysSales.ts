

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as ui from '../core/ui';
import * as storage from '../core/storage';
import { SaleRecord, Customer } from '../models';
import { getTodayDateString } from '../core/utils';

let currentInvoiceForCustomerChange: string | null = null;


export function initTodaysSalesEventListeners(): void {
    dom.todaysSalesFilterInput?.addEventListener('input', handleFilterTodaysSales);
    dom.changeCustomerModalCloseBtn?.addEventListener('click', closeChangeCustomerModal);
    dom.changeCustomerForm?.addEventListener('submit', handleSaveCustomerChange);
    // saveCustomerChangeBtn is likely type="submit" in the form, so form's submit is enough
    dom.cancelCustomerChangeBtn?.addEventListener('click', closeChangeCustomerModal);
}


export function initTodaysSalesView(viewNameOrReportType: string, targetContainer?: HTMLElement): void {
    if (!state.currentManagingBusinessId || !dom.todaysSalesTbody || !dom.todaysSalesSummary || !dom.todaysSalesFilterInput) {
        console.warn("initTodaysSalesView: Required DOM elements or state missing. Tbody:", dom.todaysSalesTbody, "Summary:", dom.todaysSalesSummary, "FilterInput:", dom.todaysSalesFilterInput);
        if (targetContainer) {
            targetContainer.innerHTML = '<p class="error-message">Gabim në ngarkimin e pamjes së shitjeve të sotme. Elementet kryesore mungojnë.</p>';
        }
        return;
    }

    dom.todaysSalesFilterInput.value = ''; // Clear filter on view init
    
    filterAndRenderTodaysSales();
}

export function handleFilterTodaysSales(): void {
    filterAndRenderTodaysSales();
}

function filterAndRenderTodaysSales(): void {
    if (!state.currentManagingBusinessId || !dom.todaysSalesFilterInput) return;
    const today = getTodayDateString();
    const searchTerm = dom.todaysSalesFilterInput.value.toLowerCase().trim();

    let todaysSales = state.salesLog.filter(
        sale => sale.businessId === state.currentManagingBusinessId && sale.dailyCashEntryDate === today
    );

    if (searchTerm) {
        todaysSales = todaysSales.filter(sale => 
            sale.invoiceNumber.toLowerCase().includes(searchTerm) ||
            (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm)) ||
            sale.sellerUsername.toLowerCase().includes(searchTerm)
        );
    }
    
    todaysSales.sort((a,b) => a.timestamp - b.timestamp);

    renderTodaysSalesTable(todaysSales);
    // Summary should always show total for the day, not filtered results
    const allTodaysSalesForSummary = state.salesLog.filter(
        sale => sale.businessId === state.currentManagingBusinessId && sale.dailyCashEntryDate === today
    );
    renderTodaysSalesSummary(allTodaysSalesForSummary);
}


function renderTodaysSalesTable(sales: SaleRecord[]): void {
    if (!dom.todaysSalesTbody) return;
    dom.todaysSalesTbody.innerHTML = '';

    if (sales.length === 0) {
        const filterActive = dom.todaysSalesFilterInput && dom.todaysSalesFilterInput.value.trim() !== '';
        dom.todaysSalesTbody.innerHTML = `<tr><td colspan="8" class="text-center">${filterActive ? 'Asnjë faturë nuk përputhet me kërkimin.' : 'Nuk ka shitje të regjistruara për sot.'}</td></tr>`;
        return;
    }

    sales.forEach(sale => {
        const tr = document.createElement('tr');
        tr.dataset.invoiceNumber = sale.invoiceNumber;
        tr.setAttribute('role', 'row');
        tr.setAttribute('aria-label', `Fatura ${sale.invoiceNumber}, kliko dy herë për të ndryshuar blerësin, ose shtyp butonin për veprime`);
        tr.tabIndex = 0; 

        const itemsSummary = sale.items.map(item => `${item.name} (x${item.quantity})`).join(', ');

        tr.innerHTML = `
            <td>${new Date(sale.timestamp).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}</td>
            <td>${sale.invoiceNumber}</td>
            <td>${sale.sellerUsername}</td>
            <td>${sale.shift === 'paradite' ? 'Paradite' : 'Masdite'}</td>
            <td>${sale.customerName || 'Klient Standard'}</td>
            <td>${itemsSummary.length > 40 ? itemsSummary.substring(0, 37) + '...' : itemsSummary}</td>
            <td class="text-right">${sale.grandTotal.toFixed(2)} €</td>
            <td class="text-center">
                <button class="btn btn-info btn-sm btn-print-invoice" data-invoice-number="${sale.invoiceNumber}" aria-label="Shtyp Faturën ${sale.invoiceNumber}">
                    <span class="icon">🖨️</span> Shtyp
                </button>
            </td>
        `;

        tr.addEventListener('dblclick', () => openChangeCustomerModal(sale.invoiceNumber));
        tr.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                // Decide if activating row should open modal or trigger print?
                // For now, let double click handle modal, and button handles print
                // openChangeCustomerModal(sale.invoiceNumber); 
            }
        });
        tr.querySelector<HTMLButtonElement>('.btn-print-invoice')?.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent dblclick event if button is inside the row
            handleGenerateAndPrintInvoice(sale.invoiceNumber);
        });
        dom.todaysSalesTbody.appendChild(tr);
    });
}

function renderTodaysSalesSummary(sales: SaleRecord[]): void {
    if (!dom.todaysSalesSummary) return;

    const totalAmount = sales.reduce((sum, sale) => sum + sale.grandTotal, 0);
    const numberOfInvoices = sales.length;

    dom.todaysSalesSummary.innerHTML = `
        <p><strong>Numri Total i Faturave Sot:</strong> ${numberOfInvoices}</p>
        <p><strong>Shuma Totale e Shitjeve Sot:</strong> ${totalAmount.toFixed(2)} €</p>
    `;
}

export function openChangeCustomerModal(invoiceNumber: string): void {
    if (!dom.changeCustomerModal || !dom.changeCustomerSaleIdInput || !dom.changeCustomerInvoiceNumber ||
        !dom.changeCustomerCurrentCustomer || !dom.changeCustomerSelect || !dom.changeCustomerModalError) return;

    const saleRecord = state.salesLog.find(s => s.invoiceNumber === invoiceNumber && s.businessId === state.currentManagingBusinessId);

    if (!saleRecord) {
        alert("Fatura nuk u gjet.");
        return;
    }

    currentInvoiceForCustomerChange = invoiceNumber;
    dom.changeCustomerSaleIdInput.value = invoiceNumber; 
    dom.changeCustomerInvoiceNumber.textContent = saleRecord.invoiceNumber;
    dom.changeCustomerCurrentCustomer.textContent = saleRecord.customerName || "Klient Standard";

    dom.changeCustomerSelect.innerHTML = '<option value="">-- Klient Standard --</option>';
    state.customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = `${customer.name} (Kodi: ${customer.code})`;
        if (customer.id === saleRecord.customerId) {
            option.selected = true;
        }
        dom.changeCustomerSelect.appendChild(option);
    });

    dom.changeCustomerModalError.textContent = '';
    dom.changeCustomerModal.style.display = 'block';
    dom.changeCustomerSelect.focus();
}

export function closeChangeCustomerModal(): void {
    if (dom.changeCustomerModal) {
        dom.changeCustomerModal.style.display = 'none';
    }
    currentInvoiceForCustomerChange = null;
    if (dom.changeCustomerForm) dom.changeCustomerForm.reset();
}

export function handleSaveCustomerChange(event: Event): void {
    event.preventDefault();
    if (!currentInvoiceForCustomerChange || !dom.changeCustomerSelect || !dom.changeCustomerModalError || !state.currentManagingBusinessId) {
        if (dom.changeCustomerModalError) dom.changeCustomerModalError.textContent = "Gabim: Fatura ose blerësi i ri nuk është specifikuar.";
        return;
    }

    const saleRecordIndex = state.salesLog.findIndex(s => s.invoiceNumber === currentInvoiceForCustomerChange && s.businessId === state.currentManagingBusinessId);
    if (saleRecordIndex === -1) {
        dom.changeCustomerModalError.textContent = "Fatura nuk u gjet për përditësim.";
        return;
    }

    const newCustomerId = dom.changeCustomerSelect.value;
    let newCustomerName: string | undefined = undefined;

    if (newCustomerId) {
        const customer = state.customers.find(c => c.id === newCustomerId);
        if (customer) {
            newCustomerName = customer.name;
        } else {
            dom.changeCustomerModalError.textContent = "Blerësi i zgjedhur nuk është valid.";
            return;
        }
    } else {
        newCustomerName = undefined; 
    }

    state.salesLog[saleRecordIndex].customerId = newCustomerId || undefined;
    state.salesLog[saleRecordIndex].customerName = newCustomerName;

    storage.saveSalesLogToLocalStorage(state.currentManagingBusinessId, state.salesLog);
    alert(`Blerësi për faturën ${currentInvoiceForCustomerChange} u ndryshua me sukses.`);
    
    closeChangeCustomerModal();
    filterAndRenderTodaysSales(); 
}

export function handleGenerateAndPrintInvoice(invoiceNumber: string): void {
    if (!state.currentManagingBusinessId) return;

    const sale = state.salesLog.find(s => s.invoiceNumber === invoiceNumber && s.businessId === state.currentManagingBusinessId);
    
    if (!sale) {
        alert("Fatura nuk u gjet.");
        return;
    }
    
    // Use the generatePrintableSalesReportHTML for a single sale, which now handles the invoice format
    const invoiceHtml = ui.generatePrintableSalesReportHTML(
        [sale], // Pass the single sale as an array
        new Date(sale.timestamp).toLocaleString('sq-AL'), // Date for the invoice
        "FATURË", // Title of the document
        'todaysSales' // Indicate it's from today's sales, for specific formatting if needed
    );

    if (dom.printPreviewModalTitle) dom.printPreviewModalTitle.textContent = `Faturë: ${sale.invoiceNumber}`;
    if (dom.printPreviewContent) dom.printPreviewContent.innerHTML = invoiceHtml;
    ui.openPrintPreviewModal();
}
