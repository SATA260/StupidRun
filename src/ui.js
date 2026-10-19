import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { colors } from './theme';

export function Screen({ children, style }) {
  return (
    <SafeAreaView style={[styles.screen, style]}>
      <StatusBar style="dark" />
      {children}
    </SafeAreaView>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  inputMode,
  blurOnSubmit = false,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        inputMode={inputMode}
        blurOnSubmit={blurOnSubmit}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        importantForAutofill="no"
        style={styles.input}
      />
    </View>
  );
}

export function ActionButton({ label, onPress, disabled, tone = 'blue' }) {
  const ghost = tone === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, ghost ? styles.buttonGhost : styles.buttonBlue, disabled && styles.buttonDisabled]}>
      <Text style={[styles.buttonText, ghost && styles.buttonTextGhost]}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children, tone = 'muted' }) {
  if (!children) return null;
  const danger = tone === 'danger';
  return (
    <View style={[styles.notice, danger ? styles.noticeDanger : styles.noticeMuted]}>
      <Text style={[styles.noticeText, danger && styles.noticeTextDanger]}>{children}</Text>
    </View>
  );
}

export function Segment({ options, value, onChange }) {
  return (
    <View style={styles.segment}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segmentItem, selected && styles.segmentItemOn]}>
            <Text style={[styles.segmentText, selected && styles.segmentTextOn]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function toneForStatus(label) {
  if (label === '可报名' || label === '进行中') return 'blue';
  if (label === '已报名' || label === '已完成' || label === '已签到' || label === '已签退') return 'soft';
  if (label === '人数已满' || label === '无法报名' || label === '已报名其他活动') return 'danger';
  return 'muted';
}

export function Chip({ label, tone = 'muted' }) {
  return (
    <View style={[styles.chip, chipTone[tone] || chipTone.muted]}>
      <Text style={[styles.chipText, chipTextTone[tone] || chipTextTone.muted]}>{label}</Text>
    </View>
  );
}

const chipTone = {
  blue: { backgroundColor: colors.blueSoft },
  soft: { backgroundColor: colors.blueSoft },
  danger: { backgroundColor: colors.dangerSoft },
  muted: { backgroundColor: colors.background },
};

const chipTextTone = {
  blue: { color: colors.blue },
  soft: { color: colors.blue },
  danger: { color: colors.danger },
  muted: { color: colors.muted },
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  field: {
    gap: 8,
  },
  label: {
    color: colors.muted,
    fontSize: 13,
  },
  input: {
    color: colors.ink,
    fontSize: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  button: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  buttonBlue: {
    backgroundColor: colors.blue,
  },
  buttonGhost: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextGhost: {
    color: colors.ink,
  },
  notice: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noticeMuted: {
    backgroundColor: colors.surface,
  },
  noticeDanger: {
    backgroundColor: colors.dangerSoft,
  },
  noticeText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  noticeTextDanger: {
    color: colors.danger,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  segmentItemOn: {
    backgroundColor: colors.blueSoft,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 14,
  },
  segmentTextOn: {
    color: colors.blue,
    fontWeight: '600',
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
  },
});
