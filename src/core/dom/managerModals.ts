/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Manager - Actions Modals & Forms ---
export const startDayBtn = document.getElementById('start-day-btn') as HTMLButtonElement | null;
export const startDayModal = document.getElementById('start-day-modal') as HTMLDivElement | null;
export const startDayForm = document.getElementById('start-day-form') as HTMLFormElement | null;
export const modalCloseBtn = document.getElementById('modal-close-btn') as HTMLButtonElement | null; // Specific to startDayModal
export const cancelStartDayBtn = document.getElementById('cancel-start-day-btn') as HTMLButtonElement | null;
export const saveStartDayBtn = document.getElementById('save-start-day-btn') as HTMLButtonElement | null;
export const selectSellerDropdown = document.getElementById('select-seller') as HTMLSelectElement | null;
export const selectShiftDropdown = document.getElementById('select-shift') as HTMLSelectElement | null;
export const initialCashInput = document.getElementById('initial-cash') as HTMLInputElement | null;
export const modalProductStockList = document.getElementById('modal-product-stock-list') as HTMLDivElement | null;

export const editOpenCashEntryBtn = document.getElementById('edit-open-cash-entry-btn') as HTMLButtonElement | null;
export const editOpenCashEntryModal = document.getElementById('edit-open-cash-entry-modal') as HTMLDivElement | null;
export const selectEntryToEditDropdown = document.getElementById('select-entry-to-edit-dropdown') as HTMLSelectElement | null;
export const editOpenCashEntryForm = document.getElementById('edit-open-cash-entry-form') as HTMLFormElement | null;
export const editEntryDetailsView = document.getElementById('edit-entry-details-view') as HTMLDivElement | null;
export const editEntrySellerUsernameElement = document.getElementById('edit-entry-seller-username-element') as HTMLSpanElement | null;
export const editEntryDateElement = document.getElementById('edit-entry-date-element') as HTMLSpanElement | null;
export const editEntryShiftStrongElement = document.getElementById('edit-entry-shift-element') as HTMLElement | null;
export const editInitialCashInput = document.getElementById('edit-initial-cash-input') as HTMLInputElement | null;
export const editModalProductStockList = document.getElementById('edit-modal-product-stock-list') as HTMLDivElement | null;
export const editOpenCashEntryErrorElement = document.getElementById('edit-open-cash-entry-error') as HTMLParagraphElement | null;
export const saveEditOpenCashEntryBtn = document.getElementById('save-edit-open-cash-entry-btn') as HTMLButtonElement | null;
export const cancelEditOpenCashEntryBtn = document.getElementById('cancel-edit-open-cash-entry-btn') as HTMLButtonElement | null;
export const editOpenCashEntryModalCloseBtn = document.getElementById('edit-open-cash-entry-modal-close-btn') as HTMLButtonElement | null;

export const reconcileDayBtn = document.getElementById('reconcile-day-btn') as HTMLButtonElement | null;
export const reconciliationModal = document.getElementById('reconciliation-modal') as HTMLDivElement | null;
export const reconciliationForm = document.getElementById('reconciliation-form') as HTMLFormElement | null;
export const selectSellerForReconciliationDropdown = document.getElementById('select-seller-for-reconciliation') as HTMLSelectElement | null;
export const reconciliationDetailsView = document.getElementById('reconciliation-details-view') as HTMLDivElement | null;
export const reconciliationSellerUsernameElement = document.getElementById('reconciliation-seller-username') as HTMLSpanElement | null;
export const reconciliationEntryDateElement = document.getElementById('reconciliation-entry-date') as HTMLSpanElement | null;
export const reconciliationEntryShiftStrongElement = document.getElementById('reconciliation-entry-shift') as HTMLElement | null;
export const reconciliationInitialCashElement = document.getElementById('reconciliation-initial-cash') as HTMLSpanElement | null;
export const reconciliationSystemSalesElement = document.getElementById('reconciliation-system-sales') as HTMLSpanElement | null;
export const reconciliationExpectedCashElement = document.getElementById('reconciliation-expected-cash') as HTMLSpanElement | null;
export const zeroSalesReconciliationNoticeElement = document.getElementById('zero-sales-reconciliation-notice') as HTMLDivElement | null;
export const confirmZeroSalesClosureCheckbox = document.getElementById('confirm-zero-sales-closure') as HTMLInputElement | null;
export const reconciliationActualCashCountedInput = document.getElementById('reconciliation-actual-cash-counted') as HTMLInputElement | null;
export const reconciliationDifferenceElement = document.getElementById('reconciliation-difference') as HTMLSpanElement | null;
export const reconciliationDifferenceIcon = document.getElementById('reconciliation-difference-icon') as HTMLSpanElement | null;
export const reconciliationQuickCashButtonsContainer = document.getElementById('reconciliation-quick-cash-buttons-container') as HTMLDivElement | null; 
export const confirmReconciliationBtn = document.getElementById('confirm-reconciliation-btn') as HTMLButtonElement | null;
export const reconciliationModalErrorElement = document.getElementById('reconciliation-modal-error') as HTMLParagraphElement | null;
export const cancelReconciliationBtn = document.getElementById('cancel-reconciliation-btn') as HTMLButtonElement | null;
export const reconciliationModalCloseBtn = document.getElementById('reconciliation-modal-close-btn') as HTMLButtonElement | null;

