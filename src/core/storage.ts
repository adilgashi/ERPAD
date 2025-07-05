/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file acts as a bridge between the application logic and the API client.
// Its purpose is to load data from the API into the application's state.

import * as state from './state';
import * as api from './api';
import { MenuCategoryConfig, TimeLog, LeaveRequest, Overtime, JournalEntry, StockAdjustment } from '../models';

export * from './api';

export async function loadSuperAdminData(): Promise<void> {
    const [hash, settings, packages, businesses, menuConfig] = await Promise.all([
        api.getSuperAdminPasswordHash(),
        api.getSuperAdminAppSettings(),
        api.getSubscriptionPackages(),
        api.getAllBusinesses(),
        api.getManagerMenuConfig()
    ]);
    state.setSuperAdminPasswordHash(hash);
    state.setSuperAdminAppSettings(settings);
    state.setSubscriptionPackages(packages);
    state.setBusinesses(businesses);
    state.setManagerMenuConfig(menuConfig.length > 0 ? menuConfig : getDefaultManagerMenuConfig());
}

export async function loadGeneralConfig(): Promise<void> {
    const [packages, menuConfig] = await Promise.all([
        api.getSubscriptionPackages(),
        api.getManagerMenuConfig()
    ]);
    state.setSubscriptionPackages(packages);
    state.setManagerMenuConfig(menuConfig.length > 0 ? menuConfig : getDefaultManagerMenuConfig());
}


export async function loadAllBusinessData(businessId: string): Promise<void> {
    if (!businessId) {
        console.error("loadAllBusinessData called without a businessId.");
        clearAllBusinessData();
        return;
    }

    try {
        const [
            users, groups, privileges, groupPrivileges, products, categories, itemTypes, deals, customers, suppliers,
            dailyCashLog, salesLog, clearedSalesLog, pettyCashLog, businessDetails,
            purchaseInvoices, returnPurchaseInvoices, outgoingPayments,
            incomingPayments, localSalesInvoices, salesReturnInvoices,
            creditNotes, debitNotes, recipes, productionOrders,
            productionStages, productionRoutings, stockAdjustments, employees,
            timeLogs, leaveRequests, overtimeEntries, payrollEntries, accounts, journalEntries, accountingSettings
        ] = await Promise.all([
            api.getUsers(businessId),
            api.getGroups(businessId),
            api.getPrivileges(), // Privileges are global, not per-business
            api.getGroupPrivileges(businessId),
            api.getProducts(businessId),
            api.getCategories(businessId),
            api.getItemTypes(businessId),
            api.getDeals(businessId),
            api.getCustomers(businessId),
            api.getSuppliers(businessId),
            api.getDailyCashLog(businessId),
            api.getSalesLog(businessId),
            api.getClearedSalesLog(businessId),
            api.getPettyCashLog(businessId),
            api.getBusinessDetails(businessId),
            api.getPurchaseInvoices(businessId),
            api.getReturnPurchaseInvoices(businessId),
            api.getOutgoingPayments(businessId),
            api.getIncomingPayments(businessId),
            api.getLocalSalesInvoices(businessId),
            api.getSalesReturnInvoices(businessId),
            api.getCreditNotes(businessId),
            api.getDebitNotes(businessId),
            api.getRecipes(businessId),
            api.getProductionOrders(businessId),
            api.getProductionStages(businessId),
            api.getProductionRoutings(businessId),
            api.getStockAdjustments(businessId),
            api.getEmployees(businessId),
            api.getTimeLogs(businessId),
            api.getLeaveRequests(businessId),
            api.getOvertimeEntries(businessId),
            api.getPayrollEntries(businessId), // Thirrja e funksionit për marrjen e payrollEntries
            api.getAccounts(businessId),
            api.getJournalEntries(businessId),
            api.getAccountingSettings(businessId),
        ]);

        state.setUsers(users);
        state.setGroups(groups);
        state.setPrivileges(privileges);
        state.setGroupPrivileges(groupPrivileges);
        state.setEmployees(employees);
        state.setProducts(products);
        state.setCategories(categories);
        state.setItemTypes(itemTypes);
        state.setDeals(deals);
        state.setCustomers(customers);
        state.setSuppliers(suppliers);
        state.setAccounts(accounts);
        state.setJournalEntries(journalEntries);
        state.setAccountingSettings(accountingSettings);
        state.setDailyCashLog(dailyCashLog);
        state.setSalesLog(salesLog);
        state.setClearedSalesLog(clearedSalesLog);
        state.setPettyCashLog(pettyCashLog);
        state.setBusinessDetails(businessDetails);
        state.setPurchaseInvoices(purchaseInvoices);
        state.setReturnPurchaseInvoices(returnPurchaseInvoices);
        state.setOutgoingPayments(outgoingPayments);
        state.setIncomingPayments(incomingPayments);
        state.setLocalSalesInvoices(localSalesInvoices);
        state.setSalesReturnInvoices(salesReturnInvoices);
        state.setCreditNotes(creditNotes);
        state.setDebitNotes(debitNotes);
        state.setRecipes(recipes);
        state.setProductionOrders(productionOrders);
        state.setProductionStages(productionStages);
        state.setProductionRoutings(productionRoutings);
        state.setStockAdjustments(stockAdjustments);
        state.setTimeLogs(timeLogs);
        state.setLeaveRequests(leaveRequests);
        state.setOvertimeEntries(overtimeEntries);
    state.setPayrollEntries(payrollEntries);
    state.setAccounts(accounts);
    state.setJournalEntries(journalEntries);
    state.setAccountingSettings(accountingSettings);

    } catch (error) {
        console.error(`Failed to load all business data for ${businessId}:`, error);
        clearAllBusinessData();
    }
}

