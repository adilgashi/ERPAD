/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from './dom';
import * as state from './state';
import * as storage from './storage';
import { simpleHash, comparePassword } from './utils';
import { showAppView, updateAppTitle, showCustomConfirm } from './ui'; 
import { showSuperAdminPanel } from '../superAdmin';
import { User, DailyCashEntry } from '../models';

export function initAuthEventListeners(): void {
    dom.loginForm?.addEventListener('submit', handleLogin);
    dom.adminLoginShortcutBtn?.addEventListener('click', () => {
        if (dom.loginUsernameInput) dom.loginUsernameInput.value = 'admin';
        if (dom.loginPasswordInput) dom.loginPasswordInput.focus();
        handleLoginUsernameInput();
    });
    dom.loginUsernameInput?.addEventListener('input', handleLoginUsernameInput);
    dom.loginBusinessSelect?.addEventListener('change', handleLoginBusinessSelectChange);
}

async function updateLoginLogo(businessId?: string): Promise<void> {
    if (!dom.loginLogoImageElement) return;

    let logoUrlToDisplay: string | undefined = undefined;
    let altText = state.superAdminAppSettings?.mainAppName || "Logo e Aplikacionit";

    if (businessId) {
        const businessDetails = await storage.getBusinessDetails(businessId);
        if (businessDetails?.logoUrl) {
            logoUrlToDisplay = businessDetails.logoUrl;
            altText = businessDetails.name;
        }
    }

    if (!logoUrlToDisplay) {
        logoUrlToDisplay = state.superAdminAppSettings?.mainAppLogoUrl;
        altText = state.superAdminAppSettings?.mainAppName || "Logo e Aplikacionit";
    }

    if (logoUrlToDisplay) {
        dom.loginLogoImageElement.src = logoUrlToDisplay;
        dom.loginLogoImageElement.alt = altText;
        dom.loginLogoImageElement.style.display = 'block';
    } else {
        dom.loginLogoImageElement.src = '#';
        dom.loginLogoImageElement.alt = altText;
        dom.loginLogoImageElement.style.display = 'none';
    }
}

