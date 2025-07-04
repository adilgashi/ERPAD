

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as config from '../core/config';
import { Business, User, BusinessDetails, SubscriptionPackage } from '../models'; 
import * as utils from '../core/utils';
import { showCustomConfirm, isAnyOtherModalOrDropdownActive } from '../core/ui';
import { showSuperAdminWelcomeView, showSuperAdminBusinessListView, showSuperAdminBusinessManagementView } from './ui';
import { renderSuperAdminManagerList, renderSuperAdminSellerList } from './userManagement';
import { handleApplySelectedPackageImmediately, openSubscriptionPackageFormModal } from './packageManagement';

export function openAddBusinessModal(): void {
    if (!dom.addBusinessModal || !dom.addBusinessForm || !dom.addBusinessNameInput ||
        !dom.addBusinessLogoInput || !dom.addBusinessLogoPreview || 
        !dom.subscriptionPackageSelectionContainer || !dom.addBusinessFormError ||
        !dom.selectedSubscriptionPackageIdInput || !dom.saveNewBusinessBtn) return;

    dom.addBusinessForm.reset();
    dom.addBusinessFormError.textContent = '';
    dom.addBusinessLogoPreview.style.display = 'none';
    dom.addBusinessLogoPreview.src = '#';
    
    dom.subscriptionPackageSelectionContainer.innerHTML = '';
    if (state.subscriptionPackages.length > 0) {
        state.subscriptionPackages.forEach(pkg => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'subscription-package-card';
            cardDiv.dataset.packageId = pkg.id;
            cardDiv.setAttribute('role', 'radio');
            cardDiv.setAttribute('aria-checked', 'false');
            cardDiv.tabIndex = 0;

            const featuresList = pkg.features.map(f => `<li>${f}</li>`).join('');
            cardDiv.innerHTML = `
                <h4>${pkg.name}</h4>
                <p class="price">${pkg.price.toFixed(2)} € <span class="duration">/ ${pkg.durationYears} vit(e)</span></p>
                <ul class="features">${featuresList}</ul>
            `;
            cardDiv.addEventListener('click', () => selectSubscriptionPackageCardForNewBusiness(cardDiv, pkg.id));
            cardDiv.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    selectSubscriptionPackageCardForNewBusiness(cardDiv, pkg.id);
                }
            });
            dom.subscriptionPackageSelectionContainer.appendChild(cardDiv);
        });
        dom.saveNewBusinessBtn.disabled = false;
    } else {
        dom.subscriptionPackageSelectionContainer.innerHTML = '<p class="error-message">Nuk ka paketa abonimi të konfiguruara. Ju lutem shtoni paketa nga menaxhimi i paketave.</p>';
        dom.saveNewBusinessBtn.disabled = true;
    }
    dom.selectedSubscriptionPackageIdInput.value = '';
    dom.addBusinessModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function selectSubscriptionPackageCardForNewBusiness(selectedCard: HTMLDivElement, packageId: string) {
    if (!dom.subscriptionPackageSelectionContainer || !dom.selectedSubscriptionPackageIdInput) return;
    
    const allCards = dom.subscriptionPackageSelectionContainer.querySelectorAll<HTMLDivElement>('.subscription-package-card');
    allCards.forEach(card => {
        card.classList.remove('selected');
        card.setAttribute('aria-checked', 'false');
    });

    selectedCard.classList.add('selected');
    selectedCard.setAttribute('aria-checked', 'true');
    dom.selectedSubscriptionPackageIdInput.value = packageId;
}

