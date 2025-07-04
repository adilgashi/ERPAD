

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as toast from '../core/toast';
// import * as config from '../core/config'; // No longer needed for static packages
import { showManagerDashboardView } from './index'; 
import * as superAdmin from '../superAdmin';
import { SubscriptionPackage } from '../models';


export function initSubscriptionEventListeners(): void {
    dom.activateNewSubscriptionBtn?.addEventListener('click', handleActivateNewSubscription);
}

export function renderSubscriptionInfoView() {
    if (!state.currentManagingBusinessId || !dom.subInfoPackageNameElement || !dom.subInfoExpiryDateElement ||
        !dom.subInfoStatusElement || !dom.expiredSubscriptionActivationForm || !dom.newSubscriptionActivationCodeInput ||
        !dom.activateNewSubscriptionBtn || !dom.subscriptionActivationErrorElement ||
        !dom.expiredSubMessageElement || !dom.expiredSubInstructionElement || !dom.activationCodeInputGroup
    ) return;

    const currentBusiness = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!currentBusiness) {
        dom.subInfoPackageNameElement.textContent = "Gabim";
        dom.subInfoExpiryDateElement.textContent = "Gabim";
        dom.subInfoStatusElement.textContent = "Gabim";
        dom.subInfoStatusElement.className = 'status-badge inactive';
        dom.expiredSubscriptionActivationForm.style.display = 'none';
        renderUpgradeOptions(null); // No current package, no upgrades
        return;
    }
    
    dom.subscriptionActivationErrorElement.textContent = ''; // Clear previous errors

    let currentPackage: SubscriptionPackage | null = null;
    if (currentBusiness.subscriptionPackageId) {
        currentPackage = state.subscriptionPackages.find(p => p.id === currentBusiness.subscriptionPackageId) || null;
    }

    // Display current package details
    const featuresListUl = document.getElementById('sub-info-features-list');
    if (featuresListUl) featuresListUl.innerHTML = ''; // Clear previous features

    if (currentPackage && currentBusiness.subscriptionEndDate) {
        const endDate = new Date(currentBusiness.subscriptionEndDate);
        const now = new Date();
        const isActiveSub = endDate > now;

        dom.subInfoPackageNameElement.textContent = currentPackage.name;
        dom.subInfoExpiryDateElement.textContent = endDate.toLocaleDateString('sq-AL');
        dom.subInfoStatusElement.textContent = isActiveSub ? "Aktiv" : "Skaduar";
        dom.subInfoStatusElement.className = `status-badge ${isActiveSub ? 'active' : 'inactive'}`;

        if (featuresListUl && currentPackage.features && currentPackage.features.length > 0) {
            currentPackage.features.forEach(feature => {
                const li = document.createElement('li');
                li.textContent = feature;
                featuresListUl.appendChild(li);
            });
        } else if (featuresListUl) {
            featuresListUl.innerHTML = '<li>Kjo paketë nuk ka veçori të specifikuara.</li>';
        }


        if (!isActiveSub) {
            dom.expiredSubscriptionActivationForm.style.display = 'block';
            dom.expiredSubMessageElement.style.display = 'block';
            dom.expiredSubInstructionElement.style.display = 'block';
            dom.activationCodeInputGroup.style.display = 'block';
            dom.activateNewSubscriptionBtn.style.display = 'inline-block';

            if (currentBusiness.futureSubscriptionActivationCode && currentBusiness.futureSubscriptionPackageId) {
                const futurePkgDetails = state.subscriptionPackages.find(p => p.id === currentBusiness.futureSubscriptionPackageId);
                dom.expiredSubInstructionElement.textContent = `Një kod abonimi i ardhshëm (${futurePkgDetails?.name || 'Paketë e Ardhshme'}) është përgatitur nga administratori. Ju lutem futni kodin e abonimit të ri për të riaktivizuar shërbimin.`;
            } else {
                 dom.expiredSubInstructionElement.textContent = `Abonimi juaj ka skaduar! Ju lutem kontaktoni administratorin për një kod të ri abonimi dhe futeni këtu për të riaktivizuar shërbimin.`;
            }
        } else {
            dom.expiredSubscriptionActivationForm.style.display = 'none';
        }
    } else {
        dom.subInfoPackageNameElement.textContent = "Nuk Ka";
        dom.subInfoExpiryDateElement.textContent = "N/A";
        dom.subInfoStatusElement.textContent = "Jo Aktiv";
        dom.subInfoStatusElement.className = 'status-badge inactive';
        if (featuresListUl) featuresListUl.innerHTML = '<li>Nuk ka paketë aktive.</li>';
        
        dom.expiredSubscriptionActivationForm.style.display = 'block';
        dom.expiredSubMessageElement.style.display = 'block';
        dom.expiredSubInstructionElement.textContent = `Biznesi nuk ka një abonim të konfiguruar. Kontaktoni administratorin për një kod abonimi dhe futeni këtu për të aktivizuar shërbimin.`;
        dom.activationCodeInputGroup.style.display = 'block';
        dom.activateNewSubscriptionBtn.style.display = 'inline-block';
    }
    renderUpgradeOptions(currentPackage);
    renderUpgradeRequestStatus(currentBusiness.upgradeRequest);
}

