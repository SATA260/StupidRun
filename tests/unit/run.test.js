import {
  calculateDistanceBounds,
  calculatePaceMinutesPerKm,
  calculateTimeBounds,
  computeDurationFromDistance,
  formatPaceMinutesPerKm,
  isPaceWithinLimits,
  normalizeGender,
  normalizeRandomRunPayload,
  randomIntNonThousand,
  resolveRunBoundsFromStandard,
} from '../../src/domain/run';

test('性别字符串归一成 male、female 或空', () => {
  expect(normalizeGender('1')).toBe('male');
  expect(normalizeGender('female')).toBe('female');
  expect(normalizeGender('x')).toBe('');
});

test('男生距离上下限按学期标准加偏移', () => {
  expect(
    calculateDistanceBounds('male', {
      boyOnceDistanceMin: 2000,
      boyOnceDistanceMax: 5000,
    }),
  ).toEqual({ min: 2001, max: 6001 });
});

test('女生时间上下限直接取学期标准', () => {
  expect(
    calculateTimeBounds('female', {
      girlOnceTimeMin: 10,
      girlOnceTimeMax: 40,
    }),
  ).toEqual({ min: 10, max: 40 });
});

test('没有标准时距离用默认 1001 到 9000', () => {
  expect(resolveRunBoundsFromStandard({}, {}).distanceMin).toBe(1001);
  expect(resolveRunBoundsFromStandard({}, {}).distanceMax).toBe(9000);
});

test('随机距离避开整十，固定随机源时取区间起点', () => {
  expect(randomIntNonThousand(1001, 1005, () => 0)).toBe(1001);
});

test('1 公里在配速下限时用时 6 分钟', () => {
  expect(computeDurationFromDistance(1000, { rng: () => 0 })).toBe(6);
});

test('配速 7 分钟每公里格式化为 7 分 00 秒', () => {
  expect(calculatePaceMinutesPerKm(1000, 7)).toBe(7);
  expect(formatPaceMinutesPerKm(1000, 7)).toBe("7'00''/km");
});

test('配速超出 6 到 10 分钟时预设记录作废', () => {
  expect(isPaceWithinLimits(1000, 7)).toBe(true);
  expect(isPaceWithinLimits(1000, 5)).toBe(false);
  expect(
    normalizeRandomRunPayload(
      { run_distance: 2000, run_time: 16, track_points: '[]', map_id: 'cuit_hkg' },
      { minDistance: 1001, maxDistance: 9000, requireTrack: true },
    ),
  ).toEqual({
    map_id: 'cuit_hkg',
    run_distance: 2000,
    run_time: 16,
    track_points: '[]',
  });
  expect(normalizeRandomRunPayload({ run_distance: 2000, run_time: 4 })).toBeNull();
});

test('空值和非法距离不参与配速计算', () => {
  expect(normalizeGender(null)).toBe('');
  expect(normalizeGender('')).toBe('');
  expect(computeDurationFromDistance(0)).toBe(0);
  expect(computeDurationFromDistance(-5)).toBe(0);
  expect(computeDurationFromDistance(null)).toBe(0);
  expect(isPaceWithinLimits(0, 0)).toBe(true);
  expect(normalizeRandomRunPayload(null)).toBeNull();
  expect(normalizeRandomRunPayload({})).toBeNull();
  expect(normalizeRandomRunPayload('')).toBeNull();
});