export function closeAddBusinessModal(): void {
    if (dom.addBusinessModal) {
        dom.addBusinessModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('addBusinessModal')) {
             dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

export async function handleSaveNewBusiness(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.addBusinessNameInput || !dom.addBusinessFormError || !dom.addBusinessLogoInput || !dom.selectedSubscriptionPackageIdInput) return;

    const name = dom.addBusinessNameInput.value.trim();
    const logoFile = dom.addBusinessLogoInput.files?.[0];
    const selectedPackageId = dom.selectedSubscriptionPackageIdInput.value;

    if (!name) { dom.addBusinessFormError.textContent = "Emri i biznesit është i detyrueshëm."; return; }
    if (state.businesses.some(b => b.name.toLowerCase() === name.toLowerCase())) { dom.addBusinessFormError.textContent = "Një biznes me këtë emër ekziston tashmë."; return; }
    if (!selectedPackageId) { dom.addBusinessFormError.textContent = "Ju lutem zgjidhni një paketë abonimi."; return; }
    
    const subscriptionPackage = state.subscriptionPackages.find(p => p.id === selectedPackageId);
    if (!subscriptionPackage) { dom.addBusinessFormError.textContent = "Paketa e abonimit e zgjedhur nuk është valide."; return; }

    let logoUrl: string | undefined;
    if (logoFile) {
        try { logoUrl = await utils.readFileAsDataURL(logoFile); }
        catch (error) { dom.addBusinessFormError.textContent = "Gabim gjatë leximit të logos."; console.error("Error reading logo file:", error); return; }
    }
    
    const businessId = utils.generateUniqueId('biz-');
    const activationCode = `ACT-${businessId.slice(0,4).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    const now = new Date();
    const subscriptionEndDate = new Date(new Date(now).setFullYear(now.getFullYear() + subscriptionPackage.durationYears)).getTime();
    const currentFiscalYear = new Date().getFullYear();

    const newBusiness: Business = {
        id: businessId, name: name, logoUrl: logoUrl, isActive: true,
        subscriptionPackageId: subscriptionPackage.id, subscriptionActivationCode: activationCode,
        subscriptionEndDate: subscriptionEndDate, fiscalYear: currentFiscalYear, invoiceIdSeed: 1,
        purchaseInvoiceIdSeed: 1, returnPurchaseInvoiceIdSeed: 1, outgoingPaymentIdSeed: 1,
        incomingPaymentIdSeed: 1, localSaleInvoiceIdSeed: 1, salesReturnInvoiceIdSeed: 1,
        creditNoteIdSeed: 1, debitNoteIdSeed: 1, productionOrderIdSeed: 1, payrollEntryIdSeed: 1,
        upgradeRequest: undefined
    };

    state.businesses.push(newBusiness);
    await storage.saveAllBusinesses(state.businesses);
    
    const newBusinessDetails: BusinessDetails = { name: name, address: '', nipt: '', logoUrl: logoUrl };
    await storage.saveBusinessDetails(businessId, newBusinessDetails);

    const defaultManager: User = { id: utils.generateUniqueId('manager-'), username: 'menaxher', passwordHash: utils.simpleHash('menaxher123'), role: 'menaxher' };
    await storage.saveUsers(businessId, [defaultManager]);
    
    await storage.saveClearSalePinHash(businessId, config.DEFAULT_CLEAR_SALE_PIN);

    alert(`Biznesi "${name}" u krijua me sukses! Kodi i aktivizimit: ${activationCode}`);
    closeAddBusinessModal();
    renderSuperAdminContentBusinessList();
}

export async function handleManageBusiness(businessId: string): Promise<void> {
    if (!state.currentUser?.isSuperAdmin) { console.error("Attempted to manage business without Super Admin privileges."); return; }

    const businessToManage = state.businesses.find(b => b.id === businessId);
    if (!businessToManage) { console.error(`Business with ID ${businessId} not found.`); showSuperAdminWelcomeView(); return; }

    state.setCurrentManagingBusinessId(businessId);
    storage.saveCurrentManagingBusinessIdToSessionStorage(businessId);
    
    await storage.loadAllBusinessData(businessId);
    showSuperAdminBusinessManagementView(businessId);
}

export function renderManagingBusinessViewContent(businessId: string) {
    const businessToManage = state.businesses.find(b => b.id === businessId);
    if (!businessToManage) { console.error("Business to manage not found:", businessId); return; }
    
    if (dom.currentlyManagingBusinessDisplayContentArea) {
        dom.currentlyManagingBusinessDisplayContentArea.innerHTML = `Po menaxhoni biznesin: <strong>${businessToManage.name}</strong> (ID: ${businessToManage.id})`;
        dom.currentlyManagingBusinessDisplayContentArea.style.display = 'block';
    }
    if(dom.saBusinessUpgradeRequestInfo) {
        if(businessToManage.upgradeRequest) {
            const requestedPackage = state.subscriptionPackages.find(p => p.id === businessToManage.upgradeRequest!.packageId);
            dom.saBusinessUpgradeRequestInfo.innerHTML = `Kërkesë Përmirësimi: Biznesi ka kërkuar ngritje në pakon <strong>"${requestedPackage?.name || 'E Panjohur'}"</strong> më ${new Date(businessToManage.upgradeRequest.requestedAt).toLocaleString('sq-AL')}.`;
            dom.saBusinessUpgradeRequestInfo.style.display = 'block';
        } else {
            dom.saBusinessUpgradeRequestInfo.style.display = 'none';
        }
    }
    
    renderBusinessDetailsForm();
    renderFutureSubscriptionManagementSection(businessToManage);
    renderSuperAdminManagerList();
    renderSuperAdminSellerList();

    if (dom.openNewFiscalYearBtn) {
        dom.openNewFiscalYearBtn.style.display = 'inline-block';
        dom.openNewFiscalYearBtn.disabled = !(businessToManage.fiscalYear < new Date().getFullYear());
        dom.openNewFiscalYearBtn.title = dom.openNewFiscalYearBtn.disabled ? "Viti fiskal nuk mund të hapet për vitin aktual ose një vit të ardhshëm." : `Hap vitin fiskal ${businessToManage.fiscalYear + 1}.`;
    }
}

export function renderSuperAdminContentBusinessList(): void {
    if (!dom.saBusinessListContainer) return;
    dom.saBusinessListContainer.innerHTML = '';

    if (state.businesses.length === 0) {
        dom.saBusinessListContainer.innerHTML = '<p class="info-message">Nuk ka biznese të regjistruara. Shtyp "Shto Biznes të Ri" për të filluar.</p>';
        return;
    }

    state.businesses.forEach(business => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'sa-business-list-item';
        itemDiv.classList.toggle('inactive-business-row', !business.isActive);
        itemDiv.dataset.businessId = business.id;

        const currentPackage = state.subscriptionPackages.find(p => p.id === business.subscriptionPackageId);
        const subscriptionEndDate = business.subscriptionEndDate ? new Date(business.subscriptionEndDate).toLocaleDateString('sq-AL') : 'N/A';
        const futurePackage = state.subscriptionPackages.find(p => p.id === business.futureSubscriptionPackageId);
        let subscriptionInfoHtml = `<span class="business-subscription-info">Paketa: <strong>${currentPackage?.name || 'E pacaktuar'}</strong> | Skadenca: <strong>${subscriptionEndDate}</strong></span>`;
        if (futurePackage) {
            subscriptionInfoHtml += `<span class="business-subscription-info future">Abonimi i ardhshëm: <strong>${futurePackage.name}</strong></span>`;
        }

        itemDiv.innerHTML = `
            <div class="business-info" data-business-id="${business.id}">
                <span class="business-name">${business.name}</span>
                <span class="business-id">ID: ${business.id}</span>
                ${subscriptionInfoHtml}
            </div>
            <div class="business-status-toggle">
                <span class="business-status-text status-${business.isActive ? 'active' : 'inactive'}">${business.isActive ? 'Aktiv' : 'Joaktiv'}</span>
                <label class="switch">
                    <input type="checkbox" class="business-status-switch" ${business.isActive ? 'checked' : ''} data-business-id="${business.id}">
                    <span class="slider round"></span>
                </label>
            </div>
            <div class="business-actions">
                <button class="btn btn-primary btn-sm manage-business-btn" data-business-id="${business.id}">Menaxho</button>
            </div>
        `;
        
        itemDiv.querySelector('.manage-business-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            handleManageBusiness(business.id);
        });

        itemDiv.querySelector('.business-info')?.addEventListener('click', (e) => {
            e.stopPropagation();
            handleManageBusiness(business.id);
        });

        itemDiv.querySelector('.business-status-switch')?.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleBusinessActiveState(business.id);
        });

        dom.saBusinessListContainer.appendChild(itemDiv);
    });
}

export async function toggleBusinessActiveState(businessId: string): Promise<void> {
    const business = state.businesses.find(b => b.id === businessId);
    if (business) {
        business.isActive = !business.isActive;
        await storage.saveAllBusinesses(state.businesses);
        renderSuperAdminContentBusinessList(); 
    }
}

export async function handleSaveBusinessDetails(event: Event): Promise<void> {
    event.preventDefault();
    if (!state.currentManagingBusinessId || !dom.businessNameInput || !dom.businessAddressInput || !dom.businessNiptInput || !dom.businessLogoInputSA) return;
    
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    const details = state.businessDetails;

    if (business && details) {
        business.name = dom.businessNameInput.value.trim();
        details.name = business.name;
        details.address = dom.businessAddressInput.value.trim();
        details.nipt = dom.businessNiptInput.value.trim();
        
        const logoFile = dom.businessLogoInputSA.files?.[0];
        if (logoFile) {
            try {
                const logoUrl = await utils.readFileAsDataURL(logoFile);
                details.logoUrl = logoUrl;
                business.logoUrl = logoUrl;
                await storage.saveBusinessDetails(state.currentManagingBusinessId, details);
                await storage.saveAllBusinesses(state.businesses);
                alert("Detajet e biznesit u ruajtën (me logo të re).");
                if (dom.businessLogoPreviewSA) dom.businessLogoPreviewSA.src = logoUrl;
            } catch (err) {
                alert("Gabim gjatë ngarkimit të logos.");
            }
        } else {
            await storage.saveBusinessDetails(state.currentManagingBusinessId, details);
            await storage.saveAllBusinesses(state.businesses);
            alert("Detajet e biznesit u ruajtën.");
        }
    }
    renderManagingBusinessViewContent(state.currentManagingBusinessId); 
}

export async function handleDeleteBusinessLogoSA(): Promise<void> {
     if (!state.currentManagingBusinessId || !state.businessDetails || !dom.businessLogoPreviewSA) return;
    
    showCustomConfirm("Jeni i sigurt që doni të fshini logon e biznesit?", async () => {
        if (state.businessDetails) state.businessDetails.logoUrl = undefined;
        const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
        if (business) business.logoUrl = undefined;
        
        await storage.saveBusinessDetails(state.currentManagingBusinessId!, state.businessDetails!);
        await storage.saveAllBusinesses(state.businesses);
        if(dom.businessLogoPreviewSA) {
            dom.businessLogoPreviewSA.src = '#';
            dom.businessLogoPreviewSA.style.display = 'none';
        }
        if(dom.businessLogoInputSA) dom.businessLogoInputSA.value = '';
        alert("Logoja e biznesit u fshi.");
    });
}

export function handleDeleteBusiness(businessId: string, businessName: string): void {
    showCustomConfirm(`Jeni absolutisht i sigurt që doni të Fshini përgjithmonë biznesin "${businessName}" (ID: ${businessId}) dhe të gjitha të dhënat e tij? Ky veprim nuk mund të kthehet!`, async () => {
        for (const key of Object.values(config)) {
            if (typeof key === 'string' && key.startsWith('pos')) {
                const businessSpecificKey = storage.getBusinessStorageKey(key, businessId);
                localStorage.removeItem(businessSpecificKey);
            }
        }

        state.setBusinesses(state.businesses.filter(b => b.id !== businessId));
        await storage.saveAllBusinesses(state.businesses);
        
        alert(`Biznesi "${businessName}" dhe të gjitha të dhënat e tij u fshinë përgjithmonë.`);
        showSuperAdminBusinessListView(); 
    });
}

export async function handleGenerateFutureSubscriptionCode(): Promise<void> {
    if (!state.currentManagingBusinessId || !dom.futureSubscriptionPackageSelect || !dom.newlyGeneratedFutureCodeDisplay || !dom.newlyGeneratedFutureCodeValue) return;
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business) { alert("Biznesi nuk u gjet."); return; }

    const selectedPackageId = dom.futureSubscriptionPackageSelect.value;
    if (!selectedPackageId) { alert("Ju lutem zgjidhni një paketë abonimi."); return; }
    
    const pkg = state.subscriptionPackages.find(p => p.id === selectedPackageId);
    if (!pkg) { alert("Paketa e zgjedhur nuk u gjet."); return; }

    const futureCode = `FUT-${business.id.slice(0,3).toUpperCase()}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
    
    business.futureSubscriptionActivationCode = futureCode;
    business.futureSubscriptionPackageId = selectedPackageId;
    business.futureSubscriptionGeneratedAt = Date.now();
    
    if (business.upgradeRequest?.packageId === selectedPackageId) {
        business.upgradeRequest = undefined;
    }

    await storage.saveAllBusinesses(state.businesses);
    
    dom.newlyGeneratedFutureCodeValue.textContent = futureCode;
    dom.newlyGeneratedFutureCodeDisplay.style.display = 'block';
    
    renderFutureSubscriptionManagementSection(business); 
    renderManagingBusinessViewContent(business.id);
    alert(`Kodi i abonimit të ardhshëm "${futureCode}" për paketën "${pkg.name}" u gjenerua.`);
}

export async function handleOpenNewFiscalYear(): Promise<void> {
    if (!state.currentManagingBusinessId) { alert("Nuk ka biznes të zgjedhur."); return; }
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business) { alert("Biznesi nuk u gjet."); return; }

    const currentYear = new Date().getFullYear();
    if (business.fiscalYear >= currentYear) {
        alert(`Viti fiskal aktual (${business.fiscalYear}) është i njëjtë ose më i madh se viti aktual (${currentYear}). Nuk mund të hapet vit i ri fiskal.`);
        return;
    }
    
    showCustomConfirm(
        `Jeni i sigurt që doni të hapni vitin e ri fiskal ${business.fiscalYear + 1} për biznesin "${business.name}"? \n` +
        `Kjo do të resetojë numrat e faturave (shitje, blerje, kthime, pagesa) në 1. \n` +
        `Të dhënat e vitit aktual ${business.fiscalYear} DO TË MBETEN. Sigurohuni që keni bërë backup para këtij veprimi.`,
        async () => {
            business.fiscalYear += 1;
            business.invoiceIdSeed = 1;
            business.purchaseInvoiceIdSeed = 1;
            business.returnPurchaseInvoiceIdSeed = 1;
            business.outgoingPaymentIdSeed = 1;
            business.incomingPaymentIdSeed = 1;
            business.localSaleInvoiceIdSeed = 1;
            business.salesReturnInvoiceIdSeed = 1;
            business.creditNoteIdSeed = 1;
            business.debitNoteIdSeed = 1;
            await storage.saveAllBusinesses(state.businesses);
            alert(`Viti i ri fiskal ${business.fiscalYear} u hap me sukses për "${business.name}". Numrat e faturave u resetuan.`);
            renderManagingBusinessViewContent(business.id); 
        }
    );
}

