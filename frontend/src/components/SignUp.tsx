import React, { useState } from 'react';
import { buildPath } from './Path.ts';
import { storeToken } from '../tokenStorage.ts';
import { jwtDecode } from 'jwt-decode';
import './Login.css';

interface JwtPayload
{
    id: string;
    firstName: string;
    lastName: string;
}

function SignUp()
{
    const [message, setMessage] = useState('');
    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    async function doSignUp(e: React.FormEvent): Promise<void>
    {
        e.preventDefault();

        var obj = {Login:login, Password:password, FirstName:firstName, LastName:lastName};
        var js = JSON.stringify(obj);

        try
        {
            const response = await
            fetch(buildPath('api/signup'),
            {method:'POST', body:js, headers:{'Content-Type':
            'application/json'}});

            var res = JSON.parse(await response.text());
            
            if( res.error && res.error.length > 0 )
            {
                setMessage( res.error );
                return;
            }
            
            const { accessToken } = res;
            storeToken( res );

            const decoded = jwtDecode<JwtPayload>(accessToken);
            
            try
            {
                var ud = decoded
                var userId = ud.id;
                var userfirstName = ud.firstName;
                var userlastName = ud.lastName;

                var user =
                {firstName:userfirstName, lastName:userlastName, id:userId}
                localStorage.setItem('user_data', JSON.stringify(user));
                
                setMessage('');
                window.location.href = '/calendar';
            }
            catch(e)
            {
                console.log(e);
                setMessage('An error occurred during signup');
                return;
            }
        }
        catch(error:any)
        {
            setMessage('Network error. Please try again.');
            return;
        }
    };

    return(
        <div className="login-container">
            <div className="login-card">
                <div className="app-logo">P3</div>
                
                <h1 className="welcome-title">Create Account</h1>
                
                <form onSubmit={doSignUp} className="login-form">
                    <div className="input-group">
                        <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z" stroke="#9CA3AF" strokeWidth="2"/>
                                <path d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="First Name" 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="login-input"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 10C12.2091 10 14 8.20914 14 6C14 3.79086 12.2091 2 10 2C7.79086 2 6 3.79086 6 6C6 8.20914 7.79086 10 10 10Z" stroke="#9CA3AF" strokeWidth="2"/>
                                <path d="M4 18C4 14.6863 6.68629 12 10 12C13.3137 12 16 14.6863 16 18" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Last Name" 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="login-input"
                            required
                        />
                    </div>

                    <div className="input-group">
                        <div className="input-icon">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V15C17 16.1046 16.1046 17 15 17H5C3.89543 17 3 16.1046 3 15V5Z" stroke="#9CA3AF" strokeWidth="2"/>
                                <path d="M3 7L10 11L17 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Email/Username" 
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            required
                        />
                        <button 
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
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
                        Create Account
                    </button>

                    <button 
                        type="button"
                        className="btn btn-secondary"
                        onClick={(e) => { e.preventDefault(); window.location.href = '/'; }}
                    >
                        Back to Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default SignUp;
