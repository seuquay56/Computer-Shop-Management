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

  function getOrCreateSessionId() {
    let sid = sessionStorage.getItem('computerShopSessionId');
    if (!sid) {
      sid = (window.crypto && typeof window.crypto.randomUUID === 'function')
        ? window.crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem('computerShopSessionId', sid);
    }
    return sid;
  }

  function loadStoredCart() {
    try {
      const raw = localStorage.getItem('computerShopCart');
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_e) {
      return [];
    }
  }

  const state = {
    token: sessionStorage.getItem('computerShopToken') || '',
    sessionId: getOrCreateSessionId(),
    visitTracked: false,
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
    // Member 3 State (Cart, SePay VietQR Checkout & Order Tracking)
    cart: loadStoredCart(),
    cartValidation: null,
    selectedPaymentMethod: 'VietQR',
    myOrders: [],
    adminOrders: [],
    adminOrderFilter: { status: '', paymentMethod: '', search: '' },
    paymentPollTimer: null,
    paymentCountdownTimer: null,
  };

  function saveCart() {
    localStorage.setItem('computerShopCart', JSON.stringify(state.cart));
  }

  function getCartCount() {
    return state.cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  }

  function clearPaymentTimers() {
    if (state.paymentPollTimer) {
      window.clearInterval(state.paymentPollTimer);
      state.paymentPollTimer = null;
    }
    if (state.paymentCountdownTimer) {
      window.clearInterval(state.paymentCountdownTimer);
      state.paymentCountdownTimer = null;
    }
  }

  async function ensureVisitTracked() {
    if (state.visitTracked) return;
    state.visitTracked = true;
    try {
      await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId }),
      });
    } catch (_ignored) {}
  }

  function addToCart(product, variant, qty = 1) {
    if (!variant) return showToast('Vui lòng chọn biến thể sản phẩm.');
    const maxStock = Number(variant.stock_quantity || 0);
    if (maxStock <= 0) return showToast('Biến thể này hiện đã hết hàng.');

    const existing = state.cart.find((c) => Number(c.variantId) === Number(variant.variant_id));
    if (existing) {
      if (existing.quantity + qty > maxStock) {
        existing.quantity = maxStock;
        saveCart();
        showToast(`Đã đạt số lượng tối đa trong kho (${maxStock} sản phẩm).`);
        renderApp();
        return;
      }
      existing.quantity += qty;
    } else {
      state.cart.push({
        variantId: Number(variant.variant_id),
        productId: Number(product.product_id),
        productName: product.name,
        brand: product.brand,
        categoryName: product.category_name,
        imageUrl: product.image_url || '',
        sku: variant.sku,
        unitPrice: Number(variant.price),
        stockQuantity: maxStock,
        quantity: Math.min(qty, maxStock),
      });
    }
    saveCart();
    showToast(`Đã thêm ${product.name} (${variant.sku}) vào giỏ hàng.`);
    renderApp();
  }

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

  function removeVietnameseTones(str) {
    return String(str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  }

  function formatPaymentMethodName(method) {
    if (method === 'VietQR' || method === 'ChuyenKhoan') return 'Chuyển khoản';
    if (method === 'COD') return 'Thanh toán khi nhận hàng (COD)';
    if (method === 'ZaloPay') return 'Ví điện tử ZaloPay';
    return method || 'Chuyển khoản';
  }

  const VN_LOCATIONS = {
    'TP. Hồ Chí Minh': [
      'Phường Bến Nghé, Quận 1', 'Phường Bến Thành, Quận 1', 'Phường Cầu Kho, Quận 1', 'Phường Đa Kao, Quận 1',
      'Phường Võ Thị Sáu, Quận 3', 'Phường 1, Quận 3', 'Phường 9, Quận 3',
      'Phường 1, Quận 5', 'Phường 5, Quận 5', 'Phường 11, Quận 5',
      'Phường Tân Hưng, Quận 7', 'Phường Tân Phong, Quận 7', 'Phường Phú Mỹ, Quận 7', 'Phường Tân Thuận Đông, Quận 7',
      'Phường 12, Quận 10', 'Phường 14, Quận 10', 'Phường 15, Quận 10',
      'Phường An Phú, TP. Thủ Đức', 'Phường Thảo Điền, TP. Thủ Đức', 'Phường Linh Trung, TP. Thủ Đức', 'Phường Hiệp Phú, TP. Thủ Đức',
      'Phường 1, Quận Bình Thạnh', 'Phường 25, Quận Bình Thạnh', 'Phường 26, Quận Bình Thạnh',
      'Phường 2, Quận Tân Bình', 'Phường 13, Quận Tân Bình', 'Phường 15, Quận Tân Bình',
      'Phường 10, Quận Gò Vấp', 'Phường 11, Quận Gò Vấp', 'Phường 3, Quận Phú Nhuận'
    ],
    'Hà Nội': [
      'Phường Hàng Trống, Quận Hoàn Kiếm', 'Phường Tràng Tiền, Quận Hoàn Kiếm', 'Phường Cửa Nam, Quận Hoàn Kiếm',
      'Phường Điện Biên, Quận Ba Đình', 'Phường Kim Mã, Quận Ba Đình', 'Phường Liễu Giai, Quận Ba Đình',
      'Phường Dịch Vọng Hậu, Quận Cầu Giấy', 'Phường Nghĩa Đô, Quận Cầu Giấy', 'Phường Yên Hòa, Quận Cầu Giấy',
      'Phường Văn Miếu, Quận Đống Đa', 'Phường Ô Chợ Dừa, Quận Đống Đa', 'Phường Láng Hạ, Quận Đống Đa',
      'Phường Bách Khoa, Quận Hai Bà Trưng', 'Phường Đồng Tâm, Quận Hai Bà Trưng',
      'Phường Khương Mai, Quận Thanh Xuân', 'Phường Thanh Xuân Bắc, Quận Thanh Xuân',
      'Phường Bưởi, Quận Tây Hồ', 'Phường Thụy Khuê, Quận Tây Hồ',
      'Phường Hoàng Liệt, Quận Hoàng Mai', 'Phường Định Công, Quận Hoàng Mai'
    ],
    'Đà Nẵng': [
      'Phường Hải Châu 1, Quận Hải Châu', 'Phường Thạch Thang, Quận Hải Châu', 'Phường Hòa Thuận Đông, Quận Hải Châu',
      'Phường Vĩnh Trung, Quận Thanh Khê', 'Phường Tam Thuận, Quận Thanh Khê',
      'Phường An Hải Bắc, Quận Sơn Trà', 'Phường Phước Mỹ, Quận Sơn Trà',
      'Phường Mỹ An, Quận Ngũ Hành Sơn', 'Phường Khuê Mỹ, Quận Ngũ Hành Sơn',
      'Phường Khuê Trung, Quận Cẩm Lệ', 'Phường Hòa Khánh Bắc, Quận Liên Chiểu'
    ],
    'Hải Phòng': [
      'Phường Hoàng Văn Thụ, Quận Hồng Bàng', 'Phường Hạ Lý, Quận Hồng Bàng',
      'Phường Máy Tơ, Quận Ngô Quyền', 'Phường Cầu Đất, Quận Ngô Quyền',
      'Phường Cát Dài, Quận Lê Chân', 'Phường An Dương, Quận Lê Chân',
      'Phường Đằng Hải, Quận Hải An', 'Phường Đông Hải 1, Quận Hải An'
    ],
    'Cần Thơ': [
      'Phường An Phú, Quận Ninh Kiều', 'Phường Xuân Khánh, Quận Ninh Kiều', 'Phường Tân An, Quận Ninh Kiều',
      'Phường Hưng Phú, Quận Cái Răng', 'Phường Lê Bình, Quận Cái Răng',
      'Phường Bình Thủy, Quận Bình Thủy', 'Phường An Thới, Quận Bình Thủy'
    ],
    'Bình Dương': [
      'Phường Phú Cường, TP. Thủ Dầu Một', 'Phường Hiệp Thành, TP. Thủ Dầu Một', 'Phường Phú Hòa, TP. Thủ Dầu Một',
      'Phường Dĩ An, TP. Dĩ An', 'Phường Tân Bình, TP. Dĩ An', 'Phường Đông Hòa, TP. Dĩ An',
      'Phường Lái Thiêu, TP. Thuận An', 'Phường An Phú, TP. Thuận An'
    ],
    'Đồng Nai': [
      'Phường Quyết Thắng, TP. Biên Hòa', 'Phường Tân Tiến, TP. Biên Hòa', 'Phường Thống Nhất, TP. Biên Hòa',
      'Phường Long Bình, TP. Biên Hòa', 'Phường Xuân An, TP. Long Khánh'
    ],
    'Bà Rịa - Vũng Tàu': [
      'Phường 1, TP. Vũng Tàu', 'Phường Thắng Tam, TP. Vũng Tàu', 'Phường 7, TP. Vũng Tàu',
      'Phường Phước Trung, TP. Bà Rịa', 'Phường Long Toàn, TP. Bà Rịa'
    ],
    'Khánh Hòa': [
      'Phường Lộc Thọ, TP. Nha Trang', 'Phường Vĩnh Nguyên, TP. Nha Trang', 'Phường Phước Tân, TP. Nha Trang',
      'Phường Cam Ranh, TP. Cam Ranh'
    ],
    'Thừa Thiên Huế': [
      'Phường Phú Nhuận, TP. Huế', 'Phường Vĩnh Ninh, TP. Huế', 'Phường Thuận Thành, TP. Huế'
    ],
    'Quảng Ninh': [
      'Phường Bãi Cháy, TP. Hạ Long', 'Phường Hồng Gai, TP. Hạ Long', 'Phường Cẩm Trung, TP. Cẩm Phả'
    ],
    'Lâm Đồng': [
      'Phường 1, TP. Đà Lạt', 'Phường 2, TP. Đà Lạt', 'Phường 8, TP. Đà Lạt', 'Phường 1, TP. Bảo Lộc'
    ],
    'Kiên Giang': [
      'Phường Vĩnh Thanh Vân, TP. Rạch Giá', 'Phường Dương Đông, TP. Phú Quốc', 'Phường An Thới, TP. Phú Quốc'
    ],
    'Nghệ An': [
      'Phường Trường Thi, TP. Vinh', 'Phường Lê Lợi, TP. Vinh', 'Phường Quang Trung, TP. Vinh'
    ],
    'Thanh Hóa': [
      'Phường Điện Biên, TP. Thanh Hóa', 'Phường Ba Đình, TP. Thanh Hóa', 'Phường Lam Sơn, TP. Thanh Hóa'
    ],
    'Bắc Ninh': [
      'Phường Suối Hoa, TP. Bắc Ninh', 'Phường Tiền An, TP. Bắc Ninh', 'Phường Đại Phúc, TP. Bắc Ninh'
    ],
    'Tiền Giang': [
      'Phường 1, TP. Mỹ Tho', 'Phường 4, TP. Mỹ Tho', 'Phường 7, TP. Mỹ Tho'
    ],
    'An Giang': [
      'Phường Mỹ Long, TP. Long Xuyên', 'Phường Mỹ Bình, TP. Long Xuyên', 'Phường Châu Phú A, TP. Châu Đốc'
    ]
  };

  function createSearchableDropdown({
    container,
    options = [],
    placeholder = 'Chọn một mục...',
    value = '',
    searchPlaceholder = 'Tìm kiếm nhanh...',
    onSelect = () => {},
  }) {
    container.classList.add('custom-search-dropdown');
    let currentOptions = [...options];
    let selectedOption = currentOptions.find(o => String(o.value) === String(value));
    let currentVal = selectedOption ? selectedOption.value : (value || '');
    let currentLabel = selectedOption ? selectedOption.label : placeholder;
    let isPlaceholder = !selectedOption;

    container.innerHTML = `
      <button type="button" class="csd-trigger">
        <span class="csd-label ${isPlaceholder ? 'placeholder' : ''}">${escapeHtml(currentLabel)}</span>
        <i class="bi bi-chevron-down csd-chevron"></i>
      </button>
      <input type="hidden" class="csd-hidden-input" value="${escapeHtml(String(currentVal))}">
      <div class="csd-menu">
        <div class="csd-search-wrap">
          <i class="bi bi-search"></i>
          <input type="text" class="csd-search-input" placeholder="${escapeHtml(searchPlaceholder)}">
        </div>
        <div class="csd-list"></div>
      </div>
    `;

    const trigger = container.querySelector('.csd-trigger');
    const labelEl = container.querySelector('.csd-label');
    const hiddenInput = container.querySelector('.csd-hidden-input');
    const searchInput = container.querySelector('.csd-search-input');
    const listEl = container.querySelector('.csd-list');

    function renderList(items) {
      if (!items.length) {
        listEl.innerHTML = '<div class="csd-empty">Không tìm thấy kết quả phù hợp.</div>';
        return;
      }
      listEl.innerHTML = items.map(o => {
        const isActive = String(o.value) === String(hiddenInput.value);
        return `
          <div class="csd-item ${isActive ? 'active' : ''}" data-value="${escapeHtml(String(o.value))}">
            <div style="min-width:0; flex:1;">
              <div style="font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(o.label)}</div>
              ${o.sublabel ? `<small class="subtle" style="font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(o.sublabel)}</small>` : ''}
            </div>
            ${isActive ? '<i class="bi bi-check2" style="font-size:16px; color:#0f766e; flex-shrink:0;"></i>' : ''}
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.csd-item').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const chosenVal = el.dataset.value;
          const opt = currentOptions.find(o => String(o.value) === String(chosenVal));
          if (opt) {
            hiddenInput.value = opt.value;
            labelEl.textContent = opt.label;
            labelEl.classList.remove('placeholder');
            closeMenu();
            onSelect(opt.value, opt);
          }
        });
      });
    }

    function openMenu() {
      document.querySelectorAll('.custom-search-dropdown.open').forEach(el => {
        if (el !== container) el.classList.remove('open');
      });
      container.classList.add('open');
      searchInput.value = '';
      renderList(currentOptions);
      setTimeout(() => searchInput.focus(), 50);
    }

    function closeMenu() {
      container.classList.remove('open');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      if (container.classList.contains('open')) closeMenu();
      else openMenu();
    });

    searchInput.addEventListener('click', (e) => e.stopPropagation());
    searchInput.addEventListener('input', (e) => {
      const q = removeVietnameseTones(e.target.value.toLowerCase().trim());
      const filtered = currentOptions.filter(o => {
        const text = removeVietnameseTones(`${o.label} ${o.sublabel || ''} ${o.value}`).toLowerCase();
        return text.includes(q);
      });
      renderList(filtered);
    });

    renderList(currentOptions);

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) closeMenu();
    });

    return {
      getValue: () => hiddenInput.value,
      setValue: (newVal) => {
        hiddenInput.value = newVal;
        const opt = currentOptions.find(o => String(o.value) === String(newVal));
        if (opt) {
          labelEl.textContent = opt.label;
          labelEl.classList.remove('placeholder');
        } else {
          labelEl.textContent = placeholder;
          labelEl.classList.add('placeholder');
        }
        renderList(currentOptions);
      },
      updateOptions: (newOptions, resetVal = false) => {
        currentOptions = [...newOptions];
        if (resetVal) {
          hiddenInput.value = '';
          labelEl.textContent = placeholder;
          labelEl.classList.add('placeholder');
        }
        renderList(currentOptions);
      }
    };
  }

  function renderOrderItemsPreview(items) {
    if (!items || !items.length) return '';
    const visible = items.slice(0, 3);
    const hidden = items.slice(3);
    const hasMore = hidden.length > 0;

    return `
      <div class="order-items-preview">
        ${visible.map(i => `
          <div class="order-item-mini">
            <div class="order-item-mini-info">
              ${i.image_url ? `<img src="${escapeHtml(i.image_url)}" class="order-item-mini-img" alt="${escapeHtml(i.product_name)}">` : ''}
              <div style="min-width:0;">
                <div class="order-item-mini-name" title="${escapeHtml(i.product_name)}">${escapeHtml(i.product_name)}</div>
                <small class="subtle">Mã: <code>${escapeHtml(i.sku || 'SKU')}</code> · SL: <strong>${i.quantity}</strong></small>
              </div>
            </div>
            <div class="order-item-mini-price">${escapeHtml(formatCurrency(i.unit_price * i.quantity))}</div>
          </div>
        `).join('')}
        ${hasMore ? `
          <div class="order-items-hidden" style="display:none; flex-direction:column; gap:8px;">
            ${hidden.map(i => `
              <div class="order-item-mini">
                <div class="order-item-mini-info">
                  ${i.image_url ? `<img src="${escapeHtml(i.image_url)}" class="order-item-mini-img" alt="${escapeHtml(i.product_name)}">` : ''}
                  <div style="min-width:0;">
                    <div class="order-item-mini-name" title="${escapeHtml(i.product_name)}">${escapeHtml(i.product_name)}</div>
                    <small class="subtle">Mã: <code>${escapeHtml(i.sku || 'SKU')}</code> · SL: <strong>${i.quantity}</strong></small>
                  </div>
                </div>
                <div class="order-item-mini-price">${escapeHtml(formatCurrency(i.unit_price * i.quantity))}</div>
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn-expand-order-items">
            <i class="bi bi-chevron-down"></i> Xem thêm ${hidden.length} sản phẩm khác
          </button>
        ` : ''}
      </div>
    `;
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
          <div class="brand"><span class="brand-mark">TZ</span><span>TechZone Computer</span></div>
          <div class="intro-copy">
            <div class="eyebrow">Hệ thống Phân phối Linh kiện TechZone</div>
            <h1>Cửa hàng Linh kiện Máy tính & PC Gaming Chính Hãng.</h1>
            <p>Hệ thống cung cấp phần cứng máy tính hàng đầu: CPU Gen mới, Card đồ họa RTX, Bo mạch chủ, RAM DDR5 với bảo hành 36 tháng chính hãng.</p>
          </div>
          <div class="intro-foot">TechZone Computer · Hệ Thống Bán Lẻ Công Nghệ Cao</div>
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
              <button class="ghost-btn" id="guest-catalog-btn" type="button"><i class="bi bi-arrow-left"></i> Quay lại Cửa Hàng (Chế độ Khách)</button>
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
      state.page = (state.user.role === 'Admin') ? 'dashboard' : (state.user.role === 'Staff' ? 'products' : 'storefront');
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
    clearPaymentTimers();
    if (!state.user && !state.token) {
      state.user = { role: 'Customer', username: 'guest', fullName: 'Khách vãng lai' };
    }

    const isStaffOrAdmin = state.user?.role === 'Admin' || state.user?.role === 'Staff';
    const isAdmin = state.user?.role === 'Admin';
    const isGuest = !state.token;
    const cartCount = getCartCount();
    const isStorefrontMode = ['storefront', 'product-detail', 'cart', 'orders'].includes(state.page);

    if (isStorefrontMode) {
      // Storefront Shell (GearVN Style Header, Category Strip, Full Width)
      app.innerHTML = `
        <div class="store-shell">
          <!-- GearVN Style Header -->
          <header class="gvn-header">
            <div class="gvn-header-container">
              <div class="gvn-brand" id="gvn-header-logo-btn" title="Về trang chủ TechZone">
                <div class="gvn-brand-icon">
                  <i class="bi bi-cpu-fill"></i>
                </div>
                <div class="gvn-brand-text">
                  <span class="gvn-brand-name">TECHZONE</span>
                  <span class="gvn-brand-sub">COMPUTER</span>
                </div>
              </div>

              <div class="gvn-search-wrap">
                <input type="text" class="gvn-search-input" id="gvn-header-search" placeholder="Bạn cần tìm gì?" autocomplete="off" value="${escapeHtml(state.productFilters.search || '')}">
                <button class="gvn-search-btn" id="gvn-header-search-btn" type="button" aria-label="Tìm kiếm">
                  <i class="bi bi-search"></i>
                </button>
              </div>

              <div class="gvn-header-actions">
                <!-- Tra cứu đơn hàng -->
                <button class="gvn-nav-link" id="gvn-btn-orders" type="button">
                  <i class="bi bi-card-checklist"></i>
                  <span>Tra cứu<br>đơn hàng</span>
                </button>

                <!-- Giỏ hàng -->
                <button class="gvn-pill-btn" id="gvn-btn-cart" type="button">
                  <i class="bi bi-cart3"></i>
                  <span>Giỏ hàng</span>
                  <span class="gvn-cart-badge">${cartCount}</span>
                </button>

                <!-- Đăng nhập / Tài khoản -->
                ${isGuest ? `
                  <button class="gvn-pill-btn" id="gvn-btn-login" type="button">
                    <i class="bi bi-person"></i>
                    <span>Đăng nhập</span>
                  </button>
                ` : `
                  <div class="gvn-user-dropdown-wrap">
                    <button class="gvn-pill-btn" id="gvn-btn-user" type="button">
                      <i class="bi bi-person-circle"></i>
                      <span>${escapeHtml(state.user?.fullName?.split(' ').pop() || state.user?.username || 'Tài khoản')}</span>
                    </button>
                    <div class="gvn-user-menu" id="gvn-user-menu">
                      <div class="gvn-user-menu-header">
                        <strong>${escapeHtml(state.user?.fullName || state.user?.username)}</strong>
                        <div class="subtle">${escapeHtml(state.user?.role || 'Customer')}</div>
                      </div>
                      <button class="gvn-user-menu-item" id="menu-btn-orders"><i class="bi bi-receipt"></i> Đơn hàng của tôi</button>
                      ${isStaffOrAdmin ? `<button class="gvn-user-menu-item" id="menu-btn-admin"><i class="bi bi-speedometer2"></i> Phân hệ Quản trị</button>` : ''}
                      <button class="gvn-user-menu-item danger" id="menu-btn-logout"><i class="bi bi-box-arrow-right"></i> Đăng xuất</button>
                    </div>
                  </div>
                `}

                ${isStaffOrAdmin ? `
                  <button class="gvn-admin-switch-btn" id="gvn-btn-switch-admin" title="Vào trang Quản trị">
                    <i class="bi bi-gear-fill"></i> Quản trị
                  </button>
                ` : ''}
              </div>
            </div>
          </header>

          <!-- Category Navigation Strip -->
          <nav class="gvn-cat-nav">
            <div class="gvn-cat-nav-container">
              <div class="gvn-cat-strip" id="gvn-cat-strip">
                <button class="gvn-cat-pill ${!state.productFilters.categoryId ? 'active' : ''}" data-cat-id="">
                  <i class="bi bi-grid-fill"></i>
                  <span>Tất cả sản phẩm</span>
                </button>
                ${(state.categories || []).map(c => `
                  <button class="gvn-cat-pill ${String(state.productFilters.categoryId) === String(c.category_id) ? 'active' : ''}" data-cat-id="${c.category_id}">
                    <i class="bi ${getCategoryBootstrapIcon(c.name)}"></i>
                    <span>${escapeHtml(c.name)}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </nav>

          <!-- Main Content Body -->
          <main class="content" id="page-content" style="max-width: 1400px; padding: 22px 20px 60px;">
            <div class="empty-state">Đang tải dữ liệu...</div>
          </main>
        </div>`;

      // Header event listeners
      document.getElementById('gvn-header-logo-btn')?.addEventListener('click', () => {
        state.page = 'storefront';
        renderApp();
      });

      const searchInput = document.getElementById('gvn-header-search');
      const searchBtn = document.getElementById('gvn-header-search-btn');
      const triggerSearch = () => {
        state.productFilters.search = searchInput ? searchInput.value.trim() : '';
        state.page = 'storefront';
        renderApp();
      };
      searchBtn?.addEventListener('click', triggerSearch);
      searchInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerSearch();
      });

      document.getElementById('gvn-btn-orders')?.addEventListener('click', () => {
        if (isGuest) {
          showToast('Vui lòng đăng nhập để tra cứu lịch sử đơn hàng của bạn.');
          renderAuth();
        } else {
          state.page = 'orders';
          renderApp();
        }
      });

      document.getElementById('gvn-btn-cart')?.addEventListener('click', () => {
        state.page = 'cart';
        renderApp();
      });

      document.getElementById('gvn-btn-login')?.addEventListener('click', () => {
        renderAuth();
      });

      const userBtn = document.getElementById('gvn-btn-user');
      const userMenu = document.getElementById('gvn-user-menu');
      if (userBtn && userMenu) {
        userBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          userMenu.classList.toggle('show');
        });
        document.addEventListener('click', () => userMenu.classList.remove('show'));
        document.getElementById('menu-btn-orders')?.addEventListener('click', () => {
          state.page = 'orders';
          renderApp();
        });
        document.getElementById('menu-btn-admin')?.addEventListener('click', () => {
          state.page = isAdmin ? 'dashboard' : 'products';
          renderApp();
        });
        document.getElementById('menu-btn-logout')?.addEventListener('click', () => logout(true));
      }

      document.getElementById('gvn-btn-switch-admin')?.addEventListener('click', () => {
        state.page = isAdmin ? 'dashboard' : 'products';
        renderApp();
      });

      document.querySelectorAll('#gvn-cat-strip .gvn-cat-pill').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.productFilters.categoryId = btn.dataset.catId || '';
          state.productFilters.specs = {};
          state.page = 'storefront';
          renderApp();
        });
      });
    } else {
      // Admin Shell (Left Sidebar for staff/admin tasks)
      let pageTitle = 'Dashboard';
      if (state.page === 'users') pageTitle = 'Quản lý Người dùng & Phân quyền RBAC';
      else if (state.page === 'products') pageTitle = 'Quản lý Linh kiện & Thông số Kỹ thuật (Specs)';
      else if (state.page === 'inventory') pageTitle = 'Quản lý Kho hàng & Cảnh báo Tồn kho';
      else if (state.page === 'admin-orders') pageTitle = 'Quản lý & Xử lý Đơn hàng';

      app.innerHTML = `
        <div class="app-shell">
          <aside class="sidebar">
            <div class="brand"><span class="brand-mark">TZ</span><span>TechZone Computer</span></div>
            <div style="padding: 0 10px 14px;">
              <button class="btn-secondary" id="btn-admin-to-store" style="width:100%; justify-content:center; font-size:12px; font-weight:700;">
                <i class="bi bi-shop"></i> Về Cửa Hàng
              </button>
            </div>
            <div class="sidebar-label">Phân hệ Quản trị</div>
            <div class="nav-group">
              ${isAdmin ? `<button class="nav-btn ${state.page === 'dashboard' ? 'active' : ''}" data-page="dashboard"><i class="bi bi-speedometer2"></i> Dashboard</button>` : ''}
              <button class="nav-btn ${state.page === 'products' ? 'active' : ''}" data-page="products"><i class="bi bi-box-seam"></i> Linh kiện & Specs</button>
              <button class="nav-btn ${state.page === 'inventory' ? 'active' : ''}" data-page="inventory"><i class="bi bi-tags"></i> Kho hàng & Tồn</button>
              <button class="nav-btn ${state.page === 'admin-orders' ? 'active' : ''}" data-page="admin-orders"><i class="bi bi-truck"></i> Xử lý Đơn hàng</button>
              ${isAdmin ? `<button class="nav-btn ${state.page === 'users' ? 'active' : ''}" data-page="users"><i class="bi bi-people"></i> Người dùng & RBAC</button>` : ''}
            </div>
            <div class="sidebar-bottom">
              <div class="user-mini">
                <div class="avatar">${escapeHtml(initials(state.user))}</div>
                <div>
                  <strong>${escapeHtml(state.user?.fullName || state.user?.username || 'Staff')}</strong>
                  <small>${escapeHtml(state.user?.role || 'Staff')}</small>
                </div>
              </div>
              <button class="nav-btn logout" id="logout-btn"><i class="bi bi-box-arrow-right"></i> Đăng xuất</button>
            </div>
          </aside>
          <main class="main-panel">
            <header class="topbar">
              <div>
                <h1>${pageTitle}</h1>
                <p>Hệ thống Quản lý Bán hàng & Phân quyền nội bộ TechZone</p>
              </div>
              <div class="topbar-right" style="display:flex; align-items:center; gap:12px;">
                <button class="secondary-btn" id="topbar-to-store-btn" type="button">
                  <i class="bi bi-shop"></i> Xem Cửa Hàng
                </button>
                <span>${escapeHtml(state.user?.username || 'User')} · <span class="badge badge-in-stock">${escapeHtml(state.user?.role || 'Staff')}</span></span>
              </div>
            </header>
            <section class="content" id="page-content"><div class="empty-state">Đang tải dữ liệu...</div></section>
          </main>
        </div>`;

      document.getElementById('btn-admin-to-store')?.addEventListener('click', () => {
        state.page = 'storefront';
        renderApp();
      });
      document.getElementById('topbar-to-store-btn')?.addEventListener('click', () => {
        state.page = 'storefront';
        renderApp();
      });
      app.querySelectorAll('[data-page]').forEach((button) => {
        button.addEventListener('click', () => {
          state.page = button.dataset.page;
          renderApp();
        });
      });
      document.getElementById('logout-btn')?.addEventListener('click', () => logout(true));
    }

    if (state.page === 'dashboard') loadDashboardPage();
    else if (state.page === 'users') loadUsersPage();
    else if (state.page === 'products') loadProductsPage();
    else if (state.page === 'inventory') loadInventoryPage();
    else if (state.page === 'storefront') loadStorefrontPage();
    else if (state.page === 'product-detail') loadProductDetailPage();
    else if (state.page === 'cart') loadCartPage();
    else if (state.page === 'orders') loadMyOrdersPage();
    else if (state.page === 'admin-orders') loadAdminOrdersPage();
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
                    <div style="display:flex; align-items:center; gap:10px;">
                      ${p.image_url ? `
                        <div style="width:42px; height:42px; border-radius:8px; border:1px solid var(--line); background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                          <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.name)}" style="max-width:90%; max-height:90%; object-fit:contain;">
                        </div>
                      ` : ''}
                      <div>
                        <div style="font-size:11px; font-weight:750; color:var(--teal-primary); text-transform:uppercase;">${escapeHtml(p.brand)}</div>
                        <strong>${escapeHtml(p.name)}</strong>
                        <div class="subtle" style="font-size:12px; max-width:260px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.description || '')}</div>
                      </div>
                    </div>
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
                    <div style="display:inline-flex; align-items:center; gap:6px; flex-wrap:nowrap; white-space:nowrap;">
                      <button class="btn-secondary btn-add-variant" data-id="${p.product_id}" title="Thêm biến thể SKU mới"><i class="bi bi-plus-lg"></i> SKU</button>
                      <button class="btn-danger btn-delete-prod" data-id="${p.product_id}" title="Xóa linh kiện"><i class="bi bi-trash"></i> Xóa</button>
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
        <div style="display:flex; gap:8px; align-items:center; flex:1; max-width:540px;">
          <input type="text" id="inv-search-input" placeholder="Tìm kiếm SKU, tên linh kiện, hãng..." value="${escapeHtml(state.inventorySearch)}" style="padding:9px 13px; border:1.5px solid #cbd5e1; border-radius:8px; flex:1;">
          <select id="inv-filter-select" style="padding:9px 13px; border:1.5px solid #cbd5e1; border-radius:8px; min-width:180px;">
            <option value="all" ${state.inventoryFilter === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
            <option value="low_stock" ${state.inventoryFilter === 'low_stock' ? 'selected' : ''}>⚠️ Sắp hết hàng</option>
            <option value="out_of_stock" ${state.inventoryFilter === 'out_of_stock' ? 'selected' : ''}>⛔ Đã hết hàng (0 tồn)</option>
            <option value="in_stock" ${state.inventoryFilter === 'in_stock' ? 'selected' : ''}>✅ Đủ hàng</option>
          </select>
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

    const filterSelect = document.getElementById('inv-filter-select');
    const searchInput = document.getElementById('inv-search-input');

    filterSelect?.addEventListener('change', () => {
      state.inventoryFilter = filterSelect.value;
      state.inventorySearch = searchInput ? searchInput.value.trim() : '';
      loadInventoryPage();
    });

    let invDebounceTimer;
    searchInput?.addEventListener('input', () => {
      clearTimeout(invDebounceTimer);
      invDebounceTimer = setTimeout(() => {
        state.inventorySearch = searchInput.value.trim();
        state.inventoryFilter = filterSelect ? filterSelect.value : 'all';
        loadInventoryPage();
      }, 250);
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
        <div class="modal-box" style="max-width:720px; overflow:visible;">
          <div class="modal-header">
            <h3>Nhập Kho Linh Kiện Theo Lô (Inward Shipment)</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <form id="batch-restock-form">
            <div class="modal-body" style="overflow:visible;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div class="field"><label>Mã lô hàng (Batch Code)</label><input name="batchCode" value="BATCH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-01" required></div>
                <div class="field"><label>Ghi chú / Chứng từ nhập kho</label><input name="notes" placeholder="Nhập từ Synnex FPT / ASUS VN..." value="Nhập bổ sung linh kiện tồn kho"></div>
              </div>

              <div style="border-top:1px solid var(--line); padding-top:12px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <h4 style="margin:0;">Danh sách mã SKU và số lượng nhập</h4>
                  <button type="button" class="btn-secondary" id="btn-add-restock-item" style="font-size:12px; padding:4px 8px;">+ Thêm dòng</button>
                </div>
                <div id="restock-items-list" style="display:flex; flex-direction:column; gap:10px; max-height:300px; overflow-y:auto; padding-right:4px;">
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

    function appendRestockRow(prefillSku = null, prefillQty = 10, prefillVid = null) {
      const row = document.createElement('div');
      row.className = 'restock-row';
      if (prefillSku) {
        row.innerHTML = `
          <input value="${escapeHtml(prefillSku)}" class="restock-sku-input" readonly style="background:#f8fafc; font-weight:600;">
          <input type="number" min="1" value="${prefillQty}" class="restock-qty-input" required>
          <button type="button" class="btn-danger remove-restock-row" style="padding:4px 8px;">×</button>
        `;
      } else {
        row.innerHTML = `
          <div class="restock-dropdown-slot" style="min-width:0;"></div>
          <input type="number" min="1" value="${prefillQty}" placeholder="Số lượng" class="restock-qty-input" required>
          <button type="button" class="btn-danger remove-restock-row" style="padding:4px 8px;">×</button>
        `;
        const slot = row.querySelector('.restock-dropdown-slot');
        const defaultVid = prefillVid || (state.inventoryItems[0]?.variant_id || '');
        createSearchableDropdown({
          container: slot,
          options: state.inventoryItems.map(i => ({
            value: i.variant_id,
            label: `${i.sku} · ${i.product_name}`,
            sublabel: `Tồn kho: ${i.stock_quantity} cái · ${formatCurrency(i.price)}`
          })),
          placeholder: 'Tìm kiếm SKU linh kiện...',
          value: defaultVid,
          searchPlaceholder: 'Tìm kiếm nhanh mã SKU hoặc tên linh kiện...'
        });
      }
      row.querySelector('.remove-restock-row').addEventListener('click', () => row.remove());
      list.appendChild(row);
    }

    if (prefillAlerts.length > 0) {
      prefillAlerts.forEach(a => appendRestockRow(a.sku, Math.max(10, a.deficit_quantity * 2)));
    } else {
      appendRestockRow();
    }

    document.getElementById('btn-add-restock-item').addEventListener('click', () => {
      appendRestockRow();
    });

    document.getElementById('batch-restock-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const items = [];
      list.querySelectorAll('.restock-row').forEach(r => {
        const skuInput = r.querySelector('.restock-sku-input');
        const hiddenInput = r.querySelector('.csd-hidden-input');
        const qty = Number(r.querySelector('.restock-qty-input').value);
        if (skuInput) {
          items.push({ sku: skuInput.value.trim(), quantity: qty });
        } else if (hiddenInput && hiddenInput.value) {
          items.push({ variantId: Number(hiddenInput.value), quantity: qty });
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
  // Storefront & Product Detail Subpage
  // ==========================================
  async function loadStorefrontPage(reset = true) {
    const content = document.getElementById('page-content');
    if (!content) return;
    if (reset) {
      state.catalogPagination = { page: 1, limit: 20, total: 0, totalPages: 1 };
      state.catalogProducts = [];
    }
    content.innerHTML = '<div class="empty-state" style="padding:60px;"><i class="bi bi-arrow-repeat" style="font-size:28px; color:var(--teal-primary);"></i><br><br>Đang tải danh mục sản phẩm TechZone...</div>';
    try {
      const [filterOptionsRes, prodsRes] = await Promise.all([
        api('/products/filter-options/all'),
        api(`/products?${buildStorefrontQuery(1, 20)}`),
      ]);
      state.filterOptions = filterOptionsRes.filterOptions || {};
      state.categories = state.filterOptions.categories || [];
      state.catalogProducts = prodsRes.products || [];
      state.catalogPagination = prodsRes.pagination || { page: 1, limit: 20, total: prodsRes.products?.length || 0, totalPages: 1 };

      // Update category strip pills if present
      const catStrip = document.getElementById('gvn-cat-strip');
      if (catStrip) {
        catStrip.querySelectorAll('.gvn-cat-pill').forEach(btn => {
          const isAct = String(state.productFilters.categoryId || '') === String(btn.dataset.catId || '');
          btn.classList.toggle('active', isAct);
        });
      }

      renderStorefront(content);
    } catch (err) {
      content.innerHTML = `<div class="alert">${escapeHtml(err.message)}</div>`;
    }
  }

  function buildStorefrontQuery(page = 1, limit = 20) {
    const p = new URLSearchParams();
    p.append('page', String(page));
    p.append('limit', String(limit));
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

  async function loadMoreStorefrontProducts() {
    if (state.isLoadingMore) return;
    if (!state.catalogPagination || state.catalogPagination.page >= state.catalogPagination.totalPages) return;
    state.isLoadingMore = true;

    const nextPage = state.catalogPagination.page + 1;
    const sentinel = document.getElementById('storefront-load-more-sentinel');
    if (sentinel) {
      sentinel.innerHTML = '<div style="padding:14px; color:var(--teal-primary); font-weight:700;"><i class="bi bi-arrow-repeat spin"></i> Đang tải thêm sản phẩm...</div>';
    }

    try {
      const res = await api(`/products?${buildStorefrontQuery(nextPage, 20)}`);
      const newProds = res.products || [];
      state.catalogProducts.push(...newProds);
      state.catalogPagination = res.pagination || { ...state.catalogPagination, page: nextPage };

      const grid = document.getElementById('gvn-store-grid');
      if (grid && sentinel) {
        for (const p of newProds) {
          const temp = document.createElement('div');
          temp.innerHTML = renderProductCardHtml(p).trim();
          const cardEl = temp.firstElementChild;
          grid.insertBefore(cardEl, sentinel);
          attachProductCardEvents(cardEl, p);
        }
      }

      if (sentinel) {
        if (state.catalogPagination.page < state.catalogPagination.totalPages) {
          sentinel.innerHTML = `
            <button type="button" class="btn-secondary" id="btn-manual-load-more" style="padding:10px 24px; font-weight:700; font-size:13.5px; border-radius:9px;">
              <i class="bi bi-arrow-down-circle"></i> Tải thêm sản phẩm (${state.catalogProducts.length}/${state.catalogPagination.total})
            </button>
          `;
          document.getElementById('btn-manual-load-more')?.addEventListener('click', loadMoreStorefrontProducts);
        } else {
          sentinel.innerHTML = `<span class="subtle" style="font-size:12px;"><i class="bi bi-check-circle"></i> Đã hiển thị toàn bộ ${state.catalogPagination.total} sản phẩm</span>`;
        }
      }
    } catch (_err) {
      if (sentinel) {
        sentinel.innerHTML = '<button type="button" class="btn-secondary" id="btn-manual-load-more">Thử tải lại</button>';
        document.getElementById('btn-manual-load-more')?.addEventListener('click', loadMoreStorefrontProducts);
      }
    } finally {
      state.isLoadingMore = false;
    }
  }

  function renderProductCardHtml(p) {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const defaultVar = variants.find(v => Number(v.stock_quantity) > 0) || variants[0] || null;
    const imgUrl = p.image_url || '/images/products/placeholder.jpg';
    const isAvail = p.total_stock > 0;
    return `
      <div class="gvn-card" data-product-id="${p.product_id}">
        <div class="gvn-card-img" data-product-id="${p.product_id}">
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'180\\\' height=\\\'180\\\' viewBox=\\\'0 0 24 24\\\' fill=\\\'none\\\' stroke=\\\'%230f766e\\\' stroke-width=\\\'1.5\\\'><rect x=\\\'2\\\' y=\\\'3\\\' width=\\\'20\\\' height=\\\'14\\\' rx=\\\'2\\\'/><line x1=\\\'8\\\' y1=\\\'21\\\' x2=\\\'16\\\' y2=\\\'21\\\'/><line x1=\\\'12\\\' y1=\\\'17\\\' x2=\\\'12\\\' y2=\\\'21\\\'/></svg>';">
        </div>
        <div data-product-id="${p.product_id}">
          <div class="gvn-card-brand-row">
            <span class="gvn-card-brand">${escapeHtml(p.brand)}</span>
            <span class="gvn-card-cat">${escapeHtml(p.category_name)}</span>
          </div>
          <h3 class="gvn-card-title" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</h3>
          <div class="gvn-card-specs">
            ${(p.specs || []).slice(0, 3).map(s => `<span class="gvn-card-spec-tag">${escapeHtml(s.spec_name)}: ${escapeHtml(s.spec_value)}</span>`).join('')}
          </div>
          <div class="gvn-card-price-row">
            <span class="gvn-card-price-cur">${formatCurrency(defaultVar ? defaultVar.price : 0)}</span>
            <span class="gvn-card-price-old">${formatCurrency(Math.round((defaultVar ? defaultVar.price : 0) * 1.08))}</span>
          </div>
          <div class="gvn-card-stock">
            ${isAvail ? '<span style="color:#15803d; font-weight:700;"><i class="bi bi-check2"></i> Còn hàng (' + p.total_stock + ')</span>' : '<span style="color:#b91c1c; font-weight:700;"><i class="bi bi-x-circle"></i> Tạm hết hàng</span>'}
          </div>
        </div>
        <div class="gvn-card-btns">
          <button class="btn-card-detail" data-product-id="${p.product_id}" type="button">
            <i class="bi bi-eye"></i> Chi tiết
          </button>
          <button class="btn-card-buy btn-quick-add" data-product-id="${p.product_id}" type="button" ${!isAvail ? 'disabled' : ''}>
            <i class="bi bi-cart-plus"></i> Thêm giỏ
          </button>
        </div>
      </div>
    `;
  }

  function attachProductCardEvents(cardEl, prod) {
    cardEl.querySelectorAll('[data-product-id]').forEach(el => {
      if (el.tagName !== 'BUTTON') {
        el.addEventListener('click', () => openProductDetail(prod.product_id));
      }
    });
    cardEl.querySelector('.btn-card-detail')?.addEventListener('click', (e) => {
      e.stopPropagation();
      openProductDetail(prod.product_id);
    });
    cardEl.querySelector('.btn-quick-add')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const defaultVar = (prod.variants || []).find(v => Number(v.stock_quantity) > 0) || prod.variants?.[0];
      addToCart(prod, defaultVar, 1);
      updateHeaderCartBadge();
      showToast(`Đã thêm "${prod.name}" vào giỏ hàng!`);
    });
  }

  function getCategoryBootstrapIcon(name) {
    const n = String(name || '').toLowerCase();
    if (n.includes('cpu') || n.includes('vi xử lý')) return 'bi-cpu';
    if (n.includes('gpu') || n.includes('vga') || n.includes('card')) return 'bi-gpu-card';
    if (n.includes('main') || n.includes('bo mạch')) return 'bi-motherboard';
    if (n.includes('ram')) return 'bi-memory';
    if (n.includes('storage') || n.includes('ssd') || n.includes('ổ cứng')) return 'bi-device-ssd';
    if (n.includes('power') || n.includes('nguồn') || n.includes('psu')) return 'bi-lightning-charge';
    if (n.includes('laptop')) return 'bi-laptop';
    if (n.includes('keyboard') || n.includes('bàn phím') || n.includes('phím')) return 'bi-keyboard';
    if (n.includes('mouse') || n.includes('chuột')) return 'bi-mouse';
    if (n.includes('màn') || n.includes('display') || n.includes('monitor') || n.includes('screen')) return 'bi-display';
    if (n.includes('access') || n.includes('phụ kiện') || n.includes('gear')) return 'bi-headset';
    return 'bi-box-seam';
  }

  function getCategoryIcon(name) {
    return `<i class="bi ${getCategoryBootstrapIcon(name)}"></i>`;
  }

  function renderStorefront(content) {
    const opts = state.filterOptions || {};
    const brands = opts.brands || [];
    const catId = state.productFilters.categoryId ? String(state.productFilters.categoryId) : '';
    const relevantSpecs = (catId && opts.categorySpecs && opts.categorySpecs[catId]) ? opts.categorySpecs[catId] : [];

    const currentPricePreset = (state.productFilters.minPrice !== '' || state.productFilters.maxPrice !== '')
      ? `${state.productFilters.minPrice || 0}-${state.productFilters.maxPrice || 999999999}`
      : '';

    // Active filters summary list
    const activeFiltersList = [];
    if (state.productFilters.search) activeFiltersList.push({ key: 'search', label: `Tìm: "${state.productFilters.search}"` });
    if (state.productFilters.brand) activeFiltersList.push({ key: 'brand', label: `Hãng: ${state.productFilters.brand}` });
    if (state.productFilters.minPrice !== '' || state.productFilters.maxPrice !== '') activeFiltersList.push({ key: 'price', label: 'Khoảng giá đã chọn' });
    if (state.productFilters.inStock) activeFiltersList.push({ key: 'inStock', label: 'Chỉ còn hàng' });
    for (const [sk, sv] of Object.entries(state.productFilters.specs || {})) {
      if (sv) activeFiltersList.push({ key: `spec_${sk}`, label: `${sk}: ${sv}`, specName: sk });
    }

    content.innerHTML = `
      <!-- Horizontal Smart Filter Bar -->
      <div class="gvn-filter-bar">
        <div class="gvn-filter-row">
          <div class="gvn-filter-label">
            <i class="bi bi-funnel-fill"></i>
            <span>Bộ lọc:</span>
          </div>

          <!-- Brand Filter -->
          <select class="gvn-select-pill" id="filter-brand-select">
            <option value="">Thương hiệu: Tất cả</option>
            ${brands.map(b => `<option value="${escapeHtml(b)}" ${state.productFilters.brand === b ? 'selected' : ''}>${escapeHtml(b)}</option>`).join('')}
          </select>

          <!-- Price Preset Filter -->
          <select class="gvn-select-pill" id="filter-price-preset-select">
            <option value="">Mức giá: Tất cả</option>
            <option value="0-5000000" ${currentPricePreset === '0-5000000' ? 'selected' : ''}>Dưới 5 triệu</option>
            <option value="5000000-15000000" ${currentPricePreset === '5000000-15000000' ? 'selected' : ''}>5 - 15 triệu</option>
            <option value="15000000-30000000" ${currentPricePreset === '15000000-30000000' ? 'selected' : ''}>15 - 30 triệu</option>
            <option value="30000000-999999999" ${currentPricePreset === '30000000-999999999' ? 'selected' : ''}>Trên 30 triệu</option>
          </select>

          <!-- In-Stock Toggle -->
          <button type="button" class="gvn-check-pill ${state.productFilters.inStock ? 'active' : ''}" id="filter-instock-toggle">
            <i class="bi bi-check-circle${state.productFilters.inStock ? '-fill' : ''}"></i>
            <span>Chỉ còn hàng</span>
          </button>

          <!-- Dynamic Category Specs Filters -->
          ${relevantSpecs.map(sp => `
            <select class="gvn-select-pill spec-filter-select" data-spec="${escapeHtml(sp.spec_name)}">
              <option value="">${escapeHtml(sp.spec_name)}: Tất cả</option>
              ${sp.values.map(v => `<option value="${escapeHtml(v)}" ${state.productFilters.specs?.[sp.spec_name] === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
            </select>
          `).join('')}

          <!-- Sort Select -->
          <div style="margin-left: auto;">
            <select class="gvn-select-pill" id="store-sort-select">
              <option value="newest" ${state.productFilters.sortBy === 'newest' ? 'selected' : ''}>Sắp xếp: Mới nhất</option>
              <option value="price_asc" ${state.productFilters.sortBy === 'price_asc' ? 'selected' : ''}>Giá: Thấp đến Cao</option>
              <option value="price_desc" ${state.productFilters.sortBy === 'price_desc' ? 'selected' : ''}>Giá: Cao đến Thấp</option>
              <option value="name_asc" ${state.productFilters.sortBy === 'name_asc' ? 'selected' : ''}>Tên A-Z</option>
            </select>
          </div>

          ${activeFiltersList.length > 0 ? `
            <button class="gvn-reset-btn" id="btn-reset-filters" type="button" title="Xóa tất cả bộ lọc">
              <i class="bi bi-x-circle"></i> Xóa lọc
            </button>
          ` : ''}
        </div>

        ${activeFiltersList.length > 0 ? `
          <div class="gvn-filter-tags-row">
            <span style="font-size:12px; color:var(--muted); font-weight:600;">Đang lọc theo:</span>
            ${activeFiltersList.map(item => `
              <span class="gvn-active-tag">
                ${escapeHtml(item.label)}
                <button type="button" data-clear-key="${item.key}" ${item.specName ? `data-clear-spec="${escapeHtml(item.specName)}"` : ''}>✕</button>
              </span>
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Full-Width Product Cards Grid -->
      <div class="gvn-store-grid" id="gvn-store-grid">
        ${state.catalogProducts.length === 0 ? `
          <div style="grid-column:1/-1; text-align:center; padding:60px 20px; background:#fff; border-radius:14px; border:1px solid #e2e8f0; color:var(--muted);">
            <i class="bi bi-search" style="font-size:36px; color:#cbd5e1; display:block; margin-bottom:12px;"></i>
            <strong style="color:var(--slate-800); font-size:16px;">Không tìm thấy linh kiện nào phù hợp.</strong>
            <p style="margin:8px 0 16px;">Vui lòng thử điều chỉnh lại bộ lọc hoặc tìm kiếm từ khóa khác.</p>
            <button class="btn-primary" id="btn-grid-reset-filters"><i class="bi bi-arrow-repeat"></i> Xóa tất cả bộ lọc</button>
          </div>
        ` : state.catalogProducts.map(renderProductCardHtml).join('')}
        ${state.catalogProducts.length > 0 ? `
          <div id="storefront-load-more-sentinel" style="grid-column:1/-1; text-align:center; padding:24px 10px;">
            ${state.catalogPagination && state.catalogPagination.page < state.catalogPagination.totalPages ? `
              <button type="button" class="btn-secondary" id="btn-manual-load-more" style="padding:10px 24px; font-weight:700; font-size:13.5px; border-radius:9px;">
                <i class="bi bi-arrow-down-circle"></i> Tải thêm sản phẩm (${state.catalogProducts.length}/${state.catalogPagination.total})
              </button>
            ` : `
              <span class="subtle" style="font-size:12px;"><i class="bi bi-check-circle"></i> Đã hiển thị toàn bộ ${state.catalogPagination?.total || state.catalogProducts.length} sản phẩm</span>
            `}
          </div>
        ` : ''}
      </div>
    `;

    ensureVisitTracked();
    attachStorefrontEvents(content);
    document.getElementById('btn-manual-load-more')?.addEventListener('click', loadMoreStorefrontProducts);

    if (!state.storefrontScrollBound) {
      state.storefrontScrollBound = true;
      window.addEventListener('scroll', () => {
        if (state.page !== 'storefront' || state.isLoadingMore) return;
        const sentinel = document.getElementById('storefront-load-more-sentinel');
        if (!sentinel) return;
        const rect = sentinel.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 350) {
          loadMoreStorefrontProducts();
        }
      }, { passive: true });
    }
  }

  function attachStorefrontEvents(content) {
    // Brand Select
    document.getElementById('filter-brand-select')?.addEventListener('change', (e) => {
      state.productFilters.brand = e.target.value;
      loadStorefrontPage();
    });

    // Price Preset Select
    document.getElementById('filter-price-preset-select')?.addEventListener('change', (e) => {
      const val = e.target.value;
      if (!val) {
        state.productFilters.minPrice = '';
        state.productFilters.maxPrice = '';
      } else {
        const [min, max] = val.split('-');
        state.productFilters.minPrice = min || '';
        state.productFilters.maxPrice = (max === '999999999') ? '' : max;
      }
      loadStorefrontPage();
    });

    // In-Stock Toggle
    document.getElementById('filter-instock-toggle')?.addEventListener('click', () => {
      state.productFilters.inStock = !state.productFilters.inStock;
      loadStorefrontPage();
    });

    // Dynamic Specs Selects
    content.querySelectorAll('.spec-filter-select').forEach((sel) => {
      sel.addEventListener('change', () => {
        const specName = sel.dataset.spec;
        if (!state.productFilters.specs) state.productFilters.specs = {};
        if (sel.value) {
          state.productFilters.specs[specName] = sel.value;
        } else {
          delete state.productFilters.specs[specName];
        }
        loadStorefrontPage();
      });
    });

    // Sort Select
    document.getElementById('store-sort-select')?.addEventListener('change', (e) => {
      state.productFilters.sortBy = e.target.value;
      loadStorefrontPage();
    });

    // Reset All Filters
    const resetFilters = () => {
      state.productFilters = {
        search: '',
        categoryId: state.productFilters.categoryId,
        brand: '',
        minPrice: '',
        maxPrice: '',
        inStock: false,
        sortBy: 'newest',
        specs: {},
      };
      const searchBox = document.getElementById('gvn-header-search');
      if (searchBox) searchBox.value = '';
      loadStorefrontPage();
    };
    document.getElementById('btn-reset-filters')?.addEventListener('click', resetFilters);
    document.getElementById('btn-grid-reset-filters')?.addEventListener('click', resetFilters);

    // Clear individual active tags
    content.querySelectorAll('[data-clear-key]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.clearKey;
        if (key === 'search') {
          state.productFilters.search = '';
          const searchBox = document.getElementById('gvn-header-search');
          if (searchBox) searchBox.value = '';
        } else if (key === 'brand') {
          state.productFilters.brand = '';
        } else if (key === 'price') {
          state.productFilters.minPrice = '';
          state.productFilters.maxPrice = '';
        } else if (key === 'inStock') {
          state.productFilters.inStock = false;
        } else if (key.startsWith('spec_')) {
          const specName = btn.dataset.clearSpec;
          if (specName && state.productFilters.specs) {
            delete state.productFilters.specs[specName];
          }
        }
        loadStorefrontPage();
      });
    });

    // Quick Add to Cart
    content.querySelectorAll('.btn-quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pid = Number(btn.dataset.productId);
        const prod = state.catalogProducts.find(p => Number(p.product_id) === pid);
        if (!prod) return;
        const defaultVar = (prod.variants || []).find(v => Number(v.stock_quantity) > 0) || prod.variants?.[0];
        addToCart(prod, defaultVar, 1);
        updateHeaderCartBadge();
        showToast(`Đã thêm "${prod.name}" vào giỏ hàng!`);
      });
    });

    // Navigate to Product Detail on card / button click
    content.querySelectorAll('.gvn-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-quick-add')) return;
        const pid = card.dataset.productId;
        navigateToProductDetail(pid);
      });
    });
  }

  function navigateToProductDetail(productId) {
    state.selectedProductId = Number(productId);
    state.page = 'product-detail';
    renderApp();
  }

  function updateHeaderCartBadge() {
    const count = getCartCount();
    const badges = document.querySelectorAll('.gvn-cart-badge, .cart-badge');
    badges.forEach(b => {
      b.textContent = count;
    });
  }

  // ==========================================
  // Product Detail Subpage Loader & Renderer
  // ==========================================
  async function loadProductDetailPage() {
    const content = document.getElementById('page-content');
    if (!content) return;
    const pid = state.selectedProductId;
    if (!pid) {
      state.page = 'storefront';
      loadStorefrontPage();
      return;
    }
    content.innerHTML = '<div class="empty-state" style="padding:60px;"><i class="bi bi-arrow-repeat" style="font-size:28px; color:var(--teal-primary);"></i><br><br>Đang tải thông tin chi tiết sản phẩm...</div>';
    try {
      const data = await api(`/products/${pid}`);
      const product = data.product;
      const relatedRes = await api(`/products?categoryId=${product.category_id}&limit=4`);
      const relatedProducts = (relatedRes.products || []).filter(p => Number(p.product_id) !== Number(pid)).slice(0, 4);
      renderProductDetailPage(content, product, relatedProducts);
    } catch (err) {
      content.innerHTML = `<div class="detail-page-container"><div class="alert">${escapeHtml(err.message)}</div><button class="btn-secondary" id="btn-detail-back"><i class="bi bi-arrow-left"></i> Quay lại cửa hàng</button></div>`;
      document.getElementById('btn-detail-back')?.addEventListener('click', () => {
        state.page = 'storefront';
        renderApp();
      });
    }
  }

  function renderProductDetailPage(content, product, relatedProducts) {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    let activeVariant = variants.find(v => Number(v.stock_quantity) > 0) || variants[0] || {};
    let activeQty = 1;
    const imgUrl = product.image_url || '/images/products/placeholder.jpg';
    const inStock = Number(activeVariant.stock_quantity) > 0;

    content.innerHTML = `
      <div class="detail-page-container">
        <!-- Breadcrumb Bar -->
        <div class="detail-breadcrumb-bar">
          <button class="detail-back-button" id="btn-back-to-store" type="button">
            <i class="bi bi-arrow-left"></i> Quay lại danh sách sản phẩm
          </button>
          <span>/</span>
          <a href="javascript:void(0)" id="bc-home" style="color:var(--muted); text-decoration:none;">Trang chủ</a>
          <span>/</span>
          <a href="javascript:void(0)" id="bc-cat" data-cat-id="${product.category_id}" style="color:var(--muted); text-decoration:none;">${escapeHtml(product.category_name)}</a>
          <span>/</span>
          <strong style="color:var(--slate-800);">${escapeHtml(product.name)}</strong>
        </div>

        <!-- Main Product Card (Split 2 Columns) -->
        <div class="detail-main-card">
          <!-- Left Column: Gallery, Trust Badges, Policies -->
          <div class="detail-left-col">
            <div class="detail-hero-img-box">
              <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(product.name)}" onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'180\\\' height=\\\'180\\\' viewBox=\\\'0 0 24 24\\\' fill=\\\'none\\\' stroke=\\\'%230f766e\\\' stroke-width=\\\'1.5\\\'><rect x=\\\'2\\\' y=\\\'3\\\' width=\\\'20\\\' height=\\\'14\\\' rx=\\\'2\\\'/><line x1=\\\'8\\\' y1=\\\'21\\\' x2=\\\'16\\\' y2=\\\'21\\\'/><line x1=\\\'12\\\' y1=\\\'17\\\' x2=\\\'12\\\' y2=\\\'21\\\'/></svg>';">
            </div>

            <!-- Trust Badges -->
            <div class="detail-trust-grid">
              <div class="trust-item"><i class="bi bi-shield-check"></i> Chính hãng 100%</div>
              <div class="trust-item"><i class="bi bi-award"></i> Bảo hành 36T</div>
              <div class="trust-item"><i class="bi bi-truck"></i> Giao siêu tốc 2H</div>
              <div class="trust-item"><i class="bi bi-arrow-repeat"></i> Đổi mới 30 ngày</div>
            </div>

            <!-- Buyer Policy Card -->
            <div class="detail-policy-card">
              <h4><i class="bi bi-patch-check-fill"></i> Chính Sách Mua Hàng Tại TechZone</h4>
              <ul>
                <li><i class="bi bi-check2-circle"></i> Cam kết 100% linh kiện chính hãng từ nhà phân phối.</li>
                <li><i class="bi bi-check2-circle"></i> Bảo hành chính hãng 36 tháng theo đúng tiêu chuẩn NSX.</li>
                <li><i class="bi bi-check2-circle"></i> Lỗi 1 đổi 1 trong 30 ngày đầu nếu có lỗi phần cứng.</li>
                <li><i class="bi bi-check2-circle"></i> Hỗ trợ kiểm tra tương thích cấu hình PC hoàn toàn miễn phí.</li>
              </ul>
            </div>
          </div>

          <!-- Right Column: Buy Box, Specs, Actions -->
          <div class="detail-right-col">
            <span class="detail-brand-badge">${escapeHtml(product.brand)}</span>
            <h1 class="detail-h1">${escapeHtml(product.name)}</h1>

            <div class="detail-meta-row">
              <span>Mã SKU: <strong id="detail-sku-display">${escapeHtml(activeVariant.sku || 'N/A')}</strong></span>
              <span>·</span>
              <span id="detail-stock-display">
                ${inStock ? `<span class="badge badge-in-stock"><i class="bi bi-check-circle-fill"></i> Còn hàng (${activeVariant.stock_quantity} sp)</span>` : `<span class="badge badge-out-stock"><i class="bi bi-x-circle-fill"></i> Tạm hết hàng</span>`}
              </span>
            </div>

            <!-- Price Panel -->
            <div class="detail-price-panel">
              <span class="detail-price-main" id="detail-price-display">${formatCurrency(activeVariant.price || 0)}</span>
              <span class="detail-price-strike" id="detail-strike-display">${formatCurrency(Math.round((activeVariant.price || 0) * 1.08))}</span>
              <span class="detail-discount-pill">-8% TIẾT KIỆM</span>
            </div>

            <!-- Specs Quick Grid -->
            <div class="detail-specs-quick-grid">
              ${(product.specs || []).slice(0, 4).map(s => `
                <div class="detail-spec-quick-item">
                  <span class="q-lbl">${escapeHtml(s.spec_name)}</span>
                  <span class="q-val">${escapeHtml(s.spec_value)}</span>
                </div>
              `).join('')}
            </div>

            <!-- SKU Variants Selector -->
            ${variants.length > 1 ? `
              <div class="detail-variant-selector">
                <span class="detail-section-label">Chọn phiên bản SKU:</span>
                <div class="detail-variant-buttons" id="detail-variant-btns">
                  ${variants.map(v => `
                    <button type="button" class="variant-btn ${v.variant_id === activeVariant.variant_id ? 'active' : ''}" data-variant-id="${v.variant_id}">
                      ${escapeHtml(v.sku)} · ${formatCurrency(v.price)}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Quantity Stepper -->
            <div class="detail-qty-row">
              <span class="detail-section-label" style="margin-bottom:0;">Số lượng:</span>
              <div class="detail-qty-box">
                <button type="button" id="detail-qty-minus"><i class="bi bi-dash"></i></button>
                <input type="number" id="detail-qty-val" value="1" min="1" max="${activeVariant.stock_quantity || 10}">
                <button type="button" id="detail-qty-plus"><i class="bi bi-plus"></i></button>
              </div>
              <span style="font-size:12.5px; color:var(--muted);" id="detail-qty-hint">Có sẵn ${activeVariant.stock_quantity || 0} sản phẩm</span>
            </div>

            <!-- Action Buttons -->
            <div class="detail-actions-row">
              <button class="btn-buy-now-large" id="btn-detail-buy-now" type="button" ${!inStock ? 'disabled' : ''}>
                <i class="bi bi-lightning-fill"></i>
                <span>MUA NGAY</span>
              </button>
              <button class="btn-add-cart-large" id="btn-detail-add-cart" type="button" ${!inStock ? 'disabled' : ''}>
                <i class="bi bi-cart-plus"></i>
                <span>THÊM VÀO GIỎ HÀNG</span>
              </button>
            </div>

            <!-- Hardware Compatibility Notice -->
            <div class="detail-compat-alert">
              <i class="bi bi-motherboard"></i>
              <div>
                <strong>Kiểm tra tương thích cấu hình tự động:</strong>
                <div>Linh kiện này sẽ được hệ thống TechZone tự động kiểm tra chéo tương thích (Socket, Chuẩn RAM, Công suất nguồn) khi bạn đưa vào giỏ hàng cùng các bộ phận khác.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detail Bottom Grid (Description & Detailed Specs Table) -->
        <div class="detail-bottom-grid">
          <!-- Left: Description -->
          <div class="detail-tab-card">
            <h3><i class="bi bi-file-earmark-text"></i> Đặc Điểm Nổi Bật & Mô Tả Sản Phẩm</h3>
            <div class="detail-desc-body">
              <p>${escapeHtml(product.description || 'Sản phẩm linh kiện máy tính chính hãng, được phân phối chính thức tại TechZone Computer với đầy đủ hóa đơn VAT và chính sách bảo hành 36 tháng.')}</p>
            </div>
          </div>

          <!-- Right: Detailed Specs Table -->
          <div class="detail-tab-card">
            <h3><i class="bi bi-sliders"></i> Bảng Thông Số Kỹ Thuật Chi Tiết</h3>
            <table class="detail-specs-table">
              <tbody>
                <tr><td>Hãng sản xuất</td><td><strong>${escapeHtml(product.brand)}</strong></td></tr>
                <tr><td>Danh mục linh kiện</td><td><strong>${escapeHtml(product.category_name)}</strong></td></tr>
                <tr><td>Mã SKU mặc định</td><td><code id="table-sku-display">${escapeHtml(activeVariant.sku || 'N/A')}</code></td></tr>
                ${(product.specs || []).map(s => `
                  <tr><td>${escapeHtml(s.spec_name)}</td><td><strong>${escapeHtml(s.spec_value)}</strong></td></tr>
                `).join('')}
                <tr><td>Thời gian bảo hành</td><td><strong>36 Tháng chính hãng</strong></td></tr>
                <tr><td>Tình trạng kho</td><td><strong id="table-stock-display">${inStock ? 'Có sẵn ' + activeVariant.stock_quantity + ' sản phẩm' : 'Tạm hết hàng'}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Related Products Section -->
        ${relatedProducts.length > 0 ? `
          <div style="margin-top: 32px;">
            <h3 style="font-size: 18px; font-weight: 800; margin-bottom: 16px; color: var(--slate-900);">
              <i class="bi bi-collection"></i> Sản Phẩm Cùng Danh Mục Đề Xuất
            </h3>
            <div class="gvn-store-grid">
              ${relatedProducts.map(rp => {
                const rVars = Array.isArray(rp.variants) ? rp.variants : [];
                const rVar = rVars.find(v => Number(v.stock_quantity) > 0) || rVars[0] || {};
                const rImg = rp.image_url || '/images/products/placeholder.jpg';
                return `
                  <div class="gvn-card related-card" data-product-id="${rp.product_id}">
                    <div class="gvn-card-img">
                      <img src="${escapeHtml(rImg)}" alt="${escapeHtml(rp.name)}" loading="lazy">
                    </div>
                    <div>
                      <div class="gvn-card-brand-row">
                        <span class="gvn-card-brand">${escapeHtml(rp.brand)}</span>
                        <span class="gvn-card-cat">${escapeHtml(rp.category_name)}</span>
                      </div>
                      <h4 class="gvn-card-title">${escapeHtml(rp.name)}</h4>
                      <div class="gvn-card-price-row">
                        <span class="gvn-card-price-cur">${formatCurrency(rVar.price || 0)}</span>
                      </div>
                    </div>
                    <button class="btn-card-detail" data-product-id="${rp.product_id}" type="button" style="width:100%; justify-content:center;">
                      <i class="bi bi-eye"></i> Xem chi tiết
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    // Event Listeners for Product Detail Page
    document.getElementById('btn-back-to-store')?.addEventListener('click', () => {
      state.page = 'storefront';
      renderApp();
    });
    document.getElementById('bc-home')?.addEventListener('click', () => {
      state.page = 'storefront';
      renderApp();
    });
    document.getElementById('bc-cat')?.addEventListener('click', (e) => {
      state.productFilters.categoryId = e.currentTarget.dataset.catId || '';
      state.productFilters.specs = {};
      state.page = 'storefront';
      renderApp();
    });

    // Variants Buttons
    content.querySelectorAll('.variant-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        content.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const vid = Number(btn.dataset.variantId);
        activeVariant = variants.find(v => Number(v.variant_id) === vid) || activeVariant;

        const isNowInStock = Number(activeVariant.stock_quantity) > 0;
        document.getElementById('detail-sku-display').textContent = activeVariant.sku || 'N/A';
        document.getElementById('table-sku-display').textContent = activeVariant.sku || 'N/A';
        document.getElementById('detail-price-display').textContent = formatCurrency(activeVariant.price || 0);
        document.getElementById('detail-strike-display').textContent = formatCurrency(Math.round((activeVariant.price || 0) * 1.08));
        document.getElementById('detail-stock-display').innerHTML = isNowInStock
          ? `<span class="badge badge-in-stock"><i class="bi bi-check-circle-fill"></i> Còn hàng (${activeVariant.stock_quantity} sp)</span>`
          : `<span class="badge badge-out-stock"><i class="bi bi-x-circle-fill"></i> Tạm hết hàng</span>`;
        document.getElementById('table-stock-display').textContent = isNowInStock
          ? `Có sẵn ${activeVariant.stock_quantity} sản phẩm`
          : 'Tạm hết hàng';

        const buyNowBtn = document.getElementById('btn-detail-buy-now');
        const addCartBtn = document.getElementById('btn-detail-add-cart');
        if (buyNowBtn) buyNowBtn.disabled = !isNowInStock;
        if (addCartBtn) addCartBtn.disabled = !isNowInStock;

        activeQty = 1;
        const qtyVal = document.getElementById('detail-qty-val');
        if (qtyVal) {
          qtyVal.value = 1;
          qtyVal.max = activeVariant.stock_quantity || 10;
        }
        const qtyHint = document.getElementById('detail-qty-hint');
        if (qtyHint) qtyHint.textContent = `Có sẵn ${activeVariant.stock_quantity || 0} sản phẩm`;
      });
    });

    // Quantity Stepper
    const qtyInput = document.getElementById('detail-qty-val');
    document.getElementById('detail-qty-minus')?.addEventListener('click', () => {
      activeQty = Math.max(1, activeQty - 1);
      if (qtyInput) qtyInput.value = activeQty;
    });
    document.getElementById('detail-qty-plus')?.addEventListener('click', () => {
      const max = Number(activeVariant.stock_quantity) || 10;
      activeQty = Math.min(max, activeQty + 1);
      if (qtyInput) qtyInput.value = activeQty;
    });
    qtyInput?.addEventListener('change', () => {
      const max = Number(activeVariant.stock_quantity) || 10;
      activeQty = Math.max(1, Math.min(max, parseInt(qtyInput.value) || 1));
      qtyInput.value = activeQty;
    });

    // Add to Cart button
    document.getElementById('btn-detail-add-cart')?.addEventListener('click', () => {
      addToCart(product, activeVariant, activeQty);
      updateHeaderCartBadge();
      showToast(`Đã thêm ${activeQty}x "${product.name}" vào giỏ hàng!`);
    });

    // Buy Now button
    document.getElementById('btn-detail-buy-now')?.addEventListener('click', () => {
      addToCart(product, activeVariant, activeQty);
      updateHeaderCartBadge();
      state.page = 'cart';
      renderApp();
    });

    // Related Products Click
    content.querySelectorAll('.related-card').forEach(card => {
      card.addEventListener('click', () => {
        const pid = card.dataset.productId;
        navigateToProductDetail(pid);
      });
    });
  }

  function openProductDetailModal(prod) {
    const variants = Array.isArray(prod.variants) ? prod.variants : [];
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width:640px;">
          <div class="modal-header">
            <h3>${escapeHtml(prod.name)}</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap;">
              ${prod.image_url ? `
                <div style="width:130px; height:130px; border-radius:10px; border:1px solid var(--line); background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                  <img src="${escapeHtml(prod.image_url)}" alt="${escapeHtml(prod.name)}" style="max-width:92%; max-height:92%; object-fit:contain;">
                </div>
              ` : ''}
              <div style="flex:1; min-width:240px;">
                <div style="margin-bottom:6px;">
                  <span class="badge badge-packing">${escapeHtml(prod.category_name)}</span>
                  <span class="badge" style="background:var(--teal-soft); color:var(--teal-primary);">${escapeHtml(prod.brand)}</span>
                </div>
                <p class="subtle" style="margin:0; font-size:13px; line-height:1.5;">${escapeHtml(prod.description || 'Chưa có mô tả chi tiết.')}</p>
              </div>
            </div>
            <div>
              <h4 style="margin:0 0 8px; color:var(--slate-800);">Thông số Kỹ thuật (Specs)</h4>
              <div class="spec-tags">
                ${(prod.specs || []).length === 0 ? '<span class="subtle">Chưa có thông số</span>' : (prod.specs || []).map((s) => `<span class="spec-tag"><strong>${escapeHtml(s.spec_name)}:</strong> ${escapeHtml(s.spec_value)}</span>`).join('')}
              </div>
            </div>
            <div>
              <h4 style="margin:0 0 8px;">Các phiên bản SKU</h4>
              <div style="display:grid; gap:8px;">
                ${variants.map((v) => `
                  <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid var(--line); border-radius:8px;">
                    <div>
                      <strong>${escapeHtml(v.sku)}</strong>
                      <div class="subtle" style="font-size:12px;">Tồn kho: ${v.stock_quantity} sản phẩm</div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                      <strong style="color:#b43403;">${escapeHtml(formatCurrency(v.price))}</strong>
                      <button class="btn-primary modal-add-sku" data-variant-id="${v.variant_id}" ${Number(v.stock_quantity) <= 0 ? 'disabled' : ''}>+ Giỏ hàng</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-secondary" id="modal-cancel-btn">Đóng</button>
          </div>
        </div>
      </div>`;

    const close = () => { modalContainer.innerHTML = ''; };
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);
    modalContainer.querySelectorAll('.modal-add-sku').forEach((btn) => {
      btn.addEventListener('click', () => {
        const variant = variants.find((v) => Number(v.variant_id) === Number(btn.dataset.variantId));
        addToCart(prod, variant, 1);
        close();
      });
    });
  }

  // ==========================================
  // Module 3: Shopping Cart, Compatibility & SePay Checkout (TV3)
  // ==========================================
  async function loadCartPage() {
    const content = document.getElementById('page-content');
    ensureVisitTracked();

    if (state.cart.length === 0) {
      state.cartValidation = null;
      content.innerHTML = `
        <div class="panel" style="text-align:center; padding:50px 24px;">
          <h2 style="margin-top:0;">Giỏ hàng của bạn đang trống</h2>
          <p class="subtle">Hãy chọn CPU, Mainboard, RAM, GPU hoặc Laptop từ cửa hàng để kiểm tra tương thích cấu hình và đặt mua.</p>
          <button class="btn-primary" id="btn-go-storefront" style="margin-top:12px;">🔍 Khám phá Linh kiện Máy tính</button>
        </div>`;
      document.getElementById('btn-go-storefront').addEventListener('click', () => {
        state.page = 'storefront';
        renderApp();
      });
      return;
    }

    content.innerHTML = '<div class="empty-state">Đang kiểm tra tồn kho thực tế và độ tương thích phần cứng...</div>';
    try {
      const validation = await api('/orders/cart/validate', {
        method: 'POST',
        body: JSON.stringify({
          items: state.cart.map((c) => ({ variantId: c.variantId, quantity: c.quantity })),
        }),
      });
      state.cartValidation = validation;
      renderCart(content, validation);
    } catch (err) {
      content.innerHTML = `<div class="alert">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderCart(content, validation) {
    const isGuest = !state.token;
    const compat = validation.compatibility || { compatible: true, issues: [], notes: [] };
    const hasCompatErrors = compat.issues.some((i) => i.severity === 'error');
    const hasCompatWarnings = compat.issues.length > 0 && !hasCompatErrors;
    const compatClass = hasCompatErrors ? 'err' : (hasCompatWarnings ? 'warn' : 'ok');

    const subtotal = validation.totalAmount;
    state.selectedShippingMethod = state.selectedShippingMethod || 'standard';
    let shippingFee = 30000;
    if (state.selectedShippingMethod === 'express') shippingFee = 60000;
    else if (state.selectedShippingMethod === 'economy') shippingFee = subtotal >= 5000000 ? 0 : 15000;
    const finalTotal = subtotal + shippingFee;

    if (state.selectedPaymentMethod !== 'COD') state.selectedPaymentMethod = 'VietQR';

    content.innerHTML = `
      <div class="cart-layout">
        <div>
          ${(compat.issues.length > 0 || compat.notes.length > 0) ? `
            <div class="compat-box ${compatClass}">
              <strong>${hasCompatErrors ? '⚠️ Phát hiện xung đột tương thích linh kiện PC:' : (hasCompatWarnings ? '⚡ Cảnh báo cấu hình PC:' : '✅ Cấu hình linh kiện tương thích tốt:')}</strong>
              <ul style="margin:6px 0 0; padding-left:18px;">
                ${compat.issues.map((i) => `<li>${escapeHtml(i.message)}</li>`).join('')}
                ${compat.notes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${validation.stockErrors.length > 0 ? `
            <div class="alert">
              <strong>Cảnh báo tồn kho thực tế:</strong>
              <ul style="margin:6px 0 0; padding-left:18px;">
                ${validation.stockErrors.map((e) => `<li>${escapeHtml(e.message)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="panel">
            <div class="panel-heading">
              <div>
                <h3>Linh kiện trong giỏ (${validation.totalItems} sản phẩm)</h3>
                <p>Giá và tồn kho được đồng bộ trực tiếp từ cơ sở dữ liệu PostgreSQL</p>
              </div>
              <button class="btn-secondary" id="btn-clear-cart" type="button">Xóa giỏ hàng</button>
            </div>
            <div>
              ${validation.items.map((item) => `
                <div class="cart-item-row">
                  <div style="display:flex; align-items:center; gap:12px;">
                    ${item.imageUrl ? `
                      <div style="width:46px; height:46px; border-radius:8px; border:1px solid var(--line); background:#fff; display:flex; align-items:center; justify-content:center; overflow:hidden; flex-shrink:0;">
                        <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.productName)}" style="max-width:90%; max-height:90%; object-fit:contain;">
                      </div>
                    ` : ''}
                    <div>
                      <div class="prod-brand">${escapeHtml(item.brand)} · ${escapeHtml(item.categoryName)}</div>
                      <strong>${escapeHtml(item.productName)}</strong>
                      <div class="subtle" style="font-size:12px;">SKU: <code>${escapeHtml(item.sku)}</code> · Kho còn: ${item.stockQuantity}</div>
                    </div>
                  </div>
                  <div class="qty-control">
                    <button type="button" class="qty-dec" data-variant-id="${item.variantId}">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" class="qty-inc" data-variant-id="${item.variantId}" data-max="${item.stockQuantity}">+</button>
                  </div>
                  <div style="text-align:right; min-width:120px;">
                    <strong style="color:#b43403;">${escapeHtml(formatCurrency(item.subtotal))}</strong>
                    <div class="subtle" style="font-size:11px;">${escapeHtml(formatCurrency(item.unitPrice))} / sp</div>
                  </div>
                  <button type="button" class="btn-danger cart-remove" data-variant-id="${item.variantId}">×</button>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <aside class="panel">
          <h3 style="margin-top:0;">Thông tin Đặt hàng & Giao nhận</h3>
          <form id="checkout-form">
            <div class="field">
              <label>Họ và tên người nhận <span style="color:#e11d48;">*</span></label>
              <input name="customerName" value="${escapeHtml(state.user?.fullName || '')}" placeholder="Nguyễn Nhật Huy" required>
            </div>
            <div class="field">
              <label>Số điện thoại liên hệ <span style="color:#e11d48;">*</span></label>
              <input name="customerPhone" id="input-customer-phone" placeholder="0901234567 hoặc +84901234567" required>
              <small class="subtle" style="font-size:11.5px; margin-top:3px; display:block;">Yêu cầu đúng 10 số di động Việt Nam (+84 hoặc 03, 05, 07, 08, 09)</small>
            </div>

            <div style="margin:14px 0 10px;">
              <label style="font-size:13px; font-weight:700; color:#43516a; display:block; margin-bottom:6px;">Địa chỉ giao hàng chuẩn xác <span style="color:#e11d48;">*</span></label>
              <div style="display:flex; flex-direction:column; gap:8px;">
                <div id="checkout-city-dropdown"></div>
                <div id="checkout-ward-dropdown"></div>
                <input id="input-street-address" name="streetAddress" placeholder="Số nhà, tên đường, số phòng, tòa nhà..." value="${escapeHtml(state.checkoutStreet || '')}" required style="padding:9px 13px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:13.5px;">
              </div>
            </div>

            <div class="field">
              <label>Ghi chú đơn hàng</label>
              <input name="notes" placeholder="Lắp ráp sẵn, giao giờ hành chính, xuất VAT...">
            </div>

            <label style="font-size:13px; font-weight:700; color:#43516a; margin-top:14px; display:block;">Hình thức vận chuyển</label>
            <div class="shipping-options">
              <label class="shipping-option ${state.selectedShippingMethod === 'express' ? 'selected' : ''}">
                <div class="shipping-option-left">
                  <input type="radio" name="shippingMethod" value="express" ${state.selectedShippingMethod === 'express' ? 'checked' : ''}>
                  <i class="bi bi-lightning-charge-fill shipping-icon" style="color:#e11d48;"></i>
                  <div>
                    <div class="shipping-name">Hỏa tốc (2 - 4h)</div>
                    <div class="shipping-desc">Giao nhận siêu tốc trong 2-4 giờ</div>
                  </div>
                </div>
                <div class="shipping-fee">60.000 ₫</div>
              </label>

              <label class="shipping-option ${state.selectedShippingMethod === 'standard' ? 'selected' : ''}">
                <div class="shipping-option-left">
                  <input type="radio" name="shippingMethod" value="standard" ${state.selectedShippingMethod === 'standard' ? 'checked' : ''}>
                  <i class="bi bi-truck shipping-icon"></i>
                  <div>
                    <div class="shipping-name">Giao hàng Nhanh (1 - 2 ngày)</div>
                    <div class="shipping-desc">Giao tiêu chuẩn toàn quốc</div>
                  </div>
                </div>
                <div class="shipping-fee">30.000 ₫</div>
              </label>

              <label class="shipping-option ${state.selectedShippingMethod === 'economy' ? 'selected' : ''}">
                <div class="shipping-option-left">
                  <input type="radio" name="shippingMethod" value="economy" ${state.selectedShippingMethod === 'economy' ? 'checked' : ''}>
                  <i class="bi bi-box-seam shipping-icon" style="color:#16a34a;"></i>
                  <div>
                    <div class="shipping-name">Giao Tiết kiệm (3 - 5 ngày)</div>
                    <div class="shipping-desc">Cước phí tối ưu, miễn phí đơn từ 5tr</div>
                  </div>
                </div>
                <div class="shipping-fee" style="color:${shippingFee === 0 ? '#16a34a' : '#b43403'};">${shippingFee === 0 ? 'Miễn phí' : '15.000 ₫'}</div>
              </label>
            </div>

            <label style="font-size:13px; font-weight:700; color:#43516a; margin-top:14px; display:block;">Phương thức thanh toán</label>
            <div class="payment-options">
              <label class="payment-option ${state.selectedPaymentMethod === 'VietQR' ? 'selected' : ''}">
                <input type="radio" name="paymentMethod" value="VietQR" ${state.selectedPaymentMethod === 'VietQR' ? 'checked' : ''}>
                <div>
                  <strong><i class="bi bi-qr-code-scan"></i> Chuyển khoản Ngân hàng (VietQR / SePay)</strong>
                  <small>Quét mã QR tự động xác nhận & khớp lệnh thanh toán trong tích tắc</small>
                </div>
              </label>
              <label class="payment-option ${state.selectedPaymentMethod === 'COD' ? 'selected' : ''}">
                <input type="radio" name="paymentMethod" value="COD" ${state.selectedPaymentMethod === 'COD' ? 'checked' : ''}>
                <div>
                  <strong><i class="bi bi-cash-coin"></i> Thanh toán khi nhận hàng (COD)</strong>
                  <small>Kiểm tra linh kiện và thanh toán tiền mặt cho nhân viên giao hàng</small>
                </div>
              </label>
            </div>

            <div style="border-top:1px solid var(--line); padding-top:12px; margin:14px 0 12px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:6px; font-size:13px;">
                <span class="subtle">Tiền linh kiện (${validation.totalItems} món)</span>
                <span>${escapeHtml(formatCurrency(subtotal))}</span>
              </div>
              <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:13px;">
                <span class="subtle">Phí vận chuyển (${state.selectedShippingMethod === 'express' ? 'Hỏa tốc' : (state.selectedShippingMethod === 'economy' ? 'Tiết kiệm' : 'Nhanh')})</span>
                <span style="font-weight:600; color:${shippingFee === 0 ? '#16a34a' : 'inherit'};">${shippingFee === 0 ? 'Miễn phí' : escapeHtml(formatCurrency(shippingFee))}</span>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--line); padding-top:8px;">
                <strong style="font-size:15px;">Tổng thanh toán</strong>
                <strong style="font-size:20px; color:#b43403;">${escapeHtml(formatCurrency(finalTotal))}</strong>
              </div>
            </div>

            ${isGuest ? `
              <div class="alert">Bạn đang ở chế độ Khách. Vui lòng đăng nhập tài khoản khách hàng để hoàn tất đặt hàng.</div>
              <button type="button" class="primary-btn" id="btn-login-to-checkout">Đăng nhập để Thanh toán</button>
            ` : `
              <button type="submit" class="primary-btn" id="btn-submit-checkout" ${!validation.valid ? 'disabled' : ''}>
                ${state.selectedPaymentMethod === 'VietQR' ? 'Xác nhận Đặt hàng & Lấy mã QR Chuyển khoản' : 'Xác nhận Đặt hàng COD ngay'}
              </button>
            `}
          </form>
        </aside>
      </div>`;

    // Initialize cascading address dropdowns
    const citySlot = document.getElementById('checkout-city-dropdown');
    const wardSlot = document.getElementById('checkout-ward-dropdown');
    const streetInput = document.getElementById('input-street-address');

    const cities = Object.keys(VN_LOCATIONS);
    const initialCity = state.checkoutCity && cities.includes(state.checkoutCity) ? state.checkoutCity : 'TP. Hồ Chí Minh';
    state.checkoutCity = initialCity;

    let wardDropdownInstance = null;

    const cityDropdown = createSearchableDropdown({
      container: citySlot,
      options: cities.map(c => ({ value: c, label: c })),
      placeholder: 'Chọn Tỉnh / Thành phố...',
      value: initialCity,
      searchPlaceholder: 'Tìm kiếm nhanh tỉnh / thành phố...',
      onSelect: (selectedCity) => {
        state.checkoutCity = selectedCity;
        const wards = VN_LOCATIONS[selectedCity] || [];
        state.checkoutWard = wards[0] || '';
        if (wardDropdownInstance) {
          wardDropdownInstance.updateOptions(wards.map(w => ({ value: w, label: w })), true);
          wardDropdownInstance.setValue(state.checkoutWard);
        }
      }
    });

    const initialWards = VN_LOCATIONS[initialCity] || [];
    const initialWard = state.checkoutWard && initialWards.includes(state.checkoutWard) ? state.checkoutWard : (initialWards[0] || '');
    state.checkoutWard = initialWard;

    wardDropdownInstance = createSearchableDropdown({
      container: wardSlot,
      options: initialWards.map(w => ({ value: w, label: w })),
      placeholder: 'Chọn Phường / Xã / Quận...',
      value: initialWard,
      searchPlaceholder: 'Tìm kiếm nhanh phường / xã...',
      onSelect: (selectedWard) => {
        state.checkoutWard = selectedWard;
      }
    });

    if (streetInput) {
      streetInput.addEventListener('input', (e) => {
        state.checkoutStreet = e.target.value;
      });
    }

    content.querySelectorAll('.qty-dec').forEach((btn) => {
      btn.addEventListener('click', () => {
        const vid = Number(btn.dataset.variantId);
        const item = state.cart.find((c) => Number(c.variantId) === vid);
        if (!item) return;
        if (item.quantity <= 1) state.cart = state.cart.filter((c) => Number(c.variantId) !== vid);
        else item.quantity -= 1;
        saveCart();
        renderApp();
      });
    });

    content.querySelectorAll('.qty-inc').forEach((btn) => {
      btn.addEventListener('click', () => {
        const vid = Number(btn.dataset.variantId);
        const max = Number(btn.dataset.max || 99);
        const item = state.cart.find((c) => Number(c.variantId) === vid);
        if (!item) return;
        if (item.quantity >= max) return showToast(`Chỉ còn ${max} sản phẩm trong kho.`);
        item.quantity += 1;
        saveCart();
        renderApp();
      });
    });

    content.querySelectorAll('.cart-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const vid = Number(btn.dataset.variantId);
        state.cart = state.cart.filter((c) => Number(c.variantId) !== vid);
        saveCart();
        renderApp();
      });
    });

    document.getElementById('btn-clear-cart').addEventListener('click', () => {
      state.cart = [];
      saveCart();
      renderApp();
    });

    content.querySelectorAll('input[name="shippingMethod"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        state.selectedShippingMethod = e.target.value;
        renderCart(content, validation);
      });
    });

    content.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        state.selectedPaymentMethod = e.target.value;
        renderCart(content, validation);
      });
    });

    const loginBtn = document.getElementById('btn-login-to-checkout');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => logout(false));
      return;
    }

    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const submitBtn = document.getElementById('btn-submit-checkout');

      const street = (streetInput ? streetInput.value : (fd.get('streetAddress') || '')).trim();
      const city = state.checkoutCity || cityDropdown.getValue();
      const ward = state.checkoutWard || (wardDropdownInstance ? wardDropdownInstance.getValue() : '');

      if (!city || !ward || !street) {
        showToast('Vui lòng chọn Tỉnh/Thành phố, Phường/Xã và nhập số nhà tên đường.');
        return;
      }

      const rawPhone = (fd.get('customerPhone') || '').trim().replace(/[\s.-]/g, '');
      const VN_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
      if (!VN_PHONE_REGEX.test(rawPhone)) {
        showToast('Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số thuộc nhà mạng Việt Nam (+84 hoặc 03, 05, 07, 08, 09).');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang khởi tạo đơn hàng...';

      const fullShippingAddress = `${street}, ${ward}, ${city}`;

      try {
        await ensureVisitTracked();
        const res = await api('/orders/checkout', {
          method: 'POST',
          body: JSON.stringify({
            items: state.cart.map((c) => ({ variantId: c.variantId, quantity: c.quantity })),
            paymentMethod: fd.get('paymentMethod'),
            shippingMethod: state.selectedShippingMethod || 'standard',
            shippingFee: shippingFee,
            sessionId: state.sessionId,
            customerName: fd.get('customerName')?.trim(),
            customerPhone: rawPhone,
            shippingAddress: fullShippingAddress,
            notes: fd.get('notes')?.trim(),
          }),
        });

        state.cart = [];
        saveCart();

        if (res.order.payment_method === 'COD') {
          showToast(`Đặt hàng COD #${res.order.order_id} thành công! Đơn đang được đóng gói.`);
          state.page = 'orders';
          renderApp();
        } else {
          state.page = 'orders';
          renderApp();
          openPaymentModal(res.order, res.payment);
        }
      } catch (err) {
        showToast(err.message);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Thử lại đặt hàng';
      }
    });
  }

  function openPaymentModal(order, payment) {
    clearPaymentTimers();
    const isVietQR = payment.method === 'VietQR';
    const expiresAtMs = new Date(payment.expiresAt).getTime();

    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width:680px;">
          <div class="modal-header">
            <h3>${isVietQR ? `Thanh toán Chuyển khoản VietQR · Đơn #${order.order_id}` : `Thanh toán ZaloPay · Đơn #${order.order_id}`}</h3>
            <button class="modal-close" id="pay-modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display:flex; justify-content:space-between; align-items:center; background:#f0fdf4; border:1px solid #bbf7d0; padding:10px 14px; border-radius:10px; font-size:13px;">
              <span><span class="pulse-dot"></span><strong id="payment-live-status">Đang chờ xác nhận thanh toán tự động...</strong></span>
              <span id="payment-countdown" style="font-weight:800; color:#b43403;">30:00</span>
            </div>

            ${isVietQR ? `
              <div class="qr-modal-grid">
                <div class="qr-frame">
                  <img id="sepay-qr-img" src="${escapeHtml(payment.qrUrl)}" alt="SePay VietQR Code" onerror="this.style.display='none'; document.getElementById('qr-fallback-box').hidden=false;">
                  <div id="qr-fallback-box" hidden style="padding:18px 10px; font-size:12px; color:var(--muted);">
                    Không tải được ảnh QR từ <code>qr.sepay.vn</code> (ngoại tuyến). Vui lòng chuyển khoản thủ công theo thông tin bên cạnh.
                  </div>
                  <div class="subtle" style="font-size:11px; margin-top:8px;">Hỗ trợ mọi App Ngân hàng NAPAS 24/7</div>
                </div>
                <div class="bank-info-list">
                  <div class="bank-info-row"><span>Ngân hàng</span><strong>${escapeHtml(payment.bankCode)}</strong></div>
                  <div class="bank-info-row"><span>Số tài khoản</span><strong>${escapeHtml(payment.bankAccount)}</strong></div>
                  <div class="bank-info-row"><span>Chủ tài khoản</span><strong>${escapeHtml(payment.accountName)}</strong></div>
                  <div class="bank-info-row"><span>Số tiền</span><strong style="color:#b43403;">${escapeHtml(formatCurrency(payment.amount))}</strong></div>
                  <div class="bank-info-row">
                    <span>Nội dung CK</span>
                    <button type="button" class="copy-code-chip" id="btn-copy-transfer" title="Sao chép nội dung">${escapeHtml(payment.transferContent)} 📋</button>
                  </div>
                </div>
              </div>
            ` : `
              <div class="bank-info-list">
                <div class="bank-info-row"><span>Cổng thanh toán</span><strong>ZaloPay E-Wallet Gateway</strong></div>
                <div class="bank-info-row"><span>Mã giao dịch</span><strong>${escapeHtml(payment.orderRef)}</strong></div>
                <div class="bank-info-row"><span>Số tiền thanh toán</span><strong style="color:#b43403;">${escapeHtml(formatCurrency(payment.amount))}</strong></div>
              </div>
            `}

            <p class="subtle" style="margin:0; font-size:12px;">
              Ngay khi SePay gửi Webhook xác nhận giao dịch, hệ thống sẽ tự động chuyển đơn sang trạng thái <strong>Paid</strong>, trừ tồn kho linh kiện (atomic lock) và cập nhật doanh thu Dashboard.
            </p>
          </div>
          <div class="modal-footer" style="justify-content:space-between;">
            ${payment.demoMode ? `
              <button type="button" class="btn-primary" id="btn-simulate-payment" style="background:#16835c;">⚡ Giả lập Webhook Thanh toán Thành công (Demo)</button>
            ` : '<span></span>'}
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn-secondary" id="btn-check-payment-now">Kiểm tra ngay</button>
              <button type="button" class="btn-secondary" id="pay-modal-cancel">Đóng</button>
            </div>
          </div>
        </div>
      </div>`;

    const close = () => {
      clearPaymentTimers();
      modalContainer.innerHTML = '';
    };
    document.getElementById('pay-modal-close').addEventListener('click', close);
    document.getElementById('pay-modal-cancel').addEventListener('click', close);

    const copyBtn = document.getElementById('btn-copy-transfer');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard?.writeText(payment.transferContent).catch(() => {});
        showToast(`Đã sao chép nội dung: ${payment.transferContent}`);
      });
    }

    const updateCountdown = () => {
      const el = document.getElementById('payment-countdown');
      if (!el) return clearPaymentTimers();
      const diffSec = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      const mm = String(Math.floor(diffSec / 60)).padStart(2, '0');
      const ss = String(diffSec % 60).padStart(2, '0');
      el.textContent = `${mm}:${ss}`;
    };
    updateCountdown();
    state.paymentCountdownTimer = window.setInterval(updateCountdown, 1000);

    const checkStatus = async (manual = false) => {
      try {
        const res = await api(`/orders/${order.order_id}/payment-status`);
        if (res.paid) {
          clearPaymentTimers();
          showToast(`Thanh toán thành công đơn hàng #${order.order_id}! Tồn kho đã được tự động cập nhật.`);
          modalContainer.innerHTML = '';
          loadMyOrdersPage();
        } else if (manual) {
          showToast('Chưa ghi nhận giao dịch mới. Hệ thống đang tiếp tục theo dõi...');
        }
      } catch (_ignored) {}
    };

    state.paymentPollTimer = window.setInterval(() => checkStatus(false), 3000);
    document.getElementById('btn-check-payment-now').addEventListener('click', () => checkStatus(true));

    const simBtn = document.getElementById('btn-simulate-payment');
    if (simBtn) {
      simBtn.addEventListener('click', async () => {
        simBtn.disabled = true;
        simBtn.textContent = 'Đang gửi SePay Webhook...';
        try {
          await api(`/payment/simulate/${order.order_id}`, { method: 'POST' });
          clearPaymentTimers();
          showToast(`SePay Webhook xác nhận thành công đơn #${order.order_id}!`);
          modalContainer.innerHTML = '';
          loadMyOrdersPage();
        } catch (err) {
          showToast(err.message);
          simBtn.disabled = false;
          simBtn.textContent = '⚡ Giả lập Webhook Thanh toán Thành công (Demo)';
        }
      });
    }
  }

  // ==========================================
  // Module 3: Customer Order Tracking (TV3)
  // ==========================================
  function renderStatusBadge(status) {
    if (status === 'Completed' || status === 'Paid') return `<span class="badge badge-in-stock">${escapeHtml(status)}</span>`;
    if (status === 'Packing') return `<span class="badge badge-packing">${escapeHtml(status)}</span>`;
    if (status === 'Shipped') return `<span class="badge badge-shipped">${escapeHtml(status)}</span>`;
    if (status === 'Cancelled') return `<span class="badge badge-out-stock">${escapeHtml(status)}</span>`;
    return `<span class="badge badge-low-stock">${escapeHtml(status)}</span>`;
  }

  function renderOrderStepper(status, paymentMethod = 'VietQR') {
    if (status === 'Cancelled') {
      return `
        <div style="margin:10px 0 0; background:#fef2f2; border:1px solid #fecaca; border-radius:8px; padding:10px 14px; color:#991b1b; font-weight:600; display:flex; align-items:center; gap:8px;">
          <i class="bi bi-x-circle-fill" style="font-size:16px;"></i> Đơn hàng đã bị hủy.
        </div>`;
    }

    const isCOD = paymentMethod === 'COD';

    if (isCOD) {
      // Pipeline for COD: 1. Tiếp nhận -> 2. Đóng gói -> 3. Vận chuyển -> 4. Giao hàng & Thu COD -> 5. Hoàn tất
      const steps = [
        { key: 'received', label: '1. Tiếp nhận', icon: 'bi-receipt-cutoff' },
        { key: 'packing', label: '2. Đóng gói', icon: 'bi-box-seam' },
        { key: 'shipped', label: '3. Vận chuyển', icon: 'bi-truck' },
        { key: 'cod_collect', label: '4. Thu tiền COD', icon: 'bi-cash-coin' },
        { key: 'completed', label: '5. Hoàn tất', icon: 'bi-check2-circle' },
      ];

      let curIdx = 0;
      if (status === 'Packing') curIdx = 1;
      else if (status === 'Shipped') curIdx = 2;
      else if (status === 'Completed') curIdx = 4;

      return `
        <div class="order-stepper">
          ${steps.map((st, idx) => {
            let cls = '';
            if (status === 'Completed' || idx < curIdx) cls = 'done';
            else if (idx === curIdx) cls = 'current';
            return `
              <div class="step-node ${cls}">
                <i class="bi ${st.icon}"></i>
                <span>${st.label}</span>
              </div>
            `;
          }).join('')}
        </div>`;
    }

    // Pipeline for Bank Transfer (VietQR)
    const steps = [
      { key: 'Pending', label: '1. Tiếp nhận', icon: 'bi-receipt-cutoff' },
      { key: 'Paid', label: '2. Đã thanh toán', icon: 'bi-wallet2' },
      { key: 'Packing', label: '3. Đóng gói', icon: 'bi-box-seam' },
      { key: 'Shipped', label: '4. Vận chuyển', icon: 'bi-truck' },
      { key: 'Completed', label: '5. Hoàn tất', icon: 'bi-check2-circle' },
    ];
    const keys = ['Pending', 'Paid', 'Packing', 'Shipped', 'Completed'];
    const curIdx = Math.max(0, keys.indexOf(status));

    return `
      <div class="order-stepper">
        ${steps.map((st, idx) => {
          let cls = '';
          if (status === 'Completed' || idx < curIdx) cls = 'done';
          else if (idx === curIdx) cls = 'current';
          return `
            <div class="step-node ${cls}">
              <i class="bi ${st.icon}"></i>
              <span>${st.label}</span>
            </div>
          `;
        }).join('')}
      </div>`;
  }

  async function loadMyOrdersPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="empty-state">Đang tải lịch sử đơn hàng của bạn...</div>';
    try {
      const data = await api('/orders/my?limit=50');
      state.myOrders = data.orders || [];
      renderMyOrders(content);
    } catch (err) {
      content.innerHTML = `<div class="alert">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderMyOrders(content) {
    content.innerHTML = `
      <div class="page-heading">
        <div>
          <h2>Theo dõi Đơn hàng của tôi</h2>
          <p class="subtle">Tra cứu tiến độ xử lý đơn hàng và thanh toán lại qua Chuyển khoản VietQR nếu đơn đang chờ</p>
        </div>
        <button class="btn-primary" id="btn-shop-more">🛒 Tiếp tục mua linh kiện</button>
      </div>
      ${state.myOrders.length === 0 ? `
        <div class="panel" style="text-align:center; padding:45px;">
          <p class="subtle">Bạn chưa có đơn hàng nào.</p>
        </div>
      ` : `
        <div style="display:grid; gap:16px;">
          ${state.myOrders.map((o) => `
            <div class="panel">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                  <strong style="font-size:16px;">Đơn hàng #${o.order_id}</strong>
                  <span style="margin-left:8px;">${renderStatusBadge(o.status)}</span>
                  <span class="badge" style="margin-left:6px; background:#f1f5f9; color:#334155;">
                    ${escapeHtml(formatPaymentMethodName(o.payment_method))}
                  </span>
                  <div class="subtle" style="font-size:12px; margin-top:4px;">
                    Ngày đặt: ${new Date(o.created_at).toLocaleString('vi-VN')} · Mã CK: <code>${escapeHtml(o.transferContent || `ORDER${o.order_id}`)}</code> · ${o.total_quantity || o.item_count || (o.items ? o.items.length : 0)} sản phẩm
                  </div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                  <strong style="font-size:17px; color:#b43403;">${escapeHtml(formatCurrency(o.total_amount))}</strong>
                  <button class="btn-secondary btn-order-detail" data-id="${o.order_id}">Xem chi tiết</button>
                  ${o.status === 'Pending' && o.payment_method !== 'COD' ? `<button class="btn-primary btn-reopen-pay" data-id="${o.order_id}">Thanh toán QR</button>` : ''}
                  ${o.status === 'Pending' ? `<button class="btn-danger btn-cancel-my-order" data-id="${o.order_id}">Hủy</button>` : ''}
                </div>
              </div>
              ${renderOrderItemsPreview(o.items)}
              ${renderOrderStepper(o.status, o.payment_method)}
            </div>
          `).join('')}
        </div>
      `}`;

    document.getElementById('btn-shop-more').addEventListener('click', () => {
      state.page = 'storefront';
      renderApp();
    });

    content.querySelectorAll('.btn-expand-order-items').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const wrap = e.currentTarget.closest('.order-items-preview');
        const hiddenWrap = wrap?.querySelector('.order-items-hidden');
        if (!hiddenWrap) return;
        const isHidden = hiddenWrap.style.display === 'none';
        if (isHidden) {
          hiddenWrap.style.display = 'flex';
          btn.innerHTML = '<i class="bi bi-chevron-up"></i> Thu gọn danh sách';
        } else {
          hiddenWrap.style.display = 'none';
          const count = hiddenWrap.children.length;
          btn.innerHTML = `<i class="bi bi-chevron-down"></i> Xem thêm ${count} sản phẩm khác`;
        }
      });
    });

    content.querySelectorAll('.btn-order-detail').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const data = await api(`/orders/${btn.dataset.id}`);
          openOrderDetailModal(data.order, data.payment);
        } catch (err) { showToast(err.message); }
      });
    });

    content.querySelectorAll('.btn-reopen-pay').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const data = await api(`/orders/${btn.dataset.id}`);
          openPaymentModal(data.order, data.payment);
        } catch (err) { showToast(err.message); }
      });
    });

    content.querySelectorAll('.btn-cancel-my-order').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!window.confirm(`Bạn chắc chắn muốn hủy đơn hàng #${btn.dataset.id}?`)) return;
        try {
          await api(`/orders/${btn.dataset.id}/cancel`, { method: 'POST' });
          showToast(`Đã hủy đơn hàng #${btn.dataset.id}.`);
          loadMyOrdersPage();
        } catch (err) { showToast(err.message); }
      });
    });
  }

  function openOrderDetailModal(order, payment) {
    modalContainer.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-box" style="max-width:680px;">
          <div class="modal-header">
            <h3>Chi tiết Đơn hàng #${order.order_id}</h3>
            <button class="modal-close" id="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
              <div>
                <div><strong>Khách hàng:</strong> ${escapeHtml(order.customer_name || order.username)}</div>
                <div class="subtle" style="font-size:12px;">Session ID: <code>${escapeHtml(order.session_id || 'N/A')}</code></div>
              </div>
              <div>
                ${renderStatusBadge(order.status)}
                <span class="badge" style="background:#f1f5f9; color:#334155;">${escapeHtml(formatPaymentMethodName(order.payment_method))}</span>
              </div>
            </div>
            ${renderOrderStepper(order.status, order.payment_method)}
            <div class="table-wrap">
              <table style="min-width:480px;">
                <thead><tr><th>Linh kiện</th><th>SKU</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                <tbody>
                  ${(order.items || []).map((i) => `
                    <tr>
                      <td><strong>${escapeHtml(i.product_name)}</strong><br><small class="subtle">${escapeHtml(i.brand)} · ${escapeHtml(i.category_name)}</small></td>
                      <td><code>${escapeHtml(i.sku)}</code></td>
                      <td>${i.quantity}</td>
                      <td>${escapeHtml(formatCurrency(i.unit_price))}</td>
                      <td><strong>${escapeHtml(formatCurrency(i.subtotal))}</strong></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div style="text-align:right; font-size:17px;">
              Tổng cộng: <strong style="color:#b43403;">${escapeHtml(formatCurrency(order.total_amount))}</strong>
            </div>
          </div>
          <div class="modal-footer">
            ${order.status === 'Pending' && order.payment_method !== 'COD' ? `<button type="button" class="btn-primary" id="modal-open-qr">Mở mã thanh toán Chuyển khoản QR</button>` : ''}
            <button type="button" class="btn-secondary" id="modal-cancel-btn">Đóng</button>
          </div>
        </div>
      </div>`;

    const close = () => { modalContainer.innerHTML = ''; };
    document.getElementById('modal-close-btn').addEventListener('click', close);
    document.getElementById('modal-cancel-btn').addEventListener('click', close);
    const qrBtn = document.getElementById('modal-open-qr');
    if (qrBtn) {
      qrBtn.addEventListener('click', () => openPaymentModal(order, payment));
    }
  }

  // ==========================================
  // Module 4: Admin/Staff Order Fulfillment Management
  // ==========================================
  async function loadAdminOrdersPage() {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="empty-state">Đang tải danh sách đơn hàng hệ thống...</div>';
    try {
      const q = new URLSearchParams({ limit: 50 });
      if (state.adminOrderFilter.status) q.set('status', state.adminOrderFilter.status);
      if (state.adminOrderFilter.paymentMethod) q.set('paymentMethod', state.adminOrderFilter.paymentMethod);
      if (state.adminOrderFilter.search) q.set('search', state.adminOrderFilter.search);
      const data = await api(`/admin/orders?${q.toString()}`);
      state.adminOrders = data.orders || [];
      renderAdminOrders(content);
    } catch (err) {
      content.innerHTML = `<div class="alert">${escapeHtml(err.message)}</div>`;
    }
  }

  function renderAdminOrders(content) {
    const allowedMap = {
      Pending: ['Paid', 'Packing', 'Cancelled'],
      Paid: ['Packing', 'Cancelled'],
      Packing: ['Shipped', 'Cancelled'],
      Shipped: ['Completed'],
      Completed: [],
      Cancelled: [],
    };

    content.innerHTML = `
      <div class="page-heading">
        <div>
          <h2>Quản lý & Duyệt Đơn hàng (Fulfillment Pipeline)</h2>
          <p class="subtle">Quy trình: Pending → Paid → Packing → Shipped → Completed (tự động trừ/hoàn kho)</p>
        </div>
      </div>
      <div class="toolbar">
        <input id="admin-order-search" placeholder="Tìm mã đơn, khách hàng, session..." value="${escapeHtml(state.adminOrderFilter.search)}">
        <select id="admin-order-status">
          <option value="">Tất cả trạng thái</option>
          ${['Pending', 'Paid', 'Packing', 'Shipped', 'Completed', 'Cancelled'].map((s) => `<option value="${s}" ${state.adminOrderFilter.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <select id="admin-order-method">
          <option value="">Tất cả thanh toán</option>
          ${['VietQR', 'ZaloPay', 'COD'].map((m) => `<option value="${m}" ${state.adminOrderFilter.paymentMethod === m ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        <button class="btn-primary" id="btn-filter-admin-orders">Lọc</button>
      </div>
      <div class="panel">
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>Mã đơn</th><th>Khách hàng</th><th>Mã CK</th><th>Thanh toán</th><th>Tổng tiền</th><th>Trạng thái</th><th>Chuyển trạng thái</th><th>Chi tiết</th></tr>
            </thead>
            <tbody>
              ${state.adminOrders.length === 0 ? '<tr><td colspan="8" style="text-align:center; padding:30px;">Không có đơn hàng nào phù hợp.</td></tr>' : ''}
              ${state.adminOrders.map((o) => {
                const nextOptions = allowedMap[o.status] || [];
                return `
                  <tr>
                    <td><strong>#${o.order_id}</strong></td>
                    <td>${escapeHtml(o.customer_name || o.username)}<br><small class="subtle">${new Date(o.created_at).toLocaleString('vi-VN')}</small></td>
                    <td><code>${escapeHtml(o.transferContent)}</code></td>
                    <td><span class="badge" style="background:#f1f5f9; color:#334155;">${escapeHtml(formatPaymentMethodName(o.payment_method))}</span></td>
                    <td><strong>${escapeHtml(formatCurrency(o.total_amount))}</strong></td>
                    <td>${renderStatusBadge(o.status)}</td>
                    <td>
                      ${nextOptions.length > 0 ? `
                        <select class="admin-order-next-status user-role-select" data-id="${o.order_id}">
                          <option value="">— Chọn bước tiếp —</option>
                          ${nextOptions.map((st) => `<option value="${st}">${st}</option>`).join('')}
                        </select>
                      ` : '<small class="subtle">Đã kết thúc</small>'}
                    </td>
                    <td><button class="btn-secondary admin-view-order" data-id="${o.order_id}">Chi tiết</button></td>
                  </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>`;

    const adminSearchInput = document.getElementById('admin-order-search');
    const adminStatusSelect = document.getElementById('admin-order-status');
    const adminMethodSelect = document.getElementById('admin-order-method');

    adminStatusSelect?.addEventListener('change', () => {
      state.adminOrderFilter.status = adminStatusSelect.value;
      state.adminOrderFilter.search = adminSearchInput ? adminSearchInput.value.trim() : '';
      loadAdminOrdersPage();
    });

    adminMethodSelect?.addEventListener('change', () => {
      state.adminOrderFilter.paymentMethod = adminMethodSelect.value;
      state.adminOrderFilter.search = adminSearchInput ? adminSearchInput.value.trim() : '';
      loadAdminOrdersPage();
    });

    let adminSearchTimer;
    adminSearchInput?.addEventListener('input', () => {
      clearTimeout(adminSearchTimer);
      adminSearchTimer = setTimeout(() => {
        state.adminOrderFilter.search = adminSearchInput.value.trim();
        loadAdminOrdersPage();
      }, 250);
    });

    document.getElementById('btn-filter-admin-orders').addEventListener('click', () => {
      state.adminOrderFilter.search = adminSearchInput.value.trim();
      state.adminOrderFilter.status = adminStatusSelect.value;
      state.adminOrderFilter.paymentMethod = adminMethodSelect.value;
      loadAdminOrdersPage();
    });

    content.querySelectorAll('.admin-order-next-status').forEach((sel) => {
      sel.addEventListener('change', async (e) => {
        const nextStatus = e.target.value;
        if (!nextStatus) return;
        try {
          const res = await api(`/admin/orders/${sel.dataset.id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status: nextStatus }),
          });
          showToast(`Đơn #${sel.dataset.id} → ${nextStatus}${res.stockChanged ? ' (Đã đồng bộ tồn kho)' : ''}.`);
          loadAdminOrdersPage();
        } catch (err) {
          showToast(err.message);
          loadAdminOrdersPage();
        }
      });
    });

    content.querySelectorAll('.admin-view-order').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const data = await api(`/orders/${btn.dataset.id}`);
          openOrderDetailModal(data.order, data.payment);
        } catch (err) { showToast(err.message); }
      });
    });
  }

  // ==========================================
  // Application Bootstrapping
  // ==========================================
  async function init() {
    ensureVisitTracked();
    if (state.token) {
      try {
        const data = await api('/auth/me');
        state.user = data.user;
        state.page = (state.user.role === 'Admin') ? 'dashboard' : (state.user.role === 'Staff' ? 'products' : 'storefront');
        renderApp();
        return;
      } catch (_e) {
        setToken('');
      }
    }
    state.user = { role: 'Customer', username: 'guest', fullName: 'Khách vãng lai' };
    state.page = 'storefront';
    renderApp();
  }

  init();
})();
