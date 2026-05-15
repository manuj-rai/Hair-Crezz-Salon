import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { repo } from '../../lib/repo';
import type { ServiceCategory } from '../../types/db';
import { Modal, useConfirm } from './ui';

type Editing = (Partial<ServiceCategory> & { name: string }) | null;

export default function AdminCategories() {
  const [items, setItems] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing>(null);
  const [q, setQ] = useState('');
  const { confirm, dialog } = useConfirm();

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

  function askDelete(category: ServiceCategory) {
    confirm({
      title: 'Delete category?',
      message: `Remove "${category.name}"? Move any services using this category first, otherwise the delete will fail.`,
      destructive: true,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await repo.deleteServiceCategory(category.id);
          toast.success('Deleted');
          load();
        } catch (e) {
          console.error(e);
          toast.error('Move services out of this category before deleting it');
        }
      },
    });
  }

  async function toggleActive(c: ServiceCategory) {
    try {
      await repo.upsertServiceCategory({ ...c, active: !c.active });
      load();
    } catch { toast.error('Could not update'); }
  }

  async function move(c: ServiceCategory, dir: -1 | 1) {
    const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((x) => x.id === c.id);
    const target = sorted[idx + dir];
    if (!target) return;
    try {
      await Promise.all([
        repo.upsertServiceCategory({ ...c, sort_order: target.sort_order }),
        repo.upsertServiceCategory({ ...target, sort_order: c.sort_order }),
      ]);
      load();
    } catch { toast.error('Could not reorder'); }
  }

  const filtered = useMemo(() => {
    if (!q) return items;
    return items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  }, [items, q]);

  return (
    <div>
      <header className="mb-6 sm:mb-8 hidden lg:flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow-ink">Taxonomy</p>
          <h1 className="font-display text-3xl tracking-tight mt-2 leading-tight">Categories</h1>
          <p className="text-muted text-sm mt-1.5">Manage service groups used across pricing and booking.</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', active: true, sort_order: items.length + 1 })}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Add category
        </button>
      </header>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute top-3.5 left-3 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search categories" className="input pl-9" />
        </div>
        <button
          onClick={() => setEditing({ name: '', active: true, sort_order: items.length + 1 })}
          className="btn-primary lg:hidden shrink-0"
          aria-label="Add category"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-14 shimmer-bg animate-shimmer" />)
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-muted text-sm">No categories match.</div>
        ) : filtered.map((category) => (
          <div key={category.id} className={'card p-3 flex items-center gap-3 ' + (category.active ? '' : 'opacity-60')}>
            <div className="flex flex-col">
              <button className="h-7 w-7 rounded-md border border-border grid place-items-center text-muted hover:text-ink hover:bg-bg/60" onClick={() => move(category, -1)} aria-label="Move up">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button className="h-7 w-7 rounded-md border border-border grid place-items-center text-muted hover:text-ink hover:bg-bg/60 mt-1" onClick={() => move(category, 1)} aria-label="Move down">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{category.name}</div>
              <button onClick={() => toggleActive(category)} className="text-xs text-muted flex items-center gap-1.5 mt-1">
                <Toggle on={category.active} /> {category.active ? 'Active' : 'Hidden'}
              </button>
            </div>
            <div className="flex gap-1 shrink-0">
              <button className="h-8 w-8 rounded-md hover:bg-bg/60 grid place-items-center" onClick={() => setEditing(category)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              <button className="h-8 w-8 rounded-md hover:bg-red-50 text-red-600 grid place-items-center" onClick={() => askDelete(category)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block card overflow-hidden">
        <table className="w-full text-[13px] table-fixed">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted bg-bg/60 border-b border-border">
              <th className="text-center py-2.5 px-2 font-semibold">#</th>
              <th className="text-left py-2.5 px-3 font-semibold">Category</th>
              <th className="text-center py-2.5 px-3 font-semibold">Active</th>
              <th className="py-2.5 px-3 sr-only">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="p-3"><div className="h-7 shimmer-bg animate-shimmer rounded" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-muted py-12">No categories match.</td></tr>
            ) : filtered.map((category) => (
              <tr key={category.id} className={'group hover:bg-bg/40 transition-colors ' + (category.active ? '' : 'opacity-60')}>
                <td className="py-2.5 px-2 align-middle">
                  <div className="inline-flex flex-col gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button className="h-5 w-5 rounded grid place-items-center hover:bg-bg text-muted" onClick={() => move(category, -1)} title="Move up">
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button className="h-5 w-5 rounded grid place-items-center hover:bg-bg text-muted" onClick={() => move(category, 1)} title="Move down">
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                </td>
                <td className="py-2.5 px-3 font-medium truncate">{category.name}</td>
                <td className="py-2.5 px-3 text-center">
                  <button onClick={() => toggleActive(category)} className="align-middle">
                    <Toggle on={category.active} />
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="inline-flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button className="h-7 w-7 rounded-md grid place-items-center hover:bg-bg text-muted" onClick={() => setEditing(category)} title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 rounded-md grid place-items-center hover:bg-red-50 text-red-600" onClick={() => askDelete(category)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? 'Edit category' : 'New category'}>
          <div className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
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
