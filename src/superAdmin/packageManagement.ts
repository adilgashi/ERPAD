
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { SubscriptionPackage } from '../models';
import * as utils from '../core/utils';
import { showCustomConfirm, isAnyOtherModalOrDropdownActive } from '../core/ui';
import { hideAllSuperAdminContentSections, highlightActiveSidebarAction } from './ui';
import { updateAppTitle } from '../core/ui';
import { toggleSuperAdminAppSettingsControls } from './appSettings';
import { toggleBusinessSpecificSAControls } from './businessManagement';


export function generateNewPackageId(): string {
    let maxNum = 0;
    state.subscriptionPackages.forEach(pkg => {
        if (pkg.id.startsWith("SUB-")) {
            const numPart = parseInt(pkg.id.substring(4), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
                maxNum = numPart;
            }
        }
    });
    return `SUB-${(maxNum + 1).toString().padStart(3, '0')}`;
}

function updateFeaturesTextareaBasedOnPermissionsSA() {
    if (!dom.packageFormFeaturesTextarea || !dom.subscriptionPackageForm) return;

    const featuresTextarea = dom.packageFormFeaturesTextarea;
    featuresTextarea.value = '';
    const collectedFeatures: string[] = [];

    const fieldsetNodeList = dom.subscriptionPackageForm.querySelectorAll('.permissions-group');
    const fieldsets: HTMLFieldSetElement[] = Array.from(fieldsetNodeList) as HTMLFieldSetElement[];
    
    fieldsets.forEach(fieldset => {
        const legend = fieldset.querySelector('legend');
        const groupTitle = legend?.textContent?.trim() || "Kategori e Panjohur";
        
        const groupCheckbox = fieldset.querySelector('.permission-group-header input[type="checkbox"]') as HTMLInputElement | null;
        
        const individualCheckboxNodes = fieldset.querySelectorAll('div:not(.permission-group-header) input[type="checkbox"]');
        const individualCheckboxes: HTMLInputElement[] = Array.from(individualCheckboxNodes) as HTMLInputElement[];
        
        const selectedIndividualPermissions = individualCheckboxes
            .filter(cb => cb.checked)
            .map(cb => (cb.nextElementSibling as HTMLLabelElement)?.textContent?.trim())
            .filter(Boolean) as string[];

        if (groupCheckbox?.checked) {
            if (!collectedFeatures.includes(groupTitle)) {
                collectedFeatures.push(groupTitle);
            }
        } else if (selectedIndividualPermissions.length > 0) {
            if (!collectedFeatures.includes(groupTitle)) {
                collectedFeatures.push(groupTitle);
            }
            selectedIndividualPermissions.forEach(permText => {
                const indentedFeature = `  - ${permText}`;
                if (!collectedFeatures.includes(indentedFeature)) {
                    collectedFeatures.push(indentedFeature);
                }
            });
        }
    });

    featuresTextarea.value = collectedFeatures.join('\n');
}

