import { Image, StyleSheet, Text, View } from 'react-native';

import { useSession } from '@/session/SessionProvider';
import { logout } from '@/session/store';
import { colors } from '@/theme';
import { ActionButton, Screen } from '@/ui';

export default function MeScreen() {
  const session = useSession();
  const user = session.userInfo || {};
  const name = user.studentName || '已登录';
  const rows = [
    ['手机', user.userPhone || user.registerCode || '--'],
    ['学号', user.studentId || '--'],
    ['学校', user.schoolId || '--'],
  ];

  return (
    <Screen>
      <View style={styles.page}>
        <View style={styles.content}>
          <Text style={styles.kicker}>账号</Text>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.card}>
            {rows.map(([label, value], index) => (
              <View key={label} style={[styles.row, index === rows.length - 1 && styles.rowLast]}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}
          </View>
          <ActionButton label="退出登录" onPress={logout} tone="ghost" />
        </View>
        <Text style={styles.blessing}>鲸鱼神将赐予你力量。</Text>
        <View pointerEvents="none" style={styles.figure}>
          <Image source={require('../../../assets/images/whale-god.png')} style={styles.backdrop} resizeMode="contain" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  blessing: {
    marginTop: 20,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  figure: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 8,
  },
  backdrop: {
    width: '100%',
    height: '100%',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 16,
  },
  kicker: {
    color: colors.blue,
    fontSize: 13,
  },
  name: {
    color: colors.ink,
    fontSize: 32,
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  label: {
    color: colors.muted,
    fontSize: 15,
  },
  value: {
    color: colors.ink,
    fontSize: 15,
    flexShrink: 1,
  },
});
