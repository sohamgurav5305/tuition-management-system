import { Payment, Student } from '../types';
import { formatDate, formatDateTime } from './date';

export function numberToWords(num: number): string {
  if (!num || num === 0) return 'Rupees Zero Only';
  const a = [
    '',
    'One ',
    'Two ',
    'Three ',
    'Four ',
    'Five ',
    'Six ',
    'Seven ',
    'Eight ',
    'Nine ',
    'Ten ',
    'Eleven ',
    'Twelve ',
    'Thirteen ',
    'Fourteen ',
    'Fifteen ',
    'Sixteen ',
    'Seventeen ',
    'Eighteen ',
    'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return a[n];
    const digit = n % 10;
    if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit].toLowerCase() : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + inWords(n % 100));
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let result = `Rupees ${inWords(integerPart).trim()}`;
  if (decimalPart > 0) {
    result += ` and ${inWords(decimalPart).trim()} Paise`;
  }
  return `${result} Only`;
}

interface PrintReceiptOptions {
  payment: Payment;
  settings: any;
}

export function generateReceiptHtml({ payment, settings }: PrintReceiptOptions): string {
  const student = payment.student;
  const instituteName = settings.instituteName || 'Apex Coaching Institute';
  const address = settings.address || settings.instituteAddress || 'Campus Road No. 1, Knowledge Park';
  const contactPhone = settings.contactPhone || settings.institutePhone || '+91 (020) 2553-8900';
  const contactEmail = settings.contactEmail || settings.instituteEmail || 'admissions@apexcoaching.edu.in';
  const academicYear = settings.academicYear || '2026-2027';
  const currency = settings.currencySymbol || '₹';
  const formattedAmount = `${currency} ${Number(payment.amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const amountWords = numberToWords(Number(payment.amount));

  const totalFee = student?.totalFee ? `${currency} ${Number(student.totalFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';
  const paidFee = student?.paidFee ? `${currency} ${Number(student.paidFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : formattedAmount;
  const pendingFee = student?.pendingFee !== undefined ? `${currency} ${Number(student.pendingFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Fee Receipt - ${payment.receiptId}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
    }
    body {
      background: #ffffff;
      padding: 0;
      font-size: 12px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .receipt-wrapper {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #1e293b;
      padding: 24px;
      background: #ffffff;
      position: relative;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 72px;
      font-weight: 900;
      color: rgba(30, 41, 59, 0.04);
      text-transform: uppercase;
      letter-spacing: 6px;
      pointer-events: none;
      z-index: 0;
      white-space: nowrap;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #1e293b;
      padding-bottom: 16px;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    .brand-left {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .logo-badge {
      width: 48px;
      height: 48px;
      background: #1e3a8a;
      color: #ffffff;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -1px;
    }
    .inst-name {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .inst-sub {
      font-size: 10.5px;
      color: #475569;
      margin-top: 2px;
    }
    .inst-contact {
      font-size: 10px;
      color: #64748b;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
    }
    .receipt-title {
      font-size: 14px;
      font-weight: 800;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 4px 10px;
      border-radius: 4px;
      display: inline-block;
    }
    .receipt-meta {
      margin-top: 8px;
      font-size: 11px;
    }
    .receipt-meta strong {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #0f172a;
    }
    .copy-type {
      display: inline-block;
      margin-top: 4px;
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 18px;
      position: relative;
      z-index: 1;
    }
    .section-card {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 14px;
      background: #f8fafc;
    }
    .section-title {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #475569;
      letter-spacing: 0.8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .field-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 11px;
    }
    .field-label {
      color: #64748b;
      font-weight: 500;
    }
    .field-value {
      font-weight: 700;
      color: #0f172a;
      text-align: right;
    }

    /* Fee Table */
    .fee-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    .fee-table th {
      background: #1e293b;
      color: #ffffff;
      text-align: left;
      padding: 8px 10px;
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .fee-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11px;
    }
    .fee-table tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }

    /* Total Box */
    .total-banner {
      border: 1.5px solid #2563eb;
      background: #eff6ff;
      border-radius: 6px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      position: relative;
      z-index: 1;
    }
    .total-label {
      font-size: 11px;
      font-weight: 800;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .total-words {
      font-size: 10.5px;
      color: #1e40af;
      font-style: italic;
      margin-top: 2px;
    }
    .total-amount {
      font-size: 20px;
      font-weight: 900;
      color: #1e3a8a;
      font-family: ui-monospace, monospace;
    }

    /* Account Ledger */
    .ledger-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    .ledger-box {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      background: #ffffff;
      text-align: center;
    }
    .ledger-box.balance {
      border-color: #fca5a5;
      background: #fff1f2;
    }
    .ledger-box.paid {
      border-color: #86efac;
      background: #f0fdf4;
    }
    .ledger-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
    }
    .ledger-val {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .ledger-box.balance .ledger-val {
      color: #b91c1c;
    }
    .ledger-box.paid .ledger-val {
      color: #15803d;
    }

    /* Signatures & Footer */
    .footer-signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 28px;
      padding-top: 12px;
      position: relative;
      z-index: 1;
    }
    .stamp-box {
      border: 1.5px dashed #059669;
      color: #059669;
      border-radius: 6px;
      padding: 6px 12px;
      text-align: center;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: inline-block;
    }
    .sig-line {
      width: 170px;
      border-top: 1.5px solid #334155;
      text-align: center;
      padding-top: 4px;
      font-size: 10.5px;
      font-weight: 700;
      color: #334155;
    }

    /* Terms */
    .terms {
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #64748b;
      line-height: 1.4;
      position: relative;
      z-index: 1;
    }
    .terms ol {
      padding-left: 14px;
      margin-top: 3px;
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <div class="watermark">PAID &bull; VERIFIED</div>

    <!-- Header -->
    <div class="header">
      <div class="brand-left">
        <div class="logo-badge">A</div>
        <div>
          <h1 class="inst-name">${instituteName}</h1>
          <p class="inst-sub">${address}</p>
          <p class="inst-contact">Tel: ${contactPhone} &bull; Email: ${contactEmail} &bull; Session: ${academicYear}</p>
        </div>
      </div>
      <div class="header-right">
        <div class="receipt-title">FEE PAYMENT RECEIPT</div>
        <div class="receipt-meta">
          <div>Receipt No: <strong>${payment.receiptId}</strong></div>
          <div>Date: <strong>${formatDate(payment.paymentDate)}</strong></div>
        </div>
        <span class="copy-type">[ Original - Student Copy ]</span>
      </div>
    </div>

    <!-- Details Grid -->
    <div class="details-grid">
      <!-- Student Information -->
      <div class="section-card">
        <div class="section-title">Student Particulars</div>
        <div class="field-row">
          <span class="field-label">Student Name:</span>
          <span class="field-value">${student ? `${student.firstName} ${student.lastName}` : 'Enrolled Student'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Student ID:</span>
          <span class="field-value" style="font-family: monospace;">${student?.studentId || '—'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Guardian / Parent:</span>
          <span class="field-value">${student?.guardianName ? `${student.guardianName} (${student.guardianRelation || 'Guardian'})` : '—'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Contact Phone:</span>
          <span class="field-value">${student?.phone || '—'}</span>
        </div>
      </div>

      <!-- Academic & Enrollment Info -->
      <div class="section-card">
        <div class="section-title">Academic Enrollment</div>
        <div class="field-row">
          <span class="field-label">Program / Course:</span>
          <span class="field-value">${student?.course?.name || 'Academic Coaching Program'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Target Exam:</span>
          <span class="field-value">${student?.course?.targetExam || 'Foundation / Entrance'}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Batch:</span>
          <span class="field-value">${student?.batch?.name || 'Assigned Batch'}</span>
        </div>
      </div>
    </div>

    <!-- Particulars Table -->
    <table class="fee-table">
      <thead>
        <tr>
          <th style="width: 45px;" class="text-center">S.No</th>
          <th>Particulars / Description of Services</th>
          <th style="width: 100px;" class="text-center">SAC Code</th>
          <th style="width: 120px;" class="text-center">Payment Mode</th>
          <th style="width: 130px;" class="text-right">Amount (${currency})</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-center">1</td>
          <td>
            <strong>${payment.remarks || 'Academic Tuition Fee Installment'}</strong>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
              Includes Interactive Lectures, Daily Practice Problems (DPP), Study Material & Test Series
              ${payment.transactionReference ? ` &bull; Ref: <span style="font-family: monospace;">${payment.transactionReference}</span>` : ''}
            </div>
          </td>
          <td class="text-center" style="font-family: monospace;">999293</td>
          <td class="text-center"><strong>${payment.paymentMode}</strong></td>
          <td class="text-right" style="font-weight: 800; font-family: monospace;">${formattedAmount}</td>
        </tr>
      </tbody>
    </table>

    <!-- Amount Received Banner -->
    <div class="total-banner">
      <div>
        <div class="total-label">Amount Received in Full</div>
        <div class="total-words">${amountWords}</div>
      </div>
      <div class="total-amount">${formattedAmount}</div>
    </div>

    <!-- Fee Account Ledger Summary -->
    <div class="ledger-grid">
      <div class="ledger-box">
        <div class="ledger-title">Total Course Tuition</div>
        <div class="ledger-val">${totalFee}</div>
      </div>
      <div class="ledger-box paid">
        <div class="ledger-title">Total Fee Deposited to Date</div>
        <div class="ledger-val">${paidFee}</div>
      </div>
      <div class="ledger-box balance">
        <div class="ledger-title">Remaining Balance Due</div>
        <div class="ledger-val">${pendingFee}</div>
      </div>
    </div>

    <!-- Signatures Section -->
    <div class="footer-signatures">
      <div>
        <div class="stamp-box">&check; Electronically Verified &bull; Official Accounts Desk</div>
        <p style="font-size: 9px; color: #94a3b8; margin-top: 4px;">Txn Timestamp: ${formatDateTime(new Date())}</p>
      </div>
      <div style="display: flex; gap: 32px;">
        <div class="sig-line">
          Student / Parent Signature
        </div>
        <div class="sig-line">
          Authorized Signatory / Cashier
        </div>
      </div>
    </div>

    <!-- Terms and Conditions -->
    <div class="terms">
      <strong>Terms & Conditions:</strong>
      <ol>
        <li>Fees once deposited are non-refundable and non-transferable under any circumstances.</li>
        <li>Please preserve this official receipt for student entry badge issuance, library access, and mock test seat allocation.</li>
        <li>Any cheque / electronic transfer is subject to realization by the institute banking desk.</li>
      </ol>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>
  `.trim();
}

/**
 * Cleanly prints a fee receipt using an isolated hidden iframe.
 * Ensures 0 dark mode CSS interference, 0 modal artifacts, and pure vector rendering.
 */
export function printReceipt({ payment, settings }: PrintReceiptOptions) {
  const receiptHtml = generateReceiptHtml({ payment, settings });

  // Remove existing print iframe if any
  const existingFrame = document.getElementById('receipt-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  // Create clean isolated iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'receipt-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (doc) {
    doc.open();
    doc.write(receiptHtml);
    doc.close();
  }
}
