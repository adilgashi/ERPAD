/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from './dom';
import * as state from './state';
import * as toast from './toast';
import { showSuperAdminPanel } from '../superAdmin';
import { showManagerDashboardView } from '../manager/index';
import { SaleRecord, PurchaseInvoice, BusinessDetails, ReturnPurchaseInvoice, OutgoingPayment, SalesReturnInvoice, LocalSaleInvoice, ReportTypeEnum, PettyCashEntry, Customer } from '../models';
import * as seller from '../seller';
import { ReportType } from '../manager/reports';

// Theme management
export function initThemeToggle(): void {
    const themeToggleInput = document.getElementById('theme-toggle') as HTMLInputElement | null;
    if (!themeToggleInput) return;
    
    // Check for saved theme preference or use preferred color scheme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleInput.checked = true;
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggleInput.checked = false;
    }
    
    // Add event listener for theme toggle
    themeToggleInput.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    });
}

export * from '../manager/reports';

// --- Custom Confirmation Modal Logic ---
export function showCustomConfirm(message: string, onConfirm: () => void): void {
    if (!dom.customConfirmModal || !dom.customConfirmMessage || !dom.pageBlurOverlay) return;
    dom.customConfirmMessage.textContent = message;
    state.setCurrentOnConfirmCallback(onConfirm);
    dom.customConfirmModal.style.display = 'block';
    dom.pageBlurOverlay.classList.add('active');
}

export function closeCustomConfirmModal(): void {
    if (dom.customConfirmModal && dom.pageBlurOverlay) {
        dom.customConfirmModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('customConfirmModal')) {
            dom.pageBlurOverlay.classList.remove('active');
        }
    }
    state.setCurrentOnConfirmCallback(null);
}

// --- Print Preview Modal Logic ---
export function openPrintPreviewModal(): void {
    if (dom.printPreviewModal && dom.pageBlurOverlay) {
        dom.printPreviewModal.style.display = 'block';
        dom.pageBlurOverlay.classList.add('active');
    }
}

