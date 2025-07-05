/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { SaleItem } from '../models';
import { getTodayDateString } from '../core/utils';

export function renderDashboardSummary() {
    if (!state.currentManagingBusinessId) return;
    
    console.log("Rendering dashboard summary...");
    
    const container = dom.managerContentDashboard;
    if (!container) return;
    
    // Add inline styles
    const styleElement = document.createElement('style');
    styleElement.textContent = `
    .dashboard-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }
    
    .dashboard-card {
        background-color: #fff;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        padding: 20px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .dashboard-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    
    .dashboard-card h3 {
        margin-top: 0;
        color: #333;
        font-size: 1.2rem;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
        margin-bottom: 15px;
    }
    
    .stat-value {
        font-size: 2rem;
        font-weight: bold;
        color: #4f46e5;
        margin: 10px 0;
    }
    
    .stat-label {
        color: #666;
        font-size: 0.9rem;
    }
    
    .shifts-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }
    
    .shifts-list li {
        padding: 10px;
        border-bottom: 1px solid #eee;
    }
    
    .shifts-list li:last-child {
        border-bottom: none;
    }
    `;
    document.head.appendChild(styleElement);
    
    // Create simple dashboard HTML
    container.innerHTML = `
        <h2 class="manager-section-title">Përmbledhje & Njoftime</h2>
        
        <div class="dashboard-container">
            <div class="dashboard-card">
                <h3>Abonimi</h3>
                <div id="subscription-info">
                    <p>Paketa: <span id="dash-sub-package-name">Duke ngarkuar...</span></p>
                    <p>Skadon më: <span id="dash-sub-expiry-date">Duke ngarkuar...</span></p>
                    <p>Statusi: <span id="dash-sub-status" class="status-badge">Duke ngarkuar...</span></p>
                </div>
            </div>
            
            <div class="dashboard-card">
                <h3>Shitjet e Sotme</h3>
                <div class="stat-value" id="dashboard-today-sales-total">0.00 €</div>
                <div class="stat-label" id="dashboard-today-sales-count">0 Fatura</div>
            </div>
            
            <div class="dashboard-card">
                <h3>Ndërrime Aktive</h3>
                <div class="stat-value" id="dash-open-shifts-count">0</div>
                <div id="dashboard-open-shifts-summary"></div>
            </div>
            
            <div class="dashboard-card">
                <h3>Produkti më i Shitur</h3>
                <div id="dash-top-product-name">Duke ngarkuar...</div>
                <div class="stat-value" id="dash-top-product-revenue">0.00 €</div>
                <div class="stat-label" id="dash-top-product-quantity">0 copë</div>
            </div>
            
            <div class="dashboard-card">
                <h3>Blerësi më Aktiv</h3>
                <div id="dash-top-customer-name">Duke ngarkuar...</div>
                <div class="stat-value" id="dash-top-customer-spent">0.00 €</div>
            </div>
            
            <div class="dashboard-card">
                <h3>Shitësi më i Mirë</h3>
                <div id="dash-top-seller-name">Duke ngarkuar...</div>
                <div class="stat-value" id="dash-top-seller-sales">0.00 €</div>
            </div>
        </div>
    `;
    
    // Update data
    updateDashboardData();
}

