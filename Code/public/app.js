(() => {
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  const modalContainer = document.getElementById('modal-container') || createModalContainer();

  function createModalContainer() {
    const el = document.createElement('div');
    el.id = 'modal-container';
    document.body.appendChild(el);
    return el;
  }

  const state = {
    token: sessionStorage.getItem('computerShopToken') || '',
    user: null,
    page: 'dashboard',
    authMode: 'login',
    dashboard: null,
    users: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    userFilters: { search: '', role: '', isActive: '' },
    dateRange: { from: dateDaysAgo(30), to: localDateString(new Date()) },
    // Member 2 State
    products: [],
    productPagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
    productFilters: { search: '', categoryId: '', brand: '', minPrice: '', maxPrice: '', inStock: '', sortBy: 'newest', specs: {} },
    categories: [],
    specOptions: [],
    inventoryItems: [],
    inventoryStats: null,
    inventoryFilter: 'all',
    inventorySearch: '',
    lowStockAlerts: [],
  };

  function localDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function dateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return localDateString(date);
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 3200);
  }

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
    if (state.token) headers.Authorization = `Bearer ${state.token}`;

    const response = await fetch(path.startsWith('/api') ? path : `/api${path}`, {
      ...options,
      headers,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.success === false) {
      if (response.status === 401 && state.token) logout(false);
      throw new Error(payload.message || `Yêu cầu thất bại (${response.status})`);
    }
    return payload.data;
  }

  function setToken(token) {
    state.token = token;
    if (token) sessionStorage.setItem('computerShopToken', token);
    else sessionStorage.removeItem('computerShopToken');
  }

  function logout(showMessage = true) {
    setToken('');
    state.user = null;
    state.dashboard = null;
    state.users = [];
    renderAuth();
    if (showMessage) showToast('Bạn đã đăng xuất.');
  }

  function initials(user) {
    const name = user?.fullName || user?.username || 'CS';
    return name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();
  }

  // ==========================================
  // Auth Views
  // ==========================================
  function renderAuth() {
    state.authMode = state.authMode === 'register' ? 'register' : 'login';
    const isRegister = state.authMode === 'register';
    app.innerHTML = `
      <main class="auth-layout">
        <section class="auth-intro">
          <div class="brand"><span class="brand-mark">CS</span><span>Computer Shop</span></div>
          <div class="intro-copy">
            <div class="eyebrow">Hệ thống Quản lý Cửa hàng Máy tính</div>
            <h1>Phần mềm Quản lý Cửa hàng Máy tính & Linh kiện phần cứng.</h1>
            <p>Kiến trúc đa tầng MVC/Clean, quản lý cấu hình thông số kỹ thuật (Socket, RAM, GPU), bộ lọc đa tiêu chí và kiểm soát tồn kho theo lô.</p>
          </div>
          <div class="intro-foot">Computer Shop Management Software · Ton Duc Thang University</div>
        </section>
        <section class="auth-panel">
          <div class="auth-card">
            <h2>${isRegister ? 'Tạo tài khoản' : 'Đăng nhập hệ thống'}</h2>
            <p class="subtle">${isRegister ? 'Đăng ký tài khoản khách hàng mới.' : 'Đăng nhập quản trị viên, nhân viên hoặc khách hàng.'}</p>
            <div class="auth-tabs">
              <button class="auth-tab ${!isRegister ? 'active' : ''}" data-auth-mode="login" type="button">Đăng nhập</button>
              <button class="auth-tab ${isRegister ? 'active' : ''}" data-auth-mode="register" type="button">Đăng ký</button>
            </div>
            <form id="auth-form">
              ${isRegister ? `
                <div class="field"><label for="fullName">Họ và tên</label><input id="fullName" name="fullName" maxlength="100" autocomplete="name" placeholder="Nguyễn Văn A"></div>
              ` : ''}
              <div class="field"><label for="identifier">${isRegister ? 'Tên đăng nhập' : 'Username hoặc email'}</label><input id="identifier" name="${isRegister ? 'username' : 'identifier'}" required autocomplete="${isRegister ? 'username' : 'username'}" placeholder="${isRegister ? 'vd: customer01' : 'admin / staff / customer'}"></div>
              ${isRegister ? `
                <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" placeholder="ban@example.com"></div>
                <div class="field"><label for="phone">Số điện thoại</label><input id="phone" name="phone" maxlength="20" autocomplete="tel" placeholder="0900000000"></div>
              ` : ''}
              <div class="field"><label for="password">Mật khẩu</label><input id="password" name="password" type="password" required minlength="${isRegister ? '8' : '1'}" autocomplete="${isRegister ? 'new-password' : 'current-password'}" placeholder="${isRegister ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu'}"></div>
              <button class="primary-btn" type="submit">${isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
              <div id="auth-error" class="alert" hidden></div>
            </form>
            <div style="margin-top: 15px; text-align: center;">
              <button class="ghost-btn" id="guest-catalog-btn" type="button">🔍 Xem Catalog Cửa hàng (Chế độ Khách)</button>
            </div>
            <p class="subtle auth-note">Tài khoản demo:<br>• Admin: <code>admin</code> / <code>AdminSecurePassword123!</code><br>• Staff: <code>demo_staff</code> / <code>StaffPassword123!</code><br>• Customer: <code>demo_customer</code> / <code>DemoCustomer123!</code></p>
          </div>
        </section>
      </main>`;

    app.querySelectorAll('[data-auth-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        state.authMode = button.dataset.authMode;
        renderAuth();
      });
    });
    document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
    document.getElementById('guest-catalog-btn').addEventListener('click', () => {
      state.user = { role: 'Customer', username: 'guest', fullName: 'Khách vãng lai' };
      state.page = 'storefront';
      renderApp();
    });
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const isRegister = state.authMode === 'register';
    const button = event.currentTarget.querySelector('button[type="submit"]');
    const errorBox = document.getElementById('auth-error');
    button.disabled = true;
    button.textContent = 'Đang xử lý...';
    errorBox.hidden = true;

    try {
      const body = isRegister
        ? {
            username: form.get('username'), email: form.get('email'), password: form.get('password'),
            fullName: form.get('fullName'), phone: form.get('phone'),
          }
        : { identifier: form.get('identifier'), password: form.get('password') };
      const data = await api(isRegister ? '/auth/register' : '/auth/login', {
        method: 'POST', body: JSON.stringify(body),
      });
      setToken(data.token);
      state.user = data.user;
      state.page = (state.user.role === 'Admin' || state.user.role === 'Staff') ? 'dashboard' : 'storefront';
      renderApp();
      showToast(isRegister ? 'Tạo tài khoản thành công.' : `Đăng nhập thành công (${data.user.role}).`);
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      button.disabled = false;
      button.textContent = isRegister ? 'Tạo tài khoản' : 'Đăng nhập';
    }
  }

  // ==========================================
  // Main Application Shell
  // ==========================================
  function renderApp() {
    if (!state.user && !state.token) return renderAuth();

    const isStaffOrAdmin = state.user?.role === 'Admin' || state.user?.role === 'Staff';
    const isAdmin = state.user?.role === 'Admin';

    let pageTitle = 'Dashboard';
    if (state.page === 'users') pageTitle = 'Quản lý Người dùng & Phân quyền';
    else if (state.page === 'products') pageTitle = 'Quản lý Linh kiện & Thông số Kỹ thuật (Specs)';
    else if (state.page === 'inventory') pageTitle = 'Quản lý Kho hàng & Cảnh báo Tồn kho (Low-Stock)';
    else if (state.page === 'storefront') pageTitle = 'Cửa hàng & Bộ lọc Linh kiện Đa tiêu chí';

    app.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="brand"><span class="brand-mark">CS</span><span>Computer Shop</span></div>
          <div class="sidebar-label">Phân hệ Quản trị</div>
          <div class="nav-group">
            ${isStaffOrAdmin ? `
              <button class="nav-btn ${state.page === 'dashboard' ? 'active' : ''}" data-page="dashboard"><span class="nav-symbol">▦</span>Dashboard</button>
              <button class="nav-btn ${state.page === 'products' ? 'active' : ''}" data-page="products"><span class="nav-symbol">📦</span>Linh kiện & Specs</button>
              <button class="nav-btn ${state.page === 'inventory' ? 'active' : ''}" data-page="inventory"><span class="nav-symbol">🏷️</span>Kho hàng & Tồn</button>
            ` : ''}
            <button class="nav-btn ${state.page === 'storefront' ? 'active' : ''}" data-page="storefront"><span class="nav-symbol">🔍</span>Cửa hàng & Lọc Specs</button>
            ${isAdmin ? `
              <button class="nav-btn ${state.page === 'users' ? 'active' : ''}" data-page="users"><span class="nav-symbol">♙</span>Người dùng & RBAC</button>
            ` : ''}
          </div>
          <div class="sidebar-bottom">
            <div class="user-mini">
              <div class="avatar">${escapeHtml(initials(state.user))}</div>
              <div>
                <strong>${escapeHtml(state.user?.fullName || state.user?.username || 'User')}</strong>
                <small>${escapeHtml(state.user?.role || 'Guest')}</small>
              </div>
            </div>
            <button class="nav-btn logout" id="logout-btn"><span class="nav-symbol">↪</span>Đăng xuất</button>
          </div>
        </aside>
        <main class="main-panel">
          <header class="topbar">
            <div>
              <h1>${pageTitle}</h1>
              <p>Computer Shop Management Software · Module 1, 2, 3 & 4</p>
            </div>
            <div class="topbar-right">${escapeHtml(state.user?.username || 'Guest')} · <span class="badge badge-in-stock">${escapeHtml(state.user?.role || 'Guest')}</span></div>
          </header>
          <section class="content" id="page-content"><div class="empty-state">Đang tải dữ liệu...</div></section>
        </main>
      </div>`;

    app.querySelectorAll('[data-page]').forEach((button) => {
      button.addEventListener('click', () => {
        state.page = button.dataset.page;
        renderApp();
      });
    });
    document.getElementById('logout-btn').addEventListener('click', () => logout());

    if (state.page === 'dashboard') loadDashboardPage();
    else if (state.page === 'users') loadUsersPage();
    else if (state.page === 'products') loadProductsPage();
    else if (state.page === 'inventory') loadInventoryPage();
    else if (state.page === 'storefront') loadStorefrontPage();
  }

  // ==========================================
  // Module 1: Dashboard & Users (TV1 preserved)
  // ==========================================
  async function loadDashboardPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="empty-state">Đang tải thống kê doanh thu...</div>';
    try {
      const data = await api(`/admin/dashboard?from=${encodeURIComponent(state.dateRange.from)}&to=${encodeURIComponent(state.dateRange.to)}`);
      state.dashboard = data;
      renderDashboard(content, data);
    } catch (err) {
      content.innerHTML = `<div class="alert">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderDashboard(content, data) {
    const s = data.summary;
    const c = data.conversion;
    content.innerHTML = `
      <div class="page-heading">
        <div><h2>Tổng quan Hoạt động Kinh doanh</h2><p class="subtle">Thống kê theo dữ liệu đơn hàng và lượt truy cập phiên</p></div>
        <form class="date-filter" id="dashboard-date-form">
          <div class="field"><label>Từ ngày</label><input type="date" name="from" value="${escapeHtml(state.dateRange.from)}"></div>
          <div class="field"><label>Đến ngày</label><input type="date" name="to" value="${escapeHtml(state.dateRange.to)}"></div>
          <button class="btn-primary" type="submit">Lọc</button>
        </form>
      </div>
      <div class="metrics">
        <div class="metric-card"><div class="metric-top">Doanh thu ghi nhận</div><div class="metric-value">${escapeHtml(formatCurrency(s.totalRevenue))}</div><div class="metric-sub">Đơn Paid, Packing, Shipped, Completed</div></div>
        <div class="metric-card"><div class="metric-top">Tổng đơn hàng</div><div class="metric-value">${escapeHtml(s.totalOrders)}</div><div class="metric-sub">${escapeHtml(s.completedOrders)} hoàn thành · ${escapeHtml(s.pendingOrders)} chờ xử lý</div></div>
        <div class="metric-card"><div class="metric-top">Tỷ lệ Chuyển đổi</div><div class="metric-value">${escapeHtml(c.conversionRatePercent)}%</div><div class="metric-sub">${escapeHtml(c.convertedSessions)} đơn / ${escapeHtml(c.trackedSessions)} phiên session</div></div>
      </div>
      <div class="panel" style="margin-top:24px;">
        <div class="panel-header"><h3>Đơn hàng Gần đây</h3></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Phương thức</th><th>Trạng thái</th><th>Tổng tiền</th><th>Ngày tạo</th></tr></thead>
            <tbody>
              ${(data.recentOrders || []).map(o => `
                <tr>
                  <td><strong>#${o.order_id}</strong></td>
                  <td>${escapeHtml(o.customer_name || 'Khách vãng lai')}</td>
                  <td><span class="badge">${escapeHtml(o.payment_method)}</span></td>
                  <td><span class="badge ${o.status === 'Completed' || o.status === 'Paid' ? 'badge-in-stock' : 'badge-low-stock'}">${escapeHtml(o.status)}</span></td>
                  <td><strong>${escapeHtml(formatCurrency(o.total_amount))}</strong></td>
                  <td>${new Date(o.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    document.getElementById('dashboard-date-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      state.dateRange.from = fd.get('from');
      state.dateRange.to = fd.get('to');
      loadDashboardPage();
    });
  }

  async function loadUsersPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="empty-state">Đang tải danh sách người dùng...</div>';
    try {
      const q = new URLSearchParams({
        page: state.pagination.page,
        limit: state.pagination.limit,
        search: state.userFilters.search,
        role: state.userFilters.role,
      });
      const data = await api(`/users?${q.toString()}`);
      state.users = data.users;
      state.pagination = data.pagination;
      renderUsers(content);
    } catch (err) {
      content.innerHTML = `<div class="alert">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderUsers(content) {
    content.innerHTML = `
      <div class="page-heading">
        <div><h2>Quản lý Tài khoản & Phân quyền RBAC</h2><p class="subtle">Quản lý Admin, Nhân viên kho/bán hàng (Staff) và Khách hàng</p></div>
      </div>
      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Username</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              ${state.users.map(u => `
                <tr>
                  <td>#${u.user_id}</td>
                  <td><strong>${escapeHtml(u.username)}</strong></td>
                  <td>${escapeHtml(u.full_name || '—')}</td>
                  <td>${escapeHtml(u.email || '—')}</td>
                  <td><span class="badge badge-in-stock">${escapeHtml(u.role)}</span></td>
                  <td><span class="badge ${u.is_active ? 'badge-in-stock' : 'badge-out-stock'}">${u.is_active ? 'Hoạt động' : 'Bị khóa'}</span></td>
                  <td>
                    ${u.user_id !== state.user?.userId ? `
                      <select class="user-role-select" data-id="${u.user_id}" style="padding:4px 8px; border-radius:6px;">
                        <option value="Customer" ${u.role === 'Customer' ? 'selected' : ''}>Customer</option>
                        <option value="Staff" ${u.role === 'Staff' ? 'selected' : ''}>Staff</option>
                        <option value="Admin" ${u.role === 'Admin' ? 'selected' : ''}>Admin</option>
                      </select>
                      <button class="btn-secondary toggle-status-btn" data-id="${u.user_id}" data-active="${u.is_active}">${u.is_active ? 'Khóa' : 'Mở khóa'}</button>
                    ` : '<small class="subtle">Tài khoản của bạn</small>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    content.querySelectorAll('.user-role-select').forEach(sel => {
      sel.addEventListener('change', async (e) => {
        try {
          await api(`/users/${sel.dataset.id}/role`, { method: 'PATCH', body: JSON.stringify({ role: e.target.value }) });
          showToast('Đã cập nhật vai trò người dùng.');
          loadUsersPage();
        } catch (err) { showToast(err.message); }
      });
    });

    content.querySelectorAll('.toggle-status-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const nextActive = btn.dataset.active === 'false';
        try {
          await api(`/users/${btn.dataset.id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive: nextActive }) });
          showToast(`Đã ${nextActive ? 'mở khóa' : 'khóa'} tài khoản.`);
          loadUsersPage();
        } catch (err) { showToast(err.message); }
      });
    });
  }

  // ==========================================
  // Module 2: Products & Specs Management (TV2)
  // ==========================================
  async function loadProductsPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="empty-state">Đang tải danh sách linh kiện máy tính...</div>';
    try {
      const [catsRes, prodsRes] = await Promise.all([
        api('/categories'),
        api(`/products?page=${state.productPagination.page}&limit=${state.productPagination.limit}&search=${encodeURIComponent(state.productFilters.search)}`),
      ]);
      state.categories = catsRes.categories || [];
      state.products = prodsRes.products || [];
      state.productPagination = prodsRes.pagination || {};
      renderProducts(content);
    } catch (err) {
      content.innerHTML = `<div class="alert">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderProducts(content) {
    content.innerHTML = `
      <div class="toolbar-actions">
        <div style="display:flex; gap:10px; flex:1; max-width:400px;">
          <input type="text" id="prod-search-input" placeholder="Tìm theo tên, thương hiệu, SKU..." value="${escapeHtml(state.productFilters.search)}" style="padding:8px 12px; border:1px solid var(--line); border-radius:8px; width:100%;">
          <button class="btn-secondary" id="prod-search-btn">Tìm</button>
        </div>
        <button class="btn-primary" id="btn-open-create-prod">➕ Thêm Linh Kiện & Specs Mới</button>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Linh kiện</th>
                <th>Danh mục</th>
                <th>Thông số Kỹ thuật (Specs)</th>
                <th>Biến thể (SKU / Đơn giá)</th>
                <th>Tồn kho</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${state.products.length === 0 ? '<tr><td colspan="6" style="text-align:center; padding:30px;">Không có linh kiện nào phù hợp.</td></tr>' : ''}
              ${state.products.map(p => `
                <tr>
                  <td>
                    <div style="font-size:11px; font-weight:750; color:var(--blue); text-transform:uppercase;">${escapeHtml(p.brand)}</div>
                    <strong>${escapeHtml(p.name)}</strong>
                    <div class="subtle" style="font-size:12px; max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.description || '')}</div>
                  </td>
                  <td><span class="badge" style="background:#eef2f6;">${escapeHtml(p.category_name)}</span></td>
                  <td>
                    <div class="spec-tags">
                      ${(p.specs || []).map(s => `<span class="spec-tag"><strong>${escapeHtml(s.spec_name)}:</strong> ${escapeHtml(s.spec_value)}</span>`).join('')}
                    </div>
                  </td>
                  <td>
                    <div style="display:flex; flex-direction:column; gap:4px;">
                      ${(p.variants || []).map(v => `
                        <div style="font-size:12px;">
                          <code>${escapeHtml(v.sku)}</code>: <strong>${escapeHtml(formatCurrency(v.price))}</strong>
                        </div>
                      `).join('')}
                    </div>
                  </td>
                  <td>
                    <div style="font-size:14px; font-weight:750;">${p.total_stock} cái</div>
                    ${p.total_stock === 0 ? '<span class="badge badge-out-stock">Hết hàng</span>' : (p.total_stock <= 5 ? '<span class="badge badge-low-stock">Sắp hết</span>' : '<span class="badge badge-in-stock">Đủ hàng</span>')}
                  </td>
                  <td>
                    <div style="display:flex; gap:6px;">
                      <button class="btn-secondary btn-add-variant" data-id="${p.product_id}" title="Thêm biến thể SKU mới">+ SKU</button>
                      <button class="btn-danger btn-delete-prod" data-id="${p.product_id}" title="Xóa linh kiện">Xóa</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    document.getElementById('prod-search-btn').addEventListener('click', () => {
      state.productFilters.search = document.getElementById('prod-search-input').value.trim();
      loadProductsPage();
    });
    document.getElementById('prod-search-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        state.productFilters.search = e.target.value.trim();
        loadProductsPage();
      }
    });

    document.getElementById('btn-open-create-prod').addEventListener('click', () => openCreateProductModal());

    content.querySelectorAll('.btn-add-variant').forEach(btn => {
      btn.addEventListener('click', () => openAddVariantModal(btn.dataset.id));
    });

    content.querySelectorAll('.btn-delete-prod').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Bạn có chắc chắn muốn xóa linh kiện này?')) return;
        try {
          await api(`/products/${btn.dataset.id}`, { method: 'DELETE' });
          showToast('Đã xóa linh kiện.');
          loadProductsPage();
        } catch (err) { showToast(err.message); }
      });
    });
  }

  function openCreateProductModal() {
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box">
          <div class="modal-header">
            <h3>Thêm Linh Kiện & Thông Số Kỹ Thuật Mới</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <form id="create-prod-form">
            <div class="modal-body">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="field"><label>Tên linh kiện *</label><input name="name" required placeholder="vd: Intel Core i9-14900K"></div>
                <div class="field"><label>Thương hiệu *</label><input name="brand" required placeholder="vd: Intel, ASUS, Corsair"></div>
              </div>
              <div class="field">
                <label>Danh mục phần cứng *</label>
                <select name="categoryId" required style="padding:8px 12px; border:1px solid var(--line); border-radius:8px; width:100%;">
                  ${state.categories.map(c => `<option value="${c.category_id}">${escapeHtml(c.name)}</option>`).join('')}
                </select>
              </div>
              <div class="field"><label>Mô tả chi tiết</label><textarea name="description" rows="2" style="padding:8px 12px; border:1px solid var(--line); border-radius:8px; width:100%; font-family:inherit;" placeholder="Mô tả công nghệ, tính năng tản nhiệt, chuẩn kết nối..."></textarea></div>

              <div style="border-top:1px solid var(--line); padding-top:12px;">
                <h4 style="margin:0 0 8px;">Biến thể ban đầu (SKU & Giá)</h4>
                <div style="display:grid; grid-template-columns:1.5fr 1.2fr 1fr 1fr; gap:8px;">
                  <div class="field"><label>Mã SKU *</label><input name="sku" required placeholder="CPU-INTEL-14900K"></div>
                  <div class="field"><label>Giá bán (VNĐ) *</label><input name="price" type="number" required min="0" placeholder="15000000"></div>
                  <div class="field"><label>Tồn ban đầu</label><input name="stockQuantity" type="number" min="0" value="10"></div>
                  <div class="field"><label>Ngưỡng cảnh báo</label><input name="lowStockThreshold" type="number" min="0" value="5"></div>
                </div>
              </div>

              <div style="border-top:1px solid var(--line); padding-top:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <h4 style="margin:0;">Thông số kỹ thuật (Specs Management)</h4>
                  <button type="button" class="btn-secondary" id="btn-add-spec-row" style="font-size:12px; padding:4px 8px;">+ Thêm thông số</button>
                </div>
                <div id="specs-container" style="display:flex; flex-direction:column; gap:8px;">
                  <div class="restock-row">
                    <input placeholder="Tên thông số (vd: Socket, VRAM, RAM Bus, TDP)" class="spec-name-input">
                    <input placeholder="Giá trị (vd: LGA1700, 16GB, 6000MHz)" class="spec-val-input">
                    <button type="button" class="btn-danger remove-spec-row" style="padding:4px 8px;">×</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" id="modal-cancel-btn">Hủy</button>
              <button type="submit" class="btn-primary">Lưu Linh Kiện</button>
            </div>
          </form>
        </div>
      </div>`;

    const close = () => { modalContainer.innerHTML = ''; };
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);

    const specsContainer = document.getElementById('specs-container');
    document.getElementById('btn-add-spec-row').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'restock-row';
      row.innerHTML = `
        <input placeholder="Tên thông số (vd: Socket, Bus, TDP)" class="spec-name-input">
        <input placeholder="Giá trị (vd: AM5, 6000MHz)" class="spec-val-input">
        <button type="button" class="btn-danger remove-spec-row" style="padding:4px 8px;">×</button>
      `;
      row.querySelector('.remove-spec-row').addEventListener('click', () => row.remove());
      specsContainer.appendChild(row);
    });

    specsContainer.querySelectorAll('.remove-spec-row').forEach(b => {
      b.addEventListener('click', (e) => e.target.closest('.restock-row').remove());
    });

    document.getElementById('create-prod-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const specs = [];
      specsContainer.querySelectorAll('.restock-row').forEach(r => {
        const k = r.querySelector('.spec-name-input').value.trim();
        const v = r.querySelector('.spec-val-input').value.trim();
        if (k && v) specs.push({ specName: k, specValue: v });
      });

      const body = {
        name: fd.get('name').trim(),
        brand: fd.get('brand').trim(),
        categoryId: Number(fd.get('categoryId')),
        description: fd.get('description')?.trim() || null,
        variants: [{
          sku: fd.get('sku').trim(),
          price: Number(fd.get('price')),
          stockQuantity: Number(fd.get('stockQuantity') || 0),
          lowStockThreshold: Number(fd.get('lowStockThreshold') || 5),
        }],
        specs,
      };

      try {
        await api('/products', { method: 'POST', body: JSON.stringify(body) });
        showToast('Đã thêm sản phẩm linh kiện và thông số kỹ thuật thành công.');
        close();
        loadProductsPage();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  function openAddVariantModal(productId) {
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width:450px;">
          <div class="modal-header">
            <h3>Thêm Biến Thể SKU Mới</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <form id="add-variant-form">
            <div class="modal-body">
              <div class="field"><label>Mã SKU biến thể *</label><input name="sku" required placeholder="vd: SKU-WHITE-EDITION"></div>
              <div class="field"><label>Đơn giá bán (VNĐ) *</label><input name="price" type="number" required min="0" placeholder="12000000"></div>
              <div class="field"><label>Số lượng tồn ban đầu</label><input name="stockQuantity" type="number" min="0" value="5"></div>
              <div class="field"><label>Ngưỡng cảnh báo hết hàng</label><input name="lowStockThreshold" type="number" min="0" value="5"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" id="modal-cancel-btn">Hủy</button>
              <button type="submit" class="btn-primary">Thêm SKU</button>
            </div>
          </form>
        </div>
      </div>`;

    const close = () => { modalContainer.innerHTML = ''; };
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);

    document.getElementById('add-variant-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const body = {
        sku: fd.get('sku').trim(),
        price: Number(fd.get('price')),
        stockQuantity: Number(fd.get('stockQuantity') || 0),
        lowStockThreshold: Number(fd.get('lowStockThreshold') || 5),
      };
      try {
        await api(`/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(body) });
        showToast('Đã thêm biến thể mới.');
        close();
        loadProductsPage();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // ==========================================
  // Module 4: Inventory & Low-Stock Alerts (TV2)
  // ==========================================
  async function loadInventoryPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="empty-state">Đang tải dữ liệu kho hàng & cảnh báo...</div>';
    try {
      const [invRes, alertRes] = await Promise.all([
        api(`/inventory?status=${state.inventoryFilter}&search=${encodeURIComponent(state.inventorySearch)}`),
        api('/inventory/low-stock'),
      ]);
      state.inventoryItems = invRes.items || [];
      state.inventoryStats = invRes.stats || {};
      state.lowStockAlerts = alertRes.alerts || [];
      renderInventory(content);
    } catch (err) {
      content.innerHTML = `<div class="alert">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderInventory(content) {
    const s = state.inventoryStats || {};
    content.innerHTML = `
      ${state.lowStockAlerts.length > 0 ? `
        <div class="alert-banner">
          <div class="alert-banner-header">
            <div class="alert-banner-title">
              <span>⚠️ CẢNH BÁO TỒN KHO THẤP (LOW-STOCK ALERTS)</span>
              <span class="badge badge-critical">${state.lowStockAlerts.length} mặt hàng chạm ngưỡng</span>
            </div>
            <button class="btn-primary" id="btn-quick-restock-alerts" style="font-size:12px; padding:6px 12px;">Nhập hàng ngay</button>
          </div>
          <div class="alert-items-list">
            ${state.lowStockAlerts.slice(0, 4).map(a => `
              <div class="alert-item-card">
                <div>
                  <strong>${escapeHtml(a.product_name)}</strong> (<code>${escapeHtml(a.sku)}</code>)
                  <span class="subtle"> · ${escapeHtml(a.brand)}</span>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <span class="badge ${a.stock_quantity === 0 ? 'badge-critical' : 'badge-warning'}">${a.stock_quantity === 0 ? 'HẾT HÀNG' : 'SẮP HẾT'} (Còn ${a.stock_quantity}/${a.low_stock_threshold})</span>
                  <small style="color:#b43403;">Thiếu: ${a.deficit_quantity} cái</small>
                </div>
              </div>
            `).join('')}
            ${state.lowStockAlerts.length > 4 ? `<small class="subtle" style="text-align:center;">...và ${state.lowStockAlerts.length - 4} linh kiện khác đang chạm ngưỡng cảnh báo.</small>` : ''}
          </div>
        </div>
      ` : ''}

      <div class="metrics" style="margin-bottom:20px;">
        <div class="metric-card"><div class="metric-top">Tổng Mã Hàng (SKUs)</div><div class="metric-value">${s.total_skus || 0}</div><div class="metric-sub">Đang quản lý trên hệ thống</div></div>
        <div class="metric-card"><div class="metric-top">Tổng Tồn Kho Thực Tế</div><div class="metric-value">${s.total_units || 0} cái</div><div class="metric-sub">${s.out_of_stock_count || 0} hết hàng · ${s.low_stock_count || 0} sắp hết</div></div>
        <div class="metric-card"><div class="metric-top">Tổng Giá Trị Tồn Kho</div><div class="metric-value">${escapeHtml(formatCurrency(s.total_inventory_value || 0))}</div><div class="metric-sub">Định giá theo giá niêm yết</div></div>
      </div>

      <div class="toolbar-actions">
        <div style="display:flex; gap:8px; align-items:center;">
          <input type="text" id="inv-search-input" placeholder="Lọc theo SKU, tên, hãng..." value="${escapeHtml(state.inventorySearch)}" style="padding:8px 12px; border:1px solid var(--line); border-radius:8px;">
          <select id="inv-filter-select" style="padding:8px 12px; border:1px solid var(--line); border-radius:8px;">
            <option value="all" ${state.inventoryFilter === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
            <option value="low_stock" ${state.inventoryFilter === 'low_stock' ? 'selected' : ''}>⚠️ Sắp hết hàng</option>
            <option value="out_of_stock" ${state.inventoryFilter === 'out_of_stock' ? 'selected' : ''}>⛔ Đã hết hàng (0 tồn)</option>
            <option value="in_stock" ${state.inventoryFilter === 'in_stock' ? 'selected' : ''}>✅ Đủ hàng</option>
          </select>
          <button class="btn-secondary" id="inv-search-btn">Lọc</button>
        </div>
        <button class="btn-primary" id="btn-open-batch-restock">📥 Nhập Kho Theo Lô (Batch Restock)</button>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã SKU</th>
                <th>Linh kiện</th>
                <th>Danh mục</th>
                <th>Đơn giá</th>
                <th>Tồn kho</th>
                <th>Ngưỡng cảnh báo</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${state.inventoryItems.length === 0 ? '<tr><td colspan="8" style="text-align:center; padding:30px;">Không có linh kiện nào trong kho theo bộ lọc.</td></tr>' : ''}
              ${state.inventoryItems.map(item => `
                <tr>
                  <td><code>${escapeHtml(item.sku)}</code></td>
                  <td>
                    <div style="font-weight:700;">${escapeHtml(item.product_name)}</div>
                    <small class="subtle">${escapeHtml(item.brand)}</small>
                  </td>
                  <td><span class="badge" style="background:#f1f5f9;">${escapeHtml(item.category_name)}</span></td>
                  <td>${escapeHtml(formatCurrency(item.price))}</td>
                  <td><strong style="font-size:15px;">${item.stock_quantity}</strong></td>
                  <td>${item.low_stock_threshold}</td>
                  <td>
                    <span class="badge ${item.stock_status === 'In Stock' ? 'badge-in-stock' : (item.stock_status === 'Low Stock' ? 'badge-low-stock' : 'badge-out-stock')}">
                      ${escapeHtml(item.stock_status)}
                    </span>
                  </td>
                  <td>
                    <button class="btn-secondary btn-adjust-stock" data-id="${item.variant_id}" data-sku="${escapeHtml(item.sku)}" data-stock="${item.stock_quantity}" data-threshold="${item.low_stock_threshold}">Điều chỉnh</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    document.getElementById('inv-search-btn').addEventListener('click', () => {
      state.inventorySearch = document.getElementById('inv-search-input').value.trim();
      state.inventoryFilter = document.getElementById('inv-filter-select').value;
      loadInventoryPage();
    });

    document.getElementById('btn-open-batch-restock').addEventListener('click', () => openBatchRestockModal());

    const quickAlertBtn = document.getElementById('btn-quick-restock-alerts');
    if (quickAlertBtn) {
      quickAlertBtn.addEventListener('click', () => openBatchRestockModal(state.lowStockAlerts));
    }

    content.querySelectorAll('.btn-adjust-stock').forEach(btn => {
      btn.addEventListener('click', () => {
        openAdjustStockModal(btn.dataset.id, btn.dataset.sku, btn.dataset.stock, btn.dataset.threshold);
      });
    });
  }

  function openBatchRestockModal(prefillAlerts = []) {
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width:650px;">
          <div class="modal-header">
            <h3>Nhập Kho Linh Kiện Theo Lô (Inward Shipment)</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <form id="batch-restock-form">
            <div class="modal-body">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="field"><label>Mã lô hàng (Batch Code)</label><input name="batchCode" value="BATCH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-01" required></div>
                <div class="field"><label>Ghi chú / Chứng từ nhập kho</label><input name="notes" placeholder="Nhập từ Synnex FPT / ASUS VN..." value="Nhập bổ sung linh kiện tồn kho"></div>
              </div>

              <div style="border-top:1px solid var(--line); padding-top:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <h4 style="margin:0;">Danh sách mã SKU và số lượng nhập</h4>
                  <button type="button" class="btn-secondary" id="btn-add-restock-item" style="font-size:12px; padding:4px 8px;">+ Thêm dòng</button>
                </div>
                <div id="restock-items-list" style="display:flex; flex-direction:column; gap:8px; max-height:260px; overflow-y:auto;">
                  ${prefillAlerts.length > 0 ? prefillAlerts.map(a => `
                    <div class="restock-row">
                      <input value="${escapeHtml(a.sku)}" class="restock-sku-input" readonly style="background:#f8fafc;">
                      <input type="number" min="1" value="${Math.max(10, a.deficit_quantity * 2)}" class="restock-qty-input" required>
                      <button type="button" class="btn-danger remove-restock-row" style="padding:4px 8px;">×</button>
                    </div>
                  `).join('') : `
                    <div class="restock-row">
                      <select class="restock-sku-select" style="padding:6px; border:1px solid var(--line); border-radius:6px;">
                        ${state.inventoryItems.map(i => `<option value="${i.variant_id}">${escapeHtml(i.sku)} - ${escapeHtml(i.product_name)} (Tồn: ${i.stock_quantity})</option>`).join('')}
                      </select>
                      <input type="number" min="1" value="10" placeholder="Số lượng" class="restock-qty-input" required>
                      <button type="button" class="btn-danger remove-restock-row" style="padding:4px 8px;">×</button>
                    </div>
                  `}
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" id="modal-cancel-btn">Hủy</button>
              <button type="submit" class="btn-primary">Xác Nhận Nhập Kho</button>
            </div>
          </form>
        </div>
      </div>`;

    const close = () => { modalContainer.innerHTML = ''; };
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);

    const list = document.getElementById('restock-items-list');
    document.getElementById('btn-add-restock-item').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'restock-row';
      row.innerHTML = `
        <select class="restock-sku-select" style="padding:6px; border:1px solid var(--line); border-radius:6px;">
          ${state.inventoryItems.map(i => `<option value="${i.variant_id}">${escapeHtml(i.sku)} - ${escapeHtml(i.product_name)} (Tồn: ${i.stock_quantity})</option>`).join('')}
        </select>
        <input type="number" min="1" value="10" placeholder="Số lượng" class="restock-qty-input" required>
        <button type="button" class="btn-danger remove-restock-row" style="padding:4px 8px;">×</button>
      `;
      row.querySelector('.remove-restock-row').addEventListener('click', () => row.remove());
      list.appendChild(row);
    });

    list.querySelectorAll('.remove-restock-row').forEach(b => {
      b.addEventListener('click', (e) => e.target.closest('.restock-row').remove());
    });

    document.getElementById('batch-restock-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const items = [];
      list.querySelectorAll('.restock-row').forEach(r => {
        const skuInput = r.querySelector('.restock-sku-input');
        const sel = r.querySelector('.restock-sku-select');
        const qty = Number(r.querySelector('.restock-qty-input').value);
        if (skuInput) {
          items.push({ sku: skuInput.value.trim(), quantity: qty });
        } else if (sel) {
          items.push({ variantId: Number(sel.value), quantity: qty });
        }
      });

      if (items.length === 0) return alert('Vui lòng thêm ít nhất một linh kiện vào lô nhập.');

      try {
        const res = await api('/inventory/restock-batch', {
          method: 'POST',
          body: JSON.stringify({
            items,
            batchCode: fd.get('batchCode'),
            notes: fd.get('notes'),
          }),
        });
        showToast(`Nhập kho thành công ${res.totalUnitsRestocked} sản phẩm.`);
        close();
        loadInventoryPage();
      } catch (err) { alert(err.message); }
    });
  }

  function openAdjustStockModal(variantId, sku, currentStock, currentThreshold) {
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width:440px;">
          <div class="modal-header">
            <h3>Điều Chỉnh Tồn Kho: ${escapeHtml(sku)}</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <form id="adjust-stock-form">
            <div class="modal-body">
              <div class="field"><label>Số lượng tồn thực tế *</label><input name="newQuantity" type="number" min="0" value="${currentStock}" required></div>
              <div class="field"><label>Ngưỡng cảnh báo Low-Stock *</label><input name="lowStockThreshold" type="number" min="0" value="${currentThreshold}" required></div>
              <div class="field"><label>Lý do điều chỉnh</label><input name="reason" value="Kiểm kê định kỳ thực tế"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn-secondary" id="modal-cancel-btn">Hủy</button>
              <button type="submit" class="btn-primary">Lưu Điều Chỉnh</button>
            </div>
          </form>
        </div>
      </div>`;

    const close = () => { modalContainer.innerHTML = ''; };
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);

    document.getElementById('adjust-stock-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      try {
        await api(`/inventory/variants/${variantId}/adjust`, {
          method: 'PATCH',
          body: JSON.stringify({
            newQuantity: Number(fd.get('newQuantity')),
            lowStockThreshold: Number(fd.get('lowStockThreshold')),
            reason: fd.get('reason'),
          }),
        });
        showToast('Đã cập nhật tồn kho thành công.');
        close();
        loadInventoryPage();
      } catch (err) { alert(err.message); }
    });
  }

  // ==========================================
  // Storefront & Multi-Criteria Filtering View
  // ==========================================
  async function loadStorefrontPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="empty-state">Đang tải danh mục sản phẩm & bộ lọc thông số kỹ thuật...</div>';
    try {
      const [filterOptionsRes, prodsRes] = await Promise.all([
        api('/products/filter-options/all'),
        api(`/products?${buildStorefrontQuery()}`),
      ]);
      state.filterOptions = filterOptionsRes.filterOptions || {};
      state.catalogProducts = prodsRes.products || [];
      renderStorefront(content);
    } catch (err) {
      content.innerHTML = `<div class="alert">${escapeHtml(err.message)}</div>`;
    }
  }

  function buildStorefrontQuery() {
    const p = new URLSearchParams();
    if (state.productFilters.search) p.append('search', state.productFilters.search);
    if (state.productFilters.categoryId) p.append('categoryId', state.productFilters.categoryId);
    if (state.productFilters.brand) p.append('brand', state.productFilters.brand);
    if (state.productFilters.minPrice) p.append('minPrice', state.productFilters.minPrice);
    if (state.productFilters.maxPrice) p.append('maxPrice', state.productFilters.maxPrice);
    if (state.productFilters.inStock) p.append('inStock', 'true');
    if (state.productFilters.sortBy) p.append('sortBy', state.productFilters.sortBy);

    for (const [k, v] of Object.entries(state.productFilters.specs || {})) {
      if (v) p.append(`spec_${k}`, v);
    }
    return p.toString();
  }

  function renderStorefront(content) {
    const opts = state.filterOptions || {};
    content.innerHTML = `
      <div class="catalog-layout">
        <!-- Sidebar Bộ lọc Đa tiêu chí -->
        <aside class="filter-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="margin:0; font-size:16px;">Bộ Lọc Đa Tiêu Chí</h3>
            <button class="btn-secondary" id="btn-reset-filters" style="font-size:11px; padding:3px 7px;">Đặt lại</button>
          </div>

          <div class="filter-section">
            <div class="filter-title">Danh mục</div>
            <select id="filter-cat-select" style="width:100%; padding:7px; border:1px solid var(--line); border-radius:6px;">
              <option value="">Tất cả danh mục</option>
              ${(opts.categories || []).map(c => `<option value="${c.category_id}" ${String(state.productFilters.categoryId) === String(c.category_id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
            </select>
          </div>

          <div class="filter-section">
            <div class="filter-title">Thương hiệu</div>
            <select id="filter-brand-select" style="width:100%; padding:7px; border:1px solid var(--line); border-radius:6px;">
              <option value="">Tất cả thương hiệu</option>
              ${(opts.brands || []).map(b => `<option value="${escapeHtml(b)}" ${state.productFilters.brand === b ? 'selected' : ''}>${escapeHtml(b)}</option>`).join('')}
            </select>
          </div>

          <div class="filter-section">
            <div class="filter-title">Khoảng giá (VNĐ)</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
              <input type="number" id="filter-min-price" placeholder="Từ" value="${escapeHtml(state.productFilters.minPrice)}" style="padding:6px; border:1px solid var(--line); border-radius:6px; width:100%;">
              <input type="number" id="filter-max-price" placeholder="Đến" value="${escapeHtml(state.productFilters.maxPrice)}" style="padding:6px; border:1px solid var(--line); border-radius:6px; width:100%;">
            </div>
          </div>

          <div class="filter-section">
            <label class="filter-checkbox">
              <input type="checkbox" id="filter-instock-check" ${state.productFilters.inStock ? 'checked' : ''}>
              <span>Chỉ hiện sản phẩm còn hàng</span>
            </label>
          </div>

          <!-- Dynamic Specs Filtering (Socket, RAM, VRAM...) -->
          <div style="border-top:1px solid var(--line); padding-top:14px;">
            <div class="filter-title" style="color:var(--blue);">Thông Số Kỹ Thuật (Specs)</div>
            ${(opts.specs || []).map(sp => `
              <div style="margin-bottom:12px;">
                <label style="font-size:12px; font-weight:650; display:block; margin-bottom:4px;">${escapeHtml(sp.spec_name)}</label>
                <select class="spec-filter-select" data-spec="${escapeHtml(sp.spec_name)}" style="width:100%; padding:6px; border:1px solid var(--line); border-radius:6px; font-size:12px;">
                  <option value="">-- Tất cả ${escapeHtml(sp.spec_name)} --</option>
                  ${(sp.values || []).map(v => `<option value="${escapeHtml(v)}" ${state.productFilters.specs?.[sp.spec_name] === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
                </select>
              </div>
            `).join('')}
          </div>

          <button class="btn-primary" id="btn-apply-filters" style="width:100%; justify-content:center; margin-top:10px;">Áp Dụng Bộ Lọc</button>
        </aside>

        <!-- Right Side: Catalog & Search Bar -->
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; gap:12px; flex-wrap:wrap;">
            <div style="flex:1; max-width:420px; display:flex; gap:8px;">
              <input type="text" id="store-search-input" placeholder="Tìm theo tên linh kiện hoặc SKU..." value="${escapeHtml(state.productFilters.search)}" style="padding:8px 12px; border:1px solid var(--line); border-radius:8px; width:100%;">
              <button class="btn-secondary" id="store-search-btn">Tìm</button>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <label style="font-size:13px; color:var(--muted);">Sắp xếp:</label>
              <select id="store-sort-select" style="padding:8px 12px; border:1px solid var(--line); border-radius:8px;">
                <option value="newest" ${state.productFilters.sortBy === 'newest' ? 'selected' : ''}>Mới nhất</option>
                <option value="price_asc" ${state.productFilters.sortBy === 'price_asc' ? 'selected' : ''}>Giá tăng dần</option>
                <option value="price_desc" ${state.productFilters.sortBy === 'price_desc' ? 'selected' : ''}>Giá giảm dần</option>
                <option value="name_asc" ${state.productFilters.sortBy === 'name_asc' ? 'selected' : ''}>Tên A-Z</option>
              </select>
            </div>
          </div>

          <div class="catalog-cards-grid">
            ${state.catalogProducts.length === 0 ? '<div style="grid-column:1/-1; text-align:center; padding:50px; background:#fff; border-radius:12px; border:1px solid var(--line); color:var(--muted);">Không tìm thấy linh kiện nào khớp với thông số kỹ thuật đã chọn.</div>' : ''}
            ${state.catalogProducts.map(p => `
              <div class="prod-card">
                <div>
                  <div class="prod-brand">${escapeHtml(p.brand)} · ${escapeHtml(p.category_name)}</div>
                  <div class="prod-name">${escapeHtml(p.name)}</div>
                  <div class="spec-tags">
                    ${(p.specs || []).map(s => `<span class="spec-tag">${escapeHtml(s.spec_name)}: ${escapeHtml(s.spec_value)}</span>`).join('')}
                  </div>
                </div>
                <div style="margin-top:14px; border-top:1px solid #f1f5f9; padding-top:10px;">
                  <div class="prod-price">${p.min_price === p.max_price ? escapeHtml(formatCurrency(p.min_price)) : `${escapeHtml(formatCurrency(p.min_price))} - ${escapeHtml(formatCurrency(p.max_price))}`}</div>
                  <div class="prod-stock-info">
                    ${p.total_stock > 0 ? `<span class="badge badge-in-stock">Còn ${p.total_stock} sản phẩm</span>` : '<span class="badge badge-out-stock">Hết hàng</span>'}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>`;

    document.getElementById('btn-apply-filters').addEventListener('click', () => {
      state.productFilters.categoryId = document.getElementById('filter-cat-select').value;
      state.productFilters.brand = document.getElementById('filter-brand-select').value;
      state.productFilters.minPrice = document.getElementById('filter-min-price').value;
      state.productFilters.maxPrice = document.getElementById('filter-max-price').value;
      state.productFilters.inStock = document.getElementById('filter-instock-check').checked;

      const specs = {};
      content.querySelectorAll('.spec-filter-select').forEach(sel => {
        if (sel.value) specs[sel.dataset.spec] = sel.value;
      });
      state.productFilters.specs = specs;
      loadStorefrontPage();
    });

    document.getElementById('btn-reset-filters').addEventListener('click', () => {
      state.productFilters = { search: '', categoryId: '', brand: '', minPrice: '', maxPrice: '', inStock: '', sortBy: 'newest', specs: {} };
      loadStorefrontPage();
    });

    document.getElementById('store-search-btn').addEventListener('click', () => {
      state.productFilters.search = document.getElementById('store-search-input').value.trim();
      loadStorefrontPage();
    });
    document.getElementById('store-search-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        state.productFilters.search = e.target.value.trim();
        loadStorefrontPage();
      }
    });

    document.getElementById('store-sort-select').addEventListener('change', (e) => {
      state.productFilters.sortBy = e.target.value;
      loadStorefrontPage();
    });
  }

  // ==========================================
  // Application Bootstrapping
  // ==========================================
  async function init() {
    if (state.token) {
      try {
        const data = await api('/auth/me');
        state.user = data.user;
        state.page = (state.user.role === 'Admin' || state.user.role === 'Staff') ? 'dashboard' : 'storefront';
        renderApp();
        return;
      } catch (_e) {
        setToken('');
      }
    }
    renderAuth();
  }

  init();
})();
