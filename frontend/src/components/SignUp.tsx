import React, { useState } from 'react';
import { buildPath } from './Path.ts';
import { storeToken } from '../tokenStorage.ts';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload
{
    id: string;
    firstName: string;
    lastName: string;
}

function SignUp()
{
    const [message,setMessage] = useState('');
    const [login,setLogin] = React.useState('');
    const [password,setPassword] = React.useState('');
    const [firstName,setFirstName] = React.useState('');
    const [lastName,setLastName] = React.useState('');

    async function doSignUp(e:any) : Promise<void>
    {
        e.preventDefault();

        var obj = {Login:login,Password:password,FirstName:firstName,LastName:lastName};
        var js = JSON.stringify(obj);

        try
        {
            const response = await
            fetch(buildPath('api/signup'),
            {method:'POST',body:js,headers:{'Content-Type':
            'application/json'}});

            var res = JSON.parse(await response.text());
            
            if( res.error && res.error.length > 0 )
            {
                setMessage( "API Error: " + res.error );
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
                {firstName:userfirstName,lastName:userlastName,id:userId}
                localStorage.setItem('user_data', JSON.stringify(user));
                
                setMessage('');
                window.location.href = '/calendar';
            }
            catch(e)
            {
                console.log(e);
                return;
            }
        }
        catch(error:any)
        {
            alert(error.toString());
            return;
        }
    };

    function handleSetLogin( e: any ) : void
    {
        setLogin( e.target.value );
    }
    function handleSetPassword( e: any ) : void
    {
        setPassword( e.target.value );
    }
    function handleSetFirstName( e: any ) : void
    {
        setFirstName( e.target.value );
    }
    function handleSetLastName( e: any ) : void
    {
        setLastName( e.target.value );
    }

    return(
        <div id="signUpDiv">
            <span id="inner-title">PLEASE SIGN UP</span><br />
            Login: <input type="text" id="loginName" placeholder="Username"
            onChange={handleSetLogin} /><br />
            Password: <input type="password" id="loginPassword" placeholder="Password"
            onChange={handleSetPassword} /><br />
            FirstName: <input type="text" id="firstName" placeholder="First Name"
            onChange={handleSetFirstName} /><br />
            LastName: <input type="text" id="lastName" placeholder="Last Name"
            onChange={handleSetLastName} /><br />
            <input type="submit" id="signUpButton" className="buttons" value = "Do It"
            onClick={doSignUp} /><br />
            <input type="button" id="signUpButton" className="buttons" value = "Go Back"
            onClick={ (e) => { e.preventDefault(); window.location.href = '/'; } } /><br />
            <span id="loginResult">{message}</span>
        </div>
    );
}

export default SignUp;