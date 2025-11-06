import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildPath } from './Path.ts';
import { storeToken } from '../tokenStorage.ts';
import './Login.css';
import logo from '../assets/p3-logo.svg';

function VerifyEmail()
{
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [message, setMessage] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);

    useEffect(() =>
    {
        const queryEmail = searchParams.get('email');
        if( queryEmail )
        {
            setEmail(queryEmail);
        }
    }, [searchParams]);

    const handleVerify = async (event: React.FormEvent) =>
    {
        event.preventDefault();

        if( !email || !code )
        {
            setMessage('Email and verification code are required.');
            return;
        }

        setIsVerifying(true);
        setMessage('');

        const payload = { login: email.trim(), code: code.trim() };

        try
        {
            const response = await fetch(buildPath('api/verify-email'),
            {
                method:'POST',
                body: JSON.stringify(payload),
                headers:
                {
                    'Content-Type': 'application/json'
                }
            });

            if( !response.ok )
            {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseText = await response.text();

            let res;
            try
            {
                res = JSON.parse(responseText);
            }
            catch(parseError)
            {
                console.error('Failed to parse verification response:', parseError);
                setMessage('Invalid response from server');
                return;
            }

            if( res.error )
            {
                setMessage(res.error);
                return;
            }

            if( res.accessToken )
            {
                storeToken(res);

                if( res.id )
                {
                    const user =
                    {
                        firstName: res.firstName,
                        lastName: res.lastName,
                        id: res.id,
                        friend_id: res.friend_id
                    };
                    localStorage.setItem('user_data', JSON.stringify(user));
                }

                setMessage(res.message ?? 'Email verified successfully. Redirecting...');
                setTimeout(() =>
                {
                    navigate('/calendar');
                }, 1200);
                return;
            }

            setMessage(res.message ?? 'Email verified successfully.');
        }
        catch(error:any)
        {
            console.error('Verify email error:', error);
            if( error.name === 'TypeError' && error.message.includes('fetch') )
            {
                setMessage('Cannot connect to server. Please check if the backend is running.');
            }
            else if( error.message.includes('HTTP error') )
            {
                setMessage(`Server error: ${error.message}`);
            }
            else
            {
                setMessage('Network error. Please try again.');
            }
        }
        finally
        {
            setIsVerifying(false);
        }
    };

    const handleResend = async () =>
    {
        if( !email )
        {
            setMessage('Enter the email address used for signup to resend the code.');
            return;
        }

        setIsResending(true);
        setMessage('');

        try
        {
            const response = await fetch(buildPath('api/resend-verification'),
            {
                method:'POST',
                body: JSON.stringify({ login: email.trim() }),
                headers:
                {
                    'Content-Type': 'application/json'
                }
            });

            if( !response.ok )
            {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseText = await response.text();

            let res;
            try
            {
                res = JSON.parse(responseText);
            }
            catch(parseError)
            {
                console.error('Failed to parse resend response:', parseError);
                setMessage('Invalid response from server');
                return;
            }

            if( res.error )
            {
                setMessage(res.error);
                return;
            }

            setMessage(res.message ?? 'Verification code resent. Please check your email.');
        }
        catch(error:any)
        {
            console.error('Resend verification error:', error);
            if( error.name === 'TypeError' && error.message.includes('fetch') )
            {
                setMessage('Cannot connect to server. Please check if the backend is running.');
            }
            else if( error.message.includes('HTTP error') )
            {
                setMessage(`Server error: ${error.message}`);
            }
            else
            {
                setMessage('Network error. Please try again.');
            }
        }
        finally
        {
            setIsResending(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="app-logo">
                    <img src={logo} alt="P3 logo" />
                </div>

                <h1 className="welcome-title">Verify Email</h1>
                <p className="login-subtitle">Enter the code sent to your email to finish creating your account.</p>

                <form onSubmit={handleVerify} className="login-form">
                    <div className="input-group">
                        <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2.5 4.375A1.875 1.875 0 014.375 2.5h11.25A1.875 1.875 0 0117.5 4.375v11.25A1.875 1.875 0 0115.625 17.5H4.375A1.875 1.875 0 012.5 15.625V4.375z" stroke="#9CA3AF" strokeWidth="2"/>
                                <path d="M3.125 5.312l6.25 4.688a1.25 1.25 0 001.25 0l6.25-4.688" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            className="login-input"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 13.75a.625.625 0 01-.625-.625V10a.625.625 0 011.25 0v3.125A.625.625 0 0110 13.75z" fill="#9CA3AF"/>
                                <path d="M10 7.5a.937.937 0 100-1.875.937.937 0 000 1.875z" fill="#9CA3AF"/>
                                <path d="M17.5 10a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" stroke="#9CA3AF" strokeWidth="2"/>
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Verification Code"
                            value={code}
                            onChange={(event) => setCode(event.target.value)}
                            className="login-input"
                            required
                        />
                    </div>

                    {message && <div className="error-message">{message}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isVerifying}
                    >
                        {isVerifying ? 'Verifying...' : 'Verify Email'}
                    </button>

                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleResend}
                        disabled={isResending}
                    >
                        {isResending ? 'Resending...' : 'Resend Code'}
                    </button>

                    <button
                        type="button"
                        className="btn btn-link"
                        onClick={() => navigate('/')}
                    >
                        Back to Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default VerifyEmail;
