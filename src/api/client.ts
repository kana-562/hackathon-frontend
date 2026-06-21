import type {
  HomeData,
  HobbyCategory,
  StarterSetCard,
  StarterSetDetail,
  SearchResponse,
  DraftDetail,
  TransactionDetail,
  MyPageData,
  User,
  DMRoom,
  DMMessage,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'エラーが発生しました' }));
    throw new Error((err as { message?: string }).message || 'エラーが発生しました');
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  signup: (data: { displayName: string; email: string; password: string }) =>
    request<{ token: string; user: User }>('POST', '/api/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>('POST', '/api/auth/login', data),
  getMe: () => request<User>('GET', '/api/me'),

  // Home
  getHome: () => request<HomeData>('GET', '/api/home'),
  getCategories: () => request<HobbyCategory[]>('GET', '/api/categories'),

  // Sets
  getSets: (params: Record<string, string | number | boolean>) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    });
    return request<SearchResponse>('GET', `/api/sets?${qs}`);
  },
  getCategorySets: (categoryId: number) =>
    request<SearchResponse>('GET', `/api/categories/${categoryId}/sets`),
  getSetDetail: (id: number) =>
    request<StarterSetDetail>('GET', `/api/sets/${id}`),
  addFavorite: (id: number) =>
    request<void>('POST', `/api/sets/${id}/favorite`),
  removeFavorite: (id: number) =>
    request<void>('DELETE', `/api/sets/${id}/favorite`),
  askQuestion: (id: number, message: string) =>
    request<{ message: string }>('POST', `/api/sets/${id}/questions`, { message }),

  // Sell
  createDraft: (hobbyText: string) =>
    request<{
      draftSetId: number;
      sessionId: number;
      message: string;
      suggestedChips: string[];
      progress: { current: number; total: number };
    }>('POST', '/api/sell/drafts', { hobbyText }),
  sendSellMessage: (draftId: number, message: string) =>
    request<{
      message: string;
      suggestedChips?: string[];
      progress: { current: number; total: number };
      done: boolean;
    }>('POST', `/api/sell/drafts/${draftId}/messages`, { message }),
  getDraft: (draftId: number) =>
    request<DraftDetail>('GET', `/api/sell/drafts/${draftId}`),
  updateDraft: (draftId: number, data: Partial<DraftDetail>) =>
    request<DraftDetail>('PUT', `/api/sell/drafts/${draftId}`, data),
  publishDraft: (draftId: number) =>
    request<{ id: number; status: string }>('POST', `/api/sell/drafts/${draftId}/publish`),

  // Transactions
  createTransaction: (starterSetId: number) =>
    request<{ transactionId: number; status: string }>('POST', '/api/transactions', { starterSetId }),
  getTransaction: (id: number) =>
    request<TransactionDetail>('GET', `/api/transactions/${id}`),
  getStartPlan: (txId: number) =>
    request<{ id: number; title: string; steps: { dayNo: number; title: string; body: string }[] }>(
      'POST',
      `/api/transactions/${txId}/start-plan`
    ),

  // MyPage
  getMyPage: () => request<MyPageData>('GET', '/api/mypage'),
  getMySelling: () =>
    request<{ sets: StarterSetCard[] }>('GET', '/api/mypage/selling').then((r) => r.sets ?? []),
  getMyPurchases: () =>
    request<{ transactions: TransactionDetail[] }>('GET', '/api/mypage/purchases').then((r) => r.transactions ?? []),
  getMyFavorites: () =>
    request<{ sets: StarterSetCard[] }>('GET', '/api/mypage/favorites').then((r) => r.sets ?? []),

  // DM
  getOrCreateDMRoom: (partnerId: number, setId?: number) =>
    request<{ roomId: number }>('POST', '/api/dm/rooms', { partnerId, setId }),
  getDMRooms: () => request<DMRoom[]>('GET', '/api/dm/rooms'),
  getDMMessages: (roomId: number) =>
    request<DMMessage[]>('GET', `/api/dm/rooms/${roomId}/messages`),
  sendDMMessage: (roomId: number, body: string) =>
    request<DMMessage>('POST', `/api/dm/rooms/${roomId}/messages`, { body }),
  markDMRead: (roomId: number) =>
    request<{ ok: boolean }>('PATCH', `/api/dm/rooms/${roomId}/read`),
};

export function saveAuth(token: string, user: User) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser(): User | null {
  const s = localStorage.getItem('user');
  return s ? (JSON.parse(s) as User) : null;
}