export const changeClearSalePinBtn = document.getElementById('change-clear-sale-pin-btn') as HTMLButtonElement | null;
export const changeClearSalePinModal = document.getElementById('change-clear-sale-pin-modal') as HTMLDivElement | null;
export const changeClearSalePinForm = document.getElementById('change-clear-sale-pin-form') as HTMLFormElement | null;
export const currentClearSalePinInput = document.getElementById('current-clear-sale-pin-input') as HTMLInputElement | null;
export const currentClearSalePinGroup = document.getElementById('current-clear-sale-pin-group') as HTMLDivElement | null;
export const newClearSalePinInput = document.getElementById('new-clear-sale-pin-input') as HTMLInputElement | null;
export const confirmNewClearSalePinInput = document.getElementById('confirm-new-clear-sale-pin-input') as HTMLInputElement | null;
export const changeClearSalePinErrorElement = document.getElementById('change-clear-sale-pin-error') as HTMLParagraphElement | null;
export const changeClearSalePinModalCloseBtn = document.getElementById('change-clear-sale-pin-modal-close-btn') as HTMLButtonElement | null;
export const cancelChangeClearSalePinBtn = document.getElementById('cancel-change-clear-sale-pin-btn') as HTMLButtonElement | null;
export const saveClearSalePinBtn = document.getElementById('save-clear-sale-pin-btn') as HTMLButtonElement | null;

// --- Manager - User Management Modal ---
export const userFormModal = document.getElementById('user-form-modal') as HTMLDivElement | null;
export const userForm = document.getElementById('user-form') as HTMLFormElement | null;
export const userFormModalTitle = document.getElementById('user-form-modal-title') as HTMLHeadingElement | null;
export const editUserIdInput = document.getElementById('edit-user-id') as HTMLInputElement | null;
export const userFormUsernameInput = document.getElementById('user-form-username') as HTMLInputElement | null;
export const userFormPasswordInput = document.getElementById('user-form-password') as HTMLInputElement | null;
export const userFormPasswordGroup = document.getElementById('user-form-password-group') as HTMLDivElement | null;
export const userFormPasswordHelp = document.getElementById('user-form-password-help') as HTMLElement | null;
export const userFormRoleSelect = document.getElementById('user-form-role') as HTMLSelectElement | null;
export const userFormGroupSelect = document.getElementById('user-form-group') as HTMLSelectElement | null;
export const userFormErrorElement = document.getElementById('user-form-error') as HTMLParagraphElement | null;
export const cancelUserFormBtn = document.getElementById('cancel-user-form-btn') as HTMLButtonElement | null;
export const userFormModalCloseBtn = document.getElementById('user-form-modal-close-btn') as HTMLButtonElement | null;
export const saveUserBtn = document.getElementById('save-user-btn') as HTMLButtonElement | null;

