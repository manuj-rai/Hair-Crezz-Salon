import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { repo } from '../../lib/repo';
import type { Service, ServiceCategory } from '../../types/db';
import { inr } from '../../lib/utils';
import { Modal, useConfirm } from './ui';

type Editing = (Partial<Service> & { name: string; price: number; duration_min: number; category: string }) | null;

export default function AdminServices() {
  const [items, setItems] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing>(null);
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { confirm, dialog } = useConfirm();

  async function load() {
    setLoading(true);
    try {
      const [serviceList, categoryList] = await Promise.all([
        repo.listServices(false),
        repo.listServiceCategories(false),
      ]);
      setItems(serviceList);
      setCategories(categoryList);
    } finally { setLoading(false); }
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

  function askDelete(s: Service) {
    confirm({
      title: 'Delete service?',
      message: `Remove "${s.name}" from the menu? Existing bookings keep this service name on file.`,
      destructive: true,
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await repo.deleteService(s.id);
          toast.success('Deleted');
          load();
        } catch { toast.error('Could not delete'); }
      },
    });
  }

  async function toggleActive(s: Service) {
    try {
      const updated = await repo.upsertService({ ...s, active: !s.active });
      setItems((xs) => xs.map((x) => (x.id === s.id ? updated : x)));
    } catch { toast.error('Could not update'); }
  }

  async function move(s: Service, dir: -1 | 1) {
    // Swap sort_order with the next/previous service inside the same category.
    const peers = items
      .filter((x) => x.category === s.category)
      .sort((a, b) => a.sort_order - b.sort_order);
    const idx = peers.findIndex((x) => x.id === s.id);
    const target = peers[idx + dir];
    if (!target) return;
    try {
      await Promise.all([
        repo.upsertService({ ...s, sort_order: target.sort_order }),
        repo.upsertService({ ...target, sort_order: s.sort_order }),
      ]);
      load();
    } catch { toast.error('Could not reorder'); }
  }

  const filtered = useMemo(() => {
    return items.filter((s) => {
      if (activeFilter === 'active' && !s.active) return false;
      if (activeFilter === 'inactive' && s.active) return false;
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (q) {
        const hay = `${s.name} ${s.category} ${s.description ?? ''}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, q, activeFilter, categoryFilter]);

  return (
    <div>
      <header className="mb-4 sm:mb-6 hidden lg:flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Services</h1>
          <p className="text-muted text-sm mt-1">Add, edit and price the salon menu.</p>
        </div>
        <button
          onClick={() => setEditing({ name: '', category: categories[0]?.name ?? '', price: 0, duration_min: 30, description: '', active: true })}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" /> Add service
        </button>
      </header>

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute top-3.5 left-3 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services" className="input pl-9" />
        </div>
        <button
          onClick={() => setEditing({ name: '', category: categories[0]?.name ?? '', price: 0, duration_min: 30, description: '', active: true })}
          className="btn-primary lg:hidden shrink-0"
          aria-label="Add service"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <div className="flex gap-1.5 mb-4">
        <select className="input w-full py-1.5 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select className="input w-32 py-1.5 text-sm shrink-0" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-20 shimmer-bg animate-shimmer" />)
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-muted text-sm">No services match.</div>
        ) : filtered.map((s) => (
          <div key={s.id} className={'card p-3 ' + (s.active ? '' : 'opacity-60')}>
            <div className="flex items-start gap-3">
              <div className="flex flex-col">
                <button className="h-7 w-7 rounded-md border border-border grid place-items-center text-muted hover:text-ink hover:bg-bg/60" onClick={() => move(s, -1)} aria-label="Move up">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button className="h-7 w-7 rounded-md border border-border grid place-items-center text-muted hover:text-ink hover:bg-bg/60 mt-1" onClick={() => move(s, 1)} aria-label="Move down">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{s.name}</div>
                    <div className="text-[11px] text-muted">{s.category} · {s.duration_min}m</div>
                  </div>
                  <div className="font-semibold text-sm shrink-0">{inr(s.price)}</div>
                </div>
                {s.description && <div className="text-xs text-muted mt-1 line-clamp-2">{s.description}</div>}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                  <button onClick={() => toggleActive(s)} className="flex items-center gap-1.5 text-xs text-muted">
                    <Toggle on={s.active} /> {s.active ? 'Active' : 'Hidden'}
                  </button>
                  <div className="flex gap-1">
                    <button className="h-8 w-8 rounded-md hover:bg-bg/60 grid place-items-center" onClick={() => setEditing(s)} aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button className="h-8 w-8 rounded-md hover:bg-red-50 text-red-600 grid place-items-center" onClick={() => askDelete(s)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden lg:block card overflow-hidden">
        <table className="w-full text-[13px] table-fixed">
          <colgroup>
            <col className="w-12" />
            <col className="w-[34%]" />
            <col className="w-[18%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-muted bg-bg/60 border-b border-border">
              <th className="text-center py-2.5 px-2 font-semibold">#</th>
              <th className="text-left py-2.5 px-3 font-semibold">Service</th>
              <th className="text-left py-2.5 px-3 font-semibold">Category</th>
              <th className="text-right py-2.5 px-3 font-semibold">Duration</th>
              <th className="text-right py-2.5 px-3 font-semibold">Price</th>
              <th className="text-center py-2.5 px-3 font-semibold">Active</th>
              <th className="py-2.5 px-3 sr-only">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="p-3"><div className="h-7 shimmer-bg animate-shimmer rounded" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted py-12">No services match.</td></tr>
            ) : filtered.map((s) => (
              <tr key={s.id} className={'group hover:bg-bg/40 transition-colors ' + (s.active ? '' : 'opacity-60')}>
                <td className="py-2.5 px-2 align-middle">
                  <div className="inline-flex flex-col gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button className="h-5 w-5 rounded grid place-items-center hover:bg-bg text-muted" onClick={() => move(s, -1)} title="Move up">
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button className="h-5 w-5 rounded grid place-items-center hover:bg-bg text-muted" onClick={() => move(s, 1)} title="Move down">
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                </td>
                <td className="py-2.5 px-3">
                  <div className="font-medium truncate">{s.name}</div>
                  {s.description && <div className="text-xs text-muted truncate" title={s.description}>{s.description}</div>}
                </td>
                <td className="py-2.5 px-3 text-muted truncate">{s.category}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{s.duration_min}m</td>
                <td className="py-2.5 px-3 text-right font-medium tabular-nums">{inr(s.price)}</td>
                <td className="py-2.5 px-3 text-center">
                  <button onClick={() => toggleActive(s)} title="Toggle active" className="align-middle">
                    <Toggle on={s.active} />
                  </button>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <div className="inline-flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button className="h-7 w-7 rounded-md grid place-items-center hover:bg-bg text-muted" onClick={() => setEditing(s)} title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button className="h-7 w-7 rounded-md grid place-items-center hover:bg-red-50 text-red-600" onClick={() => askDelete(s)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                <select className="input" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>
                  <option value="" disabled>Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
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

      {dialog}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={
        'inline-flex h-5 w-9 items-center rounded-full transition ' +
        (on ? 'bg-emerald-500' : 'bg-zinc-300')
      }
    >
      <span
        className={
          'h-4 w-4 rounded-full bg-white shadow-sm transition-transform ' +
          (on ? 'translate-x-4' : 'translate-x-0.5')
        }
      />
    </span>
  );
}
