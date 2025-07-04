/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Super Admin Panel ---
export const superAdminPanelView = document.getElementById('super-admin-panel-view') as HTMLDivElement | null;
export const superAdminSidebar = document.getElementById('super-admin-sidebar') as HTMLDivElement | null;
export const superAdminSidebarAddBusinessBtn = document.getElementById('super-admin-sidebar-add-business-btn') as HTMLButtonElement | null;
export const superAdminSidebarViewBusinessesBtn = document.getElementById('super-admin-sidebar-view-businesses-btn') as HTMLButtonElement | null;
export const superAdminSidebarManagePackagesBtn = document.getElementById('super-admin-sidebar-manage-packages-btn') as HTMLButtonElement | null;
export const superAdminSidebarManageManagerMenuBtn = document.getElementById('super-admin-sidebar-manage-manager-menu-btn') as HTMLButtonElement | null;
export const superAdminSidebarAppSettingsBtn = document.getElementById('super-admin-sidebar-app-settings-btn') as HTMLButtonElement | null;
export const superAdminSidebarChangePasswordBtn = document.getElementById('super-admin-sidebar-change-password-btn') as HTMLButtonElement | null;
export const superAdminSidebarLogoutBtn = document.getElementById('super-admin-sidebar-logout-btn') as HTMLButtonElement | null;
export const superAdminContentArea = document.getElementById('super-admin-content-area') as HTMLDivElement | null;
export const superAdminContentWelcome = document.getElementById('super-admin-content-welcome') as HTMLDivElement | null;
export const superAdminContentBusinessList = document.getElementById('super-admin-content-business-list') as HTMLDivElement | null;
export const saBusinessListContainer = document.getElementById('sa-business-list-container') as HTMLDivElement | null;
export const superAdminContentManagingBusiness = document.getElementById('super-admin-content-managing-business') as HTMLDivElement | null;
export const currentlyManagingBusinessDisplayContentArea = document.getElementById('currently-managing-business-display-content-area') as HTMLDivElement | null;
export const saBusinessUpgradeRequestInfo = document.getElementById('sa-business-upgrade-request-info') as HTMLDivElement | null;

// --- Super Admin - Add Business Modal ---
export const addBusinessModal = document.getElementById('add-business-modal') as HTMLDivElement | null;
export const addBusinessForm = document.getElementById('add-business-form') as HTMLFormElement | null;
export const addBusinessNameInput = document.getElementById('add-business-name-input') as HTMLInputElement | null;
export const addBusinessLogoInput = document.getElementById('add-business-logo-input') as HTMLInputElement | null;
export const addBusinessLogoPreview = document.getElementById('add-business-logo-preview') as HTMLImageElement | null;
export const subscriptionPackageSelectionContainer = document.getElementById('subscription-package-selection') as HTMLDivElement | null;
export const selectedSubscriptionPackageIdInput = document.getElementById('selected-subscription-package-id') as HTMLInputElement | null;
export const addBusinessFormError = document.getElementById('add-business-form-error') as HTMLParagraphElement | null;
export const saveNewBusinessBtn = document.getElementById('save-new-business-btn') as HTMLButtonElement | null;
export const cancelAddBusinessBtn = document.getElementById('cancel-add-business-btn') as HTMLButtonElement | null;
export const addBusinessModalCloseBtn = document.getElementById('add-business-modal-close-btn') as HTMLButtonElement | null;

