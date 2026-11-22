export function tournamentAvailability(tournament, now = Date.now()) {
  const capacity = Math.max(0, Number(tournament.maxSlots) || 0);
  const registered = Math.max(0, Number(tournament.registeredSlots) || 0);
  const remaining = Math.max(0, capacity - registered);
  const isStatusOpen = tournament?.status === 'registration_open';

  const match = new Date(tournament.matchDate).getTime();
  const starts = tournament.registrationStart ? new Date(tournament.registrationStart).getTime() : -Infinity;
  const ends = tournament.registrationEnd ? new Date(tournament.registrationEnd).getTime() : Infinity;
  const canRegister = Boolean(isStatusOpen && remaining > 0 && Number.isFinite(match) && match > now && starts <= now && ends > now);

  return {
    capacity,
    registered,
    remaining,
    percentage: capacity ? Math.min(100, (registered / capacity) * 100) : 0,
    canRegister,
  };
}
