import type {
  HomeData,
  StarterSetCard,
  StarterSetDetail,
  HobbyCategory,
  SearchResponse,
  DraftDetail,
  TransactionDetail,
  MyPageData,
  DMRoom,
  DMMessage,
} from '../types';

export const MOCK_CATEGORIES: HobbyCategory[] = [
  { id: 1, name: '音楽', slug: 'music', description: 'ギター・ウクレレ・キーボードなど', iconName: 'music', sortOrder: 1 },
  { id: 2, name: '運動', slug: 'sports', description: '筋トレ・ヨガ・ランニングなど', iconName: 'sports', sortOrder: 2 },
  { id: 3, name: 'アウトドア', slug: 'outdoor', description: 'キャンプ・釣り・登山など', iconName: 'outdoor', sortOrder: 3 },
  { id: 4, name: 'クリエイティブ', slug: 'creative', description: 'カメラ・イラスト・動画制作など', iconName: 'creative', sortOrder: 4 },
  { id: 5, name: '料理・暮らし', slug: 'cooking', description: 'コーヒー・自炊・お菓子作りなど', iconName: 'cooking', sortOrder: 5 },
  { id: 6, name: '学び・スキル', slug: 'learning', description: '語学・資格・プログラミングなど', iconName: 'learning', sortOrder: 6 },
];

export const MOCK_SETS: StarterSetCard[] = [
  {
    id: 1,
    title: 'アコースティックギター 初心者完全セット',
    price: 12000,
    beginnerScore: 5,
    readinessScore: 95,
    imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600',
    hobbyName: 'ギター',
    categoryName: '音楽',
    status: 'on_sale',
    isFavorite: false,
  },
  {
    id: 2,
    title: '本格コーヒー ハンドドリップ入門セット',
    price: 8500,
    beginnerScore: 4,
    readinessScore: 90,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600',
    hobbyName: 'コーヒー',
    categoryName: '料理・暮らし',
    status: 'on_sale',
    isFavorite: true,
  },
  {
    id: 3,
    title: 'ソロキャンプ 道具一式 初心者向けセット',
    price: 18000,
    beginnerScore: 3,
    readinessScore: 75,
    imageUrl: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600',
    hobbyName: 'キャンプ',
    categoryName: 'アウトドア',
    status: 'on_sale',
    isFavorite: false,
  },
  {
    id: 4,
    title: 'イラスト入門セット（コピック＋スケッチブック）',
    price: 6000,
    beginnerScore: 5,
    readinessScore: 92,
    imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600',
    hobbyName: 'イラスト',
    categoryName: 'クリエイティブ',
    status: 'on_sale',
    isFavorite: false,
  },
  {
    id: 5,
    title: 'ヨガ はじめてセット（マット＋ブロック）',
    price: 4500,
    beginnerScore: 5,
    readinessScore: 88,
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
    hobbyName: 'ヨガ',
    categoryName: '運動',
    status: 'on_sale',
    isFavorite: false,
  },
  {
    id: 6,
    title: 'ミラーレスカメラ 入門セット',
    price: 35000,
    beginnerScore: 3,
    readinessScore: 80,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600',
    hobbyName: 'カメラ',
    categoryName: 'クリエイティブ',
    status: 'on_sale',
    isFavorite: false,
  },
];

export const MOCK_HOME: HomeData = {
  featuredSets: MOCK_SETS.filter(s => s.readinessScore >= 88),
  newSets: [...MOCK_SETS].reverse(),
  categories: MOCK_CATEGORIES,
};

export const MOCK_SET_DETAIL: StarterSetDetail = {
  id: 1,
  title: 'アコースティックギター 初心者完全セット',
  price: 12000,
  description: 'Fコードで挫折してしまいましたが、道具はとても良い状態です。初心者が最初に必要なものは全部揃っています。',
  status: 'on_sale',
  beginnerScore: 5,
  readinessScore: 95,
  valueScore: 4,
  estimatedNewPrice: 28000,
  previousOwnerNote: 'Fコードで止まってしまいましたが、道具はきれいな状態です。次の方にぜひ使ってほしいです。',
  startableSummary: 'このセットだけで今日からギターを始められます。チューナーと教本もついているので、ゼロから安心してスタートできます。',
  images: ['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600'],
  items: [
    { id: 1, name: 'アコースティックギター（Yamaha F315D）', conditionLabel: 'good', quantity: 1, isEssential: true, note: '小さな傷あり、演奏には問題なし' },
    { id: 2, name: 'クリップチューナー', conditionLabel: 'like_new', quantity: 1, isEssential: true, note: '' },
    { id: 3, name: 'ピック（3枚）', conditionLabel: 'new', quantity: 3, isEssential: true, note: '' },
    { id: 4, name: 'カポタスト', conditionLabel: 'like_new', quantity: 1, isEssential: false, note: '' },
    { id: 5, name: '初心者向け教本「はじめてのギター」', conditionLabel: 'good', quantity: 1, isEssential: true, note: '書き込みなし' },
  ],
  recommendedItems: [
    { id: 1, name: '替え弦', importance: 'recommended', reason: '弦は消耗品。1セット持っておくと安心です。' },
    { id: 2, name: 'ギタースタンド', importance: 'nice_to_have', reason: '立てかけておくと練習しやすくなります。' },
  ],
  seller: { id: 1, displayName: 'やまだ たろう', email: '', avatarUrl: '', ratingAverage: 4.8 },
  hobbyName: 'ギター',
  categoryName: '音楽',
  isFavorite: false,
};

