@@ .. @@
 import * as dom from './dom';
 import * as state from './state';
 import * as storage from './storage';
+import * as ui from './ui';
 import { initManagerView, showManagerDashboardView, isViewInitialized, refreshActiveViewData, setActiveManagerView } from './manager/index';
 import * as superAdmin from './superAdmin';
 import { generateUniqueId, simpleHash } from './core/utils';
@@ .. @@
     seller.initSellerEventListeners();
     initManagerView();
     superAdmin.initSuperAdminEventListeners();
+    ui.initThemeToggle();
     ui.initUIEventListeners();
 
     dom.logoutBtn?.addEventListener('click', auth.handleLogout);