
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import { Product, SaleRecord, PurchaseInvoice, ReturnPurchaseInvoice, DailyCashEntry, SaleItem, LocalSaleInvoice, SalesReturnInvoice, ProductionOrder } from '../models';
import { getTodayDateString, downloadFile } from '../core/utils';
import { openPrintPreviewModal, generatePrintableSalesReportHTML } from '../core/ui'; // Corrected import path

interface LedgerEntry {
    date: number; // Timestamp for sorting
    displayDate: string;
    type: string; // e.g., 'Shitje', 'Blerje Vendore', 'Kthim Blerje', 'Stok Fillestar/Korrigjim'
    documentNumber: string;
    incoming: number;
    outgoing: number;
    balance: number;
    description?: string;
}

export function initItemLedgerEventListeners(): void {
    dom.generateItemLedgerBtn?.addEventListener('click', handleGenerateItemLedger);
    dom.itemLedgerProductSelect?.addEventListener('change', () => {
        if (dom.itemLedgerContentArea) {
            dom.itemLedgerContentArea.innerHTML = '<p class="text-center info-message info">Zgjidhni një produkt dhe periudhën për të parë kartelën.</p>';
        }
        if(dom.exportItemLedgerPdfBtn) dom.exportItemLedgerPdfBtn.disabled = true;
        if(dom.printItemLedgerBtn) dom.printItemLedgerBtn.disabled = true;
    });
    dom.exportItemLedgerPdfBtn?.addEventListener('click', () => handleExportItemLedger('pdf'));
    dom.printItemLedgerBtn?.addEventListener('click', () => handleExportItemLedger('print'));
}

export function initItemLedgerView(): void {
    if (!dom.itemLedgerProductSelect || !dom.itemLedgerStartDateInput || !dom.itemLedgerEndDateInput || !dom.itemLedgerContentArea) return;

    populateItemLedgerProductSelect();
    const today = getTodayDateString();
    dom.itemLedgerStartDateInput.value = today;
    dom.itemLedgerEndDateInput.value = today;
    dom.itemLedgerContentArea.innerHTML = '<p class="text-center info-message info">Zgjidhni një produkt dhe periudhën për të parë kartelën.</p>';
    if(dom.exportItemLedgerPdfBtn) dom.exportItemLedgerPdfBtn.disabled = true;
    if(dom.printItemLedgerBtn) dom.printItemLedgerBtn.disabled = true;
}

