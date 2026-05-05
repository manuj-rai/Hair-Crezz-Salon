// Multi-service bookings encode the full service list as a "Services: A + B + C"
// prefix in the notes column — the bookings schema only carries one service_id,
// and we don't want to migrate the schema for a demo template.

export const SERVICES_NOTE_PREFIX = 'Services: ';

export function parseBookingNotes(notes: string | null) {
  if (!notes) return { services: null as string | null, userNotes: null as string | null };
  if (!notes.startsWith(SERVICES_NOTE_PREFIX)) return { services: null, userNotes: notes };
  const rest = notes.slice(SERVICES_NOTE_PREFIX.length);
  const splitIdx = rest.indexOf('\n\n');
  if (splitIdx === -1) return { services: rest.trim(), userNotes: null };
  return {
    services: rest.slice(0, splitIdx).trim(),
    userNotes: rest.slice(splitIdx + 2).trim() || null,
  };
}

export function composeBookingNotes(serviceNames: string[], userNotes: string) {
  const trimmed = userNotes.trim();
  if (serviceNames.length <= 1) return trimmed || null;
  return `${SERVICES_NOTE_PREFIX}${serviceNames.join(' + ')}${trimmed ? `\n\n${trimmed}` : ''}`;
}
