import React, { useState, useEffect } from 'react';
import { buildPath } from './Path.ts';
import { retrieveToken, storeToken } from '../tokenStorage.ts';

type FriendUIProps = {
    className?: string;
};

function FriendUI({ className = '' }: FriendUIProps)
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
    const [nickname,setNickname] = React.useState('');
    const [friendList, setFriendList] = useState<any[]>([]); // stores friends in a list
    const [allFriends, setAllFriends] = useState<any[]>([]);

    // Pagination state for friend search results
    const [currentFriendSearchPage, setCurrentFriendSearchPage] = useState(1);
    const [friendSearchPerPage] = useState(2); // Set to 2 for testing pagination with current data
    
    // Pagination state for all friends list
    const [currentAllFriendsPage, setCurrentAllFriendsPage] = useState(1);
    const [allFriendsPerPage] = useState(3); // Set to 3 for testing pagination with current data

    useEffect(() => {
        loadAllFriends();
    }, []);
    
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

        var obj = {friend_id: friendId, nickname: nickname, userId: userId, jwtToken:retrieveToken()};
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
                setMessage( res.error );
                handleTokenExpiration(res.error);
                
                // Clear form fields if already friends (since it's a valid attempt but relationship already exists)
                if( res.error.includes('Already Friends') || res.error.includes('already friends') )
                {
                    setFriendId('');
                    setNickname('');
                }
                return;
            }
            else
            {
                setMessage('Friend has been added');
                storeToken( res.jwtToken );
                await loadAllFriends();
                
                // Clear all form fields after successful addition
                setFriendId('');
                setNickname('');
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
            setCurrentFriendSearchPage(1); // Reset to first page when new search is performed
        
            if(_results && _results.length > 0)
            {
                setResults(`Found ${_results.length} friend(s)`);
            }
            else
            {
                setResults('No friends found');
            }
            storeToken( res.jwtToken );
            await loadAllFriends();
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
        setFriendList(prev => prev.filter(e => e._id !== _id));
        setAllFriends(prev => prev.filter(friend => friend._id !== _id));
        await loadAllFriends();
    };

    function populateFriend(_id:string, friend_id:string, nickname:string) : void
    {
        setId( _id );
        setFriendId( friend_id );
        setNickname( nickname );
    }

    function clearEdit() : void
    {
        setId( '' );
        setFriendId( '' );
        setNickname( '' );
    }

    async function editFriend(e:any) : Promise<void>
    {
        e.preventDefault();

        if(!id)
        {
            setMessage('Friend not selected');
            return;
        }

        var obj = {_id:id,userId:userId,friend_id:friendId,nickname:nickname,jwtToken:retrieveToken()};
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
                await loadAllFriends();

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
    function handleSetNickname( e:any ) : void
    {
        setNickname( e.target.value );
    }

    async function loadAllFriends() : Promise<void>
    {
        const obj = {userId:userId,search:'',jwtToken:retrieveToken()};
        const js = JSON.stringify(obj);

        try
        {
            const response = await fetch(buildPath('api/searchfriend'),
            {method:'POST',body:js,headers:{'Content-Type':
            'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);

            if( res.error &&res.error.length > 0 )
            {
                handleTokenExpiration(res.error);
                return;
            }

            const results = Array.isArray(res.results) ? res.results : [];
            setAllFriends(results);
            if(res.jwtToken)
            {
                storeToken(res.jwtToken);
            }
        }
        catch(error:any)
        {
            console.log(error.toString());
        }
    }

    // Friend search results pagination functions
    const totalFriendSearchPages = Math.ceil(friendList.length / friendSearchPerPage);
    const friendSearchStartIndex = (currentFriendSearchPage - 1) * friendSearchPerPage;
    const friendSearchEndIndex = friendSearchStartIndex + friendSearchPerPage;
    const currentPageFriendSearch = friendList.slice(friendSearchStartIndex, friendSearchEndIndex);

    const goToFriendSearchPage = (page: number) => {
        if (page >= 1 && page <= totalFriendSearchPages) {
            setCurrentFriendSearchPage(page);
        }
    };

    const goToPreviousFriendSearchPage = () => {
        if (currentFriendSearchPage > 1) {
            setCurrentFriendSearchPage(currentFriendSearchPage - 1);
        }
    };

    const goToNextFriendSearchPage = () => {
        if (currentFriendSearchPage < totalFriendSearchPages) {
            setCurrentFriendSearchPage(currentFriendSearchPage + 1);
        }
    };

    // All friends list pagination functions
    const totalAllFriendsPages = Math.ceil(allFriends.length / allFriendsPerPage);
    const allFriendsStartIndex = (currentAllFriendsPage - 1) * allFriendsPerPage;
    const allFriendsEndIndex = allFriendsStartIndex + allFriendsPerPage;
    const currentPageAllFriends = allFriends.slice(allFriendsStartIndex, allFriendsEndIndex);

    const goToAllFriendsPage = (page: number) => {
        if (page >= 1 && page <= totalAllFriendsPages) {
            setCurrentAllFriendsPage(page);
        }
    };

    const goToPreviousAllFriendsPage = () => {
        if (currentAllFriendsPage > 1) {
            setCurrentAllFriendsPage(currentAllFriendsPage - 1);
        }
    };

    const goToNextAllFriendsPage = () => {
        if (currentAllFriendsPage < totalAllFriendsPages) {
            setCurrentAllFriendsPage(currentAllFriendsPage + 1);
        }
    };

    return(
        <>
        <div id="FriendUIDiv" className={`card-section ${className}`.trim()}>
            <div className="section-heading">Friends</div>
            <div className="subheading">Search</div>
            <div className="search-row">
                <input type="text" id="friendSearchInput" placeholder="Friend To Search For"
                onChange={handleSearchTextChange} />
                <button type="button" id="searchCardButton" className="buttons"
                onClick={searchFriend}>Search Friend</button>
            </div>
            <span id="cardSearchResult">
                {searchResults}
                {friendList.length > friendSearchPerPage && (
                    <span> - Showing {Math.min(friendSearchStartIndex + 1, friendList.length)}-{Math.min(friendSearchEndIndex, friendList.length)} of {friendList.length} (Page {currentFriendSearchPage} of {totalFriendSearchPages})</span>
                )}
            </span>
            {friendList.length > 0 && (
                <div id="searchResultsList">
                    {currentPageFriendSearch.map((friend, index) => (
                        <div key={index} style={{border: '1px solid #ccc', margin: '10px', padding: '10px'}}>
                            <p><strong>FriendID:</strong> {friend.friend_id}</p>
                            <p><strong>Nickname:</strong> {friend.Nickname}</p>
                            <p><strong>First Name:</strong> {friend.FirstName}</p>
                            <p><strong>Last Name:</strong> {friend.LastName}</p>
                            <button type="button" id="deleteFriendButton" className="buttons"
                            onClick={() => deleteFriend(friend._id,friend.userId)}> Delete Friend </button><br /><br />
                            <button type="button" id="populateEditFriend" className="buttons"
                            onClick={() => populateFriend(friend._id,friend.friend_id,friend.nickname)}> Edit Friend </button><br />
                        </div>
                    ))}
                    
                    {/* Friend Search Pagination Controls */}
                    {totalFriendSearchPages > 1 && (
                        <div className="pagination-controls friend-search-pagination">
                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={goToPreviousFriendSearchPage}
                                disabled={currentFriendSearchPage === 1}
                            >
                                Previous
                            </button>
                            
                            <div className="page-numbers">
                                {Array.from({ length: totalFriendSearchPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        type="button"
                                        className={`page-number ${page === currentFriendSearchPage ? 'active' : ''}`}
                                        onClick={() => goToFriendSearchPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            
                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={goToNextFriendSearchPage}
                                disabled={currentFriendSearchPage === totalFriendSearchPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
            <div className="subheading">Add / Edit Friend</div>
            <input type="text" id="cardText" placeholder="FriendID" value={friendId}
            onChange={handleSetFriendId} />
            <input type="text" id="cardText" placeholder="Nickname" value={nickname}
            onChange={handleSetNickname} />
            <div className="form-actions">
                <button type="button" id="addFriendButton" className="buttons"
                onClick={addFriend}>Add Friend</button>
                <button type="button" id="editFriendButton" className="buttons"
                onClick={editFriend}>Edit Friend</button>
            </div>
            <span id="cardAddResult">{message}</span>
        </div>
        <section className="card-section friends-card">
            <div className="section-heading">
                Friends List
                {allFriends.length > allFriendsPerPage && (
                    <span style={{ fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '8px' }}>
                        - Showing {Math.min(allFriendsStartIndex + 1, allFriends.length)}-{Math.min(allFriendsEndIndex, allFriends.length)} of {allFriends.length} (Page {currentAllFriendsPage} of {totalAllFriendsPages})
                    </span>
                )}
            </div>
            {allFriends.length === 0 ? (
                <p className="empty-state">No friends yet. Add one using the card above.</p>
            ) : (
                <div className="friends-list">
                    {currentPageAllFriends.map((friend, index) => (
                        <div key={friend._id ?? index} className="friend-item">
                            <div className="friend-item-header">
                                <span className="friend-item-name">{friend.FirstName} {friend.LastName}</span>
                                <span className="friend-item-id">ID: {friend.friend_id}</span>
                            </div>
                            <div className="friend-item-actions">
                                <button
                                    type="button"
                                    className="buttons"
                                    onClick={() => populateFriend(friend._id, friend.friend_id, friend.nickname)}
                                >
                                    Edit Friend
                                </button>
                                <button
                                    type="button"
                                    className="buttons danger"
                                    onClick={() => deleteFriend(friend._id, friend.userId)}
                                >
                                    Delete Friend
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {/* All Friends Pagination Controls */}
                    {totalAllFriendsPages > 1 && (
                        <div className="pagination-controls friends-list-pagination">
                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={goToPreviousAllFriendsPage}
                                disabled={currentAllFriendsPage === 1}
                            >
                                Previous
                            </button>
                            
                            <div className="page-numbers">
                                {Array.from({ length: totalAllFriendsPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        type="button"
                                        className={`page-number ${page === currentAllFriendsPage ? 'active' : ''}`}
                                        onClick={() => goToAllFriendsPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            
                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={goToNextAllFriendsPage}
                                disabled={currentAllFriendsPage === totalAllFriendsPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
        </>
    );
}
export default FriendUI;