// --- Super Admin - Business Details Form (within Managing Business view) ---
export const businessDetailsForm = document.getElementById('business-details-form') as HTMLFormElement | null;
export const businessNameInput = document.getElementById('business-name-input') as HTMLInputElement | null;
export const businessAddressInput = document.getElementById('business-address-input') as HTMLInputElement | null;
export const businessNiptInput = document.getElementById('business-nipt-input') as HTMLInputElement | null;
export const businessLogoInputSA = document.getElementById('business-logo-input-sa') as HTMLInputElement | null;
export const businessLogoPreviewSA = document.getElementById('business-logo-preview-sa') as HTMLImageElement | null;
export const saveBusinessDetailsBtn = document.getElementById('save-business-details-btn') as HTMLButtonElement | null;
export const deleteBusinessLogoBtnSA = document.getElementById('delete-business-logo-btn-sa') as HTMLButtonElement | null;
export const deleteCurrentBusinessBtn = document.getElementById('delete-current-business-btn') as HTMLButtonElement | null;
export const futureSubscriptionManagementSection = document.getElementById('future-subscription-management-section') as HTMLDivElement | null;
export const existingFutureSubscriptionInfo = document.getElementById('existing-future-subscription-info') as HTMLDivElement | null;
export const displayFutureSubCode = document.getElementById('display-future-sub-code') as HTMLSpanElement | null;
export const displayFutureSubPackage = document.getElementById('display-future-sub-package') as HTMLSpanElement | null;
export const displayFutureSubGeneratedDate = document.getElementById('display-future-sub-generated-date') as HTMLSpanElement | null;
export const futureSubscriptionPackageSelect = document.getElementById('future-subscription-package-select') as HTMLSelectElement | null;
export const generateFutureSubscriptionCodeBtn = document.getElementById('generate-future-subscription-code-btn') as HTMLButtonElement | null;
export const newlyGeneratedFutureCodeDisplay = document.getElementById('newly-generated-future-code-display') as HTMLDivElement | null;
export const newlyGeneratedFutureCodeValue = document.getElementById('newly-generated-future-code-value') as HTMLSpanElement | null;
export const openNewFiscalYearBtn = document.getElementById('openNewFiscalYearBtn') as HTMLButtonElement | null;
export const restoreBusinessBackupBtn = document.getElementById('restore-business-backup-btn') as HTMLButtonElement | null;
export const backupFileInput = document.getElementById('backup-file-input') as HTMLInputElement | null;

// --- Super Admin - User Lists (within Managing Business view) ---
export const superAdminShowAddManagerModalBtn = document.getElementById('super-admin-show-add-manager-modal-btn') as HTMLButtonElement | null;
export const superAdminManagerListTbody = document.getElementById('super-admin-manager-list-tbody') as HTMLTableSectionElement | null;
export const superAdminShowAddSellerModalBtn = document.getElementById('super-admin-show-add-seller-modal-btn') as HTMLButtonElement | null;
export const superAdminSellerListTbody = document.getElementById('super-admin-seller-list-tbody') as HTMLTableSectionElement | null;

// --- Super Admin - Password Change View ---
export const superAdminContentPasswordChange = document.getElementById('super-admin-content-password-change') as HTMLDivElement | null;
export const superAdminPasswordForm = document.getElementById('super-admin-password-form') as HTMLFormElement | null;
export const currentSuperAdminPasswordInput = document.getElementById('current-super-admin-password') as HTMLInputElement | null;
export const newSuperAdminPasswordInput = document.getElementById('new-super-admin-password') as HTMLInputElement | null;
export const confirmNewSuperAdminPasswordInput = document.getElementById('confirm-new-super-admin-password') as HTMLInputElement | null;
export const superAdminPasswordErrorElement = document.getElementById('super-admin-password-error') as HTMLParagraphElement | null;
export const changeSuperAdminPasswordBtn = document.getElementById('change-super-admin-password-btn') as HTMLButtonElement | null;