function renderUpgradeOptions(currentPackage: SubscriptionPackage | null) {
    const upgradeOptionsListDiv = dom.upgradeOptionsListDiv; 
    const noUpgradeOptionsMsg = dom.noUpgradeOptionsMessage; 
    
    if (!upgradeOptionsListDiv || !noUpgradeOptionsMsg) {
        console.error("Elementet DOM për opsionet e përmirësimit nuk u gjetën.");
        return;
    }

    upgradeOptionsListDiv.innerHTML = ''; 
    
    const currentBusiness = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!currentBusiness) {
        noUpgradeOptionsMsg.style.display = 'block';
        return;
    }

    const currentPrice = currentPackage ? currentPackage.price : 0;

    const availableUpgrades = state.subscriptionPackages.filter(pkg => {
        if (currentPackage && pkg.id === currentPackage.id) {
            return false; 
        }
        return pkg.price > currentPrice; 
    }).sort((a,b) => a.price - b.price); 

    if (availableUpgrades.length === 0) {
        noUpgradeOptionsMsg.style.display = 'block';
        return;
    }
    
    noUpgradeOptionsMsg.style.display = 'none';

    availableUpgrades.forEach(pkg => {
        const hasPendingRequest = !!currentBusiness.upgradeRequest;
        const isThisPackageRequested = hasPendingRequest && currentBusiness.upgradeRequest?.packageId === pkg.id;
        
        const tile = document.createElement('div');
        tile.className = 'report-tile subscription-upgrade-tile';
        
        const featuresHtml = pkg.features.map(f => `<li>${f}</li>`).join('');
        
        tile.innerHTML = `
            <div class="report-tile-icon">💎</div>
            <h3 class="report-tile-title">${pkg.name}</h3>
            <p class="package-price-duration">${pkg.price.toFixed(2)} € / ${pkg.durationYears} vit(e)</p>
            <p class="report-tile-description">
                <strong>Veçoritë e Pakos:</strong>
                <ul class="package-features-display-list">${featuresHtml || '<li>Nuk ka veçori të listuara.</li>'}</ul>
            </p>
            <p class="package-advantages">
                <strong>Përparësitë:</strong> Ky paketë ofron më shumë mundësi dhe veçori për të rritur biznesin tuaj.
            </p>
            <button class="btn ${isThisPackageRequested ? 'btn-secondary' : (hasPendingRequest ? 'btn-secondary' : 'btn-primary')} request-upgrade-btn" 
                    data-package-id="${pkg.id}" 
                    ${isThisPackageRequested || hasPendingRequest ? 'disabled' : ''}>
                ${isThisPackageRequested ? 'Kërkesa u Dërgua' : (hasPendingRequest ? 'Kërkesë Ekzistuese' : 'Kërko Ngritje Pakete')}
            </button>
        `;
        
        const requestBtn = tile.querySelector<HTMLButtonElement>('.request-upgrade-btn');
        if (requestBtn && !(isThisPackageRequested || hasPendingRequest)) {
            requestBtn.addEventListener('click', () => handleSubscriptionUpgradeRequest(pkg.id));
        }
        upgradeOptionsListDiv.appendChild(tile);
    });
}

