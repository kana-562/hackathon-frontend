import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import './styles/global.css';

import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import SetDetailPage from './pages/SetDetailPage';
import PurchasePage from './pages/PurchasePage';
import PurchaseCompletePage from './pages/PurchaseCompletePage';
import SellStartPage from './pages/SellStartPage';
import SellSupportPage from './pages/SellSupportPage';
import SellConfirmPage from './pages/SellConfirmPage';
import MyPage from './pages/MyPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DMListPage from './pages/DMListPage';
import DMRoomPage from './pages/DMRoomPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/categories/:categoryId" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/sets/:setId" element={<SetDetailPage />} />
            <Route path="/purchase/:setId" element={<PurchasePage />} />
            <Route path="/purchase/:setId/complete" element={<PurchaseCompletePage />} />
            <Route path="/sell" element={<SellStartPage />} />
            <Route path="/sell/support/:draftSetId" element={<SellSupportPage />} />
            <Route path="/sell/confirm/:draftSetId" element={<SellConfirmPage />} />
            <Route path="/mypage" element={<MyPage />} />
            <Route path="/dm" element={<DMListPage />} />
            <Route path="/dm/:roomId" element={<DMRoomPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
