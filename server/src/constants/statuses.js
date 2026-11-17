export const TOURNAMENT_STATUS = {
  DRAFT: 'draft',
  UPCOMING: 'upcoming',
  REGISTRATION_OPEN: 'registration_open',
  REGISTRATION_CLOSED: 'registration_closed',
  FULL: 'full',
  ROOM_READY: 'room_ready',
  LIVE: 'live',
  RESULT_REVIEW: 'result_review',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  UNDER_REVIEW: 'under_review',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  REFUNDED: 'refunded',
};

export const RESULT_STATUS = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  PENDING_REVIEW: 'pending_review',
  NEEDS_CLARIFICATION: 'needs_clarification',
  VERIFIED: 'verified',
  PUBLISHED: 'published',
  DISPUTED: 'disputed',
  VOID: 'void',
};

export const ROOM_DELIVERY_STATUS = {
  UNNOTIFIED: 'unnotified',
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
};

export const PRIZE_PAYOUT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
};

export const TOURNAMENT_FORMAT = {
  SQUAD: 'squad',
  SOLO: 'solo',
};
