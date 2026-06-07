const COOLDOWN_HOURS = 48;

export interface CooldownState {
  active: boolean;
  nextAvailable: Date | null;
}

export function getCooldownState(
  lastFreeAuditAt: string | null | undefined
): CooldownState {
  if (!lastFreeAuditAt) {
    return { active: false, nextAvailable: null };
  }

  const last = new Date(lastFreeAuditAt);
  const nextAvailable = new Date(last.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);

  if (nextAvailable > new Date()) {
    return { active: true, nextAvailable };
  }

  return { active: false, nextAvailable: null };
}
