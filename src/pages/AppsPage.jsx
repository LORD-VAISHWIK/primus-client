import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import GameCard from '../components/GameCard';
import { apiService } from '../services/apiClient';

const categories = ['All', 'Communication', 'Music', 'Streaming', 'Browser', 'Gaming', 'Media', 'Development', 'Utility'];

// Keywords to identify "Apps" vs "Games" if backend doesn't separate them strictly yet
const APP_KEYWORDS = ['app', 'application', 'browser', 'utility', 'media', 'music', 'discord', 'spotify', 'chrome', 'obs', 'vlc', 'code'];

const AppsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const [apps, setApps] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        try {
            setLoading(true);
            const res = await apiService.games.list();
            const allItems = Array.isArray(res.data) ? res.data : (res.data?.games || []);

            // Client-side filtering to distinguish Apps from Games
            // In a real scenario, backend should have `type: 'app'` or `category: 'utility'`
            const appItems = allItems.filter(item => {
                const genre = (item.genre || '').toLowerCase();
                const tags = (item.tags || []).map(t => t.toLowerCase());
                const title = (item.title || item.name || '').toLowerCase();

                // Check if it matches any app keyword
                const isApp = APP_KEYWORDS.some(k =>
                    genre.includes(k) || tags.includes(k) || title.includes(k)
                );

                return isApp || genre === 'software';
            });

            setApps(appItems);
        } catch (err) {
            console.error("Failed to fetch apps:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredApps = apps.filter(app => {
        const matchesSearch = (app.title || app.name).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || (app.genre === selectedCategory);
        return matchesSearch && matchesCategory;
    });

    const mapApp = (a) => ({
        id: a.id,
        title: a.title || a.name,
        image: a.image || a.cover_url || a.icon_url || 'https://picsum.photos/400/600',
        genre: a.genre || 'App'
    });

    return (
        <div className="page-content">
            <div className="games-page">
                {/* Sidebar */}
                <aside className="games-sidebar">
                    <div className="filter-section">
                        <h3 className="filter-section__title">Categories</h3>
                        <div className="tags" style={{ flexDirection: 'column' }}>
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    className={`tag ${selectedCategory === cat ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{ justifyContent: 'flex-start' }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main */}
                <main className="games-main">
                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <h1 className="heading-2">
                            <span className="text-gradient">{filteredApps.length} Apps</span> Available
                        </h1>
                    </div>

                    <div className="search-bar">
                        <Search size={20} className="search-bar__icon" />
                        <input
                            type="text"
                            className="search-bar__input"
                            placeholder="Search apps..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <section className="section">
                        {loading ? (
                            <div className="center-content">
                                <div className="loading-spinner" />
                            </div>
                        ) : filteredApps.length > 0 ? (
                            <div className="games-grid">
                                {filteredApps.map((app) => (
                                    <GameCard key={app.id} game={mapApp(app)} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No applications found.</p>
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default AppsPage;
