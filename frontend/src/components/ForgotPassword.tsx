import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildPath } from './Path.ts';
import './Login.css';
import logo from '../assets/p3-logo.svg';

type Step = 'email' | 'code' | 'reset';

const stepTitles: Record<Step, string> = {
    email: 'Enter your email',
    code: 'Enter the reset code',
    reset: 'Create a new password'
};

const stepSubtitles: Record<Step, string> = {
    email: 'We will send a 6-digit reset code to the email associated with your account.',
    code: 'Enter the reset code that was emailed to you.',
    reset: 'Choose a new password and confirm it below.'
};

const defaultRequestMessage = 'If an account matches that email, a reset code has been sent.';

function ForgotPassword()
{
    const navigate = useNavigate();

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const resetFeedback = () =>
    {
        setError('');
        setInfo('');
    };

    const handleUseDifferentEmail = () =>
    {
        setStep('email');
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
        resetFeedback();
    };

    const requestResetCode = async (setLoading: React.Dispatch<React.SetStateAction<boolean>>) =>
    {
        resetFeedback();

        const trimmedEmail = email.trim();
        if( trimmedEmail.length === 0 )
        {
            setError('Please enter your email.');
            return false;
        }

        setLoading(true);

        try
        {
            const response = await fetch(buildPath('api/request-password-reset'),
            {
                method:'POST',
                headers:
                {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ login: trimmedEmail })
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
                console.error('Failed to parse request password reset response:', parseError);
                setError('Invalid response from server');
                return false;
            }

            if( res.error )
            {
                setError(res.error);
                return false;
            }

            setEmail(trimmedEmail);
            setInfo(res.message ?? defaultRequestMessage);
            setStep('code');
            return true;
        }
        catch(error:any)
        {
            console.error('Request password reset error:', error);
            if( error.name === 'TypeError' && error.message.includes('fetch') )
            {
                setError('Cannot connect to server. Please check if the backend is running.');
            }
            else if( error.message.includes('HTTP error') )
            {
                setError(`Server error: ${error.message}`);
            }
            else
            {
                setError('Network error. Please try again.');
            }
            return false;
        }
        finally
        {
            setLoading(false);
        }
    };

    const handleSubmitEmail = async (event: React.FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();
        await requestResetCode(setIsSubmitting);
    };

    const handleResendCode = async () =>
    {
        await requestResetCode(setIsResending);
    };

    const handleVerifyCode = async (event: React.FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();
        resetFeedback();

        const trimmedEmail = email.trim();
        const trimmedCode = code.trim();

        if( trimmedEmail.length === 0 || trimmedCode.length === 0 )
        {
            setError('Email and reset code are required.');
            return;
        }

        setIsSubmitting(true);

        try
        {
            const response = await fetch(buildPath('api/verify-password-reset-code'),
            {
                method:'POST',
                headers:
                {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ login: trimmedEmail, code: trimmedCode })
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
                console.error('Failed to parse verify code response:', parseError);
                setError('Invalid response from server');
                return;
            }

            if( res.error )
            {
                setError(res.error);
                return;
            }

            setCode(trimmedCode);
            setInfo(res.message ?? 'Code verified. Enter your new password.');
            setStep('reset');
        }
        catch(error:any)
        {
            console.error('Verify password reset code error:', error);
            if( error.name === 'TypeError' && error.message.includes('fetch') )
            {
                setError('Cannot connect to server. Please check if the backend is running.');
            }
            else if( error.message.includes('HTTP error') )
            {
                setError(`Server error: ${error.message}`);
            }
            else
            {
                setError('Network error. Please try again.');
            }
        }
        finally
        {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) =>
    {
        event.preventDefault();
        resetFeedback();

        const trimmedEmail = email.trim();
        const trimmedCode = code.trim();
        const trimmedPassword = newPassword.trim();
        const trimmedConfirm = confirmPassword.trim();

        if( trimmedEmail.length === 0 || trimmedCode.length === 0 )
        {
            setError('Email and reset code are required.');
            return;
        }

        if( trimmedPassword.length === 0 || trimmedConfirm.length === 0 )
        {
            setError('Please enter your new password twice.');
            return;
        }

        if( trimmedPassword !== trimmedConfirm )
        {
            setError('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try
        {
            const response = await fetch(buildPath('api/reset-password'),
            {
                method:'POST',
                headers:
                {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ login: trimmedEmail, code: trimmedCode, newPassword: trimmedPassword })
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
                console.error('Failed to parse reset password response:', parseError);
                setError('Invalid response from server');
                return;
            }

            if( res.error )
            {
                setError(res.error);
                return;
            }

            setInfo(res.message ?? 'Password updated successfully. Redirecting to sign in...');
            setNewPassword('');
            setConfirmPassword('');

            setTimeout(() =>
            {
                navigate('/');
            }, 1600);
        }
        catch(error:any)
        {
            console.error('Reset password error:', error);
            if( error.name === 'TypeError' && error.message.includes('fetch') )
            {
                setError('Cannot connect to server. Please check if the backend is running.');
            }
            else if( error.message.includes('HTTP error') )
            {
                setError(`Server error: ${error.message}`);
            }
            else
            {
                setError('Network error. Please try again.');
            }
        }
        finally
        {
            setIsSubmitting(false);
        }
    };

    const submitHandlers: Record<Step, (event: React.FormEvent<HTMLFormElement>) => Promise<void>> = {
        email: handleSubmitEmail,
        code: handleVerifyCode,
        reset: handleResetPassword
    };

    const currentSubmitHandler = submitHandlers[step];
    const stepNumber = step === 'email' ? 1 : step === 'code' ? 2 : 3;

    const renderEmailInput = (disabled: boolean) => (
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
                disabled={disabled}
                required
            />
        </div>
    );

    const renderCodeInput = () => (
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
                placeholder="Reset Code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className="login-input"
                required
                disabled={step === 'reset'}
            />
        </div>
    );

    const renderPasswordInput = (label: 'new' | 'confirm') =>
    {
        const isNew = label === 'new';
        const value = isNew ? newPassword : confirmPassword;
        const setValue = isNew ? setNewPassword : setConfirmPassword;
        const show = isNew ? showPassword : showConfirmPassword;
        const setShow = isNew ? setShowPassword : setShowConfirmPassword;
        const placeholder = isNew ? 'New Password' : 'Confirm New Password';

        return (
            <div className="input-group">
                <div className="input-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 8V6C5 3.79086 6.79086 2 9 2H11C13.2091 2 15 3.79086 15 6V8M5 8H15M5 8C3.89543 8 3 8.89543 3 10V16C3 17.1046 3.89543 18 5 18H15C16.1046 18 17 17.1046 17 16V10C17 8.89543 16.1046 8 15 8" stroke="#9CA3AF" strokeWidth="2"/>
                    </svg>
                </div>
                <input
                    type={show ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    className="login-input"
                    required
                    autoComplete="new-password"
                />
                <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShow(!show)}
                    aria-label={`Toggle ${placeholder.toLowerCase()} visibility`}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {show ? (
                            <path d="M3.98 8.223A10.477 10.477 0 001.934 10c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        ) : (
                            <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                    </svg>
                </button>
            </div>
        );
    };

    const getPrimaryButtonLabel = () =>
    {
        if( step === 'email' )
        {
            return isSubmitting ? 'Sending Code...' : 'Send Reset Code';
        }
        if( step === 'code' )
        {
            return isSubmitting ? 'Verifying...' : 'Verify Code';
        }
        return isSubmitting ? 'Updating...' : 'Update Password';
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="app-logo">
                    <img src={logo} alt="P3 logo" />
                </div>

                <h1 className="welcome-title">Reset Password</h1>
                <p className="login-subtitle">{stepSubtitles[step]}</p>
                <div className="step-indicator">Step {stepNumber} of 3 - {stepTitles[step]}</div>

                <form onSubmit={currentSubmitHandler} className="login-form">
                    {renderEmailInput(step !== 'email')}

                    {step !== 'email' && (
                        <>
                            {renderCodeInput()}
                            {step === 'reset' && (
                                <>
                                    {renderPasswordInput('new')}
                                    {renderPasswordInput('confirm')}
                                </>
                            )}
                        </>
                    )}

                    {error && <div className="error-message">{error}</div>}
                    {info && <div className="success-message">{info}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                    >
                        {getPrimaryButtonLabel()}
                    </button>

                    {step === 'code' && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleResendCode}
                            disabled={isResending}
                        >
                            {isResending ? 'Resending...' : 'Resend Code'}
                        </button>
                    )}

                    {step !== 'email' && (
                        <button
                            type="button"
                            className="btn btn-link"
                            onClick={handleUseDifferentEmail}
                        >
                            Use a different email
                        </button>
                    )}

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

export default ForgotPassword;
