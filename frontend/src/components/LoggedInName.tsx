function LoggedInName()
{
    var user_data = localStorage.getItem('user_data');
    var ud = JSON.parse( user_data as string );
    var firstName : string = ud.firstName;
    var lastName : string = ud.lastName;

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
