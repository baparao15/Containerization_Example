import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const { register, isAuthenticated, isBuyer, isSeller } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        role: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Redirect if already authenticated
    if (isAuthenticated) {
        if (isBuyer) {
            navigate('/buyer');
        } else if (isSeller) {
            navigate('/seller');
        }
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.role) {
            setError('Please select a role (Buyer or Seller)');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        const result = await register(formData.email, formData.password, formData.role);

        if (result.success) {
            // Navigation will happen automatically via the redirect above
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card auth-card-wide fade-in">
                <div className="auth-header">
                    <h1>Join HeirloomHub</h1>
                    <p>Create your account to start trading antiques</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form auth-form-horizontal">
                    {/* Left Column - Form Fields */}
                    <div className="form-column">
                        <div className="input-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="your@email.com"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={6}
                                placeholder="At least 6 characters"
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                minLength={6}
                                placeholder="Re-enter your password"
                            />
                        </div>
                    </div>

                    {/* Right Column - Role Selection */}
                    <div className="form-column">
                        <div className="input-group">
                            <label>I want to be a:</label>
                            <div className="role-selection-vertical">
                                <label className={`role-card ${formData.role === 'Buyer' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="Buyer"
                                        checked={formData.role === 'Buyer'}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="role-content">
                                        <span className="role-icon">🛍️</span>
                                        <span className="role-title">Buyer</span>
                                        <span className="role-desc">Browse and purchase antiques</span>
                                    </div>
                                </label>

                                <label className={`role-card ${formData.role === 'Seller' ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="Seller"
                                        checked={formData.role === 'Seller'}
                                        onChange={handleChange}
                                        required
                                    />
                                    <div className="role-content">
                                        <span className="role-icon">🏪</span>
                                        <span className="role-title">Seller</span>
                                        <span className="role-desc">List and sell your antiques</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Full Width Button */}
                    <button type="submit" className="btn btn-primary btn-full-width" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
