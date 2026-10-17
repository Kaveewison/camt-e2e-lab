import { expect, test } from '@playwright/test';
import { ElectionApi, type BallotCandidate } from './support/electionApi';

// S3: a registered voter picks a candidate — the ballot then marks it as selected.
// Test data owned by this test case only (never reuse another spec's nationalId).
test('a voter votes for number 1 and sees it selected on the ballot', async ({ request }) => {
  const api = new ElectionApi(request);

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
    const registerRes = await api.register(voter);
    expect(registerRes.status(), await registerRes.text()).toBe(201);
    return api.login(voter);
  });

  // 2nd step: read the ballot — the API needs the candidate id, not the ballot number
  const number1 = await test.step('voter looks at the ballot before voting', async () => {
    const res = await api.myCandidates(token);
    expect(res.status(), await res.text()).toBe(200);
    const ballot = (await res.json()) as BallotCandidate[];
    expect(ballot.every((c) => c.selected === false)).toBe(true); // nothing selected yet
    return ballot.find((c) => c.number === 1)!;
  });

  // 3rd step: cast the vote
  await test.step('voter votes for number 1', async () => {
    const res = await api.vote(token, number1.id);
    expect(res.status(), await res.text()).toBe(201);
    expect(await res.json()).toEqual({
      candidateId: number1.id,
      changed: false, // first vote is not a change
      votedAt: expect.any(String),
    });
  });

  // 4th step: the ballot now shows the vote — and only on number 1
  await test.step('number 1 is selected on the updated ballot', async () => {
    const res = await api.myCandidates(token);
    expect(res.status(), await res.text()).toBe(200);
    expect(await res.json()).toEqual([
      { id: number1.id, number: 1, name: 'อนันต์ ศรีสุข', party: 'พรรคดอยสุเทพ', selected: true },
      { id: expect.any(Number), number: 2, name: 'มาลี วงศ์คำ', party: 'พรรคแม่ปิง', selected: false },
    ]);
  });
});