function updateDashboardData() {
    // Subscription Status
    const currentBusiness = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (currentBusiness) {
        if (currentBusiness.subscriptionPackageId && currentBusiness.subscriptionEndDate) {
            const pkg = state.subscriptionPackages.find(p => p.id === currentBusiness.subscriptionPackageId); 
            const endDate = new Date(currentBusiness.subscriptionEndDate);
            const now = new Date();
            const isActiveSub = endDate > now;

            const dashSubPackageNameEl = document.getElementById('dash-sub-package-name');
            const dashSubExpiryDateEl = document.getElementById('dash-sub-expiry-date');
            const dashSubStatusEl = document.getElementById('dash-sub-status');

            if (dashSubPackageNameEl) {
                dashSubPackageNameEl.textContent = pkg ? pkg.name : `ID: ${currentBusiness.subscriptionPackageId}`;
            }
            if (dashSubExpiryDateEl) {
                dashSubExpiryDateEl.textContent = endDate.toLocaleDateString('sq-AL');
            }
            if (dashSubStatusEl) {
                dashSubStatusEl.textContent = isActiveSub ? "Aktiv" : "Skaduar";
                dashSubStatusEl.className = `status-badge ${isActiveSub ? 'active' : 'inactive'}`;
            }
        }
    }
    
    // Today's Sales
    const today = getTodayDateString();
    const todaysSales = state.salesLog.filter(sale => sale.dailyCashEntryDate === today && sale.businessId === state.currentManagingBusinessId);
    const todaysTotalSalesAmount = todaysSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
    
    const todaySalesTotalEl = document.getElementById('dashboard-today-sales-total');
    const todaySalesCountEl = document.getElementById('dashboard-today-sales-count');
    
    if (todaySalesTotalEl) todaySalesTotalEl.textContent = `${todaysTotalSalesAmount.toFixed(2)} €`;
    if (todaySalesCountEl) todaySalesCountEl.textContent = `${todaysSales.length} Fatura`;
    
    // Open Shifts
    const openShiftsDiv = document.getElementById('dashboard-open-shifts-summary');
    const openShiftsCountEl = document.getElementById('dash-open-shifts-count');

    if (openShiftsDiv && openShiftsCountEl) {
        openShiftsDiv.innerHTML = '';
        const unreconciledEntries = state.dailyCashLog.filter(entry => !entry.isReconciled && entry.businessId === state.currentManagingBusinessId);
        openShiftsCountEl.textContent = unreconciledEntries.length.toString();

        if (unreconciledEntries.length > 0) {
            const list = document.createElement('ul');
            list.className = 'shifts-list';
            unreconciledEntries.slice(0, 5).forEach(entry => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <strong>${entry.sellerUsername}</strong> - ${new Date(entry.date + "T00:00:00").toLocaleDateString('sq-AL')} (${entry.shift === 'paradite' ? 'Paradite' : 'Masdite'})
                `;
                list.appendChild(listItem);
            });
            openShiftsDiv.appendChild(list);
        } else {
            openShiftsDiv.innerHTML = '<p>Nuk ka arka të hapura aktualisht.</p>';
        }
    }
    
    // Top Product
    const productSalesToday: { [productId: string]: { name: string, quantity: number, revenue: number } } = {};
    todaysSales.forEach(sale => {
        sale.items.forEach(item => {
            const key = item.isDeal ? item.id : item.id;
            if (!productSalesToday[key]) {
                productSalesToday[key] = { name: item.name, quantity: 0, revenue: 0 };
            }
            productSalesToday[key].quantity += item.quantity;
            productSalesToday[key].revenue += item.quantity * item.price;
        });
    });
    
    const topProductArr = Object.values(productSalesToday).sort((a, b) => b.revenue - a.revenue);
    const topProductNameEl = document.getElementById('dash-top-product-name');
    const topProductQuantityEl = document.getElementById('dash-top-product-quantity');
    const topProductRevenueEl = document.getElementById('dash-top-product-revenue');
    
    if (topProductArr.length > 0) {
        if (topProductNameEl) topProductNameEl.textContent = topProductArr[0].name;
        if (topProductQuantityEl) topProductQuantityEl.textContent = `${topProductArr[0].quantity} copë`;
        if (topProductRevenueEl) topProductRevenueEl.textContent = `${topProductArr[0].revenue.toFixed(2)} €`;
    } else {
        if (topProductNameEl) topProductNameEl.textContent = "N/A";
        if (topProductQuantityEl) topProductQuantityEl.textContent = "0 copë";
        if (topProductRevenueEl) topProductRevenueEl.textContent = "0.00 €";
    }
    
    // Top Customer
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
    const topCustomerNameEl = document.getElementById('dash-top-customer-name');
    const topCustomerSpentEl = document.getElementById('dash-top-customer-spent');
    
    if (topCustomerArr.length > 0) {
        if (topCustomerNameEl) topCustomerNameEl.textContent = topCustomerArr[0].name;
        if (topCustomerSpentEl) topCustomerSpentEl.textContent = `${topCustomerArr[0].spent.toFixed(2)} €`;
    } else {
        if (topCustomerNameEl) topCustomerNameEl.textContent = "N/A";
        if (topCustomerSpentEl) topCustomerSpentEl.textContent = "0.00 €";
    }
    
    // Top Seller
    const sellerSalesToday: { [sellerId: string]: { name: string, salesValue: number } } = {};
    todaysSales.forEach(sale => {
        if (!sellerSalesToday[sale.sellerId]) {
            sellerSalesToday[sale.sellerId] = { name: sale.sellerUsername, salesValue: 0 };
        }
        sellerSalesToday[sale.sellerId].salesValue += sale.grandTotal;
    });
    
    const topSellerArr = Object.values(sellerSalesToday).sort((a,b) => b.salesValue - a.salesValue);
    const topSellerNameEl = document.getElementById('dash-top-seller-name');
    const topSellerSalesEl = document.getElementById('dash-top-seller-sales');
    
    if (topSellerArr.length > 0) {
        if (topSellerNameEl) topSellerNameEl.textContent = topSellerArr[0].name;
        if (topSellerSalesEl) topSellerSalesEl.textContent = `${topSellerArr[0].salesValue.toFixed(2)} €`;
    } else {
        if (topSellerNameEl) topSellerNameEl.textContent = "N/A";
        if (topSellerSalesEl) topSellerSalesEl.textContent = "0.00 €";
    }
}