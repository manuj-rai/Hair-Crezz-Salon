import { useEffect, useMemo, useState } from 'react';
import { CalendarOff, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { repo } from '../../lib/repo';
import type { BlockedSlot, BusinessHour } from '../../types/db';
import { fmtTime12, isoDate } from '../../lib/utils';
import { Modal, useConfirm } from './ui';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

type HourDraft = {
  day_of_week: number;
  open_time: string;
  close_time: string;
  closed: boolean;
};

export default function AdminHours() {
  const [hours, setHours] = useState<HourDraft[]>(
    Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, open_time: '10:00', close_time: '20:00', closed: false })),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Set<number>>(new Set());

  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [editingBlock, setEditingBlock] = useState<(Partial<BlockedSlot> & { date: string; start_time: string; end_time: string }) | null>(null);

  const { confirm, dialog } = useConfirm();

  const today = isoDate(new Date());
  const horizonEnd = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return isoDate(d);
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [h, b] = await Promise.all([
        repo.listHours(),
        repo.listBlockedRange(today, horizonEnd),
      ]);
      setHours((current) =>
        current.map((row) => {
          const matched = h.find((x) => x.day_of_week === row.day_of_week);
          return matched
            ? {
                day_of_week: row.day_of_week,
                open_time: matched.open_time ?? '10:00',
                close_time: matched.close_time ?? '20:00',
                closed: matched.closed,
              }
            : row;
        }),
      );
      setBlocked(b);
      setDirty(new Set());
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function patchHour(day: number, patch: Partial<HourDraft>) {
    setHours((xs) => xs.map((x) => (x.day_of_week === day ? { ...x, ...patch } : x)));
    setDirty((s) => new Set([...s, day]));
  }

  async function saveAll() {
    if (dirty.size === 0) return;
    setSaving(true);
    try {
      const toSave = hours.filter((h) => dirty.has(h.day_of_week));
      await Promise.all(
        toSave.map((h) =>
          repo.upsertHours({
            day_of_week: h.day_of_week,
            open_time: h.closed ? null : h.open_time,
            close_time: h.closed ? null : h.close_time,
            closed: h.closed,
          } as BusinessHour),
        ),
      );
      toast.success('Hours saved');
      setDirty(new Set());
    } catch (e) {
      console.error(e);
      toast.error('Could not save hours');
    } finally {
      setSaving(false);
    }
  }

  async function saveBlock() {
    if (!editingBlock) return;
    if (!editingBlock.date || !editingBlock.start_time || !editingBlock.end_time) {
      toast.error('Fill in all fields');
      return;
    }
    if (editingBlock.start_time >= editingBlock.end_time) {
      toast.error('End time must be after start time');
      return;
    }
    try {
      await repo.upsertBlocked(editingBlock);
      toast.success('Saved');
      setEditingBlock(null);
      load();
    } catch (e) {
      console.error(e);
      toast.error('Could not save');
    }
  }

  function askDeleteBlock(b: BlockedSlot) {
    confirm({
      title: 'Remove blocked slot?',
      message: `Free up ${b.date} ${b.start_time}–${b.end_time}? Customers will be able to book this time again.`,
      destructive: true,
      confirmLabel: 'Remove',
      onConfirm: async () => {
        try {
          await repo.deleteBlocked(b.id);
          toast.success('Removed');
          load();
        } catch { toast.error('Could not remove'); }
      },
    });
  }

  return (
    <div className="space-y-8">
      <section>
        <header className="mb-3 sm:mb-4 flex items-start justify-between gap-3 flex-wrap">
          <div className="hidden lg:block">
            <h1 className="font-display text-2xl sm:text-3xl">Business hours</h1>
            <p className="text-muted text-sm mt-1">Set when the salon accepts bookings each day.</p>
          </div>
          <h2 className="font-display text-xl lg:hidden">Business hours</h2>
          <button
            onClick={saveAll}
            disabled={dirty.size === 0 || saving}
            className="btn-primary"
          >
            <Save className="h-4 w-4" /> {saving ? 'Saving' : dirty.size > 0 ? `Save (${dirty.size})` : 'Save'}
          </button>
        </header>

        {/* Mobile compact list */}
        <div className="lg:hidden card divide-y divide-border">
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="p-3"><div className="h-7 shimmer-bg animate-shimmer rounded" /></div>
            ))
          ) : hours.map((h) => (
            <div key={h.day_of_week} className={'p-3 flex items-center gap-2 ' + (dirty.has(h.day_of_week) ? 'bg-amber-50/50' : '')}>
              <div className="w-12 font-medium text-sm shrink-0">{DAYS[h.day_of_week].slice(0, 3)}</div>
              {h.closed ? (
                <span className="badge bg-red-100 text-red-900 mr-auto">Closed</span>
              ) : (
                <div className="flex items-center gap-1.5 flex-1">
                  <input
                    type="time"
                    className="input py-1.5 text-sm flex-1 min-w-0"
                    value={h.open_time}
                    onChange={(e) => patchHour(h.day_of_week, { open_time: e.target.value })}
                  />
                  <span className="text-muted text-xs">–</span>
                  <input
                    type="time"
                    className="input py-1.5 text-sm flex-1 min-w-0"
                    value={h.close_time}
                    onChange={(e) => patchHour(h.day_of_week, { close_time: e.target.value })}
                  />
                </div>
              )}
              <label className="flex items-center gap-1.5 text-xs text-muted shrink-0 ml-auto">
                <input
                  type="checkbox"
                  checked={h.closed}
                  onChange={(e) => patchHour(h.day_of_week, { closed: e.target.checked })}
                />
                Closed
              </label>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block card overflow-hidden">
          <table className="w-full text-[13px] table-fixed">
            <colgroup>
              <col className="w-[20%]" />
              <col />
              <col />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted bg-bg/60 border-b border-border">
                <th className="text-left py-2.5 px-3 font-semibold">Day</th>
                <th className="text-left py-2.5 px-3 font-semibold">Opens</th>
                <th className="text-left py-2.5 px-3 font-semibold">Closes</th>
                <th className="text-center py-2.5 px-3 font-semibold">Closed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i}><td colSpan={4} className="p-3"><div className="h-7 shimmer-bg animate-shimmer rounded" /></td></tr>
                ))
              ) : hours.map((h) => (
                <tr key={h.day_of_week} className={'transition-colors ' + (dirty.has(h.day_of_week) ? 'bg-amber-50/50' : 'hover:bg-bg/40')}>
                  <td className="py-2 px-3 font-medium align-middle">{DAYS[h.day_of_week]}</td>
                  <td className="py-2 px-3 align-middle">
                    <input
                      type="time"
                      className="input py-1.5 text-sm w-auto"
                      value={h.open_time}
                      disabled={h.closed}
                      onChange={(e) => patchHour(h.day_of_week, { open_time: e.target.value })}
                    />
                  </td>
                  <td className="py-2 px-3 align-middle">
                    <input
                      type="time"
                      className="input py-1.5 text-sm w-auto"
                      value={h.close_time}
                      disabled={h.closed}
                      onChange={(e) => patchHour(h.day_of_week, { close_time: e.target.value })}
                    />
                  </td>
                  <td className="py-2 px-3 text-center align-middle">
                    <input
                      type="checkbox"
                      checked={h.closed}
                      onChange={(e) => patchHour(h.day_of_week, { closed: e.target.checked })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <header className="mb-3 sm:mb-4 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display text-lg sm:text-2xl flex items-center gap-2">
              <CalendarOff className="h-4 w-4 sm:h-5 sm:w-5 text-accent" /> Blocked time
            </h2>
            <p className="text-muted text-xs sm:text-sm mt-1">Vacations, training, off-site events.</p>
          </div>
          <button
            onClick={() => setEditingBlock({ date: today, start_time: '10:00', end_time: '20:00', reason: '' })}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Block time
          </button>
        </header>

        {/* Mobile cards */}
        <div className="lg:hidden space-y-2">
          {blocked.length === 0 ? (
            <div className="card p-8 text-center text-muted text-sm">Nothing blocked in the next 90 days.</div>
          ) : blocked.map((b) => (
            <div key={b.id} className="card p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">
                  {new Date(`${b.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="text-xs text-muted">{fmtTime12(b.start_time)} – {fmtTime12(b.end_time)}</div>
                {b.reason && <div className="text-xs text-muted italic mt-0.5">"{b.reason}"</div>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button className="h-8 px-2 rounded-md hover:bg-bg/60 text-xs font-medium" onClick={() => setEditingBlock(b)}>Edit</button>
                <button className="h-8 w-8 rounded-md hover:bg-red-50 text-red-600 grid place-items-center" onClick={() => askDeleteBlock(b)} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block card overflow-hidden">
          <table className="w-full text-[13px] table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[26%]" />
              <col />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-muted bg-bg/60 border-b border-border">
                <th className="text-left py-2.5 px-3 font-semibold">Date</th>
                <th className="text-left py-2.5 px-3 font-semibold">Time</th>
                <th className="text-left py-2.5 px-3 font-semibold">Reason</th>
                <th className="py-2.5 px-3 sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {blocked.length === 0 ? (
                <tr><td colSpan={4} className="text-center text-muted py-12">Nothing blocked in the next 90 days.</td></tr>
              ) : blocked.map((b) => (
                <tr key={b.id} className="group hover:bg-bg/40 transition-colors">
                  <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                    {new Date(`${b.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-2.5 px-3 text-muted whitespace-nowrap tabular-nums">
                    {fmtTime12(b.start_time)} – {fmtTime12(b.end_time)}
                  </td>
                  <td className="py-2.5 px-3 text-muted truncate" title={b.reason ?? undefined}>{b.reason || '—'}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button className="h-7 px-2 rounded-md text-xs font-medium hover:bg-bg text-muted" onClick={() => setEditingBlock(b)} title="Edit">Edit</button>
                      <button className="h-7 w-7 rounded-md grid place-items-center hover:bg-red-50 text-red-600" onClick={() => askDeleteBlock(b)} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingBlock && (
        <Modal onClose={() => setEditingBlock(null)} title={editingBlock.id ? 'Edit blocked time' : 'Block time'}>
          <div className="space-y-3">
            <div>
              <label className="label">Date</label>
              <input
                className="input"
                type="date"
                value={editingBlock.date}
                onChange={(e) => setEditingBlock({ ...editingBlock, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">From</label>
                <input
                  className="input"
                  type="time"
                  value={editingBlock.start_time}
                  onChange={(e) => setEditingBlock({ ...editingBlock, start_time: e.target.value })}
                />
              </div>
              <div>
                <label className="label">To</label>
                <input
                  className="input"
                  type="time"
                  value={editingBlock.end_time}
                  onChange={(e) => setEditingBlock({ ...editingBlock, end_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Reason <span className="text-muted text-xs">(optional)</span></label>
              <input
                className="input"
                value={editingBlock.reason ?? ''}
                onChange={(e) => setEditingBlock({ ...editingBlock, reason: e.target.value })}
                placeholder="Vacation, training, etc."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button className="btn-outline" onClick={() => setEditingBlock(null)}>Cancel</button>
            <button className="btn-primary" onClick={saveBlock}>Save</button>
          </div>
        </Modal>
      )}

      {dialog}
    </div>
  );
}
