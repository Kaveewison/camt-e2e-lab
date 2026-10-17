// Talks to the running app over HTTP only — the e2e tests' view of the system.
//
// Compare with the reference that ships with the app: app/e2e/support/electionApi.ts
// (same idea; it also wraps commissioner flows and generates its own test data).
import { APIRequestContext, APIResponse, expect } from '@playwright/test';

export type Credentials = {
  nationalId: string;
  password: string;
};

export type Voter = Credentials & {
  firstName: string;
  lastName: string;
  address: string;
  districtId: string;
};

export type BallotCandidate = {
  id: number;
  number: number;
  name: string;
  party: string;
  selected: boolean;
};

export class ElectionApi {
  constructor(private readonly request: APIRequestContext) {}

  // Setup verb: no test can go on without a token, so login asserts its own success.
  async login(credentials: Credentials): Promise<string> {
    const res = await this.request.post('/auth/login', { data: credentials });
    expect(res.status(), await res.text()).toBe(200);
    return (await res.json()).token;
  }

  // Subject of S1 — returns the raw response; the test owns the assertions.
  async register(voter: Voter): Promise<APIResponse> {
    return this.request.post('/auth/register', { data: voter });
  }

  async myCandidates(token: string): Promise<APIResponse> {
    return this.request.get('/me/candidates', { headers: auth(token) });
  }

  async vote(token: string, candidateId: number): Promise<APIResponse> {
    return this.request.put('/me/vote', { headers: auth(token), data: { candidateId } });
  }
}

function auth(token: string) {
  return { Authorization: `Bearer ${token}` };
}
