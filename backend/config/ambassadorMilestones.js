/**
 * Ambassador milestone rewards — single source of truth, read by
 * routes/ambassador.js for both displaying progress and validating claims.
 *
 * Rewards are extra days added to the existing `referralRewardDays` field
 * on User (the same field the base referral system already writes to —
 * see routes/referral.js). These stack on top of the normal 7-day
 * per-referral reward, they don't replace it.
 *
 * Inert while MONETIZATION_ENABLED is false (see config/featureFlags.js) —
 * same as the base referral rewards, days accumulate but don't do
 * anything paywall-related until monetization is switched on.
 */
export const AMBASSADOR_MILESTONES = [
  { id: "5_referrals", threshold: 5, rewardDays: 14, label: "5 referrals" },
  { id: "10_referrals", threshold: 10, rewardDays: 30, label: "10 referrals" },
  { id: "25_referrals", threshold: 25, rewardDays: 90, label: "25 referrals" },
];