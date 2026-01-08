import { useState } from 'react';
import { User, Wallet, ShoppingBag, Shield, ArrowLeft, Clock, Coins, DollarSign, Mail, Calendar, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const navItems = [
    { id: 'details', label: 'Personal Details', icon: User },
    { id: 'wallet', label: 'GamePass Wallet', icon: Wallet },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'security', label: 'Security', icon: Shield },
];

const mockGamePasses = [
    { id: 1, duration: '15 Minutes', remaining: '0:15m', purchasedAt: '2024-01-08', status: 'active' },
];

const AccountPage = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('details');
    const [walletTab, setWalletTab] = useState('active');

    const user = {
        name: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        dob: '01/Nov/2000',
        initials: 'JS',
        memberSince: '12/05/2023',
        cashBalance: 80.00,
        timeRemaining: '49h 02m',
        ggCoins: 12500,
    };

    return (
        <div className="page-content">
            {/* Back Button */}
            <button
                className="btn btn-ghost"
                onClick={() => navigate(-1)}
                style={{ marginBottom: 'var(--spacing-lg)' }}
            >
                <ArrowLeft size={18} />
                Back
            </button>

            <div className="account-page">
                {/* Sidebar Navigation */}
                <nav className="account-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                className={`account-nav__item ${activeSection === item.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(item.id)}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* Main Content */}
                <div className="account-content">
                    {/* Account Header */}
                    <div className="account-header">
                        <div className="account-header__avatar">{user.initials}</div>
                        <div className="account-header__info">
                            <h2>{user.name} {user.lastName}</h2>
                            <p>Member since {user.memberSince}</p>
                        </div>
                    </div>

                    {/* Balances */}
                    <h3 style={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        marginBottom: 'var(--spacing-md)'
                    }}>
                        Your Balances
                    </h3>
                    <div className="account-balances">
                        <div className="account-balance">
                            <div className="account-balance__icon account-balance__icon--cash">
                                <DollarSign size={24} />
                            </div>
                            <div className="account-balance__value" style={{ color: 'var(--success)' }}>
                                ${user.cashBalance.toFixed(2)}
                            </div>
                            <div className="account-balance__label">Cash Balance</div>
                        </div>
                        <div className="account-balance">
                            <div className="account-balance__icon account-balance__icon--time">
                                <Clock size={24} />
                            </div>
                            <div className="account-balance__value" style={{ color: 'var(--accent-primary)' }}>
                                {user.timeRemaining}
                            </div>
                            <div className="account-balance__label">Time Remaining</div>
                        </div>
                        <div className="account-balance">
                            <div className="account-balance__icon account-balance__icon--coins">
                                <Coins size={24} />
                            </div>
                            <div className="account-balance__value" style={{ color: 'var(--warning)' }}>
                                {user.ggCoins.toLocaleString()}
                            </div>
                            <div className="account-balance__label">ggCoins</div>
                        </div>
                    </div>

                    {activeSection === 'details' && (
                        <>
                            {/* Personal Details Form */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)', marginTop: 'var(--spacing-xl)' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Personal Details</h3>
                                <button className="btn btn-ghost btn-sm">
                                    <Edit3 size={16} />
                                    Edit personal details
                                </button>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">First Name</label>
                                    <input type="text" className="form-input" value={user.name} readOnly />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input type="text" className="form-input" value={user.lastName} readOnly />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Date of Birth</label>
                                    <input type="text" className="form-input" value={user.dob} readOnly />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="email" className="form-input" value={user.email} readOnly />
                                        <span style={{
                                            position: 'absolute',
                                            right: 'var(--spacing-md)',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-xs)',
                                            fontSize: '0.75rem',
                                            color: 'var(--error)'
                                        }}>
                                            ⚠️ Not verified
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button className="btn btn-secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                                <Mail size={16} />
                                Email verification
                            </button>
                        </>
                    )}

                    {activeSection === 'wallet' && (
                        <>
                            {/* Wallet Section */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)', marginTop: 'var(--spacing-xl)' }}>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>GamePass Wallet</h3>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button className="btn btn-primary btn-sm">
                                        Buy GamePass
                                    </button>
                                    <button className="btn btn-secondary btn-sm">
                                        Redeem GamePass Code
                                    </button>
                                </div>
                            </div>

                            {/* Wallet Tabs */}
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                                {['active', 'stored', 'past'].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`tag ${walletTab === tab ? 'active' : ''}`}
                                        onClick={() => setWalletTab(tab)}
                                        style={{ textTransform: 'capitalize' }}
                                    >
                                        {tab}
                                        {tab === 'active' && (
                                            <span style={{
                                                marginLeft: 'var(--spacing-xs)',
                                                background: walletTab === 'active' ? 'rgba(0,0,0,0.2)' : 'var(--accent-primary)',
                                                padding: '0 6px',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: '0.75rem'
                                            }}>
                                                1
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* GamePass Cards */}
                            {walletTab === 'active' && mockGamePasses.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--spacing-lg)' }}>
                                    {mockGamePasses.map((pass) => (
                                        <div key={pass.id} className="pass-card">
                                            <div className="pass-card__visual pass-card__visual--15min">
                                                <Clock size={32} />
                                            </div>
                                            <div className="pass-card__details">
                                                <div className="pass-card__title">{pass.duration}</div>
                                                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                                    {pass.remaining}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{
                                    textAlign: 'center',
                                    padding: 'var(--spacing-2xl)',
                                    color: 'var(--text-muted)'
                                }}>
                                    No {walletTab} game passes
                                </div>
                            )}
                        </>
                    )}

                    {activeSection === 'orders' && (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--text-muted)' }}>
                            <ShoppingBag size={48} style={{ marginBottom: 'var(--spacing-md)', opacity: 0.5 }} />
                            <p>No orders yet</p>
                        </div>
                    )}

                    {activeSection === 'security' && (
                        <>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
                                Security Settings
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                    <Shield size={18} />
                                    Change Password
                                </button>
                                <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                    <Shield size={18} />
                                    Enable Two-Factor Authentication
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountPage;
