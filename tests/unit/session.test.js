import { mergeLoginUser } from '../../src/session/user';

test('刷新用户信息时保留当前登录 token', () => {
  const previous = { userId: 1, studentId: 2, oauthToken: { token: 'current-token' } };
  const incoming = { userId: 1, studentId: 2, studentName: '张三' };
  expect(mergeLoginUser(previous, incoming).oauthToken.token).toBe('current-token');
  expect(mergeLoginUser(previous, incoming).studentName).toBe('张三');
});

test('新登录返回的 token 覆盖旧 token', () => {
  const previous = { oauthToken: { token: 'old-token' } };
  const incoming = { userId: 9, oauthToken: { token: 'new-token' } };
  expect(mergeLoginUser(previous, incoming).oauthToken.token).toBe('new-token');
  expect(mergeLoginUser(null, incoming)).toEqual(incoming);
});
