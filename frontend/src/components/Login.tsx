import React, { useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { storeToken, } from '../tokenStorage.ts';
import { buildPath } from './Path.ts';
import './Login.css';
import logo from '../assets/p3-logo.svg';

interface JwtPayload 
{
    userId: string;
    firstName: string;
    lastName: string;
}

function Login()
{

    const [message,setMessage] = useState('');
    const [loginName,setLoginName] = React.useState('');
    const [loginPassword,setLoginPassword] = React.useState('');
    const [showPassword, setShowPassword] = useState(false);

    const doLogin = async (event: React.FormEvent) =>
    {
        event.preventDefault();

        const obj = {login:loginName,password:loginPassword};
        const js = JSON.stringify(obj);

        try
        {
            console.log('Sending login request to:', buildPath('api/login'));

            const response = await fetch(buildPath('api/login'), 
            {
                method: 'POST', 
                body: js, 
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Login response status:', response.status);
            console.log('Login response ok:', response.ok);

            if (!response.ok) 
            {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const responseText = await response.text();
            console.log('Login response text:', responseText);

            let res;
            try 
            {
                res = JSON.parse(responseText);
            }
            catch (parseError) 
            {
                console.error('Failed to parse login JSON:', parseError);
                setMessage('Invalid response from server');
                return;
            }
            
            if (res.error && res.error.length > 0) {
                setMessage(res.error);
                return;
            }

            // Check if we have an access token
            if (!res.accessToken) {
                console.error('No access token in response:', res);
                setMessage('Signup successful but no token received');
                return;
            }
            
            const { accessToken } = res;
            storeToken( res );

            try
            {
                const decoded = jwtDecode<JwtPayload>(accessToken);
                console.log('Decoded token:', decoded);

                var userId = decoded.userId;
                var userfirstName = decoded.firstName;
                var userlastName = decoded.lastName;

                if ( userId.length <= 0 )
                {
                    setMessage('User/Password combination incorrect');
                }
                else
                {
                    const user = 
                    {
                        firstName: userfirstName, 
                        lastName: userlastName, 
                        id: userId
                    };
                    localStorage.setItem('user_data', JSON.stringify(user));
                    
                    setMessage('Account login successful!');
                    setTimeout(() => {
                        window.location.href = '/calendar';
                        setMessage('');
                    }, 1000);
                }
            }
            catch(tokenError) 
            {
                console.error('Token decode error:', tokenError);
                setMessage('Account created but login failed. Please try logging in.');
                return;
            }
        }
        catch(error:any)
        {
            console.error('Signup error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setMessage('Cannot connect to server. Please check if the backend is running.');
            } else if (error.message.includes('HTTP error')) {
                setMessage(`Server error: ${error.message}`);
            } else {
                setMessage('Network error. Please try again.');
            }
            return;
        }
    }

    function handleSetLoginName( e: any ) : void
    {
        setLoginName(e.target.value);
    }
    function handleSetLoginPassword( e: any ) : void
    {
        setLoginPassword(e.target.value);
    }
    function handleSetShowPassword() : void
    {
        setShowPassword(!showPassword);
    }

    const handleCalendarTest = () => {
        // Navigate to calendar test page
        window.location.href = '/calendar';
    }

    const handleLoadingTest = () => {
        // Placeholder for loading test functionality
        setMessage('Loading test functionality');
    }

    return(
        <div className="login-container">
            <div className="login-card">
                <div className="app-logo">
                    <img src={logo} alt="P3 logo" />
                </div>
                
                <h1 className="welcome-title">Welcome</h1>
                
                <form onSubmit={doLogin} className="login-form">
                    <div className="input-group">
                        <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V5Z" stroke="#9CA3AF" strokeWidth="2"/>
                                <path d="M3 7L10 11L17 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Email" 
                            value={loginName}
                            onChange={handleSetLoginName}
                            className="login-input"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 8V6C5 3.79086 6.79086 2 9 2H11C13.2091 2 15 3.79086 15 6V8M5 8H15M5 8C3.89543 8 3 8.89543 3 10V16C3 17.1046 3.89543 18 5 18H15C16.1046 18 17 17.1046 17 16V10C17 8.89543 16.1046 8 15 8" stroke="#9CA3AF" strokeWidth="2"/>
                            </svg>
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"}
                            placeholder="Password" 
                            value={loginPassword}
                            onChange={handleSetLoginPassword}
                            className="login-input"
                            required
                        />
                        <button 
                            type="button"
                            className="password-toggle"
                            onClick={handleSetShowPassword}
                            aria-label="Toggle password visibility"
                        >
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {showPassword ? (
                                    <path d="M3.98 8.223A10.477 10.477 0 001.934 10c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                ) : (
                                    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                )}
                            </svg>
                        </button>
                    </div>

                    {message && <div className="error-message">{message}</div>}

                    <button 
                        type="submit" 
                        className="btn btn-primary"
                    >
                        Sign In
                    </button>

                    <button 
                        type="button"
                        className="btn btn-secondary"
                        onClick={(e) => { e.preventDefault(); window.location.href = '/signup'; }}
                    >
                        Sign Up
                    </button>

                    <a href="#" className="forgot-password">
                        Forgot Password?
                    </a>

                    <div className="test-buttons">
                        <button 
                            type="button"
                            className="btn btn-test"
                            onClick={handleCalendarTest}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 5.33333C2 4.59695 2.59695 4 3.33333 4H12.6667C13.403 4 14 4.59695 14 5.33333V12.6667C14 13.403 13.403 14 12.6667 14H3.33333C2.59695 14 2 13.403 2 12.6667V5.33333Z" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M10.6667 2V5.33333M5.33333 2V5.33333M2 7.33333H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            Calendar (Test)
                        </button>

                        <button 
                            type="button"
                            className="btn btn-test"
                            onClick={handleLoadingTest}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 4"/>
                            </svg>
                            Loading (Test)
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default Login;
