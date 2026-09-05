import { formatDate, formatDateTime } from './date';

export interface StudentAttendanceSummary {
  studentId: string;
  studentCustomId: string;
  rollNumber?: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  totalLecturesConducted: number;
  totalAttended: number;
  totalPresent: number;
  totalAbsent: number;
  overallPercentage: number;
  subjects: Record<
    string,
    {
      totalLectures: number;
      attended: number;
      present: number;
      absent: number;
      percentage: number;
    }
  >;
}


export interface AttendanceReportOptions {
  batch: {
    id: string;
    batchId: string;
    name: string;
    courseName: string;
  };
  startDate: string;
  endDate: string;
  totalLecturesConducted: number;
  allSubjects: string[];
  subjectLecturesMap: Record<string, number>;
  students: StudentAttendanceSummary[];
  settings?: any;
}

export function generateAttendanceReportHtml({
  batch,
  startDate,
  endDate,
  totalLecturesConducted,
  allSubjects,
  subjectLecturesMap,
  students,
  settings,
}: AttendanceReportOptions): string {
  const instituteName = settings?.instituteName || 'Apex Career Institute';
  const instituteAddress = settings?.address || settings?.instituteAddress || 'Knowledge Park Campus';
  const institutePhone = settings?.contactPhone || settings?.institutePhone || '+91 9820000001';

  const rowsHtml = students
    .map((s, idx) => {
      const isGood = s.overallPercentage >= 75;
      const pctColor = isGood ? '#15803d' : '#b91c1c';
      const pctBg = isGood ? '#dcfce7' : '#fee2e2';

      const subjectCells = allSubjects
        .map((subj) => {
          const subData = s.subjects[subj];
          const totalSub = subData?.totalLectures || 0;
          const attendedSub = subData?.attended || 0;
          const pct = subData?.percentage || 0;

          if (totalSub === 0) {
            return `<td style="text-align: center; color: #94a3b8;">-</td>`;
          }

          const subjPctColor = pct >= 75 ? '#15803d' : '#d97706';

          return `
            <td style="text-align: center; padding: 6px 8px;">
              <div style="font-weight: 700; color: #1e293b;">${attendedSub} / ${totalSub}</div>
              <div style="font-size: 9px; font-weight: 700; color: ${subjPctColor};">${pct}%</div>
            </td>
          `;
        })
        .join('');

      const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';

      return `
        <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 10px; font-family: monospace; color: #64748b; font-size: 10px;">${idx + 1}</td>
          <td style="padding: 8px 10px;">
            <div style="font-weight: 700; color: #0f172a; font-size: 11px;">${s.firstName} ${s.lastName}</div>
            <div style="font-size: 9px; color: #64748b; font-family: monospace;">
              ${s.studentCustomId} ${s.rollNumber ? `&bull; Roll: ${s.rollNumber}` : ''}
            </div>
          </td>
          ${subjectCells}
          <td style="padding: 8px 10px; text-align: center; font-weight: 700; color: #0f172a;">
            ${s.totalAttended} / ${s.totalLecturesConducted}
          </td>
          <td style="padding: 8px 10px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 6px; font-weight: 800; font-size: 11px; background-color: ${pctBg}; color: ${pctColor};">
              ${s.overallPercentage}%
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  const subjectHeaderCols = allSubjects
    .map(
      (subj) => `
      <th style="padding: 8px 6px; text-align: center; border-bottom: 2px solid #cbd5e1; font-weight: 700; color: #334155;">
        ${subj}
        <div style="font-size: 8px; font-weight: 400; color: #64748b;">(${subjectLecturesMap[subj] || 0} Lectures)</div>
      </th>
    `
    )
    .join('');

  const subjectBadges = allSubjects
    .map(
      (subj) => `
      <span style="display: inline-block; margin-right: 8px; margin-bottom: 4px; padding: 3px 8px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 10px; font-weight: 600; color: #334155;">
        <strong>${subj}:</strong> ${subjectLecturesMap[subj] || 0} Lectures
      </span>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Attendance Report - ${batch.name}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 12mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
    }
    body {
      background: #ffffff !important;
      color: #0f172a !important;
      padding: 10px;
      font-size: 10px;
      line-height: 1.3;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .header-box {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 10px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .institute-title {
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
    }
    .report-subtitle {
      font-size: 11px;
      font-weight: 600;
      color: #475569;
      margin-top: 2px;
    }
    .meta-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .meta-item {
      font-size: 10px;
    }
    .meta-item strong {
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 10px;
    }
    th {
      background-color: #f1f5f9;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.5px;
    }
    .footer-box {
      margin-top: 28px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 12px;
      page-break-inside: avoid;
    }
    .sig-line {
      border-top: 1px solid #475569;
      padding-top: 4px;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
      text-align: center;
      min-width: 180px;
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header-box">
    <div>
      <div class="institute-title">${instituteName}</div>
      <div class="report-subtitle">Official Student Attendance Register & Subject Lecture Summary</div>
      <div style="font-size: 9px; color: #64748b; margin-top: 2px;">${instituteAddress} &bull; Tel: ${institutePhone}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 12px; font-weight: 800; color: #0f172a;">BATCH: ${batch.name}</div>
      <div style="font-size: 10px; color: #475569;">Course: ${batch.courseName} (${batch.batchId})</div>
      <div style="font-size: 9px; color: #64748b; font-family: monospace; margin-top: 2px;">Generated on: ${formatDateTime(new Date())}</div>
    </div>
  </div>

  <!-- Meta Summary -->
  <div class="meta-box">
    <div class="meta-item">
      <strong>Date Range:</strong> ${formatDate(startDate)} to ${formatDate(endDate)}
    </div>
    <div class="meta-item">
      <strong>Total Sessions Conducted:</strong> ${totalLecturesConducted} Lectures
    </div>
    <div class="meta-item">
      <strong>Total Enrolled Students:</strong> ${students.length}
    </div>
  </div>

  <!-- Subject Lectures Breakdown -->
  <div style="margin-bottom: 10px;">
    ${subjectBadges}
  </div>

  <!-- Table -->
  <table>
    <thead>
      <tr>
        <th style="padding: 8px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; width: 30px;">#</th>
        <th style="padding: 8px 10px; text-align: left; border-bottom: 2px solid #cbd5e1; min-width: 140px;">Student Name & ID</th>
        ${subjectHeaderCols}
        <th style="padding: 8px 10px; text-align: center; border-bottom: 2px solid #cbd5e1;">Total Attended</th>
        <th style="padding: 8px 10px; text-align: center; border-bottom: 2px solid #cbd5e1;">Attendance %</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="${allSubjects.length + 4}" style="padding: 20px; text-align: center; color: #94a3b8;">No attendance records found for this period.</td></tr>`}
    </tbody>
  </table>

  <!-- Signatures Footer -->
  <div class="footer-box">
    <div>
      <div class="sig-line">Class Teacher / Batch Mentor</div>
    </div>
    <div>
      <div class="sig-line">Attendance In-Charge</div>
    </div>
    <div>
      <div class="sig-line">Principal / Academic Director</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>
  `.trim();
}

export function printAttendanceReport(options: AttendanceReportOptions) {
  const html = generateAttendanceReportHtml(options);

  // Remove existing print iframe if any
  const existingFrame = document.getElementById('attendance-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  // Create clean isolated iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'attendance-print-frame';
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
    doc.write(html);
    doc.close();
  }
}
