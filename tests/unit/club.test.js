import {
  applyRegistration,
  activityDateText,
  activitySignLabels,
  buildActivityRows,
  buildDateOptions,
  clampQueryDate,
  formatHistoryWhen,
  historyStatusLabel,
  mergeActivitySignState,
  normalizeSignTask,
  resolveClubAction,
  matchesSignTask,
  resolveOperableSignTask,
  resolveSignTaskPhase,
  sameActivity,
  myTaskStatusLabel,
  registrationStatusLabel,
  shiftDate,
  signActionForPhase,
  signInStatusLabel,
  signOutStatusLabel,
  taskRegistrationLabel,
  weekdayLabel,
} from '../../src/domain/club';

test('签到状态决定当前是签到、签退还是已完成', () => {
  expect(resolveSignTaskPhase(null)).toBe('unsigned');
  expect(resolveSignTaskPhase({ optionStatus: '1', signInStatus: 0, signBackStatus: 0 })).toBe('joined');
  expect(resolveSignTaskPhase({ signInStatus: 1, signBackStatus: 0 })).toBe('signedIn');
  expect(resolveSignTaskPhase({ signInStatus: 1, signBackStatus: 1 })).toBe('completed');
  expect(resolveSignTaskPhase({ signStatus: '1', signInStatus: null, signBackStatus: null })).toBe('joined');
  expect(signActionForPhase(resolveSignTaskPhase({ activityId: 50013, signStatus: '1', signInStatus: null, signBackStatus: null }))).toEqual({
    signType: '1',
    label: '签到',
  });
  expect(activitySignLabels({
    clubActivityId: 50013,
    activityStatus: '2',
    optionStatus: '1',
    signStatus: '1',
  })).toEqual({ signIn: '未签到', signOut: '未签退' });
  expect(resolveSignTaskPhase({ signStatus: '3', signInStatus: '1', signBackStatus: null })).toBe('signedIn');
});

test('可报名活动给出报名，已报名活动给出取消', () => {
  expect(resolveClubAction({ optionStatus: '6' })).toMatchObject({ type: 1, label: '报名', disabled: false });
  expect(resolveClubAction({ optionStatus: '1' })).toMatchObject({ type: 2, label: '取消报名' });
  expect(resolveClubAction({ optionStatus: '7', maxStudent: 0 })).toMatchObject({ type: 1, label: '报名' });
});

test('活动日期从今天排到当年最后一天，前后一天不越出这个范围', () => {
  const options = buildDateOptions(new Date(2026, 9, 19));
  expect(options[0]).toEqual({ value: '2026-10-19', label: '周一' });
  expect(options[options.length - 1].value).toBe('2026-12-31');
  expect(weekdayLabel('2026-10-19')).toBe('周一');
  expect(shiftDate('2026-10-19', 1)).toBe('2026-10-20');
  expect(shiftDate('2026-10-19', -1)).toBe('2026-10-18');
  expect(clampQueryDate('2026-10-18', options)).toBe('2026-10-19');
  expect(clampQueryDate('2026-11-02', options)).toBe('2026-11-02');
});

test('签到记录和学期记录各自显示完成状态', () => {
  expect(historyStatusLabel({ signStatus: '1' }, 'record')).toBe('已完成');
  expect(historyStatusLabel({ signStatus: '3' }, 'record')).toBe('未签退');
  expect(historyStatusLabel({ signStatus: '0' }, 'record')).toBe('未签到');
  expect(historyStatusLabel({ signStatus: '1' }, 'semester')).toBe('已完成');
  expect(historyStatusLabel({ signStatus: '0' }, 'semester')).toBe('未完成');
  expect(formatHistoryWhen({ yymmdd: '2026-10-19', weekDay: 1, startTime: '18:00', endTime: '20:00' })).toBe(
    '2026-10-19 周一 18:00 - 20:00',
  );
});

