import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { api } from '@/api';
import {
  activityDateText,
  activitySignLabels,
  buildDateOptions,
  clampQueryDate,
  extractList,
  extractPagedList,
  formatDate,
  formatHistoryWhen,
  isApiSuccess,
  isRegisteredActivity,
  myTaskStatusLabel,
  registrationStatusLabel,
  resolveActivityId,
  resolveClubAction,
  matchesSignTask,
  resolveOperableSignTask,
  resolveSignTaskPhase,
  responseMessage,
  shiftDate,
  signActionForPhase,
  signInStatusLabel,
  signOutStatusLabel,
  weekdayLabel,
} from '@/domain/club';
import { useSession } from '@/session/SessionProvider';
import { colors } from '@/theme';
import { ActionButton, Chip, Notice, Screen, Segment, toneForStatus } from '@/ui';

const HISTORY_PAGE_SIZE = 15;

export default function ClubScreen() {
  const session = useSession();
  const dateOptions = useMemo(() => buildDateOptions(new Date()), []);
  const [mode, setMode] = useState('activities');
  const [listMode, setListMode] = useState('mine');
  const [recordKind, setRecordKind] = useState('record');
  const [queryDate, setQueryDate] = useState(() => formatDate(new Date()));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activities, setActivities] = useState([]);
  const [records, setRecords] = useState([]);
  const [recordHasMore, setRecordHasMore] = useState(false);
  const recordPageRef = useRef(1);
  const recordsRef = useRef([]);
  const [summary, setSummary] = useState({ joinNum: 0, validNum: 0 });
  const [pending, setPending] = useState([]);
  const [signTask, setSignTask] = useState(null);
  const [message, setMessage] = useState('');
  const [pendingKey, setPendingKey] = useState('');

  const selectedDate = clampQueryDate(queryDate, dateOptions);

  const loadActivities = useCallback(async ({ keepMessage = false } = {}) => {
    if (!session.studentId || !session.schoolId) return;
    if (!keepMessage) setMessage('');
    try {
      const activities = [];
      let listError = '';
      for (let pageNo = 1; pageNo <= 5; pageNo += 1) {
        const listRes = await api.queryClubInfo({
          pageNo,
          pageSize: 15,
          queryTime: selectedDate,
          schoolId: session.schoolId,
          studentId: session.studentId,
        });
        const listData = listRes?.data;
        if (!isApiSuccess(listData)) {
          if (pageNo === 1) listError = listData?.msg || listData?.message || '加载活动列表失败';
          break;
        }
        const page = extractList(listData.response);
        activities.push(...page);
        const paged = extractPagedList(listData.response);
        if (page.length < 15 || (paged.hasTotal && activities.length >= paged.total)) break;
      }

      const [pendingRes, signRes] = await Promise.all([
        api.queryMyPendingClub(session.studentId, 1, 15).catch(() => null),
        api.queryClubSignStatus(session.studentId).catch(() => null),
      ]);

      if (listError) setMessage(listError);
      setActivities(activities);

      const pendingData = pendingRes?.data;
      const nextPending = isApiSuccess(pendingData) ? extractList(pendingData.response) : [];
      setPending(nextPending);
      const signData = signRes?.data;
      setSignTask(
        resolveOperableSignTask({
          statusPayload: isApiSuccess(signData) ? signData.response : null,
          activities,
          pending: nextPending,
        }),
      );
    } catch (error) {
      setMessage(error?.response?.data?.msg || '加载活动列表异常');
    }
  }, [selectedDate, session.schoolId, session.studentId]);

  const loadSummary = useCallback(async () => {
    if (!session.studentId) return;
    try {
      const response = await api.countValidSignUp(session.studentId);
      const data = response?.data;
      if (!isApiSuccess(data)) {
        setSummary({ joinNum: 0, validNum: 0 });
        return;
      }
      const list = extractList(data.response);
      const first = list[0] || (data.response && typeof data.response === 'object' ? data.response : {});
      setSummary({
        joinNum: Number(first.joinNum || 0),
        validNum: Number(first.validNum || 0),
      });
    } catch {
      setSummary({ joinNum: 0, validNum: 0 });
    }
  }, [session.studentId]);

  const loadRecords = useCallback(
    async (kind, append = false) => {
      if (!session.studentId) return;
      setMessage('');
      try {
        if (kind === 'semester') {
          const response = await api.queryMyClubTask();
          const data = response?.data;
          if (!isApiSuccess(data)) {
            setRecords([]);
            setRecordHasMore(false);
            setMessage(data?.msg || data?.message || '加载学期记录失败');
            return;
          }
          const nextRecords = extractList(data.response);
          recordsRef.current = nextRecords;
          recordPageRef.current = 1;
          setRecords(nextRecords);
          setRecordHasMore(false);
          return;
        }

        const targetPage = append ? recordPageRef.current + 1 : 1;
        const response = await api.queryMyClubRecord(session.studentId, targetPage, HISTORY_PAGE_SIZE);
        const data = response?.data;
        if (!isApiSuccess(data)) {
          if (!append) {
            recordsRef.current = [];
            setRecords([]);
            recordPageRef.current = 1;
            setRecordHasMore(false);
          }
          setMessage(data?.msg || data?.message || '加载签到记录失败');
          return;
        }
        const paged = extractPagedList(data.response);
        const nextList = append ? [...recordsRef.current, ...paged.list] : paged.list;
        recordsRef.current = nextList;
        recordPageRef.current = targetPage;
        setRecords(nextList);
        setRecordHasMore(
          paged.hasTotal ? nextList.length < paged.total && paged.list.length > 0 : paged.list.length >= HISTORY_PAGE_SIZE,
        );
      } catch (error) {
        setMessage(error?.response?.data?.msg || '加载记录异常');
      }
    },
    [session.studentId],
  );

  useFocusEffect(
    useCallback(() => {
      if (mode === 'activities') {
        loadActivities();
        return;
      }
      loadSummary();
      loadRecords(recordKind, false);
    }, [loadActivities, loadRecords, loadSummary, mode, recordKind]),
  );

  const changeDate = (value) => {
    const next = clampQueryDate(value, dateOptions);
    setQueryDate(next);
    setPickerOpen(false);
  };

  const onClubAction = async (item) => {
    const activityId = resolveActivityId(item);
    const action = resolveClubAction(item);
    if (!activityId || action.disabled || !session.studentId) return;
    const key = `${activityId}-${action.type}`;
    setPendingKey(key);
    try {
      const response =
        action.type === 1
          ? await api.joinClub(activityId, session.studentId)
          : await api.cancelClub(activityId, session.studentId);
      const data = response?.data;
      if (!isApiSuccess(data)) {
        setMessage(data?.msg || data?.message || '俱乐部操作失败');
        return;
      }
      setMessage(responseMessage(data, action.type === 1 ? '报名成功' : '取消报名成功'));
      await loadActivities({ keepMessage: true });
    } catch (error) {
      setMessage(error?.response?.data?.msg || '俱乐部操作异常');
    } finally {
      setPendingKey('');
    }
  };

  const onSign = async () => {
    const phase = resolveSignTaskPhase(signTask, activities);
    const action = signActionForPhase(phase);
    if (!signTask || !action) return;
    if (!signTask.latitude || !signTask.longitude) {
      setMessage('签到坐标缺失，暂无法执行操作');
      return;
    }
    setPendingKey(`sign-${action.signType}`);
    try {
      const response = await api.signInOrSignBack({
        activityId: signTask.activityId,
        latitude: signTask.latitude,
        longitude: signTask.longitude,
        signType: action.signType,
        studentId: session.studentId,
      });
      const data = response?.data;
      if (!isApiSuccess(data)) {
        setMessage(data?.msg || data?.message || `${action.label}失败`);
        return;
      }
      setMessage(responseMessage(data, `${action.label}成功`));
      await loadActivities({ keepMessage: true });
    } catch (error) {
      setMessage(error?.response?.data?.msg || '签到/签退操作异常');
    } finally {
      setPendingKey('');
    }
  };

  const phase = resolveSignTaskPhase(signTask, activities);
  const signAction = signTask ? signActionForPhase(phase) : null;
  const rows = listMode === 'mine' ? pending : activities;
  const atFirstDate = selectedDate === dateOptions[0]?.value;
  const atLastDate = selectedDate === dateOptions[dateOptions.length - 1]?.value;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>俱乐部</Text>
        <Segment
          options={[
            { value: 'activities', label: '活动' },
            { value: 'records', label: '记录' },
          ]}
          value={mode}
          onChange={(next) => {
            setMode(next);
            if (next === 'records') setPickerOpen(false);
          }}
        />

        {mode === 'activities' ? (
          <Segment
            options={[
              { value: 'list', label: '活动列表' },
              { value: 'mine', label: '我的任务' },
            ]}
            value={listMode}
            onChange={setListMode}
          />
        ) : null}

        {mode === 'activities' && listMode === 'list' ? (
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => changeDate(shiftDate(selectedDate, -1))}
              disabled={atFirstDate}
              style={styles.dateStep}>
              <Text style={[styles.dateStepText, atFirstDate && styles.dateStepOff]}>前一天</Text>
            </Pressable>
            <Pressable onPress={() => setPickerOpen((open) => !open)} style={styles.dateCurrent}>
              <Text style={styles.dateLabel}>{weekdayLabel(selectedDate)}</Text>
              <Text style={styles.dateValue}>{selectedDate}</Text>
            </Pressable>
            <Pressable
              onPress={() => changeDate(shiftDate(selectedDate, 1))}
              disabled={atLastDate}
              style={styles.dateStep}>
              <Text style={[styles.dateStepText, atLastDate && styles.dateStepOff]}>后一天</Text>
            </Pressable>
          </View>
        ) : null}

        {mode === 'records' ? (
          <Segment
            options={[
              { value: 'record', label: '签到记录' },
              { value: 'semester', label: '学期记录' },
            ]}
            value={recordKind}
            onChange={setRecordKind}
          />
        ) : null}

        {pickerOpen ? (
          <ScrollView style={styles.picker} nestedScrollEnabled>
            {dateOptions.map((day) => {
              const selected = day.value === selectedDate;
              return (
                <Pressable key={day.value} onPress={() => changeDate(day.value)} style={styles.pickerRow}>
                  <View style={[styles.dot, selected && styles.dotOn]} />
                  <Text style={selected ? styles.pickerOn : styles.pickerOff}>{day.label}</Text>
                  <Text style={styles.pickerDate}>{day.value}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {mode === 'records' ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summary}>累计报名 {summary.joinNum}</Text>
            <Text style={styles.summary}>有效签到 {summary.validNum}</Text>
          </View>
        ) : null}

        <Notice tone={message.includes('成功') ? 'muted' : 'danger'}>{message}</Notice>

        {mode === 'activities' && rows.length === 0 && !message ? (
          <Notice>{listMode === 'mine' ? '还没有报名' : '这一天没有活动'}</Notice>
        ) : null}
        {mode === 'records' && records.length === 0 && !message ? <Notice>还没有记录</Notice> : null}

        {mode === 'activities'
          ? rows.map((item, index) => {
              const activityId = resolveActivityId(item);
              const action = resolveClubAction(item);
              const registered = listMode === 'mine' || isRegisteredActivity(item);
              const signLabels = registered ? activitySignLabels(item) : null;
              const isThisTask = matchesSignTask(signTask, item);
              const key = `${activityDateText(item)}-${item.startTime || ''}-${activityId || index}`;
              const when = [activityDateText(item), `${item.startTime || '--:--'} - ${item.endTime || '--:--'}`]
                .filter(Boolean)
                .join(' ');
              const badge = listMode === 'mine' ? myTaskStatusLabel(item) : registrationStatusLabel(item);
              return (
                <View key={key} style={styles.card}>
                  <View style={styles.cardHead}>
                    <Text style={styles.cardTitle}>{item.activityName || `活动 #${activityId || index + 1}`}</Text>
                    <Chip label={badge} tone={toneForStatus(badge)} />
                  </View>
                  {listMode === 'mine' ? (
                    <Text style={styles.statusLine}>报名 {registrationStatusLabel(item)}</Text>
                  ) : null}
                  {signLabels ? (
                    <Text style={styles.statusLine}>
                      签到 {signLabels.signIn} · 签退 {signLabels.signOut}
                    </Text>
                  ) : null}
                  <Text style={styles.cardMeta}>{when}</Text>
                  <Text style={styles.cardMeta}>{item.addressDetail || item.address || '地点待定'}</Text>
                  {isThisTask && signAction ? (
                    <ActionButton
                      label={pendingKey === `sign-${signAction.signType}` ? `${signAction.label}中` : signAction.label}
                      onPress={onSign}
                      disabled={pendingKey.startsWith('sign-')}
                    />
                  ) : null}
                  {!action.disabled ? (
                    <ActionButton
                      label={
                        pendingKey === `${activityId}-${action.type}` ? `${action.label}中` : action.label
                      }
                      onPress={() => onClubAction(item)}
                      disabled={pendingKey === `${activityId}-${action.type}`}
                      tone={action.type === 2 ? 'ghost' : 'blue'}
                    />
                  ) : action.label !== badge ? (
                    <Text style={styles.cardMeta}>{action.label}</Text>
                  ) : null}
                </View>
              );
            })
          : records.map((item, index) => {
              const activityId = resolveActivityId(item);
              return (
                <View key={`${item.yymmdd || ''}-${item.startTime || ''}-${activityId || index}`} style={styles.card}>
                  <Text style={styles.cardTitle}>{item.activityName || item.itemName || `记录 #${index + 1}`}</Text>
                  <Text style={styles.statusLine}>
                    签到 {signInStatusLabel(item)} · 签退 {signOutStatusLabel(item)}
                  </Text>
                  <Text style={styles.cardMeta}>{formatHistoryWhen(item)}</Text>
                </View>
              );
            })}

        {mode === 'records' && recordKind === 'record' && recordHasMore ? (
          <ActionButton label="加载更多" onPress={() => loadRecords('record', true)} tone="ghost" />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 12,
  },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: '700',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dateStep: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  dateStepText: {
    color: colors.blue,
    fontSize: 14,
  },
  dateStepOff: {
    color: colors.line,
  },
  dateCurrent: {
    alignItems: 'center',
    gap: 2,
  },
  dateLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  dateValue: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '600',
  },
  statusLine: {
    color: colors.muted,
    fontSize: 13,
  },
  picker: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    maxHeight: 280,
    paddingHorizontal: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.line,
  },
  dotOn: {
    backgroundColor: colors.blue,
  },
  pickerOn: {
    color: colors.ink,
    fontSize: 15,
    width: 42,
  },
  pickerOff: {
    color: colors.muted,
    fontSize: 15,
    width: 42,
  },
  pickerDate: {
    color: colors.muted,
    fontSize: 13,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summary: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  card: {
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  cardMeta: {
    color: colors.muted,
    fontSize: 13,
  },
});
