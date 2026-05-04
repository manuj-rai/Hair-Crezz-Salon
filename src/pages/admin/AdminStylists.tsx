import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, User } from 'lucide-react';
import { toast } from 'sonner';
import { repo } from '../../lib/repo';
import type { Stylist } from '../../types/db';

type Editing = (Partial<Stylist> & { name: string; role: string }) | null;

export default function AdminStylists() {
  const [items, setItems] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing>(null);
  const [specInput, setSpecInput] = useState('');

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

  async function del(s: Stylist) {
    if (!confirm(`Delete "${s.name}"?`)) return;
    try { await repo.deleteStylist(s.id); toast.success('Deleted'); load(); }
    catch { toast.error('Could not delete'); }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Stylists</h1>
          <p className="text-muted mt-1">Manage your team and their specialties.</p>
        </div>
        <button onClick={() => openEdit()} className="btn-primary">
          <Plus className="h-4 w-4" /> Add stylist
        </button>
      </header>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 card shimmer-bg animate-shimmer" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-muted">No stylists yet.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start gap-4">
                {s.photo_url ? (
                  <img src={s.photo_url} alt={s.name} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-bg grid place-items-center"><User className="h-6 w-6 text-muted" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted">{s.role}</div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.specialties.map((sp) => <span key={sp} className="badge bg-bg text-muted">{sp}</span>)}
                  </div>
                </div>
              </div>
              {s.bio && <p className="text-sm text-muted mt-3 line-clamp-3">{s.bio}</p>}
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                <button className="btn-ghost btn-sm" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /> Edit</button>
                <button className="btn-ghost btn-sm text-red-600" onClick={() => del(s)}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-primary/40 backdrop-blur-sm p-4" onClick={() => setEditing(null)}>
          <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-xl mb-4">{editing.id ? 'Edit stylist' : 'New stylist'}</h3>
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
          </div>
        </div>
      )}
    </div>
  );
}