test('签到任务缺坐标时用活动列表里的经纬度，已签到后动作是签退', () => {
  const activities = [
    {
      clubActivityId: 42,
      activityName: '体能锻炼',
      optionStatus: '1',
      latitude: '30.58',
      longitude: '103.98',
    },
  ];
  const task = resolveOperableSignTask({
    statusPayload: { activityId: 42, signInStatus: 0, signBackStatus: 0 },
    activities,
  });
  expect(task).toMatchObject({
    activityId: 42,
    latitude: '30.58',
    longitude: '103.98',
  });
  expect(signActionForPhase(resolveSignTaskPhase(task, activities))).toEqual({ signType: '1', label: '签到' });

  const signed = resolveOperableSignTask({
    statusPayload: { activityId: 42, signInStatus: 1, signBackStatus: 0, latitude: '30.58', longitude: '103.98' },
    activities,
  });
  expect(signActionForPhase(resolveSignTaskPhase(signed, activities))).toEqual({ signType: '2', label: '签退' });
});

test('报名后显示这一场的签到，不拿已结束任务或列表 signStatus 充数', () => {
  const registered = {
    clubActivityId: 50013,
    optionStatus: '1',
    signStatus: '1',
    startTime: '18:00',
    latitude: '30.1',
    longitude: '104.1',
    activityName: '课外体育锻炼',
  };
  const finished = {
    clubActivityId: 50011,
    activityStatus: '3',
    optionStatus: '4',
    signStatus: '1',
    mmdd: '10-19',
    startTime: '18:00',
  };
  const task = resolveOperableSignTask({
    statusPayload: null,
    activities: [registered],
    pending: [finished],
  });
  expect(task.activityId).toBe(50013);
  expect(matchesSignTask(task, registered)).toBe(true);
  expect(matchesSignTask(task, finished)).toBe(false);
  expect(signActionForPhase(resolveSignTaskPhase(task, [registered]))).toEqual({ signType: '1', label: '签到' });
});

test('没有签到状态时，已报名活动仍然可以签到', () => {
  const task = resolveOperableSignTask({
    statusPayload: null,
    activities: [{ activityId: 7, optionStatus: '1', latitude: '1', longitude: '2', activityName: '夜跑' }],
  });
  expect(task).toMatchObject({ activityId: 7, activityName: '夜跑', latitude: '1', longitude: '2' });
  expect(signActionForPhase(resolveSignTaskPhase(task))).toEqual({ signType: '1', label: '签到' });
});

test('活动同时显示报名、签到和签退状态', () => {
  expect(registrationStatusLabel({ optionStatus: '6' })).toBe('可报名');
  expect(registrationStatusLabel({ optionStatus: '1' })).toBe('已报名');
  expect(signInStatusLabel({ signInStatus: 0, signBackStatus: 0 })).toBe('未签到');
  expect(signOutStatusLabel({ signInStatus: 1, signBackStatus: 0 })).toBe('未签退');
  expect(signInStatusLabel({ signInStatus: 1, signBackStatus: 1 })).toBe('已签到');
  expect(signOutStatusLabel({ signInStatus: 1, signBackStatus: 1 })).toBe('已签退');
  expect(signInStatusLabel({ signStatus: '3' })).toBe('已签到');
  expect(signOutStatusLabel({ signStatus: '3' })).toBe('未签退');
  expect(taskRegistrationLabel({ activityId: 1, signInStatus: 0 }, [])).toBe('已报名');
});

test('开放报名的场次不会因为取消标记变成已报名', () => {
  const item = { activityId: 3, optionStatus: '6', cancelSign: '1', signStatus: '1', startTime: '18:00' };
  expect(registrationStatusLabel(item)).toBe('可报名');
  expect(resolveClubAction(item)).toMatchObject({ type: 1, label: '报名', disabled: false });
  expect(activitySignLabels(item)).toEqual({ signIn: '未签到', signOut: '未签退' });
});

