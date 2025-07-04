/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Toast notification types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

// Toast notification interface
interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

// Toast container state
let toasts: Toast[] = [];
let containerElement: HTMLDivElement | null = null;

/**
 * Initialize the toast container
 */
export function initToastContainer(): void {
  if (containerElement) return;
  
  containerElement = document.createElement('div');
  containerElement.className = 'toast-container';
  document.body.appendChild(containerElement);
}

/**
 * Show a toast notification
 * @param message The message to display
 * @param type The type of toast (success, error, info, warning)
 * @param duration How long to show the toast in milliseconds (default: 3000ms)
 */
export function showToast(message: string, type: ToastType = 'info', duration: number = 3000): void {
  if (!containerElement) {
    initToastContainer();
  }
  
  const id = `toast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  const toast: Toast = {
    id,
    message,
    type,
    duration
  };
  
  toasts.push(toast);
  renderToast(toast);
  
  // Auto-remove after duration
  setTimeout(() => {
    removeToast(id);
  }, duration);
}

/**
 * Render a toast notification
 * @param toast The toast to render
 */
function renderToast(toast: Toast): void {
  if (!containerElement) return;
  
  const toastElement = document.createElement('div');
  toastElement.className = `toast-notification toast-${toast.type}`;
  toastElement.id = toast.id;
  toastElement.setAttribute('role', 'alert');
  
  // Add icon based on type
  let icon = '';
  switch (toast.type) {
    case 'success':
      icon = '✅';
      break;
    case 'error':
      icon = '❌';
      break;
    case 'warning':
      icon = '⚠️';
      break;
    case 'info':
    default:
      icon = 'ℹ️';
      break;
  }
  
  toastElement.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-message">${toast.message}</div>
    <button class="toast-close" aria-label="Close notification">×</button>
  `;
  
  // Add close button functionality
  const closeButton = toastElement.querySelector('.toast-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      removeToast(toast.id);
    });
  }
  
  // Add animation classes
  toastElement.classList.add('toast-enter');
  
  // Append to container
  containerElement.appendChild(toastElement);
  
  // Trigger animation
  setTimeout(() => {
    toastElement.classList.remove('toast-enter');
  }, 10);
}

/**
 * Remove a toast notification
 * @param id The ID of the toast to remove
 */
function removeToast(id: string): void {
  if (!containerElement) return;
  
  const toastElement = document.getElementById(id);
  if (!toastElement) return;
  
  // Add exit animation
  toastElement.classList.add('toast-exit');
  
  // Remove from DOM after animation
  setTimeout(() => {
    if (toastElement.parentNode === containerElement) {
      containerElement.removeChild(toastElement);
    }
    
    // Remove from state
    toasts = toasts.filter(t => t.id !== id);
  }, 300); // Match the CSS animation duration
}

// Shorthand functions for different toast types
export function showSuccessToast(message: string, duration: number = 3000): void {
  showToast(message, 'success', duration);
}

export function showErrorToast(message: string, duration: number = 4000): void {
  showToast(message, 'error', duration);
}

export function showInfoToast(message: string, duration: number = 3000): void {
  showToast(message, 'info', duration);
}

export function showWarningToast(message: string, duration: number = 3500): void {
  showToast(message, 'warning', duration);
}