export interface User {
  id: number;
  displayName: string;
  email: string;
  avatarUrl: string;
  ratingAverage: number;
}

export interface HobbyCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  sortOrder: number;
}

export interface StarterSetCard {
  id: number;
  title: string;
  price: number;
  beginnerScore: number;
  readinessScore: number;
  imageUrl: string;
  hobbyName: string;
  categoryName: string;
  status: string;
  isFavorite: boolean;
}

export interface SetItemDTO {
  id: number;
  name: string;
  conditionLabel: string;
  quantity: number;
  isEssential: boolean;
  note: string;
}

export interface RecommendedItemDTO {
  id: number;
  name: string;
  importance: string;
  reason: string;
}

export interface StarterSetDetail {
  id: number;
  title: string;
  price: number;
  description: string;
  status: string;
  beginnerScore: number;
  readinessScore: number;
  valueScore: number;
  estimatedNewPrice: number;
  previousOwnerNote: string;
  startableSummary: string;
  images: string[];
  items: SetItemDTO[];
  recommendedItems: RecommendedItemDTO[];
  seller: User;
  hobbyName: string;
  categoryName: string;
  isFavorite: boolean;
}

export interface DraftDetail {
  id: number;
  title: string;
  description: string;
  price: number;
  categoryId: number;
  hobbyId: number;
  beginnerScore: number;
  readinessScore: number;
  startableSummary: string;
  previousOwnerNote: string;
  items: SetItemDTO[];
  recommendedItems: RecommendedItemDTO[];
  imageUrl: string;
}

export interface ProgressDTO {
  current: number;
  total: number;
}

export interface ChatMessage {
  sender: 'user' | 'assistant';
  message: string;
  suggestedChips?: string[];
}

export interface TransactionDetail {
  id: number;
  status: string;
  price: number;
  starterSet: StarterSetCard;
  startPlan?: StartPlanDTO;
  createdAt: string;
}

export interface StartPlanDTO {
  id: number;
  title: string;
  steps: StartPlanStepDTO[];
}

export interface StartPlanStepDTO {
  dayNo: number;
  title: string;
  body: string;
}

export interface HomeData {
  featuredSets: StarterSetCard[];
  newSets: StarterSetCard[];
  categories: HobbyCategory[];
}

export interface SearchResponse {
  sets: StarterSetCard[];
  smartMessage?: string;
  relatedChips?: string[];
}

export interface MyPageData {
  user: User;
  sellingCount: number;
  purchasesCount: number;
  favoritesCount: number;
}
