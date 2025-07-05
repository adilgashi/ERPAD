/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import { Product } from '../models';

export function initStockManagementEventListeners(): void {
    dom.stockOverviewSearchInput?.addEventListener('input', renderStockOverview);
}

export function renderStockOverview(): void {
    if (!dom.stockOverviewTbody || !state.currentManagingBusinessId) {
        if(dom.managerContentStockOverview) dom.managerContentStockOverview.innerHTML = '<p class="error-message">Seksioni i stoqeve nuk mund të ngarkohet.</p>';
        return;
    }

    // Add a button to navigate to stock adjustments
    const container = dom.managerContentStockOverview;
    if (container) {
        const existingButton = container.querySelector('#go-to-stock-adjustments-btn');
        if (!existingButton) {
            const filterContainer = container.querySelector('.filter-container');
            if (filterContainer) {
                const adjustmentsButton = document.createElement('button');
                adjustmentsButton.id = 'go-to-stock-adjustments-btn';
                adjustmentsButton.className = 'btn btn-info';
                adjustmentsButton.innerHTML = '<span class="icon">⚖️</span> Rregullimet e Stokut';
                adjustmentsButton.style.marginLeft = '1rem';
                adjustmentsButton.addEventListener('click', () => {
                    if (typeof (window as any).setActiveManagerView === 'function') {
                        (window as any).setActiveManagerView('stock_adjustments', 'Rregullimet e Stokut');
                    }
                });
                filterContainer.appendChild(adjustmentsButton);
            }
        }
    }

    const searchTerm = dom.stockOverviewSearchInput ? dom.stockOverviewSearchInput.value.toLowerCase().trim() : '';
    dom.stockOverviewTbody.innerHTML = '';

    const filteredProducts = state.products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.code.toLowerCase().includes(searchTerm)
    );

    if (filteredProducts.length === 0) {
        dom.stockOverviewTbody.innerHTML = `<tr><td colspan="6" class="text-center">${searchTerm ? 'Asnjë produkt nuk përputhet me kërkimin.' : 'Nuk ka produkte të regjistruara.'}</td></tr>`;
        return;
    }

    const sortedProducts = [...filteredProducts].sort((a, b) => (a.code || "").localeCompare(b.code || ""));

    sortedProducts.forEach(product => {
        const category = product.categoryId ? state.categories.find(c => c.id === product.categoryId) : null;
        const categoryName = category ? category.name : 'E Pa Kategorizuar';
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${categoryName}</td>
            <td class="text-right">${product.stock}</td>
            <td>${product.unitOfMeasure}</td>
            <td>${product.quantityPerPackage ? product.quantityPerPackage : '-'}</td>
        `;
        dom.stockOverviewTbody.appendChild(tr);
    });
}
