import { createContext, useContext, useEffect, useState } from 'react';

import { getSnapshot, hydrate, subscribe } from './store';

const SessionContext = createContext({ ...getSnapshot(), ready: false });

export function SessionProvider({ children }) {
  const [session, setSession] = useState(getSnapshot());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe(setSession);
    hydrate().finally(() => setReady(true));
    return unsubscribe;
  }, []);

  return (
    <SessionContext.Provider value={{ ...session, ready }}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
