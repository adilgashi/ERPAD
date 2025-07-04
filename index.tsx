/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initApp } from './src/app';

document.addEventListener('DOMContentLoaded', () => {
  initApp().catch(err => {
    console.error("Failed to initialize application:", err);
    // Optionally, display a user-friendly error message on the page
    const body = document.querySelector('body');
    if (body) {
        body.innerHTML = `<div style="text-align: center; padding: 50px; font-family: sans-serif; color: #555;">
            <h1>Gabim në Ngarkimin e Aplikacionit</h1>
            <p>Pati një problem gjatë nisjes së aplikacionit. Ju lutemi provoni të rifreskoni faqen.</p>
            <p>Nëse problemi vazhdon, ju lutem kontaktoni mbështetjen teknike.</p>
            <pre style="margin-top: 20px; padding: 10px; background-color: #f0f0f0; border-radius: 5px; text-align: left; white-space: pre-wrap; word-wrap: break-word;">${err.message}</pre>
        </div>`;
    }
  });
});
