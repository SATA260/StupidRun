export function mergeLoginUser(previous, incoming) {
  if (!incoming || typeof incoming !== 'object') return previous || null;
  const previousToken = previous?.oauthToken?.token || '';
  const incomingToken = incoming?.oauthToken?.token || '';
  if (!incomingToken && previousToken) {
    return {
      ...incoming,
      oauthToken: { ...(incoming.oauthToken || {}), token: previousToken },
    };
  }
  return incoming;
}
