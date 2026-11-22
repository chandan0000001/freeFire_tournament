export function tournamentAvailability(tournament, now = Date.now()) {
  const capacity = Math.max(0, Number(tournament.maxSlots) || 0);
  const registered = Math.max(0, Number(tournament.registeredSlots) || 0);
  const remaining = Math.max(0, capacity - registered);
  const date = new Date(tournament.matchDate).getTime();
  const start = tournament.registrationStart ? new Date(tournament.registrationStart).getTime() : 0;
  const deadline = tournament.registrationEnd ? new Date(tournament.registrationEnd).getTime() : date;
  return { capacity, registered, remaining,
    percentage: capacity ? Math.min(100, registered / capacity * 100) : 0,
    canRegister: tournament.status === 'registration_open' && remaining > 0 && Number.isFinite(date) && date > now && Number.isFinite(start) && start <= now && Number.isFinite(deadline) && deadline > now,
  };
}