// --- Super Admin - App Settings View ---
export const superAdminContentAppSettings = document.getElementById('super-admin-content-app-settings') as HTMLDivElement | null;
export const superAdminAppSettingsForm = document.getElementById('super-admin-app-settings-form') as HTMLFormElement | null;
export const saAppNameInput = document.getElementById('sa-app-name-input') as HTMLInputElement | null;
export const saAppLogoInput = document.getElementById('sa-app-logo-input') as HTMLInputElement | null;
export const saAppLogoPreview = document.getElementById('sa-app-logo-preview') as HTMLImageElement | null;
export const saAppAddressInput = document.getElementById('sa-app-address-input') as HTMLInputElement | null;
export const saAppNiptInput = document.getElementById('sa-app-nipt-input') as HTMLInputElement | null;
export const saAppBankNameInput = document.getElementById('sa-app-bank-name-input') as HTMLInputElement | null;
export const saAppBankAccountInput = document.getElementById('sa-app-bank-account-input') as HTMLInputElement | null;
export const saAppIbanInput = document.getElementById('sa-app-iban-input') as HTMLInputElement | null;
export const saAppSwiftInput = document.getElementById('sa-app-swift-input') as HTMLInputElement | null;
export const saLoginShowcaseTitlePrefixInput = document.getElementById('sa-login-showcase-title-prefix') as HTMLInputElement | null;
export const saLoginShowcaseSubtitleInput = document.getElementById('sa-login-showcase-subtitle') as HTMLInputElement | null;
export const saAppSettingsError = document.getElementById('sa-app-settings-error') as HTMLParagraphElement | null;
export const saSaveAppSettingsBtn = document.getElementById('sa-save-app-settings-btn') as HTMLButtonElement | null;
export const saDeleteAppLogoBtn = document.getElementById('sa-delete-app-logo-btn') as HTMLButtonElement | null;

// --- Super Admin - Subscription Package Management ---
export const superAdminContentSubscriptionPackages = document.getElementById('super-admin-content-subscription-packages') as HTMLDivElement | null;
export const saShowAddPackageModalBtn = document.getElementById('sa-show-add-package-modal-btn') as HTMLButtonElement | null;
export const saSubscriptionPackageListTbody = document.getElementById('sa-subscription-package-list-tbody') as HTMLTableSectionElement | null;
export const subscriptionPackageFormModal = document.getElementById('subscription-package-form-modal') as HTMLDivElement | null;
export const subscriptionPackageForm = document.getElementById('subscription-package-form') as HTMLFormElement | null;
export const subscriptionPackageFormModalTitle = document.getElementById('subscription-package-form-modal-title') as HTMLHeadingElement | null;
export const editPackageIdInput = document.getElementById('edit-package-id') as HTMLInputElement | null;
export const packageFormIdInput = document.getElementById('package-form-id') as HTMLInputElement | null;
export const packageFormNameInput = document.getElementById('package-form-name') as HTMLInputElement | null;
export const packageFormPriceInput = document.getElementById('package-form-price') as HTMLInputElement | null;
export const packageFormDurationInput = document.getElementById('package-form-duration') as HTMLInputElement | null;
export const packageFormFeaturesTextarea = document.getElementById('package-form-features') as HTMLTextAreaElement | null;
export const packageFormErrorElement = document.getElementById('package-form-error') as HTMLParagraphElement | null;
export const cancelPackageFormBtn = document.getElementById('cancel-package-form-btn') as HTMLButtonElement | null;
export const subscriptionPackageFormModalCloseBtn = document.getElementById('subscription-package-form-modal-close-btn') as HTMLButtonElement | null;
export const savePackageBtn = document.getElementById('save-package-btn') as HTMLButtonElement | null;
export const packagePermissionsContainer = document.getElementById('package-permissions-container') as HTMLDivElement | null;

// --- Super Admin - Manager Menu Editor ---
export const superAdminContentManagerMenu = document.getElementById('super-admin-content-manager-menu') as HTMLDivElement | null;
export const managerMenuEditorContainer = document.getElementById('manager-menu-editor-container') as HTMLDivElement | null;
export const saSaveManagerMenuBtn = document.getElementById('sa-save-manager-menu-btn') as HTMLButtonElement | null;
export const saResetManagerMenuBtn = document.getElementById('sa-reset-manager-menu-btn') as HTMLButtonElement | null;

export const applySelectedPackageNowBtn = document.getElementById('apply-selected-package-now-btn') as HTMLButtonElement | null; // Also in managerModals.ts (seems specific to SA though)
