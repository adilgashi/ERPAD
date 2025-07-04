/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as config from '../core/config';
import * as ui from '../core/ui';
import * as toast from '../core/toast';
import { DailyCashEntry, ReconciliationInfo, Product } from '../models';
import { getTodayDateString, simpleHash, comparePassword, generateUniqueId } from '../core/utils';
import { renderDashboardSummary } from './dashboard';
import { showAppView } from '../core/ui'; 


export function initManagerActionsEventListeners(): void {
    dom.startDayBtn?.addEventListener('click', openStartDayModal);
    dom.cancelStartDayBtn?.addEventListener('click', closeStartDayModal);
    if (dom.modalCloseBtn && dom.startDayModal && dom.modalCloseBtn.closest('#start-day-modal')) {
        dom.modalCloseBtn.addEventListener('click', closeStartDayModal);
    }
    dom.startDayForm?.addEventListener('submit', handleSaveStartDaySetup);
    dom.selectSellerDropdown?.addEventListener('change', updateSaveStartDayButtonState);
    dom.initialCashInput?.addEventListener('input', updateSaveStartDayButtonState);


    dom.editOpenCashEntryBtn?.addEventListener('click', openEditOpenCashEntryModal);
    dom.selectEntryToEditDropdown?.addEventListener('change', handleSelectEntryToEditChange);
    dom.editOpenCashEntryForm?.addEventListener('submit', handleSaveEditedOpenCashEntry);
    dom.cancelEditOpenCashEntryBtn?.addEventListener('click', closeEditOpenCashEntryModal);
    if (dom.editOpenCashEntryModalCloseBtn) dom.editOpenCashEntryModalCloseBtn.addEventListener('click', closeEditOpenCashEntryModal);

    dom.reconcileDayBtn?.addEventListener('click', openReconciliationModal);
    dom.selectSellerForReconciliationDropdown?.addEventListener('change', handleReconciliationSellerSelected);
    dom.reconciliationActualCashCountedInput?.addEventListener('input', () => {
        calculateReconciliationDifference(); 
        updateReconciliationConfirmButtonState();
    });
    dom.confirmZeroSalesClosureCheckbox?.addEventListener('change', updateReconciliationConfirmButtonState);
    dom.reconciliationForm?.addEventListener('submit', handleConfirmReconciliation);
    dom.cancelReconciliationBtn?.addEventListener('click', closeReconciliationModal);
    if(dom.reconciliationModalCloseBtn) dom.reconciliationModalCloseBtn.addEventListener('click', closeReconciliationModal);

    dom.changeClearSalePinBtn?.addEventListener('click', openChangeClearSalePinModal);
}


function openStartDayModal(): void {
    if (!dom.startDayModal || !dom.startDayForm || !dom.selectSellerDropdown || !dom.selectShiftDropdown || !dom.initialCashInput) return;

    dom.startDayForm.reset();
    dom.selectSellerDropdown.innerHTML = '<option value="">-- Zgjidh Shitësin --</option>';
    state.users.filter(u => u.role === 'shites').forEach(seller => {
        const option = document.createElement('option');
        option.value = seller.id;
        option.textContent = seller.username;
        dom.selectSellerDropdown?.appendChild(option);
    });

    updateSaveStartDayButtonState(); 
    dom.startDayModal.style.display = 'block';
    ui.showPageBlurOverlay();
}

function closeStartDayModal(): void {
    if (dom.startDayModal) dom.startDayModal.style.display = 'none';
    ui.hidePageBlurOverlay();
}

function updateSaveStartDayButtonState(): void {
    if (!dom.saveStartDayBtn || !dom.selectSellerDropdown || !dom.initialCashInput) return;

    const sellerSelected = !!dom.selectSellerDropdown.value;
    const initialCash = parseFloat(dom.initialCashInput.value);
    const isInitialCashValid = !isNaN(initialCash) && initialCash >= 0;

    dom.saveStartDayBtn.disabled = !(sellerSelected && isInitialCashValid);
}


