
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as utils from '../core/utils';
import { showAuthView } from '../core/auth';
import { updateAppTitle, showCustomConfirm } from '../core/ui';
import { hideAllSuperAdminContentSections, highlightActiveSidebarAction, showSuperAdminPanel } from './ui';
import { toggleBusinessSpecificSAControls } from './businessManagement';

export function showSuperAdminAppSettingsView() {
    hideAllSuperAdminContentSections();
    if (dom.superAdminContentAppSettings) dom.superAdminContentAppSettings.style.display = 'block';

    state.setCurrentManagingBusinessId(null); 
    storage.saveCurrentManagingBusinessIdToSessionStorage(null);

    loadSuperAdminAppSettingsToForm();
    updateAppTitle();
    highlightActiveSidebarAction('appSettings');
    toggleBusinessSpecificSAControls(false);
    toggleSuperAdminAppSettingsControls(true);
}

export function loadSuperAdminAppSettingsToForm(): void {
    if (!state.superAdminAppSettings || !dom.saAppNameInput || !dom.saAppLogoPreview || !dom.saAppLogoInput ||
        !dom.saAppAddressInput || !dom.saAppNiptInput || !dom.saAppBankNameInput || !dom.saAppBankAccountInput ||
        !dom.saAppIbanInput || !dom.saAppSwiftInput || !dom.saLoginShowcaseTitlePrefixInput || !dom.saLoginShowcaseSubtitleInput ) return;

    const settings = state.superAdminAppSettings;
    dom.saAppNameInput.value = settings.mainAppName || '';
    if (settings.mainAppLogoUrl) {
        dom.saAppLogoPreview.src = settings.mainAppLogoUrl;
        dom.saAppLogoPreview.style.display = 'block';
    } else {
        dom.saAppLogoPreview.src = '#';
        dom.saAppLogoPreview.style.display = 'none';
    }
    dom.saAppLogoInput.value = '';
    dom.saAppAddressInput.value = settings.mainAppAddress || '';
    dom.saAppNiptInput.value = settings.mainAppNipt || '';
    dom.saAppBankNameInput.value = settings.mainAppBankName || '';
    dom.saAppBankAccountInput.value = settings.mainAppBankAccountNumber || '';
    dom.saAppIbanInput.value = settings.mainAppIban || '';
    dom.saAppSwiftInput.value = settings.mainAppSwift || '';
    dom.saLoginShowcaseTitlePrefixInput.value = settings.loginShowcaseTitlePrefix || '';
    dom.saLoginShowcaseSubtitleInput.value = settings.loginShowcaseSubtitle || '';
}

export async function handleSaveSuperAdminAppSettings(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.saAppNameInput || !dom.saAppLogoInput || !dom.saAppAddressInput ||
        !dom.saAppNiptInput || !dom.saAppBankNameInput || !dom.saAppBankAccountInput ||
        !dom.saAppIbanInput || !dom.saAppSwiftInput || !dom.saAppSettingsError ||
        !dom.saLoginShowcaseTitlePrefixInput || !dom.saLoginShowcaseSubtitleInput) return;

    const appName = dom.saAppNameInput.value.trim();
    const appLogoFile = dom.saAppLogoInput.files?.[0];
    const appAddress = dom.saAppAddressInput.value.trim() || undefined;
    const appNipt = dom.saAppNiptInput.value.trim() || undefined;
    const appBankName = dom.saAppBankNameInput.value.trim() || undefined;
    const appBankAccount = dom.saAppBankAccountInput.value.trim() || undefined;
    const appIban = dom.saAppIbanInput.value.trim() || undefined;
    const appSwift = dom.saAppSwiftInput.value.trim() || undefined;
    const loginShowcaseTitlePrefix = dom.saLoginShowcaseTitlePrefixInput.value.trim() || undefined;
    const loginShowcaseSubtitle = dom.saLoginShowcaseSubtitleInput.value.trim() || undefined;

    let appLogoUrl = state.superAdminAppSettings?.mainAppLogoUrl;

    if (appLogoFile) {
        try {
            appLogoUrl = await utils.readFileAsDataURL(appLogoFile);
        } catch (error) {
            dom.saAppSettingsError.textContent = "Gabim gjatë leximit të logos së aplikacionit.";
            console.error("Error reading app logo file:", error);
            return;
        }
    }

    const newSettings = {
        mainAppName: appName || "Arka Elektronike",
        mainAppLogoUrl: appLogoUrl,
        mainAppAddress: appAddress,
        mainAppNipt: appNipt,
        mainAppBankName: appBankName,
        mainAppBankAccountNumber: appBankAccount,
        mainAppIban: appIban,
        mainAppSwift: appSwift,
        loginShowcaseTitlePrefix: loginShowcaseTitlePrefix,
        loginShowcaseSubtitle: loginShowcaseSubtitle,
    };

    state.setSuperAdminAppSettings(newSettings);
    await storage.saveSuperAdminAppSettings(newSettings);
    alert("Cilësimet e aplikacionit u ruajtën.");
    updateAppTitle(); 
    await showAuthView(); 
    if (state.currentUser?.isSuperAdmin) showSuperAdminPanel(); 
}

export function handleDeleteSuperAdminAppLogo(): void {
    if (!state.superAdminAppSettings || !dom.saAppLogoPreview || !dom.saAppLogoInput) return;
    showCustomConfirm("Jeni i sigurt që doni të fshini logon e aplikacionit?", async () => {
        if (state.superAdminAppSettings) state.superAdminAppSettings.mainAppLogoUrl = undefined;
        await storage.saveSuperAdminAppSettings(state.superAdminAppSettings!);
        if(dom.saAppLogoPreview) {
            dom.saAppLogoPreview.src = '#';
            dom.saAppLogoPreview.style.display = 'none';
        }
        if(dom.saAppLogoInput) dom.saAppLogoInput.value = '';
        alert("Logoja e aplikacionit u fshi.");
    });
}

export function toggleSuperAdminAppSettingsControls(enable: boolean): void {
    const elements: (HTMLInputElement | HTMLButtonElement | null)[] = [
        dom.saAppNameInput, dom.saAppLogoInput, dom.saAppAddressInput, dom.saAppNiptInput,
        dom.saAppBankNameInput, dom.saAppBankAccountInput, dom.saAppIbanInput, dom.saAppSwiftInput,
        dom.saLoginShowcaseTitlePrefixInput, dom.saLoginShowcaseSubtitleInput,
        dom.saSaveAppSettingsBtn, dom.saDeleteAppLogoBtn
    ];
    elements.forEach(el => {
        if (el) el.disabled = !enable;
    });
}
