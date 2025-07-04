

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// --- Accounting Views ---
export const managerContentChartOfAccounts = document.getElementById('manager-content-chart_of_accounts') as HTMLDivElement | null;
export const managerContentGeneralLedger = document.getElementById('manager-content-general_ledger') as HTMLDivElement | null;
export const managerContentBalanceSheet = document.getElementById('manager-content-balance_sheet') as HTMLDivElement | null;
export const managerContentProfitAndLoss = document.getElementById('manager-content-profit_and_loss') as HTMLDivElement | null;
export const managerContentAccountingSettings = document.getElementById('manager-content-accounting_settings') as HTMLDivElement | null;
export const chartOfAccountsTbody = document.getElementById('chart-of-accounts-tbody') as HTMLTableSectionElement | null;
export const generalLedgerTbody = document.getElementById('general-ledger-tbody') as HTMLTableSectionElement | null;
export const showAddAccountModalBtn = document.getElementById('show-add-account-modal-btn') as HTMLButtonElement | null;
export const showAddJournalEntryModalBtn = document.getElementById('show-add-journal-entry-modal-btn') as HTMLButtonElement | null;

// --- Account Form Modal ---
export const accountFormModal = document.getElementById('account-form-modal') as HTMLDivElement | null;
export const accountForm = document.getElementById('account-form') as HTMLFormElement | null;
export const accountFormModalTitle = document.getElementById('account-form-modal-title') as HTMLHeadingElement | null;
export const editAccountIdInput = document.getElementById('edit-account-id') as HTMLInputElement | null;
export const accountFormNumberInput = document.getElementById('account-form-number') as HTMLInputElement | null;
export const accountFormNameInput = document.getElementById('account-form-name') as HTMLInputElement | null;
export const accountFormTypeSelect = document.getElementById('account-form-type') as HTMLSelectElement | null;
export const accountFormDescriptionTextarea = document.getElementById('account-form-description') as HTMLTextAreaElement | null;
export const accountFormIsSystemCheckbox = document.getElementById('account-form-is-system') as HTMLInputElement | null;
export const accountFormErrorElement = document.getElementById('account-form-error') as HTMLParagraphElement | null;
export const cancelAccountFormBtn = document.getElementById('cancel-account-form-btn') as HTMLButtonElement | null;
export const accountFormModalCloseBtn = document.getElementById('account-form-modal-close-btn') as HTMLButtonElement | null;

// --- Journal Entry Form Modal ---
export const journalEntryFormModal = document.getElementById('journal-entry-form-modal') as HTMLDivElement | null;
export const journalEntryForm = document.getElementById('journal-entry-form') as HTMLFormElement | null;
export const journalEntryFormModalTitle = document.getElementById('journal-entry-form-modal-title') as HTMLHeadingElement | null;
export const editJournalEntryIdInput = document.getElementById('edit-journal-entry-id') as HTMLInputElement | null;
export const journalEntryDateInput = document.getElementById('journal-entry-date') as HTMLInputElement | null;
export const journalEntryDescriptionInput = document.getElementById('journal-entry-description') as HTMLInputElement | null;
export const journalEntryLinesTbody = document.getElementById('journal-entry-lines-tbody') as HTMLTableSectionElement | null;
export const journalEntryDebitTotal = document.getElementById('journal-entry-debit-total') as HTMLTableCellElement | null;
export const journalEntryCreditTotal = document.getElementById('journal-entry-credit-total') as HTMLTableCellElement | null;
export const journalEntryBalanceStatus = document.getElementById('journal-entry-balance-status') as HTMLTableCellElement | null;
export const addJournalEntryLineBtn = document.getElementById('add-journal-entry-line-btn') as HTMLButtonElement | null;
export const saveJournalEntryBtn = document.getElementById('save-journal-entry-btn') as HTMLButtonElement | null;
export const cancelJournalEntryFormBtn = document.getElementById('cancel-journal-entry-form-btn') as HTMLButtonElement | null;
export const journalEntryFormModalCloseBtn = document.getElementById('journal-entry-form-modal-close-btn') as HTMLButtonElement | null;
export const journalEntryFormErrorElement = document.getElementById('journal-entry-form-error') as HTMLParagraphElement | null;

// --- Account Ledger ---
export const accountLedgerFiltersArea = document.getElementById('account-ledger-filters-area') as HTMLDivElement | null;
export const accountLedgerAccountSelect = document.getElementById('account-ledger-account-select') as HTMLSelectElement | null;
export const accountLedgerStartDateInput = document.getElementById('account-ledger-start-date') as HTMLInputElement | null;
export const accountLedgerEndDateInput = document.getElementById('account-ledger-end-date') as HTMLInputElement | null;
export const generateAccountLedgerBtn = document.getElementById('generate-account-ledger-btn') as HTMLButtonElement | null;
export const accountLedgerContentArea = document.getElementById('account-ledger-content-area') as HTMLDivElement | null;
export const exportAccountLedgerPdfBtn = document.getElementById('export-account-ledger-pdf-btn') as HTMLButtonElement | null;
export const printAccountLedgerBtn = document.getElementById('print-account-ledger-btn') as HTMLButtonElement | null;

// --- Period Closing ---
export const periodClosingContent = document.getElementById('period-closing-content') as HTMLDivElement | null;
export const confirmPeriodCloseBtn = document.getElementById('confirm-period-close-btn') as HTMLButtonElement | null;