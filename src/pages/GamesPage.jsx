import { useState } from 'react';
import { Search, Monitor, Gamepad, Crosshair, Sword, Users, Zap, ChevronRight } from 'lucide-react';
import GameCard from '../components/GameCard';

// Mock games data
const allGames = [
    { id: 1, title: 'Counter-Strike 2', image: 'https://picsum.photos/seed/cs2g/400/600', genre: 'FPS', tags: ['FPS', 'Multiplayer', 'Shooter'] },
    { id: 2, title: 'Fortnite', image: 'https://picsum.photos/seed/fortg/400/600', genre: 'Battle Royale', tags: ['Battle Royale', 'Multiplayer'] },
    { id: 3, title: 'Valorant', image: 'https://picsum.photos/seed/valg/400/600', genre: 'FPS', tags: ['FPS', 'Multiplayer', 'Shooter'] },
    { id: 4, title: 'League of Legends', image: 'https://picsum.photos/seed/lolg/400/600', genre: 'MOBA', tags: ['MOBA', 'Multiplayer', 'Strategy'] },
    { id: 5, title: 'Minecraft', image: 'https://picsum.photos/seed/mincg/400/600', genre: 'Sandbox', tags: ['Sandbox', 'Adventure', 'Casual'] },
    { id: 6, title: 'Apex Legends', image: 'https://picsum.photos/seed/apexg/400/600', genre: 'Battle Royale', tags: ['Battle Royale', 'FPS', 'Multiplayer'] },
    { id: 7, title: 'Roblox', image: 'https://picsum.photos/seed/robg/400/600', genre: 'Platform', tags: ['Platform', 'Casual', 'Adventure'] },
    { id: 8, title: 'GTA V', image: 'https://picsum.photos/seed/gtag/400/600', genre: 'Action', tags: ['Action', 'Adventure', 'Open World'] },
    { id: 9, title: 'Call of Duty: Warzone', image: 'https://picsum.photos/seed/codg/400/600', genre: 'Battle Royale', tags: ['Battle Royale', 'FPS', 'Multiplayer'] },
    { id: 10, title: 'Overwatch 2', image: 'https://picsum.photos/seed/owg/400/600', genre: 'FPS', tags: ['FPS', 'Multiplayer', 'Hero Shooter'] },
    { id: 11, title: 'Dota 2', image: 'https://picsum.photos/seed/dotag/400/600', genre: 'MOBA', tags: ['MOBA', 'Multiplayer', 'Strategy'] },
    { id: 12, title: 'Rocket League', image: 'https://picsum.photos/seed/rlg/400/600', genre: 'Sports', tags: ['Sports', 'Multiplayer', 'Casual'] },
];

const tags = ['All', 'Multiplayer', 'FPS', 'Shooter', 'Battle Royale', 'MOBA', 'Action', 'Strategy', 'Casual', 'RPG'];

const launchers = [
    { name: 'Steam', icon: '🎮', color: 'linear-gradient(135deg, #1b2838 0%, #2a475e 100%)' },
    { name: 'Epic Games', icon: '🎲', color: '#2a2a2a' },
    { name: 'Battle.net', icon: '⚔️', color: 'linear-gradient(135deg, #00aeff 0%, #0074d9 100%)' },
    { name: 'Ubisoft', icon: '🎯', color: '#0070d1' },
];

const GamesPage = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState('All');
    const [freeToPlay, setFreeToPlay] = useState(false);
    const [availableToBorrow, setAvailableToBorrow] = useState(false);

    const filteredGames = allGames.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = selectedTag === 'All' || game.tags.includes(selectedTag);
        return matchesSearch && matchesTag;
    });

    return (
        <div className="page-content">
            <div className="games-page">
                {/* Sidebar Filters */}
                <aside className="games-sidebar">
                    {/* License Filters */}
                    <div className="filter-section">
                        <h3 className="filter-section__title">License</h3>
                        <div className="filter-toggle">
                            <span className="filter-toggle__label">Available to borrow</span>
                            <button
                                className={`toggle ${availableToBorrow ? 'active' : ''}`}
                                onClick={() => setAvailableToBorrow(!availableToBorrow)}
                            />
                        </div>
                        <div className="filter-toggle">
                            <span className="filter-toggle__label">Free to play</span>
                            <button
                                className={`toggle ${freeToPlay ? 'active' : ''}`}
                                onClick={() => setFreeToPlay(!freeToPlay)}
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="filter-section">
                        <h3 className="filter-section__title">Browse by Tag</h3>
                        <div className="tags">
                            {tags.map((tag) => (
                                <button
                                    key={tag}
                                    className={`tag ${selectedTag === tag ? 'active' : ''}`}
                                    onClick={() => setSelectedTag(tag)}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="games-main">
                    {/* Page Header */}
                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <h1 className="heading-2" style={{ marginBottom: 'var(--spacing-sm)' }}>
                            Discover <span className="text-gradient">{filteredGames.length} games</span> available
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="search-bar">
                        <Search size={20} className="search-bar__icon" />
                        <input
                            type="text"
                            className="search-bar__input"
                            placeholder="Search games..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Launchers */}
                    <section className="section">
                        <div className="section__header">
                            <h2 className="section__title">Access your own games</h2>
                            <a href="#" className="section__link">
                                Explore all launchers
                                <ChevronRight size={18} />
                            </a>
                        </div>
                        <div className="launchers">
                            {launchers.map((launcher) => (
                                <div key={launcher.name} className="launcher-card">
                                    <div className="launcher-card__icon" style={{ background: launcher.color }}>
                                        {launcher.icon}
                                    </div>
                                    <span className="launcher-card__name">{launcher.name}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Most Played */}
                    <section className="section">
                        <div className="section__header">
                            <h2 className="section__title">Most played games</h2>
                        </div>
                        <div className="games-row">
                            {filteredGames.slice(0, 6).map((game, index) => (
                                <GameCard key={game.id} game={game} ranking={index + 1} />
                            ))}
                        </div>
                    </section>

                    {/* All Games Grid */}
                    <section className="section">
                        <div className="section__header">
                            <h2 className="section__title">All Games</h2>
                        </div>
                        <div className="games-grid">
                            {filteredGames.map((game) => (
                                <GameCard key={game.id} game={game} />
                            ))}
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default GamesPage;
