import { getSecureItem, setSecureItem } from './webStorage';

const GITHUB_API = 'https://api.github.com';
const FILE_PATH = 'data.json';

interface SyncData {
  sessions: any[];
  programs: any[];
  weeklyPlan: any;
  goals: any[];
  settings: any;
  lastModified: number;
}

async function getToken(): Promise<string | null> {
  return getSecureItem('github_token');
}

async function getRepo(): Promise<string | null> {
  return getSecureItem('github_repo');
}

export async function saveToken(token: string): Promise<void> {
  await setSecureItem('github_token', token);
}

export async function saveRepo(repo: string): Promise<void> {
  await setSecureItem('github_repo', repo);
}

async function githubFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  if (!token) throw new Error('No GitHub token');

  return fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function pullData(): Promise<SyncData | null> {
  const repo = await getRepo();
  if (!repo) return null;

  try {
    const res = await githubFetch(`/repos/${repo}/contents/${FILE_PATH}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

    const data = await res.json();
    const content = atob(data.content);
    return JSON.parse(content);
  } catch (e) {
    console.error('Pull failed:', e);
    return null;
  }
}

export async function pushData(data: SyncData): Promise<boolean> {
  const repo = await getRepo();
  if (!repo) return false;
  const token = await getToken();
  if (!token) return false;

  try {
    let sha: string | undefined;
    const getRes = await githubFetch(`/repos/${repo}/contents/${FILE_PATH}`);
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    const content = btoa(JSON.stringify(data, null, 2));
    const body: any = {
      message: `Iron Week Pro sync - ${new Date().toISOString()}`,
      content,
    };
    if (sha) body.sha = sha;

    const res = await githubFetch(`/repos/${repo}/contents/${FILE_PATH}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    return res.ok;
  } catch (e) {
    console.error('Push failed:', e);
    return false;
  }
}

export async function isConfigured(): Promise<boolean> {
  const token = await getToken();
  const repo = await getRepo();
  return !!(token && repo);
}

export async function testConnection(): Promise<boolean> {
  try {
    const repo = await getRepo();
    if (!repo) return false;
    const res = await githubFetch(`/repos/${repo}`);
    return res.ok;
  } catch {
    return false;
  }
}
