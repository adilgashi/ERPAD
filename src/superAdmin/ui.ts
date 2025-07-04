/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { updateAppTitle } from '../core/ui';
import { handleManageBusiness, renderSuperAdminContentBusinessList, renderManagingBusinessViewContent } from './businessManagement'; // Renamed import alias
import { toggleSuperAdminAppSettingsControls } from './appSettings'; // Import for internal use if needed
import { toggleBusinessSpecificSAControls } from './businessManagement'; // Import for internal use if needed

export function showSuperAdminPanel(): void {
    if (!dom.authView || !dom.appRoot || !dom.sellerPosView || !dom.managerDashboardView || !dom.superAdminPanelView || !dom.logoutBtn || !dom.sellerCashStatusContainer) return;

    dom.authView.style.display = 'none';
    dom.appRoot.style.display = 'flex';
    dom.sellerPosView.style.display = 'none';
    dom.managerDashboardView.style.display = 'none';
    dom.superAdminPanelView.style.display = 'flex';
    dom.logoutBtn.style.display = 'none'; // SA logout is in its own sidebar
    dom.sellerCashStatusContainer.style.display = 'none';


    if (state.currentUser && dom.userGreetingElement) {
        dom.userGreetingElement.textContent = `Mirë se erdhe, ${state.currentUser.username} (Super Admin)`;
    }
    
    const persistedManagingBusinessId = storage.getCurrentManagingBusinessIdFromSessionStorage();
    if (persistedManagingBusinessId && state.businesses.some(b => b.id === persistedManagingBusinessId)) {
        handleManageBusiness(persistedManagingBusinessId); 
    } else {
        showSuperAdminWelcomeView();
    }
    updateAppTitle(); 
}

export function highlightActiveSidebarAction(actionName: 'addBusiness' | 'viewBusinesses' | 'managePackages' | 'manageManagerMenu' | 'changePassword' | 'appSettings' | null) {
    const buttons = [
        dom.superAdminSidebarAddBusinessBtn,
        dom.superAdminSidebarViewBusinessesBtn,
        dom.superAdminSidebarManagePackagesBtn, 
        dom.superAdminSidebarManageManagerMenuBtn,
        dom.superAdminSidebarChangePasswordBtn,
        dom.superAdminSidebarAppSettingsBtn
    ];
    buttons.forEach(btn => btn?.classList.remove('active'));

    switch (actionName) {
        case 'addBusiness': 
            dom.superAdminSidebarAddBusinessBtn?.classList.add('active');
            break;
        case 'viewBusinesses':
            dom.superAdminSidebarViewBusinessesBtn?.classList.add('active');
            break;
        case 'managePackages': 
            dom.superAdminSidebarManagePackagesBtn?.classList.add('active');
            break;
        case 'manageManagerMenu':
            dom.superAdminSidebarManageManagerMenuBtn?.classList.add('active');
            break;
        case 'changePassword':
            dom.superAdminSidebarChangePasswordBtn?.classList.add('active');
            break;
        case 'appSettings':
            dom.superAdminSidebarAppSettingsBtn?.classList.add('active');
            break;
    }
}

export function hideAllSuperAdminContentSections() {
    if (dom.superAdminContentWelcome) dom.superAdminContentWelcome.style.display = 'none';
    if (dom.superAdminContentBusinessList) dom.superAdminContentBusinessList.style.display = 'none';
    if (dom.superAdminContentManagingBusiness) dom.superAdminContentManagingBusiness.style.display = 'none';
    if (dom.superAdminContentPasswordChange) dom.superAdminContentPasswordChange.style.display = 'none';
    if (dom.superAdminContentAppSettings) dom.superAdminContentAppSettings.style.display = 'none';
    if (dom.superAdminContentSubscriptionPackages) dom.superAdminContentSubscriptionPackages.style.display = 'none'; 
    if (dom.superAdminContentManagerMenu) dom.superAdminContentManagerMenu.style.display = 'none';
}

export function showSuperAdminWelcomeView() {
    hideAllSuperAdminContentSections();
    if (dom.superAdminContentWelcome) dom.superAdminContentWelcome.style.display = 'block';
    
    state.setCurrentManagingBusinessId(null);
    storage.saveCurrentManagingBusinessIdToSessionStorage(null);
    // Clear business-specific data from state
    state.setUsers([]); 
    state.setProducts([]); 
    state.setDailyCashLog([]); 
    state.setSalesLog([]); 
    state.setBusinessDetails(null);
    state.setDeals([]);
    state.setCategories([]);
    state.setCustomers([]);
    
    updateAppTitle();
    highlightActiveSidebarAction(null);
    toggleBusinessSpecificSAControls(false); // Use imported function
    toggleSuperAdminAppSettingsControls(false);  // Use imported function
}

export function showSuperAdminBusinessListView() {
    hideAllSuperAdminContentSections();
    if (dom.superAdminContentBusinessList) dom.superAdminContentBusinessList.style.display = 'block';
    
    state.setCurrentManagingBusinessId(null);
    storage.saveCurrentManagingBusinessIdToSessionStorage(null);

    renderSuperAdminContentBusinessList();
    updateAppTitle();
    highlightActiveSidebarAction('viewBusinesses');
    toggleBusinessSpecificSAControls(false); // Use imported function
    toggleSuperAdminAppSettingsControls(false); // Use imported function
}

export function showSuperAdminBusinessManagementView(businessId: string) {
    const businessToManage = state.businesses.find(b => b.id === businessId);
    if (!businessToManage) {
        showSuperAdminWelcomeView(); 
        return;
    }
    state.setCurrentManagingBusinessId(businessId);
    storage.saveCurrentManagingBusinessIdToSessionStorage(businessId);
    
    hideAllSuperAdminContentSections();
    if (dom.superAdminContentManagingBusiness) dom.superAdminContentManagingBusiness.style.display = 'block';
    
    renderManagingBusinessViewContent(businessId); 

    updateAppTitle();
    highlightActiveSidebarAction(null); 
    toggleBusinessSpecificSAControls(true); // Use imported function
    toggleSuperAdminAppSettingsControls(false); // Use imported function
}