// --- Manager - Group Management Modal ---
export const groupFormModal = document.getElementById('group-form-modal') as HTMLDivElement | null;
export const groupForm = document.getElementById('group-form') as HTMLFormElement | null;
export const groupFormModalTitle = document.getElementById('group-form-modal-title') as HTMLHeadingElement | null;
export const editGroupIdInput = document.getElementById('edit-group-id') as HTMLInputElement | null;
export const groupNameInput = document.getElementById('group-name-input') as HTMLInputElement | null;
export const groupDescriptionInput = document.getElementById('group-description-input') as HTMLTextAreaElement | null;
export const groupPrivilegesContainer = document.getElementById('group-privileges-container') as HTMLDivElement | null;
export const groupFormErrorElement = document.getElementById('group-form-error') as HTMLParagraphElement | null;
export const cancelGroupFormBtn = document.getElementById('cancel-group-form-btn') as HTMLButtonElement | null;
export const groupFormModalCloseBtn = document.getElementById('group-form-modal-close-btn') as HTMLButtonElement | null;
export const saveGroupBtn = document.getElementById('save-group-btn') as HTMLButtonElement | null;

// --- Manager - Product Management Modal ---
export const productFormModal = document.getElementById('product-form-modal') as HTMLDivElement | null;
export const productForm = document.getElementById('product-form') as HTMLFormElement | null;
export const productFormModalTitle = document.getElementById('product-form-modal-title') as HTMLHeadingElement | null;
export const editProductIdInput = document.getElementById('edit-product-id') as HTMLInputElement | null;
export const productFormCodeInput = document.getElementById('product-form-code') as HTMLInputElement | null;
export const productFormNameInput = document.getElementById('product-form-name') as HTMLInputElement | null;
export const productFormCategorySelect = document.getElementById('product-form-category') as HTMLSelectElement | null;
export const productFormPriceInput = document.getElementById('product-form-price') as HTMLInputElement | null;
export const productFormUnitInput = document.getElementById('product-form-unit') as HTMLSelectElement | null;
export const productFormQtyPerPackageInput = document.getElementById('product-form-qty-per-package') as HTMLInputElement | null;
export const productFormErrorElement = document.getElementById('product-form-error') as HTMLParagraphElement | null;
export const cancelProductFormBtn = document.getElementById('cancel-product-form-btn') as HTMLButtonElement | null;
export const productFormModalCloseBtn = document.getElementById('product-form-modal-close-btn') as HTMLButtonElement | null;
export const saveProductBtn = document.getElementById('save-product-btn') as HTMLButtonElement | null;
export const productFormBarcode = document.getElementById('product-form-barcode') as HTMLInputElement | null;
export const productFormItemTypeSelect = document.getElementById('product-form-item-type') as HTMLSelectElement | null;
export const productFormIsActiveCheckbox = document.getElementById('product-form-is-active') as HTMLInputElement | null;
export const productFormVatRateInput = document.getElementById('product-form-vat-rate') as HTMLInputElement | null;
export const productFormDescriptionTextarea = document.getElementById('product-form-description') as HTMLTextAreaElement | null;
export const productFormPurchasePriceInput = document.getElementById('product-form-purchase-price') as HTMLInputElement | null;
export const productFormMinStockInput = document.getElementById('product-form-min-stock') as HTMLInputElement | null;
export const productFormPrimarySupplierSelect = document.getElementById('product-form-primary-supplier') as HTMLSelectElement | null;
export const productFormImageInput = document.getElementById('product-form-image') as HTMLInputElement | null;
export const productFormImagePreview = document.getElementById('product-form-image-preview') as HTMLImageElement | null;
export const productFormIsFinalProductCheckbox = document.getElementById('product-form-is-final-product') as HTMLInputElement | null;
export const productFormRecipeCreationSection = document.getElementById('product-form-recipe-creation-section') as HTMLDivElement | null;
export const pfrIngredientSelect = document.getElementById('pfr-ingredient-select') as HTMLSelectElement | null;
export const pfrIngredientQuantityInput = document.getElementById('pfr-ingredient-quantity') as HTMLInputElement | null;
export const pfrIngredientUnitInput = document.getElementById('pfr-ingredient-unit') as HTMLInputElement | null;
export const pfrAddIngredientBtn = document.getElementById('pfr-add-ingredient-btn') as HTMLButtonElement | null;
export const pfrIngredientsTbody = document.getElementById('pfr-ingredients-tbody') as HTMLTableSectionElement | null;
export const pfrRecipeNotes = document.getElementById('pfr-recipe-notes') as HTMLTextAreaElement | null;

