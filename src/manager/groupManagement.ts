
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { Group, Privilege, GroupPrivilege } from '../models';
import { generateUniqueId } from '../core/utils';
import { showCustomConfirm, isAnyOtherModalOrDropdownActive } from '../core/ui';

export function initGroupManagementEventListeners(): void {
    dom.showAddGroupModalBtn?.addEventListener('click', () => openGroupFormModal());
    dom.groupForm?.addEventListener('submit', handleSaveGroup);
    dom.cancelGroupFormBtn?.addEventListener('click', closeGroupFormModal);
    dom.groupFormModalCloseBtn?.addEventListener('click', closeGroupFormModal);
}

export function showGroupManagementPanelFromManager(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for Group Management panel.");
        return;
    }
    const panel = dom.groupManagementPanel;
    if (panel) {
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        renderGroupList();
    } else {
        targetContainer.innerHTML = '<p class="error-message">Paneli i menaxhimit të grupeve nuk u gjet.</p>';
    }
}

function renderGroupList(): void {
    if (!dom.groupListTbody || !state.currentManagingBusinessId) return;
    dom.groupListTbody.innerHTML = '';

    if (state.groups.length === 0) {
        dom.groupListTbody.innerHTML = '<tr><td colspan="4" class="text-center">Nuk ka grupe të regjistruara. Shtyp "Shto Grup të Ri".</td></tr>';
        return;
    }

    state.groups.forEach(group => {
        const userCount = state.users.filter(u => u.groupId === group.id).length;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${group.name}</td>
            <td>${group.description || '-'}</td>
            <td>${userCount}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-group-id="${group.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-group-id="${group.id}" data-group-name="${group.name}">Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openGroupFormModal(group.id));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteGroup(group.id, group.name));
        dom.groupListTbody.appendChild(tr);
    });
}

function renderPrivilegesForGroupForm(container: HTMLElement, existingPrivilegeIds: string[] = []) {
    container.innerHTML = '';
    const privilegesByCategory: { [category: string]: Privilege[] } = {};

    // Group privileges by category from the state
    state.privileges.forEach(privilege => {
        if (!privilegesByCategory[privilege.category]) {
            privilegesByCategory[privilege.category] = [];
        }
        privilegesByCategory[privilege.category].push(privilege);
    });

    // Render a fieldset for each category
    const sortedCategories = Object.keys(privilegesByCategory).sort();

    sortedCategories.forEach(category => {
        const fieldset = document.createElement('fieldset');
        fieldset.className = 'permissions-group';
        const legend = document.createElement('legend');
        legend.textContent = category;
        fieldset.appendChild(legend);

        // Render checkboxes for each privilege in the category
        privilegesByCategory[category].forEach(privilege => {
            const div = document.createElement('div');
            // Assuming a simple div wrapper for checkbox+label is fine for now
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `priv-${privilege.id.replace('.', '-')}`; // Make ID valid
            checkbox.name = 'privileges';
            checkbox.value = privilege.id;
            checkbox.checked = existingPrivilegeIds.includes(privilege.id);

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = privilege.name;
            if (privilege.description) {
                label.title = privilege.description;
            }

            div.appendChild(checkbox);
            div.appendChild(label);
            fieldset.appendChild(div);
        });
        container.appendChild(fieldset);
    });
}

