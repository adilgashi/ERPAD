/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as toast from '../core/toast';
import { StockAdjustment, Product } from '../models';
import { generateUniqueId, getTodayDateString } from '../core/utils';
import { showCustomConfirm } from '../core/ui';

export function initStockAdjustmentsView(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Stock Adjustments view.");
        return;
    }

    // Create the view structure
    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Rregullimet e Stokut</h2>
        
        <div class="stock-adjustment-form-container">
            <form id="stock-adjustment-form" class="form-grid-2-cols">
                <div class="form-group">
                    <label for="stock-adjustment-product">Produkti:</label>
                    <select id="stock-adjustment-product" class="form-control" required>
                        <option value="">-- Zgjidh Produktin --</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="stock-adjustment-type">Lloji i Rregullimit:</label>
                    <select id="stock-adjustment-type" class="form-control" required>
                        <option value="">-- Zgjidh Llojin --</option>
                        <option value="Inventarizim Fizik">Inventarizim Fizik</option>
                        <option value="Dëmtim">Dëmtim</option>
                        <option value="Skadencë">Skadencë</option>
                        <option value="Hyrje Manuale">Hyrje Manuale</option>
                        <option value="Dalje Manuale">Dalje Manuale</option>
                        <option value="Tjetër">Tjetër</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="stock-adjustment-current">Sasia Aktuale:</label>
                    <input type="number" id="stock-adjustment-current" class="form-control" readonly>
                </div>
                
                <div class="form-group">
                    <label for="stock-adjustment-new">Sasia e Re:</label>
                    <input type="number" id="stock-adjustment-new" class="form-control" required min="0" step="any">
                </div>
                
                <div class="form-group form-group-span-2">
                    <label for="stock-adjustment-notes">Shënime/Arsyeja:</label>
                    <textarea id="stock-adjustment-notes" class="form-control" rows="3" required></textarea>
                </div>
                
                <div class="form-group form-group-span-2">
                    <p id="stock-adjustment-error" class="error-message" style="display: none;"></p>
                    <div class="form-actions-group">
                        <button type="submit" id="save-stock-adjustment-btn" class="btn btn-primary">Ruaj Rregullimin</button>
                    </div>
                </div>
            </form>
        </div>
        
        <h3 class="section-subtitle" style="margin-top: 2rem;">Historiku i Rregullimeve</h3>
        
        <div class="table-responsive">
            <table class="admin-table" id="stock-adjustments-table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Produkti</th>
                        <th>Lloji i Rregullimit</th>
                        <th class="text-right">Sasia e Vjetër</th>
                        <th class="text-right">Sasia e Re</th>
                        <th class="text-right">Ndryshimi</th>
                        <th>Përdoruesi</th>
                        <th>Shënime</th>
                    </tr>
                </thead>
                <tbody id="stock-adjustments-tbody">
                    <tr>
                        <td colspan="8" class="text-center">Nuk ka rregullime të regjistruara.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    // Populate product dropdown
    populateProductDropdown();
    
    // Attach event listeners
    const form = document.getElementById('stock-adjustment-form') as HTMLFormElement;
    const productSelect = document.getElementById('stock-adjustment-product') as HTMLSelectElement;
    const currentStockInput = document.getElementById('stock-adjustment-current') as HTMLInputElement;
    
    productSelect.addEventListener('change', () => {
        const selectedProductId = productSelect.value;
        if (selectedProductId) {
            const product = state.products.find(p => p.id === selectedProductId);
            if (product) {
                currentStockInput.value = product.stock.toString();
            }
        } else {
            currentStockInput.value = '';
        }
    });
    
    form.addEventListener('submit', handleSaveStockAdjustment);
    
    // Load and render existing adjustments
    renderStockAdjustments();
}

