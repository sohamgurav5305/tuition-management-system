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
  Eye,
} from 'lucide-react';
import { materialApi, batchApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StudyMaterial, Batch } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { MaterialUploadModal } from './MaterialUploadModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { getMediaUrl, downloadMediaFile } from '../../utils/media';

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

  const fetchMaterials = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await materialApi.getAll({
        materialType: typeFilter || undefined,
        batchId: batchFilter || undefined,
        search: search || undefined,
      });
      setMaterials(res.data.data);
    } catch (err) {
      console.error('Failed to load study materials', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (canUpload) {
      batchApi.getAll({ status: 'ACTIVE' }).then((r) => setBatches(r.data.data));
    }
  }, [canUpload]);

  useEffect(() => {
    fetchMaterials(true);
    const interval = setInterval(() => {
      fetchMaterials(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [typeFilter, batchFilter, search]);

  const handleDownloadFile = async (m: StudyMaterial, fileUrl?: string) => {
    try {
      await materialApi.trackDownload(m.id);
      success('Download Started', `Downloading: ${m.title}`);
      const targetUrl = fileUrl || (m.files && m.files[0]) || m.fileUrl;
      if (targetUrl) {
        const rawName = targetUrl.split('/').pop() || `${m.title}.pdf`;
        const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
        downloadMediaFile(targetUrl, cleanName);
      } else {
        const blob = new Blob(
          [
            `Apex Coaching Institute - Study Material: ${m.title}\nBatch: ${
              m.batch?.name || 'Assigned Batch'
            }\nSubject: ${m.subject}\nChapter: ${m.chapterName}\n\n[Official Assignment Content]`,
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
        title="Study Materials"
        actions={
          canUpload && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => setIsUploadOpen(true)}
            >
              Upload Study Materials
            </Button>
          )
        }
      />

      {/* Filter Bar */}
      <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
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
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider ml-2">Batch:</span>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none max-w-[200px]"
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
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by topic, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full">
            <LoadingSkeleton label="Loading batch study materials..." minHeight="min-h-[320px]" />
          </div>
        ) : materials.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isStudent ? 'No Study Materials for Your Batch' : 'No Study Materials Found'}
            </h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              {isStudent
                ? 'Your faculty mentors will publish DPPs and lecture notes for your batch here.'
                : 'No documents match the chosen category or batch filter.'}
            </p>
          </div>
        ) : (
          materials.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={getBadgeVariant(m.materialType)} size="xs">
                    {m.materialType.replace('_', ' ')}
                  </Badge>
                  {canUpload && (
                    <button
                      onClick={() => setDeletingId(m.id)}
                      title="Remove Document"
                      className="p-1 rounded text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                  {m.title}
                </h3>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{m.subject}</span>
                  {m.chapterName && <span>&bull; {m.chapterName}</span>}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                {m.files && m.files.length > 1 ? (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Documents ({m.files.length}):
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {m.files.map((fUrl, fIdx) => {
                        const rawName = fUrl.split('/').pop() || `Doc #${fIdx + 1}`;
                        const cleanName = rawName.match(/^[0-9a-fA-F-]{36,}-(.*)$/)?.[1] || rawName;
                        return (
                          <div
                            key={fIdx}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 rounded-xl text-xs"
                          >
                            <span className="truncate text-slate-700 dark:text-slate-300 font-medium max-w-[140px]" title={cleanName}>
                              {cleanName}
                            </span>
                            <div className="flex items-center gap-1">
                              <a
                                href={getMediaUrl(fUrl)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={() => materialApi.trackDownload(m.id)}
                                className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors flex items-center gap-1 text-[11px] font-bold"
                                title="View Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(m, fUrl)}
                                className="p-1 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                title="Download Document"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <a
                      href={m.files?.[0] || m.fileUrl ? getMediaUrl(m.files?.[0] || m.fileUrl) : '#'}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => materialApi.trackDownload(m.id)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800 rounded-xl text-xs font-bold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDownloadFile(m, m.files?.[0] || m.fileUrl || undefined)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                )}
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
