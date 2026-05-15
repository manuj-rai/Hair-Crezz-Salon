import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, EyeOff, Pencil, Plus, Search, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { repo } from '../../lib/repo';
import type { Stylist } from '../../types/db';
import { Modal, useConfirm } from './ui';

type Editing = (Partial<Stylist> & { name: string; role: string }) | null;

export default function AdminStylists() {
  const [items, setItems] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing>(null);
  const [specInput, setSpecInput] = useState('');
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { confirm, dialog } = useConfirm();

  async function load() {
    setLoading(true);
    try { setItems(await repo.listStylists(false)); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function openEdit(s?: Stylist) {
    setSpecInput(s?.specialties.join(', ') ?? '');
    setEditing(s ? { ...s } : { name: '', role: 'Stylist', bio: '', photo_url: '', specialties: [], active: true });
  }

  async function save() {
    if (!editing) return;
    if (!editing.name || !editing.role) { toast.error('Name and role are required'); return; }
    try {
      await repo.upsertStylist({ ...editing, specialties: specInput.split(',').map((s) => s.trim()).filter(Boolean) });
      toast.success('Saved');
      setEditing(null);
      load();
    } catch { toast.error('Could not save'); }
  }

  function askDelete(s: Stylist) {
    confirm({
      title: 'Delete stylist?',
      message: `Remove "${s.name}" from the team? Existing bookings keep this stylist on file.`,
      destructive: true,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try { await repo.deleteStylist(s.id); toast.success('Deleted'); load(); }
        catch { toast.error('Could not delete'); }
      },
    });
  }

  async function toggleActive(s: Stylist) {
    try {
      const updated = await repo.upsertStylist({ ...s, active: !s.active });
      setItems((xs) => xs.map((x) => (x.id === s.id ? updated : x)));
    } catch { toast.error('Could not update'); }
  }

  async function move(s: Stylist, dir: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((x) => x.id === s.id);
    const target = sorted[idx + dir];
    if (!target) return;
    try {
      await Promise.all([
        repo.upsertStylist({ ...s, sort_order: target.sort_order }),
        repo.upsertStylist({ ...target, sort_order: s.sort_order }),
      ]);
      load();
    } catch { toast.error('Could not reorder'); }
  }

  const filtered = useMemo(() => {
    return items.filter((s) => {
      if (activeFilter === 'active' && !s.active) return false;
      if (activeFilter === 'inactive' && s.active) return false;
      if (q) {
        const hay = `${s.name} ${s.role} ${s.specialties.join(' ')}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, q, activeFilter]);

  return (
    <div>
      <header className="mb-6 sm:mb-8 hidden lg:flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow-ink">The team</p>
          <h1 className="font-display text-3xl tracking-tight mt-2 leading-tight">Stylists</h1>
          <p className="text-muted text-sm mt-1.5">Manage your team and their specialties.</p>
        </div>
        <button onClick={() => openEdit()} className="btn-primary">
          <Plus className="h-4 w-4" /> Add stylist
        </button>
      </header>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute top-3.5 left-3 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, role, specialty" className="input pl-9" />
        </div>
        <button onClick={() => openEdit()} className="btn-primary lg:hidden shrink-0" aria-label="Add stylist">
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <select className="input w-full sm:w-auto py-1.5 text-sm mb-4" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-44 card shimmer-bg animate-shimmer" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-muted">No stylists match.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
            const idx = sorted.findIndex((x) => x.id === s.id);
            return (
              <div key={s.id} className={'card p-5 ' + (s.active ? '' : 'opacity-60')}>
                <div className="flex items-start gap-4">
                  {s.photo_url ? (
                    <img src={s.photo_url} alt={s.name} className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-bg grid place-items-center"><User className="h-6 w-6 text-muted" /></div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium flex items-center gap-1">
                      {s.name}
                      {!s.active && <EyeOff className="h-3 w-3 text-muted" />}
                    </div>
                    <div className="text-xs text-muted">{s.role}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.specialties.map((sp) => <span key={sp} className="badge bg-bg text-muted">{sp}</span>)}
                    </div>
                  </div>
                </div>
                {s.bio && <p className="text-sm text-muted mt-3 line-clamp-3">{s.bio}</p>}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost btn-sm !p-1" onClick={() => move(s, -1)} disabled={idx === 0} title="Move up">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button className="btn-ghost btn-sm !p-1" onClick={() => move(s, 1)} disabled={idx === sorted.length - 1} title="Move down">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost btn-sm" onClick={() => toggleActive(s)} title={s.active ? 'Hide from site' : 'Show on site'}>
                      <Toggle on={s.active} />
                    </button>
                    <button className="btn-ghost btn-sm" onClick={() => openEdit(s)} title="Edit"><Pencil className="h-4 w-4" /></button>
                    <button className="btn-ghost btn-sm text-red-600" onClick={() => askDelete(s)} title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? 'Edit stylist' : 'New stylist'}>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Name</label>
                <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Role</label>
                <input className="input" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Photo URL</label>
              <input className="input" value={editing.photo_url ?? ''} onChange={(e) => setEditing({ ...editing, photo_url: e.target.value })} />
            </div>
            <div>
              <label className="label">Specialties <span className="text-muted text-xs">(comma-separated)</span></label>
              <input className="input" value={specInput} onChange={(e) => setSpecInput(e.target.value)} placeholder="Cuts, Color, Bridal" />
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea className="textarea" rows={3} value={editing.bio ?? ''} onChange={(e) => setEditing({ ...editing, bio: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Show on public site
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
            <button className="btn-primary" onClick={save}>Save</button>
          </div>
        </Modal>
      )}

      {dialog}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={'inline-flex h-5 w-9 items-center rounded-full transition ' + (on ? 'bg-emerald-500' : 'bg-zinc-300')}>
      <span className={'h-4 w-4 rounded-full bg-white shadow-sm transition-transform ' + (on ? 'translate-x-4' : 'translate-x-0.5')} />
    </span>
  );
}
