/**
 * Usage analytics Admin UI (port TempoFlow — N6).
 * Consommer via `@creezio/observability/ui`.
 */
export { AnalyticsClient } from "./analytics-client";
export {
  AnalyticsProductivityPanel,
  type ProductivityPayload,
} from "./analytics-productivity-panel";
export {
  UsageAnalyticsProvider,
  type UsageAnalyticsProviderSession,
} from "./usage-analytics-provider";

export {
  flushUsageAnalytics,
  setUsageAnalyticsSession,
  trackUsagePageView,
  trackUsageEvent,
  ensureUsageAnalyticsDom,
} from "./usage-analytics-client";
