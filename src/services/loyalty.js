import { getStoreLoyaltyConfig } from "./storeConfig";

function toAmount(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, numericValue);
}

function toWholeNumber(value) {
  return Math.max(0, Math.floor(toAmount(value)));
}

export function buildDefaultLoyaltyProfile(config = getStoreLoyaltyConfig()) {
  return {
    totalSpend: 0,
    loyaltyPoints: 0,
    availableRewards: [],
    tier: getTierForSpend(0, config).name,
    visitCount: 0,
    lastPurchaseAt: "",
  };
}

export function getPointsForSpend(amount, config = getStoreLoyaltyConfig()) {
  return Math.floor(toAmount(amount) * toAmount(config.pointsPerDollar || 1));
}

export function getTierForSpend(totalSpend, config = getStoreLoyaltyConfig()) {
  const tiers = Array.isArray(config.tiers) ? [...config.tiers] : [];
  const orderedTiers = tiers.sort(
    (left, right) => toAmount(left.minTotalSpend) - toAmount(right.minTotalSpend)
  );

  return (
    orderedTiers.reduce((currentTier, tier) => {
      if (toAmount(totalSpend) >= toAmount(tier.minTotalSpend)) {
        return tier;
      }

      return currentTier;
    }, orderedTiers[0]) || { id: "base", name: "Member", minTotalSpend: 0 }
  );
}

export function getAvailableRewards(loyaltyPoints, config = getStoreLoyaltyConfig()) {
  const points = toWholeNumber(loyaltyPoints);
  const rewards = Array.isArray(config.rewardThresholds) ? config.rewardThresholds : [];

  return rewards
    .filter((reward) => points >= toWholeNumber(reward.pointsCost))
    .sort((left, right) => toWholeNumber(left.pointsCost) - toWholeNumber(right.pointsCost))
    .map((reward) => ({
      id: reward.id,
      title: reward.title,
      pointsCost: toWholeNumber(reward.pointsCost),
      description: reward.description || "",
    }));
}

export function buildCompletedOrderLoyaltyProfile(
  customerRecord,
  order,
  options = {}
) {
  const config = options.config || getStoreLoyaltyConfig();
  const purchaseDate = options.purchaseDate || new Date().toISOString();
  const orderId = order?.orderId || order?.id || "";
  const currentRewardedOrderId = customerRecord?.lastRewardedOrderId || "";

  if (orderId && currentRewardedOrderId === orderId) {
    return {
      totalSpend: toAmount(customerRecord?.totalSpend),
      loyaltyPoints: toWholeNumber(customerRecord?.loyaltyPoints),
      availableRewards: getAvailableRewards(customerRecord?.loyaltyPoints, config),
      tier: getTierForSpend(customerRecord?.totalSpend, config).name,
      visitCount: toWholeNumber(customerRecord?.visitCount),
      lastPurchaseAt: customerRecord?.lastPurchaseAt || purchaseDate,
      lastRewardedOrderId: currentRewardedOrderId,
    };
  }

  const updatedTotalSpend = Number(
    (toAmount(customerRecord?.totalSpend) + toAmount(order?.total)).toFixed(2)
  );
  const updatedLoyaltyPoints =
    toWholeNumber(customerRecord?.loyaltyPoints) + getPointsForSpend(order?.total, config);
  const updatedVisitCount = toWholeNumber(customerRecord?.visitCount) + 1;

  return {
    totalSpend: updatedTotalSpend,
    loyaltyPoints: updatedLoyaltyPoints,
    availableRewards: getAvailableRewards(updatedLoyaltyPoints, config),
    tier: getTierForSpend(updatedTotalSpend, config).name,
    visitCount: updatedVisitCount,
    lastPurchaseAt: purchaseDate,
    lastRewardedOrderId: orderId,
  };
}

export function getNextReward(loyaltyPoints, config = getStoreLoyaltyConfig()) {
  const points = toWholeNumber(loyaltyPoints);
  const rewards = Array.isArray(config.rewardThresholds) ? config.rewardThresholds : [];
  const nextReward = rewards
    .sort((left, right) => toWholeNumber(left.pointsCost) - toWholeNumber(right.pointsCost))
    .find((reward) => points < toWholeNumber(reward.pointsCost));

  if (!nextReward) {
    return null;
  }

  return {
    ...nextReward,
    pointsRemaining: toWholeNumber(nextReward.pointsCost) - points,
  };
}