// --- Manager - Category Management Modal ---
export const categoryFormModal = document.getElementById('category-form-modal') as HTMLDivElement | null;
export const categoryForm = document.getElementById('category-form') as HTMLFormElement | null;
export const categoryFormModalTitle = document.getElementById('category-form-modal-title') as HTMLHeadingElement | null;
export const editCategoryIdInput = document.getElementById('edit-category-id') as HTMLInputElement | null;
export const categoryFormNameInput = document.getElementById('category-form-name') as HTMLInputElement | null;
export const categoryFormErrorElement = document.getElementById('category-form-error') as HTMLParagraphElement | null;
export const cancelCategoryFormBtn = document.getElementById('cancel-category-form-btn') as HTMLButtonElement | null;
export const categoryFormModalCloseBtn = document.getElementById('category-form-modal-close-btn') as HTMLButtonElement | null;
export const saveCategoryBtn = document.getElementById('save-category-btn') as HTMLButtonElement | null;

// --- Manager - Item Type Management Modal ---
export const itemTypeFormModal = document.getElementById('item-type-form-modal') as HTMLDivElement | null;
export const itemTypeForm = document.getElementById('item-type-form') as HTMLFormElement | null;
export const itemTypeFormModalTitle = document.getElementById('item-type-form-modal-title') as HTMLHeadingElement | null;
export const editItemTypeIdInput = document.getElementById('edit-item-type-id') as HTMLInputElement | null;
export const itemTypeNameInput = document.getElementById('item-type-name-input') as HTMLInputElement | null;
export const itemTypeDescriptionInput = document.getElementById('item-type-description-input') as HTMLTextAreaElement | null;
export const itemTypeFormErrorElement = document.getElementById('item-type-form-error') as HTMLParagraphElement | null;
export const cancelItemTypeFormBtn = document.getElementById('cancel-item-type-form-btn') as HTMLButtonElement | null;
export const itemTypeFormModalCloseBtn = document.getElementById('item-type-form-modal-close-btn') as HTMLButtonElement | null;
export const saveItemTypeBtn = document.getElementById('save-item-type-btn') as HTMLButtonElement | null;

// --- Manager - Deal Management Modal ---
export const dealFormModal = document.getElementById('deal-form-modal') as HTMLDivElement | null;
export const dealForm = document.getElementById('deal-form') as HTMLFormElement | null;
export const dealFormModalTitle = document.getElementById('deal-form-modal-title') as HTMLHeadingElement | null;
export const editDealIdInput = document.getElementById('edit-deal-id') as HTMLInputElement | null;
export const dealFormNameInput = document.getElementById('deal-form-name') as HTMLInputElement | null;
export const dealFormPriceInput = document.getElementById('deal-form-price') as HTMLInputElement | null;
export const dealFormDescriptionInput = document.getElementById('deal-form-description') as HTMLTextAreaElement | null;
export const dealFormIsActiveCheckbox = document.getElementById('deal-form-is-active') as HTMLInputElement | null;
export const dealFormProductSelectionDiv = document.getElementById('deal-form-product-selection') as HTMLDivElement | null;
export const dealProductSearchInputModal = document.getElementById('deal-product-search-input-modal') as HTMLInputElement | null;
export const dealFormErrorElement = document.getElementById('deal-form-error') as HTMLParagraphElement | null;
export const cancelDealFormBtn = document.getElementById('cancel-deal-form-btn') as HTMLButtonElement | null;
export const dealFormModalCloseBtn = document.getElementById('deal-form-modal-close-btn') as HTMLButtonElement | null;
export const saveDealBtn = document.getElementById('save-deal-btn') as HTMLButtonElement | null;