export const MOCK_SEARCH: SearchResponse = {
  sets: MOCK_SETS,
  smartMessage: undefined,
  relatedChips: ['ギター', 'コーヒー', 'キャンプ', 'イラスト'],
};

export const MOCK_DRAFT: DraftDetail = {
  id: 1,
  title: 'ギターはじめてセット',
  description: '使わなくなったギター道具一式です。初心者の方にぴったりです。',
  price: 8000,
  categoryId: 1,
  hobbyId: 1,
  beginnerScore: 4,
  readinessScore: 80,
  startableSummary: 'このセットだけで今日からギターを始められます。',
  previousOwnerNote: 'Fコードで挫折しましたが、道具は綺麗です。',
  items: [
    { id: 1, name: 'ギター本体', conditionLabel: 'good', quantity: 1, isEssential: true, note: '' },
    { id: 2, name: 'チューナー', conditionLabel: 'like_new', quantity: 1, isEssential: true, note: '' },
    { id: 3, name: 'ピック', conditionLabel: 'new', quantity: 3, isEssential: true, note: '' },
  ],
  recommendedItems: [
    { id: 1, name: '替え弦', importance: 'recommended', reason: '消耗品なので持っておくと安心' },
  ],
  imageUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=600',
};

export const MOCK_TRANSACTION: TransactionDetail = {
  id: 1,
  status: 'reserved',
  price: 12000,
  starterSet: MOCK_SETS[0],
  startPlan: {
    id: 1,
    title: 'アコースティックギター 初心者完全セット で始める7日間プラン',
    steps: [
      { dayNo: 1, title: '道具を確認する', body: 'セットの中身を全部出して、チューナーやピックがあるか確認しましょう。' },
      { dayNo: 2, title: 'チューニングしてみる', body: 'チューナーを使ってギターの6本の弦を正しい音に合わせてみましょう。' },
      { dayNo: 3, title: 'Cコードを覚える', body: '教本のCコードのページを開いて、指の形を覚えてみましょう。音が出なくても大丈夫！' },
      { dayNo: 4, title: 'Gコードに挑戦', body: 'CコードとGコードを交互に押さえる練習をしてみましょう。' },
      { dayNo: 5, title: '簡単な曲に挑戦', body: '教本の最初の曲（コード2〜3つで弾ける曲）に挑戦してみましょう。' },
      { dayNo: 6, title: '苦手な部分を繰り返す', body: '昨日できなかったコードチェンジをゆっくり練習しましょう。' },
      { dayNo: 7, title: '1週間を振り返る', body: '弾けるようになったことを確認して、次に練習したい曲を決めてみましょう。' },
    ],
  },
  createdAt: '2026-06-13T10:00:00Z',
};

export const MOCK_MYPAGE: MyPageData = {
  user: { id: 1, displayName: 'やまだ たろう', email: 'demo@example.com', avatarUrl: '', ratingAverage: 4.8 },
  sellingCount: 2,
  purchasesCount: 1,
  favoritesCount: 3,
};

export const MOCK_DM_ROOMS: DMRoom[] = [
  {
    id: 1,
    partnerId: 2,
    partnerName: 'さとう はなこ',
    partnerAvatar: '',
    setId: 1,
    setTitle: 'アコースティックギター 初心者完全セット',
    lastMessage: 'ご質問ありがとうございます！',
    lastMessageAt: '2026-06-17T10:00:00Z',
    unreadCount: 1,
  },
  {
    id: 2,
    partnerId: 3,
    partnerName: 'たなか けんじ',
    partnerAvatar: '',
    setId: 2,
    setTitle: '本格コーヒー ハンドドリップ入門セット',
    lastMessage: 'よろしくお願いします',
    lastMessageAt: '2026-06-16T15:30:00Z',
    unreadCount: 0,
  },
];

export const MOCK_DM_MESSAGES: DMMessage[] = [
  {
    id: 1,
    roomId: 1,
    senderId: 2,
    body: 'こんにちは！このギターセットについて質問があります。',
    isRead: true,
    createdAt: '2026-06-17T09:55:00Z',
  },
  {
    id: 2,
    roomId: 1,
    senderId: 1,
    body: 'はい、何でもどうぞ！',
    isRead: true,
    createdAt: '2026-06-17T09:57:00Z',
  },
  {
    id: 3,
    roomId: 1,
    senderId: 2,
    body: 'ご質問ありがとうございます！',
    isRead: false,
    createdAt: '2026-06-17T10:00:00Z',
  },
];
