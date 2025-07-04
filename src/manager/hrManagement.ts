/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as dom from '../core/dom';
import * as state from '../core/state';
import * as storage from '../core/storage';
import { Employee, Document, PositionHistoryEntry, TimeLog, LeaveRequest, Overtime } from '../models';
import { generateUniqueId, readFileAsDataURL, getTodayDateString } from '../core/utils';
import { showCustomConfirm, isAnyOtherModalOrDropdownActive } from '../core/ui';

let currentEditingEmployeeId: string | null = null;

export function initEmployeeManagementEventListeners(): void {
    document.getElementById('show-add-employee-modal-btn')?.addEventListener('click', () => openEmployeeFormModal());
    document.getElementById('employee-form')?.addEventListener('submit', handleSaveEmployee);
    document.getElementById('cancel-employee-form-btn')?.addEventListener('click', closeEmployeeFormModal);
    document.getElementById('employee-form-modal-close-btn')?.addEventListener('click', closeEmployeeFormModal);
    
    document.getElementById('employee-details-modal-close-btn')?.addEventListener('click', closeEmployeeDetailsModal);
    document.getElementById('employee-details-close-action-btn')?.addEventListener('click', closeEmployeeDetailsModal);
    
    const searchInput = document.getElementById('employee-list-search-input');
    searchInput?.addEventListener('input', renderEmployeeList);

    // New Listeners for Documents and Position History
    dom.uploadEmployeeDocumentBtn?.addEventListener('click', handleUploadEmployeeDocument);
    dom.showChangePositionModalBtn?.addEventListener('click', openChangePositionModal);
    dom.changePositionForm?.addEventListener('submit', handleSavePositionChange);
    dom.cancelPositionChangeBtn?.addEventListener('click', closeChangePositionModal);
    dom.changePositionModalCloseBtn?.addEventListener('click', closeChangePositionModal);
}

export function showEmployeeManagementPanel(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) {
        console.error("Target container not provided for HR Management panel.");
        return;
    }
    const panel = dom.employeeManagementPanel;
    if (panel) {
        if (!targetContainer.contains(panel)) {
            targetContainer.appendChild(panel);
        }
        panel.style.display = 'block';
        renderEmployeeList();
    } else {
        targetContainer.innerHTML = '<p class="error-message">Paneli i menaxhimit të punonjësve nuk u gjet.</p>';
    }
}

export function renderEmployeeList(): void {
    const tbody = document.getElementById('employee-list-tbody') as HTMLTableSectionElement | null;
    const searchInput = document.getElementById('employee-list-search-input') as HTMLInputElement | null;
    if (!tbody || !state.currentManagingBusinessId) return;

    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    tbody.innerHTML = '';
    
    let filteredEmployees = state.employees;
    if (searchTerm) {
        filteredEmployees = state.employees.filter(emp => 
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm) ||
            emp.position.toLowerCase().includes(searchTerm) ||
            emp.department.toLowerCase().includes(searchTerm)
        );
    }
    
    if (filteredEmployees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">${searchTerm ? 'Asnjë punonjës nuk përputhet me kërkimin.' : 'Nuk ka punonjës të regjistruar.'}</td></tr>`;
        return;
    }

    filteredEmployees.forEach(employee => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${employee.firstName} ${employee.lastName}</td>
            <td>${employee.position}</td>
            <td>${employee.department || '-'}</td>
            <td>${employee.phone}</td>
            <td><span class="status-badge ${employee.status === 'Aktiv' ? 'active' : 'inactive'}">${employee.status}</span></td>
            <td>
                <button class="btn btn-info btn-sm view-employee-btn" data-employee-id="${employee.id}">Detajet</button>
                <button class="btn btn-warning btn-sm edit-employee-btn" data-employee-id="${employee.id}">Modifiko</button>
                <button class="btn btn-danger btn-sm delete-employee-btn" data-employee-id="${employee.id}" data-employee-name="${employee.firstName} ${employee.lastName}">Fshij</button>
            </td>
        `;
        tr.querySelector('.view-employee-btn')?.addEventListener('click', () => openEmployeeDetailsModal(employee.id));
        tr.querySelector('.edit-employee-btn')?.addEventListener('click', () => openEmployeeFormModal(employee.id));
        tr.querySelector('.delete-employee-btn')?.addEventListener('click', () => handleDeleteEmployee(employee.id, `${employee.firstName} ${employee.lastName}`));
        tbody.appendChild(tr);
    });
}

export function openEmployeeFormModal(employeeId?: string): void {
    const modal = document.getElementById('employee-form-modal') as HTMLDivElement | null;
    const form = document.getElementById('employee-form') as HTMLFormElement | null;
    const title = document.getElementById('employee-form-modal-title') as HTMLHeadingElement | null;
    const errorEl = document.getElementById('employee-form-error') as HTMLParagraphElement | null;
    if (!modal || !form || !title || !errorEl) return;

    form.reset();
    errorEl.textContent = '';
    currentEditingEmployeeId = employeeId || null;

    const linkedUserSelect = document.getElementById('employee-linked-user') as HTMLSelectElement | null;
    if (linkedUserSelect) {
        linkedUserSelect.innerHTML = '<option value="">-- Asnjë --</option>';
        state.users.forEach(user => {
            const isLinked = state.employees.some(emp => emp.userId === user.id && emp.id !== currentEditingEmployeeId);
            if (!isLinked) {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.username} (${user.role})`;
                linkedUserSelect.appendChild(option);
            }
        });
    }

    if (employeeId) {
        title.textContent = "Modifiko Punonjësin";
        const employee = state.employees.find(emp => emp.id === employeeId);
        if (employee) {
            (document.getElementById('edit-employee-id') as HTMLInputElement).value = employee.id;
            (document.getElementById('employee-first-name') as HTMLInputElement).value = employee.firstName;
            (document.getElementById('employee-last-name') as HTMLInputElement).value = employee.lastName;
            (document.getElementById('employee-personal-id') as HTMLInputElement).value = employee.personalIdNumber;
            (document.getElementById('employee-dob') as HTMLInputElement).value = employee.dateOfBirth;
            (document.getElementById('employee-gender') as HTMLSelectElement).value = employee.gender;
            (document.getElementById('employee-address') as HTMLInputElement).value = employee.address;
            (document.getElementById('employee-city') as HTMLInputElement).value = employee.city;
            (document.getElementById('employee-phone') as HTMLInputElement).value = employee.phone;
            (document.getElementById('employee-email') as HTMLInputElement).value = employee.email;
            (document.getElementById('employee-position') as HTMLInputElement).value = employee.position;
            (document.getElementById('employee-department') as HTMLInputElement).value = employee.department;
            (document.getElementById('employee-date-of-hire') as HTMLInputElement).value = employee.dateOfHire;
            (document.getElementById('employee-contract-type') as HTMLSelectElement).value = employee.contractType;
            (document.getElementById('employee-salary') as HTMLInputElement).value = employee.salary.toString();
            (document.getElementById('employee-status') as HTMLSelectElement).value = employee.status;
            if (employee.userId) (document.getElementById('employee-linked-user') as HTMLSelectElement).value = employee.userId;

            renderDocumentsList();
            renderPositionHistoryList();
        }
    } else {
        title.textContent = "Shto Punonjës të Ri";
        (document.getElementById('edit-employee-id') as HTMLInputElement).value = '';
        renderDocumentsList(); // Renders an empty list
        renderPositionHistoryList(); // Renders an empty list
    }
    modal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