// --- Manager - Customer Management Modal ---
export const customerFormModal = document.getElementById('customer-form-modal') as HTMLDivElement | null;
export const customerForm = document.getElementById('customer-form') as HTMLFormElement | null;
export const customerFormModalTitle = document.getElementById('customer-form-modal-title') as HTMLHeadingElement | null;
export const editCustomerIdInput = document.getElementById('edit-customer-id') as HTMLInputElement | null;
export const customerFormCodeInput = document.getElementById('customer-form-code') as HTMLInputElement | null;
export const customerFormNameInput = document.getElementById('customer-form-name') as HTMLInputElement | null;
export const customerFormUniqueIdInput = document.getElementById('customer-form-unique-id') as HTMLInputElement | null;
export const customerFormPhoneInput = document.getElementById('customer-form-phone') as HTMLInputElement | null;
export const customerFormEmailInput = document.getElementById('customer-form-email') as HTMLInputElement | null;
export const customerFormAddressInput = document.getElementById('customer-form-address') as HTMLInputElement | null;
export const customerFormNotesInput = document.getElementById('customer-form-notes') as HTMLTextAreaElement | null;
export const customerFormErrorElement = document.getElementById('customer-form-error') as HTMLParagraphElement | null;
export const cancelCustomerFormBtn = document.getElementById('cancel-customer-form-btn') as HTMLButtonElement | null;
export const customerFormModalCloseBtn = document.getElementById('customer-form-modal-close-btn') as HTMLButtonElement | null;
export const saveCustomerBtn = document.getElementById('save-customer-btn') as HTMLButtonElement | null;

// --- Manager - Supplier Management Modal ---
export const supplierFormModal = document.getElementById('supplier-form-modal') as HTMLDivElement | null;
export const supplierForm = document.getElementById('supplier-form') as HTMLFormElement | null;
export const supplierFormModalTitle = document.getElementById('supplier-form-modal-title') as HTMLHeadingElement | null;
export const editSupplierIdInput = document.getElementById('edit-supplier-id') as HTMLInputElement | null;
export const supplierFormCodeInput = document.getElementById('supplier-form-code') as HTMLInputElement | null;
export const supplierFormNameInput = document.getElementById('supplier-form-name') as HTMLInputElement | null;
export const supplierFormContactPersonInput = document.getElementById('supplier-form-contact-person') as HTMLInputElement | null;
export const supplierFormPhoneInput = document.getElementById('supplier-form-phone') as HTMLInputElement | null;
export const supplierFormEmailInput = document.getElementById('supplier-form-email') as HTMLInputElement | null;
export const supplierFormAddressInput = document.getElementById('supplier-form-address') as HTMLInputElement | null;
export const supplierFormNiptInput = document.getElementById('supplier-form-nipt') as HTMLInputElement | null;
export const supplierFormErrorElement = document.getElementById('supplier-form-error') as HTMLParagraphElement | null;
export const cancelSupplierFormBtn = document.getElementById('cancel-supplier-form-btn') as HTMLButtonElement | null;
export const supplierFormModalCloseBtn = document.getElementById('supplier-form-modal-close-btn') as HTMLButtonElement | null;
export const saveSupplierBtn = document.getElementById('save-supplier-btn') as HTMLButtonElement | null;
export const supplierFormCreateAsCustomerCheckbox = document.getElementById('supplier-form-create-as-customer') as HTMLInputElement | null;

// --- Manager - Local Purchase Modals & Forms ---
// Forms are part of main content view, so their elements are in managerContent.ts or similar
export const localPurchaseDetailsModal = document.getElementById('local-purchase-details-modal') as HTMLDivElement | null;
export const lpDetailsSupplierName = document.getElementById('lp-details-supplier-name') as HTMLSpanElement | null;
export const lpDetailsSystemInvoiceNumber = document.getElementById('lp-details-system-invoice-number') as HTMLSpanElement | null;
export const lpDetailsSupplierInvoiceNumber = document.getElementById('lp-details-supplier-invoice-number') as HTMLSpanElement | null;
export const lpDetailsInvoiceDate = document.getElementById('lp-details-invoice-date') as HTMLSpanElement | null;
export const lpDetailsReceiptDate = document.getElementById('lp-details-receipt-date') as HTMLSpanElement | null;
export const lpDetailsPaymentStatus = document.getElementById('lp-details-payment-status') as HTMLSpanElement | null;
export const lpDetailsAmountPaid = document.getElementById('lp-details-amount-paid') as HTMLSpanElement | null;
export const lpDetailsItemsTbody = document.getElementById('lp-details-items-tbody') as HTMLTableSectionElement | null;
export const lpDetailsTotalWithoutVat = document.getElementById('lp-details-total-without-vat') as HTMLSpanElement | null;
export const lpDetailsTotalVat = document.getElementById('lp-details-total-vat') as HTMLSpanElement | null;
export const lpDetailsTotalWithVat = document.getElementById('lp-details-total-with-vat') as HTMLSpanElement | null;
export const lpDetailsPrintInvoiceBtn = document.getElementById('lp-details-print-invoice-btn') as HTMLButtonElement | null;
export const lpDetailsModalCloseBtn = document.getElementById('lp-details-modal-close-btn') as HTMLButtonElement | null;
export const lpDetailsCloseModalActionBtn = document.getElementById('lp-details-close-modal-action-btn') as HTMLButtonElement | null;

