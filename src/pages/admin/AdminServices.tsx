import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { repo } from '../../lib/repo';
import type { Service } from '../../types/db';
import { inr } from '../../lib/utils';

type Editing = (Partial<Service> & { name: string; price: number; duration_min: number; category: string }) | null;

export default function AdminServices() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing>(null);

  async function load() {
    setLoading(true);
    try { setItems(await repo.listServices(false)); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.name || !editing.category || editing.price < 0 || editing.duration_min <= 0) {
      toast.error('Please fill all required fields'); return;
    }
    try {
      await repo.upsertService(editing);
      toast.success('Saved');
      setEditing(null);
      load();
    } catch { toast.error('Could not save'); }
  }

  async function del(s: Service) {
    if (!confirm(`Delete "${s.name}"?`)) return;
    try { await repo.deleteService(s.id); toast.success('Deleted'); load(); }
    catch { toast.error('Could not delete'); }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Services</h1>
          <p className="text-muted mt-1">Add, edit and price the salon menu.</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', category: 'Hair', price: 0, duration_min: 30, description: '', active: true })}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Add service
        </button>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted bg-bg">
                <th className="text-left py-3 px-4 font-medium">Service</th>
                <th className="text-left py-3 px-4 font-medium">Category</th>
                <th className="text-right py-3 px-4 font-medium">Duration</th>
                <th className="text-right py-3 px-4 font-medium">Price</th>
                <th className="text-center py-3 px-4 font-medium">Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-border"><td colSpan={6} className="p-3"><div className="h-7 shimmer-bg animate-shimmer rounded" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-12">No services yet. Add your first one.</td></tr>
              ) : items.map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="py-3 px-4">
                    <div className="font-medium">{s.name}</div>
                    {s.description && <div className="text-xs text-muted">{s.description}</div>}
                  </td>
                  <td className="py-3 px-4 text-muted">{s.category}</td>
                  <td className="py-3 px-4 text-right">{s.duration_min}m</td>
                  <td className="py-3 px-4 text-right font-medium">{inr(s.price)}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={'badge ' + (s.active ? 'bg-emerald-100 text-emerald-900' : 'bg-zinc-200 text-zinc-700')}>
                      {s.active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button className="btn-ghost btn-sm" onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></button>
                    <button className="btn-ghost btn-sm text-red-600" onClick={() => del(s)}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? 'Edit service' : 'New service'}>
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Name</label>
                <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Category</label>
                <input className="input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} />
              </div>
              <div>
                <label className="label">Price (INR)</label>
                <input className="input" type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Duration (min)</label>
                <input className="input" type="number" value={editing.duration_min} onChange={(e) => setEditing({ ...editing, duration_min: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="textarea" rows={2} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
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
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-primary/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}
