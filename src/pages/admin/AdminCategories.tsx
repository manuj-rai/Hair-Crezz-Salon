import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { repo } from '../../lib/repo';
import type { ServiceCategory } from '../../types/db';

type Editing = (Partial<ServiceCategory> & { name: string }) | null;

export default function AdminCategories() {
  const [items, setItems] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing>(null);

  async function load() {
    setLoading(true);
    try { setItems(await repo.listServiceCategories(false)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error('Category name is required');
      return;
    }
    try {
      await repo.upsertServiceCategory(editing);
      toast.success('Saved');
      setEditing(null);
      load();
    } catch (e) {
      console.error(e);
      toast.error('Could not save category');
    }
  }

  async function del(category: ServiceCategory) {
    if (!confirm(`Delete "${category.name}"? Services using this category must be moved first.`)) return;
    try {
      await repo.deleteServiceCategory(category.id);
      toast.success('Deleted');
      load();
    } catch (e) {
      console.error(e);
      toast.error('Move services out of this category before deleting it');
    }
  }

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">Categories</h1>
          <p className="text-muted mt-1">Manage service groups used across pricing and booking.</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', active: true, sort_order: items.length + 1 })}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Add category
        </button>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-muted bg-bg">
                <th className="text-left py-3 px-4 font-medium">Category</th>
                <th className="text-right py-3 px-4 font-medium">Sort</th>
                <th className="text-center py-3 px-4 font-medium">Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-t border-border"><td colSpan={4} className="p-3"><div className="h-7 shimmer-bg animate-shimmer rounded" /></td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-muted py-12">No categories yet.</td></tr>
              ) : items.map((category) => (
                <tr key={category.id} className="border-t border-border">
                  <td className="py-3 px-4 font-medium">{category.name}</td>
                  <td className="py-3 px-4 text-right">{category.sort_order}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={'badge ' + (category.active ? 'bg-emerald-100 text-emerald-900' : 'bg-zinc-200 text-zinc-700')}>
                      {category.active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <button className="btn-ghost btn-sm" onClick={() => setEditing(category)}><Pencil className="h-4 w-4" /></button>
                    <button className="btn-ghost btn-sm text-red-600" onClick={() => del(category)}><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? 'Edit category' : 'New category'}>
          <div className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Sort order</label>
              <input className="input" type="number" value={editing.sort_order ?? 0} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.active ?? true} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} />
              Show this category
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