function populateItemLedgerProductSelect(): void {
    if (!dom.itemLedgerProductSelect) return;
    dom.itemLedgerProductSelect.innerHTML = '<option value="">-- Zgjidh Produktin --</option>';
    state.products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (Kodi: ${product.code}) (Stoku Aktual: ${product.stock})`;
        dom.itemLedgerProductSelect?.appendChild(option);
    });
}

function handleGenerateItemLedger(): void {
    if (!dom.itemLedgerProductSelect || !dom.itemLedgerStartDateInput || !dom.itemLedgerEndDateInput || !dom.itemLedgerContentArea) return;

    const productId = dom.itemLedgerProductSelect.value;
    const startDateStr = dom.itemLedgerStartDateInput.value;
    const endDateStr = dom.itemLedgerEndDateInput.value;

    if (!productId) {
        dom.itemLedgerContentArea.innerHTML = '<p class="error-message">Ju lutem zgjidhni një produkt.</p>';
        return;
    }
    if (!startDateStr || !endDateStr) {
        dom.itemLedgerContentArea.innerHTML = '<p class="error-message">Ju lutem zgjidhni periudhën e datave.</p>';
        return;
    }

    const product = state.products.find(p => p.id === productId);
    if (!product) {
        dom.itemLedgerContentArea.innerHTML = '<p class="error-message">Produkti i zgjedhur nuk u gjet.</p>';
        return;
    }

    dom.itemLedgerContentArea.innerHTML = '<p class="loading-message">Duke gjeneruar kartelën...</p>';

    const reportStartDate = new Date(startDateStr + "T00:00:00").getTime();
    const reportEndDate = new Date(endDateStr + "T23:59:59").getTime();
    
    let initialStockForPeriod = product.stock; 

    // Calculate stock going backwards from current stock to the start of the report period
    // Purchases increase stock, so if a purchase happened *after* or *on* reportStartDate, subtract its quantity
    state.purchaseInvoices.filter(inv => inv.timestamp >= reportStartDate).forEach(inv => {
        inv.items.forEach(item => {
            if (item.productId === productId) {
                initialStockForPeriod -= item.quantity;
            }
        });
    });

    // Sales decrease stock, so if a sale happened *after* or *on* reportStartDate, add back its quantity
    state.salesLog.filter(sale => sale.timestamp >= reportStartDate).forEach(sale => {
        sale.items.forEach(item => {
            if (item.isDeal && item.dealItems) {
                item.dealItems.forEach(dealSubItem => {
                    if (dealSubItem.productId === productId) {
                        initialStockForPeriod += (item.quantity * dealSubItem.quantity);
                    }
                });
            } else if (item.id === productId && !item.isDeal) {
                initialStockForPeriod += item.quantity;
            }
        });
    });
    
    // Local Sales also decrease stock
    state.localSalesInvoices.filter(inv => inv.timestamp >= reportStartDate).forEach(inv => {
        inv.items.forEach(item => {
            if (item.productId === productId) {
                initialStockForPeriod += item.quantity;
            }
        });
    });

    // Return Purchases decrease stock (goods go out), so if happened *after* reportStartDate, add back
    state.returnPurchaseInvoices.filter(inv => inv.timestamp >= reportStartDate).forEach(inv => {
        inv.items.forEach(item => {
            if (item.productId === productId) {
                initialStockForPeriod += item.quantity; // Add back as it was an outgoing
            }
        });
    });

    // Sales Returns increase stock, so if happened *after* reportStartDate, subtract
    state.salesReturnInvoices.filter(inv => inv.timestamp >= reportStartDate).forEach(inv => {
        inv.items.forEach(item => {
            if (item.productId === productId) {
                initialStockForPeriod -= item.quantityReturned;
            }
        });
    });
    
    // Initial Stock / Stock Corrections from DailyCashLog also affect stock
    state.dailyCashLog.filter(entry => entry.timestamp >= reportStartDate).forEach(entry => {
        entry.productStockUpdates?.forEach(update => {
            if (update.productId === productId) {
                 initialStockForPeriod -= (update.newStock - update.oldStock); // Reverse the change
            }
        });
    });

    // Production Orders
    state.productionOrders.filter(order => order.status === 'Completed' && order.completedAt && order.completedAt >= reportStartDate)
        .forEach(order => {
            // If the current product is the final product of this order, reverse the incoming stock
            if (order.finalProductId === productId) {
                const actualYield = order.quantityToProduce - (order.lostQuantity || 0);
                initialStockForPeriod -= actualYield;
            }

            // If the current product is an ingredient in this order, reverse the outgoing stock
            const recipe = state.recipes.find(r => r.id === order.recipeId);
            if (recipe) {
                const ingredient = recipe.ingredients.find(ing => ing.productId === productId);
                if (ingredient) {
                    initialStockForPeriod += (ingredient.quantity * order.quantityToProduce);
                }
            }
        });
    
    const ledgerEntries: LedgerEntry[] = [];

    // Initial Stock / Stock Corrections (from DailyCashLog)
    state.dailyCashLog.filter(entry => entry.timestamp >= reportStartDate && entry.timestamp <= reportEndDate).forEach(entry => {
        entry.productStockUpdates?.forEach(update => {
            if (update.productId === productId) {
                const change = update.newStock - update.oldStock;
                ledgerEntries.push({
                    date: entry.timestamp,
                    displayDate: new Date(entry.date + "T00:00:00").toLocaleDateString('sq-AL'),
                    type: `Stok Fillestar/Korrigjim (${entry.shift})`,
                    documentNumber: `DE-${entry.date}-${entry.sellerUsername.slice(0,3)}`,
                    incoming: change > 0 ? change : 0,
                    outgoing: change < 0 ? Math.abs(change) : 0,
                    balance: 0, // To be calculated later
                    description: `Hapur nga: ${entry.openedByManagerUsername}`
                });
            }
        });
    });

    // POS Sales Records
    state.salesLog.filter(sale => sale.timestamp >= reportStartDate && sale.timestamp <= reportEndDate).forEach(sale => {
        sale.items.forEach(item => {
            if (item.isDeal && item.dealItems) {
                // This sale item is a deal
                item.dealItems.forEach(dealSubItem => {
                    if (dealSubItem.productId === product.id) { // If current product is part of this deal
                        const outgoingQuantity = item.quantity * dealSubItem.quantity; // Corrected logic
                        ledgerEntries.push({
                            date: sale.timestamp,
                            displayDate: new Date(sale.timestamp).toLocaleDateString('sq-AL'),
                            type: `Shitje (POS - Ofertë: ${item.name})`, // More descriptive
                            documentNumber: sale.invoiceNumber,
                            incoming: 0,
                            outgoing: outgoingQuantity, // Use the calculated quantity
                            balance: 0, // To be calculated later
                            description: `Klienti: ${sale.customerName || 'Standard'}, Shitësi: ${sale.sellerUsername}`
                        });
                    }
                });
            } else if (item.id === product.id && !item.isDeal) {
                // Regular product sale
                ledgerEntries.push({
                    date: sale.timestamp,
                    displayDate: new Date(sale.timestamp).toLocaleDateString('sq-AL'),
                    type: 'Shitje (POS)',
                    documentNumber: sale.invoiceNumber,
                    incoming: 0,
                    outgoing: item.quantity, // Quantity of the product itself
                    balance: 0, // To be calculated later
                    description: `Klienti: ${sale.customerName || 'Standard'}, Shitësi: ${sale.sellerUsername}`
                });
            }
        });
    });
    
    // Local Sales Invoices
    state.localSalesInvoices.filter(inv => inv.timestamp >= reportStartDate && inv.timestamp <= reportEndDate).forEach(inv => {
        inv.items.forEach(item => {
            if (item.productId === productId) {
                ledgerEntries.push({
                    date: inv.timestamp,
                    displayDate: new Date(inv.invoiceDate + "T00:00:00").toLocaleDateString('sq-AL'),
                    type: 'Shitje Vendore',
                    documentNumber: inv.id,
                    incoming: 0,
                    outgoing: item.quantity,
                    balance: 0, // To be calculated later
                    description: `Blerësi: ${inv.customerName || 'Standard'}, Regj. nga: ${inv.recordedByManagerUsername}`
                });
            }
        });
    });

    // Purchase Invoices
    state.purchaseInvoices.filter(inv => inv.timestamp >= reportStartDate && inv.timestamp <= reportEndDate).forEach(inv => {
        inv.items.forEach(item => {
            if (item.productId === productId) {
                ledgerEntries.push({
                    date: inv.timestamp,
                    displayDate: new Date(inv.receiptDate + "T00:00:00").toLocaleDateString('sq-AL'),
                    type: 'Blerje Vendore',
                    documentNumber: inv.id,
                    incoming: item.quantity,
                    outgoing: 0,
                    balance: 0, // To be calculated later
                    description: `Furnitori: ${inv.supplierName}`
                });
            }
        });
    });

    // Return Purchase Invoices
    state.returnPurchaseInvoices.filter(inv => inv.timestamp >= reportStartDate && inv.timestamp <= reportEndDate).forEach(inv => {
        inv.items.forEach(item => {
            if (item.productId === productId) {
                ledgerEntries.push({
                    date: inv.timestamp,
                    displayDate: new Date(inv.invoiceDate + "T00:00:00").toLocaleDateString('sq-AL'),
                    type: 'Kthim Blerje',
                    documentNumber: inv.id,
                    incoming: 0,
                    outgoing: Math.abs(item.quantity), // Quantity is positive but represents an outgoing from stock perspective
                    balance: 0, // To be calculated later
                    description: `Furnitori: ${inv.supplierName}`
                });
            }
        });
    });

    // Stock Adjustments
    state.stockAdjustments.filter(adj => 
        adj.productId === productId && 
        adj.timestamp >= reportStartDate && 
        adj.timestamp <= reportEndDate
    ).forEach(adj => {
        const difference = adj.newQuantity - adj.oldQuantity;
        ledgerEntries.push({
            date: adj.timestamp,
            displayDate: new Date(adj.timestamp).toLocaleDateString('sq-AL'),
            type: `Rregullim Stoku (${adj.adjustmentType})`,
            documentNumber: adj.id,
            incoming: difference > 0 ? difference : 0,
            outgoing: difference < 0 ? Math.abs(difference) : 0,
            balance: 0, // To be calculated later
            description: adj.notes
        });
    });
    
    // Add Sales Return Invoices to ledger entries
    state.salesReturnInvoices.filter(inv => inv.timestamp >= reportStartDate && inv.timestamp <= reportEndDate).forEach(inv => {
        inv.items.forEach(item => {
            if (item.productId === productId) {
                ledgerEntries.push({
                    date: inv.timestamp,
                    displayDate: new Date(inv.returnDate + "T00:00:00").toLocaleDateString('sq-AL'),
                    type: 'Kthim Shitje',
                    documentNumber: inv.id,
                    incoming: item.quantityReturned, // Incoming to stock
                    outgoing: 0,
                    balance: 0, // To be calculated later
                    description: `Blerësi: ${inv.customerName || 'Standard'}, Fakt. Origj: ${inv.originalSaleInvoiceNumber}`
                });
            }
        });
    });
    
    // Production Orders
    state.productionOrders.filter(order => order.status === 'Completed' && order.completedAt && order.completedAt >= reportStartDate && order.completedAt <= reportEndDate)
        .forEach(order => {
            // Entry for the finished good (incoming stock)
            if (order.finalProductId === productId) {
                const actualYield = order.quantityToProduce - (order.lostQuantity || 0);
                ledgerEntries.push({
                    date: order.completedAt!,
                    displayDate: new Date(order.completedAt!).toLocaleDateString('sq-AL'),
                    type: 'Prodhimi (Hyrje)',
                    documentNumber: order.id,
                    incoming: actualYield,
                    outgoing: 0,
                    balance: 0, // To be calculated later
                    description: `Prodhuar: ${order.finalProductName}${order.lostQuantity ? ` (Humbje: ${order.lostQuantity})` : ''}`
                });
            }
            
            // Entry for raw materials used (outgoing stock)
            const recipe = state.recipes.find(r => r.id === order.recipeId);
            if (recipe) {
                const ingredient = recipe.ingredients.find(ing => ing.productId === productId);
                if (ingredient) {
                    ledgerEntries.push({
                        date: order.completedAt!,
                        displayDate: new Date(order.completedAt!).toLocaleDateString('sq-AL'),
                        type: 'Prodhimi (Deduction)',
                        documentNumber: order.id,
                        incoming: 0,
                        outgoing: ingredient.quantity * order.quantityToProduce,
                        balance: 0, // To be calculated later
                        description: `Përdorur për: ${order.finalProductName}`
                    });
                }
            }
        });
    
    ledgerEntries.sort((a, b) => a.date - b.date);

    let currentBalance = initialStockForPeriod;
    ledgerEntries.forEach(entry => {
        currentBalance += entry.incoming;
        currentBalance -= entry.outgoing;
        entry.balance = currentBalance;
    });

    renderItemLedgerTable(ledgerEntries, initialStockForPeriod, product);
    
    if(dom.exportItemLedgerPdfBtn) dom.exportItemLedgerPdfBtn.disabled = ledgerEntries.length === 0 && initialStockForPeriod === product.stock && product.stock === 0; 
    if(dom.printItemLedgerBtn) dom.printItemLedgerBtn.disabled = ledgerEntries.length === 0 && initialStockForPeriod === product.stock && product.stock === 0; 
}

function renderItemLedgerTable(entries: LedgerEntry[], initialStock: number, product: Product): void {
    if (!dom.itemLedgerContentArea) return;

    const businessDetails = state.businessDetails;
    const businessName = businessDetails?.name || "Emri i Biznesit";
    const businessAddress = businessDetails?.address || "";
    const businessNipt = businessDetails?.nipt || "";
    const logoUrl = businessDetails?.logoUrl;

    let logoHtml = '';
    if (logoUrl) {
        logoHtml = `<div class="report-logo"><img src="${logoUrl}" alt="Logo e Biznesit"></div>`;
    }
    const startDateVal = dom.itemLedgerStartDateInput?.value ? new Date(dom.itemLedgerStartDateInput.value + "T00:00:00").toLocaleDateString('sq-AL') : 'N/A';
    const endDateVal = dom.itemLedgerEndDateInput?.value ? new Date(dom.itemLedgerEndDateInput.value + "T00:00:00").toLocaleDateString('sq-AL') : 'N/A';


    let tableHtml = `
        <div class="printable-area">
            <div class="print-header-info">
                ${logoHtml}
                <div class="report-business-details">
                    <h2 class="report-business-name">${businessName}</h2>
                    ${businessAddress ? `<p class="report-business-detail">${businessAddress}</p>` : ''}
                    ${businessNipt ? `<p class="report-business-detail">NIPT: ${businessNipt}</p>` : ''}
                </div>
                <div class="report-meta-info">
                     <h1>KARTELË ARTIKULLI</h1>
                     <p>Artikulli: <strong>${product.name} (Kodi: ${product.code})</strong></p>
                     <p>Periudha: <strong>${startDateVal} - ${endDateVal}</strong></p>
                </div>
            </div>
            
            <div class="report-table-container">
                <table class="admin-table item-ledger-table">
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Lloji i Dokumentit</th>
                            <th>Nr. Dokumentit</th>
                            <th>Përshkrimi</th>
                            <th class="text-right">Hyrje</th>
                            <th class="text-right">Dalje</th>
                            <th class="text-right">Gjendja</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>-</td>
                            <td colspan="2"><strong>Gjendja Fillestare e Periudhës</strong></td>
                            <td>Stoku në fillim të ${startDateVal}</td>
                            <td class="text-right">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right"><strong>${initialStock.toFixed(2)}</strong></td>
                        </tr>
    `;

    if (entries.length === 0) {
        tableHtml += `<tr><td colspan="7" class="text-center">Nuk ka lëvizje për këtë artikull në periudhën e zgjedhur.</td></tr>`;
    } else {
        entries.forEach(entry => {
            tableHtml += `
                <tr>
                    <td>${entry.displayDate}</td>
                    <td>${entry.type}</td>
                    <td>${entry.documentNumber}</td>
                    <td>${entry.description || '-'}</td>
                    <td class="text-right">${entry.incoming > 0 ? entry.incoming.toFixed(2) : '-'}</td>
                    <td class="text-right">${entry.outgoing > 0 ? entry.outgoing.toFixed(2) : '-'}</td>
                    <td class="text-right">${entry.balance.toFixed(2)}</td>
                </tr>
            `;
        });
    }

    tableHtml += `
                    </tbody>
                </table>
            </div>
            <div class="invoice-print-footer">
                 <p class="generation-time">Gjeneruar më: ${new Date().toLocaleString('sq-AL')}</p>
                 <div class="signatures-and-stamp-container">
                    <div class="signature-area">
                        <p class="signature-label">Përgatiti:</p>
                        <div class="signature-line"></div>
                    </div>
                    <div class="signature-area">
                        <p class="signature-label">Miratoi:</p>
                        <div class="signature-line"></div>
                    </div>
                </div>
            </div>
        </div> 
    `;
    dom.itemLedgerContentArea.innerHTML = tableHtml;
}


function handleExportItemLedger(format: 'pdf' | 'print') {
    if (!dom.itemLedgerContentArea || !dom.itemLedgerProductSelect || !dom.itemLedgerStartDateInput || !dom.itemLedgerEndDateInput) return;

    const productId = dom.itemLedgerProductSelect.value;
    const product = state.products.find(p => p.id === productId);
    if (!product) {
        alert("Zgjidhni një produkt së pari.");
        return;
    }

    const contentToPrint = dom.itemLedgerContentArea.querySelector('.printable-area');
    if (!contentToPrint || contentToPrint.innerHTML.includes("Nuk ka lëvizje")) {
        alert("Nuk ka të dhëna për të eksportuar/printuar.");
        return;
    }
    
    const reportTitle = `Kartela e Artikullit - ${product.name}`;
    
    if (dom.printPreviewContent && dom.printPreviewModalTitle) {
        dom.printPreviewContent.innerHTML = contentToPrint.innerHTML; 
        dom.printPreviewModalTitle.textContent = format === 'pdf' ? `Pamje PDF: ${reportTitle}` : `Shtyp: ${reportTitle}`;
        openPrintPreviewModal();
        if (format === 'pdf') {
            alert("Për të ruajtur si PDF, zgjidhni 'Ruaj si PDF' ose 'Save as PDF' nga dialogu i printimit.");
        }
    }
}