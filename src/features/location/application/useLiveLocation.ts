import { useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { useSession, usePartnerId } from '@/core/state/session';
import { locationRepository } from '../data/locationRepository';
import { haversineMeters, estimateEta, type LatLng } from '@/core/utils/geo';
import type { LivePosition } from '@/types/models';

/**
 * Publishes my location (battery-aware, significant-change) and subscribes to
 * my partner's. Returns both positions + computed distance/ETA.
 *
 * Cost/battery: `distanceInterval: 50` means we only emit when moved ≥50m, and
 * `Balanced` accuracy avoids constant GPS. This keeps RTDB writes and battery
 * drain minimal — the redesign called out in COST_ANALYSIS §F1.
 */
export function useLiveLocation() {
  const { couple, uid } = useSession();
  const coupleId = couple?.id ?? null;
  const partnerId = usePartnerId();

  const [mine, setMine] = useState<LivePosition | null>(null);
  const [partner, setPartner] = useState<LivePosition | null>(null);

  // publish my position
  useEffect(() => {
    if (!coupleId || !uid) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 50, timeInterval: 30_000 },
        async (loc) => {
          const level = await Battery.getBatteryLevelAsync().catch(() => -1);
          const bstate = await Battery.getBatteryStateAsync().catch(() => Battery.BatteryState.UNKNOWN);
          const pos: Omit<LivePosition, 'timestamp'> = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            speed: loc.coords.speed ?? null,
            accuracy: loc.coords.accuracy ?? null,
            batteryPercentage: level >= 0 ? level : 1,
            isCharging: bstate === Battery.BatteryState.CHARGING,
          };
          setMine({ ...pos, timestamp: Date.now() });
          locationRepository.publish(coupleId, uid, pos).catch(() => {});
        },
      );
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [coupleId, uid]);

  // subscribe to partner
  useEffect(() => {
    if (!coupleId || !partnerId) return;
    return locationRepository.subscribe(coupleId, partnerId, setPartner);
  }, [coupleId, partnerId]);

  const distanceM = useMemo(() => {
    if (!mine || !partner) return null;
    return haversineMeters(mine as LatLng, partner as LatLng);
  }, [mine, partner]);

  const eta = useMemo(() => (distanceM == null ? null : estimateEta(distanceM)), [distanceM]);

  return { mine, partner, distanceM, eta };
}
