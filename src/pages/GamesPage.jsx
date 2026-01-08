import { useState, useEffect } from 'react';
import { Search, Monitor, Gamepad, Crosshair, Sword, Users, Zap, ChevronRight, HardDrive } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import GameCard from '../components/GameCard';
import { apiService } from '../services/apiClient';

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
    const [autoScanEnabled, setAutoScanEnabled] = useState(false);
    const [installedPaths, setInstalledPaths] = useState([]);

    // Data states
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial Fetch
    useEffect(() => {
        fetchGames();
    }, []);

    // Search Effect (Debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                handleSearch(searchQuery);
            } else {
                fetchGames(); // Reset to full list if search cleared
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Auto Scan Logic
    useEffect(() => {
        const runAutoScan = async () => {
            if (!autoScanEnabled || games.length === 0) {
                setInstalledPaths([]);
                return;
            }

            try {
                // Collect all exe_paths from loaded games
                const pathsToCheck = games
                    .map(g => g.exe_path)
                    .filter(p => p && p.trim().length > 0);

                if (pathsToCheck.length === 0) return;

                // Call custom Tauri command
                const verifiedPaths = await invoke('check_installed_paths', { paths: pathsToCheck });
                setInstalledPaths(verifiedPaths);
            } catch (err) {
                console.error("Auto scan failed:", err);
            }
        };

        runAutoScan();
    }, [autoScanEnabled, games]);


    const fetchGames = async () => {
        try {
            setLoading(true);
            const res = await apiService.games.list();
            const data = Array.isArray(res.data) ? res.data : (res.data?.games || []);
            setGames(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch games:", err);
            setError("Failed to load games. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (q) => {
        try {
            setLoading(true);
            const res = await apiService.games.search(q);
            const data = Array.isArray(res.data) ? res.data : (res.data?.games || []);
            setGames(data);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setLoading(false);
        }
    };

    // Client-side filtering
    const filteredGames = games.filter(game => {
        // Tag filter
        const gameTags = game.tags || (game.genre ? [game.genre] : []);
        const matchesTag = selectedTag === 'All' || gameTags.includes(selectedTag) || game.genre === selectedTag;

        // License filters
        const matchesF2P = !freeToPlay || game.is_free;
        const matchesBorrow = !availableToBorrow || game.can_borrow;

        // Auto Scan Filter (Only Installed)
        const matchesInstalled = !autoScanEnabled || (game.exe_path && installedPaths.includes(game.exe_path));

        return matchesTag && matchesF2P && matchesBorrow && matchesInstalled;
    });

    const mapGame = (g) => ({
        id: g.id,
        title: g.title || g.name,
        image: g.image || g.cover_url || g.icon_url || 'https://picsum.photos/400/600',
        genre: g.genre || 'Game',
        badge: g.is_popular ? 'Popular' : undefined,
        tags: g.tags || []
    });

    return (
        <div className="page-content">
            <div className="games-page">
                {/* Sidebar Filters */}
                <aside className="games-sidebar">
                    {/* Auto Scan Toggle */}
                    <div className="filter-section" style={{
                        background: 'rgba(50, 255, 100, 0.05)',
                        border: '1px solid rgba(50, 255, 100, 0.2)'
                    }}>
                        <h3 className="filter-section__title" style={{ color: 'var(--success)' }}>
                            <HardDrive size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'text-bottom' }} />
                            Installed Only
                        </h3>
                        <div className="filter-toggle">
                            <span className="filter-toggle__label">Auto Scan System</span>
                            <button
                                className={`toggle ${autoScanEnabled ? 'active' : ''}`}
                                onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                            />
                        </div>
                        {autoScanEnabled && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Showing {filteredGames.length} installed games found.
                            </p>
                        )}
                    </div>

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

                    {/* Launchers - Hide if scanning for installed games to reduce clutter, or keep it? Keeping it. */}
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

                    {loading ? (
                        <div className="center-content" style={{ padding: '4rem' }}>
                            <div className="loading-spinner" />
                        </div>
                    ) : error ? (
                        <div className="error-state">
                            <p>{error}</p>
                            <button className="btn btn-secondary" onClick={fetchGames}>Retry</button>
                        </div>
                    ) : (
                        <>
                            {/* Most Played (Top 6) */}
                            {filteredGames.length > 0 && (
                                <section className="section">
                                    <div className="section__header">
                                        <h2 className="section__title">Most played games</h2>
                                    </div>
                                    <div className="games-row">
                                        {filteredGames.slice(0, 6).map((game, index) => (
                                            <GameCard key={game.id} game={mapGame(game)} ranking={index + 1} />
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* All Games Grid */}
                            <section className="section">
                                <div className="section__header">
                                    <h2 className="section__title">All Games</h2>
                                </div>
                                {filteredGames.length > 0 ? (
                                    <div className="games-grid">
                                        {filteredGames.map((game) => (
                                            <GameCard key={game.id} game={mapGame(game)} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <p>No games found matching your criteria.</p>
                                        {autoScanEnabled && <p>Try disabling "Auto Scan" to see all available library games.</p>}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default GamesPage;