export function closeEmployeeFormModal(): void {
    const modal = document.getElementById('employee-form-modal') as HTMLDivElement | null;
    if (modal) {
        modal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('employeeFormModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

export function handleSaveEmployee(event: Event): void {
    event.preventDefault();
    const errorEl = document.getElementById('employee-form-error') as HTMLParagraphElement | null;
    if (!errorEl || !state.currentManagingBusinessId) return;

    try {
        const employeeFormValues = {
            firstName: (document.getElementById('employee-first-name') as HTMLInputElement).value,
            lastName: (document.getElementById('employee-last-name') as HTMLInputElement).value,
            personalIdNumber: (document.getElementById('employee-personal-id') as HTMLInputElement).value,
            dateOfBirth: (document.getElementById('employee-dob') as HTMLInputElement).value,
            gender: (document.getElementById('employee-gender') as HTMLSelectElement).value as 'Mashkull' | 'Femer',
            address: (document.getElementById('employee-address') as HTMLInputElement).value,
            city: (document.getElementById('employee-city') as HTMLInputElement).value,
            phone: (document.getElementById('employee-phone') as HTMLInputElement).value,
            email: (document.getElementById('employee-email') as HTMLInputElement).value,
            position: (document.getElementById('employee-position') as HTMLInputElement).value,
            department: (document.getElementById('employee-department') as HTMLInputElement).value,
            dateOfHire: (document.getElementById('employee-date-of-hire') as HTMLInputElement).value,
            contractType: (document.getElementById('employee-contract-type') as HTMLSelectElement).value as any,
            salary: parseFloat((document.getElementById('employee-salary') as HTMLInputElement).value),
            status: (document.getElementById('employee-status') as HTMLSelectElement).value as any,
            userId: (document.getElementById('employee-linked-user') as HTMLSelectElement).value || undefined,
        };
        
        if (!employeeFormValues.firstName || !employeeFormValues.lastName || !employeeFormValues.personalIdNumber || !employeeFormValues.dateOfBirth || !employeeFormValues.position || !employeeFormValues.dateOfHire) {
             throw new Error("Ju lutem plotësoni fushat e kërkuara: Emër, Mbiemër, Nr. Personal, Datëlindje, Pozicion, Data e Punësimit.");
        }
        
        if(currentEditingEmployeeId) {
            const index = state.employees.findIndex(e => e.id === currentEditingEmployeeId);
            if (index > -1) {
                state.employees[index] = { ...state.employees[index], ...employeeFormValues };
            }
        } else {
            const newEmployee: Employee = {
                id: generateUniqueId('emp-'),
                businessId: state.currentManagingBusinessId,
                ...employeeFormValues,
                documents: [],
                positionHistory: [{
                    position: employeeFormValues.position,
                    department: employeeFormValues.department,
                    startDate: employeeFormValues.dateOfHire,
                    endDate: null
                }]
            };
            state.employees.push(newEmployee);
        }
        
        storage.saveEmployees(state.currentManagingBusinessId, state.employees);
        renderEmployeeList();
        closeEmployeeFormModal();
        
    } catch(err: any) {
        errorEl.textContent = err.message;
    }
}

export function handleDeleteEmployee(employeeId: string, employeeName: string): void {
    showCustomConfirm(`Jeni i sigurt që doni të fshini punonjësin "${employeeName}"?`, () => {
        if (!state.currentManagingBusinessId) return;
        state.setEmployees(state.employees.filter(emp => emp.id !== employeeId));
        storage.saveEmployees(state.currentManagingBusinessId, state.employees);
        renderEmployeeList();
        alert(`Punonjësi "${employeeName}" u fshi.`);
    });
}

export function openEmployeeDetailsModal(employeeId: string): void {
    const modal = document.getElementById('employee-details-modal') as HTMLDivElement | null;
    const contentDiv = document.getElementById('employee-details-content') as HTMLDivElement | null;
    const titleEl = document.getElementById('employee-details-modal-title') as HTMLHeadingElement | null;
    if (!modal || !contentDiv || !titleEl) return;
    
    const employee = state.employees.find(emp => emp.id === employeeId);
    if (!employee) {
        contentDiv.innerHTML = '<p class="error-message">Punonjësi nuk u gjet.</p>';
        return;
    }

    const linkedUser = employee.userId ? state.users.find(u => u.id === employee.userId) : null;
    titleEl.textContent = `Detajet e Punonjësit: ${employee.firstName} ${employee.lastName}`;
    
    let documentsHtml = '<h3>Dokumentet Personale</h3><p>Nuk ka dokumente.</p>';
    if (employee.documents && employee.documents.length > 0) {
        documentsHtml = `<h3>Dokumentet Personale</h3><div class="table-responsive" style="max-height: 200px;"><table class="admin-table"><thead><tr><th>Emri</th><th>Lloji</th><th>Data</th><th>Veprime</th></tr></thead><tbody>`;
        employee.documents.forEach(doc => {
            documentsHtml += `<tr><td><a href="${doc.fileDataUrl}" target="_blank" rel="noopener noreferrer">${doc.fileName}</a></td><td>${doc.fileType}</td><td>${new Date(doc.uploadedAt).toLocaleDateString('sq-AL')}</td><td><a href="${doc.fileDataUrl}" download="${doc.fileName}" class="btn btn-sm btn-info">Shkarko</a></td></tr>`;
        });
        documentsHtml += '</tbody></table></div>';
    }

    let historyHtml = '<h3>Historiku i Pozicioneve</h3><p>Nuk ka historik.</p>';
    if (employee.positionHistory && employee.positionHistory.length > 0) {
        historyHtml = `<h3>Historiku i Pozicioneve</h3><div class="table-responsive" style="max-height: 200px;"><table class="admin-table"><thead><tr><th>Pozicioni</th><th>Departamenti</th><th>Data Fillimit</th><th>Data Mbarimit</th></tr></thead><tbody>`;
        employee.positionHistory.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()).forEach(h => {
            historyHtml += `
                <tr>
                    <td>${h.position}</td>
                    <td>${h.department}</td>
                    <td>${new Date(h.startDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
                    <td>${h.endDate ? new Date(h.endDate + 'T00:00:00').toLocaleDateString('sq-AL') : 'Aktual'}</td>
                </tr>
            `;
        });
        historyHtml += '</tbody></table></div>';
    }

    contentDiv.innerHTML = `
        <div class="employee-details-grid">
            <div><strong>Emri i Plotë:</strong> ${employee.firstName} ${employee.lastName}</div>
            <div><strong>Nr. Personal:</strong> ${employee.personalIdNumber}</div>
            <div><strong>Datëlindja:</strong> ${new Date(employee.dateOfBirth + 'T00:00:00').toLocaleDateString('sq-AL')}</div>
            <div><strong>Gjinia:</strong> ${employee.gender}</div>
            <div><strong>Adresa:</strong> ${employee.address}, ${employee.city}</div>
            <div><strong>Telefoni:</strong> ${employee.phone}</div>
            <div><strong>Email:</strong> ${employee.email}</div>
            <div><strong>Statusi:</strong> <span class="status-badge ${employee.status === 'Aktiv' ? 'active' : 'inactive'}">${employee.status}</span></div>
            <div class="details-separator"></div>
            <div><strong>Pozicioni:</strong> ${employee.position}</div>
            <div><strong>Departamenti:</strong> ${employee.department}</div>
            <div><strong>Data e Punësimit:</strong> ${new Date(employee.dateOfHire + 'T00:00:00').toLocaleDateString('sq-AL')}</div>
            <div><strong>Lloji i Kontratës:</strong> ${employee.contractType}</div>
            <div><strong>Paga Bruto:</strong> ${employee.salary.toFixed(2)} €</div>
            <div><strong>Përdorues i Lidhur:</strong> ${linkedUser ? `${linkedUser.username} (${linkedUser.role})` : 'Asnjë'}</div>
        </div>
        <hr>
        ${historyHtml}
        <hr>
        ${documentsHtml}
    `;

    modal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function closeEmployeeDetailsModal(): void {
    if (dom.employeeDetailsModal) {
        dom.employeeDetailsModal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('employeeDetailsModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

function renderDocumentsList(): void {
    const tbody = dom.employeeDocumentsTbody;
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (!currentEditingEmployeeId) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Shtoni një punonjës për të menaxhuar dokumentet.</td></tr>';
        return;
    }

    const employee = state.employees.find(emp => emp.id === currentEditingEmployeeId);
    if (!employee || !employee.documents || employee.documents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nuk ka dokumente të ngarkuara.</td></tr>';
        return;
    }

    employee.documents.forEach(doc => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><a href="${doc.fileDataUrl}" target="_blank" rel="noopener noreferrer">${doc.fileName}</a></td>
            <td>${doc.fileType}</td>
            <td>${new Date(doc.uploadedAt).toLocaleDateString('sq-AL')}</td>
            <td>
                <button class="btn btn-danger btn-sm delete-document-btn" data-document-id="${doc.id}">Fshij</button>
            </td>
        `;
        tr.querySelector('.delete-document-btn')?.addEventListener('click', (e) => {
            const docId = (e.target as HTMLElement).dataset.documentId;
            if (docId) handleDeleteDocument(employee.id, docId);
        });
        tbody.appendChild(tr);
    });
}

function handleDeleteDocument(employeeId: string, documentId: string): void {
    showCustomConfirm("Jeni i sigurt që doni të fshini këtë dokument?", () => {
        if (!state.currentManagingBusinessId) return;
        const employeeIndex = state.employees.findIndex(emp => emp.id === employeeId);
        if (employeeIndex > -1) {
            const employee = state.employees[employeeIndex];
            employee.documents = employee.documents.filter(doc => doc.id !== documentId);
            storage.saveEmployees(state.currentManagingBusinessId, state.employees);
            renderDocumentsList();
        }
    });
}

async function handleUploadEmployeeDocument(): Promise<void> {
    if (!currentEditingEmployeeId || !dom.employeeDocumentUpload) return;

    const file = dom.employeeDocumentUpload.files?.[0];
    if (!file) {
        alert("Ju lutem zgjidhni një skedar për të ngarkuar.");
        return;
    }

    const employeeIndex = state.employees.findIndex(emp => emp.id === currentEditingEmployeeId);
    if (employeeIndex === -1) {
        alert("Punonjësi nuk u gjet.");
        return;
    }

    try {
        const fileDataUrl = await readFileAsDataURL(file);
        const newDocument: Document = {
            id: generateUniqueId('doc-'),
            fileName: file.name,
            fileType: file.type,
            fileDataUrl: fileDataUrl,
            uploadedAt: Date.now()
        };

        state.employees[employeeIndex].documents.push(newDocument);
        await storage.saveEmployees(state.currentManagingBusinessId!, state.employees);
        renderDocumentsList();
        dom.employeeDocumentUpload.value = ''; // Reset file input
        alert("Dokumenti u ngarkua me sukses.");
    } catch (error) {
        alert("Gabim gjatë leximit të skedarit.");
        console.error(error);
    }
}

function renderPositionHistoryList(): void {
    const tbody = dom.employeePositionHistoryTbody;
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!currentEditingEmployeeId) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Shtoni një punonjës për të parë historikun.</td></tr>';
        return;
    }
    
    const employee = state.employees.find(emp => emp.id === currentEditingEmployeeId);
    if (!employee || !employee.positionHistory || employee.positionHistory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nuk ka historik pozicionesh.</td></tr>';
        return;
    }

    const sortedHistory = [...employee.positionHistory].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    sortedHistory.forEach(h => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${h.position}</td>
            <td>${h.department}</td>
            <td>${new Date(h.startDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${h.endDate ? new Date(h.endDate + 'T00:00:00').toLocaleDateString('sq-AL') : 'Aktual'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function openChangePositionModal(): void {
    if (!currentEditingEmployeeId || !dom.changePositionModal || !dom.changePositionForm || !dom.changePositionModalTitle || !dom.changePositionEmployeeIdInput) return;

    const employee = state.employees.find(emp => emp.id === currentEditingEmployeeId);
    if (!employee) {
        alert("Punonjësi nuk u gjet.");
        return;
    }

    dom.changePositionForm.reset();
    if (dom.changePositionErrorElement) dom.changePositionErrorElement.textContent = '';
    
    dom.changePositionModalTitle.textContent = `Ndrysho Pozicionin për: ${employee.firstName} ${employee.lastName}`;
    dom.changePositionEmployeeIdInput.value = employee.id;
    if (dom.changePositionStartDateInput) dom.changePositionStartDateInput.value = getTodayDateString();

    dom.changePositionModal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
}

function closeChangePositionModal(): void {
    if (dom.changePositionModal) {
        dom.changePositionModal.style.display = 'none';
        if (dom.changePositionForm) dom.changePositionForm.reset();
        if (dom.changePositionErrorElement) dom.changePositionErrorElement.textContent = '';
        if (!isAnyOtherModalOrDropdownActive('changePositionModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

function handleSavePositionChange(event: Event): void {
    event.preventDefault();
    if (!dom.changePositionEmployeeIdInput || !dom.changePositionNewPositionInput || !dom.changePositionNewDepartmentInput || !dom.changePositionStartDateInput || !dom.changePositionErrorElement || !state.currentManagingBusinessId) return;

    const employeeId = dom.changePositionEmployeeIdInput.value;
    const newPosition = dom.changePositionNewPositionInput.value.trim();
    const newDepartment = dom.changePositionNewDepartmentInput.value.trim();
    const startDate = dom.changePositionStartDateInput.value;

    if (!newPosition || !startDate) {
        dom.changePositionErrorElement.textContent = "Pozicioni i ri dhe data e fillimit janë të detyrueshme.";
        return;
    }

    const employeeIndex = state.employees.findIndex(emp => emp.id === employeeId);
    if (employeeIndex === -1) {
        dom.changePositionErrorElement.textContent = "Punonjësi nuk u gjet.";
        return;
    }

    const employee = state.employees[employeeIndex];

    const currentPosition = employee.positionHistory.find(h => h.endDate === null);
    if (currentPosition) {
        const newStartDate = new Date(startDate);
        const currentStartDate = new Date(currentPosition.startDate);
        if (newStartDate <= currentStartDate) {
            dom.changePositionErrorElement.textContent = "Data e fillimit të pozicionit të ri nuk mund të jetë para ose e njëjtë me datën e fillimit të pozicionit aktual.";
            return;
        }
        const newEndDate = new Date(startDate);
        newEndDate.setDate(newEndDate.getDate() - 1);
        currentPosition.endDate = newEndDate.toISOString().split('T')[0];
    }

    employee.positionHistory.push({
        position: newPosition,
        department: newDepartment,
        startDate: startDate,
        endDate: null
    });

    employee.position = newPosition;
    employee.department = newDepartment;

    storage.saveEmployees(state.currentManagingBusinessId, state.employees);
    
    renderPositionHistoryList();
    renderEmployeeList(); 
    if (dom.employeeDetailsModal?.style.display === 'block') {
         openEmployeeDetailsModal(employee.id);
    }

    closeChangePositionModal();
}

// --- HR Schedule Management ---
export function showScheduleManagementView(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) return;

    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Menaxhimi i Orarit të Punës</h2>
        <div class="table-responsive">
            <table class="admin-table" id="schedule-table">
                <thead>
                    <tr>
                        <th>Punonjësi</th>
                        <th>E Hënë</th>
                        <th>E Martë</th>
                        <th>E Mërkurë</th>
                        <th>E Enjte</th>
                        <th>E Premte</th>
                        <th>E Shtunë</th>
                        <th>E Diel</th>
                    </tr>
                </thead>
                <tbody id="schedule-table-body"></tbody>
            </table>
        </div>
        <div class="form-actions-group" style="margin-top: 1.5rem;">
            <button id="save-schedule-changes-btn" class="btn btn-primary">Ruaj Ndryshimet e Orarit</button>
        </div>
    `;

    const tbody = document.getElementById('schedule-table-body') as HTMLTableSectionElement;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    if (state.employees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">Nuk ka punonjës të regjistruar për të menaxhuar orarin.</td></tr>`;
    } else {
        state.employees.forEach(employee => {
            const tr = document.createElement('tr');
            tr.dataset.employeeId = employee.id;
            let cellsHtml = `<td>${employee.firstName} ${employee.lastName}</td>`;
            days.forEach(day => {
                const scheduleText = employee.schedule?.[day] || '';
                cellsHtml += `<td><input type="text" class="form-control form-control-sm" data-day="${day}" value="${scheduleText}" placeholder="p.sh., 09-17"></td>`;
            });
            tr.innerHTML = cellsHtml;
            tbody.appendChild(tr);
        });
    }

    document.getElementById('save-schedule-changes-btn')?.addEventListener('click', () => {
        if (!state.currentManagingBusinessId) return;
        const rows = tbody.querySelectorAll<HTMLTableRowElement>('tr[data-employee-id]');
        rows.forEach(row => {
            const employeeId = row.dataset.employeeId;
            const employee = state.employees.find(e => e.id === employeeId);
            if (!employee) return;
            
            if (!employee.schedule) employee.schedule = {};

            const inputs = row.querySelectorAll<HTMLInputElement>('input[data-day]');
            inputs.forEach(input => {
                const day = input.dataset.day!;
                employee.schedule![day] = input.value.trim();
            });
        });
        storage.saveEmployees(state.currentManagingBusinessId, state.employees);
        showCustomConfirm("Orari u ruajt me sukses.", () => {});
    });
}

// --- HR Time Tracking ---
export function showTimeTrackingView(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) return;
    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Regjistrimi i Hyrjes/Daljes</h2>
        <div class="actions-grid-container" style="margin-bottom: 1.5rem;">
             <button id="open-manual-time-entry-btn" class="btn btn-primary action-grid-button">
                <span class="icon">✍️</span> Regjistro Manualisht
            </button>
             <button id="open-qr-scanner-btn" class="btn btn-info action-grid-button">
                <span class="icon">📱</span> Skano Kodin QR
            </button>
        </div>
        <h3 class="section-subtitle">Regjistrimet e Fundit</h3>
        <div class="table-responsive">
            <table class="admin-table" id="time-log-table">
                <thead>
                    <tr>
                        <th>Punonjësi</th>
                        <th>Data & Ora</th>
                        <th>Lloji</th>
                        <th>Metoda</th>
                        <th>Shënime</th>
                    </tr>
                </thead>
                <tbody id="time-log-tbody"></tbody>
            </table>
        </div>
    `;

    renderTimeLogTable();

    document.getElementById('open-manual-time-entry-btn')?.addEventListener('click', openManualTimeEntryModal);
    document.getElementById('open-qr-scanner-btn')?.addEventListener('click', openQrScannerModal);
}

// --- HR Leave & Overtime ---
export function showLeaveOvertimeView(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) return;
    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Pushimet & Orët Shtesë</h2>
        <div class="tab-navigation-container">
            <button class="tab-button active" data-tab-target="#leave-requests-tab">Kërkesat për Pushim</button>
            <button class="tab-button" data-tab-target="#overtime-entries-tab">Regjistrimi i Orëve Shtesë</button>
        </div>
        
        <div id="leave-requests-tab" class="tab-content active">
            <div class="admin-panel-actions" style="margin-bottom: 1rem;">
                <button id="add-leave-request-btn" class="btn btn-primary">Shto Kërkesë Pushimi</button>
            </div>
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Punonjësi</th>
                            <th>Lloji i Pushimit</th>
                            <th>Data Fillimit</th>
                            <th>Data Mbarimit</th>
                            <th>Statusi</th>
                            <th>Veprime</th>
                        </tr>
                    </thead>
                    <tbody id="leave-requests-tbody"></tbody>
                </table>
            </div>
        </div>
        
        <div id="overtime-entries-tab" class="tab-content">
             <div class="admin-panel-actions" style="margin-bottom: 1rem;">
                <button id="add-overtime-btn" class="btn btn-primary">Regjistro Orë Shtesë</button>
            </div>
             <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Punonjësi</th>
                            <th>Data</th>
                            <th>Orët</th>
                            <th>Arsyeja</th>
                        </tr>
                    </thead>
                    <tbody id="overtime-entries-tbody"></tbody>
                </table>
            </div>
        </div>
    `;

    renderLeaveRequestsTable();
    renderOvertimeTable();

    targetContainer.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            targetContainer.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            targetContainer.querySelectorAll('.tab-content').forEach(content => (content as HTMLElement).classList.remove('active'));
            button.classList.add('active');
            const targetId = (button as HTMLElement).dataset.tabTarget!;
            (document.querySelector(targetId) as HTMLElement).classList.add('active');
        });
    });
}


// --- HR Holidays ---
export function showHolidaysView(viewName: string, targetContainer?: HTMLElement): void {
    if (!targetContainer) return;
    const holidays = [
        { date: '01-02 Janar', name: 'Viti i Ri' },
        { date: '14 Mars', name: 'Dita e Verës' },
        { date: '22 Mars', name: 'Dita e Sulltan Novruzit' },
        { date: '31 Mars', name: 'E Diela Katolike e Pashkëve (2024)' },
        { date: '10 Prill', name: 'Dita e Bajramit të Madh (2024)' },
        { date: '01 Maj', name: 'Dita Ndërkombëtare e Punëtorëve' },
        { date: '05 Maj', name: 'E Diela Ortodokse e Pashkëve (2024)' },
        { date: '16 Qershor', name: 'Dita e Kurban Bajramit (2024)' },
        { date: '05 Shtator', name: 'Dita e Shenjtërimit të Nënë Terezës' },
        { date: '28 Nëntor', name: 'Dita e Flamurit dhe Pavarësisë' },
        { date: '29 Nëntor', name: 'Dita e Çlirimit' },
        { date: '08 Dhjetor', name: 'Dita Kombëtare e Rinisë' },
        { date: '25 Dhjetor', name: 'Krishtlindjet' }
    ];

    const holidayListHtml = holidays.map(holiday => `
        <li style="display: flex; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid #f0f0f0;">
            <span>${holiday.name}</span>
            <strong style="color: #007bff;">${holiday.date}</strong>
        </li>
    `).join('');

    targetContainer.innerHTML = `
        <h2 class="manager-section-title">Kalendari i Festave Zyrtare 2024</h2>
        <ul style="list-style: none; padding: 0; background-color: #fdfdff; border-radius: 8px; border: 1px solid #eee; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            ${holidayListHtml}
        </ul>
        <p class="info-message secondary" style="margin-top: 1rem; text-align: left;">Shënim: Datat për festat lëvizëse (Pashkët, Bajramet) janë specifike për vitin 2024.</p>
    `;
}


// --- Helper Functions for HR Views ---

function renderTimeLogTable() {
    const tbody = document.getElementById('time-log-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const sortedLogs = [...state.timeLogs].sort((a,b) => b.timestamp - a.timestamp);
    if(sortedLogs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center">Nuk ka regjistrime të hyrje/daljeve.</td></tr>`;
        return;
    }
    sortedLogs.slice(0, 50).forEach(log => { // Limit to last 50 entries for performance
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${log.employeeName}</td>
            <td>${new Date(log.timestamp).toLocaleString('sq-AL')}</td>
            <td>${log.type === 'in' ? 'Hyrje' : 'Dalje'}</td>
            <td>${log.method === 'manual' ? 'Manuale' : 'QR'}</td>
            <td>${log.notes || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function openManualTimeEntryModal() {
    const modal = document.getElementById('manual-time-entry-modal');
    const form = document.getElementById('manual-time-entry-form') as HTMLFormElement | null;
    const employeeSelect = document.getElementById('mte-employee-select') as HTMLSelectElement | null;
    if (!modal || !form || !employeeSelect) return;
    
    form.reset();
    employeeSelect.innerHTML = '<option value="">-- Zgjidh Punonjësin --</option>';
    state.employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.firstName} ${emp.lastName}`;
        employeeSelect.appendChild(option);
    });

    (document.getElementById('mte-datetime-input') as HTMLInputElement).value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    modal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');

    form.onsubmit = handleSaveManualTimeEntry;
    document.getElementById('manual-time-entry-cancel-btn')?.addEventListener('click', closeManualTimeEntryModal);
    document.getElementById('manual-time-entry-modal-close-btn')?.addEventListener('click', closeManualTimeEntryModal);
}

function closeManualTimeEntryModal() {
    const modal = document.getElementById('manual-time-entry-modal');
    if (modal) {
        modal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('manual-time-entry-modal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

function handleSaveManualTimeEntry(event: Event) {
    event.preventDefault();
    const employeeId = (document.getElementById('mte-employee-select') as HTMLSelectElement).value;
    const entryType = (document.querySelector('input[name="entryType"]:checked') as HTMLInputElement).value;
    const timestampStr = (document.getElementById('mte-datetime-input') as HTMLInputElement).value;
    const notes = (document.getElementById('mte-notes-input') as HTMLTextAreaElement).value;

    const employee = state.employees.find(e => e.id === employeeId);
    if (!employeeId || !timestampStr || !employee) { alert("Ju lutem plotësoni punonjësin dhe datën/orën."); return; }
    
    const newLog: TimeLog = { id: generateUniqueId('log-'), businessId: state.currentManagingBusinessId!, employeeId, employeeName: `${employee.firstName} ${employee.lastName}`, type: entryType as 'in' | 'out', timestamp: new Date(timestampStr).getTime(), method: 'manual', notes: notes || undefined };
    state.timeLogs.push(newLog);
    storage.saveTimeLogs(state.currentManagingBusinessId!, state.timeLogs);
    renderTimeLogTable();
    closeManualTimeEntryModal();
    showCustomConfirm("Regjistrimi u ruajt me sukses.", () => {});
}

function openQrScannerModal() {
    const modal = document.getElementById('qr-code-scanner-modal');
    if (!modal) return;
    modal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');
    document.getElementById('qr-code-scanner-modal-close-btn')?.addEventListener('click', closeQrScannerModal);
}

function closeQrScannerModal() {
     const modal = document.getElementById('qr-code-scanner-modal');
     if(modal) {
         modal.style.display = 'none';
         if (!isAnyOtherModalOrDropdownActive('qr-code-scanner-modal')) { dom.pageBlurOverlay?.classList.remove('active'); }
     }
}

function renderLeaveRequestsTable() {
    const tbody = document.getElementById('leave-requests-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    const sortedRequests = [...state.leaveRequests].sort((a,b) => b.requestedAt - a.requestedAt);
    if(sortedRequests.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">Nuk ka kërkesa për pushim.</td></tr>`;
        return;
    }
    sortedRequests.forEach(req => {
        const tr = document.createElement('tr');
        const statusBadge = `<span class="status-badge ${req.status === 'Miratuar' ? 'active' : (req.status === 'Refuzuar' ? 'inactive' : '')}">${req.status}</span>`;
        const actions = req.status === 'Në Pritje' ? `
            <button class="btn btn-success btn-sm approve-leave-btn" data-request-id="${req.id}">Mirato</button>
            <button class="btn btn-danger btn-sm reject-leave-btn" data-request-id="${req.id}">Refuzo</button>
        ` : '-';
        tr.innerHTML = `
            <td>${req.employeeName}</td>
            <td>${req.leaveType}</td>
            <td>${new Date(req.startDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${new Date(req.endDate + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td>${statusBadge}</td>
            <td>${actions}</td>
        `;
        tr.querySelector('.approve-leave-btn')?.addEventListener('click', () => handleLeaveStatusChange(req.id, 'Miratuar'));
        tr.querySelector('.reject-leave-btn')?.addEventListener('click', () => handleLeaveStatusChange(req.id, 'Refuzuar'));
        tbody.appendChild(tr);
    });
}
function renderOvertimeTable() {
    const tbody = document.getElementById('overtime-entries-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    const sortedEntries = [...state.overtimeEntries].sort((a,b) => b.recordedAt - a.recordedAt);
    if(sortedEntries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center">Nuk ka orë shtesë të regjistruara.</td></tr>`;
        return;
    }
    sortedEntries.forEach(entry => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${entry.employeeName}</td>
            <td>${new Date(entry.date + 'T00:00:00').toLocaleDateString('sq-AL')}</td>
            <td class="text-right">${entry.hours}</td>
            <td>${entry.reason}</td>
        `;
        tbody.appendChild(tr);
    });
}

function handleLeaveStatusChange(requestId: string, newStatus: 'Miratuar' | 'Refuzuar') {
    if (!state.currentManagingBusinessId) return;
    const requestIndex = state.leaveRequests.findIndex(req => req.id === requestId);
    if (requestIndex > -1) {
        state.leaveRequests[requestIndex].status = newStatus;
        storage.saveLeaveRequests(state.currentManagingBusinessId, state.leaveRequests);
        renderLeaveRequestsTable();
    }
}

export function openLeaveRequestModal() {
    const modal = document.getElementById('leave-request-form-modal') as HTMLDivElement | null;
    const form = document.getElementById('leave-request-form') as HTMLFormElement | null;
    const employeeSelect = document.getElementById('lr-employee-select') as HTMLSelectElement | null;
    if (!modal || !form || !employeeSelect) return;

    form.reset();
    employeeSelect.innerHTML = '<option value="">-- Zgjidh Punonjësin --</option>';
    state.employees.filter(e => e.status === 'Aktiv').forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.firstName} ${emp.lastName}`;
        employeeSelect.appendChild(option);
    });
    (document.getElementById('lr-start-date') as HTMLInputElement).value = getTodayDateString();
    (document.getElementById('lr-end-date') as HTMLInputElement).value = getTodayDateString();

    modal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');

    form.onsubmit = handleSaveLeaveRequest;
    document.getElementById('leave-request-cancel-btn')?.addEventListener('click', closeLeaveRequestModal);
    document.getElementById('leave-request-modal-close-btn')?.addEventListener('click', closeLeaveRequestModal);
}

function closeLeaveRequestModal() {
    const modal = document.getElementById('leave-request-form-modal') as HTMLDivElement | null;
    if (modal) {
        modal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('leaveRequestModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

function handleSaveLeaveRequest(event: Event) {
    event.preventDefault();
    const employeeId = (document.getElementById('lr-employee-select') as HTMLSelectElement).value;
    const leaveType = (document.getElementById('lr-leave-type-select') as HTMLSelectElement).value as any;
    const startDate = (document.getElementById('lr-start-date') as HTMLInputElement).value;
    const endDate = (document.getElementById('lr-end-date') as HTMLInputElement).value;
    const reason = (document.getElementById('lr-reason-textarea') as HTMLTextAreaElement).value;

    const employee = state.employees.find(e => e.id === employeeId);
    if (!employeeId || !leaveType || !startDate || !endDate || !employee) {
        alert("Ju lutem plotësoni të gjitha fushat e kërkuara.");
        return;
    }
    if (new Date(endDate) < new Date(startDate)) {
        alert("Data e mbarimit nuk mund të jetë para datës së fillimit.");
        return;
    }

    const newRequest: LeaveRequest = {
        id: generateUniqueId('leave-'),
        businessId: state.currentManagingBusinessId!,
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        leaveType,
        startDate,
        endDate,
        reason: reason || undefined,
        status: 'Në Pritje',
        requestedAt: Date.now()
    };
    state.leaveRequests.push(newRequest);
    storage.saveLeaveRequests(state.currentManagingBusinessId!, state.leaveRequests);
    renderLeaveRequestsTable();
    closeLeaveRequestModal();
    showCustomConfirm("Kërkesa për pushim u ruajt.", () => {});
}

export function openOvertimeModal() {
    const modal = document.getElementById('overtime-form-modal') as HTMLDivElement | null;
    const form = document.getElementById('overtime-form') as HTMLFormElement | null;
    const employeeSelect = document.getElementById('ot-employee-select') as HTMLSelectElement | null;
    if (!modal || !form || !employeeSelect) return;

    form.reset();
    employeeSelect.innerHTML = '<option value="">-- Zgjidh Punonjësin --</option>';
    state.employees.filter(e => e.status === 'Aktiv').forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.firstName} ${emp.lastName}`;
        employeeSelect.appendChild(option);
    });
    (document.getElementById('ot-date') as HTMLInputElement).value = getTodayDateString();

    modal.style.display = 'block';
    dom.pageBlurOverlay?.classList.add('active');

    form.onsubmit = handleSaveOvertime;
    document.getElementById('overtime-cancel-btn')?.addEventListener('click', closeOvertimeModal);
    document.getElementById('overtime-modal-close-btn')?.addEventListener('click', closeOvertimeModal);
}

function closeOvertimeModal() {
    const modal = document.getElementById('overtime-form-modal') as HTMLDivElement | null;
    if (modal) {
        modal.style.display = 'none';
        if (!isAnyOtherModalOrDropdownActive('overtimeModal')) {
            dom.pageBlurOverlay?.classList.remove('active');
        }
    }
}

function handleSaveOvertime(event: Event) {
    event.preventDefault();
    const employeeId = (document.getElementById('ot-employee-select') as HTMLSelectElement).value;
    const date = (document.getElementById('ot-date') as HTMLInputElement).value;
    const hours = parseFloat((document.getElementById('ot-hours') as HTMLInputElement).value);
    const reason = (document.getElementById('ot-reason-textarea') as HTMLInputElement).value;

    const employee = state.employees.find(e => e.id === employeeId);
    if (!employeeId || !date || isNaN(hours) || hours <= 0 || !reason || !employee) {
        alert("Ju lutem plotësoni saktë të gjitha fushat.");
        return;
    }
    
    const newEntry: Overtime = {
        id: generateUniqueId('ot-'),
        businessId: state.currentManagingBusinessId!,
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        date,
        hours,
        reason,
        status: 'E Miratuar', // Assuming direct approval for now
        recordedAt: Date.now()
    };
    state.overtimeEntries.push(newEntry);
    storage.saveOvertimeEntries(state.currentManagingBusinessId!, state.overtimeEntries);
    renderOvertimeTable();
    closeOvertimeModal();
    showCustomConfirm("Orët shtesë u regjistruan me sukses.", () => {});
}