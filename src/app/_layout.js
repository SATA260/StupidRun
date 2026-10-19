import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { SessionProvider, useSession } from '@/session/SessionProvider';

function RouterGate() {
  const { ready, token } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const onLogin = segments[0] === 'login';
    if (!token && !onLogin) router.replace('/login');
    if (token && onLogin) router.replace('/');
  }, [ready, token, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <RouterGate />
    </SessionProvider>
  );
}
