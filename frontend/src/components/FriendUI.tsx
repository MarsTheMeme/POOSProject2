import React, { useState } from 'react';
import { buildPath } from './Path.ts';
import { retrieveToken, storeToken } from '../tokenStorage.ts';

function FriendUI()
{
    let _ud : any = localStorage.getItem('user_data');
    let ud = JSON.parse( _ud );
    let userId : string = ud.id; // id from local Login/Signup tsx
    // let _id : string;
    // var firstName = ud.firstName;
    // var lastName = ud.lastName;
    const [message,setMessage] = useState('');
    const [searchResults,setResults] = useState('');
    const [search,setSearchValue] = React.useState('');
    const [id, setId] = React.useState('');
    const [friendId,setFriendId] = React.useState('');
    const [firstName,setFirstName] = React.useState('');
    const [lastName,setLastName] = React.useState('');
    const [friendList, setFriendList] = useState<any[]>([]); // stores friends in a list
    
    function handleTokenExpiration(error: string) : void
    {
        if (error === 'The JWT is no longer valid' ) 
        {
            alert('Session has expired. Please log in again.');
            localStorage.removeItem('token_data');
            localStorage.removeItem('user_data');
            window.location.href = '/';
        }
    }

    async function addFriend(e:any) : Promise<void>
    {
        e.preventDefault();

        var obj = {friend_id: friendId, firstName: firstName, lastName: lastName, userId: userId, jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);

        try
        {
            const response = await
            fetch(buildPath('api/addfriend'),
            {method:'POST',body:js,headers:{'Content-Type':
            'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);

            if( res.error &&res.error.length > 0 )
            {
                handleTokenExpiration(res.error);
                return;
            }

            if( res.error.length > 0 )
            {
                setMessage( "API Error:" + res.error );
            }
            else
            {
                setMessage('Friend has been added');
                storeToken( res.jwtToken );
            }
        }
        catch(error:any)
        {
            setMessage(error.toString());
        }
    };

    async function searchFriend(e:any) : Promise<void>
    {
        e.preventDefault();

        var obj = {userId:userId,search:search,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);
        

        try
        {
            const response = await
            fetch(buildPath('api/searchfriend'),
            {method:'POST',body:js,headers:{'Content-Type':
            'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);

            if( res.error &&res.error.length > 0 )
            {
                handleTokenExpiration(res.error);
                return;
            }

            let _results = res.results;

            setFriendList(_results);
        
            if(_results && _results.length > 0)
            {
                setResults(`Found ${_results.length} friend(s)`);
            }
            else
            {
                setResults('No friends found');
            }
            storeToken( res.jwtToken );
        }
        catch(error:any)
        {
            alert(error.toString());
            setResults(error.toString());
        }
    };

    async function deleteFriend(_id:string,userId:string) : Promise<void>
    {
        //e.preventDefault();

        var obj = {_id:_id,userId:userId,search:search,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);
        
        try
        {
            const response = await
            fetch(buildPath('api/deletefriend'),
            {method:'POST',body:js,headers:{'Content-Type':
            'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);
            
            if( res.error &&res.error.length > 0 )
            {
                handleTokenExpiration(res.error);
                return;
            }

            storeToken( res.jwtToken );
        }
        catch(error:any)
        {
            alert(error.toString());
            setResults(error.toString());
        }
        setFriendList(friendList.filter(e => e._id !== _id));
    };

    function populateFriend(_id:string, friend_id:string, firstName:string, lastName:string) : void
    {
        setId( _id );
        setFriendId( friend_id );
        setFirstName( firstName );
        setLastName( lastName );
    }

    function clearEdit() : void
    {
        setId( '' );
        setFriendId( '' );
        setFirstName( '' );
        setLastName( '' );
    }

    async function editFriend(e:any) : Promise<void>
    {
        e.preventDefault();

        if(!id)
        {
            setMessage('Friend not selected');
            return;
        }

        var obj = {_id:id,userId:userId,friend_id:friendId,firstName:firstName,lastName:lastName,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);

        try
        {
            const response = await
            fetch(buildPath('api/editfriend'),
            {method:'POST',body:js,headers:{'Content-Type':
            'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);

            if( res.error &&res.error.length > 0 )
            {
                handleTokenExpiration(res.error);
                return;
            }

            if( res.error.length > 0 )
            {
                setMessage( "API Error:" + res.error );
            }
            else
            {
                setMessage('Friend has been edited');
                storeToken( res.jwtToken );
                clearEdit();
                
                // recall searchFriend (need fake friend for preventDefault to not cause errors)
                await searchFriend({preventDefault: () => {}});

            }
        }
        catch(error:any)
        {
            setMessage(error.toString());
        }
    };

    function handleSearchTextChange( e: any ) : void
    {
        setSearchValue( e.target.value );
    }
    function handleSetFriendId( e: any ) : void
    {
        setFriendId( e.target.value );
    }
    function handleSetFirstName( e:any ) : void
    {
        setFirstName( e.target.value )
    }
    function handleSetLastName( e: any ) : void
    {
        setLastName( e.target.value );
    }

    return(
        <div id="FriendUIDiv">
            <br />
            Search: <input type="text" id="searchText" placeholder="Friend To Search For"
            onChange={handleSearchTextChange} />
            <button type="button" id="searchCardButton" className="buttons"
            onClick={searchFriend}> Search Friend</button><br />
            <span id="cardSearchResult">{searchResults}</span><br />
            {friendList.length > 0 && (
                <div id="searchResultsList">
                    {friendList.map((friend, index) => (
                        <div key={index} style={{border: '1px solid #ccc', margin: '10px', padding: '10px'}}>
                            <p><strong>FriendID:</strong> {friend.friend_id}</p>
                            <p><strong>First Name:</strong> {friend.firstName}</p>
                            <p><strong>Last Name:</strong> {friend.lastName}</p>
                            <button type="button" id="deleteFriendButton" className="buttons"
                            onClick={() => deleteFriend(friend._id,friend.userId)}> Delete Friend </button><br /><br />
                            <button type="button" id="populateEditFriend" className="buttons"
                            onClick={() => populateFriend(friend._id,friend.friend_id,friend.firstName,friend.lastName)}> Edit Friend </button><br />
                        </div>
                    ))}
                </div>
            )}
            Add/Edit: <br />
            <input type="text" id="cardText" placeholder="FriendID" value={friendId}
            onChange={handleSetFriendId} /><br />
            <input type="text" id="cardText" placeholder="First Name" value={firstName}
            onChange={handleSetFirstName} /><br />
            <input type="text" id="cardText" placeholder="Last Name" value={lastName}
            onChange={handleSetLastName} /><br />
            <button type="button" id="addFriendButton" className="buttons"
            onClick={addFriend}> Add Friend </button><br />
            <button type="button" id="editFriendButton" className="buttons"
            onClick={editFriend}> Edit Friend </button><br />
            <span id="cardAddResult">{message}</span>
        </div>
    );
}
export default FriendUI;