export function openSubscriptionPackageFormModal(packageIdToEdit?: string): void {
    if (!dom.subscriptionPackageFormModal || !dom.subscriptionPackageForm || !dom.subscriptionPackageFormModalTitle ||
        !dom.editPackageIdInput || !dom.packageFormIdInput || !dom.packageFormNameInput || !dom.packageFormPriceInput ||
        !dom.packageFormDurationInput || !dom.packageFormFeaturesTextarea || !dom.packageFormErrorElement) {
        console.error("Missing subscription package form elements.");
        return;
    }

    dom.subscriptionPackageForm.reset();
    dom.packageFormErrorElement.textContent = '';
    dom.packageFormIdInput.readOnly = true; 

    const permissionsContainer = dom.packagePermissionsContainer; // Use direct DOM reference
    const featuresTextarea = dom.packageFormFeaturesTextarea;

    if (!permissionsContainer) {
        console.error("Permissions container not found in subscription package modal.");
        if (dom.packageFormErrorElement) dom.packageFormErrorElement.textContent = "Gabim UI: Nuk u gjet kontejneri i lejeve.";
        return;
    }
    permissionsContainer.innerHTML = ''; 

    const managerMenuSourceContainer = dom.dynamicManagerMenuContainer?.children.length 
                                      ? dom.dynamicManagerMenuContainer 
                                      : dom.managerSidebar;

    if (!managerMenuSourceContainer || managerMenuSourceContainer.children.length === 0) {
         permissionsContainer.innerHTML = '<p class="error-message">Gabim: Struktura e menysë së menaxherit nuk u gjet ose është bosh. Sigurohuni që menyja është e definuar.</p>';
         return;
    }

    const accordionItemNodes = managerMenuSourceContainer.querySelectorAll('.accordion-item');
    const accordionItems: Element[] = Array.from(accordionItemNodes);
    if (accordionItems.length === 0) {
        permissionsContainer.innerHTML = '<p class="info-message">Nuk ka pamje menaxheri të definuara për të caktuar leje.</p>';
    } else {
       renderPermissionsCheckboxesForSA(accordionItems, packageIdToEdit);
    }
    
    if (packageIdToEdit) {
        const pkg = state.subscriptionPackages.find(p => p.id === packageIdToEdit);
        if (pkg) {
            dom.subscriptionPackageFormModalTitle.textContent = "Modifiko Paketën e Abonimit";
            dom.editPackageIdInput.value = pkg.id;
            dom.packageFormIdInput.value = pkg.id;
            dom.packageFormNameInput.value = pkg.name;
            dom.packageFormPriceInput.value = pkg.price.toString();
            dom.packageFormDurationInput.value = pkg.durationYears.toString();
            updateFeaturesTextareaBasedOnPermissionsSA(); 
        } else {
            dom.packageFormErrorElement.textContent = "Paketa nuk u gjet.";
            return; 
        }
    } else {
        dom.subscriptionPackageFormModalTitle.textContent = "Shto Paketë të Re Abonimi";
        dom.editPackageIdInput.value = ''; 
        dom.packageFormIdInput.value = generateNewPackageId(); 
        if (featuresTextarea) featuresTextarea.value = ''; 
        updateFeaturesTextareaBasedOnPermissionsSA(); 
    }
    dom.subscriptionPackageFormModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function renderPermissionsCheckboxesForSA(accordionItems: Element[], packageIdToEdit?: string) {
    const permissionsContainer = dom.packagePermissionsContainer;
    if (!permissionsContainer) return;

    let pkgToEdit: SubscriptionPackage | undefined;
    if (packageIdToEdit) {
        pkgToEdit = state.subscriptionPackages.find(p => p.id === packageIdToEdit);
    }

    accordionItems.forEach(accordionItem => {
        const headerElement = accordionItem.querySelector('.accordion-header .accordion-title');
        let categoryTitleText = "Kategori e Panjohur";
        if (headerElement) {
            const iconElement = headerElement.querySelector('.icon');
            categoryTitleText = (headerElement.textContent || "").trim();
            if (iconElement && iconElement.textContent) {
                categoryTitleText = categoryTitleText.replace(iconElement.textContent, '').trim();
            }
            categoryTitleText = categoryTitleText.replace(/►|▼/g, '').trim();
        }
        
        const viewLinkNodes = accordionItem.querySelectorAll('.accordion-content li[data-view]');
        const viewLinks: HTMLLIElement[] = Array.from(viewLinkNodes) as HTMLLIElement[];

        if (viewLinks.length === 0) return;

        const fieldset = document.createElement('fieldset');
        fieldset.className = 'permissions-group';
        
        const legend = document.createElement('legend');
        legend.textContent = categoryTitleText || "Lejet";
        fieldset.appendChild(legend);

        const groupHeaderDiv = document.createElement('div');
        groupHeaderDiv.className = 'permission-group-header';
        const groupCheckbox = document.createElement('input');
        groupCheckbox.type = 'checkbox';
        groupCheckbox.id = `group-perm-${utils.generateUniqueId()}`; 
        const groupLabel = document.createElement('label');
        groupLabel.htmlFor = groupCheckbox.id;
        groupLabel.textContent = 'Zgjidh/Hiq të Gjitha';
        groupHeaderDiv.appendChild(groupCheckbox);
        groupHeaderDiv.appendChild(groupLabel);
        fieldset.insertBefore(groupHeaderDiv, fieldset.firstChild); 

        const individualCheckboxes: HTMLInputElement[] = [];

        viewLinks.forEach(link => {
            const viewId = link.dataset.view;
            const viewName = link.querySelector('a')?.textContent?.trim();

            if (viewId && viewName) {
                const permissionDiv = document.createElement('div');
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `perm-${viewId}-${utils.generateUniqueId()}`; 
                checkbox.name = 'allowedViews';
                checkbox.value = viewId;
                if (pkgToEdit && pkgToEdit.allowedViews?.includes(viewId)) {
                    checkbox.checked = true;
                }
                individualCheckboxes.push(checkbox);

                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = viewName;
                
                permissionDiv.appendChild(checkbox);
                permissionDiv.appendChild(label);
                fieldset.appendChild(permissionDiv);
            }
        });
        permissionsContainer.appendChild(fieldset);

        groupCheckbox.addEventListener('change', () => {
            const isChecked = groupCheckbox.checked;
            individualCheckboxes.forEach(cb => {
                if (cb.checked !== isChecked) {
                    cb.checked = isChecked;
                    const event = new Event('change', { bubbles: true });
                    cb.dispatchEvent(event); 
                }
            });
            // Only call updateFeatures if all checkboxes are consistently set by the group action
            if (individualCheckboxes.length > 0 && individualCheckboxes.every(cb => cb.checked === isChecked)) {
               updateFeaturesTextareaBasedOnPermissionsSA();
            }
        });

        individualCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                updateFeaturesTextareaBasedOnPermissionsSA(); 
                
                const checkedCount = individualCheckboxes.filter(cb => cb.checked).length;
                if (checkedCount === individualCheckboxes.length) {
                    groupCheckbox.checked = true;
                    groupCheckbox.indeterminate = false;
                } else if (checkedCount === 0) {
                    groupCheckbox.checked = false;
                    groupCheckbox.indeterminate = false;
                } else {
                    groupCheckbox.checked = false; // Set to false when some, but not all, are checked
                    groupCheckbox.indeterminate = true;
                }
            });
        });
        
        // Initial state for group checkbox
        const checkedCount = individualCheckboxes.filter(cb => cb.checked).length;
        if (individualCheckboxes.length > 0) { // Avoid division by zero or NaN issues if no items
            if (checkedCount === individualCheckboxes.length) {
                groupCheckbox.checked = true;
                groupCheckbox.indeterminate = false;
            } else if (checkedCount === 0) {
                groupCheckbox.checked = false;
                groupCheckbox.indeterminate = false;
            } else {
                groupCheckbox.checked = false; // Not all checked
                groupCheckbox.indeterminate = true;
            }
        } else { // No items in this group
             groupCheckbox.checked = false;
             groupCheckbox.indeterminate = false;
        }
    });
}

