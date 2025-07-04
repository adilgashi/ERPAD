/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from './core/dom';
import * as state from './core/state';
import * as storage from './core/storage';
import * as ui from './core/ui'; 
import * as auth from './core/auth';
import * as seller from './seller';
import { initManagerView, showManagerDashboardView, isViewInitialized, refreshActiveViewData, setActiveManagerView } from './manager/index';
import * as superAdmin from './superAdmin';
import { generateUniqueId, simpleHash } from './core/utils';
import * as config from './core/config';
import { Business, BusinessDetails, User, Product, Customer, Category, Supplier, SubscriptionPackage, MenuCategoryConfig, ItemType } from './models'; 

// Expose functions globally for debugging or specific calls
if (typeof window !== 'undefined') {
    (window as any).renderProductsForSaleSeller = seller.renderProductsForSale;
    (window as any).renderSaleItemsSeller = seller.renderSaleItems;
    (window as any).updateTotalsSeller = seller.updateTotals;
    (window as any).populateSellerCustomerSelect = seller.populateSellerCustomerSelect;

    (window as any).renderDashboardSummaryManager = () => { 
        if (state.currentUser?.role === 'menaxher' && isViewInitialized('dashboard')) {
            refreshActiveViewData('dashboard');
        }
    };
    (window as any).refreshManagerTodaysSalesView = () => {
        if (state.currentUser?.role === 'menaxher' && isViewInitialized('todays_sales')) {
           refreshActiveViewData('todays_sales');
        }
    };
    (window as any).renderManagerStockOverview = () => { 
        if (state.currentUser?.role === 'menaxher' && isViewInitialized('stock_overview')) {
           refreshActiveViewData('stock_overview');
        }
    };
     (window as any).renderManagerSupplierBalances = () => { 
        if (state.currentUser?.role === 'menaxher' && isViewInitialized('supplier_balances')) {
           refreshActiveViewData('supplier_balances');
        }
    };
     (window as any).renderManagerCustomerBalances = () => { 
        if (state.currentUser?.role === 'menaxher' && isViewInitialized('customer_balances')) {
           refreshActiveViewData('customer_balances');
        }
    };
     (window as any).refreshCustomerLedger = () => {
        if (state.currentUser?.role === 'menaxher' && isViewInitialized('customer_ledger')) {
           refreshActiveViewData('customer_ledger');
        }
    };
    (window as any).refreshSupplierLedger = () => {
        if (state.currentUser?.role === 'menaxher' && isViewInitialized('supplier_ledger')) {
           refreshActiveViewData('supplier_ledger');
        }
    };
    (window as any).refreshManagerLocalSalesList = () => {
        if (state.currentUser?.role === 'menaxher' && isViewInitialized('local_sales_management')) {
           refreshActiveViewData('local_sales_management');
        }
    };
     (window as any).refreshManagerSalesReturnsList = () => {
        if (state.currentUser?.role === 'menaxher' && isViewInitialized('sales_returns_list')) {
           refreshActiveViewData('sales_returns_list');
        }
    };
    (window as any).renderSuperAdminUserLists = () => {
        if (state.currentUser?.isSuperAdmin && dom.superAdminContentManagingBusiness?.style.display === 'block') {
            superAdmin.renderSuperAdminManagerList();
            superAdmin.renderSuperAdminSellerList();
        }
    };
     (window as any).renderSubscriptionPackagesSA = () => { 
        if (state.currentUser?.isSuperAdmin && dom.superAdminContentSubscriptionPackages?.style.display === 'block') {
            superAdmin.renderSubscriptionPackageList();
        }
    };
     (window as any).renderManagerMenuEditorSA = () => { 
        if (state.currentUser?.isSuperAdmin && dom.superAdminContentManagerMenu?.style.display === 'block') {
            superAdmin.renderManagerMenuEditor();
        }
    };
     (window as any).renderManagerItemTypeList = () => { 
        if (state.currentUser?.role === 'menaxher' && isViewInitialized('item_type_management')) {
            refreshActiveViewData('item_type_management');
        }
    };
    (window as any).setupManagerSidebarFromApp = () => {
         if (typeof initManagerView === 'function') {
            const dynamicManagerMenuContainer = document.getElementById('dynamic-manager-menu-container');
            if (dynamicManagerMenuContainer) {
                dynamicManagerMenuContainer.innerHTML = '';
                const menuStructure = storage.buildManagerMenuFromConfig(state.managerMenuConfig);
                dynamicManagerMenuContainer.appendChild(menuStructure);
                if (typeof (window as any)._setupManagerSidebarAccordion === 'function') (window as any)._setupManagerSidebarAccordion();
                if (typeof (window as any)._setupManagerSidebarSearch === 'function') (window as any)._setupManagerSidebarSearch();
                dynamicManagerMenuContainer.querySelectorAll<HTMLLIElement>('li[data-view]').forEach(item => {
                    item.addEventListener('click', (event) => {
                        event.preventDefault();
                        if (item.classList.contains('menu-item-locked') || item.getAttribute('aria-disabled') === 'true') return;
                        const viewName = item.dataset.view;
                        const title = item.querySelector('a')?.textContent?.trim() || 'Skedë e Re';
                        if (viewName) {
                            setActiveManagerView(viewName, title);
                        }
                    });
                });
            }
        }
    };
}

export async function initApp(): Promise<void> {
    console.warn("KUJDES: Fjalëkalimet po ruhen në mënyrë të pasigurt (Base64). Kjo është vetëm për qëllime demonstruese. Për një aplikacion real, përdorni hashing të fortë dhe të njëanshëm si bcrypt ose Argon2.");

    document.addEventListener('contextmenu', event => event.preventDefault());

    // Load all initial data from the source (now db.json via api.ts)
    await storage.loadSuperAdminData();

    // The logic to seed default data is now implicitly handled by loading db.json.
    // If db.json is missing or corrupt, the app state will be empty, and fallbacks
    // within specific modules might take over. We removed the explicit seeding blocks
    // to make db.json the single source of truth for initial setup.
    
    // Initialize UI and event listeners
    auth.initAuthEventListeners(); 
    seller.initSellerEventListeners();
    initManagerView();
    superAdmin.initSuperAdminEventListeners();
    ui.initUIEventListeners();

    dom.logoutBtn?.addEventListener('click', auth.handleLogout);

    const currentUserId = storage.getCurrentUserIdFromSessionStorage();
    const currentBusinessId = storage.getCurrentManagingBusinessIdFromSessionStorage();

    if (currentUserId) {
        let user: User | undefined;
        if (currentUserId === 'SUPER_ADMIN_USER') {
            user = { id: 'SUPER_ADMIN_USER', username: 'admin', passwordHash: state.superAdminPasswordHash || simpleHash('admin'), role: 'menaxher', isSuperAdmin: true };
        } else if (currentBusinessId) {
            // Data for the business should already be loaded into the state if a session exists.
            // We just need to find the user in the already loaded state.
            const users = state.users; 
            user = users.find(u => u.id === currentUserId);
        }

        if (user) {
            state.setCurrentUser(user);
            if (!user.isSuperAdmin && currentBusinessId) {
                state.setCurrentManagingBusinessId(currentBusinessId);
                // The data is already loaded, we just set the context
                await storage.loadAllBusinessData(currentBusinessId);
            }
            ui.showAppView();
        } else {
            // If user not found even with session data, something is inconsistent. Show auth view.
            await auth.showAuthView();
        }
    } else {
        await auth.showAuthView();
    }
}