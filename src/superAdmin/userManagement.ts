
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as managerUserManagement from '../manager/userManagement'; // Import the actual logic

export function renderSuperAdminManagerList(): void {
    if (!dom.superAdminManagerListTbody || !state.currentManagingBusinessId) return;
    dom.superAdminManagerListTbody.innerHTML = '';
    const managers = state.users.filter(u => u.role === 'menaxher');
    managers.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-user-id="${user.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-user-id="${user.id}" data-username="${user.username}">Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => managerUserManagement.openUserFormModal(user.id, 'superAdmin', 'menaxher'));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => managerUserManagement.handleDeleteUser(user.id, user.username));
        dom.superAdminManagerListTbody?.appendChild(tr);
    });
}

export function renderSuperAdminSellerList(): void {
    if (!dom.superAdminSellerListTbody || !state.currentManagingBusinessId) return;
    dom.superAdminSellerListTbody.innerHTML = '';
    const sellers = state.users.filter(u => u.role === 'shites');
    sellers.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>
                <button class="btn btn-warning btn-sm" data-user-id="${user.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm" data-user-id="${user.id}" data-username="${user.username}">Fshij</button>
            </td>
        `;
        tr.querySelector<HTMLButtonElement>('.btn-warning')?.addEventListener('click', () => managerUserManagement.openUserFormModal(user.id, 'superAdmin', 'shites'));
        tr.querySelector<HTMLButtonElement>('.btn-danger')?.addEventListener('click', () => managerUserManagement.handleDeleteUser(user.id, user.username));
        dom.superAdminSellerListTbody?.appendChild(tr);
    });
}