export function closePrintPreviewModal(): void {
    if (dom.printPreviewModal && dom.printPreviewContent && dom.pageBlurOverlay) {
        dom.printPreviewModal.style.display = 'none';
        dom.printPreviewContent.innerHTML = ''; 
        if (!isAnyOtherModalOrDropdownActive('printPreviewModal')) {
             dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

// --- Page Blur Overlay Specific Functions ---
export function showPageBlurOverlay(): void {
    if (dom.pageBlurOverlay) {
        dom.pageBlurOverlay.classList.add('active');
    }
}

export function hidePageBlurOverlay(): void {
    if (dom.pageBlurOverlay && !isAnyOtherModalOrDropdownActive(null)) {
        dom.pageBlurOverlay.classList.remove('active');
    }
}

export function isAnyOtherModalOrDropdownActive(currentModalIdToIgnore: string | null): boolean {
    const modals = [
        { id: 'paymentModal', element: dom.paymentModal },
        { id: 'clearSaleConfirmationModal', element: dom.clearSaleConfirmationModal },
        { id: 'sellerShiftSalesModal', element: dom.sellerShiftSalesModal },
        { id: 'startDayModal', element: dom.startDayModal },
        { id: 'editOpenCashEntryModal', element: dom.editOpenCashEntryModal },
        { id: 'reconciliationModal', element: dom.reconciliationModal },
        { id: 'changeClearSalePinModal', element: dom.changeClearSalePinModal },
        { id: 'userFormModal', element: dom.userFormModal },
        { id: 'productFormModal', element: dom.productFormModal },
        { id: 'categoryFormModal', element: dom.categoryFormModal },
        { id: 'itemTypeFormModal', element: dom.itemTypeFormModal },
        { id: 'dealFormModal', element: dom.dealFormModal },
        { id: 'customerFormModal', element: dom.customerFormModal },
        { id: 'supplierFormModal', element: dom.supplierFormModal },
        { id: 'localPurchaseDetailsModal', element: dom.localPurchaseDetailsModal },
        { id: 'returnPurchaseDetailsModal', element: dom.returnPurchaseDetailsModal },
        { id: 'outgoingPaymentDetailsModal', element: dom.outgoingPaymentDetailsModal },
        { id: 'changeCustomerModal', element: dom.changeCustomerModal },
        { id: 'addBusinessModal', element: dom.addBusinessModal },
        { id: 'subscriptionPackageFormModal', element: dom.subscriptionPackageFormModal },
        { id: 'customConfirmModal', element: dom.customConfirmModal },
        { id: 'printPreviewModal', element: dom.printPreviewModal },
        { id: 'salesReturnDetailsModal', element: dom.salesReturnDetailsModal },
        { id: 'creditNoteFormModal', element: dom.creditNoteFormModal },
        { id: 'debitNoteFormModal', element: dom.debitNoteFormModal },
        { id: 'recipeFormModal', element: dom.recipeFormModal },
        { id: 'productionOrderFormModal', element: dom.productionOrderFormModal },
        { id: 'productionStageFormModal', element: dom.productionStageFormModal },
        { id: 'productionRoutingFormModal', element: dom.productionRoutingFormModal },
        { id: 'pettyCashModal', element: dom.pettyCashModal },
    ];

    for (const modal of modals) {
        if (modal.id !== currentModalIdToIgnore && modal.element && modal.element.style.display !== 'none' && modal.element.style.display !== '') {
            return true;
        }
    }

    const dropdowns = [
        { id: 'customerDropdownPanel', element: dom.customerDropdownPanel },
        { id: 'srCustomerDropdownPanel', element: dom.srCustomerDropdownPanel },
        { id: 'cnCustomerDropdownPanel', element: dom.cnCustomerDropdownPanel }
    ];

    for (const dropdown of dropdowns) {
        if (dropdown.id !== currentModalIdToIgnore && dropdown.element && dropdown.element.style.display !== 'none' && dropdown.element.classList.contains('active')) {
            return true;
        }
    }
    
    return false;
}

export function showAppView(): void {
    if (!dom.authView || !dom.appRoot || !dom.sellerPosView || !dom.managerDashboardView || !dom.superAdminPanelView ||
        !state.currentUser || !dom.userGreetingElement || !dom.logoutBtn || !dom.sellerCashStatusContainer ||
        !dom.sellerInitialCashElement || !dom.sellerTotalSalesCashElement || !dom.sellerCurrentCashElement ||
        !dom.sellerDayStatusMessageElement || !dom.appTitleTextElement || !dom.customerSearchInput ||
        !dom.appHeaderElement || !dom.managerSidebarUserGreeting || !dom.managerSidebarLogoutContainer
    ) {
        console.error("UI elements missing for showAppView.");
        return;
    }

    dom.authView.style.display = 'none';
    dom.appRoot.style.display = 'flex'; 

    const originalLogoutBtnParent = document.getElementById('user-session-controls');

    dom.userGreetingElement.textContent = `Mirë se erdhe, ${state.currentUser.username}`;

    if (state.currentUser.isSuperAdmin) {
        showSuperAdminPanel();
    } else if (state.currentUser.role !== 'shites') {
        dom.appHeaderElement.style.display = 'none'; 
        
        if(dom.managerSidebarUserGreeting && dom.userGreetingElement) {
            dom.managerSidebarUserGreeting.textContent = dom.userGreetingElement.textContent;
            dom.managerSidebarUserGreeting.style.display = 'block'; 
        }
        dom.userGreetingElement.style.display = 'none'; 

        if(dom.managerSidebarLogoutContainer && dom.logoutBtn) {
            if (dom.logoutBtn.parentElement !== dom.managerSidebarLogoutContainer) {
                 dom.managerSidebarLogoutContainer.appendChild(dom.logoutBtn);
            }
            dom.managerSidebarLogoutContainer.style.display = 'block'; 
            dom.logoutBtn.style.display = 'block'; 
            dom.logoutBtn.classList.remove('btn-sm'); 
        }
        dom.sellerPosView.style.display = 'none';
        dom.superAdminPanelView.style.display = 'none';
        dom.managerDashboardView.style.display = 'flex'; 
        dom.sellerCashStatusContainer.style.display = 'none';
        showManagerDashboardView();
    } else { // This is for 'shites' role
        dom.appHeaderElement.style.display = 'flex'; 
        dom.userGreetingElement.style.display = 'inline'; 
        
        if (originalLogoutBtnParent && dom.logoutBtn && dom.logoutBtn.parentElement !== originalLogoutBtnParent) {
            originalLogoutBtnParent.appendChild(dom.logoutBtn); 
        }
        dom.logoutBtn.style.display = 'inline-flex'; 
        dom.logoutBtn.classList.add('btn-sm'); 

        if(dom.managerSidebarUserGreeting) {
            dom.managerSidebarUserGreeting.textContent = '';
            dom.managerSidebarUserGreeting.style.display = 'none';
        }
        if(dom.managerSidebarLogoutContainer) {
            dom.managerSidebarLogoutContainer.style.display = 'none';
        }
        dom.appHeaderElement.classList.add('app-header--seller-pos-active');
        dom.appTitleTextElement.textContent = state.businessDetails?.name || "Arka e Shitësit";
        dom.managerDashboardView.style.display = 'none';
        dom.superAdminPanelView.style.display = 'none';
        dom.sellerPosView.style.display = 'flex'; 
        
        const sellerId = state.currentUser.id;
        
        const activeEntry = state.dailyCashLog.find(
            entry => entry.sellerId === sellerId && !entry.isReconciled
        ) || null;

        state.setCurrentSellerDailyCashEntry(activeEntry);
        
        const isSellerDayActiveAndNotReconciled = !!activeEntry; 
        if (dom.customerSearchInput) dom.customerSearchInput.disabled = !isSellerDayActiveAndNotReconciled;
        if (dom.recordPettyCashBtn) dom.recordPettyCashBtn.disabled = !isSellerDayActiveAndNotReconciled;

        if (activeEntry) {
            dom.sellerInitialCashElement.textContent = activeEntry.initialCash.toFixed(2);
            const totalSales = state.salesLog.reduce((sum, sale) => {
                if (sale.sellerId === sellerId && sale.dailyCashEntryDate === activeEntry.date && sale.shift === activeEntry.shift) {
                    return sum + sale.grandTotal;
                }
                return sum;
            }, 0);
            state.setCurrentSellerTotalCashSales(totalSales);
            dom.sellerTotalSalesCashElement.textContent = totalSales.toFixed(2);

            const totalPettyCashForShift = state.pettyCashLog
                .filter(e => e.sellerId === sellerId && e.dailyCashEntryDate === activeEntry.date && e.shift === activeEntry.shift)
                .reduce((sum, entry) => sum + entry.amount, 0);

            dom.sellerCurrentCashElement.textContent = (activeEntry.initialCash + totalSales - totalPettyCashForShift).toFixed(2);

            const numberOfInvoices = state.salesLog.filter(
                sale => sale.sellerId === sellerId && 
                        sale.dailyCashEntryDate === activeEntry.date &&
                        sale.shift === activeEntry.shift
            ).length;
            
            dom.sellerDayStatusMessageElement.className = 'info-message success header-status-message';
            dom.sellerDayStatusMessageElement.textContent = `Arka është e hapur (${activeEntry.shift === "paradite" ? "Paradite" : "Masdite"}, Data: ${new Date(activeEntry.date + "T00:00:00").toLocaleDateString('sq-AL')}). (Fatura: ${numberOfInvoices})`;
            dom.sellerDayStatusMessageElement.style.display = 'block';
            dom.sellerCashStatusContainer.style.display = 'flex';
            
            if(dom.triggerCompleteSaleBtn) dom.triggerCompleteSaleBtn.disabled = false;
            if(dom.clearSaleBtn) dom.clearSaleBtn.disabled = false;

        } else {
            dom.sellerInitialCashElement.textContent = 'N/A';
            dom.sellerTotalSalesCashElement.textContent = '0.00';
            dom.sellerCurrentCashElement.textContent = 'N/A';
            state.setCurrentSellerTotalCashSales(0);
            
            dom.sellerDayStatusMessageElement.className = 'info-message error header-status-message';
            dom.sellerDayStatusMessageElement.textContent = 'Nuk ka arkë të hapur për sot. Kontaktoni menaxherin.';
            dom.sellerDayStatusMessageElement.style.display = 'block';
            dom.sellerCashStatusContainer.style.display = 'flex';

            if(dom.triggerCompleteSaleBtn) dom.triggerCompleteSaleBtn.disabled = true;
            if(dom.clearSaleBtn) dom.clearSaleBtn.disabled = true;
        }
        
        seller.renderProductsForSale();
        seller.renderSaleItems();    
        seller.updateTotals();       
        seller.populateSellerCustomerSelect();

    }
    updateAppTitle();
}

export function updateAppTitle(): void {
    let title = "Arka Elektronike"; 
    if (state.superAdminAppSettings?.mainAppName) {
        title = state.superAdminAppSettings.mainAppName;
    }

    let businessNameToDisplay = "";
    if (state.currentUser && !state.currentUser.isSuperAdmin) {
        businessNameToDisplay = state.businessDetails?.name || "";
    } else if (state.currentUser?.isSuperAdmin && state.currentManagingBusinessId) {
        const managedBusiness = state.businesses.find(b => b.id === state.currentManagingBusinessId);
        businessNameToDisplay = managedBusiness?.name || "";
    }

    let finalTitle = title;
    if (businessNameToDisplay && !state.currentUser?.isSuperAdmin && state.currentUser?.role !== 'shites') {
        if (title !== businessNameToDisplay) {
            finalTitle = `${businessNameToDisplay} - ${title}`;
        } else {
            finalTitle = businessNameToDisplay;
        }
    } else if (state.currentUser?.role === 'shites') {
        finalTitle = businessNameToDisplay || "Arka e Shitësit";
    } else if (state.currentUser?.isSuperAdmin && businessNameToDisplay) {
         finalTitle = `${businessNameToDisplay} - ${title} (Super Admin)`;
    } else if (state.currentUser?.isSuperAdmin) {
        finalTitle = `${title} (Super Admin)`;
    }

    document.title = finalTitle;
    if (dom.appTitleTextElement && dom.appHeaderElement && dom.appHeaderElement.style.display !== 'none') {
        if (state.currentUser?.role !== 'shites' || !dom.appHeaderElement?.classList.contains('app-header--seller-pos-active')) {
            dom.appTitleTextElement.textContent = finalTitle;
        }
    }
}

export function initUIEventListeners(): void {
    dom.customConfirmBtn?.addEventListener('click', () => {
        if (state.currentOnConfirmCallback) {
            state.currentOnConfirmCallback();
        }
        closeCustomConfirmModal();
    });
    dom.customCancelConfirmBtn?.addEventListener('click', closeCustomConfirmModal);
    dom.customConfirmModalCloseBtn?.addEventListener('click', closeCustomConfirmModal);

    // Initialize theme toggle
    initThemeToggle();

    // Initialize toast container
    toast.initToastContainer();
    dom.printPreviewModalCloseBtn?.addEventListener('click', closePrintPreviewModal);
    dom.cancelPrintPreviewBtn?.addEventListener('click', closePrintPreviewModal);
    dom.actualPrintFromPreviewBtn?.addEventListener('click', handleActualPrintFromPreview);
}

export function handleActualPrintFromPreview(): void {
    if (dom.printPreviewContent && dom.printPreviewContent.innerHTML.trim() !== "") {
        document.body.classList.add('print-active'); 
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Shtyp Dokumentin</title>');
            Array.from(document.styleSheets).forEach(styleSheet => {
                try {
                    if (styleSheet.cssRules && styleSheet.href?.includes('print.css')) { 
                        const rules = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('\n');
                        printWindow.document.write(`<style>${rules}</style>`);
                    } else if (styleSheet.href?.includes('print.css')) { 
                        printWindow.document.write(`<link rel="stylesheet" href="${styleSheet.href}" media="all">`);
                    }
                } catch (e) {
                    console.warn("Could not load stylesheet for printing:", styleSheet.href || 'inline style', e);
                }
            });
            printWindow.document.write('</head><body class="print-active">'); 
            printWindow.document.write(dom.printPreviewContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
                const removePrintActiveClass = () => document.body.classList.remove('print-active');
                if (printWindow.onafterprint !== undefined) {
                    printWindow.onafterprint = removePrintActiveClass;
                } else {
                    setTimeout(removePrintActiveClass, 2000);
                }
            }, 500); 
        } else {
            alert("Dritarja e printimit u bllokua. Ju lutem lejoni pop-ups për këtë faqe.");
            document.body.classList.remove('print-active');
        }
    } else {
        alert("Nuk ka përmbajtje për të shtypur në pamjen paraprake.");
        document.body.classList.remove('print-active');
    }
}

export function generatePrintableSalesReportHTML(
    sales: SaleRecord[], 
    period: string, 
    title: string, 
    context: 'todaysSales' | 'shiftReport' | 'general' = 'general',
    pettyCashEntries: PettyCashEntry[] = []
): string {
    const businessDetails = state.businessDetails;

    // Handle single invoice printing
    if (context === 'todaysSales' && sales.length === 1) {
        const sale = sales[0];
        const customer = sale.customerId ? state.customers.find(c => c.id === sale.customerId) : null;
        let itemsHtml = '';
        sale.items.forEach((item, index) => {
            itemsHtml += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}${item.isDeal ? ' (Ofertë)' : ''}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${item.price.toFixed(2)}</td>
                    <td class="text-right">${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
            `;
        });

        return `
            <div class="printable-invoice-area">
                <div class="invoice-header-print">
                    ${businessDetails?.logoUrl ? `<div class="invoice-logo"><img src="${businessDetails.logoUrl}" alt="Logo e Biznesit"></div>` : ''}
                    <div class="invoice-business-details">
                        <h2>${businessDetails?.name || ''}</h2>
                        <p>${businessDetails?.address || ''}</p>
                        <p>NIPT: ${businessDetails?.nipt || ''}</p>
                    </div>
                </div>
                <h1 class="invoice-title-print">${title}</h1>
                <div class="invoice-meta">
                    <p>Nr. Faturës: <strong>${sale.invoiceNumber}</strong></p>
                    <p>Data: <strong>${new Date(sale.timestamp).toLocaleString('sq-AL')}</strong></p>
                </div>
                <div class="invoice-parties">
                     <div class="invoice-seller-details">
                        <h3>Lëshuar Për:</h3>
                        <p><strong>${customer?.name || sale.customerName || 'Klient Standard'}</strong></p>
                         ${customer?.address ? `<p>Adresa: ${customer.address}</p>` : ''}
                        ${customer?.uniqueId ? `<p>NIPT/ID: ${customer.uniqueId}</p>` : ''}
                     </div>
                     <div class="invoice-issuer-details">
                        <h3>Lëshuar Nga:</h3>
                        <p>Shitësi: ${sale.sellerUsername}</p>
                        <p>Ndërrimi: ${sale.shift === 'paradite' ? 'Paradite' : 'Masdite'}</p>
                    </div>
                </div>
                <table class="invoice-items-table">
                    <thead>
                        <tr>
                            <th>Nr.</th>
                            <th>Artikulli</th>
                            <th class="text-right">Sasia</th>
                            <th class="text-right">Çmimi</th>
                            <th class="text-right">Vlera</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                    <tfoot>
                        <tr><td colspan="4" class="text-right strong">TOTALI:</td><td class="text-right strong">${sale.grandTotal.toFixed(2)} €</td></tr>
                    </tfoot>
                </table>
                 <div class="invoice-payment-details">
                    <p>Sasia e pranuar: ${(sale.amountReceived || 0).toFixed(2)} €</p>
                    <p>Kusuri: ${(sale.changeGiven || 0).toFixed(2)} €</p>
                 </div>
                <div class="invoice-thank-you-message">
                    <p>Faleminderit për blerjen!</p>
                     <p class="generation-time">Gjeneruar më: ${new Date().toLocaleString('sq-AL')}</p>
                </div>
            </div>
        `;
    }

    // Default behavior for sales reports with potential petty cash
    const headerHtml = generateReportHeaderHTML(title, `Periudha: ${period}`);
    let totalSales = 0;
    const salesRows = sales.map(sale => {
        totalSales += sale.grandTotal;
        const customerName = sale.customerName || (sale.customerId && state.customers.find(c=>c.id === sale.customerId)?.name) || 'Klient Standard';
        return `
            <tr>
                <td>${new Date(sale.timestamp).toLocaleString('sq-AL')}</td>
                <td>${sale.invoiceNumber}</td>
                <td>${customerName}</td>
                <td>${sale.sellerUsername}</td>
                <td class="text-right">${sale.grandTotal.toFixed(2)} €</td>
            </tr>
        `;
    }).join('');
    
    let salesTableHtml = `
        <div class="report-table-container">
            <h3 class="report-section-title" style="margin-top: 1rem;">Shitjet</h3>
            <table class="admin-table">
                <thead><tr><th>Data/Ora</th><th>Nr. Faturës</th><th>Blerësi</th><th>Shitësi</th><th class="text-right">Totali (€)</th></tr></thead>
                <tbody>${sales.length > 0 ? salesRows : `<tr><td colspan="5" class="text-center">Nuk ka shitje për këtë ndërrim.</td></tr>`}</tbody>
            </table>
        </div>`;

    let pettyCashHtml = '';
    let summaryFooterHtml = '';
    if (context === 'shiftReport') {
        const totalPettyCash = pettyCashEntries.reduce((sum, entry) => sum + entry.amount, 0);
        const netCash = totalSales - totalPettyCash;
        
        if (pettyCashEntries.length > 0) {
            const pettyCashRows = pettyCashEntries.map(entry => `
                <tr>
                    <td>${new Date(entry.timestamp).toLocaleString('sq-AL')}</td>
                    <td colspan="3">${entry.description}</td>
                    <td class="text-right cash-value negative">-${entry.amount.toFixed(2)} €</td>
                </tr>
            `).join('');
            pettyCashHtml = `
                <div class="report-table-container" style="margin-top: 1.5rem;">
                    <h3 class="report-section-title">Shpenzimet e Vogla (Petty Cash)</h3>
                    <table class="admin-table">
                        <thead><tr><th>Data/Ora</th><th colspan="3">Përshkrimi</th><th class="text-right">Shuma</th></tr></thead>
                        <tbody>${pettyCashRows}</tbody>
                    </table>
                </div>
            `;
        }

        summaryFooterHtml = `
            <div class="report-summary" style="margin-top: 2rem; padding: 1rem;">
                <p style="display: flex; justify-content: space-between;"><span>TOTALI I SHITJEVE:</span> <strong>${totalSales.toFixed(2)} €</strong></p>
                <p style="display: flex; justify-content: space-between;"><span>TOTALI I SHPENZIMEVE:</span> <strong class="cash-value negative">-${totalPettyCash.toFixed(2)} €</strong></p>
                <hr style="border-top: 1px solid #ccc; margin: 0.5rem 0;">
                <p style="display: flex; justify-content: space-between; font-size: 1.2em;"><strong>TOTALI NETO I ARKËS:</strong> <strong>${netCash.toFixed(2)} €</strong></p>
            </div>
        `;
    } else {
        summaryFooterHtml = `
             <div class="report-summary" style="margin-top: 2rem; padding: 1rem; text-align: right;">
                 <p style="font-size: 1.2em;"><strong>TOTALI I PËRGJITHSHËM:</strong> <strong>${totalSales.toFixed(2)} €</strong></p>
             </div>
        `;
    }
        
    return `<div class="printable-area">${headerHtml}${salesTableHtml}${pettyCashHtml}${summaryFooterHtml}${generateReportFooterHTML()}</div>`;
}



export function generatePrintablePurchaseInvoiceHTML(invoice: PurchaseInvoice, businessDetails: BusinessDetails | null): string {
    let itemsHtml = '';
    invoice.items.forEach((item, index) => {
        itemsHtml += `
            <tr>
                <td>${index + 1}</td>
                <td>${item.productCode}</td>
                <td>${item.productName}</td>
                <td class="text-right">${item.quantity.toFixed(2)}</td>
                <td class="text-right">${item.purchasePriceWithoutVAT.toFixed(2)}</td>
                <td class="text-right">${item.vatRate.toFixed(2)}%</td>
                <td class="text-right">${item.purchasePriceWithVAT.toFixed(2)}</td>
                <td class="text-right">${item.totalValueWithVAT.toFixed(2)}</td>
            </tr>
        `;
    });

    return `
        <div class="printable-invoice-area">
            <div class="invoice-header-print">
                ${businessDetails?.logoUrl ? `<div class="invoice-logo"><img src="${businessDetails.logoUrl}" alt="Logo e Biznesit"></div>` : ''}
                <div class="invoice-business-details">
                    <h2>${businessDetails?.name || ''}</h2>
                    <p>${businessDetails?.address || ''}</p>
                    <p>NIPT: ${businessDetails?.nipt || ''}</p>
                </div>
            </div>
            <h1 class="invoice-title-print">FATURË BLERJEJE</h1>
            <div class="invoice-meta">
                <p>Nr. Sistemi: <strong>${invoice.id}</strong></p>
                <p>Nr. Furnitori: <strong>${invoice.supplierInvoiceNumber}</strong></p>
                <p>Data Faturës: <strong>${new Date(invoice.invoiceDate + 'T00:00:00').toLocaleDateString('sq-AL')}</strong></p>
                <p>Data Pranimit: <strong>${new Date(invoice.receiptDate + 'T00:00:00').toLocaleDateString('sq-AL')}</strong></p>
            </div>
            <div class="invoice-parties">
                 <div class="invoice-seller-details">
                    <h3>Furnitori:</h3>
                    <p><strong>${invoice.supplierName}</strong></p>
                     ${state.suppliers.find(s=>s.id === invoice.supplierId)?.address ? `<p>Adresa: ${state.suppliers.find(s=>s.id === invoice.supplierId)!.address}</p>` : ''}
                    ${state.suppliers.find(s=>s.id === invoice.supplierId)?.nipt ? `<p>NIPT: ${state.suppliers.find(s=>s.id === invoice.supplierId)!.nipt}</p>` : ''}
                 </div>
                 <div class="invoice-issuer-details">
                    <h3>Lëshuar Nga:</h3>
                     <p>${invoice.recordedByManagerUsername}</p>
                     <p>Data Regjistrimit: ${new Date(invoice.timestamp).toLocaleString('sq-AL')}</p>
                </div>
            </div>
            <table class="invoice-items-table">
                <thead>
                    <tr>
                        <th>Nr.</th>
                        <th>Kodi</th>
                        <th>Përshkrimi</th>
                        <th class="text-right">Sasia</th>
                        <th class="text-right">Çmimi (pa TVSH)</th>
                        <th class="text-right">TVSH (%)</th>
                        <th class="text-right">Çmimi (me TVSH)</th>
                        <th class="text-right">Vlera Tot. (me TVSH)</th>
                    </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                    <tr><td colspan="7" class="text-right strong">Nëntotali (pa TVSH):</td><td class="text-right strong">${invoice.totalAmountWithoutVAT.toFixed(2)} €</td></tr>
                    <tr><td colspan="7" class="text-right strong">Vlera e TVSH-së:</td><td class="text-right strong">${invoice.totalVATAmount.toFixed(2)} €</td></tr>
                    <tr><td colspan="7" class="text-right strong">TOTALI (me TVSH):</td><td class="text-right strong">${invoice.totalAmountWithVAT.toFixed(2)} €</td></tr>
                </tfoot>
            </table>
            <div class="invoice-print-footer">
                 <p class="generation-time">Gjeneruar më: ${new Date().toLocaleString('sq-AL')}</p>
            </div>
        </div>
    `;
}

export function generatePrintableOutgoingPaymentHTML(payment: OutgoingPayment, businessDetails: BusinessDetails | null): string {
    let allocationsHtml = '';
    if (payment.allocations.length > 0) {
        allocationsHtml += '<h3>Alokimet e Pagesës</h3><table class="invoice-items-table" style="margin-top: 1rem;"><thead><tr><th>Nr. Faturës së Blerjes</th><th class="text-right">Shuma e Alokuar</th></tr></thead><tbody>';
        payment.allocations.forEach(alloc => {
            allocationsHtml += `
                <tr>
                    <td>${alloc.purchaseInvoiceId}</td>
                    <td class="text-right">${alloc.allocatedAmount.toFixed(2)} €</td>
                </tr>
            `;
        });
        allocationsHtml += '</tbody></table>';
    } else {
        allocationsHtml = '<p>Kjo pagesë nuk është alokuar në asnjë faturë specifike.</p>';
    }

    return `
         <div class="printable-invoice-area">
            <div class="invoice-header-print">
                 ${businessDetails?.logoUrl ? `<div class="invoice-logo"><img src="${businessDetails.logoUrl}" alt="Logo e Biznesit"></div>` : ''}
                <div class="invoice-business-details">
                    <h2>${businessDetails?.name || ''}</h2>
                    <p>${businessDetails?.address || ''}</p>
                    <p>NIPT: ${businessDetails?.nipt || ''}</p>
                </div>
            </div>
            <h1 class="invoice-title-print">DËFTESË PAGESE (DALËSE)</h1>
            <div class="invoice-meta">
                <p>Nr. Pagesës: <strong>${payment.id}</strong></p>
                <p>Data e Pagesës: <strong>${new Date(payment.paymentDate + 'T00:00:00').toLocaleDateString('sq-AL')}</strong></p>
            </div>
            <div class="invoice-parties">
                 <div class="invoice-seller-details">
                    <h3>Për Furnitorin:</h3>
                    <p><strong>${payment.supplierName}</strong></p>
                 </div>
                 <div class="invoice-issuer-details">
                    <h3>Pagesa Totale:</h3>
                    <p class="large-stat" style="font-size: 1.5rem; color: #dc3545;">${payment.totalPaidAmount.toFixed(2)} €</p>
                    <p><strong>Mënyra:</strong> ${payment.paymentMethod}</p>
                    ${payment.reference ? `<p><strong>Referenca:</strong> ${payment.reference}</p>` : ''}
                </div>
            </div>
            ${payment.notes ? `<div class="invoice-notes"><h4>Shënime:</h4><p>${payment.notes}</p></div>` : ''}
            ${allocationsHtml}
            <div class="signatures-and-stamp-container" style="margin-top: 4rem;">
                <div class="signature-area">
                    <p class="signature-label">Përgatiti:</p>
                    <div class="signature-line"></div>
                    <p>${payment.recordedByManagerUsername}</p>
                </div>
                <div class="signature-area">
                    <p class="signature-label">Pranoi Pagesën (Nënshkrimi):</p>
                    <div class="signature-line"></div>
                </div>
            </div>
            <div class="invoice-thank-you-message">
                 <p class="generation-time">Gjeneruar më: ${new Date().toLocaleString('sq-AL')}</p>
            </div>
        </div>
    `;
}

export function generateSelectFilterHTML(id: string, label: string, options: { value: string, text: string }[] = [], selectedValue?: any): string {
    const optionsHtml = options.map(opt => `<option value="${opt.value}" ${selectedValue === opt.value ? 'selected' : ''}>${opt.text}</option>`).join('');
    return `
        <div class="form-group filter-group">
            <label for="${id}">${label}</label>
            <select id="${id}" class="form-control">
                <option value="">-- Të gjitha --</option>
                ${optionsHtml}
            </select>
        </div>
    `;
}

export function generateReportHeaderHTML(title: string, period: string): string {
    const businessDetails = state.businessDetails;
    const businessName = businessDetails?.name || "Emri i Biznesit";
    const businessAddress = businessDetails?.address || "";
    const businessNipt = businessDetails?.nipt || "";
    const logoUrl = businessDetails?.logoUrl;
    let logoHtml = '';
    if (logoUrl) {
        logoHtml = `<div class="report-logo"><img src="${logoUrl}" alt="Logo e Biznesit"></div>`;
    }
    
    return `
        <div class="print-header-info">
            ${logoHtml}
            <div class="report-business-details">
                <h2 class="report-business-name">${businessName}</h2>
                ${businessAddress ? `<p class="report-business-detail">${businessAddress}</p>` : ''}
                ${businessNipt ? `<p class="report-business-detail">NIPT: ${businessNipt}</p>` : ''}
            </div>
            <div class="report-meta-info">
                <h1>${title}</h1>
                <p>${period}</p>
            </div>
        </div>
    `;
}

export function generateReportFooterHTML(): string {
    return `
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
    `;
}

export const reportCategories = [
    { id: 'sales_reports', name: 'Raportet e Shitjeve', containerId: 'sales-reports-category-tiles', reports: [
        { type: ReportTypeEnum.TodaysSales, name: "Shitjet e Sotme" },
        { type: ReportTypeEnum.DetailedDailySales, name: "Shitjet Ditore të Detajuara" },
        { type: ReportTypeEnum.MonthlySales, name: "Shitjet Mujore" },
        { type: ReportTypeEnum.GeneralSales, name: "Shitjet e Përgjithshme" },
        { type: ReportTypeEnum.SalesByProduct, name: "Shitjet sipas Produkteve" },
        { type: ReportTypeEnum.SalesByCategory, name: "Shitjet sipas Kategorive" },
        { type: ReportTypeEnum.SalesByCustomer, name: "Shitjet sipas Blerësve" },
        { type: ReportTypeEnum.SalesBySeller, name: "Shitjet sipas Shitësve" },
        { type: ReportTypeEnum.MonthlySalesComparison, name: "Krahasimi i Shitjeve Mujore" },
        { type: ReportTypeEnum.TopSellingProducts, name: "Produktet më të Shiturat" },
    ]},
    { id: 'purchases_reports', name: 'Raportet e Blerjeve', containerId: 'purchases-reports-category-tiles', reports: [
        { type: ReportTypeEnum.LocalPurchasesDetailed, name: "Blerjet Vendore të Detajuara" },
        { type: ReportTypeEnum.PurchasesBySupplier, name: "Blerjet sipas Furnitorëve" },
        { type: ReportTypeEnum.PurchasesByProduct, name: "Blerjet sipas Produkteve" },
    ]},
    { id: 'production_reports', name: 'Raportet e Prodhimit', containerId: 'production-reports-category-tiles', reports: [
        { type: ReportTypeEnum.RecipeListReport, name: "Lista e Recetave (BOM)" },
        { type: ReportTypeEnum.ProductionOrdersReport, name: "Raporti i Urdhërave të Prodhimit" },
        { type: ReportTypeEnum.DetailedProductionReport, name: "Raporti i Detajuar i Prodhimit" },
    ]},
    { id: 'returns_reports', name: 'Raportet e Kthimeve', containerId: 'returns-reports-category-tiles', reports: [
        { type: ReportTypeEnum.ReturnPurchasesReport, name: "Raporti i Kthimeve të Blerjeve" },
        { type: ReportTypeEnum.SalesReturnsReport, name: "Raporti i Kthimeve të Shitjeve" },
    ]},
    { id: 'notes_reports', name: 'Raportet e Notave', containerId: 'notes-reports-category-tiles', reports: [
        { type: ReportTypeEnum.CreditNotesReport, name: "Raporti i Notave të Kreditit" },
        { type: ReportTypeEnum.DebitNotesReport, name: "Raporti i Notave të Debitit" },
    ]},
    { id: 'cash_reports', name: 'Raportet e Arkës', containerId: 'cash-reports-category-tiles', reports: [
        { type: ReportTypeEnum.ReconciliationReport, name: "Raporti i Barazimit të Arkës" },
        { type: ReportTypeEnum.CashFlowStatement, name: "Pasqyra e Rrjedhës së Parave" },
    ]},
    { id: 'logs', name: 'Regjistrat e Sistemit', containerId: 'logs-category-tiles', reports: [
        { type: ReportTypeEnum.ClearedSalesLog, name: "Regjistri i Shitjeve të Pastruara" },
    ]}
];