import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

function RunIcon({ color }) {
  return (
    <View style={styles.icon}>
      <View style={[styles.track, { borderColor: color }]}>
        <View style={[styles.lane, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function ClubIcon({ color }) {
  return (
    <View style={styles.icon}>
      <View style={[styles.card, { borderColor: color }]}>
        <View style={[styles.cardLine, { backgroundColor: color }]} />
        <View style={[styles.cardLineShort, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function MeIcon({ color }) {
  return (
    <View style={styles.icon}>
      <View style={[styles.head, { backgroundColor: color }]} />
      <View style={[styles.shoulders, { backgroundColor: color }]} />
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: '校园跑',
          tabBarIcon: ({ color }) => <RunIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="club"
        options={{
          title: '俱乐部',
          tabBarIcon: ({ color }) => <ClubIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: '我的',
          tabBarIcon: ({ color }) => <MeIcon color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    width: 20,
    height: 12,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lane: {
    width: 8,
    height: 2,
    borderRadius: 1,
  },
  card: {
    width: 16,
    height: 18,
    borderWidth: 2,
    borderRadius: 3,
    paddingTop: 3,
    paddingHorizontal: 2,
    gap: 3,
  },
  cardLine: {
    height: 2,
    borderRadius: 1,
  },
  cardLineShort: {
    height: 2,
    width: 8,
    borderRadius: 1,
  },
  head: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  shoulders: {
    width: 16,
    height: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
});