// --- Manager - Return Purchases Modals & Forms ---
// Forms are part of main content view
export const returnPurchaseDetailsModal = document.getElementById('return-purchase-details-modal') as HTMLDivElement | null;
export const rpDetailsSupplierName = document.getElementById('rp-details-supplier-name') as HTMLSpanElement | null;
export const rpDetailsSystemInvoiceNumber = document.getElementById('rp-details-system-invoice-number') as HTMLSpanElement | null;
export const rpDetailsSupplierInvoiceNumber = document.getElementById('rp-details-supplier-invoice-number') as HTMLSpanElement | null;
export const rpDetailsInvoiceDate = document.getElementById('rp-details-invoice-date') as HTMLSpanElement | null;
export const rpDetailsReason = document.getElementById('rp-details-reason') as HTMLSpanElement | null;
export const rpDetailsItemsTbody = document.getElementById('rp-details-items-tbody') as HTMLTableSectionElement | null;
export const rpDetailsTotalWithoutVat = document.getElementById('rp-details-total-without-vat') as HTMLSpanElement | null;
export const rpDetailsTotalVat = document.getElementById('rp-details-total-vat') as HTMLSpanElement | null;
export const rpDetailsTotalWithVat = document.getElementById('rp-details-total-with-vat') as HTMLSpanElement | null;
export const rpDetailsPrintInvoiceBtn = document.getElementById('rp-details-print-invoice-btn') as HTMLButtonElement | null;
export const rpDetailsModalCloseBtn = document.getElementById('rp-details-modal-close-btn') as HTMLButtonElement | null;
export const rpDetailsCloseModalActionBtn = document.getElementById('rp-details-close-modal-action-btn') as HTMLButtonElement | null;

// --- Manager - Outgoing Payments Modal & Details ---
export const outgoingPaymentDetailsModal = document.getElementById('outgoing-payment-details-modal') as HTMLDivElement | null;
export const opDetailsPaymentIdSpan = document.getElementById('op-details-payment-id') as HTMLSpanElement | null;
export const opDetailsSupplierNameSpan = document.getElementById('op-details-supplier-name') as HTMLSpanElement | null;
export const opDetailsPaymentDateSpan = document.getElementById('op-details-payment-date') as HTMLSpanElement | null;
export const opDetailsTotalPaidAmountSpan = document.getElementById('op-details-total-paid-amount') as HTMLSpanElement | null;
export const opDetailsPaymentMethodSpan = document.getElementById('op-details-payment-method') as HTMLSpanElement | null;
export const opDetailsReferenceSpan = document.getElementById('op-details-reference') as HTMLSpanElement | null;
export const opDetailsNotesSpan = document.getElementById('op-details-notes') as HTMLSpanElement | null;
export const opDetailsAllocationsTbody = document.getElementById('op-details-allocations-tbody') as HTMLTableSectionElement | null;
export const opDetailsPrintPaymentBtn = document.getElementById('op-details-print-payment-btn') as HTMLButtonElement | null;
export const opDetailsModalCloseBtn = document.getElementById('op-details-modal-close-btn') as HTMLButtonElement | null;
export const opDetailsCloseModalActionBtn = document.getElementById('op-details-close-modal-action-btn') as HTMLButtonElement | null;

