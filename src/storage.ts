/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// This file is now a facade that re-exports the main storage module.
// This ensures that any module importing from 'src/storage' gets the correct,
// centralized data access functions.
export * from './core/storage';
