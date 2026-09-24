import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Lock, Crown } from 'lucide-react-native';
import { FeatureKey } from '@/constants/feature-keys';
import { useFeatureGateStore, BlockReason } from '@/store/feature-gate-store';

interface FeatureGateProps {
  featureKey: FeatureKey;
  children: React.ReactNode;
  fallbackStyle?: 'greyed' | 'hidden';
  onUpgradePress?: () => void;
}

export const FeatureGate = React.memo(function FeatureGate({
  featureKey,
  children,
  fallbackStyle = 'greyed',
  onUpgradePress,
}: FeatureGateProps) {
  const isEnabled = useFeatureGateStore(s => s.isFeatureEnabled(featureKey));
  const blockReason = useFeatureGateStore(s => s.getBlockReason(featureKey));
  const message = useFeatureGateStore(s => s.getBlockMessage(featureKey));

  if (isEnabled) {
    return <>{children}</>;
  }

  if (fallbackStyle === 'hidden') {
    return null;
  }

  const isTierBlock = blockReason === 'tier';

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[styles.overlay, isTierBlock && styles.overlayTier]}
        activeOpacity={isTierBlock && onUpgradePress ? 0.7 : 1}
        onPress={isTierBlock && onUpgradePress ? onUpgradePress : undefined}
        disabled={!isTierBlock || !onUpgradePress}
      >
        <View style={[styles.badge, isTierBlock && styles.badgeTier]}>
          {isTierBlock ? (
            <Crown size={14} color="#FFF" />
          ) : (
            <Lock size={14} color="#FFF" />
          )}
          <Text style={styles.badgeText}>
            {message || 'Not available'}
          </Text>
        </View>
        {isTierBlock && onUpgradePress && (
          <Text style={styles.tapHint}>Tap to learn more</Text>
        )}
      </TouchableOpacity>
      <View style={styles.greyed} pointerEvents="none">
        {children}
      </View>
    </View>
  );
});

interface FeatureGateCardProps {
  featureKey: FeatureKey;
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  onUpgradePress?: () => void;
}

export const FeatureGateCard = React.memo(function FeatureGateCard({
  featureKey,
  onPress,
  children,
  style,
  onUpgradePress,
}: FeatureGateCardProps) {
  const isEnabled = useFeatureGateStore(s => s.isFeatureEnabled(featureKey));
  const blockReason = useFeatureGateStore(s => s.getBlockReason(featureKey));
  const message = useFeatureGateStore(s => s.getBlockMessage(featureKey));

  if (isEnabled) {
    return (
      <TouchableOpacity style={style} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  const isTierBlock = blockReason === 'tier';

  return (
    <TouchableOpacity
      style={[style, styles.cardDisabled]}
      activeOpacity={isTierBlock && onUpgradePress ? 0.7 : 1}
      onPress={isTierBlock && onUpgradePress ? onUpgradePress : undefined}
      disabled={!isTierBlock || !onUpgradePress}
    >
      <View style={styles.cardOverlay}>
        <View style={[styles.cardBadge, isTierBlock && styles.cardBadgeTier]}>
          {isTierBlock ? (
            <Crown size={12} color="#FFF" />
          ) : (
            <Lock size={12} color="#FFF" />
          )}
          <Text style={styles.cardBadgeText} numberOfLines={1}>
            {isTierBlock ? 'Upgrade to unlock' : (message || 'Unavailable in your region')}
          </Text>
        </View>
      </View>
      <View style={{ opacity: 0.35 }} pointerEvents="none">
        {children}
      </View>
    </TouchableOpacity>
  );
});

export function useIsFeatureEnabled(featureKey: FeatureKey): boolean {
  return useFeatureGateStore(s => s.isFeatureEnabled(featureKey));
}

export function useFeatureBlockReason(featureKey: FeatureKey): BlockReason {
  return useFeatureGateStore(s => s.getBlockReason(featureKey));
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 240, 255, 0.5)',
    borderRadius: 12,
  },
  overlayTier: {
    backgroundColor: 'rgba(255, 248, 230, 0.55)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(90, 80, 110, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  badgeTier: {
    backgroundColor: 'rgba(180, 130, 20, 0.9)',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  tapHint: {
    color: 'rgba(140, 100, 10, 0.8)',
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500' as const,
  },
  greyed: {
    opacity: 0.3,
  },
  cardDisabled: {
    position: 'relative',
    overflow: 'hidden',
  },
  cardOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(90, 80, 110, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  cardBadgeTier: {
    backgroundColor: 'rgba(180, 130, 20, 0.9)',
  },
  cardBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
