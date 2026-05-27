import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFilters } from '../context/FilterContext';

const PRIORITIES = ['Blocker', 'High', 'Medium', 'Low'];
const STATUSES = ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Reopened'];
const TYPES = ['Bug', 'Suggestion', 'Improvement'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'title', label: 'Title' },
];
const PRIORITY_COLORS = { Blocker: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#22c55e' };
const STATUS_COLORS = { Open: '#3b82f6', Assigned: '#8b5cf6', 'In Progress': '#f59e0b', Resolved: '#10b981', Closed: '#6b7280', Reopened: '#ef4444' };

function useClickOutside(ref, handler) {
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) handler(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, handler]);
}

function MultiSelect({ label, options, selected, onChange, colorMap }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  const toggle = (val) =>
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all ${selected.length > 0
          ? 'border-notion-accent bg-notion-accent/10 text-notion-accent'
          : 'border-notion-border bg-notion-surface text-notion-muted hover:border-notion-accent/50'}`}>
        {label}
        {selected.length > 0 && <span className="bg-notion-accent text-white rounded-full px-1.5 text-[10px] font-bold">{selected.length}</span>}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
            className="absolute top-full mt-1.5 left-0 z-50 bg-notion-surface border border-notion-border rounded-xl shadow-2xl min-w-[160px] py-1.5">
            {options.map(opt => (
              <button key={opt} type="button" onClick={() => toggle(opt)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-notion-hover transition-colors ${selected.includes(opt) ? 'text-notion-text' : 'text-notion-muted'}`}>
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${selected.includes(opt) ? 'bg-notion-accent border-notion-accent' : 'border-notion-border'}`}>
                  {selected.includes(opt) && <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 12 12"><path d="M1 6l3.5 3.5L11 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                {colorMap?.[opt] && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: colorMap[opt] }} />}
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SortSelect({ sortBy, sortDir, onSortBy, onSortDir }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));
  const label = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort';

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-notion-border bg-notion-surface text-notion-muted text-xs hover:border-notion-accent/50 transition-all">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
        {label}
        <button type="button" onClick={(e) => { e.stopPropagation(); onSortDir(sortDir === 'asc' ? 'desc' : 'asc'); }} className="hover:text-notion-accent transition-colors font-bold">
          {sortDir === 'asc' ? '↑' : '↓'}
        </button>
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
            className="absolute top-full mt-1.5 right-0 z-50 bg-notion-surface border border-notion-border rounded-xl shadow-2xl min-w-[160px] py-1.5">
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} type="button" onClick={() => { onSortBy(opt.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-notion-hover transition-colors ${sortBy === opt.value ? 'text-notion-accent font-medium' : 'text-notion-muted'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sortBy === opt.value ? 'bg-notion-accent' : ''}`} />
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FilterBar({ hideModule, hideFeature, bugCount, modules = [], features = [] }) {
  const { filters, setFilter, resetFilters, hasActiveFilters } = useFilters();

  const chips = [
    ...filters.priority.map(v => ({ key: 'priority', val: v, label: v, color: PRIORITY_COLORS[v] })),
    ...filters.status.map(v => ({ key: 'status', val: v, label: v, color: STATUS_COLORS[v] })),
    ...filters.type.map(v => ({ key: 'type', val: v, label: v })),
    ...filters.tags.map(v => ({ key: 'tags', val: v, label: `#${v}` })),
  ];
  const removeChip = (key, val) => setFilter(key, filters[key].filter(v => v !== val));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-notion-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" /></svg>
          <input className="input input-sm pl-8 w-52" placeholder="Search bugs..." value={filters.search} onChange={e => setFilter('search', e.target.value)} />
        </div>

        <MultiSelect label="Priority" options={PRIORITIES} selected={filters.priority} onChange={v => setFilter('priority', v)} colorMap={PRIORITY_COLORS} />
        <MultiSelect label="Status" options={STATUSES} selected={filters.status} onChange={v => setFilter('status', v)} colorMap={STATUS_COLORS} />
        <MultiSelect label="Type" options={TYPES} selected={filters.type} onChange={v => setFilter('type', v)} />

        {!hideModule && modules.length > 0 && (
          <select className="input input-sm w-36" value={filters.module} onChange={e => { setFilter('module', e.target.value); setFilter('feature', ''); }}>
            <option value="">All Modules</option>
            {modules.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        )}

        {!hideFeature && features.length > 0 && (
          <select className="input input-sm w-36" value={filters.feature} onChange={e => setFilter('feature', e.target.value)}>
            <option value="">All Features</option>
            {features.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
          </select>
        )}

        <div className="ml-auto flex items-center gap-2">
          <SortSelect sortBy={filters.sortBy} sortDir={filters.sortDir} onSortBy={v => setFilter('sortBy', v)} onSortDir={v => setFilter('sortDir', v)} />
          {bugCount !== undefined && <span className="text-xs text-notion-muted whitespace-nowrap">{bugCount} bug{bugCount !== 1 ? 's' : ''}</span>}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }}
                type="button" onClick={resetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-all">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Reset Filters
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {chips.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-1.5 overflow-hidden">
            {chips.map(chip => (
              <motion.span key={`${chip.key}-${chip.val}`} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                style={{ borderColor: chip.color ? `${chip.color}50` : undefined, background: chip.color ? `${chip.color}15` : 'var(--notion-hover)', color: chip.color || 'inherit' }}>
                {chip.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: chip.color }} />}
                {chip.label}
                <button type="button" onClick={() => removeChip(chip.key, chip.val)} className="ml-0.5 hover:opacity-60">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
