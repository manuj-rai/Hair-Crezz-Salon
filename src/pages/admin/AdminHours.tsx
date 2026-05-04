import { useEffect, useState } from 'react';
import { repo } from '../../lib/repo';
import type { BusinessHour } from '../../types/db';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminHours() {
  const [hours, setHours] = useState<BusinessHour[] | null>(null);

  useEffect(() => {
    repo.listHours().then(setHours).catch(() => setHours([]));
  }, []);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl">Business hours</h1>
        <p className="text-muted mt-1">Edit when the salon is open. Affects which slots customers can book.</p>
      </header>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted bg-bg">
              <th className="text-left py-3 px-4 font-medium">Day</th>
              <th className="text-left py-3 px-4 font-medium">Opens</th>
              <th className="text-left py-3 px-4 font-medium">Closes</th>
              <th className="text-center py-3 px-4 font-medium">Closed</th>
            </tr>
          </thead>
          <tbody>
            {(hours ?? Array.from({ length: 7 })).map((_h, i) => {
              const h = hours?.find((x) => x.day_of_week === i);
              return (
                <tr key={i} className="border-t border-border">
                  <td className="py-3 px-4 font-medium">{DAYS[i]}</td>
                  <td className="py-3 px-4 text-muted">{h?.open_time ?? '—'}</td>
                  <td className="py-3 px-4 text-muted">{h?.close_time ?? '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={'badge ' + (h?.closed ? 'bg-red-100 text-red-900' : 'bg-emerald-100 text-emerald-900')}>
                      {h?.closed ? 'Closed' : 'Open'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted mt-4">
        Hours editing UI ships in v1.1. For now, edit via Supabase Studio →{' '}
        <code className="bg-bg px-1 py-0.5 rounded">business_hours</code> table.
      </p>
    </div>
  );
}
