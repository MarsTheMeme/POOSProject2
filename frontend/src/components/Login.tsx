import React, { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { storeToken, retrieveToken } from '../tokenStorage.ts';
import { buildPath } from './Path.ts';

interface JwtPayload {
    userId: string;
    firstName: string;
    lastName: string;
}

function Login()
{

    const [message,setMessage] = useState('');
    const [loginName,setLoginName] = React.useState('');
    const [loginPassword,setLoginPassword] = React.useState('');

    const doLogin = async (event: React.FormEvent) =>
    {
        event.preventDefault();

        var obj = {login:loginName,password:loginPassword};
        var js = JSON.stringify(obj);

        var config =
        {
            method: 'post',
            url: buildPath('api/login'),
            headers:
            {
                'Content-Type': 'application/json'
            },
            data: js
        };

        axios(config)
        .then(function (response)
        {
            var res = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            if (res.error)
            {
                setMessage('User/Password combination incorrect');
            }
            else
            {
                storeToken(res);
                var ud = jwtDecode<JwtPayload>(retrieveToken());
                var userId = ud.userId;
                var firstName = ud.firstName;
                var lastName = ud.lastName;

                var user = {firstName:firstName,lastName:lastName,id:userId}
                localStorage.setItem('user_data', JSON.stringify(user));
                window.location.href = '/calendar';
            }
        })
        .catch(function (error)
        {
        console.log(error);
        });
    }

    return(
        <div id="loginDiv">
            <span id="inner-title">PLEASE LOG IN also TestingCICD</span><br />
            <input 
                type="text" 
                id="loginName" 
                placeholder="Username" 
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)} 
            /><br />
            <input 
                type="password" 
                id="loginPassword" 
                placeholder="Password" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
            /><br />
            <input 
                type="submit" 
                id="loginButton" 
                className="buttons" 
                value="Do It"
                onClick={doLogin} 
            /><br />
            <input 
                type="submit" 
                id="signupButton" 
                className="buttons" 
                value="Sign Up"
                onClick={ (e) => { e.preventDefault(); window.location.href = '/signup'; } } 
            /><br />
            <span id="loginResult">{message}</span>
        </div>
    );
};
export default Login;