/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Seller POS View ---
export const sellerPosView = document.getElementById('seller-pos-view') as HTMLDivElement | null;
export const productSearchInput = document.getElementById('product-search-input') as HTMLInputElement | null;
export const productTableBodyElement = document.getElementById('product-table-body') as HTMLTableSectionElement | null;
export const saleItemsListElement = document.getElementById('sale-items-list') as HTMLDivElement | null;
export const subtotalElement = document.getElementById('subtotal') as HTMLSpanElement | null;
export const grandTotalElement = document.getElementById('grand-total') as HTMLSpanElement | null;
export const triggerCompleteSaleBtn = document.getElementById('trigger-complete-sale-btn') as HTMLButtonElement | null;
export const clearSaleBtn = document.getElementById('clear-sale-btn') as HTMLButtonElement | null;
export const customerSearchInput = document.getElementById('customer-search-input') as HTMLInputElement | null;
export const customerDropdownPanel = document.getElementById('customer-dropdown-panel') as HTMLDivElement | null;
export const sellerViewShiftSalesBtn = document.getElementById('seller-view-shift-sales-btn') as HTMLButtonElement | null;
export const sellerCashStatusContainer = document.getElementById('seller-cash-status-container') as HTMLDivElement | null;
export const sellerInitialCashElement = document.getElementById('seller-initial-cash') as HTMLSpanElement | null;
export const sellerTotalSalesCashElement = document.getElementById('seller-total-sales-cash') as HTMLSpanElement | null;
export const sellerCurrentCashElement = document.getElementById('seller-current-cash') as HTMLSpanElement | null;
export const sellerDayStatusMessageElement = document.getElementById('seller-day-status-message') as HTMLParagraphElement | null;

// --- Payment Modal (Seller) ---
export const paymentModal = document.getElementById('payment-modal') as HTMLDivElement | null;
export const paymentModalTotalAmountDisplay = document.getElementById('payment-modal-total-amount-display') as HTMLSpanElement | null;
export const paymentAmountReceivedInput = document.getElementById('payment-amount-received') as HTMLInputElement | null;
export const paymentModalChangeAmountDisplay = document.getElementById('payment-modal-change-amount-display') as HTMLSpanElement | null;
export const paymentModalErrorElement = document.getElementById('payment-modal-error') as HTMLParagraphElement | null;
export const quickPayButtonsContainer = document.getElementById('quick-pay-buttons-container') as HTMLDivElement | null;
export const confirmPaymentBtn = document.getElementById('confirm-payment-btn') as HTMLButtonElement | null;
export const cancelPaymentBtn = document.getElementById('cancel-payment-btn') as HTMLButtonElement | null;
export const paymentModalCloseBtn = document.getElementById('payment-modal-close-btn') as HTMLButtonElement | null;

// --- Clear Sale Confirmation Modal (Seller) ---
export const clearSaleConfirmationModal = document.getElementById('clear-sale-confirmation-modal') as HTMLDivElement | null;
export const clearSalePinInput = document.getElementById('clear-sale-pin-input') as HTMLInputElement | null;
export const clearSaleErrorElement = document.getElementById('clear-sale-error') as HTMLParagraphElement | null;
export const confirmClearSaleWithPinBtn = document.getElementById('confirm-clear-sale-with-pin-btn') as HTMLButtonElement | null;
export const cancelClearSaleConfirmationBtn = document.getElementById('cancel-clear-sale-confirmation-btn') as HTMLButtonElement | null;
export const clearSaleConfirmationModalCloseBtn = document.getElementById('clear-sale-confirmation-modal-close-btn') as HTMLButtonElement | null;

// --- Seller Shift Sales Modal ---
export const sellerShiftSalesModal = document.getElementById('seller-shift-sales-modal') as HTMLDivElement | null;
export const sellerShiftSalesModalTitle = document.getElementById('seller-shift-sales-modal-title') as HTMLHeadingElement | null;
export const sellerShiftSalesContent = document.getElementById('seller-shift-sales-content') as HTMLDivElement | null;
export const closeSellerShiftSalesModalBtn = document.getElementById('close-seller-shift-sales-modal-btn') as HTMLButtonElement | null;
export const sellerShiftSalesModalCloseBtn = document.getElementById('seller-shift-sales-modal-close-btn') as HTMLButtonElement | null;
export const printSellerShiftSalesBtn = document.getElementById('print-seller-shift-sales-btn') as HTMLButtonElement | null;

// --- Petty Cash Modal (Seller) ---
export const recordPettyCashBtn = document.getElementById('record-petty-cash-btn') as HTMLButtonElement | null;
export const pettyCashModal = document.getElementById('petty-cash-modal') as HTMLDivElement | null;
export const pettyCashForm = document.getElementById('petty-cash-form') as HTMLFormElement | null;
export const pettyCashDescription = document.getElementById('petty-cash-description') as HTMLTextAreaElement | null;
export const pettyCashAmount = document.getElementById('petty-cash-amount') as HTMLInputElement | null;
export const pettyCashFormError = document.getElementById('petty-cash-form-error') as HTMLParagraphElement | null;
export const savePettyCashBtn = document.getElementById('save-petty-cash-btn') as HTMLButtonElement | null;
export const cancelPettyCashBtn = document.getElementById('cancel-petty-cash-btn') as HTMLButtonElement | null;
export const pettyCashModalCloseBtn = document.getElementById('petty-cash-modal-close-btn') as HTMLButtonElement | null;
