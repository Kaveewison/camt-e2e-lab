import { expect, test } from '@playwright/test';

// S3: a registered voter picks a candidate — the ballot then marks it as selected.
// Test data owned by this test case only (never reuse another spec's nationalId).

type BallotCandidate = {
  id: number;
  number: number;
  name: string;
  party: string;
  selected: boolean;
};

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

test('a voter votes for number 1 and sees it selected on the ballot', async ({ request }) => {
  const voter = {
    nationalId: '9901575735658',
    password: 'voter1234',
    firstName: 'สมหญิง',
    lastName: 'ทดสอบ',
    address: '239 ถนนห้วยแก้ว',
    districtId: 'CM-2',
  };

  // 1st step: register and log in — setup for the journey, one step is enough
  const token = await test.step('voter registers and logs in', async () => {
    const registerRes = await request.post('/auth/register', { data: voter });
    expect(registerRes.status(), await registerRes.text()).toBe(201);

    const loginRes = await request.post('/auth/login', {
      data: { nationalId: voter.nationalId, password: voter.password },
    });
    expect(loginRes.status(), await loginRes.text()).toBe(200);
    return (await loginRes.json()).token as string;
  });

  // 2nd step: read the ballot — the API needs the candidate id, not the ballot number
  const number1 = await test.step('voter looks at the ballot before voting', async () => {
    const res = await request.get('/me/candidates', { headers: auth(token) });
    expect(res.status(), await res.text()).toBe(200);
    const ballot: BallotCandidate[] = await res.json();
    expect(ballot.every((c) => c.selected === false)).toBe(true); // nothing selected yet
    return ballot.find((c) => c.number === 1)!;
  });

  // 3rd step: cast the vote
  await test.step('voter votes for number 1', async () => {
    const res = await request.put('/me/vote', {
      headers: auth(token),
      data: { candidateId: number1.id },
    });
    expect(res.status(), await res.text()).toBe(201);
    expect(await res.json()).toEqual({
      candidateId: number1.id,
      changed: false, // first vote is not a change
      votedAt: expect.any(String),
    });
  });

  // 4th step: the ballot now shows the vote — and only on number 1
  await test.step('number 1 is selected on the updated ballot', async () => {
    const res = await request.get('/me/candidates', { headers: auth(token) });
    expect(res.status(), await res.text()).toBe(200);
    expect(await res.json()).toEqual([
      { id: number1.id, number: 1, name: 'อนันต์ ศรีสุข', party: 'พรรคดอยสุเทพ', selected: true },
      { id: expect.any(Number), number: 2, name: 'มาลี วงศ์คำ', party: 'พรรคแม่ปิง', selected: false },
    ]);
  });
});
