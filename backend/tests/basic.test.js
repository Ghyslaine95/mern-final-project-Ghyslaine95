test('Basic Jest test', () => {
  expect(1 + 1).toBe(2);
});

test('Object assignment', () => {
  const data = { one: 1 };
  data['two'] = 2;
  expect(data).toEqual({ one: 1, two: 2 });
});