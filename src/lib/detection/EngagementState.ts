export type EngagementState =
  | { type: 'healthy';      sessionMs: number }
  | { type: 'softWarning';  reason: string; timeToBlockMs: number }
  | { type: 'passiveStare'; inactivityMs: number }
  | { type: 'autoplayTrap'; chainCount: number }
  | { type: 'nightRisk';    multiplier: number }
  | { type: 'sleepDetected' }
  | { type: 'fullBlock';    reason: string }
