import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { login } from '@/session/store';
import { colors } from '@/theme';
import { ActionButton, Field, Notice, Screen } from '@/ui';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async () => {
    if (!phone.trim() || !password) {
      setMessage('请输入手机号和密码');
      return;
    }
    setPending(true);
    setMessage('');
    try {
      const result = await login(phone, password);
      if (!result.ok) setMessage(result.message || '登录失败');
    } catch (error) {
      setMessage(error?.response?.data?.msg || '登录失败');
    } finally {
      setPending(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>校园跑</Text>
          <Text style={styles.title}>StupidRun</Text>
          <View style={styles.lane} />
        </View>
        <View style={styles.form}>
          <Field
            label="手机号"
            value={phone}
            onChangeText={setPhone}
            keyboardType="visible-password"
          />
          <Field label="密码" value={password} onChangeText={setPassword} secureTextEntry />
          <Notice tone="danger">{message}</Notice>
          <ActionButton label={pending ? '登录中' : '登录'} onPress={onSubmit} disabled={pending} />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    justifyContent: 'flex-start',
    gap: 28,
  },
  hero: {
    gap: 8,
  },
  kicker: {
    color: colors.blue,
    fontSize: 13,
    letterSpacing: 2,
  },
  title: {
    color: colors.ink,
    fontSize: 36,
    fontWeight: '700',
  },
  lane: {
    height: 4,
    width: 72,
    backgroundColor: colors.blue,
    marginTop: 8,
    borderRadius: 2,
  },
  form: {
    gap: 18,
  },
});