export function clearAllBusinessData(): void {
    state.setUsers([]);
    state.setGroups([]);
    // Privileges might be kept as they are global, or cleared. Let's clear for a full reset.
    state.setPrivileges([]);
    state.setGroupPrivileges([]);
    state.setEmployees([]);
    state.setProducts([]);
    state.setCategories([]);
    state.setItemTypes([]);
    state.setDeals([]);
    state.setCustomers([]);
    state.setSuppliers([]);
    state.setAccounts([]);
    state.setJournalEntries([]);
    state.setDailyCashLog([]);
    state.setSalesLog([]);
    state.setClearedSalesLog([]);
    state.setPettyCashLog([]);
    state.setBusinessDetails(null);
    state.setPurchaseInvoices([]);
    state.setReturnPurchaseInvoices([]);
    state.setOutgoingPayments([]);
    state.setIncomingPayments([]);
    state.setLocalSalesInvoices([]);
    state.setSalesReturnInvoices([]);
    state.setCreditNotes([]);
    state.setDebitNotes([]);
    state.setRecipes([]);
    state.setProductionOrders([]);
    state.setProductionStages([]);
    state.setProductionRoutings([]);
    state.setStockAdjustments([]);
    state.setTimeLogs([]);
    state.setLeaveRequests([]);
    state.setOvertimeEntries([]);
    state.setPayrollEntries([]);
    state.setAccounts([]);
    state.setJournalEntries([]);
    state.setAccountingSettings(null);
    state.setPayrollEntries([]);
    state.setAccountingSettings(null);
}

