import { saveCustomMap } from '../../src/domain/map';
import { submitRun } from '../../src/domain/submitRun';

function line(count) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    const lng = 103.8 + i * 0.0002;
    points.push(`${lng.toFixed(6)},30.680000`);
  }
  return points;
}

const userInfo = { userId: 11, studentId: 22, schoolId: 33, gender: '1' };

test('没有登录信息时不提交', async () => {
  const saveNewRecord = jest.fn();
  const result = await submitRun({ distance: 2000 }, { api: { saveNewRecord } });
  expect(result).toEqual({ ok: false, msg: 'not_login' });
  expect(saveNewRecord).not.toHaveBeenCalled();
});

test('距离不是正整数时不提交', async () => {
  const saveNewRecord = jest.fn();
  const result = await submitRun(
    { distance: 0 },
    { userInfo, api: { saveNewRecord } },
  );
  expect(result.ok).toBe(false);
  expect(result.msg).toBe('distance_invalid');
  expect(saveNewRecord).not.toHaveBeenCalled();
});

test('提交时把生成的轨迹交给保存接口', async () => {
  saveCustomMap('submit', 'submit', line(40));
  const saveNewRecord = jest.fn(async () => ({ data: { code: 10000 } }));
  const result = await submitRun(
    { distance: 2000, runTime: 16, route: 'custom_submit' },
    {
      userInfo,
      runStandard: {},
      now: new Date('2026-03-02T00:00:00.000Z'),
      api: { saveNewRecord },
    },
  );

  expect(result.ok).toBe(true);
  expect(saveNewRecord).toHaveBeenCalledTimes(1);
  const [trackPoints, distance, runTime, userId, recordDate, yearSemester] = saveNewRecord.mock.calls[0];
  expect(JSON.parse(trackPoints).length).toBeGreaterThanOrEqual(2);
  expect(distance).toBe(2000);
  expect(runTime).toBe(16);
  expect(userId).toBe(11);
  expect(recordDate).toBe('2026-03-02');
  expect(yearSemester).toBe('20261');
});
