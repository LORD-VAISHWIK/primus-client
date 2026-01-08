import { useState } from 'react';
import { Search } from 'lucide-react';
import GameCard from '../components/ui/GameCard';

const apps = [
    { id: 1, title: 'Discord', image: 'https://picsum.photos/seed/disc/400/600', genre: 'Communication' },
    { id: 2, title: 'Spotify', image: 'https://picsum.photos/seed/spot/400/600', genre: 'Music' },
    { id: 3, title: 'OBS Studio', image: 'https://picsum.photos/seed/obs/400/600', genre: 'Streaming' },
    { id: 4, title: 'Google Chrome', image: 'https://picsum.photos/seed/chr/400/600', genre: 'Browser' },
    { id: 5, title: 'Steam', image: 'https://picsum.photos/seed/stm/400/600', genre: 'Gaming' },
    { id: 6, title: 'VLC Player', image: 'https://picsum.photos/seed/vlc/400/600', genre: 'Media' },
    { id: 7, title: 'Visual Studio Code', image: 'https://picsum.photos/seed/vsc/400/600', genre: 'Development' },
    { id: 8, title: 'Notepad++', image: 'https://picsum.photos/seed/npp/400/600', genre: 'Utility' },
];

const categories = ['All', 'Communication', 'Music', 'Streaming', 'Browser', 'Gaming', 'Media', 'Development', 'Utility'];

const AppsPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const filteredApps = apps.filter(app => {
        const matchesSearch = app.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || app.genre === selectedCategory;
        return matchesSearch && matchesCategory;
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
                        <div className="games-grid">
                            {filteredApps.map((app) => (
                                <GameCard key={app.id} game={app} />
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default AppsPage;