export function handleRestoreBusinessBackupPrompt(): void {
    if (!state.currentManagingBusinessId) { alert("Ju lutem zgjidhni një biznes së pari për të restauruar të dhënat."); return; }
    if (dom.backupFileInput) {
        showCustomConfirm("Restaurimi i një backup-i do të mbishkruajë të gjitha të dhënat aktuale për këtë biznes! Ky veprim nuk mund të kthehet. Jeni i sigurt që doni të vazhdoni?", () => {
             dom.backupFileInput?.click();
        });
    }
}

export function handleBackupFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    if (!state.currentManagingBusinessId) { alert("Gabim: Nuk ka biznes të zgjedhur për restaurim."); return; }

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const backupData = JSON.parse(e.target?.result as string);
            const businessIdToRestore = state.currentManagingBusinessId!;

            if (!backupData.businessMetadata || !backupData.users || !backupData.products) {
                throw new Error("Formati i backup-it është i pavlefshëm.");
            }
            if (backupData.businessMetadata.id !== businessIdToRestore) {
                 showCustomConfirm(`ID e biznesit në backup (${backupData.businessMetadata.id}) nuk përputhet me ID-në e biznesit aktualisht të zgjedhur (${businessIdToRestore}). Dëshironi të vazhdoni dhe të mbishkruani të dhënat e biznesit "${state.businesses.find(b=>b.id===businessIdToRestore)?.name}" me të dhënat nga ky backup?`,
                    () => {
                        proceedWithRestore(backupData, businessIdToRestore);
                    }
                 );
                 return;
            }
            proceedWithRestore(backupData, businessIdToRestore);

        } catch (error: any) {
            alert(`Gabim gjatë restaurimit të backup-it: ${error.message}`);
            console.error("Backup restore error:", error);
        } finally {
            input.value = ''; 
        }
    };
    reader.readAsText(file);
}