export function closeSubscriptionPackageFormModal(): void {
    if (dom.subscriptionPackageFormModal) {
        dom.subscriptionPackageFormModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('subscriptionPackageFormModal')) {
             dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

export async function handleSaveSubscriptionPackage(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.packageFormIdInput || !dom.packageFormNameInput || !dom.packageFormPriceInput ||
        !dom.packageFormDurationInput || !dom.packageFormFeaturesTextarea || !dom.packageFormErrorElement ||
        !dom.editPackageIdInput || !dom.subscriptionPackageForm ) {
        console.error("Missing subscription package form elements during save.");
        return;
    }

    const packageId = dom.packageFormIdInput.value.trim(); 
    const name = dom.packageFormNameInput.value.trim();
    const price = parseFloat(dom.packageFormPriceInput.value);
    const durationYears = parseInt(dom.packageFormDurationInput.value, 10);
    const features = dom.packageFormFeaturesTextarea.value.split('\n').map(f => f.trim()).filter(f => f);
    const editingPackageOriginalId = dom.editPackageIdInput.value; 

    const permissionsCheckboxNodes = dom.subscriptionPackageForm.querySelectorAll('input[name="allowedViews"]:checked');
    const permissionsCheckboxes: HTMLInputElement[] = Array.from(permissionsCheckboxNodes) as HTMLInputElement[];
    const allowedViews: string[] = [];
    permissionsCheckboxes?.forEach(checkbox => {
        allowedViews.push(checkbox.value);
    });

    dom.packageFormErrorElement.textContent = '';

    if (!packageId) { 
        dom.packageFormErrorElement.textContent = "ID e paketës është e detyrueshme."; 
        return;
    }
    if (!name) { dom.packageFormErrorElement.textContent = "Emri i paketës është i detyrueshëm."; return; }
    if (isNaN(price) || price < 0) { dom.packageFormErrorElement.textContent = "Çmimi është i pavlefshëm."; return; }
    if (isNaN(durationYears) || durationYears <= 0) { dom.packageFormErrorElement.textContent = "Kohëzgjatja (në vite) është e pavlefshme."; return; }

    if (editingPackageOriginalId) { 
        const packageIndex = state.subscriptionPackages.findIndex(p => p.id === editingPackageOriginalId);
        if (packageIndex > -1) {
            state.subscriptionPackages[packageIndex] = { 
                ...state.subscriptionPackages[packageIndex], 
                id: editingPackageOriginalId, // Keep original ID if editing
                name, 
                price, 
                durationYears, 
                features,
                allowedViews 
            };
        } else {
            dom.packageFormErrorElement.textContent = "Paketa origjinale për modifikim nuk u gjet."; return;
        }
    } else { 
        if (state.subscriptionPackages.some(p => p.id === packageId)) { 
            dom.packageFormErrorElement.textContent = "Një paketë me këtë ID ekziston tashmë."; return; 
        }
        const newPackage: SubscriptionPackage = { 
            id: packageId, 
            name, 
            price, 
            durationYears, 
            features,
            allowedViews 
        };
        state.subscriptionPackages.push(newPackage);
    }

    await storage.saveSubscriptionPackages(state.subscriptionPackages);
    closeSubscriptionPackageFormModal();
    renderSubscriptionPackageList(); 
}

export function renderSubscriptionPackageList() {
    if (!dom.saSubscriptionPackageListTbody) return;
    dom.saSubscriptionPackageListTbody.innerHTML = '';

    if (state.subscriptionPackages.length === 0) {
        dom.saSubscriptionPackageListTbody.innerHTML = '<tr><td colspan="6" class="text-center">Nuk ka paketa abonimi të regjistruara. Shtyp "Shto Paketë të Re".</td></tr>';
        return;
    }

    state.subscriptionPackages.forEach(pkg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${pkg.id}</td>
            <td>${pkg.name}</td>
            <td class="text-right">${pkg.price.toFixed(2)} €</td>
            <td class="text-center">${pkg.durationYears}</td>
            <td>${pkg.features.join(', ')}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-package-id="${pkg.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-package-id="${pkg.id}" data-package-name="${pkg.name}">Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openSubscriptionPackageFormModal(pkg.id));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteSubscriptionPackage(pkg.id, pkg.name));
        dom.saSubscriptionPackageListTbody?.appendChild(tr);
    });
}