export async function showAuthView(): Promise<void> {
    if (!dom.authView || !dom.appRoot || !dom.superAdminPanelView || !dom.loginErrorElement || 
        !dom.sellerCashStatusContainer || !dom.loginBusinessGroup || !dom.loginBusinessSelect || 
        !dom.loginForm || !dom.loginLogoImageElement || !dom.openShiftsInfoContainer ||
        !dom.showcaseTitlePrefixElement || !dom.showcaseAppNameElement || !dom.showcaseSubtitleTextElement) return;

    dom.authView.style.display = 'flex';
    dom.appRoot.style.display = 'none';
    dom.superAdminPanelView.style.display = 'none';
    dom.loginErrorElement.textContent = '';
    dom.sellerCashStatusContainer.style.display = 'none';
    dom.loginForm.reset();
    
    const appSettings = state.superAdminAppSettings;
    dom.showcaseTitlePrefixElement.textContent = appSettings?.loginShowcaseTitlePrefix || "Mirë se vini në";
    dom.showcaseAppNameElement.textContent = appSettings?.mainAppName || "Arka Elektronike";
    dom.showcaseSubtitleTextElement.textContent = appSettings?.loginShowcaseSubtitle || "Zgjidhja juaj e plotë për menaxhimin e biznesit.";
    
    updateAppTitle(); 

    const activeBusinesses = state.businesses.filter(b => b.isActive);
    let businessIdForLogoUpdate: string | undefined = undefined;

    if (dom.loginUsernameInput && dom.loginUsernameInput.value === 'admin') {
        dom.loginBusinessGroup.style.display = 'none';
        dom.loginBusinessSelect.disabled = true;
        dom.loginBusinessSelect.value = '';
    } else if (activeBusinesses.length === 1) {
        dom.loginBusinessGroup.style.display = 'none';
        dom.loginBusinessSelect.innerHTML = '';
        const option = document.createElement('option');
        option.value = activeBusinesses[0].id;
        option.textContent = activeBusinesses[0].name;
        option.selected = true;
        dom.loginBusinessSelect.appendChild(option);
        dom.loginBusinessSelect.value = activeBusinesses[0].id;
        dom.loginBusinessSelect.disabled = true;
        businessIdForLogoUpdate = activeBusinesses[0].id;
    } else {
        dom.loginBusinessGroup.style.display = 'block';
        populateLoginBusinessSelect();
        businessIdForLogoUpdate = dom.loginBusinessSelect.value || undefined;
    }

    await updateLoginLogo(businessIdForLogoUpdate);

    const openShiftsContainer = dom.openShiftsInfoContainer;
    openShiftsContainer.innerHTML = ''; 
    let openShiftsFound: Array<{ businessName: string, sellerUsername: string, shift: string, date: string, openedBy: string }> = [];

    for (const business of state.businesses) {
        if (business.isActive) {
            const businessCashLog = await storage.getDailyCashLog(business.id);
            const unreconciledEntries = businessCashLog.filter(entry => !entry.isReconciled);
            unreconciledEntries.forEach(entry => {
                openShiftsFound.push({
                    businessName: business.name,
                    sellerUsername: entry.sellerUsername,
                    shift: entry.shift === 'paradite' ? 'Paradite' : 'Masdite',
                    date: new Date(entry.date + "T00:00:00").toLocaleDateString('sq-AL'),
                    openedBy: entry.openedByManagerUsername
                });
            });
        }
    }

    if (openShiftsFound.length > 0) {
        const title = document.createElement('h3');
        title.className = 'open-shifts-title';
        title.textContent = 'Informacion: Ndërrime Aktive të Hapura';
        openShiftsContainer.appendChild(title);

        const list = document.createElement('ul');
        list.className = 'open-shifts-list';
        openShiftsFound.slice(0, 5).forEach(shiftInfo => {
            const listItem = document.createElement('li');
            listItem.className = 'open-shift-item';
            listItem.innerHTML = `
                <span class="open-shift-icon" aria-hidden="true">🟢</span>
                <div class="open-shift-details">
                    <span class="open-shift-business"><strong>Biznesi:</strong> ${shiftInfo.businessName}</span>
                    <span><strong>Shitësi:</strong> ${shiftInfo.sellerUsername}</span>
                    <span><strong>Ndërrimi:</strong> ${shiftInfo.shift} (Data: ${shiftInfo.date})</span>
                    <span><small>Hapur nga: ${shiftInfo.openedBy}</small></span>
                </div>
            `;
            list.appendChild(listItem);
        });
        openShiftsContainer.appendChild(list);

        if (openShiftsFound.length > 5) {
            const moreInfo = document.createElement('p');
            moreInfo.className = 'open-shifts-more-info';
            moreInfo.textContent = `...dhe ${openShiftsFound.length - 5} ndërrime të tjera të hapura.`;
            openShiftsContainer.appendChild(moreInfo);
        }
        openShiftsContainer.style.display = 'block';
    } else {
        const noShiftsMessage = document.createElement('p');
        noShiftsMessage.className = 'open-shifts-none-message';
        noShiftsMessage.textContent = 'Nuk ka ndërrime aktive të hapura për momentin.';
        openShiftsContainer.appendChild(noShiftsMessage);
        openShiftsContainer.style.display = 'block'; 
    }
}

export async function handleLogin(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.loginForm || !dom.loginErrorElement || !dom.loginBusinessSelect || !dom.loginBusinessGroup || !dom.loginUsernameInput || !dom.loginPasswordInput) return;

    const username = dom.loginUsernameInput.value.trim();
    const password = dom.loginPasswordInput.value;
    dom.loginErrorElement.textContent = '';

    if (username === 'admin') {
        const currentAdminHash = state.superAdminPasswordHash || simpleHash('admin');
        if (comparePassword(password, currentAdminHash)) {
            const superAdminUser: User = { id: 'SUPER_ADMIN_USER', username: 'admin', passwordHash: currentAdminHash, role: 'menaxher', isSuperAdmin: true };
            state.setCurrentUser(superAdminUser);
            storage.saveCurrentUserIdToSessionStorage(superAdminUser.id);
            state.setCurrentManagingBusinessId(null);
            storage.saveCurrentManagingBusinessIdToSessionStorage(null);
            showSuperAdminPanel();
            dom.loginForm.reset();
            return;
        } else {
            dom.loginErrorElement.textContent = "Fjalëkalimi i pasaktë për Super Admin.";
            return;
        }
    }

    let selectedBusinessId = dom.loginBusinessSelect.value;
    const activeBusinesses = state.businesses.filter(b => b.isActive);

    if (activeBusinesses.length === 1 && dom.loginBusinessGroup.style.display === 'none') {
        selectedBusinessId = activeBusinesses[0].id;
    }

    if (!selectedBusinessId) {
        dom.loginErrorElement.textContent = "Ju lutem zgjidhni një biznes.";
        return;
    }
    const selectedBusinessMeta = state.businesses.find(b => b.id === selectedBusinessId);
    if (!selectedBusinessMeta || !selectedBusinessMeta.isActive) {
        dom.loginErrorElement.textContent = "Biznesi i zgjedhur nuk është aktiv ose nuk ekziston.";
        if (activeBusinesses.length === 1) {
            dom.loginBusinessGroup.style.display = 'none';
            dom.loginBusinessSelect.value = activeBusinesses[0].id;
            dom.loginBusinessSelect.disabled = true;
        } else {
            dom.loginBusinessGroup.style.display = 'block';
            populateLoginBusinessSelect();
        }
        return;
    }

    const usersForBusiness = await storage.getUsers(selectedBusinessId);
    const user = usersForBusiness.find(u => u.username === username);

    if (user) {
        if (comparePassword(password, user.passwordHash)) {
            state.setCurrentUser(user);
            state.setCurrentManagingBusinessId(selectedBusinessId);

            storage.saveCurrentUserIdToSessionStorage(user.id);
            storage.saveCurrentManagingBusinessIdToSessionStorage(selectedBusinessId);

            await storage.loadAllBusinessData(selectedBusinessId);
            
            showAppView();
            dom.loginForm.reset();
        } else {
            dom.loginErrorElement.textContent = "Emri i përdoruesit ose fjalëkalimi i pasaktë për biznesin e zgjedhur. (Fjalëkalimi nuk përputhet)";
        }
    } else {
        dom.loginErrorElement.textContent = "Emri i përdoruesit ose fjalëkalimi i pasaktë për biznesin e zgjedhur. (Përdoruesi nuk u gjet)";
    }
}

