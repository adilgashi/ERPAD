/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as ui from './ui';
import * as auth from './auth';
import * as businessManagement from './businessManagement';
import * as packageManagement from './packageManagement';
import * as menuEditor from './menuEditor';
import * as appSettings from './appSettings';
import * as managerUserManagement from '../manager/userManagement'; // For SA user creation modals
import * as utils from '../core/utils';

export function initSuperAdminEventListeners(): void {
    // Sidebar Actions
    dom.superAdminSidebarAddBusinessBtn?.addEventListener('click', businessManagement.openAddBusinessModal);
    dom.superAdminSidebarViewBusinessesBtn?.addEventListener('click', ui.showSuperAdminBusinessListView);
    dom.superAdminSidebarManagePackagesBtn?.addEventListener('click', packageManagement.showSuperAdminSubscriptionPackageManagementView); 
    dom.superAdminSidebarManageManagerMenuBtn?.addEventListener('click', menuEditor.showSuperAdminManagerMenuEditorView);
    dom.superAdminSidebarAppSettingsBtn?.addEventListener('click', appSettings.showSuperAdminAppSettingsView);
    dom.superAdminSidebarChangePasswordBtn?.addEventListener('click', auth.showSuperAdminPasswordChangeView);
    dom.superAdminSidebarLogoutBtn?.addEventListener('click', auth.handleSuperAdminLogout);

    // Add Business Modal
    dom.addBusinessForm?.addEventListener('submit', businessManagement.handleSaveNewBusiness);
    dom.addBusinessLogoInput?.addEventListener('change', () => {
        if (dom.addBusinessLogoInput && dom.addBusinessLogoPreview) {
            utils.displaySelectedImage(dom.addBusinessLogoInput, dom.addBusinessLogoPreview);
        }
    });
    dom.cancelAddBusinessBtn?.addEventListener('click', businessManagement.closeAddBusinessModal);
    dom.addBusinessModalCloseBtn?.addEventListener('click', businessManagement.closeAddBusinessModal);

    // Manage Business View
    dom.businessDetailsForm?.addEventListener('submit', businessManagement.handleSaveBusinessDetails);
    dom.businessLogoInputSA?.addEventListener('change', () => {
        if (dom.businessLogoInputSA && dom.businessLogoPreviewSA) {
            utils.displaySelectedImage(dom.businessLogoInputSA, dom.businessLogoPreviewSA);
        }
    });
    dom.deleteBusinessLogoBtnSA?.addEventListener('click', businessManagement.handleDeleteBusinessLogoSA);
    // Delete business button listener is attached dynamically in renderSuperAdminContentBusinessList

    dom.generateFutureSubscriptionCodeBtn?.addEventListener('click', businessManagement.handleGenerateFutureSubscriptionCode);
    const applyNowBtn = document.getElementById('apply-selected-package-now-btn') as HTMLButtonElement | null;
    applyNowBtn?.addEventListener('click', packageManagement.handleApplySelectedPackageImmediately);


    dom.openNewFiscalYearBtn?.addEventListener('click', businessManagement.handleOpenNewFiscalYear);
    dom.restoreBusinessBackupBtn?.addEventListener('click', businessManagement.handleRestoreBusinessBackupPrompt);
    dom.backupFileInput?.addEventListener('change', businessManagement.handleBackupFileSelected);

    // Manage Users within Business (for SuperAdmin)
    dom.superAdminShowAddManagerModalBtn?.addEventListener('click', () => managerUserManagement.openUserFormModal(undefined, 'superAdmin', 'menaxher'));
    dom.superAdminShowAddSellerModalBtn?.addEventListener('click', () => managerUserManagement.openUserFormModal(undefined, 'superAdmin', 'shites'));

    // Password Change
    dom.superAdminPasswordForm?.addEventListener('submit', auth.handleChangeSuperAdminPassword);

    // App Settings
    dom.superAdminAppSettingsForm?.addEventListener('submit', appSettings.handleSaveSuperAdminAppSettings);
    dom.saAppLogoInput?.addEventListener('change', () => {
        if (dom.saAppLogoInput && dom.saAppLogoPreview) {
            utils.displaySelectedImage(dom.saAppLogoInput, dom.saAppLogoPreview);
        }
    });
    dom.saDeleteAppLogoBtn?.addEventListener('click', appSettings.handleDeleteSuperAdminAppLogo);

    // Subscription Package Management
    dom.saShowAddPackageModalBtn?.addEventListener('click', () => packageManagement.openSubscriptionPackageFormModal());
    dom.subscriptionPackageForm?.addEventListener('submit', packageManagement.handleSaveSubscriptionPackage);
    dom.cancelPackageFormBtn?.addEventListener('click', packageManagement.closeSubscriptionPackageFormModal);
    dom.subscriptionPackageFormModalCloseBtn?.addEventListener('click', packageManagement.closeSubscriptionPackageFormModal);

    // Manager Menu Editor
    dom.saSaveManagerMenuBtn?.addEventListener('click', menuEditor.handleSaveManagerMenuConfig);
    dom.saResetManagerMenuBtn?.addEventListener('click', menuEditor.handleResetManagerMenuConfig);
}
