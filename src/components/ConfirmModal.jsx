import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true, loading = false }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="modal-box max-w-sm"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? 'bg-red-500/15' : 'bg-yellow-400/15'}`}>
                <svg className={`w-4.5 h-4.5 ${danger ? 'text-red-400' : 'text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.1rem', height: '1.1rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-notion-text mb-1">{title}</h3>
                <p className="text-xs text-notion-muted leading-relaxed">{message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`btn-sm px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${danger ? 'bg-red-500 hover:bg-red-600 text-white' : 'btn-primary'}`}
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </span>
                ) : confirmLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
