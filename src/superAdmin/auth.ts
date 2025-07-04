
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as utils from '../core/utils';
import { showAuthView as showMainAuthView } from '../core/auth';
import { showCustomConfirm } from '../core/ui';
import { hideAllSuperAdminContentSections, highlightActiveSidebarAction } from './ui';
import { updateAppTitle } from '../core/ui';
import { toggleSuperAdminAppSettingsControls } from './appSettings';
import { toggleBusinessSpecificSAControls } from './businessManagement';

export function showSuperAdminPasswordChangeView() {
    hideAllSuperAdminContentSections();
    if (dom.superAdminContentPasswordChange) dom.superAdminContentPasswordChange.style.display = 'block';
    
    state.setCurrentManagingBusinessId(null);
    storage.saveCurrentManagingBusinessIdToSessionStorage(null);

    updateAppTitle(); 
    highlightActiveSidebarAction('changePassword');
    if (dom.superAdminPasswordForm) dom.superAdminPasswordForm.reset();
    if (dom.superAdminPasswordErrorElement) dom.superAdminPasswordErrorElement.textContent = '';
    toggleBusinessSpecificSAControls(false);
    toggleSuperAdminAppSettingsControls(false); 
}

export async function handleChangeSuperAdminPassword(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.currentSuperAdminPasswordInput || !dom.newSuperAdminPasswordInput || !dom.confirmNewSuperAdminPasswordInput || !dom.superAdminPasswordErrorElement) return;

    const currentPassword = dom.currentSuperAdminPasswordInput.value;
    const newPassword = dom.newSuperAdminPasswordInput.value;
    const confirmNewPassword = dom.confirmNewSuperAdminPasswordInput.value;

    if (!utils.comparePassword(currentPassword, state.superAdminPasswordHash || utils.simpleHash('admin'))) {
        dom.superAdminPasswordErrorElement.textContent = "Fjalëkalimi aktual është i pasaktë.";
        return;
    }
    if (newPassword.length < 6) {
        dom.superAdminPasswordErrorElement.textContent = "Fjalëkalimi i ri duhet të jetë të paktën 6 karaktere.";
        return;
    }
    if (newPassword !== confirmNewPassword) {
        dom.superAdminPasswordErrorElement.textContent = "Fjalëkalimet e reja nuk përputhen.";
        return;
    }

    const newHash = utils.simpleHash(newPassword);
    await storage.saveSuperAdminPasswordHash(newHash);
    state.setSuperAdminPasswordHash(newHash); 
    alert("Fjalëkalimi i Super Adminit u ndryshua me sukses.");
    if (dom.superAdminPasswordForm) dom.superAdminPasswordForm.reset();
    dom.superAdminPasswordErrorElement.textContent = "";
}

export function handleSuperAdminLogout(): void {
    showCustomConfirm("Jeni i sigurt që doni të dilni nga paneli i Super Adminit?", () => {
        state.setCurrentUser(null);
        state.setCurrentManagingBusinessId(null);
        storage.saveCurrentUserIdToSessionStorage(null);
        storage.saveCurrentManagingBusinessIdToSessionStorage(null);

        storage.clearAllBusinessData();
        
        showMainAuthView(); 
    });
}
