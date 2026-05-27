import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { downloadBugTemplate, importBugsFromExcel } from '../api';
import toast from 'react-hot-toast';

export default function ImportBugsModal({ open, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { imported, failed, results, errors }
  const [downloading, setDownloading] = useState(false);
  const inputRef = useRef(null);

  if (!open) return null;

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    try {
      const res = await downloadBugTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bug-import-template.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Template downloaded!');
    } catch {
      toast.error('Failed to download template');
    }
    setDownloading(false);
  };

  const handleFileChange = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFileChange(f);
  };

  const handleImport = async () => {
    if (!file) return toast.error('Please select a file first');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await importBugsFromExcel(fd);
      setResult(res.data);
      if (res.data.imported > 0) {
        toast.success(`${res.data.imported} bug${res.data.imported !== 1 ? 's' : ''} imported!`);
        onImported?.();
      }
      if (res.data.failed > 0) {
        toast.error(`${res.data.failed} row${res.data.failed !== 1 ? 's' : ''} failed`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          className="modal-box max-w-lg"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-notion-border">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-notion-text">Import Bugs from Excel</h3>
                <p className="text-xs text-notion-muted">Upload a .xlsx file to bulk-create bugs</p>
              </div>
            </div>
            <button onClick={handleClose} className="btn-ghost p-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Download template */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-notion-border bg-notion-hover/50">
              <div>
                <p className="text-xs font-medium text-notion-text">Step 1 — Download Template</p>
                <p className="text-[11px] text-notion-muted mt-0.5">Get the correct column headers & an example row</p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                disabled={downloading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-medium transition-all border border-emerald-500/30"
              >
                {downloading ? (
                  <span className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                )}
                Download Template
              </button>
            </div>

            {/* Template columns info */}
            <div className="text-[11px] text-notion-muted leading-relaxed bg-notion-bg/60 rounded-lg p-3 border border-notion-border">
              <p className="font-medium text-notion-text mb-1.5">📋 Template Columns:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                {['Title *', 'Description', 'Steps To Reproduce', 'Expected Result', 'Actual Result',
                  'Priority', 'Type', 'Status', 'Project Name *', 'Module Name', 'Feature Name', 'Tags', 'Date Created'].map(col => (
                  <span key={col} className={col.includes('*') ? 'text-notion-accent font-medium' : ''}>{col}</span>
                ))}
              </div>
              <p className="mt-2 text-[10px]">* Required &nbsp;|&nbsp; Priority: Blocker/High/Medium/Low &nbsp;|&nbsp; Date format: YYYY-MM-DD</p>
            </div>

            {/* File drop zone */}
            <div>
              <p className="text-xs font-medium text-notion-text mb-2">Step 2 — Upload your filled Excel file</p>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${
                  dragging
                    ? 'border-emerald-400 bg-emerald-400/8'
                    : file
                    ? 'border-emerald-400/50 bg-emerald-400/5'
                    : 'border-notion-border hover:border-notion-accent/40'
                }`}
              >
                <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleFileChange(e.target.files[0])} />
                {file ? (
                  <>
                    <svg className="w-8 h-8 text-emerald-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-sm font-medium text-emerald-400">{file.name}</p>
                    <p className="text-[11px] text-notion-muted mt-1">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-notion-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p className="text-xs text-notion-muted">Drag & drop or click to select</p>
                    <p className="text-[11px] text-notion-muted/60 mt-1">.xlsx or .xls — max 10MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Import result */}
            <AnimatePresence>
              {result && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="rounded-xl border border-notion-border overflow-hidden">
                    <div className="flex items-center gap-4 px-4 py-3 bg-notion-hover/50 border-b border-notion-border">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="text-xs font-medium text-emerald-400">{result.imported} imported</span>
                      </div>
                      {result.failed > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-400" />
                          <span className="text-xs font-medium text-red-400">{result.failed} failed</span>
                        </div>
                      )}
                    </div>
                    {result.errors?.length > 0 && (
                      <div className="max-h-36 overflow-y-auto divide-y divide-notion-border">
                        {result.errors.map((e, i) => (
                          <div key={i} className="flex items-start gap-2 px-4 py-2">
                            <span className="text-[10px] text-notion-muted whitespace-nowrap">Row {e.row}</span>
                            <span className="text-[10px] text-red-400">{e.error}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 justify-end px-5 pb-5">
            <button onClick={handleClose} className="btn-secondary btn-sm">
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button
                onClick={handleImport}
                disabled={!file || loading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-all"
              >
                {loading ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Importing...</>
                ) : (
                  <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>Import Bugs</>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
