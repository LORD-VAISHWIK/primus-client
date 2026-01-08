import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import GamesPage from './pages/GamesPage';
import ArcadePage from './pages/ArcadePage';
import AppsPage from './pages/AppsPage';
import ShopPage from './pages/ShopPage';
import VaultPage from './pages/VaultPage';
import AccountPage from './pages/AccountPage';
import PCSettingsPage from './pages/PCSettingsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-layout">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/arcade" element={<ArcadePage />} />
            <Route path="/apps" element={<AppsPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/settings" element={<PCSettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
