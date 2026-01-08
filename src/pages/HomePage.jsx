import { useState } from 'react';
import { ArrowRight, Gift, Users, Sparkles, ChevronRight } from 'lucide-react';
import GameCard from '../components/ui/GameCard';
import Widget, { ProgressWidget, SocialWidget } from '../components/Widget';

// Mock data for games with reliable image URLs
const featuredGames = [
    { id: 1, title: 'Counter-Strike 2', image: 'https://picsum.photos/seed/cs2/400/600', genre: 'FPS', badge: 'Popular' },
    { id: 2, title: 'Fortnite', image: 'https://picsum.photos/seed/fortnite/400/600', genre: 'Battle Royale' },
    { id: 3, title: 'Valorant', image: 'https://picsum.photos/seed/valorant/400/600', genre: 'Tactical FPS' },
    { id: 4, title: 'League of Legends', image: 'https://picsum.photos/seed/lol/400/600', genre: 'MOBA' },
    { id: 5, title: 'Minecraft', image: 'https://picsum.photos/seed/minecraft/400/600', genre: 'Sandbox' },
    { id: 6, title: 'Apex Legends', image: 'https://picsum.photos/seed/apex/400/600', genre: 'Battle Royale' },
    { id: 7, title: 'Roblox', image: 'https://picsum.photos/seed/roblox/400/600', genre: 'Platform' },
    { id: 8, title: 'GTA V', image: 'https://picsum.photos/seed/gtav/400/600', genre: 'Action' },
];

const socialFeedItems = [
    { initials: 'JD', name: 'John', action: 'just started playing CS2', time: '2 min ago' },
    { initials: 'SK', name: 'Sarah', action: 'earned 500 ggCoins', time: '5 min ago' },
    { initials: 'MK', name: 'Mike', action: 'gave a high five', time: '12 min ago' },
    { initials: 'AL', name: 'Alex', action: 'unlocked an achievement', time: '18 min ago' },
    { initials: 'EM', name: 'Emma', action: 'just logged in', time: '25 min ago' },
];

const HomePage = () => {
    const [hoveredGame, setHoveredGame] = useState(null);

    return (
        <div className="page-content">
            <div className="home-layout">
                {/* Main Content */}
                <div className="home-main">
                    {/* Hero Section */}
                    <div className="hero">
                        <div className="hero__background">
                            <img
                                src="https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg"
                                alt="Featured Game"
                            />
                        </div>
                        <div className="hero__overlay" />
                        <div className="hero__content">
                            <span className="hero__badge">
                                <Sparkles size={14} />
                                Featured Game
                            </span>
                            <h1 className="hero__title">
                                <span className="text-gradient">Counter-Strike 2</span>
                            </h1>
                            <p className="hero__description">
                                The next era of competitive FPS is here. Experience the next generation of CS with updated graphics, refined gameplay, and more.
                            </p>
                            <div className="hero__actions">
                                <button className="btn btn-primary btn-lg">
                                    Play Now
                                    <ArrowRight size={18} />
                                </button>
                                <button className="btn btn-secondary btn-lg">
                                    Learn More
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Popular Games */}
                    <section className="section">
                        <div className="section__header">
                            <h2 className="section__title">Most Played Games</h2>
                            <a href="/games" className="section__link">
                                View all games
                                <ChevronRight size={18} />
                            </a>
                        </div>
                        <div className="games-row">
                            {featuredGames.map((game, index) => (
                                <GameCard
                                    key={game.id}
                                    game={game}
                                    ranking={index + 1}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Recently Played */}
                    <section className="section">
                        <div className="section__header">
                            <h2 className="section__title">Continue Playing</h2>
                            <a href="/games" className="section__link">
                                View history
                                <ChevronRight size={18} />
                            </a>
                        </div>
                        <div className="games-row">
                            {featuredGames.slice(0, 4).map((game) => (
                                <GameCard key={game.id} game={game} />
                            ))}
                        </div>
                    </section>
                </div>

                {/* Widgets Sidebar */}
                <div className="widgets">
                    {/* Discord Widget */}
                    <Widget
                        icon={<Users size={20} color="white" />}
                        iconBg="#5865f2"
                        title="Join Our Community"
                    >
                        <p style={{ marginBottom: 'var(--spacing-md)' }}>
                            Connect with other players and get exclusive updates!
                        </p>
                        <button className="btn btn-secondary" style={{ width: '100%' }}>
                            Join Discord
                        </button>
                    </Widget>

                    {/* Rewards Progress */}
                    <ProgressWidget
                        icon={<Gift size={20} color="white" />}
                        iconBg="linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)"
                        title="4 Free Hours"
                        current={7500}
                        total={11000}
                        label="Play more to earn free gaming time!"
                        actionLabel="Redeem Now"
                    />



                    {/* Social Feed */}
                    <SocialWidget
                        title="Activity Feed"
                        items={socialFeedItems}
                    />
                </div>
            </div>
        </div>
    );
};

export default HomePage;
