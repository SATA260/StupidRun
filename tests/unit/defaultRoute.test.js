import { pickDefaultRoute } from '../../src/domain/defaultRoute';

const options = [
  { id: 'cuit_hkg', name: '航空港' },
  { id: 'cuit_lqy', name: '龙泉' },
];

test('选过的路线会一直作为默认路线', () => {
  expect(pickDefaultRoute(options, 'cuit_lqy')).toBe('cuit_lqy');
});

test('没有保存过路线时用列表第一条', () => {
  expect(pickDefaultRoute(options, '')).toBe('cuit_hkg');
  expect(pickDefaultRoute(options, 'missing')).toBe('cuit_hkg');
  expect(pickDefaultRoute([], 'cuit_lqy')).toBe('');
});
