import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Download,
  PlusCircle,
  Filter,
  FileText,
  Trash2,
  CheckCircle2,
  Lock,
  Users,
  Search,
} from 'lucide-react';
import { materialApi, batchApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StudyMaterial, Batch } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { MaterialUploadModal } from './MaterialUploadModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

export const MaterialList: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [batchFilter, setBatchFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isStudent = user?.role === 'STUDENT';
  const canUpload = user?.role === 'ADMINISTRATOR' || user?.role === 'TEACHER';

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await materialApi.getAll({
        materialType: typeFilter || undefined,
        batchId: batchFilter || undefined,
        search: search || undefined,
      });
      setMaterials(res.data.data);
    } catch (err) {
      console.error('Failed to load study materials', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canUpload) {
      batchApi.getAll({ status: 'ACTIVE' }).then((r) => setBatches(r.data.data));
    }
  }, [canUpload]);

  useEffect(() => {
    fetchMaterials();
  }, [typeFilter, batchFilter, search]);

  const handleDownload = async (m: StudyMaterial) => {
    try {
      await materialApi.trackDownload(m.id);
      success('Download Started', `Downloading: ${m.title}`);
      if (m.fileUrl) {
        window.open(m.fileUrl, '_blank');
      } else {
        const blob = new Blob(
          [
            `Apex Coaching Institute - Study Material: ${m.title}\nBatch: ${
              m.batch?.name || 'Assigned Cohort'
            }\nSubject: ${m.subject}\nChapter: ${m.chapterName}\n\n[Official Coursework Content]`,
          ],
          { type: 'text/plain' }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${m.title.replace(/\s+/g, '_')}.txt`;
        a.click();
      }
      fetchMaterials();
    } catch (err: any) {
      error('Download Failed', err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await materialApi.delete(deletingId);
      success('Material Deleted', 'The document has been removed from repository');
      fetchMaterials();
      setDeletingId(null);
    } catch (err: any) {
      error('Delete Failed', err.response?.data?.message || err.message);
    }
  };

  const getBadgeVariant = (type: string): any => {
    switch (type) {
      case 'DPP': return 'primary';
      case 'CLASS_NOTES': return 'success';
      case 'FORMULA_SHEET': return 'warning';
      case 'QUESTION_BANK': return 'purple';
      case 'TEST_SOLUTION': return 'danger';
      default: return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <PageHeader
        title={isStudent ? 'My Batch DPPs & Notes' : 'Study Materials & DPP Repository'}
        subtitle={
          isStudent
            ? 'Daily Practice Problems (DPPs), lecture notes, formula mind maps, and solution keys.'
            : 'Digital library of practice problem sheets, lecture notes, formula mind maps, and mock test solutions.'
        }
        badge={`${materials.length} Documents`}
        actions={
          canUpload && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => setIsUploadOpen(true)}
            >
              Upload Material / DPP
            </Button>
          )
        }
      />

      {/* Filter Bar */}
      <div className="p-3.5 bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="DPP">Daily Practice Problems (DPP)</option>
            <option value="CLASS_NOTES">Class Notes</option>
            <option value="FORMULA_SHEET">Formula Sheets</option>
            <option value="QUESTION_BANK">Question Banks</option>
            <option value="TEST_SOLUTION">Test Solution Keys</option>
          </select>

          {canUpload && (
            <>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-2">Batch:</span>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none max-w-[200px]"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by topic, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs">
            Loading batch study materials...
          </div>
        ) : materials.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 rounded-2xl">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isStudent ? 'No Study Materials for Your Batch' : 'No Study Materials Found'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
              {isStudent
                ? 'Your faculty mentors will publish DPPs and lecture notes for your batch here.'
                : 'No documents match the chosen category or batch filter.'}
            </p>
          </div>
        ) : (
          materials.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-500/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={getBadgeVariant(m.materialType)} size="xs">
                    {m.materialType.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 font-bold">{m.materialId}</span>
                    {canUpload && (
                      <button
                        onClick={() => setDeletingId(m.id)}
                        title="Remove Document"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                  {m.title}
                </h3>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{m.subject}</span>
                  {m.chapterName && <span>&bull; {m.chapterName}</span>}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {(m as any).description || `Official study material and practice problem sheets for ${m.chapterName || m.subject}.`}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                <Button
                  variant="outline"
                  size="xs"
                  className="w-full justify-center"
                  leftIcon={Download}
                  onClick={() => handleDownload(m)}
                >
                  Download
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      <MaterialUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchMaterials}
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Study Document"
        message="Are you sure you want to remove this document? Students will no longer be able to download it."
      />
    </div>
  );
};
