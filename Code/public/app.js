(() => {
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
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
      throw new Error(payload.message || `Request failed (${response.status})`);
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

  function renderAuth() {
    state.authMode = state.authMode === 'register' ? 'register' : 'login';
    const isRegister = state.authMode === 'register';
    app.innerHTML = `
      <main class="auth-layout">
        <section class="auth-intro">
          <div class="brand"><span class="brand-mark">CS</span><span>Computer Shop</span></div>
          <div class="intro-copy">
            <div class="eyebrow">Management workspace</div>
            <h1>Quản lý cửa hàng máy tính, rõ ràng trong từng con số.</h1>
            <p>Đăng nhập để theo dõi hoạt động kinh doanh, doanh thu, đơn hàng và quản lý tài khoản người dùng.</p>
          </div>
          <div class="intro-foot">Computer Shop Management Software · Member 1</div>
        </section>
        <section class="auth-panel">
          <div class="auth-card">
            <h2>${isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h2>
            <p class="subtle">${isRegister ? 'Đăng ký tài khoản khách hàng mới.' : 'Đăng nhập bằng username hoặc email của bạn.'}</p>
            <div class="auth-tabs">
              <button class="auth-tab ${!isRegister ? 'active' : ''}" data-auth-mode="login" type="button">Đăng nhập</button>
              <button class="auth-tab ${isRegister ? 'active' : ''}" data-auth-mode="register" type="button">Đăng ký</button>
            </div>
            <form id="auth-form">
              ${isRegister ? `
                <div class="field"><label for="fullName">Họ và tên</label><input id="fullName" name="fullName" maxlength="100" autocomplete="name" placeholder="Nguyễn Văn A"></div>
              ` : ''}
              <div class="field"><label for="identifier">${isRegister ? 'Tên đăng nhập' : 'Username hoặc email'}</label><input id="identifier" name="${isRegister ? 'username' : 'identifier'}" required autocomplete="${isRegister ? 'username' : 'username'}" placeholder="${isRegister ? 'vd: nguyenvana' : 'Username hoặc email'}"></div>
              ${isRegister ? `
                <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" placeholder="ban@example.com"></div>
                <div class="field"><label for="phone">Số điện thoại</label><input id="phone" name="phone" maxlength="20" autocomplete="tel" placeholder="0900000000"></div>
              ` : ''}
              <div class="field"><label for="password">Mật khẩu</label><input id="password" name="password" type="password" required minlength="${isRegister ? '8' : '1'}" autocomplete="${isRegister ? 'new-password' : 'current-password'}" placeholder="${isRegister ? 'Ít nhất 8 ký tự' : 'Nhập mật khẩu'}"></div>
              <button class="primary-btn" type="submit">${isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
              <div id="auth-error" class="alert" hidden></div>
            </form>
            <p class="subtle auth-note">Đăng ký công khai chỉ tạo tài khoản Customer. Quyền Admin/Staff do quản trị viên cấp.</p>
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
      state.page = state.user.role === 'Admin' ? 'dashboard' : 'account';
      renderApp();
      showToast(isRegister ? 'Tạo tài khoản thành công.' : 'Đăng nhập thành công.');
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      button.disabled = false;
      button.textContent = isRegister ? 'Tạo tài khoản' : 'Đăng nhập';
    }
  }

  function renderApp() {
    if (!state.user) return renderAuth();
    if (state.user.role !== 'Admin') return renderCustomerAccount();

    const pageTitle = state.page === 'users' ? 'Quản lý người dùng' : 'Admin Dashboard';
    app.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="brand"><span class="brand-mark">CS</span><span>Computer Shop</span></div>
          <div class="sidebar-label">Workspace</div>
          <div class="nav-group">
            <button class="nav-btn ${state.page === 'dashboard' ? 'active' : ''}" data-page="dashboard"><span class="nav-symbol">▦</span>Dashboard</button>
            <button class="nav-btn ${state.page === 'users' ? 'active' : ''}" data-page="users"><span class="nav-symbol">♙</span>Người dùng</button>
          </div>
          <div class="sidebar-bottom">
            <div class="user-mini"><div class="avatar">${escapeHtml(initials(state.user))}</div><div><strong>${escapeHtml(state.user.fullName || state.user.username)}</strong><small>Administrator</small></div></div>
            <button class="nav-btn logout" id="logout-btn"><span class="nav-symbol">↪</span>Đăng xuất</button>
          </div>
        </aside>
        <main class="main-panel">
          <header class="topbar"><div><h1>${pageTitle}</h1><p>Computer Shop Management Software</p></div><div class="topbar-right">${escapeHtml(state.user.username)} · Admin</div></header>
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

    if (state.page === 'users') loadUsersPage();
    else loadDashboardPage();
  }

  function renderCustomerAccount() {
    app.innerHTML = `
      <div class="customer-welcome">
        <div class="brand-mark centered-mark">CS</div>
        <h2>Xin chào, ${escapeHtml(state.user.fullName || state.user.username)}!</h2>
        <p class="subtle">Tài khoản của bạn đã được đăng nhập thành công. Khu vực Dashboard và quản lý người dùng chỉ dành cho Admin.</p>
        <p class="subtle"><strong>Username:</strong> ${escapeHtml(state.user.username)}<br><strong>Vai trò:</strong> ${escapeHtml(state.user.role)}</p>
        <button class="ghost-btn" id="logout-btn">Đăng xuất</button>
      </div>`;
    document.getElementById('logout-btn').addEventListener('click', () => logout());
  }

  async function loadDashboardPage() {
    const content = document.getElementById('page-content');
    if (!content) return;
    content.innerHTML = '<div class="empty-state">Đang tải số liệu Dashboard...</div>';
    try {
      const params = new URLSearchParams(state.dateRange);
      state.dashboard = await api(`/admin/dashboard?${params.toString()}`);
      renderDashboard();
    } catch (error) {
      content.innerHTML = `<div class="alert">Không tải được Dashboard: ${escapeHtml(error.message)}</div>`;
    }
  }

  function money(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));
  }

  function renderRevenueChart(rows) {
    if (!rows || rows.length === 0) return '<div class="empty-state">Chưa có dữ liệu doanh thu trong khoảng thời gian này.</div>';
    const width = 760;
    const height = 245;
    const left = 45;
    const right = 12;
    const top = 15;
    const bottom = 36;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const max = Math.max(1, ...rows.map((row) => Number(row.revenue || 0)));
    const step = plotWidth / rows.length;
    const barWidth = Math.max(3, Math.min(22, step * 0.62));
    const grid = [0, 0.5, 1].map((fraction) => {
      const y = top + plotHeight * (1 - fraction);
      return `<line class="chart-grid" x1="${left}" y1="${y}" x2="${width - right}" y2="${y}"/><text class="chart-label" x="${left - 7}" y="${y + 4}" text-anchor="end">${Math.round(max * fraction / 1000000)}m</text>`;
    }).join('');
    const bars = rows.map((row, index) => {
      const value = Number(row.revenue || 0);
      const barHeight = (value / max) * plotHeight;
      const x = left + step * index + (step - barWidth) / 2;
      const y = top + plotHeight - barHeight;
      return `<rect class="chart-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}" height="${Math.max(1, barHeight).toFixed(1)}"><title>${escapeHtml(row.date)} · ${money(value)}</title></rect>${(index % Math.max(1, Math.ceil(rows.length / 7)) === 0 || index === rows.length - 1) ? `<text class="chart-label" x="${(x + barWidth / 2).toFixed(1)}" y="${height - 12}" text-anchor="middle">${escapeHtml(String(row.date).slice(5))}</text>` : ''}`;
    }).join('');
    return `<div class="chart-wrap"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Biểu đồ doanh thu theo ngày">${grid}${bars}</svg></div>`;
  }

  function renderDashboard() {
    const data = state.dashboard;
    const summary = data.summary || {};
    const conversion = data.conversion || {};
    const rate = Math.min(100, Math.max(0, Number(conversion.conversionRatePercent || 0)));
    const recentRows = (data.recentOrders || []).map((order) => `
      <tr>
        <td><strong>#${escapeHtml(order.order_id)}</strong></td>
        <td>${escapeHtml(order.full_name || order.username || 'Customer')}</td>
        <td>${money(order.total_amount)}</td>
        <td><span class="pill ${String(order.status).toLowerCase()}">${escapeHtml(order.status)}</span></td>
        <td>${escapeHtml(new Date(order.created_at).toLocaleString('vi-VN'))}</td>
      </tr>`).join('');

    document.getElementById('page-content').innerHTML = `
      <div class="page-heading">
        <div><h2>Tổng quan kinh doanh</h2><p>Theo dõi doanh thu, đơn hàng và hiệu quả chuyển đổi theo khoảng ngày.</p></div>
        <form class="date-filter" id="date-filter">
          <div class="field"><label for="from-date">Từ ngày</label><input id="from-date" name="from" type="date" value="${escapeHtml(state.dateRange.from)}" required></div>
          <div class="field"><label for="to-date">Đến ngày</label><input id="to-date" name="to" type="date" value="${escapeHtml(state.dateRange.to)}" required></div>
          <button class="secondary-btn" type="submit">Lọc dữ liệu</button>
        </form>
      </div>
      <div class="metrics">
        <article class="metric-card"><div class="metric-top"><span>Tổng doanh thu</span><span class="metric-icon">₫</span></div><div class="metric-value">${money(summary.totalRevenue)}</div><div class="metric-note">Không tính đơn Pending và Cancelled</div></article>
        <article class="metric-card"><div class="metric-top"><span>Tổng đơn hàng</span><span class="metric-icon">▤</span></div><div class="metric-value">${Number(summary.totalOrders || 0).toLocaleString('vi-VN')}</div><div class="metric-note">Tất cả trạng thái trong kỳ</div></article>
        <article class="metric-card"><div class="metric-top"><span>Đơn chờ xử lý</span><span class="metric-icon">◷</span></div><div class="metric-value">${Number(summary.pendingOrders || 0).toLocaleString('vi-VN')}</div><div class="metric-note">Trạng thái Pending</div></article>
        <article class="metric-card"><div class="metric-top"><span>Đơn hoàn thành</span><span class="metric-icon">✓</span></div><div class="metric-value">${Number(summary.completedOrders || 0).toLocaleString('vi-VN')}</div><div class="metric-note">Trạng thái Completed</div></article>
      </div>
      <div class="dashboard-grid">
        <section class="panel"><div class="panel-heading"><div><h3>Doanh thu theo ngày</h3><p>Đơn vị hiển thị trên trục dọc: triệu VND</p></div></div>${renderRevenueChart(data.revenueByDay)}</section>
        <section class="panel"><div class="panel-heading"><div><h3>Tỷ lệ chuyển đổi</h3><p>Phiên truy cập có đơn hàng không bị hủy</p></div></div>
          <div class="conversion-card"><svg class="conversion-svg" viewBox="0 0 140 140" role="img" aria-label="Tỷ lệ chuyển đổi ${rate.toFixed(2)} phần trăm"><circle class="gauge-track" cx="70" cy="70" r="55"/><circle class="gauge-progress" cx="70" cy="70" r="55" stroke-dasharray="345.58" stroke-dashoffset="${(345.58 * (1 - rate / 100)).toFixed(2)}" transform="rotate(-90 70 70)"/><text class="gauge-value" x="70" y="67">${rate.toFixed(2)}%</text><text class="gauge-label" x="70" y="84">Conversion</text></svg><div class="conversion-caption">${Number(conversion.convertedSessions || 0)} phiên có chuyển đổi trên ${Number(conversion.trackedSessions || 0)} phiên được theo dõi</div></div>
        </section>
      </div>
      <section class="panel table-panel"><div class="panel-heading"><div><h3>Đơn hàng gần đây</h3><p>Tối đa 10 đơn hàng mới nhất trong kỳ đã chọn</p></div></div>
        <div class="table-wrap"><table><thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Giá trị</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>${recentRows || '<tr><td colspan="5" class="empty-state">Chưa có đơn hàng trong khoảng thời gian này.</td></tr>'}</tbody></table></div>
      </section>`;

    document.getElementById('date-filter').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const from = String(form.get('from'));
      const to = String(form.get('to'));
      if (from > to) return showToast('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.');
      state.dateRange = { from, to };
      loadDashboardPage();
    });
  }

  async function loadUsersPage() {
    const content = document.getElementById('page-content');
    if (!content) return;
    content.innerHTML = '<div class="empty-state">Đang tải danh sách người dùng...</div>';
    try {
      const params = new URLSearchParams({
        page: String(state.pagination.page), limit: String(state.pagination.limit),
        search: state.userFilters.search, role: state.userFilters.role,
        isActive: state.userFilters.isActive,
      });
      const data = await api(`/users?${params.toString()}`);
      state.users = data.users || [];
      state.pagination = data.pagination || state.pagination;
      renderUsers();
    } catch (error) {
      content.innerHTML = `<div class="alert">Không tải được danh sách người dùng: ${escapeHtml(error.message)}</div>`;
    }
  }

  function renderUsers() {
    const rows = state.users.map((user) => {
      const isSelf = Number(user.user_id) === Number(state.user.userId);
      return `<tr>
        <td><strong>${escapeHtml(user.full_name || user.username)}</strong><br><span class="subtle">@${escapeHtml(user.username)}</span></td>
        <td>${escapeHtml(user.email || '—')}<br><span class="subtle">${escapeHtml(user.phone || '')}</span></td>
        <td><select class="user-role-select" data-role-user="${Number(user.user_id)}" ${isSelf ? 'disabled title="Bạn không thể đổi vai trò của chính mình"' : ''}>
          ${['Admin', 'Staff', 'Customer'].map((role) => `<option value="${role}" ${user.role === role ? 'selected' : ''}>${role}</option>`).join('')}
        </select></td>
        <td><span class="pill ${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Đang hoạt động' : 'Đã khóa'}</span></td>
        <td>${user.last_login_at ? escapeHtml(new Date(user.last_login_at).toLocaleString('vi-VN')) : 'Chưa đăng nhập'}</td>
        <td><button class="${user.is_active ? 'danger-btn' : 'secondary-btn'}" data-status-user="${Number(user.user_id)}" data-next-status="${!user.is_active}" ${isSelf ? 'disabled title="Bạn không thể khóa tài khoản của chính mình"' : ''}>${user.is_active ? 'Khóa' : 'Mở khóa'}</button></td>
      </tr>`;
    }).join('');

    document.getElementById('page-content').innerHTML = `
      <div class="page-heading"><div><h2>Quản lý người dùng</h2><p>Tìm kiếm tài khoản, phân quyền và kiểm soát trạng thái hoạt động.</p></div><span class="pill">${Number(state.pagination.total || 0)} tài khoản</span></div>
      <section class="panel">
        <form class="toolbar" id="user-filter">
          <input name="search" type="search" placeholder="Tìm username, tên hoặc email..." value="${escapeHtml(state.userFilters.search)}">
          <select name="role"><option value="">Tất cả vai trò</option>${['Admin', 'Staff', 'Customer'].map((role) => `<option value="${role}" ${state.userFilters.role === role ? 'selected' : ''}>${role}</option>`).join('')}</select>
          <select name="isActive"><option value="">Mọi trạng thái</option><option value="true" ${state.userFilters.isActive === 'true' ? 'selected' : ''}>Đang hoạt động</option><option value="false" ${state.userFilters.isActive === 'false' ? 'selected' : ''}>Đã khóa</option></select>
          <button class="secondary-btn" type="submit">Tìm kiếm</button>
          <button class="ghost-btn" type="button" id="clear-user-filter">Xóa lọc</button>
        </form>
        <div class="table-wrap"><table><thead><tr><th>Người dùng</th><th>Liên hệ</th><th>Vai trò</th><th>Trạng thái</th><th>Lần đăng nhập cuối</th><th>Thao tác</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="empty-state">Không tìm thấy người dùng phù hợp.</td></tr>'}</tbody></table></div>
        <div class="table-foot"><span>Trang ${Number(state.pagination.page || 1)} / ${Math.max(1, Number(state.pagination.totalPages || 1))}</span><div class="pagination"><button class="ghost-btn" id="previous-page" ${state.pagination.page <= 1 ? 'disabled' : ''}>Trước</button><button class="ghost-btn" id="next-page" ${state.pagination.page >= state.pagination.totalPages ? 'disabled' : ''}>Tiếp</button></div></div>
      </section>`;

    document.getElementById('user-filter').addEventListener('submit', (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      state.userFilters = { search: String(form.get('search') || '').trim(), role: String(form.get('role') || ''), isActive: String(form.get('isActive') || '') };
      state.pagination.page = 1;
      loadUsersPage();
    });
    document.getElementById('clear-user-filter').addEventListener('click', () => {
      state.userFilters = { search: '', role: '', isActive: '' };
      state.pagination.page = 1;
      loadUsersPage();
    });
    document.getElementById('previous-page').addEventListener('click', () => {
      state.pagination.page = Math.max(1, state.pagination.page - 1);
      loadUsersPage();
    });
    document.getElementById('next-page').addEventListener('click', () => {
      state.pagination.page = Math.min(state.pagination.totalPages, state.pagination.page + 1);
      loadUsersPage();
    });
    document.querySelectorAll('[data-role-user]').forEach((select) => {
      select.addEventListener('change', async () => {
        const userId = select.dataset.roleUser;
        const newRole = select.value;
        select.disabled = true;
        try {
          await api(`/users/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) });
          showToast('Đã cập nhật vai trò người dùng.');
          loadUsersPage();
        } catch (error) {
          showToast(error.message);
          loadUsersPage();
        }
      });
    });
    document.querySelectorAll('[data-status-user]').forEach((button) => {
      button.addEventListener('click', async () => {
        const userId = button.dataset.statusUser;
        const isActive = button.dataset.nextStatus === 'true';
        button.disabled = true;
        try {
          await api(`/users/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
          showToast(isActive ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.');
          loadUsersPage();
        } catch (error) {
          showToast(error.message);
          loadUsersPage();
        }
      });
    });
  }

  async function bootstrap() {
    if (!state.token) return renderAuth();
    try {
      const data = await api('/auth/me');
      state.user = data;
      state.page = state.user.role === 'Admin' ? 'dashboard' : 'account';
      renderApp();
    } catch (_error) {
      setToken('');
      state.user = null;
      renderAuth();
    }
  }

  bootstrap();
})();
