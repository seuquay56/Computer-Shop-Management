const crypto = require('crypto');

function removeVietnameseTones(str) {
  return String(str ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function normalizeText(value) {
  return removeVietnameseTones(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function buildOrderTransferContent(orderId, prefix = 'CSORDER') {
  const cleanPrefix = normalizeText(prefix) || 'CSORDER';
  return `${cleanPrefix}${orderId}`;
}

function buildQrUrl(order, sepayConfig) {
  const content = order?.transferContent || order?.invoice || '';
  const amount = Math.round(Number(order?.amount ?? order?.totalAmount ?? 0));
  const params = new URLSearchParams({
    acc: sepayConfig.bankAccount || '',
    bank: sepayConfig.bankCode || 'MBBank',
    amount: String(amount),
    des: content,
  });

  if (sepayConfig.qrTemplate) {
    params.set('template', sepayConfig.qrTemplate);
  }
  return `https://qr.sepay.vn/img?${params.toString()}`;
}

function buildQuickQrUrl({ amount, content }, sepayConfig) {
  const cleanContent = removeVietnameseTones(content || '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, '')
    .trim();

  const params = new URLSearchParams({
    acc: sepayConfig.bankAccount || '',
    bank: sepayConfig.bankCode || 'MBBank',
    amount: String(Math.round(Number(amount || 0))),
    des: cleanContent,
  });

  if (sepayConfig.qrTemplate) {
    params.set('template', sepayConfig.qrTemplate);
  }
  return `https://qr.sepay.vn/img?${params.toString()}`;
}

function normalizeTransaction(raw, source = 'webhook') {
  if (raw?.notification_type && raw?.order) {
    return {
      id: String(raw.transaction?.id || raw.order?.order_invoice_number || raw.timestamp || ''),
      source,
      transferType: 'in',
      amount: Number(raw.transaction?.transaction_amount ?? raw.order?.order_amount ?? 0),
      accountNumber: '',
      code: raw.order?.order_invoice_number ?? '',
      content: `${raw.order?.order_invoice_number ?? ''} ${raw.order?.order_description ?? ''}`.trim(),
      referenceCode: raw.transaction?.transaction_id ?? '',
      transactionDate: raw.transaction?.transaction_date ?? '',
      raw,
    };
  }

  return {
    id: String(raw?.id ?? raw?.referenceCode ?? raw?.reference_number ?? ''),
    source,
    transferType: raw?.transferType ?? raw?.transfer_type ?? '',
    amount: Number(raw?.transferAmount ?? raw?.amount_in ?? raw?.amount ?? 0),
    accountNumber: String(raw?.accountNumber ?? raw?.account_number ?? ''),
    code: raw?.code ?? '',
    content: raw?.content ?? raw?.transaction_content ?? raw?.description ?? '',
    referenceCode: raw?.referenceCode ?? raw?.reference_number ?? '',
    transactionDate: raw?.transactionDate ?? raw?.transaction_date ?? '',
    raw,
  };
}

function transactionKey(transaction) {
  return [transaction.source, transaction.id, transaction.referenceCode, transaction.amount]
    .filter(Boolean)
    .join(':');
}

function extractOrderIdFromText(text, prefix = 'CSORDER') {
  const cleanPrefix = normalizeText(prefix) || 'CSORDER';
  const normalized = normalizeText(text);
  const match = normalized.match(new RegExp(`${cleanPrefix}(\\d+)`, 'i'));
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function transactionMatchesOrder(transaction, order, sepayConfig = {}) {
  if (normalizeText(transaction.transferType) !== 'IN') return false;
  const txAmount = Math.round(Number(transaction.amount || 0));
  const orderAmount = Math.round(Number(order.amount ?? order.total_amount ?? order.totalAmount ?? 0));
  if (txAmount <= 0 || txAmount !== orderAmount) return false;

  if (
    sepayConfig.bankAccount &&
    transaction.accountNumber &&
    String(transaction.accountNumber).trim() !== String(sepayConfig.bankAccount).trim()
  ) {
    return false;
  }

  const txCode = normalizeText(transaction.code);
  const txContent = normalizeText(transaction.content);

  const targets = [];
  if (order.transferContent) targets.push(normalizeText(order.transferContent));
  if (order.invoice) targets.push(normalizeText(order.invoice));

  return targets.some((target) => {
    if (!target) return false;
    if (txCode === target) return true;
    // Ensure CSORDER1 does not falsely match CSORDER10 by checking trailing non-digit boundary
    const regex = new RegExp(`${target}(?!\\d)`);
    return regex.test(txContent);
  });
}

function safeCompare(a, b) {
  const bufA = Buffer.from(String(a || ''), 'utf8');
  const bufB = Buffer.from(String(b || ''), 'utf8');
  if (bufA.length === 0 || bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyWebhookApiKey(authorizationHeader, expectedApiKey) {
  if (!expectedApiKey || typeof authorizationHeader !== 'string') return false;
  const match = authorizationHeader.trim().match(/^Apikey\s+(.+)$/i);
  if (!match) return false;
  return safeCompare(match[1].trim(), expectedApiKey.trim());
}

function createHmacSignature(payload, secret) {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', String(secret)).update(serialized).digest('hex');
}

function verifyHmacSignature(payload, signature, secret) {
  if (!signature || !secret) return false;
  const expected = createHmacSignature(payload, secret);
  return safeCompare(String(signature).trim().toLowerCase(), expected.toLowerCase());
}

function formatDateTimeVn(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

async function fetchTransactions({ q, fromDate } = {}, sepayConfig = {}) {
  if (!sepayConfig.apiToken) return [];

  const params = new URLSearchParams({
    transfer_type: 'in',
    per_page: '100',
    transaction_date_sort: 'desc',
    fields:
      'id,transaction_date,account_number,amount_in,transaction_content,reference_number,code,bank_brand_name,bank_account_id,transfer_type',
  });

  if (q) params.set('q', q);
  if (fromDate) params.set('transaction_date_from', formatDateTimeVn(fromDate));
  if (sepayConfig.bankAccountId) params.set('bank_account_id', sepayConfig.bankAccountId);

  const response = await fetch(`https://userapi.sepay.vn/v2/transactions?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${sepayConfig.apiToken}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`SePay API ${response.status}: ${text.slice(0, 200)}`);
  }

  const body = await response.json();
  return Array.isArray(body.data)
    ? body.data.map((item) => normalizeTransaction(item, 'reconcile'))
    : [];
}

module.exports = {
  buildOrderTransferContent,
  buildQrUrl,
  buildQuickQrUrl,
  createHmacSignature,
  extractOrderIdFromText,
  fetchTransactions,
  formatDateTimeVn,
  normalizeText,
  normalizeTransaction,
  removeVietnameseTones,
  transactionKey,
  transactionMatchesOrder,
  verifyHmacSignature,
  verifyWebhookApiKey,
};
