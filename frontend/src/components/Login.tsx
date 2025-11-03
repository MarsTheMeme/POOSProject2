import React, { useState } from 'react';
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

        try
        {
            const response = await
            fetch(buildPath('api/login'),
            {method:'POST',body:js,headers:{'Content-Type':
            'application/json'}});

            var res = JSON.parse(await response.text());

            const { accessToken } = res;
            storeToken( res );
            const decoded = jwtDecode<JwtPayload>(accessToken);

            try
            {
                var ud = decoded
                var userId = ud.userId;
                var firstName = ud.firstName;
                var lastName = ud.lastName;

                if ( userId.length <= 0 )
                {
                    setMessage('User/Password combination incorrect');
                }
                else
                {
                    var user = {firstName:firstName,lastName:lastName,id:userId}
                    localStorage.setItem('user_data', JSON.stringify(user));
                    window.location.href = '/calendar';
                }
            }
            catch(e)
            {
                console.log(e);
                return;
            }
        }
        catch(error:any)
        {
            setMessage(error.toString());
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

    return(
        <div id="loginDiv">
            <span id="inner-title">PLEASE LOG IN also TestingCICD</span><br />
            <input 
                type="text" 
                id="loginName" 
                placeholder="Username" 
                value={loginName}
                onChange={handleSetLoginName} 
            /><br />
            <input 
                type="password" 
                id="loginPassword" 
                placeholder="Password" 
                value={loginPassword}
                onChange={handleSetLoginPassword}
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