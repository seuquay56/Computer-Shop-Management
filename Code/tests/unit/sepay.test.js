const sepay = require('../../src/utils/sepay');

describe('Unit Tests: SePay VietQR & Payment Security Utility (sepay.js)', () => {
  const sampleConfig = {
    bankAccount: '0123456789',
    bankCode: 'MBBank',
    accountName: 'COMPUTER SHOP VN',
    qrTemplate: 'compact',
    webhookApiKey: 'test_sepay_webhook_api_key_2026',
  };

  test('UT-01: strips Vietnamese diacritics and normalizes text accurately', () => {
    expect(sepay.removeVietnameseTones('Đơn hàng Máy tính số 15')).toBe('Don hang May tinh so 15');
    expect(sepay.normalizeText('cs-order 15 / thanh toán')).toBe('CSORDER15THANHTOAN');
  });

  test('UT-02: builds deterministic transfer content with order prefix', () => {
    expect(sepay.buildOrderTransferContent(42, 'CSORDER')).toBe('CSORDER42');
    expect(sepay.buildOrderTransferContent(7, 'cs-shop')).toBe('CSSHOP7');
  });

  test('UT-03: generates valid SePay dynamic VietQR image URL with query params', () => {
    const url = sepay.buildQrUrl(
      { amount: 15490000, transferContent: 'CSORDER15' },
      sampleConfig
    );
    expect(url).toContain('https://qr.sepay.vn/img?');
    expect(url).toContain('acc=0123456789');
    expect(url).toContain('bank=MBBank');
    expect(url).toContain('amount=15490000');
    expect(url).toContain('des=CSORDER15');
    expect(url).toContain('template=compact');
  });

  test('UT-04: normalizes standard SePay bank webhook payload', () => {
    const tx = sepay.normalizeTransaction({
      id: 99812,
      transferType: 'in',
      transferAmount: 26990000,
      accountNumber: '0123456789',
      code: 'CSORDER22',
      content: 'CSORDER22 chuyen khoan mua GPU',
      referenceCode: 'FT263220001',
      transactionDate: '2026-11-18 17:05:00',
    });

    expect(tx.id).toBe('99812');
    expect(tx.transferType).toBe('in');
    expect(tx.amount).toBe(26990000);
    expect(tx.code).toBe('CSORDER22');
    expect(tx.referenceCode).toBe('FT263220001');
  });

  test('UT-05: normalizes SePay Order Notification payload format', () => {
    const tx = sepay.normalizeTransaction({
      notification_type: 'ORDER_PAID',
      order: {
        order_invoice_number: 'CSORDER30',
        order_amount: 11290000,
        order_description: 'Ryzen 7 7800X3D',
      },
      transaction: {
        id: 'TX-30',
        transaction_amount: 11290000,
        transaction_id: 'REF-30',
        transaction_date: '2026-11-18 17:10:00',
      },
    });

    expect(tx.transferType).toBe('in');
    expect(tx.amount).toBe(11290000);
    expect(tx.code).toBe('CSORDER30');
  });

  test('UT-06: extracts numeric order ID cleanly from transfer content', () => {
    expect(sepay.extractOrderIdFromText('MBVCB CSORDER108 thanh toan', 'CSORDER')).toBe(108);
    expect(sepay.extractOrderIdFromText('chuyen khoan khong ma don', 'CSORDER')).toBeNull();
  });

  test('UT-07: matches incoming SePay transaction with exact amount, account, and code', () => {
    const tx = sepay.normalizeTransaction({
      transferType: 'in',
      transferAmount: 15490000,
      accountNumber: '0123456789',
      content: 'IBFT CSORDER15 mua CPU Intel',
    });
    const order = { amount: 15490000, transferContent: 'CSORDER15' };
    expect(sepay.transactionMatchesOrder(tx, order, sampleConfig)).toBe(true);
  });

  test('UT-08: prevents false prefix collision (CSORDER1 must not match CSORDER10)', () => {
    const tx = sepay.normalizeTransaction({
      transferType: 'in',
      transferAmount: 3250000,
      accountNumber: '0123456789',
      content: 'Thanh toan CSORDER10',
    });
    const order1 = { amount: 3250000, transferContent: 'CSORDER1' };
    const order10 = { amount: 3250000, transferContent: 'CSORDER10' };

    expect(sepay.transactionMatchesOrder(tx, order1, sampleConfig)).toBe(false);
    expect(sepay.transactionMatchesOrder(tx, order10, sampleConfig)).toBe(true);
  });

  test('UT-09: rejects transaction on amount mismatch, outgoing transfer, or wrong bank account', () => {
    const order = { amount: 10000000, transferContent: 'CSORDER5' };

    const wrongAmount = sepay.normalizeTransaction({
      transferType: 'in', transferAmount: 9999000, accountNumber: '0123456789', content: 'CSORDER5',
    });
    const outgoing = sepay.normalizeTransaction({
      transferType: 'out', transferAmount: 10000000, accountNumber: '0123456789', content: 'CSORDER5',
    });
    const wrongAccount = sepay.normalizeTransaction({
      transferType: 'in', transferAmount: 10000000, accountNumber: '9999999999', content: 'CSORDER5',
    });

    expect(sepay.transactionMatchesOrder(wrongAmount, order, sampleConfig)).toBe(false);
    expect(sepay.transactionMatchesOrder(outgoing, order, sampleConfig)).toBe(false);
    expect(sepay.transactionMatchesOrder(wrongAccount, order, sampleConfig)).toBe(false);
  });

  test('UT-10: verifies SePay Authorization Apikey header using constant-time comparison', () => {
    expect(sepay.verifyWebhookApiKey('Apikey test_sepay_webhook_api_key_2026', sampleConfig.webhookApiKey)).toBe(true);
    expect(sepay.verifyWebhookApiKey('apikey test_sepay_webhook_api_key_2026', sampleConfig.webhookApiKey)).toBe(true);
    expect(sepay.verifyWebhookApiKey('Bearer test_sepay_webhook_api_key_2026', sampleConfig.webhookApiKey)).toBe(false);
    expect(sepay.verifyWebhookApiKey('Apikey wrong_key', sampleConfig.webhookApiKey)).toBe(false);
    expect(sepay.verifyWebhookApiKey('', sampleConfig.webhookApiKey)).toBe(false);
  });

  test('UT-11: signs and verifies HMAC-SHA256 callback payloads accurately', () => {
    const payload = { orderId: 12, amount: 8990000, status: 'PAID', transactionId: 'ZP-1001' };
    const secret = 'test_hmac_secret';
    const sig = sepay.createHmacSignature(payload, secret);

    expect(sepay.verifyHmacSignature(payload, sig, secret)).toBe(true);
    expect(sepay.verifyHmacSignature({ ...payload, amount: 1000 }, sig, secret)).toBe(false);
    expect(sepay.verifyHmacSignature(payload, 'invalid_signature', secret)).toBe(false);
  });

  test('UT-12: formats Vietnam local datetime (UTC+7) for SePay reconciliation API', () => {
    const formatted = sepay.formatDateTimeVn(new Date('2026-11-18T10:00:00Z'));
    expect(formatted).toBe('2026-11-18 17:00:00');
  });
});
