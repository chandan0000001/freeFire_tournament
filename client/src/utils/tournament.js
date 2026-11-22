export function tournamentAvailability(tournament) {
  const capacity = Math.max(0, Number(tournament.maxSlots) || 0);
  const registered = Math.max(0, Number(tournament.registeredSlots) || 0);
  const remaining = Math.max(0, capacity - registered);
  const isStatusOpen = tournament?.status === 'registration_open';

  // When status is registration_open and slots remain, registration is open
  const canRegister = Boolean(isStatusOpen && remaining > 0);

  return {
    capacity,
    registered,
    remaining,
    percentage: capacity ? Math.min(100, (registered / capacity) * 100) : 0,
    canRegister,
  };
}
