import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container">
            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Welcome to HeirloomHub</h1>
                    <p className="hero-subtitle">
                        Your trusted marketplace for authentic antiques and vintage treasures
                    </p>
                    <p className="hero-description">
                        Connect with passionate collectors, discover rare finds, and preserve history through timeless pieces
                    </p>
                    <div className="hero-cta">
                        <Link to="/register" className="btn btn-primary btn-large">
                            Get Started
                        </Link>
                        <Link to="/login" className="btn btn-secondary btn-large">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <h2 className="section-title">Why Choose HeirloomHub?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🛍️</div>
                        <h3>For Buyers</h3>
                        <p>Browse curated collections of authentic antiques</p>
                        <ul className="feature-list">
                            <li>Verified sellers</li>
                            <li>Detailed item descriptions</li>
                            <li>Secure messaging</li>
                            <li>Quality guarantees</li>
                        </ul>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🏪</div>
                        <h3>For Sellers</h3>
                        <p>Showcase your antiques to passionate collectors</p>
                        <ul className="feature-list">
                            <li>Easy listing management</li>
                            <li>Direct buyer communication</li>
                            <li>Flexible pricing</li>
                            <li>Wide audience reach</li>
                        </ul>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Secure & Trusted</h3>
                        <p>Trade with confidence on our platform</p>
                        <ul className="feature-list">
                            <li>Secure authentication</li>
                            <li>Real-time chat</li>
                            <li>Transaction protection</li>
                            <li>Community reviews</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works-section">
                <h2 className="section-title">How It Works</h2>
                <div className="steps-grid">
                    <div className="step-card">
                        <div className="step-number">1</div>
                        <h3>Create Account</h3>
                        <p>Sign up as a buyer or seller in seconds</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">2</div>
                        <h3>Browse or List</h3>
                        <p>Explore antiques or list your own treasures</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">3</div>
                        <h3>Connect</h3>
                        <p>Chat directly with buyers or sellers</p>
                    </div>
                    <div className="step-card">
                        <div className="step-number">4</div>
                        <h3>Trade</h3>
                        <p>Complete your transaction securely</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2>Ready to Start Your Journey?</h2>
                    <p>Join our community of antique enthusiasts today</p>
                    <div className="cta-buttons">
                        <Link to="/register" className="btn btn-primary btn-large">
                            Create Account
                        </Link>
                        <Link to="/login" className="btn btn-outline btn-large">
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
