export function isApiSuccess(data) {
  const code = Number(data?.code);
  return code === 10000 || code === 1000;
}

export function responseMessage(data, fallback) {
  const candidates = [data?.response?.message, data?.response, data?.message, data?.msg];
  for (const item of candidates) {
    if (typeof item === 'string' && item.trim()) return item.trim();
  }
  return fallback;
}

export function extractList(response) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== 'object') return [];

  const keys = ['records', 'list', 'rows', 'items', 'activityList'];
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key];
  }
  return [];
}

const WEEKDAY_TEXT = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '日',
};

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDate(value) {
  const [year, month, day] = String(value || '').split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

export function shiftDate(value, days) {
  const date = parseDate(value);
  date.setDate(date.getDate() + Number(days || 0));
  return formatDate(date);
}

export function weekdayLabel(value) {
  const date = parseDate(value);
  const day = date.getDay();
  const number = day === 0 ? 7 : day;
  return `周${WEEKDAY_TEXT[number]}`;
}

export function buildDateOptions(from = new Date()) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(start.getFullYear(), 11, 31);
  const result = [];
  const current = new Date(start);
  while (current <= end) {
    const value = formatDate(current);
    result.push({ value, label: weekdayLabel(value) });
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export function clampQueryDate(value, options) {
  if (options.some((item) => item.value === value)) return value;
  return options[0]?.value || formatDate(new Date());
}

export function historyStatusLabel(item, kind) {
  if (kind === 'semester') return String(item?.signStatus) === '1' ? '已完成' : '未完成';
  const signStatus = String(item?.signStatus);
  if (signStatus === '1') return '已完成';
  if (signStatus === '3') return '未签退';
  return '未签到';
}

export function formatHistoryWhen(item) {
  const weekValue = Number(item?.weekDay);
  const week = Number.isFinite(weekValue) && WEEKDAY_TEXT[weekValue] ? `周${WEEKDAY_TEXT[weekValue]}` : '';
  const dateText = item?.yymmdd || '';
  const time = `${item?.startTime || '--:--'} - ${item?.endTime || '--:--'}`;
  return [dateText, week, time].filter(Boolean).join(' ');
}

export function extractPagedList(response) {
  const list = extractList(response);
  if (!response || Array.isArray(response) || typeof response !== 'object') {
    return { list, total: list.length, hasTotal: false };
  }
  const totalCandidate = Number(response.total ?? response.totalCount ?? response.count);
  const hasTotal = Number.isFinite(totalCandidate) && totalCandidate >= 0;
  return {
    list,
    total: hasTotal ? totalCandidate : list.length,
    hasTotal,
  };
}

export function resolveActivityId(item) {
  const candidates = [item?.clubActivityId, item?.activityId, item?.configurationId, item?.id];
  for (const raw of candidates) {
    const value = Number(raw);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return null;
}

function isUnlimitedSignup(item) {
  const totalRaw = item?.maxStudent ?? item?.studentNum;
  if (totalRaw === '' || totalRaw === null || totalRaw === undefined) return false;
  const total = Number(totalRaw);
  return Number.isFinite(total) && total <= 0;
}

export function resolveEffectiveOptionStatus(item) {
  const optionStatus = String(item?.optionStatus ?? '').trim();
  if (optionStatus === '7' && isUnlimitedSignup(item)) return '6';
  return optionStatus;
}

export function resolveClubAction(item) {
  if (String(item?.activityStatus) === '3') {
    return { type: 0, label: '已结束', disabled: true };
  }

  const optionStatus = resolveEffectiveOptionStatus(item);

  if (optionStatus === '6') {
    return { type: 1, label: '报名', disabled: false };
  }
  if (optionStatus === '1') {
    return { type: 2, label: '取消报名', disabled: false };
  }
  if (optionStatus === '2') {
    return { type: 2, label: '取消报名', disabled: false };
  }
  if (optionStatus === '7') {
    return { type: 0, label: '已满员', disabled: true };
  }
  if (optionStatus === '3') {
    return { type: 0, label: '无法报名', disabled: true };
  }
  if (optionStatus === '4') {
    return { type: 0, label: '已完成', disabled: true };
  }
  return { type: 0, label: '暂不可操作', disabled: true };
}

export function normalizeSignTask(payload) {
  if (Array.isArray(payload)) return normalizeSignTask(payload[0]);
  if (!payload || typeof payload !== 'object') return null;

  const activityId = Number(payload.activityId || payload.clubActivityId);
  if (!Number.isFinite(activityId) || activityId <= 0) return null;

  return {
    ...payload,
    activityId,
    activityName: payload.activityName || payload.itemName || '',
    latitude: String(payload.latitude || ''),
    longitude: String(payload.longitude || ''),
  };
}

export function mergeActivitySignState(item, signTask) {
  if (!signTask || resolveActivityId(item) !== Number(signTask.activityId)) return item;
  const next = { ...item };
  for (const key of ['signInStatus', 'signBackStatus', 'signStatus', 'optionStatus', 'latitude', 'longitude', 'activityName']) {
    const value = signTask[key];
    if (value != null && value !== '') next[key] = value;
  }
  return next;
}

function withActivityCoords(task, pools) {
  if (!task || (task.latitude && task.longitude)) return task;
  const linked = pools.find((item) => resolveActivityId(item) === task.activityId);
  if (!linked) return task;
  return {
    ...task,
    activityName: task.activityName || linked.activityName || linked.itemName || '',
    latitude: task.latitude || String(linked.latitude || ''),
    longitude: task.longitude || String(linked.longitude || ''),
  };
}

export function resolveOperableSignTask({ statusPayload, activities = [], pending = [] } = {}) {
  const pools = [...pending, ...activities];
  const fromStatus = normalizeSignTask(statusPayload);
  if (fromStatus) return withActivityCoords(fromStatus, pools);

  const joinedPending = pending.find((item) => resolveActivityId(item));
  const joinedListed = activities.find((item) => {
    const status = resolveEffectiveOptionStatus(item);
    return status === '1' || status === '2';
  });
  const source = joinedPending || joinedListed;
  if (!source) return null;

  return withActivityCoords(
    normalizeSignTask({
      ...source,
      activityId: resolveActivityId(source),
    }),
    pools,
  );
}

function isSignedStatus(status) {
  return Number(status) === 1;
}

export function registrationStatusLabel(item) {
  const option = resolveEffectiveOptionStatus(item);
  if (option) {
    switch (option) {
      case '1':
        return '已报名';
      case '2':
        return '进行中';
      case '6':
        return '可报名';
      case '7':
        return '人数已满';
      case '3':
        return '已报名其他活动';
      case '4':
        return '已完成';
      default:
        break;
    }
  }

  if (item?.activityStatus != null && item.activityStatus !== '') {
    switch (String(item.activityStatus)) {
      case '1':
        return '可报名';
      case '2':
        return '进行中';
      case '3':
        return '已结束';
      default:
        return '待开放';
    }
  }

  return '待开放';
}

export function signInStatusLabel(item) {
  if (item && item.signInStatus != null && item.signInStatus !== '') {
    return isSignedStatus(item.signInStatus) ? '已签到' : '未签到';
  }
  const signStatus = String(item?.signStatus ?? '');
  if (signStatus === '1' || signStatus === '3') return '已签到';
  return '未签到';
}

export function signOutStatusLabel(item) {
  if (item && item.signBackStatus != null && item.signBackStatus !== '') {
    return isSignedStatus(item.signBackStatus) ? '已签退' : '未签退';
  }
  if (String(item?.signStatus ?? '') === '1') return '已签退';
  return '未签退';
}

export function taskRegistrationLabel(task, activities = []) {
  const linked = activities.find((item) => resolveActivityId(item) === Number(task?.activityId));
  const label = registrationStatusLabel(linked || task);
  if (label !== '待开放') return label;
  if (isSignedStatus(task?.signInStatus) && isSignedStatus(task?.signBackStatus)) return '已完成';
  if (isSignedStatus(task?.signInStatus)) return '进行中';
  return '已报名';
}

export function sameActivity(a, b) {
  if (!a || !b) return false;
  const primaryId = (item) => {
    const value = Number(item.clubActivityId || item.activityId || 0);
    return Number.isFinite(value) && value > 0 ? value : 0;
  };
  const time = (item) => String(item.startTime || '').trim();
  const day = (item) => String(item.yymmdd || '').slice(0, 10);
  const left = primaryId(a);
  const right = primaryId(b);
  if (left && right && left === right) {
    if (time(a) && time(b) && time(a) !== time(b)) return false;
    if (day(a) && day(b) && day(a) !== day(b)) return false;
    return true;
  }
  return false;
}

export function applyRegistration(item, pending = [], signTask = null) {
  const next = { ...item };
  const joined = pending.find((entry) => sameActivity(entry, item));
  if (joined) {
    const joinedStatus = resolveEffectiveOptionStatus(joined);
    next.optionStatus = joinedStatus && joinedStatus !== '6' ? joined.optionStatus : '1';
    for (const key of ['signInStatus', 'signBackStatus', 'latitude', 'longitude', 'startTime', 'endTime', 'address', 'addressDetail', 'yymmdd']) {
      if ((next[key] == null || next[key] === '') && joined[key] != null && joined[key] !== '') next[key] = joined[key];
    }
  }
  if (signTask && sameActivity(signTask, next)) {
    for (const key of ['signInStatus', 'signBackStatus', 'signStatus', 'latitude', 'longitude']) {
      if (signTask[key] != null && signTask[key] !== '') next[key] = signTask[key];
    }
  }
  return next;
}

export function myTaskStatusLabel(item) {
  switch (String(item?.activityStatus ?? '')) {
    case '1':
      return '可报名';
    case '2':
      return '进行中';
    case '3':
      return '已结束';
    default:
      return '待开放';
  }
}

export function isRegisteredActivity(item) {
  const option = resolveEffectiveOptionStatus(item);
  return option === '1' || option === '2' || option === '4';
}

export function activityDateText(item) {
  const raw = String(item?.yymmdd || item?.mmdd || '').trim();
  return raw;
}

export function matchesQueryDate(item, queryDate) {
  const target = String(queryDate || '');
  const monthDay = target.slice(5);
  const raw = activityDateText(item);
  if (!raw) return false;
  return raw === target || raw === monthDay;
}

export function activitySignLabels(item) {
  const fromMyTask = item?.activityStatus != null && item.activityStatus !== '';
  const hasExplicitSign =
    (item?.signInStatus != null && item.signInStatus !== '') ||
    (item?.signBackStatus != null && item.signBackStatus !== '');
  if (!fromMyTask && !hasExplicitSign) {
    return { signIn: '未签到', signOut: '未签退' };
  }
  return {
    signIn: signInStatusLabel(fromMyTask ? item : { ...item, signStatus: undefined }),
    signOut: signOutStatusLabel(fromMyTask ? item : { ...item, signStatus: undefined }),
  };
}

export function buildActivityRows(activities = [], pending = [], signTask = null, queryDate = '') {
  const visiblePending = pending.filter((item) => !queryDate || matchesQueryDate(item, queryDate) || !activityDateText(item));
  const rows = activities.map((item) => applyRegistration(item, visiblePending, signTask));
  const extras = [];
  for (const item of visiblePending) {
    if (!rows.some((row) => sameActivity(row, item))) extras.push(applyRegistration(item, visiblePending, signTask));
  }
  if (signTask && !rows.concat(extras).some((row) => sameActivity(row, signTask))) {
    const signDate = activityDateText(signTask);
    if (!queryDate || !signDate || matchesQueryDate(signTask, queryDate)) {
      extras.unshift(
        applyRegistration({ ...signTask, optionStatus: signTask.optionStatus || '1' }, visiblePending, signTask),
      );
    }
  }
  return [...extras, ...rows];
}

export function resolveSignTaskPhase(task, activities = []) {
  if (!task) return 'unsigned';

  if (isSignedStatus(task.signInStatus) && isSignedStatus(task.signBackStatus)) {
    return 'completed';
  }

  if (String(task.signStatus ?? '') === '1' || resolveEffectiveOptionStatus(task) === '4') {
    return 'completed';
  }

  if (isSignedStatus(task.signInStatus) || String(task.signStatus ?? '') === '3') {
    return 'signedIn';
  }

  let optionStatus = String(task.optionStatus ?? '').trim();
  if (!optionStatus) {
    const activityId = Number(task.activityId);
    const linked = activities.find((item) => resolveActivityId(item) === activityId);
    optionStatus = String(linked?.optionStatus ?? task.signStatus ?? '').trim();
  }
  return optionStatus === '1' ? 'joined' : 'unsigned';
}

export function signActionForPhase(phase) {
  if (phase === 'completed') return null;
  if (phase === 'signedIn') return { signType: '2', label: '签退' };
  return { signType: '1', label: '签到' };
}