export function handleLogout(): void {
    if (state.currentUser && state.currentUser.role === 'shites' && state.currentSale.length > 0) {
        alert("Ju keni një shitje të papërfunduar. Ju lutem përfundoni shitjen ose pastroni listën përpara se të dilni.");
        return;
    }

    showCustomConfirm("Jeni i sigurt që doni të dilni?", () => {
        state.setCurrentUser(null);
        state.setCurrentManagingBusinessId(null);
        storage.saveCurrentUserIdToSessionStorage(null);
        storage.saveCurrentManagingBusinessIdToSessionStorage(null);

        storage.clearAllBusinessData();

        showAuthView();
    });
}

export function populateLoginBusinessSelect() {
    if (!dom.loginBusinessSelect) return;
    dom.loginBusinessSelect.innerHTML = '<option value="">-- Zgjidh Biznesin --</option>';

    const activeBusinesses = state.businesses.filter(b => b.isActive);

    if (activeBusinesses.length === 0) {
        const option = document.createElement('option');
        option.textContent = "Nuk ka biznese aktive të regjistruara.";
        option.disabled = true;
        dom.loginBusinessSelect.appendChild(option);
        dom.loginBusinessSelect.disabled = true;
        dom.loginBusinessSelect.value = '';
    } else {
        activeBusinesses.forEach(business => {
            const option = document.createElement('option');
            option.value = business.id;
            option.textContent = business.name;
            dom.loginBusinessSelect.appendChild(option);
        });
        dom.loginBusinessSelect.disabled = false;
        dom.loginBusinessSelect.value = '';
    }
    handleLoginBusinessSelectChange();
}

export async function handleLoginUsernameInput(): Promise<void> {
    if (!dom.loginUsernameInput || !dom.loginBusinessGroup || !dom.loginBusinessSelect) return;
    const username = dom.loginUsernameInput.value.trim();
    const activeBusinesses = state.businesses.filter(b => b.isActive);
    let businessIdForLogo: string | undefined = undefined;

    if (username === 'admin') {
        dom.loginBusinessGroup.style.display = 'none';
        dom.loginBusinessSelect.disabled = true;
        dom.loginBusinessSelect.value = '';
    } else {
        if (activeBusinesses.length === 1) {
            dom.loginBusinessGroup.style.display = 'none';
            dom.loginBusinessSelect.value = activeBusinesses[0].id;
            dom.loginBusinessSelect.disabled = true;
            businessIdForLogo = activeBusinesses[0].id;
        } else {
            dom.loginBusinessGroup.style.display = 'block';
            populateLoginBusinessSelect();
            businessIdForLogo = dom.loginBusinessSelect.value || undefined;
        }
    }
    await updateLoginLogo(businessIdForLogo); 
}

export async function handleLoginBusinessSelectChange(): Promise<void> {
    if (!dom.loginBusinessSelect) return;
    const selectedBusinessId = dom.loginBusinessSelect.value;
    await updateLoginLogo(selectedBusinessId || undefined);
}