test('同一名称的不同场次各自显示报名状态', () => {
  const morning = { activityId: 1, activityName: '跑步', startTime: '08:00', optionStatus: '6', address: '田径场' };
  const evening = { activityId: 2, activityName: '跑步', startTime: '18:00', optionStatus: '6', address: '田径场' };
  const pending = [{ activityId: 2, startTime: '18:00', optionStatus: '1' }];
  const rows = buildActivityRows([morning, evening], pending, {
    activityId: 2,
    startTime: '18:00',
    signInStatus: 1,
    signBackStatus: 0,
  });
  expect(rows.map((row) => registrationStatusLabel(row))).toEqual(['可报名', '已报名']);
  expect(resolveClubAction(rows[1])).toMatchObject({ type: 2, label: '取消报名' });
  expect(activitySignLabels(rows[0])).toEqual({ signIn: '未签到', signOut: '未签退' });
  expect(activitySignLabels(rows[1]).signIn).toBe('已签到');
  expect(activitySignLabels(rows[1]).signOut).toBe('未签退');
});

test('只根据活动编号对应场次，不同时间不算同一场', () => {
  expect(sameActivity(
    { activityId: 2, startTime: '18:00' },
    { activityId: 2, startTime: '08:00' },
  )).toBe(false);
  expect(sameActivity(
    { configurationId: 9, startTime: '18:00' },
    { configurationId: 9, startTime: '18:00', activityId: 3 },
  )).toBe(false);
});

test('可报名的场次不沿用别的活动的签到状态', () => {
  const labels = activitySignLabels({ activityId: 8, optionStatus: '6', signStatus: '1' });
  expect(labels).toEqual({ signIn: '未签到', signOut: '未签退' });
  expect(registrationStatusLabel({ activityId: 8, optionStatus: '6', signStatus: '1' })).toBe('可报名');
});

test('我的任务按每一场自己的活动状态显示', () => {
  expect(myTaskStatusLabel({ activityStatus: '2', optionStatus: '1', mmdd: '10-20' })).toBe('进行中');
  expect(myTaskStatusLabel({ activityStatus: '3', optionStatus: '4', mmdd: '10-19' })).toBe('已结束');
  expect(registrationStatusLabel({ activityStatus: '1', optionStatus: '6' })).toBe('可报名');
  expect(registrationStatusLabel({ activityStatus: '3', optionStatus: '1' })).toBe('已报名');
});

test('我的任务按各自日期和活动状态显示，已结束的不能取消', () => {
  const rows = buildActivityRows(
    [],
    [
      { clubActivityId: 50011, activityStatus: '3', optionStatus: '4', signStatus: '1', mmdd: '10-19', startTime: '18:00', cancelSign: '0' },
      { clubActivityId: 50009, activityStatus: '3', optionStatus: '4', signStatus: '1', mmdd: '10-16', startTime: '18:00', cancelSign: '0' },
    ],
    null,
    '2026-10-19',
  );
  expect(rows).toHaveLength(1);
  expect(activityDateText(rows[0])).toBe('10-19');
  expect(registrationStatusLabel(rows[0])).toBe('已完成');
  expect(activitySignLabels(rows[0])).toEqual({ signIn: '已签到', signOut: '已签退' });
  expect(resolveClubAction(rows[0])).toMatchObject({ disabled: true, label: '已结束' });
});

test('签到状态为空时不覆盖活动本身的完成状态', () => {
  const merged = mergeActivitySignState(
    { activityId: 1, signStatus: '1', optionStatus: '4' },
    { activityId: 1, signInStatus: null, signBackStatus: null, signStatus: null },
  );
  expect(signInStatusLabel(merged)).toBe('已签到');
  expect(signOutStatusLabel(merged)).toBe('已签退');
  expect(registrationStatusLabel(merged)).toBe('已完成');
});

test('没有活动编号的签到任务被丢掉', () => {
  expect(normalizeSignTask(null)).toBeNull();
  expect(normalizeSignTask({})).toBeNull();
  expect(normalizeSignTask({ activityId: 0 })).toBeNull();
  expect(normalizeSignTask({ activityId: 9 })).toMatchObject({
    activityId: 9,
    latitude: '',
    longitude: '',
  });
});
