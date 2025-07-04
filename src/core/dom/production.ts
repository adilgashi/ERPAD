
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Production Management Panels ---
export const recipeManagementPanel = document.getElementById('recipe-management-panel') as HTMLDivElement | null;
export const productionOrderPanel = document.getElementById('production-order-panel') as HTMLDivElement | null;
export const productionStagePanel = document.getElementById('production-stage-panel') as HTMLDivElement | null;
export const productionRoutingPanel = document.getElementById('production-routing-panel') as HTMLDivElement | null;


// --- Recipe Management ---
export const recipeListTbody = document.getElementById('recipe-list-tbody') as HTMLTableSectionElement | null;
export const showAddRecipeModalBtn = document.getElementById('show-add-recipe-modal-btn') as HTMLButtonElement | null;

// Recipe Form Modal
export const recipeFormModal = document.getElementById('recipe-form-modal') as HTMLDivElement | null;
export const recipeForm = document.getElementById('recipe-form') as HTMLFormElement | null;
export const recipeFormModalTitle = document.getElementById('recipe-form-modal-title') as HTMLHeadingElement | null;
export const editRecipeIdInput = document.getElementById('edit-recipe-id') as HTMLInputElement | null;
export const recipeNameInput = document.getElementById('recipe-name-input') as HTMLInputElement | null;
export const recipeFinalProductSelect = document.getElementById('recipe-final-product-select') as HTMLSelectElement | null;
export const recipeRoutingSelect = document.getElementById('recipe-routing-select') as HTMLSelectElement | null;
export const recipeNotesTextarea = document.getElementById('recipe-notes-textarea') as HTMLTextAreaElement | null;
export const recipeIngredientSelect = document.getElementById('recipe-ingredient-select') as HTMLSelectElement | null;
export const recipeIngredientQuantityInput = document.getElementById('recipe-ingredient-quantity') as HTMLInputElement | null;
export const recipeIngredientUnitInput = document.getElementById('recipe-ingredient-unit') as HTMLInputElement | null;
export const addIngredientToRecipeBtn = document.getElementById('add-ingredient-to-recipe-btn') as HTMLButtonElement | null;
export const recipeIngredientsTbody = document.getElementById('recipe-ingredients-tbody') as HTMLTableSectionElement | null;
export const recipeFormError = document.getElementById('recipe-form-error') as HTMLParagraphElement | null;
export const saveRecipeBtn = document.getElementById('save-recipe-btn') as HTMLButtonElement | null;
export const cancelRecipeFormBtn = document.getElementById('cancel-recipe-form-btn') as HTMLButtonElement | null;
export const recipeFormModalCloseBtn = document.getElementById('recipe-form-modal-close-btn') as HTMLButtonElement | null;

// --- Production Order Management ---
export const productionOrderListTbody = document.getElementById('production-order-list-tbody') as HTMLTableSectionElement | null;
export const showAddProductionOrderModalBtn = document.getElementById('show-add-production-order-modal-btn') as HTMLButtonElement | null;

// Production Order Form Modal
export const productionOrderFormModal = document.getElementById('production-order-form-modal') as HTMLDivElement | null;
export const productionOrderForm = document.getElementById('production-order-form') as HTMLFormElement | null;
export const productionOrderFormModalTitle = document.getElementById('production-order-form-modal-title') as HTMLHeadingElement | null;
export const editProductionOrderIdInput = document.getElementById('edit-production-order-id') as HTMLInputElement | null;
export const productionOrderRecipeSelect = document.getElementById('production-order-recipe-select') as HTMLSelectElement | null;
export const productionOrderQuantityInput = document.getElementById('production-order-quantity') as HTMLInputElement | null;
export const productionOrderLostQuantityInput = document.getElementById('production-order-lost-quantity') as HTMLInputElement | null;
export const productionOrderDateInput = document.getElementById('production-order-date') as HTMLInputElement | null;
export const productionOrderDueDateInput = document.getElementById('production-order-due-date') as HTMLInputElement | null;
export const productionOrderMaterialsPreview = document.getElementById('production-order-materials-preview') as HTMLDivElement | null;
export const productionOrderFormError = document.getElementById('production-order-form-error') as HTMLParagraphElement | null;
export const saveProductionOrderBtn = document.getElementById('save-production-order-btn') as HTMLButtonElement | null;
export const cancelProductionOrderFormBtn = document.getElementById('cancel-production-order-form-btn') as HTMLButtonElement | null;
export const productionOrderFormModalCloseBtn = document.getElementById('production-order-form-modal-close-btn') as HTMLButtonElement | null;