async function handleSaveStartDaySetup(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.selectSellerDropdown || !dom.selectShiftDropdown || !dom.initialCashInput || !state.currentUser || !state.currentManagingBusinessId) return;

    const sellerId = dom.selectSellerDropdown.value;
    const shift = dom.selectShiftDropdown.value as 'paradite' | 'masdite';
    const initialCash = parseFloat(dom.initialCashInput.value);
    const today = getTodayDateString();

    if (!sellerId || !shift || isNaN(initialCash) || initialCash < 0) {
        alert("Ju lutem plotësoni të gjitha fushat saktë.");
        return;
    }

    const existingEntry = state.dailyCashLog.find(entry =>
        entry.sellerId === sellerId &&
        entry.date === today &&
        entry.shift === shift &&
        !entry.isReconciled
    );

    if (existingEntry) {
        alert(`Shitësi ${dom.selectSellerDropdown.options[dom.selectSellerDropdown.selectedIndex].text} tashmë ka një arkë të hapur për datën ${today} (${shift}).`);
        return;
    }

    const productStockUpdates: { productId: string, name: string, oldStock: number, newStock: number }[] = [];


    const newEntry: DailyCashEntry = {
        date: today,
        initialCash: initialCash,
        productStockUpdates: productStockUpdates, 
        openedByManagerId: state.currentUser.id,
        openedByManagerUsername: state.currentUser.username,
        sellerId: sellerId,
        sellerUsername: state.users.find(u => u.id === sellerId)?.username || 'I Panjohur',
        timestamp: Date.now(),
        isReconciled: false,
        shift: shift,
        businessId: state.currentManagingBusinessId, // Added businessId
    };

    state.dailyCashLog.push(newEntry);
    await storage.saveDailyCashLog(state.currentManagingBusinessId, state.dailyCashLog);

    toast.showSuccessToast(`Arka u hap me sukses për ${newEntry.sellerUsername} për ${today} (${shift}).`);
    closeStartDayModal();
    renderDashboardSummary();
    
    if (state.currentUser.role === 'shites' && state.currentUser.id === sellerId) {
        showAppView(); 
    }
}

function openEditOpenCashEntryModal(): void {
    if (!dom.editOpenCashEntryModal || !dom.editOpenCashEntryForm || !dom.selectEntryToEditDropdown || !dom.editEntryDetailsView) return;

    dom.editOpenCashEntryForm.reset();
    dom.selectEntryToEditDropdown.innerHTML = '<option value="">-- Zgjidh Ndërrimin për Modifikim --</option>';
    
    const openEntries = state.dailyCashLog.filter(entry => !entry.isReconciled)
                           .sort((a,b) => b.timestamp - a.timestamp); 

    if(openEntries.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Nuk ka ndërrime të hapura për modifikim";
        option.disabled = true;
        dom.selectEntryToEditDropdown.appendChild(option);
    } else {
        openEntries.forEach(entry => {
            const option = document.createElement('option');
            option.value = `${entry.date}|${entry.shift}|${entry.sellerId}`;
            option.textContent = `${entry.sellerUsername} - ${new Date(entry.date + "T00:00:00").toLocaleDateString('sq-AL')} (${entry.shift === 'paradite' ? 'Paradite' : 'Masdite'})`;
            dom.selectEntryToEditDropdown.appendChild(option);
        });
    }
    dom.editEntryDetailsView.style.display = 'none';
    if(dom.editOpenCashEntryErrorElement) dom.editOpenCashEntryErrorElement.textContent = '';
    if(dom.saveEditOpenCashEntryBtn) dom.saveEditOpenCashEntryBtn.disabled = true;
    dom.editOpenCashEntryModal.style.display = 'block';
    ui.showPageBlurOverlay();
}

function handleSelectEntryToEditChange(): void {
    if (!dom.selectEntryToEditDropdown || !dom.editEntryDetailsView || !dom.editEntrySellerUsernameElement || 
        !dom.editEntryDateElement || !dom.editEntryShiftStrongElement || !dom.editInitialCashInput || 
        !dom.saveEditOpenCashEntryBtn) return;

    const selectedValue = dom.selectEntryToEditDropdown.value;
    if (!selectedValue) {
        dom.editEntryDetailsView.style.display = 'none';
        state.setSelectedEntryForEditing(null);
        dom.saveEditOpenCashEntryBtn.disabled = true;
        return;
    }

    const [date, shift, sellerId] = selectedValue.split('|');
    const entryToEdit = state.dailyCashLog.find(entry => 
        entry.date === date && 
        entry.shift === (shift as 'paradite' | 'masdite') && 
        entry.sellerId === sellerId && 
        !entry.isReconciled
    );

    if (entryToEdit) {
        state.setSelectedEntryForEditing(entryToEdit);
        dom.editEntrySellerUsernameElement.textContent = entryToEdit.sellerUsername;
        dom.editEntryDateElement.textContent = new Date(entryToEdit.date + "T00:00:00").toLocaleDateString('sq-AL');
        dom.editEntryShiftStrongElement.textContent = entryToEdit.shift === 'paradite' ? 'Paradite' : 'Masdite';
        dom.editInitialCashInput.value = entryToEdit.initialCash.toString();
        
        toast.showSuccessToast("Ndryshimet në hyrjen e arkës u ruajtën.");

        dom.editEntryDetailsView.style.display = 'block';
        dom.saveEditOpenCashEntryBtn.disabled = false;
    } else {
        dom.editEntryDetailsView.style.display = 'none';
        state.setSelectedEntryForEditing(null);
        dom.saveEditOpenCashEntryBtn.disabled = true;
    }
}

