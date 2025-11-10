import { jwtDecode } from 'jwt-decode';

interface JwtPayload
{
    firstName: string;
    lastName: string;
}

function LoggedInName()
{
    var user_data = localStorage.getItem('user_data');
    var ud = JSON.parse( user_data as string );

    if ( !ud )
    {
        try
        {
            const token = localStorage.getItem('access_token');
            if (token)
            {
                const decoded = jwtDecode<JwtPayload>(token);
                var firstName : string = decoded.firstName;
                var lastName : string = decoded.lastName;
            }
            else
            {
                console.error('Error decoding token:', 'No token found');
                alert('Session has expired. Please log in again.');
                localStorage.removeItem('token_data');
                localStorage.removeItem('user_data');
                window.location.href = '/';
                return;
            }
        }
        catch(e)
        {
            console.error('Error decoding token:', e);
            alert('Session has expired. Please log in again.');
            localStorage.removeItem('token_data');
            localStorage.removeItem('user_data');
            window.location.href = '/';
            return;
        }
    }
    else
    {
        var firstName : string = ud.firstName;
        var lastName : string = ud.lastName;
    }

    function doLogout(event:any) : void
    {
        event.preventDefault();

        localStorage.removeItem("user_data")
        window.location.href = '/';
    };

    return(
        <div id="loggedInDiv" className="calendar-user">
            <span id="userName">Logged In As {firstName} {lastName}</span>
            <button type="button" id="logoutButton" className="buttons"
            onClick={doLogout}> Log Out </button>
        </div>
    );
};
export default LoggedInName;
