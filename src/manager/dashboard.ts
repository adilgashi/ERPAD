
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { SaleItem, SaleRecord } from '../models';
import { getTodayDateString } from '../core/utils'; // Import for today's date

export function renderDashboardSummary() {
    if (!state.currentManagingBusinessId) return;

    // Create dashboard container if it doesn't exist
    const dashboardContainer = document.getElementById('dashboard-container');
    if (!dashboardContainer) {
        createDashboardStructure();
    }

    updateSubscriptionWidget();
    updateSalesWidget();
    updateTopPerformersWidget();
    updateOpenShiftsWidget();
    updateInventoryWidget();
    updateFinancialSummaryWidget();
}

function createDashboardStructure() {
    const container = dom.managerContentDashboard;
    if (!container) return;
    
    container.innerHTML = `
        <h2 class="manager-section-title">Përmbledhje & Njoftime</h2>
        
        <div id="dashboard-container" class="dashboard-modern-layout">
            <!-- Top Row: Key Metrics -->
            <div class="dashboard-row">
                <div id="widget-subscription" class="dashboard-widget">
                    <div class="widget-header">
                        <div class="widget-icon-container">
                            <span class="widget-icon">⭐</span>
                        </div>
                        <h3>Abonimi</h3>
                    </div>
                    <div class="widget-content">
                        <div class="subscription-info">
                            <p>Paketa: <span id="dash-sub-package-name">Duke ngarkuar...</span></p>
                            <p>Skadon më: <span id="dash-sub-expiry-date">Duke ngarkuar...</span></p>
                            <p>Statusi: <span id="dash-sub-status" class="status-badge">Duke ngarkuar...</span></p>
                        </div>
                    </div>
                </div>
                
                <div id="widget-today-sales" class="dashboard-widget">
                    <div class="widget-header">
                        <div class="widget-icon-container">
                            <span class="widget-icon">💰</span>
                        </div>
                        <h3>Shitjet e Sotme</h3>
                    </div>
                    <div class="widget-content">
                        <div class="metric-large" id="dashboard-today-sales-total">0.00 €</div>
                        <div class="metric-small" id="dashboard-today-sales-count">0 Fatura</div>
                        <div id="today-sales-chart" class="chart-container small-chart-container"></div>
                    </div>
                </div>
                
                <div id="widget-open-shifts" class="dashboard-widget">
                    <div class="widget-header">
                        <div class="widget-icon-container">
                            <span class="widget-icon">🔄</span>
                        </div>
                        <h3>Ndërrime Aktive</h3>
                    </div>
                    <div class="widget-content">
                        <div class="metric-large" id="dash-open-shifts-count">0</div>
                        <div id="dashboard-open-shifts-summary" class="scrollable-content"></div>
                    </div>
                </div>
            </div>
            
            <!-- Middle Row: Top Performers -->
            <div class="dashboard-row">
                <div id="widget-top-product" class="dashboard-widget">
                    <div class="widget-header">
                        <div class="widget-icon-container">
                            <span class="widget-icon">🏆</span>
                        </div>
                        <h3>Produkti më i Shitur</h3>
                    </div>
                    <div class="widget-content">
                        <div class="top-item-name" id="dash-top-product-name">Duke ngarkuar...</div>
                        <div class="top-item-stats">
                            <div class="stat-item">
                                <span class="stat-label">Sasia:</span>
                                <span class="stat-value" id="dash-top-product-quantity">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Vlera:</span>
                                <span class="stat-value" id="dash-top-product-revenue">0.00 €</span>
                            </div>
                        </div>
                        <div id="top-product-chart" class="chart-container small-chart-container"></div>
                    </div>
                </div>
                
                <div id="widget-top-customer" class="dashboard-widget">
                    <div class="widget-header">
                        <div class="widget-icon-container">
                            <span class="widget-icon">👤</span>
                        </div>
                        <h3>Blerësi më Aktiv</h3>
                    </div>
                    <div class="widget-content">
                        <div class="top-item-name" id="dash-top-customer-name">Duke ngarkuar...</div>
                        <div class="top-item-stats">
                            <div class="stat-item">
                                <span class="stat-label">Shpenzuar:</span>
                                <span class="stat-value" id="dash-top-customer-spent">0.00 €</span>
                            </div>
                        </div>
                        <div id="top-customer-chart" class="chart-container small-chart-container"></div>
                    </div>
                </div>
                
                <div id="widget-top-seller" class="dashboard-widget">
                    <div class="widget-header">
                        <div class="widget-icon-container">
                            <span class="widget-icon">🥇</span>
                        </div>
                        <h3>Shitësi më i Mirë</h3>
                    </div>
                    <div class="widget-content">
                        <div class="top-item-name" id="dash-top-seller-name">Duke ngarkuar...</div>
                        <div class="top-item-stats">
                            <div class="stat-item">
                                <span class="stat-label">Shitjet:</span>
                                <span class="stat-value" id="dash-top-seller-sales">0.00 €</span>
                            </div>
                        </div>
                        <div id="top-seller-chart" class="chart-container small-chart-container"></div>
                    </div>
                </div>
            </div>
            
            <!-- Bottom Row: Financial Summary -->
            <div class="dashboard-row">
                <div id="widget-inventory-status" class="dashboard-widget">
                    <div class="widget-header">
                        <div class="widget-icon-container">
                            <span class="widget-icon">📦</span>
                        </div>
                        <h3>Gjendja e Inventarit</h3>
                    </div>
                    <div class="widget-content">
                        <div class="inventory-stats">
                            <div class="stat-item">
                                <span class="stat-label">Produkte Totale:</span>
                                <span class="stat-value" id="dash-total-products">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Produkte me Stok të Ulët:</span>
                                <span class="stat-value" id="dash-low-stock-products">0</span>
                            </div>
                        </div>
                        <div id="inventory-chart" class="chart-container"></div>
                    </div>
                </div>
                
                <div id="widget-financial-summary" class="dashboard-widget wide-widget">
                    <div class="widget-header">
                        <div class="widget-icon-container">
                            <span class="widget-icon">📊</span>
                        </div>
                        <h3>Përmbledhje Financiare</h3>
                    </div>
                    <div class="widget-content">
                        <div class="financial-metrics">
                            <div class="financial-metric-item">
                                <div class="metric-title">Shitjet Totale</div>
                                <div class="metric-value" id="dashboard-overall-sales-total">0.00 €</div>
                                <div class="metric-subtitle" id="dashboard-overall-sales-count">0 Fatura</div>
                            </div>
                            <div class="financial-metric-item">
                                <div class="metric-title">Blerjet Totale</div>
                                <div class="metric-value" id="dashboard-overall-purchases-total">0.00 €</div>
                                <div class="metric-subtitle" id="dashboard-overall-purchases-count">0 Fatura</div>
                            </div>
                            <div class="financial-metric-item">
                                <div class="metric-title">Bilanci</div>
                                <div class="metric-value" id="dashboard-balance">0.00 €</div>
                                <div class="metric-subtitle">Diferenca Shitje-Blerje</div>
                            </div>
                        </div>
                        <div id="financial-chart" class="chart-container"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Initialize charts after creating structure
    setTimeout(() => {
        initializeCharts();
    }, 100);
}

function updateSubscriptionWidget() {
    // Subscription Status Elements
    const dashSubPackageNameEl = document.getElementById('dash-sub-package-name');
    const dashSubExpiryDateEl = document.getElementById('dash-sub-expiry-date');
    const dashSubStatusEl = document.getElementById('dash-sub-status');

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
            if (dashSubExpiryDateEl) dashSubExpiryDateEl.textContent = "Pa abonim";
            if (dashSubStatusEl) {
                dashSubStatusEl.textContent = "Nuk Ka";
                dashSubStatusEl.className = 'status-badge warning';
            }
        }
    } else {
}
        if (dashSubPackageNameEl) dashSubPackageNameEl.textContent = "Gabim Biznesi";
        if (dashSubExpiryDateEl) dashSubExpiryDateEl.textContent = "Gabim Biznesi";
        if (dashSubStatusEl) {
            dashSubStatusEl.textContent = "Gabim";
            dashSubStatusEl.className = 'status-badge inactive';
        }
    }

function updateSalesWidget() {
    // Sales Summary Elements
    const todaySalesTotalEl = document.getElementById('dashboard-today-sales-total');
    const todaySalesCountEl = document.getElementById('dashboard-today-sales-count');
    
    // Today's Sales Summary
    const today = getTodayDateString();
    const todaysSales = state.salesLog.filter(sale => sale.dailyCashEntryDate === today && sale.businessId === state.currentManagingBusinessId);
    const todaysTotalSalesAmount = todaysSales.reduce((sum, sale) => sum + sale.grandTotal, 0);
    if (todaySalesTotalEl) todaySalesTotalEl.textContent = `${todaysTotalSalesAmount.toFixed(2)} €`;
    if (todaySalesCountEl) todaySalesCountEl.textContent = `${todaysSales.length} Fatura`;
    
    // Update today's sales chart data
    updateTodaySalesChart(todaysSales);
    
    // Overall Sales
    const allSalesForBusiness = state.salesLog.filter(sale => sale.businessId === state.currentManagingBusinessId);
    const overallTotalSalesAmount = allSalesForBusiness.reduce((sum, sale) => sum + sale.grandTotal, 0);
    const overallSalesTotalEl = document.getElementById('dashboard-overall-sales-total');
    const overallSalesCountEl = document.getElementById('dashboard-overall-sales-count');
    if (overallSalesTotalEl) overallSalesTotalEl.textContent = `${overallTotalSalesAmount.toFixed(2)} €`;
    if (overallSalesCountEl) overallSalesCountEl.textContent = `${allSalesForBusiness.length} Fatura`;

    // Overall Purchases (Local Purchases)
    const allPurchasesForBusiness = state.purchaseInvoices.filter(inv => inv.businessId === state.currentManagingBusinessId);
    const overallTotalPurchasesAmount = allPurchasesForBusiness.reduce((sum, inv) => sum + inv.totalAmountWithVAT, 0);
    const overallPurchasesTotalEl = document.getElementById('dashboard-overall-purchases-total');
    const overallPurchasesCountEl = document.getElementById('dashboard-overall-purchases-count');
    if (overallPurchasesTotalEl) overallPurchasesTotalEl.textContent = `${overallTotalPurchasesAmount.toFixed(2)} €`;
    if (overallPurchasesCountEl) overallPurchasesCountEl.textContent = `${allPurchasesForBusiness.length} Fatura`;
    
    // Calculate and display balance
    const balanceEl = document.getElementById('dashboard-balance');
    const balance = overallTotalSalesAmount - overallTotalPurchasesAmount;
    if (balanceEl) {
        balanceEl.textContent = `${balance.toFixed(2)} €`;
        balanceEl.className = balance >= 0 ? 'metric-value positive' : 'metric-value negative';
    }
    
    // Update financial chart
    updateFinancialChart(allSalesForBusiness, allPurchasesForBusiness);
}

function updateTopPerformersWidget() {
    const today = getTodayDateString();
    const todaysSales = state.salesLog.filter(sale => sale.dailyCashEntryDate === today && sale.businessId === state.currentManagingBusinessId);
    
    const topProductNameEl = document.getElementById('dash-top-product-name');
    const topProductQuantityEl = document.getElementById('dash-top-product-quantity');
    const topProductRevenueEl = document.getElementById('dash-top-product-revenue');
    const topCustomerNameEl = document.getElementById('dash-top-customer-name');
    const topCustomerSpentEl = document.getElementById('dash-top-customer-spent');
    const topSellerNameEl = document.getElementById('dash-top-seller-name');
    const topSellerSalesEl = document.getElementById('dash-top-seller-sales');
    
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
        
        // Update top seller chart
        updateTopSellerChart(topSellerArr);
    } else {
        if (topSellerNameEl) topSellerNameEl.textContent = "N/A";
        if (topSellerSalesEl) topSellerSalesEl.textContent = "0.00 €";
    }
}

function updateOpenShiftsWidget() {
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

function updateInventoryWidget() {
    const totalProductsEl = document.getElementById('dash-total-products');
    const lowStockProductsEl = document.getElementById('dash-low-stock-products');
    
    if (totalProductsEl) {
        totalProductsEl.textContent = state.products.length.toString();
    }
    
    // Count products with low stock (below minimum stock level)
    const lowStockProducts = state.products.filter(p => 
        p.minimumStockLevel !== undefined && 
        p.stock < p.minimumStockLevel
    );
    
    if (lowStockProductsEl) {
        lowStockProductsEl.textContent = lowStockProducts.length.toString();
    }
    
    // Update inventory chart
    updateInventoryChart(state.products);
}

function updateFinancialSummaryWidget() {
    // This function is intentionally left empty as the financial data
    // is already updated in the updateSalesWidget function
}

// Chart initialization and update functions
function initializeCharts() {
    // This function would initialize all charts with empty data
    // In a real implementation, you would use a charting library like Chart.js
    
    // For now, we'll just create placeholder elements
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        if (container instanceof HTMLElement) {
            container.innerHTML = `
                <div class="chart-placeholder">
                    <div class="chart-placeholder-icon">📊</div>
                    <div class="chart-placeholder-text">Grafiku do të shfaqet këtu</div>
                </div>
            `;
        }
    });
}

function updateTodaySalesChart(todaysSales: SaleRecord[]) {
    const chartContainer = document.getElementById('today-sales-chart');
    if (!chartContainer) return;
    
    // Group sales by hour
    const salesByHour: {[hour: string]: number} = {};
    todaysSales.forEach(sale => {
        const hour = new Date(sale.timestamp).getHours();
        const hourKey = `${hour}:00`;
        if (!salesByHour[hourKey]) {
            salesByHour[hourKey] = 0;
        }
        salesByHour[hourKey] += sale.grandTotal;
    });
    
    // In a real implementation, you would update the chart with this data
    // For now, we'll just show a placeholder with some sample data
    chartContainer.innerHTML = `
        <div class="chart-placeholder">
            <div class="chart-placeholder-icon">📈</div>
            <div class="chart-placeholder-text">Shitjet sipas orëve: ${Object.keys(salesByHour).length} periudha</div>
        </div>
    `;
}

function updateTopSellerChart(topSellers: {name: string, salesValue: number}[]) {
    const chartContainer = document.getElementById('top-seller-chart');
    if (!chartContainer || topSellers.length === 0) return;
    
    // In a real implementation, you would update the chart with this data
    chartContainer.innerHTML = `
        <div class="chart-placeholder">
            <div class="chart-placeholder-icon">🥇</div>
            <div class="chart-placeholder-text">Performanca e shitësve top</div>
        </div>
    `;
}

function updateInventoryChart(products: any[]) {
    const chartContainer = document.getElementById('inventory-chart');
    if (!chartContainer) return;
    
    // Count products by category
    const productsByCategory: {[category: string]: number} = {};
    products.forEach(product => {
        const categoryId = product.categoryId || 'uncategorized';
        const categoryName = product.categoryId 
            ? (state.categories.find(c => c.id === product.categoryId)?.name || 'Pa kategori') 
            : 'Pa kategori';
        
        if (!productsByCategory[categoryName]) {
            productsByCategory[categoryName] = 0;
        }
        productsByCategory[categoryName]++;
    });
    
    // In a real implementation, you would update the chart with this data
    chartContainer.innerHTML = `
        <div class="chart-placeholder">
            <div class="chart-placeholder-icon">📊</div>
            <div class="chart-placeholder-text">Produktet sipas kategorive: ${Object.keys(productsByCategory).length} kategori</div>
        </div>
    `;
}

function updateFinancialChart(sales: any[], purchases: any[]) {
    const chartContainer = document.getElementById('financial-chart');
    if (!chartContainer) return;
    
    // In a real implementation, you would update the chart with sales and purchases data
    chartContainer.innerHTML = `
        <div class="chart-placeholder">
            <div class="chart-placeholder-icon">💹</div>
            <div class="chart-placeholder-text">Krahasimi i shitjeve dhe blerjeve</div>
        </div>
    `;
}