async function handleSaveEditedOpenCashEntry(event: Event): Promise<void> {
    event.preventDefault();
    const entryToEdit = state.selectedEntryForEditing;
    if (!entryToEdit || !dom.editInitialCashInput || !state.currentManagingBusinessId || !state.currentUser) return;

    const newInitialCash = parseFloat(dom.editInitialCashInput.value);
    if (isNaN(newInitialCash) || newInitialCash < 0) {
        if(dom.editOpenCashEntryErrorElement) dom.editOpenCashEntryErrorElement.textContent = "Shuma fillestare e arkës është e pavlefshme.";
        return;
    }
    
    const updatedStockUpdates: { productId: string, name: string, oldStock: number, newStock: number }[] = [];
    
    entryToEdit.initialCash = newInitialCash;
    entryToEdit.productStockUpdates = updatedStockUpdates; 
    
    await storage.saveDailyCashLog(state.currentManagingBusinessId, state.dailyCashLog);
    
    alert("Ndryshimet në hyrjen e arkës u ruajtën.");
    closeEditOpenCashEntryModal();
    renderDashboardSummary();

     if (state.currentUser.role === 'shites' && state.currentUser.id === entryToEdit.sellerId) {
        showAppView(); 
    }
}


function closeEditOpenCashEntryModal(): void {
    if (dom.editOpenCashEntryModal) dom.editOpenCashEntryModal.style.display = 'none';
    state.setSelectedEntryForEditing(null);
    ui.hidePageBlurOverlay();
}

function openReconciliationModal(): void {
    if (!dom.reconciliationModal || !dom.reconciliationForm || !dom.selectSellerForReconciliationDropdown || !dom.reconciliationDetailsView || !dom.confirmReconciliationBtn) return;

    dom.reconciliationForm.reset();
    if(dom.confirmZeroSalesClosureCheckbox) dom.confirmZeroSalesClosureCheckbox.checked = false;
    if(dom.zeroSalesReconciliationNoticeElement) dom.zeroSalesReconciliationNoticeElement.style.display = 'none';

    dom.selectSellerForReconciliationDropdown.innerHTML = '<option value="">-- Zgjidh Shitësin & Ndërrimin --</option>'; 
    const openEntries = state.dailyCashLog.filter(entry => !entry.isReconciled)
                                     .sort((a, b) => b.timestamp - a.timestamp); 

    if (openEntries.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Nuk ka ndërrime të hapura për barazim";
        option.disabled = true;
        dom.selectSellerForReconciliationDropdown.appendChild(option);
    } else {
        openEntries.forEach(entry => {
            const option = document.createElement('option');
            option.value = `${entry.date}|${entry.shift}|${entry.sellerId}`;
            option.textContent = `${entry.sellerUsername} - ${new Date(entry.date + "T00:00:00").toLocaleDateString('sq-AL')} (${entry.shift === 'paradite' ? 'Paradite' : 'Masdite'})`;
            dom.selectSellerForReconciliationDropdown.appendChild(option);
        });
    }
    dom.reconciliationDetailsView.style.display = 'none';
    if(dom.reconciliationModalErrorElement) dom.reconciliationModalErrorElement.textContent = '';
    dom.confirmReconciliationBtn.disabled = true; 
    dom.reconciliationModal.style.display = 'block';
    ui.showPageBlurOverlay();
}