// --- Production Stage Management ---
export const productionStageListTbody = document.getElementById('production-stage-list-tbody') as HTMLTableSectionElement | null;
export const showAddProductionStageModalBtn = document.getElementById('show-add-production-stage-modal-btn') as HTMLButtonElement | null;
export const productionStageFormModal = document.getElementById('production-stage-form-modal') as HTMLDivElement | null;
export const productionStageForm = document.getElementById('production-stage-form') as HTMLFormElement | null;
export const productionStageFormModalTitle = document.getElementById('production-stage-form-modal-title') as HTMLHeadingElement | null;
export const editProductionStageIdInput = document.getElementById('edit-production-stage-id') as HTMLInputElement | null;
export const productionStageNameInput = document.getElementById('production-stage-name-input') as HTMLInputElement | null;
export const productionStageDescriptionInput = document.getElementById('production-stage-description-input') as HTMLTextAreaElement | null;
export const productionStageFormError = document.getElementById('production-stage-form-error') as HTMLParagraphElement | null;
export const saveProductionStageBtn = document.getElementById('save-production-stage-btn') as HTMLButtonElement | null;
export const cancelProductionStageFormBtn = document.getElementById('cancel-production-stage-form-btn') as HTMLButtonElement | null;
export const productionStageFormModalCloseBtn = document.getElementById('production-stage-form-modal-close-btn') as HTMLButtonElement | null;

// --- Production Routing Management ---
export const productionRoutingListTbody = document.getElementById('production-routing-list-tbody') as HTMLTableSectionElement | null;
export const showAddProductionRoutingModalBtn = document.getElementById('show-add-production-routing-modal-btn') as HTMLButtonElement | null;
export const productionRoutingFormModal = document.getElementById('production-routing-form-modal') as HTMLDivElement | null;
export const productionRoutingForm = document.getElementById('production-routing-form') as HTMLFormElement | null;
export const productionRoutingFormModalTitle = document.getElementById('production-routing-form-modal-title') as HTMLHeadingElement | null;
export const editProductionRoutingIdInput = document.getElementById('edit-production-routing-id') as HTMLInputElement | null;
export const productionRoutingNameInput = document.getElementById('production-routing-name-input') as HTMLInputElement | null;
export const productionRoutingStagesListDiv = document.getElementById('production-routing-stages-list') as HTMLDivElement | null;
export const productionRoutingFormError = document.getElementById('production-routing-form-error') as HTMLParagraphElement | null;
export const saveProductionRoutingBtn = document.getElementById('save-production-routing-btn') as HTMLButtonElement | null;
export const cancelProductionRoutingFormBtn = document.getElementById('cancel-production-routing-form-btn') as HTMLButtonElement | null;
export const productionRoutingFormModalCloseBtn = document.getElementById('production-routing-form-modal-close-btn') as HTMLButtonElement | null;

// --- Production Order Details Modal ---
export const productionOrderDetailsModal = document.getElementById('production-order-details-modal') as HTMLDivElement | null;
export const poDetailsModalTitle = document.getElementById('po-details-modal-title') as HTMLHeadingElement | null;
export const poDetailsPrintableContent = document.getElementById('po-details-printable-content') as HTMLDivElement | null;
export const poDetailsPrintBtn = document.getElementById('po-details-print-btn') as HTMLButtonElement | null;
export const poDetailsCloseBtn = document.getElementById('po-details-close-btn') as HTMLButtonElement | null;
export const poDetailsModalCloseBtn = document.getElementById('po-details-modal-close-btn') as HTMLButtonElement | null;