function populateProductDropdown(): void {
    const productSelect = document.getElementById('stock-adjustment-product') as HTMLSelectElement;
    if (!productSelect) return;
    
    productSelect.innerHTML = '<option value="">-- Zgjidh Produktin --</option>';
    
    // Sort products by code for easier finding
    const sortedProducts = [...state.products].sort((a, b) => 
        (a.code || "").localeCompare(b.code || "")
    );
    
    sortedProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.code} - ${product.name} (Stoku: ${product.stock} ${product.unitOfMeasure || 'copë'})`;
        productSelect.appendChild(option);
    });
}

async function handleSaveStockAdjustment(event: Event): Promise<void> {
    event.preventDefault();
    
    if (!state.currentManagingBusinessId || !state.currentUser) {
        toast.showErrorToast("Gabim: Mungojnë të dhënat e biznesit ose përdoruesit.");
        return;
    }
    
    const productSelect = document.getElementById('stock-adjustment-product') as HTMLSelectElement;
    const adjustmentTypeSelect = document.getElementById('stock-adjustment-type') as HTMLSelectElement;
    const currentStockInput = document.getElementById('stock-adjustment-current') as HTMLInputElement;
    const newStockInput = document.getElementById('stock-adjustment-new') as HTMLInputElement;
    const notesTextarea = document.getElementById('stock-adjustment-notes') as HTMLTextAreaElement;
    const errorElement = document.getElementById('stock-adjustment-error') as HTMLParagraphElement;
    
    errorElement.style.display = 'none';
    
    const productId = productSelect.value;
    const adjustmentType = adjustmentTypeSelect.value as StockAdjustment['adjustmentType'];
    const oldQuantity = parseFloat(currentStockInput.value);
    const newQuantity = parseFloat(newStockInput.value);
    const notes = notesTextarea.value.trim();
    
    if (!productId || !adjustmentType || isNaN(newQuantity) || !notes) {
        errorElement.textContent = "Ju lutem plotësoni të gjitha fushat e kërkuara.";
        errorElement.style.display = 'block';
        return;
    }
    
    if (newQuantity < 0) {
        errorElement.textContent = "Sasia e re nuk mund të jetë negative.";
        errorElement.style.display = 'block';
        return;
    }
    
    const product = state.products.find(p => p.id === productId);
    if (!product) {
        errorElement.textContent = "Produkti i zgjedhur nuk u gjet.";
        errorElement.style.display = 'block';
        return;
    }
    
    // Create the stock adjustment record
    const newAdjustment: StockAdjustment = {
        id: generateUniqueId('adj-'),
        businessId: state.currentManagingBusinessId,
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        oldQuantity: oldQuantity,
        newQuantity: newQuantity,
        adjustmentType: adjustmentType,
        notes: notes,
        recordedByUserId: state.currentUser.id,
        recordedByUsername: state.currentUser.username,
        timestamp: Date.now()
    };
    
    // Update the product stock
    product.stock = newQuantity;
    
    try {
        // Save the updated product
        await storage.saveProducts(state.currentManagingBusinessId, state.products);
        
        // Save the adjustment record
        state.stockAdjustments.push(newAdjustment);
        await storage.saveStockAdjustments(state.currentManagingBusinessId, state.stockAdjustments);
        
        // Show success message
        toast.showSuccessToast(`Stoku i produktit "${product.name}" u përditësua me sukses nga ${oldQuantity} në ${newQuantity}.`);
        
        // Reset form and refresh data
        resetStockAdjustmentForm();
        renderStockAdjustments();
        populateProductDropdown(); // Refresh dropdown to show updated stock
        
        // Update other views if they're open
        if (typeof (window as any).renderManagerStockOverview === 'function') {
            (window as any).renderManagerStockOverview();
        }
        
    } catch (error) {
        console.error("Error saving stock adjustment:", error);
        errorElement.textContent = "Ndodhi një gabim gjatë ruajtjes së rregullimit. Ju lutem provoni përsëri.";
        errorElement.style.display = 'block';
    }
}

function resetStockAdjustmentForm(): void {
    const form = document.getElementById('stock-adjustment-form') as HTMLFormElement;
    const currentStockInput = document.getElementById('stock-adjustment-current') as HTMLInputElement;
    const errorElement = document.getElementById('stock-adjustment-error') as HTMLParagraphElement;
    
    form.reset();
    currentStockInput.value = '';
    errorElement.style.display = 'none';
}

function renderStockAdjustments(): void {
    const tbody = document.getElementById('stock-adjustments-tbody') as HTMLTableSectionElement;
    if (!tbody) return;
    
    if (state.stockAdjustments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Nuk ka rregullime të regjistruara.</td></tr>';
        return;
    }
    
    // Sort adjustments by timestamp (newest first)
    const sortedAdjustments = [...state.stockAdjustments].sort((a, b) => b.timestamp - a.timestamp);
    
    tbody.innerHTML = '';
    
    sortedAdjustments.forEach(adjustment => {
        const difference = adjustment.newQuantity - adjustment.oldQuantity;
        const differenceClass = difference > 0 ? 'positive' : (difference < 0 ? 'negative' : 'zero');
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${new Date(adjustment.timestamp).toLocaleString('sq-AL')}</td>
            <td>${adjustment.productCode} - ${adjustment.productName}</td>
            <td>${adjustment.adjustmentType}</td>
            <td class="text-right">${adjustment.oldQuantity.toFixed(2)}</td>
            <td class="text-right">${adjustment.newQuantity.toFixed(2)}</td>
            <td class="text-right cash-value ${differenceClass}">${difference > 0 ? '+' : ''}${difference.toFixed(2)}</td>
            <td>${adjustment.recordedByUsername}</td>
            <td>${adjustment.notes}</td>
        `;
        
        tbody.appendChild(tr);
    });
}