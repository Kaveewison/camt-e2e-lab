import { expect, test } from '@playwright/test';

test('a voter registers and then sees the candidates of their district', async ({ request }) => {
  // Test data owned by this test case only. nationalId came from `node tools/randomThaiNationalId.mjs`.
  const voter = {
    nationalId: '9823527330875',
    password: 'voter1234',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    address: '239 ถนนห้วยแก้ว',
    districtId: 'CM-2',
  };

  // 1st step: voter goes to register
  const registerRes = await test.step('voter registers', () =>
    request.post('/auth/register', { data: voter }),
  );

  // 2nd step: assert the response
  await test.step('registration succeeds as a VOTER', async () => {
    expect(registerRes.status(), await registerRes.text()).toBe(201);
    const user = await registerRes.json();
    expect(user).toEqual({
      id: expect.any(Number),
      nationalId: voter.nationalId,
      firstName: voter.firstName,
      lastName: voter.lastName,
      address: voter.address,
      districtId: voter.districtId,
      role: 'VOTER',
    });
    expect(user).not.toHaveProperty('passwordHash');
  });

  // 3rd step: voter logs in
  const token = await test.step('voter logs in', async () => {
    const loginRes = await request.post('/auth/login', {
      data: { nationalId: voter.nationalId, password: voter.password },
    });
    expect(loginRes.status(), await loginRes.text()).toBe(200);
    const { token } = await loginRes.json();
    expect(token).toEqual(expect.any(String));
    return token;
  });

  // 4th step: voter requests the candidates from the election API
  const candidatesRes = await test.step('voter requests their candidates', () =>
    request.get('/me/candidates', { headers: { Authorization: `Bearer ${token}` } }),
  );

  // 5th step: assert the candidates (the ones from 902-e2e-exercise-seed.sql)
  await test.step('voter sees the CM-2 candidates', async () => {
    expect(candidatesRes.status(), await candidatesRes.text()).toBe(200);
    expect(await candidatesRes.json()).toEqual([
      { id: expect.any(Number), number: 1, name: 'อนันต์ ศรีสุข', party: 'พรรคดอยสุเทพ', selected: false },
      { id: expect.any(Number), number: 2, name: 'มาลี วงศ์คำ', party: 'พรรคแม่ปิง', selected: false },
    ]);
  });
});
