import { genTrackPoints, loadMapFiles, saveCustomMap } from '../../src/domain/map';

function line(count) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const lng = 103.8 + i * 0.0002;
    points.push(`${lng.toFixed(6)},30.680000`);
  }
  return points;
}

test('内置校园路线能加载出地图编号', async () => {
  const ids = await loadMapFiles();
  expect(ids).toContain('cuit_hkg');
});

test('沿折线走出正里程时返回至少两个坐标', () => {
  saveCustomMap('line', 'line', line(30));
  const raw = genTrackPoints(120, 'custom_line', 12);
  const points = JSON.parse(raw);
  expect(points.length).toBeGreaterThanOrEqual(2);
  for (const point of points) {
    const [lng, lat] = String(point).split('-').map(Number);
    expect(Number.isFinite(lng)).toBe(true);
    expect(Number.isFinite(lat)).toBe(true);
  }
});

test('里程为 0 或只有一个点时轨迹是空数组', () => {
  expect(genTrackPoints(0, 'custom_line', 12)).toBe('[]');
  saveCustomMap('single', 'single', ['103.800000,30.680000']);
  expect(genTrackPoints(500, 'custom_single', 12)).toBe('[]');
});

test('负数、空值和非数字里程不生成轨迹', () => {
  expect(genTrackPoints(-1, 'custom_line', 12)).toBe('[]');
  expect(genTrackPoints(null, 'custom_line', 12)).toBe('[]');
  expect(genTrackPoints('abc', 'custom_line', 12)).toBe('[]');
});