export function getDefaultManagerMenuConfig(): MenuCategoryConfig[] {
    // This function can be expanded with more default configuration logic
    return [
         { id: "cat_dashboard", name: "Përmbledhje", icon: "📊", order: 1, defaultOpen: true, items: [
            { id: "item_dashboard", name: "Paneli Kryesor", icon: "🏠", dataView: "dashboard", order: 1},
        ]},
        { id: "cat_actions", name: "Veprimet Ditore", icon: "⚙️", order: 2, defaultOpen: false, items: [
            { id: "item_actions", name: "Veprimet e Arkës", icon: "🛠️", dataView: "actions", order: 1},
            { id: "item_todays_sales", name: "Shitjet e Sotme", icon: "🛒", dataView: "todays_sales", order: 2}
        ]},
        { id: "cat_financial_management", name: "Financa", icon: "💰", order: 3, defaultOpen: false, items: [
            { id: "item_outgoing_payments", name: "Pagesat Dalëse", icon: "💸", dataView: "outgoing_payments", order: 1 },
            { id: "item_incoming_payments", name: "Pagesat Hyrëse", icon: "🪙", dataView: "incoming_payments", order: 2 },
            { id: "item_initial_balances", name: "Saldot Fillestare", icon: "⚖️", dataView: "initial_balances", order: 3 },
            { id: "item_credit_notes", name: "Nota Krediti (Shitje)", icon: "📉", dataView: "credit_notes", order: 4 },
            { id: "item_debit_notes", name: "Nota Debiti (Blerje)", icon: "📈", dataView: "debit_notes", order: 5 },
        ]},
        { "id": "cat_accounting", "name": "Kontabiliteti", "icon": "🧾", "order": 4, "defaultOpen": false, "items": [
          { "id": "item_chart_of_accounts", "name": "Plani Kontabël", "icon": "📋", "dataView": "chart_of_accounts", "order": 1 },
          { "id": "item_general_ledger", "name": "Libri i Përgjithshëm", "icon": "📖", "dataView": "general_ledger", "order": 2 },
          { "id": "item_balance_sheet", "name": "Bilanci", "icon": "🏛️", "dataView": "balance_sheet", "order": 3 },
          { "id": "item_profit_loss", "name": "Pasqyra e A/SH (P&L)", "icon": "⚖️", "dataView": "profit_and_loss", "order": 4 },
          { "id": "item_trial_balance", "name": "Bilanci Provë", "icon": "📊", "dataView": "trialBalance", "order": 5 },
          { "id": "item_vat_report", "name": "Raporti i TVSH-së", "icon": "％", "dataView": "vatReport", "order": 6 },
          { "id": "item_account_ledger", "name": "Kartela e Llogarisë", "icon": "📒", "dataView": "accountLedger", "order": 7 },
          { "id": "item_accounting_settings", "name": "Cilësimet Kontabël", "icon": "🔧", "dataView": "accounting_settings", "order": 8 },
          { "id": "item_period_closing", "name": "Mbyllja e Periudhës Fiskale", "icon": "🔐", "dataView": "period_closing", "order": 9 }
        ]},
        { id: "cat_inventory_management", name: "Inventari & Produktet", icon: "📦", order: 5, defaultOpen: false, items: [
            { id: "item_product_management", name: "Menaxhimi i Produkteve", icon: "📝", dataView: "product_management", order: 1},
            { id: "item_category_management", name: "Menaxhimi i Kategorive", "icon": "🗂️", dataView: "category_management", order: 2},
            { id: "item_item_type_management", name: "Menaxhimi i Llojeve", "icon": "🏷️", dataView: "item_type_management", order: 3},
            { id: "item_deal_management", name: "Menaxhimi i Ofertave", "icon": "🎉", dataView: "deal_management", order: 4},
            { id: "item_stock_overview", name: "Gjendja e Stoqeve", "icon": "📊", dataView: "stock_overview", order: 5},
            { id: "item_item_ledger", name: "Kartela e Artikullit", "icon": "📒", dataView: "item_ledger", order: 6},
        ]},
        { id: "cat_purchases_management", name: "Blerjet", icon: "🛍️", order: 6, defaultOpen: false, items: [
            { id: "item_local_purchases", name: "Blerjet Vendore", icon: "🛒", dataView: "local_purchases", order: 1 },
            { id: "item_add_local_purchase", name: "Shto Blerje Vendore", icon: "➕", dataView: "add_local_purchase", order: 2 },
            { id: "item_return_purchases_list", name: "Kthimet e Blerjeve", icon: "↩️", dataView: "return_purchases_list", order: 3 },
            { id: "item_add_return_purchase", name: "Shto Kthim Blerjeje", "icon": "➕↩️", dataView: "add_return_purchase", order: 4 }
        ]},
         { id: "cat_sales_management", name: "Shitjet (Faturim)", icon: "🧾", order: 7, defaultOpen: false, items: [
          { "id": "item_local_sales_management", "name": "Faturat e Shitjes", "icon": "🧾", "dataView": "local_sales_management", "order": 1 },
          { "id": "item_add_local_sale", "name": "Shto Faturë Shitje", "icon": "➕🧾", "dataView": "add_local_sale", "order": 2 },
          { "id": "item_sales_returns_list", "name": "Kthimet e Shitjeve", "icon": "↩️🧾", "dataView": "sales_returns_list", "order": 3 },
          { "id": "item_add_sales_return", "name": "Shto Kthim Shitjeje", "icon": "➕↩️🧾", "dataView": "add_sales_return", "order": 4 }
        ]},
        { id: "cat_crm_management", name: "Klientët & Furnitorët", icon: "👥", order: 8, defaultOpen: false, items: [
          { id: "item_customer_management", name: "Menaxhimi i Blerësve", icon: "🧑‍💼", dataView: "customer_management", order: 1},
          { id: "item_customer_ledger", name: "Kartela e Blerësit", icon: "📒", dataView: "customer_ledger", order: 2},
          { id: "item_customer_balances", name: "Salldot e Blerësve", icon: "💰", dataView: "customer_balances", order: 3},
          { id: "item_supplier_management", name: "Menaxhimi i Furnitorëve", icon: "🚚", dataView: "supplier_management", order: 4},
          { id: "item_supplier_ledger", name: "Kartela e Furnitorit", icon: "📒", dataView: "supplier_ledger", order: 5},
          { id: "item_supplier_balances", name: "Salldot e Furnitorëve", "icon": "💰", dataView: "supplier_balances", order: 6}
        ]},
        { id: "cat_hr", name: "Burimet Njerëzore", icon: "🧑‍🤝‍🧑", order: 9, defaultOpen: false, items: [
            { "id": "item_hr_management", "name": "Menaxhimi i Punonjësve", "icon": "👥", "dataView": "hr_management", "order": 1 },
            { "id": "item_hr_payroll", "name": "Menaxhimi i Pagave", "icon": "💶", "dataView": "payroll_management", "order": 2 },
            { "id": "item_hr_schedule_management", "name": "Menaxhimi i Orarit të Punës", "icon": "🗓️", "dataView": "hr_schedule_management", "order": 3 },
            { "id": "item_hr_time_tracking", "name": "Regjistrimi i Hyrje/Daljes", "icon": "⏰", "dataView": "hr_time_tracking", "order": 4 },
            { "id": "item_hr_leave_overtime", "name": "Pushimet & Orët Shtesë", "icon": "🏝️", "dataView": "hr_leave_overtime", "order": 5 },
            { "id": "item_hr_holidays", "name": "Kalendari i Festave Zyrtare", "icon": "🎉", "dataView": "hr_holidays", "order": 6 }
        ]},
        { id: "cat_production", name: "Prodhimi", icon: "🏭", order: 10, defaultOpen: false, items: [
            { id: "item_recipe_management", name: "Menaxhimi i Recetave (BOM)", icon: "📜", dataView: "recipe_management", order: 1 },
            { id: "item_production_orders", name: "Urdhërat e Prodhimit", icon: "📝", dataView: "production_orders", order: 2 },
            { id: "item_production_stages", name: "Fazat e Prodhimit", icon: "🔢", dataView: "production_stages", order: 3 },
            { id: "item_production_routings", name: "Proceset Teknologjike", icon: "⚙️", dataView: "production_routings", order: 4 },
        ]},
        { id: "cat_reports", name: "Raportet", icon: "📈", order: 11, defaultOpen: false, items: [
            { id: "item_sales_reports", name: "Raportet e Shitjeve", "icon": "🛒", dataView: "sales_reports", order: 1 },
            { id: "item_purchases_reports", name: "Raportet e Blerjeve", "icon": "🛍️", dataView: "purchases_reports", order: 2 },
            { id: "item_production_reports", name: "Raportet e Prodhimit", "icon": "🏭", dataView: "production_reports", order: 3 },
            { id: "item_returns_reports", name: "Raportet e Kthimeve", "icon": "↩️", dataView: "returns_reports", order: 4 },
            { id: "item_notes_reports", name: "Raportet e Notave", "icon": "📝", dataView: "notes_reports", order: 5 },
            { id: "item_cash_reports", name: "Raportet e Arkës", "icon": "💵", dataView: "cash_reports", order: 6 },
            { id: "item_logs", name: "Regjistrat e Sistemit", "icon": "📋", dataView: "logs", order: 7 },
        ]},
        { id: "cat_settings_management", name: "Cilësimet & Administrimi", icon: "🔧", order: 12, defaultOpen: false, items: [
            { id: "item_user_management", name: "Menaxhimi i Përdoruesve", icon: "👥", dataView: "user_management", order: 1},
            { id: "item_group_management", name: "Menaxhimi i Grupeve & Lejeve", "icon": "🛡️", "dataView": "group_management", "order": 2 },
            { id: "item_data_management", name: "Menaxhimi i të Dhënave", "icon": "💾", dataView: "data_management", order: 3 },
            { id: "item_subscription", name: "Abonimi i Biznesit", "icon": "⭐", dataView: "subscription", order: 4 },
        ]}
    ];
}