function handleReconciliationSellerSelected(): void {
    if (!dom.selectSellerForReconciliationDropdown || !dom.reconciliationDetailsView || !dom.reconciliationSellerUsernameElement ||
        !dom.reconciliationEntryDateElement || !dom.reconciliationEntryShiftStrongElement || !dom.reconciliationInitialCashElement ||
        !dom.reconciliationSystemSalesElement || !dom.reconciliationExpectedCashElement || !dom.reconciliationActualCashCountedInput ||
        !dom.reconciliationDifferenceElement || !dom.reconciliationDifferenceIcon || !dom.reconciliationQuickCashButtonsContainer ||
        !dom.zeroSalesReconciliationNoticeElement || !dom.confirmZeroSalesClosureCheckbox) {
        updateReconciliationConfirmButtonState(); 
        return;
    }
    
    const pettyCashRow = document.getElementById('reconciliation-petty-cash-row') as HTMLTableRowElement | null;
    const pettyCashEl = document.getElementById('reconciliation-petty-cash') as HTMLElement | null;

    const selectedValue = dom.selectSellerForReconciliationDropdown.value;
    if (!selectedValue) {
        dom.reconciliationDetailsView.style.display = 'none';
        dom.zeroSalesReconciliationNoticeElement.style.display = 'none';
        state.setSelectedDailyEntryForReconciliation(null);
        state.setExpectedCashForReconciliation(0);
    } else {
        const [date, shift, sellerId] = selectedValue.split('|');
        const entry = state.dailyCashLog.find(e => e.date === date && e.shift === (shift as 'paradite' | 'masdite') && e.sellerId === sellerId && !e.isReconciled);

        if (entry) {
            state.setSelectedDailyEntryForReconciliation(entry);
            dom.reconciliationSellerUsernameElement.textContent = entry.sellerUsername;
            dom.reconciliationEntryDateElement.textContent = new Date(entry.date + "T00:00:00").toLocaleDateString('sq-AL');
            dom.reconciliationEntryShiftStrongElement.textContent = entry.shift === 'paradite' ? 'Paradite' : 'Masdite';
            dom.reconciliationInitialCashElement.textContent = `${entry.initialCash.toFixed(2)} €`;

            const totalSales = state.salesLog.reduce((sum, sale) => {
                if (sale.sellerId === entry.sellerId && sale.dailyCashEntryDate === entry.date && sale.shift === entry.shift) {
                    return sum + sale.grandTotal;
                }
                return sum;
            }, 0);
            dom.reconciliationSystemSalesElement.textContent = `${totalSales.toFixed(2)} €`;

            const totalPettyCash = state.pettyCashLog
                .filter(e => e.sellerId === entry.sellerId && e.dailyCashEntryDate === entry.date && e.shift === entry.shift)
                .reduce((sum, e) => sum + e.amount, 0);

            if (pettyCashRow && pettyCashEl) {
                if (totalPettyCash > 0) {
                    pettyCashEl.textContent = `${totalPettyCash.toFixed(2)} €`;
                    pettyCashRow.style.display = 'flex';
                } else {
                    pettyCashRow.style.display = 'none';
                }
            }

            const expectedCash = entry.initialCash + totalSales - totalPettyCash;
            state.setExpectedCashForReconciliation(expectedCash);
            dom.reconciliationExpectedCashElement.innerHTML = `<strong class="cash-value emphasis">${expectedCash.toFixed(2)} €</strong>`;
            
            dom.reconciliationActualCashCountedInput.value = '';
            dom.reconciliationDifferenceElement.textContent = '0.00 €';
            dom.reconciliationDifferenceIcon.className = 'difference-icon'; 
            dom.reconciliationDifferenceElement.className = 'cash-value difference-value'; 

            if (totalSales === 0) {
                dom.zeroSalesReconciliationNoticeElement.style.display = 'flex';
                dom.confirmZeroSalesClosureCheckbox.checked = false;
            } else {
                dom.zeroSalesReconciliationNoticeElement.style.display = 'none';
            }

            dom.reconciliationQuickCashButtonsContainer.innerHTML = '';
            const quickCashValues = [expectedCash, 50, 100, 200, 500, 1000, 2000].filter((v,i,a) => a.indexOf(v) === i).sort((a,b) => a-b);
            quickCashValues.slice(0,6).forEach(value => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'quick-cash-button';
                button.textContent = `${value.toFixed(value === expectedCash ? 2 : 0)} €`;
                if (value === expectedCash) button.classList.add('copy-expected-btn'); 
                button.addEventListener('click', () => {
                    if(dom.reconciliationActualCashCountedInput) dom.reconciliationActualCashCountedInput.value = value.toFixed(2);
                    calculateReconciliationDifference(); 
                    updateReconciliationConfirmButtonState();
                });
                dom.reconciliationQuickCashButtonsContainer.appendChild(button);
            });

            dom.reconciliationDetailsView.style.display = 'block';
        } else {
            dom.reconciliationDetailsView.style.display = 'none';
            dom.zeroSalesReconciliationNoticeElement.style.display = 'none';
            state.setSelectedDailyEntryForReconciliation(null);
            state.setExpectedCashForReconciliation(0);
        }
    }
    updateReconciliationConfirmButtonState();
}


