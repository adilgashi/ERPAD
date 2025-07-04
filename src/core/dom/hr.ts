/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Employee Management Panel (List View)
export const employeeManagementPanel = document.getElementById('employee-management-panel') as HTMLDivElement | null;
export const employeeListSearchInput = document.getElementById('employee-list-search-input') as HTMLInputElement | null;
export const employeeListTbody = document.getElementById('employee-list-tbody') as HTMLTableSectionElement | null;
export const showAddEmployeeModalBtn = document.getElementById('show-add-employee-modal-btn') as HTMLButtonElement | null;

// Employee Form Modal
export const employeeFormModal = document.getElementById('employee-form-modal') as HTMLDivElement | null;
export const employeeForm = document.getElementById('employee-form') as HTMLFormElement | null;
export const employeeFormModalTitle = document.getElementById('employee-form-modal-title') as HTMLHeadingElement | null;
export const editEmployeeIdInput = document.getElementById('edit-employee-id') as HTMLInputElement | null;
export const employeeSalaryInput = document.getElementById('employee-salary') as HTMLInputElement | null;
export const employeeFormSalaryStructureSection = document.getElementById('employee-salary-structure-section') as HTMLDivElement | null;
export const employeeRecurringAdditionsContainer = document.getElementById('employee-recurring-additions-container') as HTMLDivElement | null;
export const newAdditionDescInput = document.getElementById('new-addition-desc') as HTMLInputElement | null;
export const newAdditionAmountInput = document.getElementById('new-addition-amount') as HTMLInputElement | null;
export const addRecurringAdditionBtn = document.getElementById('add-recurring-addition-btn') as HTMLButtonElement | null;
export const employeeRecurringDeductionsContainer = document.getElementById('employee-recurring-deductions-container') as HTMLDivElement | null;
export const newDeductionDescInput = document.getElementById('new-deduction-desc') as HTMLInputElement | null;
export const newDeductionAmountInput = document.getElementById('new-deduction-amount') as HTMLInputElement | null;
export const addRecurringDeductionBtn = document.getElementById('add-recurring-deduction-btn') as HTMLButtonElement | null;
export const employeeFormModalCloseBtn = document.getElementById('employee-form-modal-close-btn') as HTMLButtonElement | null;
export const cancelEmployeeFormBtn = document.getElementById('cancel-employee-form-btn') as HTMLButtonElement | null;
export const saveEmployeeBtn = document.getElementById('save-employee-btn') as HTMLButtonElement | null;

// Employee Details Modal
export const employeeDetailsModal = document.getElementById('employee-details-modal') as HTMLDivElement | null;
export const employeeDetailsContent = document.getElementById('employee-details-content') as HTMLDivElement | null;
export const employeeDetailsModalTitle = document.getElementById('employee-details-modal-title') as HTMLHeadingElement | null;
export const employeeDetailsModalCloseBtn = document.getElementById('employee-details-modal-close-btn') as HTMLButtonElement | null;
export const employeeDetailsCloseActionBtn = document.getElementById('employee-details-close-action-btn') as HTMLButtonElement | null;

// Employee Documents
export const employeeDocumentUpload = document.getElementById('employee-document-upload') as HTMLInputElement | null;
export const uploadEmployeeDocumentBtn = document.getElementById('upload-employee-document-btn') as HTMLButtonElement | null;
export const employeeDocumentsTbody = document.getElementById('employee-documents-tbody') as HTMLTableSectionElement | null;

// Employee Position History
export const showChangePositionModalBtn = document.getElementById('show-change-position-modal-btn') as HTMLButtonElement | null;
export const employeePositionHistoryTbody = document.getElementById('employee-position-history-tbody') as HTMLTableSectionElement | null;
export const changePositionModal = document.getElementById('change-position-modal') as HTMLDivElement | null;
export const changePositionForm = document.getElementById('change-position-form') as HTMLFormElement | null;
export const changePositionModalTitle = document.getElementById('change-position-modal-title') as HTMLHeadingElement | null;
export const changePositionEmployeeIdInput = document.getElementById('change-position-employee-id') as HTMLInputElement | null;
export const changePositionNewPositionInput = document.getElementById('change-position-new-position') as HTMLInputElement | null;
export const changePositionNewDepartmentInput = document.getElementById('change-position-new-department') as HTMLInputElement | null;
export const changePositionStartDateInput = document.getElementById('change-position-start-date') as HTMLInputElement | null;
export const changePositionErrorElement = document.getElementById('change-position-error') as HTMLParagraphElement | null;
export const savePositionChangeBtn = document.getElementById('save-position-change-btn') as HTMLButtonElement | null;
export const cancelPositionChangeBtn = document.getElementById('cancel-position-change-btn') as HTMLButtonElement | null;
export const changePositionModalCloseBtn = document.getElementById('change-position-modal-close-btn') as HTMLButtonElement | null;

// --- HR Time Tracking Modals ---
export const manualTimeEntryModal = document.getElementById('manual-time-entry-modal') as HTMLDivElement | null;
export const qrCodeScannerModal = document.getElementById('qr-code-scanner-modal') as HTMLDivElement | null;

// --- HR Leave & Overtime Modals ---
export const leaveRequestFormModal = document.getElementById('leave-request-form-modal') as HTMLDivElement | null;
export const overtimeFormModal = document.getElementById('overtime-form-modal') as HTMLDivElement | null;