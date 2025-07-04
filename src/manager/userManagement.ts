

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import * as toast from '../core/toast';
import { User, UserRole } from '../models';
import { generateUniqueId, simpleHash } from '../core/utils';
import { showCustomConfirm } from '../core/ui';

function getRoleDisplayName(role: string): string {
    switch (role) {
        case 'shites': return 'Shitës';
        case 'menaxher': return 'Menaxher';
        case 'kalkulant': return 'Kalkulant';
        case 'faturist': return 'Faturist';
        case 'financa': return 'Financë';
        case 'hr': return 'HR';
        default:
            const capitalized = role.charAt(0).toUpperCase() + role.slice(1);
            return capitalized;
    }
}


export function initUserManagementEventListeners(): void {
    dom.showAddUserModalBtn?.addEventListener('click', () => openUserFormModal(undefined, 'manager'));
    dom.userForm?.addEventListener('submit', handleSaveUser);
    dom.cancelUserFormBtn?.addEventListener('click', closeUserFormModal);
    if (dom.userFormModalCloseBtn) dom.userFormModalCloseBtn.addEventListener('click', closeUserFormModal);
}

export function openUserFormModal(userId?: string, context: 'manager' | 'superAdmin' = 'manager', roleToSet?: 'shites' | 'menaxher'): void {
    if (!dom.userFormModal || !dom.userForm || !dom.userFormModalTitle || !dom.editUserIdInput || 
        !dom.userFormUsernameInput || !dom.userFormPasswordInput || !dom.userFormPasswordGroup ||
        !dom.userFormPasswordHelp || !dom.userFormRoleSelect || !dom.userFormErrorElement ||
        !dom.userFormGroupSelect) return;

    state.setCurrentUserFormModalContext(context);
    dom.userForm.reset();
    dom.userFormErrorElement.textContent = '';
    dom.userFormPasswordHelp.style.display = 'none';

    // DYNAMIC ROLE POPULATION
    const allRoles: { value: UserRole; text: string }[] = [
        { value: 'shites', text: 'Shitës' },
        { value: 'kalkulant', text: 'Kalkulant' },
        { value: 'faturist', text: 'Faturist' },
        { value: 'financa', text: 'Financë' },
        { value: 'hr', text: 'HR' },
        { value: 'menaxher', text: 'Menaxher' },
    ];
    
    dom.userFormRoleSelect.innerHTML = '';
    let rolesForContext: { value: UserRole; text: string }[];
    
    if (context === 'manager') {
        rolesForContext = allRoles.filter(r => r.value !== 'menaxher');
    } else { // superAdmin context
        rolesForContext = allRoles;
    }
    
    rolesForContext.forEach(role => {
        const option = document.createElement('option');
        option.value = role.value;
        option.textContent = role.text;
        dom.userFormRoleSelect.appendChild(option);
    });
    
    // Populate group dropdown
    dom.userFormGroupSelect.innerHTML = '<option value="">-- Pa Grup --</option>';
    state.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group.id;
        option.textContent = group.name;
        dom.userFormGroupSelect!.appendChild(option);
    });

    const toggleGroupSelect = () => {
        if (!dom.userFormRoleSelect || !dom.userFormGroupSelect) return;
        const selectedRole = dom.userFormRoleSelect.value;
        if (selectedRole === 'shites') {
            dom.userFormGroupSelect.disabled = true;
            dom.userFormGroupSelect.value = ''; // Clear selection
        } else {
            dom.userFormGroupSelect.disabled = false;
        }
    };

    dom.userFormRoleSelect.removeEventListener('change', toggleGroupSelect); // Avoid duplicates
    dom.userFormRoleSelect.addEventListener('change', toggleGroupSelect);

    if (userId) {
        const user = state.users.find(u => u.id === userId);
        if (user) {
            dom.userFormModalTitle.textContent = "Modifiko Përdoruesin";
            dom.editUserIdInput.value = user.id;
            dom.userFormUsernameInput.value = user.username;
            dom.userFormPasswordGroup.style.display = 'block'; 
            dom.userFormPasswordInput.placeholder = "Lëreni bosh për të mos ndryshuar";
            dom.userFormPasswordHelp.style.display = 'block';
            
            // Check if the role of the user being edited exists in the dropdown. If not, add it and disable it.
            const userRoleExistsInDropdown = rolesForContext.some(r => r.value === user.role);
            if (!userRoleExistsInDropdown) {
                 const option = document.createElement('option');
                 option.value = user.role;
                 option.textContent = getRoleDisplayName(user.role);
                 dom.userFormRoleSelect.appendChild(option);
            }
            dom.userFormRoleSelect.value = user.role;

            if (user.groupId) {
                dom.userFormGroupSelect.value = user.groupId;
            }
            
            // ROLE SELECT DISABLED LOGIC
            if (context === 'manager') {
                if (user.role === 'menaxher' || user.id === state.currentUser?.id) {
                    dom.userFormRoleSelect.disabled = true;
                } else {
                    dom.userFormRoleSelect.disabled = false;
                }
            } else { // superAdmin
                dom.userFormRoleSelect.disabled = false;
            }

        } else {
            dom.userFormErrorElement.textContent = "Përdoruesi nuk u gjet.";
            return;
        }
    } else {
        dom.userFormModalTitle.textContent = "Shto Përdorues të Ri";
        dom.editUserIdInput.value = '';
        dom.userFormPasswordGroup.style.display = 'block';
        dom.userFormPasswordInput.placeholder = "Fjalëkalimi";
        
        // ROLE SELECT DISABLED LOGIC
        if (context === 'manager') {
            dom.userFormRoleSelect.value = 'shites'; // Default to shites
            dom.userFormRoleSelect.disabled = false;
        } else { // superAdmin
            if (roleToSet) { 
                dom.userFormRoleSelect.value = roleToSet;
                // If SA creates a manager/seller from business view, keep it disabled
                dom.userFormRoleSelect.disabled = true; 
            } else {
                 dom.userFormRoleSelect.value = 'shites';
                 dom.userFormRoleSelect.disabled = false;
            }
        }
    }

    toggleGroupSelect(); // Set initial state for the group dropdown
    
    dom.userFormModal.style.display = 'block';
}