export async function proceedWithRestore(backupData: any, businessIdToRestore: string): Promise<void> {
    const businessIndex = state.businesses.findIndex(b => b.id === businessIdToRestore);
    if (businessIndex > -1) {
        state.businesses[businessIndex] = {
            ...state.businesses[businessIndex], 
            ...backupData.businessMetadata,     
            id: businessIdToRestore, 
            salesReturnInvoiceIdSeed: backupData.businessMetadata.salesReturnInvoiceIdSeed || 1, 
            creditNoteIdSeed: backupData.businessMetadata.creditNoteIdSeed || 1,
            debitNoteIdSeed: backupData.businessMetadata.debitNoteIdSeed || 1,
        };
        await storage.saveAllBusinesses(state.businesses);
    }

    const savePromises = Object.keys(config).map(keyName => {
        const baseKey = (config as any)[keyName];
        const dataKey = keyName.replace('_STORAGE_KEY', '').replace('BASE_', '').toLowerCase();
        if (typeof baseKey === 'string' && baseKey.startsWith('pos') && backupData[dataKey]) {
            const storageKey = storage.getBusinessStorageKey(baseKey, businessIdToRestore);
            return localStorage.setItem(storageKey, JSON.stringify(backupData[dataKey]));
        }
        return Promise.resolve();
    });

    await Promise.all(savePromises);

    await storage.loadAllBusinessData(businessIdToRestore);
    renderManagingBusinessViewContent(businessIdToRestore); 
    alert("Të dhënat e biznesit u restauruan me sukses nga backup-i.");
}