function calculateReconciliationDifference(): void {
    if (!dom.reconciliationActualCashCountedInput || !dom.reconciliationDifferenceElement || !dom.reconciliationDifferenceIcon) return;

    const actualCash = parseFloat(dom.reconciliationActualCashCountedInput.value);
    const expectedCash = state.expectedCashForReconciliation;

    if (isNaN(actualCash)) {
        dom.reconciliationDifferenceElement.textContent = '0.00 €';
        dom.reconciliationDifferenceIcon.className = 'difference-icon';
        dom.reconciliationDifferenceElement.className = 'cash-value difference-value';
    } else {
        const difference = actualCash - expectedCash;
        dom.reconciliationDifferenceElement.textContent = `${difference.toFixed(2)} €`;
        dom.reconciliationDifferenceElement.className = 'cash-value difference-value';
        dom.reconciliationDifferenceIcon.className = 'difference-icon';

        if (difference > 0) {
            dom.reconciliationDifferenceIcon.classList.add('positive');
            dom.reconciliationDifferenceElement.classList.add('positive');
        } else if (difference < 0) {
            dom.reconciliationDifferenceIcon.classList.add('negative');
            dom.reconciliationDifferenceElement.classList.add('negative');
        } else {
            dom.reconciliationDifferenceIcon.classList.add('zero');
            dom.reconciliationDifferenceElement.classList.add('zero');
        }
    }
}


function updateReconciliationConfirmButtonState(): void {
    if (!dom.confirmReconciliationBtn ||
        !dom.selectSellerForReconciliationDropdown ||
        !dom.reconciliationActualCashCountedInput ||
        !dom.zeroSalesReconciliationNoticeElement ||
        !dom.confirmZeroSalesClosureCheckbox) {
        if(dom.confirmReconciliationBtn) dom.confirmReconciliationBtn.disabled = true;
        return;
    }

    const shiftSelected = !!dom.selectSellerForReconciliationDropdown.value;
    const actualCashCountedValue = dom.reconciliationActualCashCountedInput.value;
    const actualCash = parseFloat(actualCashCountedValue);
    const isCashAmountValid = actualCashCountedValue.trim() !== '' && !isNaN(actualCash) && actualCash >= 0;

    let zeroSalesConfirmedAndConditionsMet = true; 
    if (dom.zeroSalesReconciliationNoticeElement.style.display !== 'none') {
        zeroSalesConfirmedAndConditionsMet = dom.confirmZeroSalesClosureCheckbox.checked;
    }
    
    dom.confirmReconciliationBtn.disabled = !(shiftSelected && isCashAmountValid && zeroSalesConfirmedAndConditionsMet);
}


async function handleConfirmReconciliation(event: Event): Promise<void> {
    event.preventDefault();
    const entryToReconcile = state.selectedDailyEntryForReconciliation;
    if (!entryToReconcile || !dom.reconciliationActualCashCountedInput || !state.currentUser || !state.currentManagingBusinessId) {
        if(dom.reconciliationModalErrorElement) dom.reconciliationModalErrorElement.textContent = "Ju lutem zgjidhni një ndërrim dhe futni shumën e numëruar.";
        return;
    }

    const actualCashCounted = parseFloat(dom.reconciliationActualCashCountedInput.value);
    if (isNaN(actualCashCounted) || actualCashCounted < 0) {
        if(dom.reconciliationModalErrorElement) dom.reconciliationModalErrorElement.textContent = "Shuma e numëruar e arkës është e pavlefshme.";
        return;
    }

    const expectedCash = state.expectedCashForReconciliation;
    const difference = actualCashCounted - expectedCash;

    entryToReconcile.isReconciled = true;
    entryToReconcile.reconciliationInfo = {
        reconciledByManagerId: state.currentUser.id,
        reconciledByManagerUsername: state.currentUser.username,
        actualCashCounted: actualCashCounted,
        difference: difference,
        reconciliationTimestamp: Date.now()
    };

    await storage.saveDailyCashLog(state.currentManagingBusinessId, state.dailyCashLog);
    toast.showSuccessToast(`Arka për ${entryToReconcile.sellerUsername} (${new Date(entryToReconcile.date + "T00:00:00").toLocaleDateString('sq-AL')}, ${entryToReconcile.shift}) u barazua me sukses.`);
    closeReconciliationModal();
    renderDashboardSummary();

    if (state.currentUser.role === 'shites' && state.currentUser.id === entryToReconcile.sellerId) {
        showAppView(); 
    }
}