function openGroupFormModal(groupId?: string): void {
    if (!dom.groupFormModal || !dom.groupForm || !dom.groupFormModalTitle || !dom.editGroupIdInput ||
        !dom.groupNameInput || !dom.groupDescriptionInput || !dom.groupPrivilegesContainer || !dom.groupFormErrorElement) return;

    dom.groupForm.reset();
    dom.groupFormErrorElement.textContent = '';
    
    let existingPrivilegeIds: string[] = [];

    if (groupId) {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
            dom.groupFormModalTitle.textContent = "Modifiko Grupin";
            dom.editGroupIdInput.value = group.id;
            dom.groupNameInput.value = group.name;
            dom.groupDescriptionInput.value = group.description || '';
            
            existingPrivilegeIds = state.groupPrivileges
                .filter(gp => gp.groupId === groupId)
                .map(gp => gp.privilegeId);

        } else {
            dom.groupFormErrorElement.textContent = "Grupi nuk u gjet.";
            return;
        }
    } else {
        dom.groupFormModalTitle.textContent = "Shto Grup të Ri";
        dom.editGroupIdInput.value = '';
    }
    
    renderPrivilegesForGroupForm(dom.groupPrivilegesContainer, existingPrivilegeIds);
    
    dom.groupFormModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function closeGroupFormModal(): void {
    if (dom.groupFormModal) {
        dom.groupFormModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('groupFormModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

async function handleSaveGroup(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.groupNameInput || !dom.groupDescriptionInput || !dom.groupFormErrorElement ||
        !dom.editGroupIdInput || !state.currentManagingBusinessId || !dom.groupPrivilegesContainer) return;

    const name = dom.groupNameInput.value.trim();
    const description = dom.groupDescriptionInput.value.trim() || undefined;
    const editingGroupId = dom.editGroupIdInput.value;
    dom.groupFormErrorElement.textContent = '';

    if (!name) {
        dom.groupFormErrorElement.textContent = "Emri i grupit është i detyrueshëm.";
        return;
    }

    const existingGroupByName = state.groups.find(g => g.name.toLowerCase() === name.toLowerCase());
    if (existingGroupByName && existingGroupByName.id !== editingGroupId) {
        dom.groupFormErrorElement.textContent = "Ky emër grupi ekziston tashmë.";
        return;
    }
    
    const selectedPrivilegeIds = Array.from(dom.groupPrivilegesContainer.querySelectorAll<HTMLInputElement>('input[name="privileges"]:checked'))
        .map(cb => cb.value);

    let savedGroupId: string;

    if (editingGroupId) {
        const groupToEdit = state.groups.find(g => g.id === editingGroupId);
        if (groupToEdit) {
            groupToEdit.name = name;
            groupToEdit.description = description;
            savedGroupId = groupToEdit.id;
        } else {
            dom.groupFormErrorElement.textContent = "Grupi për modifikim nuk u gjet.";
            return;
        }
    } else {
        const newGroup: Group = {
            id: generateUniqueId('grp-'),
            businessId: state.currentManagingBusinessId,
            name: name,
            description: description,
        };
        state.groups.push(newGroup);
        savedGroupId = newGroup.id;
    }

    // Update group privileges
    // Remove old privileges for this group
    state.setGroupPrivileges(state.groupPrivileges.filter(gp => gp.groupId !== savedGroupId));
    // Add new ones
    selectedPrivilegeIds.forEach(privilegeId => {
        state.groupPrivileges.push({
            groupId: savedGroupId,
            privilegeId: privilegeId,
            businessId: state.currentManagingBusinessId!,
        });
    });

    await storage.saveGroups(state.currentManagingBusinessId, state.groups);
    await storage.saveGroupPrivileges(state.currentManagingBusinessId, state.groupPrivileges);
    closeGroupFormModal();
    renderGroupList();
}

function handleDeleteGroup(groupId: string, groupName: string): void {
    if (!state.currentManagingBusinessId) return;

    const usersInGroup = state.users.filter(u => u.groupId === groupId);
    if (usersInGroup.length > 0) {
        alert(`Grupi "${groupName}" nuk mund të fshihet sepse ka ${usersInGroup.length} përdorues të lidhur me të. Ju lutem ndryshoni grupin e këtyre përdoruesve fillimisht.`);
        return;
    }

    showCustomConfirm(`Jeni i sigurt që doni të fshini grupin "${groupName}"?`, async () => {
        if (!state.currentManagingBusinessId) return;
        state.setGroups(state.groups.filter(g => g.id !== groupId));
        state.setGroupPrivileges(state.groupPrivileges.filter(gp => gp.groupId !== groupId));
        
        await storage.saveGroups(state.currentManagingBusinessId, state.groups);
        await storage.saveGroupPrivileges(state.currentManagingBusinessId, state.groupPrivileges);
        
        renderGroupList();
        alert(`Grupi "${groupName}" u fshi me sukses.`);
    });
}
