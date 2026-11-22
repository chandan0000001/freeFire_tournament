export function tournamentAvailability(tournament, now = Date.now()) {
  const capacity = Math.max(0, Number(tournament.maxSlots) || 0);
  const registered = Math.max(0, Number(tournament.registeredSlots) || 0);
  const remaining = Math.max(0, capacity - registered);
  const date = new Date(tournament.matchDate).getTime();
  const matchInFuture = !Number.isFinite(date) || date > now;
  const isStatusOpen = tournament.status === 'registration_open';

  // If Admin explicitly marked registration_open, open slots exist, and match is in future: allow registration
  const canRegister = isStatusOpen && remaining > 0 && matchInFuture;

  return {
    capacity,
    registered,
    remaining,
    percentage: capacity ? Math.min(100, (registered / capacity) * 100) : 0,
    canRegister,
  };
}