export function renderBusinessDetailsForm(): void {
    if (!state.currentManagingBusinessId || !dom.businessNameInput || !dom.businessAddressInput || !dom.businessNiptInput || !dom.businessLogoPreviewSA || !dom.businessLogoInputSA) return;
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    const details = state.businessDetails;

    if (business && details) {
        dom.businessNameInput.value = business.name; 
        dom.businessAddressInput.value = details.address || '';
        dom.businessNiptInput.value = details.nipt || '';
        if (details.logoUrl) {
            dom.businessLogoPreviewSA.src = details.logoUrl;
            dom.businessLogoPreviewSA.style.display = 'block';
        } else {
            dom.businessLogoPreviewSA.src = '#';
            dom.businessLogoPreviewSA.style.display = 'none';
        }
        dom.businessLogoInputSA.value = '';
    }
}

export function renderFutureSubscriptionManagementSection(business: Business): void {
    if (!dom.futureSubscriptionManagementSection || !dom.existingFutureSubscriptionInfo ||
        !dom.displayFutureSubCode || !dom.displayFutureSubPackage || !dom.displayFutureSubGeneratedDate ||
        !dom.futureSubscriptionPackageSelect || !dom.newlyGeneratedFutureCodeDisplay) return;

    const generateBtn = document.getElementById('generate-future-subscription-code-btn') as HTMLButtonElement | null;
    const applyNowBtn = document.getElementById('apply-selected-package-now-btn') as HTMLButtonElement | null;

    dom.futureSubscriptionPackageSelect.innerHTML = '<option value="">-- Zgjidh Paketën --</option>';
    state.subscriptionPackages.forEach(pkg => {
        const option = document.createElement('option');
        option.value = pkg.id;
        option.textContent = `${pkg.name} (${pkg.price}€ / ${pkg.durationYears}v)`;
        dom.futureSubscriptionPackageSelect.appendChild(option);
    });

    if (business.futureSubscriptionActivationCode && business.futureSubscriptionPackageId && business.futureSubscriptionGeneratedAt) {
        const futurePkg = state.subscriptionPackages.find(p => p.id === business.futureSubscriptionPackageId);
        dom.displayFutureSubCode.textContent = business.futureSubscriptionActivationCode;
        dom.displayFutureSubPackage.textContent = futurePkg?.name || 'E Panjohur';
        dom.displayFutureSubGeneratedDate.textContent = new Date(business.futureSubscriptionGeneratedAt).toLocaleString('sq-AL');
        dom.existingFutureSubscriptionInfo.style.display = 'block';
    } else {
        dom.existingFutureSubscriptionInfo.style.display = 'none';
    }
    dom.newlyGeneratedFutureCodeDisplay.style.display = 'none'; 

    const selectedPackage = dom.futureSubscriptionPackageSelect.value;
    if (generateBtn) generateBtn.disabled = !selectedPackage;
    if (applyNowBtn) applyNowBtn.disabled = !selectedPackage;

    dom.futureSubscriptionPackageSelect.onchange = () => {
        const currentSelection = dom.futureSubscriptionPackageSelect?.value;
        if (generateBtn) generateBtn.disabled = !currentSelection;
        if (applyNowBtn) applyNowBtn.disabled = !currentSelection;
    };
}

export function toggleBusinessSpecificSAControls(enable: boolean) {
    const elementsToToggle: (HTMLInputElement | HTMLButtonElement | HTMLSelectElement | null)[] = [
        dom.businessNameInput, dom.businessAddressInput, dom.businessNiptInput, dom.businessLogoInputSA,
        dom.saveBusinessDetailsBtn, dom.deleteBusinessLogoBtnSA, dom.deleteCurrentBusinessBtn,
        dom.futureSubscriptionPackageSelect, dom.generateFutureSubscriptionCodeBtn, 
        document.getElementById('apply-selected-package-now-btn') as HTMLButtonElement | null,
        dom.openNewFiscalYearBtn, dom.restoreBusinessBackupBtn, dom.backupFileInput,
        dom.superAdminShowAddManagerModalBtn, dom.superAdminShowAddSellerModalBtn
    ];
    elementsToToggle.forEach(el => {
        if (el) el.disabled = !enable;
    });

    const userActionButtons = document.querySelectorAll<HTMLButtonElement>(
        '#super-admin-manager-list-tbody button, #super-admin-seller-list-tbody button'
    );
    userActionButtons.forEach(btn => btn.disabled = !enable);
}
