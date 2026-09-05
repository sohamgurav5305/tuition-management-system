import { formatDate, formatDateTime } from './date';

export interface FeeReportStudentRow {
  studentId: string;
  rollNumber?: string | null;
  name: string;
  batchName: string;
  courseName: string;
  phone: string;
  feeTitle: string;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  dueDate: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
}

export interface FeeReportOptions {
  title?: string;
  scopeText: string;
  feeTypeText: string;
  statusFilterText: string;
  students: FeeReportStudentRow[];
  totalBilled: number;
  totalCollected: number;
  totalPending: number;
  settings?: any;
}

export function generateFeeReportHtml({
  title = 'Student Fee Ledger & Dues Record',
  scopeText,
  feeTypeText,
  statusFilterText,
  students,
  totalBilled,
  totalCollected,
  totalPending,
  settings,
}: FeeReportOptions): string {
  const instituteName = settings?.instituteName || 'Apex Career Institute';
  const instituteAddress = settings?.address || settings?.instituteAddress || 'Knowledge Park Campus';
  const institutePhone = settings?.contactPhone || settings?.institutePhone || '+91 9820000001';
  const currencySymbol = settings?.currencySymbol || '₹';

  const recoveryPct = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  const rowsHtml = students
    .map((s, idx) => {
      const isPaid = s.status === 'PAID';
      const isPartial = s.status === 'PARTIAL';
      const badgeBg = isPaid ? '#dcfce7' : isPartial ? '#fef3c7' : '#fee2e2';
      const badgeColor = isPaid ? '#15803d' : isPartial ? '#b45309' : '#b91c1c';
      const badgeText = isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; ${idx % 2 === 1 ? 'background-color: #f8fafc;' : ''}">
          <td style="padding: 7px 8px; text-align: center; color: #64748b; font-size: 10px;">${idx + 1}</td>
          <td style="padding: 7px 8px; font-family: monospace; font-weight: 700; color: #1e293b; font-size: 10px;">${s.studentId}</td>
          <td style="padding: 7px 8px; font-weight: 700; color: #0f172a; font-size: 11px;">
            ${s.name}
            ${s.phone ? `<div style="font-size: 9px; font-weight: 400; color: #64748b; margin-top: 1px;">Ph: ${s.phone}</div>` : ''}
          </td>
          <td style="padding: 7px 8px; color: #334155; font-size: 10px;">
            <div style="font-weight: 600;">${s.batchName}</div>
            <div style="font-size: 9px; color: #64748b;">${s.courseName}</div>
          </td>
          <td style="padding: 7px 8px; color: #475569; font-size: 10px; max-width: 140px;">
            ${s.feeTitle || 'Regular Tuition Fee'}
          </td>
          <td style="padding: 7px 8px; text-align: right; font-weight: 700; color: #0f172a; font-size: 10.5px;">
            ${currencySymbol} ${s.totalFee.toLocaleString('en-IN')}
          </td>
          <td style="padding: 7px 8px; text-align: right; font-weight: 700; color: #16a34a; font-size: 10.5px;">
            ${currencySymbol} ${s.paidFee.toLocaleString('en-IN')}
          </td>
          <td style="padding: 7px 8px; text-align: right; font-weight: 800; color: ${s.pendingFee > 0 ? '#dc2626' : '#64748b'}; font-size: 10.5px;">
            ${currencySymbol} ${s.pendingFee.toLocaleString('en-IN')}
          </td>
          <td style="padding: 7px 8px; text-align: center; font-family: monospace; color: #64748b; font-size: 10px;">
            ${formatDate(s.dueDate)}
          </td>
          <td style="padding: 7px 8px; text-align: center;">
            <span style="display: inline-block; padding: 2px 7px; border-radius: 4px; font-size: 9px; font-weight: 800; background: ${badgeBg}; color: ${badgeColor};">
              ${badgeText}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title} - ${instituteName}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 12px;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-table {
      width: 100%;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .kpi-container {
      display: flex;
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-box {
      flex: 1;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    .kpi-val {
      font-size: 16px;
      font-weight: 800;
      margin-top: 2px;
    }
    .records-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    .records-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      font-size: 9.5px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      padding: 7px 8px;
      border: 1px solid #0f172a;
    }
    .records-table td {
      border: 1px solid #e2e8f0;
    }
    .footer-signatures {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .sig-box {
      width: 200px;
      border-top: 1px solid #94a3b8;
      padding-top: 4px;
      text-align: center;
      font-size: 10px;
      font-weight: 600;
      color: #475569;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <table class="header-table">
    <tr>
      <td style="vertical-align: top;">
        <h1 style="font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin-bottom: 2px;">
          ${instituteName}
        </h1>
        <p style="font-size: 10px; color: #64748b;">
          ${instituteAddress} • Phone: ${institutePhone}
        </p>
      </td>
      <td style="vertical-align: top; text-align: right;">
        <div style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 800; font-size: 11px; padding: 3px 10px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
          OFFICIAL FEE LEDGER STATEMENT
        </div>
        <div style="font-size: 10px; color: #475569; font-weight: 600;">Date of Issue: ${formatDate(new Date())}</div>
        <div style="font-size: 9px; color: #94a3b8; font-family: monospace;">Generated: ${formatDateTime(new Date())}</div>
      </td>
    </tr>
  </table>

  <!-- Scope & Criteria Meta Bar -->
  <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; margin-bottom: 12px; font-size: 10.5px; color: #334155; display: flex; justify-content: space-between;">
    <div><strong>Target Scope:</strong> ${scopeText}</div>
    <div><strong>Fee Component:</strong> ${feeTypeText}</div>
    <div><strong>Payment Status:</strong> ${statusFilterText}</div>
    <div><strong>Total Students:</strong> ${students.length} Learners</div>
  </div>

  <!-- KPI Summary Cards -->
  <div class="kpi-container">
    <div class="kpi-box">
      <div class="kpi-label">Total Agreed Billed</div>
      <div class="kpi-val" style="color: #0f172a;">${currencySymbol} ${totalBilled.toLocaleString('en-IN')}</div>
    </div>
    <div class="kpi-box" style="background: #f0fdf4; border-color: #bbf7d0;">
      <div class="kpi-label" style="color: #166534;">Total Amount Collected</div>
      <div class="kpi-val" style="color: #15803d;">${currencySymbol} ${totalCollected.toLocaleString('en-IN')}</div>
    </div>
    <div class="kpi-box" style="background: #fef2f2; border-color: #fecaca;">
      <div class="kpi-label" style="color: #991b1b;">Pending Balance Dues</div>
      <div class="kpi-val" style="color: #b91c1c;">${currencySymbol} ${totalPending.toLocaleString('en-IN')}</div>
    </div>
    <div class="kpi-box" style="background: #eff6ff; border-color: #bfdbfe;">
      <div class="kpi-label" style="color: #1e40af;">Realization Rate</div>
      <div class="kpi-val" style="color: #2563eb;">${recoveryPct}%</div>
    </div>
  </div>

  <!-- Main Fee Records Table -->
  <table class="records-table">
    <thead>
      <tr>
        <th style="width: 32px; text-align: center;">#</th>
        <th style="width: 85px; text-align: left;">Student ID</th>
        <th style="text-align: left;">Student Name</th>
        <th style="text-align: left;">Batch & Course</th>
        <th style="text-align: left;">Fee Item / Reason</th>
        <th style="width: 85px; text-align: right;">Total Fee</th>
        <th style="width: 85px; text-align: right;">Paid</th>
        <th style="width: 90px; text-align: right;">Pending Due</th>
        <th style="width: 80px; text-align: center;">Due Date</th>
        <th style="width: 65px; text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${
        students.length > 0
          ? rowsHtml
          : `<tr><td colspan="10" style="padding: 24px; text-align: center; color: #94a3b8;">No student fee records found matching the specified criteria.</td></tr>`
      }
    </tbody>
    <tfoot>
      <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #0f172a;">
        <td colspan="5" style="padding: 8px 10px; text-align: right; text-transform: uppercase; font-size: 10px; color: #334155;">
          Grand Total (${students.length} Students):
        </td>
        <td style="padding: 8px 10px; text-align: right; color: #0f172a; font-size: 11px;">
          ${currencySymbol} ${totalBilled.toLocaleString('en-IN')}
        </td>
        <td style="padding: 8px 10px; text-align: right; color: #15803d; font-size: 11px;">
          ${currencySymbol} ${totalCollected.toLocaleString('en-IN')}
        </td>
        <td style="padding: 8px 10px; text-align: right; color: #b91c1c; font-size: 11px;">
          ${currencySymbol} ${totalPending.toLocaleString('en-IN')}
        </td>
        <td colspan="2" style="padding: 8px 10px; text-align: center; color: #64748b; font-size: 10px;">
          ${recoveryPct}% Realized
        </td>
      </tr>
    </tfoot>
  </table>

  <!-- Signatures -->
  <div class="footer-signatures">
    <div class="sig-box">
      Prepared by Accountant
    </div>
    <div class="sig-box">
      Principal / Authorized Signatory
    </div>
  </div>

</body>
</html>
  `;
}

export function printFeeReport(options: FeeReportOptions): void {
  const htmlContent = generateFeeReportHtml(options);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.title = 'Fee Record Print Frame';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    console.error('Could not access iframe document for printing fee report');
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Fee print execution failed:', err);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 400);
  };
}