export function closeUserFormModal(): void {
    if (dom.userFormModal && dom.userFormRoleSelect) {
        dom.userFormModal.style.display = 'none';
        dom.userFormRoleSelect.disabled = false; 
    }
}

export async function handleSaveUser(event: Event): Promise<void> {
    event.preventDefault();
    if (!dom.userFormUsernameInput || !dom.userFormPasswordInput || !dom.userFormRoleSelect ||
        !dom.userFormErrorElement || !dom.editUserIdInput || !state.currentManagingBusinessId || !dom.userFormGroupSelect) return;

    const username = dom.userFormUsernameInput.value.trim();
    const password = dom.userFormPasswordInput.value;
    const role = dom.userFormRoleSelect.value as UserRole;
    const groupId = dom.userFormGroupSelect.disabled ? undefined : (dom.userFormGroupSelect.value || undefined);
    const editingUserId = dom.editUserIdInput.value;
    dom.userFormErrorElement.textContent = '';

    if (!username) {
        dom.userFormErrorElement.textContent = "Emri i përdoruesit është i detyrueshëm.";
        return;
    }

    const existingUserByUsername = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existingUserByUsername && existingUserByUsername.id !== editingUserId) {
        dom.userFormErrorElement.textContent = "Ky emër përdoruesi ekziston tashmë.";
        return;
    }

    if (editingUserId) {
        const userToEdit = state.users.find(u => u.id === editingUserId);
        if (userToEdit) {
            userToEdit.username = username;
            if (password) { 
                userToEdit.passwordHash = simpleHash(password);
            }
            if (!dom.userFormRoleSelect.disabled) {
                 userToEdit.role = role;
            }
            userToEdit.groupId = groupId;
        }
    } else {
        if (!password) {
            dom.userFormErrorElement.textContent = "Fjalëkalimi është i detyrueshëm për përdoruesit e rinj.";
            return;
        }
        const newUser: User = {
            id: generateUniqueId('usr-'),
            businessId: state.currentManagingBusinessId,
            username: username,
            passwordHash: simpleHash(password),
            role: role,
            groupId: groupId
        };
        state.users.push(newUser);
    }

    await storage.saveUsers(state.currentManagingBusinessId, state.users);
    
    closeUserFormModal();

    if (state.currentUserFormModalContext === 'superAdmin') {
         if (typeof window !== 'undefined' && (window as any).renderSuperAdminUserLists) {
            (window as any).renderSuperAdminUserLists();
        }
    } else {
        renderUserListForManager();
    }
}

export function handleDeleteUser(userId: string, username: string): void {
    if (!state.currentManagingBusinessId) return;
    
    if (state.currentUser && state.currentUser.id === userId) {
        toast.showErrorToast("Nuk mund të fshini përdoruesin aktualisht të kyçur.");
        return;
    }
    const userToDelete = state.users.find(u => u.id === userId);
    if (userToDelete?.role === 'menaxher') {
        const otherManagers = state.users.filter(u => u.role === 'menaxher' && u.id !== userId);
        if (state.currentUserFormModalContext === 'manager' && otherManagers.length === 0) { 
            toast.showErrorToast("Nuk mund të fshini menaxherin e vetëm. Duhet të ketë të paktën një menaxher.");
            return;
        }
    }

    showCustomConfirm(`Jeni i sigurt që doni të fshini përdoruesin "${username}"?`, async () => {
        if (!state.currentManagingBusinessId) return; 
        state.setUsers(state.users.filter(u => u.id !== userId));
        await storage.saveUsers(state.currentManagingBusinessId, state.users);

        if (state.currentUserFormModalContext === 'superAdmin') {
            if (typeof window !== 'undefined' && (window as any).renderSuperAdminUserLists) {
                (window as any).renderSuperAdminUserLists();
            }
        } else {
            renderUserListForManager();
        }
        toast.showSuccessToast(`Përdoruesi "${username}" u fshi me sukses.`);
    });
}

export function renderUserListForManager(): void {
    if (!dom.userListTbody) return;
    dom.userListTbody.innerHTML = '';
    state.users.forEach(user => {
        const tr = document.createElement('tr');
        const group = user.groupId ? state.groups.find(g => g.id === user.groupId) : null;
        const groupName = group ? group.name : 'Pa Grup';
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>${getRoleDisplayName(user.role)}</td>
            <td>${groupName}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-user-id="${user.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-user-id="${user.id}" data-username="${user.username}">Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => openUserFormModal(user.id, 'manager'));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => handleDeleteUser(user.id, user.username));
        dom.userListTbody.appendChild(tr);
    });
}

export function showUserManagementPanelFromManager(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for User Management panel.");
        return;
    }
    const panel = dom.userManagementPanel;
    if (panel) {
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        renderUserListForManager();
    } else {
        targetContainer.innerHTML = '<p class="error-message">Paneli i menaxhimit të përdoruesve nuk u gjet.</p>';
    }
}