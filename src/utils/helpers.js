// Priority badge CSS class
export const priorityClass = (p) => ({
  Blocker: 'badge-blocker',
  High: 'badge-high',
  Medium: 'badge-medium',
  Low: 'badge-low',
}[p] || 'badge-low');

// Status badge CSS class
export const statusClass = (s) => ({
  'Open': 'badge-open',
  'Assigned': 'badge-assigned',
  'In Progress': 'badge-in-progress',
  'Resolved': 'badge-resolved',
  'Closed': 'badge-closed',
  'Reopened': 'badge-reopened',
}[s] || 'badge-open');

// Type badge
export const typeClass = (t) => ({
  Bug: 'badge-bug',
  Suggestion: 'badge-suggestion',
  Improvement: 'badge-improvement',
}[t] || 'badge-bug');

// Priority dot color
export const priorityColor = (p) => ({
  Blocker: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}[p] || '#22c55e');

// Relative time
export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

// Avatar initials
export const initials = (name = '') =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

// Avatar color from name
export const avatarColor = (name = '') => {
  const colors = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2'];
  let hash = 0;
  for (let c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};