function renderUpgradeRequestStatus(upgradeRequest?: { packageId: string; requestedAt: number; }) {
    const statusElement = dom.managerUpgradeRequestStatus; 
    if (!statusElement) return;

    if (upgradeRequest) {
        const requestedPackage = state.subscriptionPackages.find(p => p.id === upgradeRequest.packageId);
        const requestDate = new Date(upgradeRequest.requestedAt).toLocaleString('sq-AL');
        statusElement.className = 'info-message success'; // Changed to success for better visibility
        statusElement.innerHTML = `
            Ju keni kërkuar ngritje në pakon <strong>"${requestedPackage?.name || 'E Panjohur'}"</strong> më ${requestDate}.<br>
            Administratori do t'ju kontaktojë me kodin e ri të aktivizimit sapo kërkesa të procesohet.
        `;
        statusElement.style.display = 'block';
    } else {
        statusElement.style.display = 'none';
    }
}


export function handleSubscriptionUpgradeRequest(requestedPackageId: string) {
    if (!state.currentManagingBusinessId) return;
    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    const requestedPackage = state.subscriptionPackages.find(p => p.id === requestedPackageId);

    if (!business || !requestedPackage) {
        toast.showErrorToast("Gabim: Biznesi ose pakoja e kërkuar nuk u gjet.");
        return;
    }

    if (business.upgradeRequest) {
        toast.showInfoToast("Ju tashmë keni një kërkesë për përmirësim në proces. Ju lutem prisni që administratori ta trajtojë atë.");
        return;
    }

    // No confirmation needed as per refined spec, direct action.
    business.upgradeRequest = {
        packageId: requestedPackageId,
        requestedAt: Date.now()
    };
    storage.saveAllBusinesses(state.businesses);
    // No direct alert here, the UI update will show the status.
    renderSubscriptionInfoView(); // This will re-render options and show the status message.
}


export function handleActivateNewSubscription() {
    if (!state.currentManagingBusinessId || !dom.newSubscriptionActivationCodeInput || !dom.subscriptionActivationErrorElement) return;

    const activationCode = dom.newSubscriptionActivationCodeInput.value.trim();
    if (!activationCode) {
        dom.subscriptionActivationErrorElement.textContent = "Ju lutem futni kodin e aktivizimit.";
        return;
    }

    const business = state.businesses.find(b => b.id === state.currentManagingBusinessId);
    if (!business) {
        dom.subscriptionActivationErrorElement.textContent = "Biznesi nuk u gjet.";
        return;
    }

    if (business.futureSubscriptionActivationCode === activationCode && business.futureSubscriptionPackageId) {
        const futurePkg = state.subscriptionPackages.find(p => p.id === business.futureSubscriptionPackageId); 
        if (!futurePkg) {
            dom.subscriptionActivationErrorElement.textContent = "Paketa e abonimit të ardhshëm nuk u gjet. Kontaktoni administratorin.";
            return;
        }

        const now = new Date();
        const newSubscriptionEndDate = new Date(new Date(now).setFullYear(now.getFullYear() + futurePkg.durationYears)).getTime();

        business.subscriptionPackageId = business.futureSubscriptionPackageId;
        business.subscriptionActivationCode = business.futureSubscriptionActivationCode;
        business.subscriptionEndDate = newSubscriptionEndDate;

        // Clear upgradeRequest if this activation matches the requested package
        if (business.upgradeRequest?.packageId === business.futureSubscriptionPackageId) {
            business.upgradeRequest = undefined; 
        }
        
        business.futureSubscriptionActivationCode = undefined;
        business.futureSubscriptionPackageId = undefined;
        business.futureSubscriptionGeneratedAt = undefined;


        storage.saveAllBusinesses(state.businesses);
        toast.showSuccessToast(`Abonimi u aktivizua me sukses! Paketa: ${futurePkg.name}, Skadon më: ${new Date(newSubscriptionEndDate).toLocaleDateString('sq-AL')}`);
        
        dom.subscriptionActivationErrorElement.textContent = "";
        dom.newSubscriptionActivationCodeInput.value = "";
        renderSubscriptionInfoView(); 
        
        if (typeof (window as any).renderDashboardSummaryManager === 'function') {
             (window as any).renderDashboardSummaryManager();
        }

        if (state.currentUser?.isSuperAdmin && dom.superAdminContentManagingBusiness?.style.display === 'block' && state.currentManagingBusinessId) {
            superAdmin.showSuperAdminBusinessManagementView(state.currentManagingBusinessId);
        }

    } else {
        dom.subscriptionActivationErrorElement.textContent = "Kodi i aktivizimit është i pasaktë ose nuk përputhet me një abonim të ardhshëm të përgatitur.";
    }
}