export function buildManagerMenuFromConfig(menuConfig: MenuCategoryConfig[]): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const accordionUl = document.createElement('ul');
    accordionUl.className = 'accordion';

    menuConfig.sort((a, b) => a.order - b.order).forEach(category => {
        const accordionItemLi = document.createElement('li');
        accordionItemLi.className = 'accordion-item';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'accordion-header';
        headerDiv.setAttribute('role', 'button');
        headerDiv.tabIndex = 0;
        headerDiv.setAttribute('aria-expanded', 'false');
        headerDiv.setAttribute('aria-controls', `accordion-content-${category.id}`);
        if(category.defaultOpen) headerDiv.dataset.defaultOpen = 'true';

        headerDiv.innerHTML = `
            <span class="accordion-title">
                <span class="icon">${category.icon}</span> ${category.name}
            </span>
            <span class="accordion-indicator">►</span>
        `;
        
        const contentUl = document.createElement('ul');
        contentUl.id = `accordion-content-${category.id}`;
        contentUl.className = 'accordion-content';

        category.items.sort((a, b) => a.order - b.order).forEach(item => {
            const itemLi = document.createElement('li');
            itemLi.dataset.view = item.dataView;
            itemLi.innerHTML = `<a href="#"><span class="icon">${item.icon}</span>${item.name}</a>`;
            contentUl.appendChild(itemLi);
        });
        
        accordionItemLi.appendChild(headerDiv);
        accordionItemLi.appendChild(contentUl);
        accordionUl.appendChild(accordionItemLi);
    });

    fragment.appendChild(accordionUl);
    return fragment;
}

