import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { api } from '@/api';
import {
  computeDurationFromDistance,
  formatPaceMinutesPerKm,
  normalizeRoundedRunTime,
  randomIntNonThousand,
  resolveRunBoundsFromStandard,
} from '@/domain/run';
import { buildSemesterStats } from '@/domain/semester';
import { submitRun } from '@/domain/submitRun';
import { getMapNames, loadMapFiles } from '@/domain/map';
import { useSession } from '@/session/SessionProvider';
import { refresh } from '@/session/store';
import { colors } from '@/theme';
import { ActionButton, Field, Notice, Screen, Segment } from '@/ui';

function submitMessage(result) {
  if (result.ok) return '已提交';
  if (result.msg === 'distance_invalid') return '距离需要是大于 0 的整数';
  if (result.msg === 'not_login') return '登录状态失效，请重新登录';
  if (result.msg === 'track_invalid') return '这条路线生成不出轨迹';
  return result.data?.msg || result.data?.message || result.error?.message || '提交失败';
}

export default function RunScreen() {
  const session = useSession();
  const stats = buildSemesterStats(
    session.userInfo,
    session.runInfo,
    session.runStandard,
    session.activityInfo,
  );
  const bounds = resolveRunBoundsFromStandard(session.userInfo || {}, session.runStandard || {});
  const [routes, setRoutes] = useState([]);
  const [route, setRoute] = useState('default');
  const [distance, setDistance] = useState('');
  const [runTime, setRunTime] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [records, setRecords] = useState([]);
  const [recordsMessage, setRecordsMessage] = useState('');
  const [pane, setPane] = useState('run');
  const [routesOpen, setRoutesOpen] = useState(false);

  const loadRecords = useCallback(async () => {
    try {
      const { data } = await api.getRunRecords(1, 15);
      if (Number(data?.code) !== 10000) {
        setRecords([]);
        setRecordsMessage(data?.msg || '获取跑步记录失败');
        return;
      }
      const recordsList = Array.isArray(data.response) ? data.response : data.response?.records || [];
      setRecords(recordsList);
      setRecordsMessage('');
    } catch (error) {
      setRecords([]);
      setRecordsMessage(error?.response?.data?.msg || '获取跑步记录失败');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecords();
    }, [loadRecords]),
  );

  useEffect(() => {
    let active = true;
    loadMapFiles().then(() => {
      if (!active) return;
      const names = getMapNames();
      const options = Object.entries(names).map(([id, name]) => ({ id, name }));
      setRoutes(options);
      if (options.length > 0) setRoute(options[0].id);
    });
    return () => {
      active = false;
    };
  }, []);

  const fillFromStandard = () => {
    const nextDistance = randomIntNonThousand(bounds.distanceMin, bounds.distanceMax);
    const duration = computeDurationFromDistance(nextDistance, {
      minMinutes: bounds.timeMin,
      maxMinutes: bounds.timeMax,
    });
    const nextTime = normalizeRoundedRunTime(duration, nextDistance, {
      minMinutes: bounds.timeMin,
      maxMinutes: bounds.timeMax,
    });
    setDistance(String(nextDistance));
    setRunTime(String(nextTime));
    setMessage('');
  };

  const onSubmit = async () => {
    setPending(true);
    setMessage('');
    try {
      const result = await submitRun(
        {
          distance: Number(distance),
          runTime: runTime.trim() ? Number(runTime) : undefined,
          route,
        },
        {
          userInfo: session.userInfo,
          runStandard: session.runStandard,
          api,
        },
      );
      setMessage(submitMessage(result));
      if (result.ok) {
        await refresh();
        await loadRecords();
      }
    } finally {
      setPending(false);
    }
  };

  const laneWidth = `${Math.max(0, Math.min(100, stats.distancePercentage))}%`;
  const selectedRoute = routes.find((item) => item.id === route);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brand}>
          <Image source={require('../../../assets/images/deepseek-whale.png')} style={styles.logo} />
          <Text style={styles.brandName}>stupid run</Text>
        </View>
        <Segment
          options={[
            { value: 'run', label: '跑步' },
            { value: 'records', label: '记录' },
          ]}
          value={pane}
          onChange={setPane}
        />

        {pane === 'run' ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.kicker}>
                {stats.semesterEndDateText ? `学期至 ${stats.semesterEndDateText}` : '本学期'}
              </Text>
              <Text style={styles.figure}>{stats.totalDistanceKm}</Text>
              <Text style={styles.unit}>公里 / {stats.targetDistanceKm}</Text>
              <View style={styles.track}>
                <View style={[styles.trackFill, { width: laneWidth }]} />
              </View>
              <Text style={styles.meta}>
                跑步 {stats.completedRuns}/{stats.totalRequiredRuns} 次 · 俱乐部 {stats.completedActivities}/
                {stats.totalActivities}
              </Text>
            </View>

            <View style={styles.form}>
              <Field
                label={`距离（米，${bounds.distanceMin}-${bounds.distanceMax}）`}
                value={distance}
                onChangeText={setDistance}
                keyboardType="number-pad"
              />
              <Field label="时间（分钟，可留空）" value={runTime} onChangeText={setRunTime} keyboardType="decimal-pad" />

              <Text style={styles.label}>路线</Text>
              <Pressable onPress={() => setRoutesOpen((open) => !open)} style={styles.routeToggle}>
                <Text style={styles.routeValue}>{selectedRoute?.name || '选择路线'}</Text>
                <Text style={styles.routeCaret}>{routesOpen ? '▴' : '▾'}</Text>
              </Pressable>
              {routesOpen ? (
                <ScrollView style={styles.routeMenu} nestedScrollEnabled>
                  {routes.map((item) => {
                    const selected = item.id === route;
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          setRoute(item.id);
                          setRoutesOpen(false);
                        }}
                        style={[styles.routeOption, selected && styles.routeOptionOn]}>
                        <Text style={[styles.routeOptionText, selected && styles.routeOptionTextOn]}>{item.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}

              <ActionButton label="按学期标准填一次" onPress={fillFromStandard} tone="ghost" />
              <ActionButton label={pending ? '提交中' : '提交跑步'} onPress={onSubmit} disabled={pending} />
              <Notice tone={message === '已提交' ? 'muted' : 'danger'}>{message}</Notice>
            </View>
          </>
        ) : (
          <View style={styles.records}>
            {records.length === 0 ? (
              <Notice tone={recordsMessage ? 'danger' : 'muted'}>{recordsMessage || '还没有跑步记录'}</Notice>
            ) : null}
            {records.map((item, index) => {
              const distance = Number(item.runDistance);
              const time = Number(item.runTime);
              const km = Number.isFinite(distance) ? (distance / 1000).toFixed(2) : '--';
              return (
                <View key={String(item.recordId || index)} style={styles.recordRow}>
                  <Text style={styles.km}>{km}</Text>
                  <View style={styles.recordBody}>
                    <Text style={styles.recordTime}>{item.createTime ? String(item.createTime).slice(0, 16) : ''}</Text>
                    <Text style={styles.pace}>
                      {time || '--'} 分钟 · {formatPaceMinutesPerKm(distance, time)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 72,
    height: 72,
  },
  brandName: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: '700',
  },
  hero: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  kicker: {
    color: colors.blue,
    fontSize: 13,
  },
  figure: {
    color: colors.ink,
    fontSize: 56,
    lineHeight: 62,
    fontWeight: '700',
  },
  unit: {
    color: colors.muted,
    fontSize: 15,
  },
  track: {
    height: 6,
    backgroundColor: colors.blueSoft,
    borderRadius: 3,
    marginTop: 10,
    overflow: 'hidden',
  },
  trackFill: {
    height: 6,
    backgroundColor: colors.blue,
    borderRadius: 3,
  },
  meta: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
  },
  form: {
    gap: 14,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
  },
  routeToggle: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  routeValue: {
    color: colors.ink,
    fontSize: 16,
    flex: 1,
  },
  routeCaret: {
    color: colors.blue,
    fontSize: 14,
  },
  routeMenu: {
    maxHeight: 240,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  routeOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  routeOptionOn: {
    backgroundColor: colors.blueSoft,
  },
  routeOptionText: {
    color: colors.ink,
    fontSize: 15,
  },
  routeOptionTextOn: {
    color: colors.blue,
    fontWeight: '600',
  },
  records: {
    gap: 10,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  km: {
    color: colors.blue,
    fontSize: 22,
    fontWeight: '700',
    width: 72,
  },
  recordBody: {
    flex: 1,
    gap: 4,
  },
  recordTime: {
    color: colors.ink,
    fontSize: 15,
  },
  pace: {
    color: colors.muted,
    fontSize: 13,
  },
});
