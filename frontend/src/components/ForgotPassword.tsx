import React, { useState } from 'react';
import { buildPath } from './Path.ts';
import './Login.css';
import logo from '../assets/p3-logo.svg';

function ForgotPassword()
{
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messageType, setMessageType] = useState<'error' | 'success'>('error');

    const handleResetPassword = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setMessage('');
        setMessageType('error');

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setMessage('Please enter a valid email address');
            setMessageType('error');
            setIsLoading(false);
            return;
        }

        try {
            // Simulate API call for password reset
            const response = await fetch(buildPath('api/forgot-password'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setIsSubmitted(true);
                    setMessageType('success');
                    setMessage('Password reset instructions have been sent to your email address.');
                } else {
                    setMessageType('error');
                    setMessage(result.error || 'Failed to send reset email. Please try again.');
                }
            } else if (response.status === 404) {
                setMessageType('error');
                setMessage('No account found with that email address.');
            } else if (response.status >= 500) {
                setMessageType('error');
                setMessage('Server error. Please try again later.');
            } else {
                setMessageType('error');
                setMessage('Failed to send reset email. Please check your email address and try again.');
            }
        } catch (error) {
            // Network error or API not available
            setMessageType('error');
            setMessage('Unable to connect to server. Please check your internet connection and try again.');
        }

        setIsLoading(false);
    };

    const handleBackToLogin = () => {
        window.location.href = '/';
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="app-logo">
                    <img src={logo} alt="P3 logo" />
                </div>
                
                <h1 className="welcome-title">
                    {isSubmitted ? 'Check Your Email' : 'Forgot Password?'}
                </h1>
                
                {!isSubmitted ? (
                    <form onSubmit={handleResetPassword} className="login-form">
                        <p style={{ 
                            textAlign: 'center', 
                            color: '#6B7280', 
                            marginBottom: '32px',
                            lineHeight: '1.5'
                        }}>
                            Enter your email address and we'll send you instructions to reset your password.
                        </p>

                        <div className="input-group">
                            <div className="input-icon">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V5Z" stroke="#9CA3AF" strokeWidth="2"/>
                                    <path d="M3 7L10 11L17 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            <input 
                                type="email" 
                                placeholder="Enter your email address" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="login-input"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {message && (
                            <div className={messageType === 'success' ? 'success-message' : 'error-message'}>
                                {message}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isLoading}
                            style={{ 
                                opacity: isLoading ? 0.7 : 1,
                                cursor: isLoading ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLoading ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 4"/>
                                    </svg>
                                    Sending...
                                </span>
                            ) : (
                                'Send Reset Instructions'
                            )}
                        </button>

                        <button 
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleBackToLogin}
                            disabled={isLoading}
                        >
                            Back to Login
                        </button>

                        {message && messageType === 'error' && (
                            <button 
                                type="button"
                                className="btn btn-test"
                                onClick={() => {
                                    setMessage('');
                                    setEmail('');
                                }}
                                style={{ marginTop: '8px' }}
                            >
                                Clear & Try Again
                            </button>
                        )}
                    </form>
                ) : (
                    <div className="login-form">
                        <div style={{ 
                            textAlign: 'center', 
                            marginBottom: '32px' 
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px'
                            }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            </div>
                            
                            <p style={{ 
                                color: '#6B7280', 
                                lineHeight: '1.6',
                                fontSize: '16px'
                            }}>
                                {message}
                            </p>
                            
                            <p style={{ 
                                color: '#9CA3AF', 
                                fontSize: '14px',
                                marginTop: '16px'
                            }}>
                                Didn't receive the email? Check your spam folder or contact support.
                            </p>
                        </div>

                        <button 
                            type="button"
                            className="btn btn-primary"
                            onClick={handleBackToLogin}
                        >
                            Back to Login
                        </button>

                        <button 
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                                setIsSubmitted(false);
                                setEmail('');
                                setMessage('');
                                setMessageType('error');
                            }}
                        >
                            Try Different Email
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ForgotPassword;
