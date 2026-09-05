import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Printer,
  Search,
  Filter,
  Users,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Receipt,
  CreditCard,
  BookOpen,
} from 'lucide-react';
import { Student, Batch, FeeInstallment } from '../../types';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useSettings } from '../../context/SettingsContext';
import { printFeeReport, FeeReportStudentRow } from '../../utils/printFeeReport';

interface FeeRecordsSectionProps {
  students: Student[];
  batches: Batch[];
  loading: boolean;
  onOpenCollect: (student: Student) => void;
}

export const FeeRecordsSection: React.FC<FeeRecordsSectionProps> = ({
  students,
  batches,
  loading,
  onOpenCollect,
}) => {
  const { formatCurrency, formatDate, settings } = useSettings();
  const navigate = useNavigate();

  // 1. Target Scope Filter ('ALL' or specific batchId)
  const [selectedScope, setSelectedScope] = useState<string>('ALL');

  // 2. Fee Component Filter ('ALL' | 'REGULAR_TUITION' | 'ADMIN_FINES' | specific title)
  const [selectedFeeType, setSelectedFeeType] = useState<string>('ALL');

  // 3. Payment Status Filter ('ALL' | 'PENDING' | 'PAID' | 'PARTIAL')
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // 4. Live Search Filter
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract all unique fine / admin-created fee titles from students' installments
  const customFeeTitles = useMemo(() => {
    const titlesSet = new Set<string>();
    students.forEach((s) => {
      (s.installments || []).forEach((inst) => {
        const title = inst.title?.trim();
        if (
          title &&
          !title.toLowerCase().includes('tuition') &&
          !title.toLowerCase().includes('term admission') &&
          !title.toLowerCase().includes('base course')
        ) {
          titlesSet.add(title);
        }
      });
    });
    return Array.from(titlesSet);
  }, [students]);

  // Compute records based on filters
  const recordsData = useMemo(() => {
    const result: FeeReportStudentRow[] = [];

    students.forEach((s) => {
      // 1. Scope filter (All vs Specific Batch)
      if (selectedScope !== 'ALL' && s.batchId !== selectedScope && s.batch?.id !== selectedScope) {
        return;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
        const studentId = (s.studentId || '').toLowerCase();
        const rollNumber = (s.rollNumber || '').toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        const batchName = (s.batch?.name || '').toLowerCase();
        const courseName = (s.course?.name || '').toLowerCase();

        const matches =
          fullName.includes(query) ||
          studentId.includes(query) ||
          rollNumber.includes(query) ||
          phone.includes(query) ||
          batchName.includes(query) ||
          courseName.includes(query);

        if (!matches) return;
      }

      // 3. Fee Type handling
      if (selectedFeeType === 'ALL') {
        // Full overall student fee balance
        const isPaid = s.pendingFee <= 0 && s.paidFee > 0;
        const isPartial = s.paidFee > 0 && s.pendingFee > 0;
        const status: 'PAID' | 'PARTIAL' | 'PENDING' = isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING';

        // Apply Payment Status Filter
        if (selectedStatus === 'PENDING' && s.pendingFee <= 0) return;
        if (selectedStatus === 'PAID' && s.pendingFee > 0) return;
        if (selectedStatus === 'PARTIAL' && !isPartial) return;

        result.push({
          studentId: s.studentId,
          rollNumber: s.rollNumber,
          name: `${s.firstName} ${s.lastName}`,
          batchName: s.batch?.name || 'Unassigned Batch',
          courseName: s.course?.name || 'Course Program',
          phone: s.phone,
          feeTitle: s.installments && s.installments.length > 0
            ? s.installments.map((i) => i.title).join(', ')
            : 'Tuition Program Fee',
          totalFee: s.totalFee,
          paidFee: s.paidFee,
          pendingFee: s.pendingFee,
          dueDate: s.installments?.[0]?.dueDate || 'End of Term',
          status,
        });
      } else if (selectedFeeType === 'REGULAR_TUITION') {
        // Filter base tuition installments
        const tuitionInst = (s.installments || []).filter((inst) => {
          const t = inst.title.toLowerCase();
          return (
            t.includes('tuition') ||
            t.includes('term admission') ||
            t.includes('base course') ||
            !customFeeTitles.includes(inst.title)
          );
        });

        const totalTuition = tuitionInst.reduce((sum, i) => sum + i.amount, 0) || s.totalFee;
        const paidTuition = tuitionInst.reduce((sum, i) => sum + i.paidAmount, 0) || s.paidFee;
        const pendingTuition = Math.max(0, totalTuition - paidTuition);
        const isPaid = pendingTuition <= 0 && paidTuition > 0;
        const isPartial = paidTuition > 0 && pendingTuition > 0;
        const status: 'PAID' | 'PARTIAL' | 'PENDING' = isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING';

        // Apply Payment Status Filter
        if (selectedStatus === 'PENDING' && pendingTuition <= 0) return;
        if (selectedStatus === 'PAID' && pendingTuition > 0) return;
        if (selectedStatus === 'PARTIAL' && !isPartial) return;

        result.push({
          studentId: s.studentId,
          rollNumber: s.rollNumber,
          name: `${s.firstName} ${s.lastName}`,
          batchName: s.batch?.name || 'Unassigned Batch',
          courseName: s.course?.name || 'Course Program',
          phone: s.phone,
          feeTitle: 'Batch Regular Tuition Fee',
          totalFee: totalTuition,
          paidFee: paidTuition,
          pendingFee: pendingTuition,
          dueDate: tuitionInst[0]?.dueDate || 'End of Term',
          status,
        });
      } else if (selectedFeeType === 'ADMIN_FINES') {
        // Filter all admin-assigned custom fees & fines
        const fineInst = (s.installments || []).filter((inst) => customFeeTitles.includes(inst.title));

        if (fineInst.length === 0) return; // Student has no admin fines

        const totalFines = fineInst.reduce((sum, i) => sum + i.amount, 0);
        const paidFines = fineInst.reduce((sum, i) => sum + i.paidAmount, 0);
        const pendingFines = Math.max(0, totalFines - paidFines);
        const isPaid = pendingFines <= 0 && paidFines > 0;
        const isPartial = paidFines > 0 && pendingFines > 0;
        const status: 'PAID' | 'PARTIAL' | 'PENDING' = isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING';

        // Apply Payment Status Filter
        if (selectedStatus === 'PENDING' && pendingFines <= 0) return;
        if (selectedStatus === 'PAID' && pendingFines > 0) return;
        if (selectedStatus === 'PARTIAL' && !isPartial) return;

        result.push({
          studentId: s.studentId,
          rollNumber: s.rollNumber,
          name: `${s.firstName} ${s.lastName}`,
          batchName: s.batch?.name || 'Unassigned Batch',
          courseName: s.course?.name || 'Course Program',
          phone: s.phone,
          feeTitle: fineInst.map((i) => i.title).join(' • '),
          totalFee: totalFines,
          paidFee: paidFines,
          pendingFee: pendingFines,
          dueDate: fineInst[0]?.dueDate || 'Due on Demand',
          status,
        });
      } else {
        // Specific custom fee title chosen
        const matchingInst = (s.installments || []).filter((inst) => inst.title === selectedFeeType);

        if (matchingInst.length === 0) return;

        const totalSpec = matchingInst.reduce((sum, i) => sum + i.amount, 0);
        const paidSpec = matchingInst.reduce((sum, i) => sum + i.paidAmount, 0);
        const pendingSpec = Math.max(0, totalSpec - paidSpec);
        const isPaid = pendingSpec <= 0 && paidSpec > 0;
        const isPartial = paidSpec > 0 && pendingSpec > 0;
        const status: 'PAID' | 'PARTIAL' | 'PENDING' = isPaid ? 'PAID' : isPartial ? 'PARTIAL' : 'PENDING';

        // Apply Payment Status Filter
        if (selectedStatus === 'PENDING' && pendingSpec <= 0) return;
        if (selectedStatus === 'PAID' && pendingSpec > 0) return;
        if (selectedStatus === 'PARTIAL' && !isPartial) return;

        result.push({
          studentId: s.studentId,
          rollNumber: s.rollNumber,
          name: `${s.firstName} ${s.lastName}`,
          batchName: s.batch?.name || 'Unassigned Batch',
          courseName: s.course?.name || 'Course Program',
          phone: s.phone,
          feeTitle: selectedFeeType,
          totalFee: totalSpec,
          paidFee: paidSpec,
          pendingFee: pendingSpec,
          dueDate: matchingInst[0]?.dueDate || 'Due on Demand',
          status,
        });
      }
    });

    return result;
  }, [students, selectedScope, selectedFeeType, selectedStatus, searchQuery, customFeeTitles]);

  // Aggregate Totals
  const totalBilled = recordsData.reduce((sum, r) => sum + r.totalFee, 0);
  const totalCollected = recordsData.reduce((sum, r) => sum + r.paidFee, 0);
  const totalPending = recordsData.reduce((sum, r) => sum + r.pendingFee, 0);
  const realizationPct = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  // Selected Scope text label
  const scopeLabel =
    selectedScope === 'ALL'
      ? 'All Students (Institute Wide)'
      : batches.find((b) => b.id === selectedScope)?.name || 'Selected Batch';

  // Selected Fee Type text label
  const feeTypeLabel =
    selectedFeeType === 'ALL'
      ? 'All Fee Components (Tuition + Charges)'
      : selectedFeeType === 'REGULAR_TUITION'
      ? 'Batch Regular Tuition Fee'
      : selectedFeeType === 'ADMIN_FINES'
      ? 'Admin Assigned Fees & Fines'
      : selectedFeeType;

  // Selected Status text label
  const statusLabel =
    selectedStatus === 'ALL'
      ? 'All Statuses (Pending & Paid)'
      : selectedStatus === 'PENDING'
      ? 'Pending / Unpaid Fees'
      : selectedStatus === 'PAID'
      ? 'Fully Paid / Cleared'
      : 'Partial Dues';

  const handlePrint = () => {
    printFeeReport({
      title: 'Official Student Fee Record & Recovery Register',
      scopeText: scopeLabel,
      feeTypeText: feeTypeLabel,
      statusFilterText: statusLabel,
      students: recordsData,
      totalBilled,
      totalCollected,
      totalPending,
      settings,
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Filter & Action Bar */}
      <div className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              Fee Records & Recovery Register
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={Printer}
            onClick={handlePrint}
            disabled={recordsData.length === 0}
          >
            Print Fee Statement ({recordsData.length})
          </Button>
        </div>

        {/* 3-Way Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* 1. Target Scope (All Students vs Specific Batch) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              1. Choose Audience / Batch
            </label>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Enrolled Students ({students.length})</option>
              {batches.map((b) => {
                const count = students.filter((s) => s.batchId === b.id || s.batch?.id === b.id).length;
                return (
                  <option key={b.id} value={b.id}>
                    Batch: {b.name} ({count} learners)
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Fee Component / Admin Fine Category */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              2. Fee Type / Fine Category
            </label>
            <select
              value={selectedFeeType}
              onChange={(e) => setSelectedFeeType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Fee Charges (Tuition + Admin)</option>
              <option value="REGULAR_TUITION">Regular Batch Tuition Fee</option>
              <option value="ADMIN_FINES">All Admin Created Fines & Charges</option>
              {customFeeTitles.map((title) => (
                <option key={title} value={title}>
                  Fine: {title}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Payment Clearance Status */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              3. Payment / Dues Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Fee Statuses</option>
              <option value="PENDING">Pending Dues Only</option>
              <option value="PAID">Fully Paid / Cleared</option>
              <option value="PARTIAL">Partial Dues</option>
            </select>
          </div>

          {/* 4. Student Search */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Search Student
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, ID, roll..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Students in Record
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5">
            {recordsData.length}
          </p>
          <span className="text-[10px] text-slate-500">{scopeLabel}</span>
        </div>

        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Agreed Billed
          </span>
          <p className="text-xl font-black text-slate-900 mt-0.5 tabular-nums">
            {formatCurrency(totalBilled)}
          </p>
          <span className="text-[10px] text-slate-500">{feeTypeLabel}</span>
        </div>

        <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Total Collected
          </span>
          <p className="text-xl font-black text-emerald-700 mt-0.5 tabular-nums">
            {formatCurrency(totalCollected)}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">{realizationPct}% Realized</span>
        </div>

        <div className="p-4 bg-rose-50/50 border border-rose-200/60 rounded-2xl shadow-xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            Pending Balance
          </span>
          <p className="text-xl font-black text-rose-700 mt-0.5 tabular-nums">
            {formatCurrency(totalPending)}
          </p>
          <span className="text-[10px] text-rose-600 font-semibold">Uncollected Dues</span>
        </div>
      </div>

      {/* Main Student Fee Records Register Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-900">
              Student Fee Ledger Records
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {recordsData.length} Records
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-mono">
            {feeTypeLabel} • {statusLabel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3 text-center w-10">#</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Batch & Course</th>
                <th className="px-4 py-3">Fee Item / Particulars</th>
                <th className="px-4 py-3 text-right">Total Fee</th>
                <th className="px-4 py-3 text-right">Paid</th>
                <th className="px-4 py-3 text-right">Pending Due</th>
                <th className="px-4 py-3 text-center">Due Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recordsData.length > 0 ? (
                recordsData.map((r, idx) => {
                  const studentObj = students.find((s) => s.studentId === r.studentId);

                  return (
                    <tr
                      key={`${r.studentId}-${idx}`}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          onClick={() => studentObj && navigate(`/students/${studentObj.id}`)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer block text-xs"
                        >
                          {r.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {r.studentId}
                          {r.rollNumber ? ` • Roll: ${r.rollNumber}` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] border border-purple-200/60 block w-fit">
                          {r.batchName}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{r.courseName}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs text-slate-700 text-[11px]">
                        {r.feeTitle}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                        {formatCurrency(r.totalFee)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600 tabular-nums">
                        {formatCurrency(r.paidFee)}
                      </td>
                      <td className="px-4 py-3 text-right font-black tabular-nums">
                        <span className={r.pendingFee > 0 ? 'text-rose-600' : 'text-slate-400'}>
                          {formatCurrency(r.pendingFee)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-500">
                        {formatDate(r.dueDate)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={r.status === 'PAID' ? 'success' : r.status === 'PARTIAL' ? 'warning' : 'danger'}
                          size="xs"
                          dot
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.pendingFee > 0 && studentObj && (
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => onOpenCollect(studentObj)}
                            >
                              Collect
                            </Button>
                          )}
                          {studentObj && (
                            <Button
                              variant="outline"
                              size="xs"
                              onClick={() => navigate(`/students/${studentObj.id}`)}
                            >
                              Ledger
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-xs">No fee records found matching active filter criteria.</p>
                    <p className="text-[11px] mt-0.5">Try selecting "All Students" or "All Fee Charges".</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
