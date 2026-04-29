// Central plan limits — single source of truth
export const PLAN_LIMITS = {
  free:         { projects: 3,   members: 5,   aiRequests: 0,    storage: 1    },
  starter:      { projects: 15,  members: 15,  aiRequests: 10,   storage: 10   },
  professional: { projects: -1,  members: 50,  aiRequests: 500,  storage: 50   },
  business:     { projects: -1,  members: -1,  aiRequests: -1,   storage: 500  },
  enterprise:   { projects: -1,  members: -1,  aiRequests: -1,   storage: -1   },
};

// -1 means unlimited
export function getLimit(plan, resource) {
  return PLAN_LIMITS[plan]?.[resource] ?? PLAN_LIMITS.free[resource];
}

export function isUnlimited(plan, resource) {
  return getLimit(plan, resource) === -1;
}