// --- Manager - Change Customer Modal (for Today's Sales) ---
export const changeCustomerModal = document.getElementById('change-customer-modal') as HTMLDivElement | null;
export const changeCustomerSaleIdInput = document.getElementById('change-customer-sale-id') as HTMLInputElement | null;
export const changeCustomerInvoiceNumber = document.getElementById('change-customer-invoice-number') as HTMLSpanElement | null;
export const changeCustomerCurrentCustomer = document.getElementById('change-customer-current-customer') as HTMLSpanElement | null;
export const changeCustomerSelect = document.getElementById('change-customer-select') as HTMLSelectElement | null;
export const changeCustomerModalError = document.getElementById('change-customer-modal-error') as HTMLParagraphElement | null;
export const changeCustomerForm = document.getElementById('change-customer-form') as HTMLFormElement | null;
export const saveCustomerChangeBtn = document.getElementById('save-customer-change-btn') as HTMLButtonElement | null;
export const cancelCustomerChangeBtn = document.getElementById('cancel-customer-change-btn') as HTMLButtonElement | null;
export const changeCustomerModalCloseBtn = document.getElementById('change-customer-modal-close-btn') as HTMLButtonElement | null;

// Sales Return Details Modal (Manager)
export const salesReturnDetailsModal = document.getElementById('sales-return-details-modal') as HTMLDivElement | null;
export const srDetailsSystemInvoiceNumber = document.getElementById('sr-details-system-invoice-number') as HTMLSpanElement | null;
export const srDetailsOriginalInvoiceNumber = document.getElementById('sr-details-original-invoice-number') as HTMLSpanElement | null;
export const srDetailsCustomerName = document.getElementById('sr-details-customer-name') as HTMLSpanElement | null;
export const srDetailsReturnDate = document.getElementById('sr-details-return-date') as HTMLSpanElement | null;
export const srDetailsReason = document.getElementById('sr-details-reason') as HTMLSpanElement | null;
export const srDetailsItemsTbody = document.getElementById('sr-details-items-tbody') as HTMLTableSectionElement | null;
export const srDetailsTotalWithoutVat = document.getElementById('sr-details-total-without-vat') as HTMLSpanElement | null;
export const srDetailsTotalVat = document.getElementById('sr-details-total-vat') as HTMLSpanElement | null;
export const srDetailsTotalWithVat = document.getElementById('sr-details-total-with-vat') as HTMLSpanElement | null;
export const srDetailsPrintInvoiceBtn = document.getElementById('sr-details-print-invoice-btn') as HTMLButtonElement | null;
export const srDetailsModalCloseBtn = document.getElementById('sr-details-modal-close-btn') as HTMLButtonElement | null;
export const srDetailsCloseModalActionBtn = document.getElementById('sr-details-close-modal-action-btn') as HTMLButtonElement | null;

// --- Buttons to show modals ---
export const showAddCategoryModalBtn = document.getElementById('show-add-category-modal-btn') as HTMLButtonElement | null;
export const showAddCustomerModalBtn = document.getElementById('show-add-customer-modal-btn') as HTMLButtonElement | null;
export const showAddDealModalBtn = document.getElementById('show-add-deal-modal-btn') as HTMLButtonElement | null;
export const showAddItemTypeModalBtn = document.getElementById('show-add-item-type-modal-btn') as HTMLButtonElement | null;
export const showAddLocalPurchaseModalBtn = document.getElementById('show-add-local-purchase-modal-btn') as HTMLButtonElement | null;
export const showAddProductModalBtn = document.getElementById('show-add-product-modal-btn') as HTMLButtonElement | null;
export const showAddReturnPurchaseFormBtn = document.getElementById('show-add-return-purchase-form-btn') as HTMLButtonElement | null;
export const showAddSupplierModalBtn = document.getElementById('show-add-supplier-modal-btn') as HTMLButtonElement | null;
export const showAddUserModalBtn = document.getElementById('show-add-user-modal-btn') as HTMLButtonElement | null;
// export const showAddGroupModalBtn = document.getElementById('show-add-group-modal-btn') as HTMLButtonElement | null;