export function handleDeleteSubscriptionPackage(packageId: string, packageName: string): void {
    const isInUse = state.businesses.some(b => b.subscriptionPackageId === packageId || b.futureSubscriptionPackageId === packageId);
    if (isInUse) {
        alert(`Paketa "${packageName}" është aktualisht në përdorim nga një ose më shumë biznese (si abonim aktiv ose i ardhshëm) dhe nuk mund të fshihet.`);
        return;
    }

    showCustomConfirm(`Jeni i sigurt që doni të fshini paketën e abonimit "${packageName}" (ID: ${packageId})? Ky veprim nuk mund të kthehet.`, async () => {
        state.setSubscriptionPackages(state.subscriptionPackages.filter(p => p.id !== packageId));
        await storage.saveSubscriptionPackages(state.subscriptionPackages);
        renderSubscriptionPackageList();
        alert(`Paketa e abonimit "${packageName}" u fshi me sukses.`);
    });
}

export async function handleApplySelectedPackageImmediately(): Promise<void> {
    if (!state.currentManagingBusinessId || !dom.futureSubscriptionPackageSelect) {
        alert("Nuk ka biznes të zgjedhur ose paketë të zgjedhur.");
        return;
    }
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business) {
        alert("Biznesi nuk u gjet.");
        return;
    }
    const selectedPackageId = dom.futureSubscriptionPackageSelect.value;
    if (!selectedPackageId) {
        alert("Ju lutem zgjidhni një paketë abonimi.");
        return;
    }
    const subscriptionPackage = state.subscriptionPackages.find(p => p.id === selectedPackageId);
    if (!subscriptionPackage) {
        alert("Paketa e abonimit e zgjedhur nuk është valide.");
        return;
    }

    const now = new Date();
    const subscriptionEndDate = new Date(new Date(now).setFullYear(now.getFullYear() + subscriptionPackage.durationYears)).getTime();

    business.subscriptionPackageId = subscriptionPackage.id;
    business.subscriptionEndDate = subscriptionEndDate;
    business.subscriptionActivationCode = `MANUAL-${subscriptionPackage.id.slice(0,3).toUpperCase()}-${Date.now().toString(36).slice(-4).toUpperCase()}`; // Generate a manual activation code

    business.futureSubscriptionActivationCode = undefined;
    business.futureSubscriptionPackageId = undefined;
    business.futureSubscriptionGeneratedAt = undefined;
    business.upgradeRequest = undefined; 

    await storage.saveAllBusinesses(state.businesses);
    alert(`Paketa "${subscriptionPackage.name}" u aplikua menjëherë për biznesin "${business.name}". Abonimi skadon më ${new Date(subscriptionEndDate).toLocaleDateString('sq-AL')}.`);
    
    const { renderManagingBusinessViewContent } = await import('./businessManagement'); 
    renderManagingBusinessViewContent(business.id);
}

export function showSuperAdminSubscriptionPackageManagementView() {
    hideAllSuperAdminContentSections();
    if (dom.superAdminContentSubscriptionPackages) dom.superAdminContentSubscriptionPackages.style.display = 'block';
    
    state.setCurrentManagingBusinessId(null); // No specific business is being managed here
    storage.saveCurrentManagingBusinessIdToSessionStorage(null);

    renderSubscriptionPackageList();
    updateAppTitle();
    highlightActiveSidebarAction('managePackages');
    toggleBusinessSpecificSAControls(false);
    toggleSuperAdminAppSettingsControls(false);
}
