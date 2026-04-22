import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DndContext, DragOverlay, closestCenter, useSensor, useSensors, PointerSensor
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getBugs, updateBug } from '../api';
import { priorityClass, statusClass, timeAgo } from '../utils/helpers';
import toast from 'react-hot-toast';

const COLUMNS = [
  { key: 'Blocker', label: 'Blocker', dot: '#ef4444' },
  { key: 'High',    label: 'High',    dot: '#f97316' },
  { key: 'Medium',  label: 'Medium',  dot: '#eab308' },
  { key: 'Low',     label: 'Low',     dot: '#22c55e' },
];

function BugCard({ bug, navigate, isDragging }) {
  return (
    <div
      onClick={() => !isDragging && navigate(`/bugs/${bug._id}`)}
      className={`card p-3 cursor-pointer space-y-2 transition-all duration-150 ${isDragging ? 'opacity-50 scale-95' : 'hover:border-notion-accent/40'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-mono text-notion-muted">{bug.bugId}</span>
        <span className={statusClass(bug.status)}>{bug.status}</span>
      </div>
      <p className="text-sm font-medium text-notion-text line-clamp-2 leading-snug">{bug.title}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {bug.assignedTo ? (
            <div className="w-5 h-5 rounded-full bg-notion-accent/30 flex items-center justify-center text-[9px] text-notion-accent font-bold">
              {bug.assignedTo.name?.[0]}
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-notion-border flex items-center justify-center">
              <svg className="w-3 h-3 text-notion-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
          )}
          <span className="text-[10px] text-notion-muted">{bug.assignedTo?.name || 'Unassigned'}</span>
        </div>
        <span className="text-[10px] text-notion-muted">{timeAgo(bug.createdAt)}</span>
      </div>
    </div>
  );
}

function SortableBugCard({ bug, navigate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bug._id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BugCard bug={bug} navigate={navigate} isDragging={isDragging} />
    </div>
  );
}

export default function KanbanBoard() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [bugsByPriority, setBugsByPriority] = useState({ Blocker: [], High: [], Medium: [], Low: [] });
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeBug, setActiveBug] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    getBugs({ project: projectId, limit: 200 }).then(r => {
      const grouped = { Blocker: [], High: [], Medium: [], Low: [] };
      r.data.bugs.forEach(bug => { if (grouped[bug.priority]) grouped[bug.priority].push(bug); });
      setBugsByPriority(grouped);
    }).catch(() => toast.error('Failed to load bugs')).finally(() => setLoading(false));
  }, [projectId]);

  const findBug = (id) => {
    for (const col of COLUMNS) {
      const bug = bugsByPriority[col.key].find(b => b._id === id);
      if (bug) return { bug, priority: col.key };
    }
    return null;
  };

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
    const found = findBug(active.id);
    if (found) setActiveBug(found.bug);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveId(null);
    setActiveBug(null);
    if (!over) return;

    const fromResult = findBug(active.id);
    if (!fromResult) return;

    // Check if dropped over a column header
    const targetPriority = COLUMNS.find(c => c.key === over.id)?.key
      || findBug(over.id)?.priority;

    if (!targetPriority || fromResult.priority === targetPriority) return;

    // Optimistically update
    setBugsByPriority(prev => {
      const from = prev[fromResult.priority].filter(b => b._id !== active.id);
      const to = [...prev[targetPriority], { ...fromResult.bug, priority: targetPriority }];
      return { ...prev, [fromResult.priority]: from, [targetPriority]: to };
    });

    try {
      await updateBug(active.id, { priority: targetPriority });
      toast.success(`Moved to ${targetPriority}`);
    } catch {
      toast.error('Failed to update priority');
      // revert
      setBugsByPriority(prev => {
        const to = prev[targetPriority].filter(b => b._id !== active.id);
        const from = [...prev[fromResult.priority], fromResult.bug];
        return { ...prev, [fromResult.priority]: from, [targetPriority]: to };
      });
    }
  };

  if (loading) return (
    <div className="grid grid-cols-4 gap-4">
      {COLUMNS.map(c => <div key={c.key} className="kanban-col h-64 animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-notion-text">Kanban Board</h1>
        <button onClick={() => navigate(`/bugs/new?project=${projectId}`)} className="btn-primary btn-sm">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Report Bug
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map(col => (
            <div key={col.key} id={col.key} className="kanban-col">
              {/* Column header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.dot }} />
                  <span className="text-xs font-semibold text-notion-text">{col.label}</span>
                </div>
                <span className="text-xs bg-notion-border text-notion-muted px-2 py-0.5 rounded-full">
                  {bugsByPriority[col.key].length}
                </span>
              </div>

              <SortableContext items={bugsByPriority[col.key].map(b => b._id)} strategy={verticalListSortingStrategy}>
                {bugsByPriority[col.key].length === 0 ? (
                  <div className="text-center py-8 text-notion-muted text-xs border border-dashed border-notion-border rounded-lg">
                    No bugs
                  </div>
                ) : bugsByPriority[col.key].map(bug => (
                  <SortableBugCard key={bug._id} bug={bug} navigate={navigate} />
                ))}
              </SortableContext>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeBug && <div className="w-64 rotate-2 opacity-90"><BugCard bug={activeBug} navigate={() => {}} isDragging={false} /></div>}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
