/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function simpleHash(password: string): string {
    try {
        return btoa(password); 
    } catch (e) {
        console.error("Failed to btoa password (likely non-ASCII chars):", e);
        return "hashed_" + password.split('').reverse().join('');
    }
}

export function comparePassword(password: string, hash: string): boolean {
     try {
        return btoa(password) === hash;
    } catch (e) {
        return "hashed_" + password.split('').reverse().join('') === hash;
    }
}

export function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export function displaySelectedImage(fileInput: HTMLInputElement, previewElement: HTMLImageElement | null) {
    if (!previewElement) return;
    const file = fileInput.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                 previewElement.src = e.target.result as string;
                 previewElement.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    } else {
        previewElement.src = '#';
        previewElement.style.display = 'none';
    }
}

export function getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function generateUniqueId(prefix: string = ''): string {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}