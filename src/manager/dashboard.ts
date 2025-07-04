
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { SaleItem } from '../models';
import { getTodayDateString } from '../core/utils'; // Import for today's date

export function renderDashboardSummary() {
    if (!state.currentManagingBusinessId) return;

    // Subscription Status Elements
    const dashSubPackageNameEl = document.getElementById('dash-sub-package-name');
    const dashSubExpiryDateEl = document.getElementById('dash-sub-expiry-date');
    const dashSubStatusEl = document.getElementById('dash-sub-status');

    // Sales Summary Elements
    const todaySalesTotalEl = document.getElementById('dashboard-today-sales-total');
    const todaySalesCountEl = document.getElementById('dashboard-today-sales-count');
    const topProductNameEl = document.getElementById('dash-top-product-name');
    const topProductQuantityEl = document.getElementById('dash-top-product-quantity');
    const topProductRevenueEl = document.getElementById('dash-top-product-revenue');
    const topCustomerNameEl = document.getElementById('dash-top-customer-name');
    const topCustomerSpentEl = document.getElementById('dash-top-customer-spent');
    const topSellerNameEl = document.getElementById('dash-top-seller-name');
    const topSellerSalesEl = document.getElementById('dash-top-seller-sales');
    const overallSalesTotalEl = document.getElementById('dashboard-overall-sales-total');
    const overallSalesCountEl = document.getElementById('dashboard-overall-sales-count');
    const overallPurchasesTotalEl = document.getElementById('dashboard-overall-purchases-total');
    const overallPurchasesCountEl = document.getElementById('dashboard-overall-purchases-count');


    // Subscription Status
    const currentBusiness = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (currentBusiness) {
        if (currentBusiness.subscriptionPackageId && currentBusiness.subscriptionEndDate) {
            const pkg = state.subscriptionPackages.find(p => p.id === currentBusiness.subscriptionPackageId); 
            const endDate = new Date(currentBusiness.subscriptionEndDate);
            const now = new Date();
            const isActiveSub = endDate > now;

            if (dashSubPackageNameEl) {
                if (pkg) {
                    dashSubPackageNameEl.textContent = pkg.name;
                } else {
                    dashSubPackageNameEl.textContent = `ID: ${currentBusiness.subscriptionPackageId} (E Pa Gjetur)`;
                }
            }
            if (dashSubExpiryDateEl) dashSubExpiryDateEl.textContent = endDate.toLocaleDateString('sq-AL');
            if (dashSubStatusEl) {
                dashSubStatusEl.textContent = isActiveSub ? "Aktiv" : "Skaduar";
                dashSubStatusEl.className = `status-badge ${isActiveSub ? 'active' : 'inactive'}`;
            }
        } else {
            if (dashSubPackageNameEl) dashSubPackageNameEl.textContent = "N/A";
            if (dashSubExpiryDateEl) dashSubExpiryDateEl.textContent = "N/A";
            if (dashSubStatusEl) {
                dashSubStatusEl.textContent = "Nuk Ka";
                dashSubStatusEl.className = 'status-badge inactive';
            }
        }
    } else {
        if (dashSubPackageNameEl) dashSubPackageNameEl.textContent = "Gabim Biznesi";
        if (dashSubExpiryDateEl) dashSubExpiryDateEl.textContent = "Gabim Biznesi";
        if (dashSubStatusEl) {
            dashSubStatusEl.textContent = "Gabim";
            dashSubStatusEl.className = 'status-badge inactive';
        }
    }

    // Today's Sales Summary
    const today = getTodayDateString();
    const todaysSales = state.salesLog.filter(sale => sale.dailyCashEntryDate === today && sale.businessId === state.currentManagingBusinessId);
    const todaysTotalSalesAmount = todaysSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
    if (todaySalesTotalEl) todaySalesTotalEl.textContent = `${todaysTotalSalesAmount.toFixed(2)} €`;
    if (todaySalesCountEl) todaySalesCountEl.textContent = `${todaysSales.length} Fatura`;

    // Top Product Today
    const productSalesToday: { [productId: string]: { name: string, quantity: number, revenue: number } } = {};
    todaysSales.forEach(sale => {
        sale.items.forEach(item => {
            const key = item.isDeal ? item.id : item.id; // Use deal ID or product ID
            if (!productSalesToday[key]) {
                productSalesToday[key] = { name: item.name, quantity: 0, revenue: 0 };
            }
            productSalesToday[key].quantity += item.quantity;
            productSalesToday[key].revenue += item.quantity * item.price;
        });
    });
    const topProductArr = Object.values(productSalesToday).sort((a, b) => b.revenue - a.revenue);
    if (topProductArr.length > 0) {
        if (topProductNameEl) topProductNameEl.textContent = topProductArr[0].name;
        if (topProductQuantityEl) topProductQuantityEl.textContent = topProductArr[0].quantity.toString();
        if (topProductRevenueEl) topProductRevenueEl.textContent = `${topProductArr[0].revenue.toFixed(2)} €`;
    } else {
        if (topProductNameEl) topProductNameEl.textContent = "N/A";
        if (topProductQuantityEl) topProductQuantityEl.textContent = "0";
        if (topProductRevenueEl) topProductRevenueEl.textContent = "0.00 €";
    }
    
    // Top Customer Today
    const customerSalesToday: { [customerId: string]: { name: string, spent: number } } = {};
    todaysSales.forEach(sale => {
        const customerKey = sale.customerId || 'STANDARD_CLIENT';
        const customerName = sale.customerName || (sale.customerId && state.customers.find(c=>c.id === sale.customerId)?.name) || 'Klient Standard';
        if (!customerSalesToday[customerKey]) {
            customerSalesToday[customerKey] = { name: customerName, spent: 0 };
        }
        customerSalesToday[customerKey].spent += sale.grandTotal;
    });
    const topCustomerArr = Object.values(customerSalesToday).sort((a,b) => b.spent - a.spent);
    if (topCustomerArr.length > 0) {
        if (topCustomerNameEl) topCustomerNameEl.textContent = topCustomerArr[0].name;
        if (topCustomerSpentEl) topCustomerSpentEl.textContent = `${topCustomerArr[0].spent.toFixed(2)} €`;
    } else {
        if (topCustomerNameEl) topCustomerNameEl.textContent = "N/A";
        if (topCustomerSpentEl) topCustomerSpentEl.textContent = "0.00 €";
    }
    
    // Top Seller Today
    const sellerSalesToday: { [sellerId: string]: { name: string, salesValue: number } } = {};
    todaysSales.forEach(sale => {
        if (!sellerSalesToday[sale.sellerId]) {
            sellerSalesToday[sale.sellerId] = { name: sale.sellerUsername, salesValue: 0 };
        }
        sellerSalesToday[sale.sellerId].salesValue += sale.grandTotal;
    });
    const topSellerArr = Object.values(sellerSalesToday).sort((a,b) => b.salesValue - a.salesValue);
     if (topSellerArr.length > 0) {
        if (topSellerNameEl) topSellerNameEl.textContent = topSellerArr[0].name;
        if (topSellerSalesEl) topSellerSalesEl.textContent = `${topSellerArr[0].salesValue.toFixed(2)} €`;
    } else {
        if (topSellerNameEl) topSellerNameEl.textContent = "N/A";
        if (topSellerSalesEl) topSellerSalesEl.textContent = "0.00 €";
    }

    // Overall Sales
    const allSalesForBusiness = state.salesLog.filter(sale => sale.businessId === state.currentManagingBusinessId);
    const overallTotalSalesAmount = allSalesForBusiness.reduce((sum, sale) => sum + sale.grandTotal, 0);
    if (overallSalesTotalEl) overallSalesTotalEl.textContent = `${overallTotalSalesAmount.toFixed(2)} €`;
    if (overallSalesCountEl) overallSalesCountEl.textContent = `${allSalesForBusiness.length} Fatura`;

    // Overall Purchases (Local Purchases)
    const allPurchasesForBusiness = state.purchaseInvoices.filter(inv => inv.businessId === state.currentManagingBusinessId);
    const overallTotalPurchasesAmount = allPurchasesForBusiness.reduce((sum, inv) => sum + inv.totalAmountWithVAT, 0);
    if (overallPurchasesTotalEl) overallPurchasesTotalEl.textContent = `${overallTotalPurchasesAmount.toFixed(2)} €`;
    if (overallPurchasesCountEl) overallPurchasesCountEl.textContent = `${allPurchasesForBusiness.length} Fatura`;


    // Open Shifts Summary
    const openShiftsDiv = document.getElementById('dashboard-open-shifts-summary');
    const openShiftsCountEl = document.getElementById('dash-open-shifts-count');

    if (openShiftsDiv && openShiftsCountEl) {
        openShiftsDiv.innerHTML = ''; // Clear previous content
        const unreconciledEntries = state.dailyCashLog.filter(entry => !entry.isReconciled && entry.businessId === state.currentManagingBusinessId)
                                              .sort((a,b) => b.timestamp - a.timestamp);
        openShiftsCountEl.textContent = unreconciledEntries.length.toString();

        if (unreconciledEntries.length > 0) {
            const list = document.createElement('ul');
            unreconciledEntries.slice(0, 5).forEach(entry => { // Show max 5 for brevity
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>${entry.sellerUsername}</strong> - ${new Date(entry.date + "T00:00:00").toLocaleDateString('sq-AL')} (${entry.shift === 'paradite' ? 'Paradite' : 'Masdite'})<br>
                    <small>Arka Fill.: ${entry.initialCash.toFixed(2)}€ | Hapur nga: ${entry.openedByManagerUsername}</small>
                `;
                list.appendChild(listItem);
            });
            openShiftsDiv.appendChild(list);
            if (unreconciledEntries.length > 5) {
                const moreInfo = document.createElement('p');
                moreInfo.textContent = `...dhe ${unreconciledEntries.length - 5} ndërrime të tjera të hapura.`;
                moreInfo.style.textAlign = 'center';
                moreInfo.style.fontSize = '0.8em';
                openShiftsDiv.appendChild(moreInfo);
            }
        } else {
            openShiftsDiv.innerHTML = '<p class="text-center" style="font-style: italic; color: #6c757d;">Nuk ka arka të hapura aktualisht.</p>';
        }
    }
}
