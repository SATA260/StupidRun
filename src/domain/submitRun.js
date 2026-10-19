import { api as defaultApi } from '../api';
import { genTrackPoints } from './map';
import {
  computeDurationFromDistance,
  normalizeRandomRunPayload,
  normalizeRoundedRunTime,
  resolveRunBoundsFromStandard,
} from './run';

export function currentYearSemester(date = new Date()) {
  return `${date.getFullYear()}${date.getMonth() + 1 < 8 ? '1' : '2'}`;
}

export async function submitRun(payload = {}, context = {}) {
  const dist = Number(payload?.distance);
  const userInfo = context.userInfo || {};
  const runStandard = context.runStandard || {};
  const client = context.api || defaultApi;
  const bounds = resolveRunBoundsFromStandard(userInfo, runStandard);

  if (!Number.isInteger(dist) || dist <= 0) {
    return {
      ok: false,
      msg: 'distance_invalid',
      bounds: { min: 1, max: 0 },
    };
  }

  if (!userInfo.userId || !userInfo.studentId || !userInfo.schoolId) {
    return { ok: false, msg: 'not_login' };
  }

  const route = String(payload?.route || context.route || 'default').trim() || 'default';
  const normalizedPresetRun = normalizeRandomRunPayload(payload?.presetRun, {
    minDistance: bounds.distanceMin,
    maxDistance: bounds.distanceMax,
    requireTrack: true,
  });

  const presetRun =
    normalizedPresetRun &&
    normalizedPresetRun.run_distance === dist &&
    (!String(normalizedPresetRun.map_id || '').trim() ||
      String(normalizedPresetRun.map_id || '').trim() === route)
      ? {
          runTime: normalizedPresetRun.run_time,
          trackPoints: normalizedPresetRun.track_points,
        }
      : null;

  const resolveRunTime = () => {
    const payloadRunTime = Number(payload?.runTime);
    if (payloadRunTime > 0) return payloadRunTime;
    if (Number(presetRun?.runTime) > 0) return Number(presetRun.runTime);

    const duration = computeDurationFromDistance(dist, {
      minMinutes: bounds.timeMin,
      maxMinutes: bounds.timeMax,
    });

    return normalizeRoundedRunTime(duration, dist, {
      minMinutes: bounds.timeMin,
      maxMinutes: bounds.timeMax,
    });
  };

  let runTime = resolveRunTime();
  let trackPoints = presetRun?.trackPoints || '';
  if (!trackPoints) {
    trackPoints = genTrackPoints(dist, route, runTime);
  }

  if (!trackPoints || trackPoints === '[]') {
    return { ok: false, msg: 'track_invalid' };
  }

  const now = context.now instanceof Date ? context.now : new Date();
  const recordDate = now.toISOString().split('T')[0];
  const yearSemester = currentYearSemester(now);

  try {
    const turnstileToken = payload?.turnstileToken || '';
    const { data } = await client.saveNewRecord(
      trackPoints,
      dist,
      runTime,
      userInfo.userId,
      recordDate,
      yearSemester,
      turnstileToken,
    );

    if (data?.code === 10000) {
      return { ok: true, data, runTime, trackPoints };
    }

    return { ok: false, data, runTime, trackPoints };
  } catch (error) {
    console.error('submitRun api error:', error);
    return { ok: false, error };
  }
}