// -- ALIASES for backward compatibility or convenience --
export const saveCategoriesToLocalStorage = api.saveCategories;
export const saveCreditNotesToLocalStorage = api.saveCreditNotes;
export const saveCustomersToLocalStorage = api.saveCustomers;
export const saveDealsToLocalStorage = api.saveDeals;
export const saveDebitNotesToLocalStorage = api.saveDebitNotes;
export const saveEmployeesToLocalStorage = api.saveEmployees;
export const saveIncomingPaymentsToLocalStorage = api.saveIncomingPayments;
export const saveItemTypesToLocalStorage = api.saveItemTypes;
export const saveLocalSalesInvoicesToLocalStorage = api.saveLocalSalesInvoices;
export const saveOutgoingPaymentsToLocalStorage = api.saveOutgoingPayments;
export const saveProductsToLocalStorage = api.saveProducts;
export const savePurchaseInvoicesToLocalStorage = api.savePurchaseInvoices;
export const saveRecipesToLocalStorage = api.saveRecipes;
export const saveReturnPurchaseInvoicesToLocalStorage = api.saveReturnPurchaseInvoices;
export const saveSalesLogToLocalStorage = api.saveSalesLog;
export const saveSalesReturnInvoicesToLocalStorage = api.saveSalesReturnInvoices;
export const saveSuppliersToLocalStorage = api.saveSuppliers;
export const saveProductionOrdersToLocalStorage = api.saveProductionOrders;
export const saveProductionStagesToLocalStorage = api.saveProductionStages;
export const saveProductionRoutingsToLocalStorage = api.saveProductionRoutings;