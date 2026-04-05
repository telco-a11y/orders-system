(function () {
  const config = window.GDL_CONFIG;
  const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
  const storageKey = 'gdl-orders';

  const $ = (id) => document.getElementById(id);
  const products = config.products || [];

  function getOrders() {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
    catch { return []; }
  }

  function setOrders(orders) {
    localStorage.setItem(storageKey, JSON.stringify(orders));
  }

  function renderSession() {
    $('sessionTitle').textContent = config.session.title;
    $('sessionSubtitle').textContent = config.session.subtitle;
    $('sessionStatus').textContent = config.session.status;
    $('joinSessionBtn').href = config.session.joinUrl;
    $('streamFrame').src = config.session.embedUrl;
    $('payDepositBtn').href = config.payments.depositPaymentUrl;
  }

  function renderProducts() {
    const board = $('productBoard');
    const select = $('productSelect');
    board.innerHTML = '';
    select.innerHTML = '';

    products.forEach((product) => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <div class="product-top">
          <div>
            <div class="product-name">${product.name}</div>
            <div class="meta">${product.supplier} · MOQ ${product.moq} · ETA ${product.eta}</div>
          </div>
          <button class="button small" data-product-id="${product.id}">Select</button>
        </div>
        <div class="price-row">
          <span class="price-chip">Unit ${currency.format(product.unitPrice)}</span>
          <span class="price-chip">Store landed ${currency.format(product.finalStorePrice)}</span>
          <span class="price-chip">Expected margin ${product.expectedMarginPct}%</span>
        </div>`;
      board.appendChild(card);

      const option = document.createElement('option');
      option.value = product.id;
      option.textContent = product.name;
      select.appendChild(option);
    });

    board.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-product-id]');
      if (!btn) return;
      $('productSelect').value = btn.dataset.productId;
      updateOrderCalc();
      location.hash = '#order';
    });

    $('statProducts').textContent = String(products.length);
  }

  function getSelectedProduct() {
    return products.find((p) => p.id === $('productSelect').value) || products[0];
  }

  function updateOrderCalc() {
    const product = getSelectedProduct();
    const qty = Math.max(1, Number($('quantityInput').value || 1));
    const total = qty * product.unitPrice;
    const deposit = total * (config.session.depositPercent / 100);

    $('unitPrice').value = currency.format(product.unitPrice);
    $('totalValue').value = currency.format(total);
    $('depositPct').value = `${config.session.depositPercent}%`;
    $('depositAmount').value = currency.format(deposit);
    $('payDepositBtn').href = config.payments.depositPaymentUrl;
  }

  async function sendWebhook(order) {
    if (!config.integrations.webhookUrl) return;
    try {
      await fetch(config.integrations.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
    } catch (err) {
      console.warn('Webhook failed', err);
    }
  }

  function exportCsv() {
    const orders = getOrders();
    if (!orders.length) return;
    const headers = ['createdAt', 'storeName', 'contactName', 'email', 'phone', 'productName', 'quantity', 'unitPrice', 'totalValue', 'depositAmount', 'notes'];
    const lines = [headers.join(',')];
    orders.forEach((o) => {
      lines.push(headers.map((h) => JSON.stringify(o[h] ?? '')).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'gdl_orders.csv';
    link.click();
  }

  function renderOrders() {
    const orders = getOrders();
    const tbody = $('ordersTableBody');
    tbody.innerHTML = '';

    let totalQty = 0;
    let totalValue = 0;
    let totalDeposits = 0;

    orders.slice().reverse().forEach((order) => {
      totalQty += Number(order.quantity);
      totalValue += Number(order.totalValueRaw);
      totalDeposits += Number(order.depositAmountRaw);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${order.storeName}</td>
        <td>${order.productName}</td>
        <td>${order.quantity}</td>
        <td>${currency.format(order.totalValueRaw)}</td>
        <td>${currency.format(order.depositAmountRaw)}</td>`;
      tbody.appendChild(tr);
    });

    $('statOrders').textContent = String(orders.length);
    $('statUnits').textContent = String(totalQty);
    $('statValue').textContent = currency.format(totalValue);

    $('adminOrders').textContent = String(orders.length);
    $('adminQty').textContent = String(totalQty);
    $('adminValue').textContent = currency.format(totalValue);
    $('adminDeposits').textContent = currency.format(totalDeposits);
  }

  function bindForm() {
    $('productSelect').addEventListener('change', updateOrderCalc);
    $('quantityInput').addEventListener('input', updateOrderCalc);
    $('exportCsvBtn').addEventListener('click', exportCsv);
    $('clearOrdersBtn').addEventListener('click', () => {
      if (!confirm('Clear all locally stored orders?')) return;
      setOrders([]);
      renderOrders();
    });

    $('orderForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.target);
      const product = getSelectedProduct();
      const quantity = Math.max(1, Number(form.get('quantity')));
      const totalValueRaw = quantity * product.unitPrice;
      const depositAmountRaw = totalValueRaw * (config.session.depositPercent / 100);

      const order = {
        createdAt: new Date().toISOString(),
        storeName: form.get('storeName'),
        contactName: form.get('contactName'),
        email: form.get('email'),
        phone: form.get('phone'),
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: currency.format(product.unitPrice),
        totalValue: currency.format(totalValueRaw),
        depositAmount: currency.format(depositAmountRaw),
        totalValueRaw,
        depositAmountRaw,
        notes: form.get('notes') || ''
      };

      const orders = getOrders();
      orders.push(order);
      setOrders(orders);
      renderOrders();
      await sendOrderToSheet(order);
      alert('Order saved locally. Next: collect deposit using the payment link.');
      e.target.reset();
      $('productSelect').value = product.id;
      $('quantityInput').value = 1;
      updateOrderCalc();
    });
  }

  renderSession();
  renderProducts();
  bindForm();
  updateOrderCalc();
  renderOrders();
})();
async function sendOrderToSheet(order) {
  await fetch("https://script.google.com/macros/s/AKfycbzaWuZUf6bgp49--2WARmd1lNN0WJWTCRG4q5Fv1xJZgXEmOt5_vaRks_qgN5_1y6si_w/exec", {
    method: "POST",
    body: JSON.stringify(order),
    headers: {
      "Content-Type": "application/json"
    }
  });
}