function closeReconciliationModal(): void {
    if (dom.reconciliationModal) dom.reconciliationModal.style.display = 'none';
    state.setSelectedDailyEntryForReconciliation(null);
    state.setExpectedCashForReconciliation(0);
    if(dom.confirmReconciliationBtn) dom.confirmReconciliationBtn.disabled = true;
    ui.hidePageBlurOverlay();
}

async function openChangeClearSalePinModal(): Promise<void> {
    if (!dom.changeClearSalePinModal || !dom.changeClearSalePinForm || !dom.newClearSalePinInput || !dom.confirmNewClearSalePinInput || !dom.changeClearSalePinErrorElement || !dom.currentClearSalePinInput || !dom.currentClearSalePinGroup) return;

    dom.changeClearSalePinForm.reset();
    dom.changeClearSalePinErrorElement.textContent = '';
    
    const currentPinHash = await storage.getClearSalePinHash(state.currentManagingBusinessId!);
    if (currentPinHash === simpleHash(config.DEFAULT_CLEAR_SALE_PIN) || !currentPinHash) {
        dom.currentClearSalePinGroup.style.display = 'none';
        dom.currentClearSalePinInput.required = false;
    } else {
        dom.currentClearSalePinGroup.style.display = 'block';
        dom.currentClearSalePinInput.required = true;
    }
    dom.newClearSalePinInput.required = true;
    dom.confirmNewClearSalePinInput.required = true;

    dom.changeClearSalePinModal.style.display = 'block';
    if (dom.currentClearSalePinGroup.style.display !== 'none') {
        dom.currentClearSalePinInput.focus();
    } else {
        dom.newClearSalePinInput.focus();
    }
    ui.showPageBlurOverlay();
}

function closeChangeClearSalePinModal(): void {
    if (dom.changeClearSalePinModal) dom.changeClearSalePinModal.style.display = 'none';
    ui.hidePageBlurOverlay();
}

export async function handleChangeClearSalePin(event: Event): Promise<void> { 
    event.preventDefault();
    if (!dom.newClearSalePinInput || !dom.confirmNewClearSalePinInput || !dom.changeClearSalePinErrorElement || !state.currentManagingBusinessId || !dom.currentClearSalePinInput || !dom.currentClearSalePinGroup) return;

    const newPin = dom.newClearSalePinInput.value;
    const confirmPin = dom.confirmNewClearSalePinInput.value;
    const currentPin = dom.currentClearSalePinInput.value;
    dom.changeClearSalePinErrorElement.textContent = '';

    if (dom.currentClearSalePinGroup.style.display !== 'none') { 
        const storedPinHash = await storage.getClearSalePinHash(state.currentManagingBusinessId);
        if (!comparePassword(currentPin, storedPinHash)) {
            dom.changeClearSalePinErrorElement.textContent = "PIN aktual është i pasaktë.";
            return;
        }
    }

    const pinRegex = /^[0-9]{3,6}$/;
    if (!pinRegex.test(newPin)) {
        dom.changeClearSalePinErrorElement.textContent = "PIN i ri duhet të jetë 3 deri në 6 shifra numerike.";
        return;
    }
    if (newPin !== confirmPin) {
        dom.changeClearSalePinErrorElement.textContent = "PIN-et e reja nuk përputhen.";
        return;
    }

    await storage.saveClearSalePinHash(state.currentManagingBusinessId, newPin);
    toast.showSuccessToast("PIN-i për pastrimin e shitjes u ndryshua me sukses.");
    closeChangeClearSalePinModal();
}
if (dom.changeClearSalePinForm) { 
    dom.changeClearSalePinForm.addEventListener('submit', handleChangeClearSalePin);
}
if (dom.changeClearSalePinModalCloseBtn) {
    dom.changeClearSalePinModalCloseBtn.addEventListener('click', closeChangeClearSalePinModal);
}
if (dom.cancelChangeClearSalePinBtn) {
    dom.cancelChangeClearSalePinBtn.addEventListener('click', closeChangeClearSalePinModal);
}