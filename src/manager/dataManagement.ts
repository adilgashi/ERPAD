/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as config from '../core/config';
import { downloadFile } from '../core/utils';

export function initDataManagementEventListeners(): void {
    dom.downloadBusinessBackupBtn?.addEventListener('click', handleDownloadBusinessBackup);
}

export async function handleDownloadBusinessBackup(): Promise<void> {
    if (!state.currentManagingBusinessId) {
        alert("Nuk është zgjedhur asnjë biznes për backup.");
        return;
    }
    const businessId = state.currentManagingBusinessId;
    const business = state.businesses.find(b => b.id === businessId);
    if (!business) {
        alert("Biznesi nuk u gjet.");
        return;
    }

    try {
        const backupData = {
            businessMetadata: { ...business },
            users: await storage.getUsers(businessId),
            products: await storage.getProducts(businessId),
            categories: await storage.getCategories(businessId),
            itemTypes: await storage.getItemTypes(businessId),
            dailyCashLog: await storage.getDailyCashLog(businessId),
            salesLog: await storage.getSalesLog(businessId),
            clearedSalesLog: await storage.getClearedSalesLog(businessId),
            businessDetails: await storage.getBusinessDetails(businessId),
            deals: await storage.getDeals(businessId),
            customers: await storage.getCustomers(businessId),
            suppliers: await storage.getSuppliers(businessId),
            purchaseInvoices: await storage.getPurchaseInvoices(businessId),
            returnPurchaseInvoices: await storage.getReturnPurchaseInvoices(businessId),
            outgoingPayments: await storage.getOutgoingPayments(businessId),
            incomingPayments: await storage.getIncomingPayments(businessId),
            localSalesInvoices: await storage.getLocalSalesInvoices(businessId),
            salesReturnInvoices: await storage.getSalesReturnInvoices(businessId),
            creditNotes: await storage.getCreditNotes(businessId),
            debitNotes: await storage.getDebitNotes(businessId),
            recipes: await storage.getRecipes(businessId),
            productionOrders: await storage.getProductionOrders(businessId),
            productionStages: await storage.getProductionStages(businessId),
            productionRoutings: await storage.getProductionRoutings(businessId),
            clearSalePinHash: await storage.getClearSalePinHash(businessId),
            backupTimestamp: new Date().toISOString()
        };

        const filename = `backup_${business.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.json`;
        downloadFile(JSON.stringify(backupData, null, 2), filename, 'application/json');
        alert(`Backup për biznesin "${business.name}" u shkarkua si ${filename}.`);
    } catch (error) {
        console.error("Error creating backup:", error);
        alert("Gabim gjatë krijimit të backup-it. Shikoni konsolën për detaje.");
    }
}
