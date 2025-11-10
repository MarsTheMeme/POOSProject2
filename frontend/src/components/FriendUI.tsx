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
    let friend_id : string = ud.friend_id;
    // var firstName = ud.firstName;
    // var lastName = ud.lastName;
    const [message,setMessage] = useState('');
    const [messageVisible, setMessageVisible] = useState(false);
    const [id, setId] = React.useState('');
    const [friendId,setFriendId] = React.useState('');
    const [nickname,setNickname] = React.useState('');
    const [allFriends, setAllFriends] = useState<any[]>([]);
    const [friendCode, setFriendCode] = useState('');
    
    // Pagination state for all friends list
    const [currentAllFriendsPage, setCurrentAllFriendsPage] = useState(1);
    const [allFriendsPerPage] = useState(3); // Set to 3 for testing pagination with current data
    
    // Search state for friends list
    const [friendsListSearch, setFriendsListSearch] = useState('');

    // Function to set message with fade in/out animation
    const setTemporaryMessage = (msg: string) => {
        setMessage(msg);
        setMessageVisible(true);
        
        // Fade out after 2.5 seconds (250ms before the 3-second total)
        setTimeout(() => {
            setMessageVisible(false);
        }, 2750);
        
        // Clear message after fade out completes
        setTimeout(() => {
            setMessage('');
        }, 3000);
    };

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
                setTemporaryMessage( res.error );
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
                setTemporaryMessage('Friend has been added');
                storeToken( res.jwtToken );
                await loadAllFriends();
                
                // Clear all form fields after successful addition
                setFriendId('');
                setNickname('');
            }
        }
        catch(error:any)
        {
            setTemporaryMessage(error.toString());
        }
    };



    async function deleteFriend(_id:string,userId:string) : Promise<void>
    {
        //e.preventDefault();

        var obj = {_id:_id,userId:userId,jwtToken:retrieveToken()};
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
            setTemporaryMessage(error.toString());
        }
        setAllFriends(prev => prev.filter(friend => friend._id !== _id));
        await loadAllFriends();
    };

    function populateFriend(_id:string, friend_id:string, nickname:string) : void
    {
        setId( _id );
        setFriendId( friend_id );
        setNickname( nickname );
        
        // Scroll to the Friends section header
        setTimeout(() => {
            const friendUIDiv = document.getElementById('FriendUIDiv');
            if (friendUIDiv) {
                friendUIDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100); // Small delay to ensure state updates are complete
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
            setTemporaryMessage('Friend not selected');
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
                setTemporaryMessage( "API Error:" + res.error );
            }
            else
            {
                setTemporaryMessage('Friend has been edited');
                storeToken( res.jwtToken );
                clearEdit();
                

                await loadAllFriends();

            }
        }
        catch(error:any)
        {
            setTemporaryMessage(error.toString());
        }
    };


    function handleSetFriendId( e: any ) : void
    {
        setFriendId( e.target.value );
    }
    function handleSetNickname( e:any ) : void
    {
        setNickname( e.target.value );
    }

    function handleFriendsListSearch( e: any ) : void
    {
        setFriendsListSearch( e.target.value );
        setCurrentAllFriendsPage(1); // Reset to first page when searching
    }

    async function handleFriendAction(e:any) : Promise<void>
    {
        if (id) {
            // If id exists, we're editing
            await editFriend(e);
        } else {
            // If no id, we're adding
            await addFriend(e);
        }
    }

    function toggleFriendCode() : void
    {
        // Toggle between showing and hiding the friend code
        if (friendCode) {
            setFriendCode(''); // Hide the code
        } else {
            setFriendCode(friend_id); // Show the user's FriendID
        }
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



    // All friends list pagination functions with search filtering
    const filteredAllFriends = allFriends.filter(friend => {
        if (!friendsListSearch) return true;
        const searchLower = friendsListSearch.toLowerCase();
        return (
            friend.FirstName?.toLowerCase().includes(searchLower) ||
            friend.LastName?.toLowerCase().includes(searchLower) ||
            friend.nickname?.toLowerCase().includes(searchLower) ||
            friend.friend_id?.toLowerCase().includes(searchLower)
        );
    });
    
    const totalAllFriendsPages = Math.ceil(filteredAllFriends.length / allFriendsPerPage);
    const allFriendsStartIndex = (currentAllFriendsPage - 1) * allFriendsPerPage;
    const allFriendsEndIndex = allFriendsStartIndex + allFriendsPerPage;
    const currentPageAllFriends = filteredAllFriends.slice(allFriendsStartIndex, allFriendsEndIndex);

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

            <div className="subheading">Add / Edit Friend</div>
            <input type="text" id="cardText" placeholder="FriendID" value={friendId}
            onChange={handleSetFriendId} />
            <input type="text" id="cardText" placeholder="Nickname" value={nickname}
            onChange={handleSetNickname} />
            <div className="form-actions">
                <button type="button" id="friendActionButton" className="buttons"
                onClick={async (e) => {
                    await handleFriendAction(e);
                    // Notify parent to reload friends
                    window.dispatchEvent(new CustomEvent('friendsUpdated'));
                }}>
                    {id ? 'Edit Friend' : 'Add Friend'}
                </button>
                {id && (
                    <button type="button" id="cancelEditButton" className="buttons"
                    onClick={clearEdit}>Cancel</button>
                )}
            </div>
            <span 
                id="cardAddResult" 
                style={{ 
                    opacity: messageVisible ? 1 : 0, 
                    transition: 'opacity 0.25s ease-in-out' 
                }}
            >
                {message}
            </span>
            
            <div className="subheading">Your Friend Code</div>
            <div className="form-actions">
                <button type="button" id="toggleFriendCodeButton" className="buttons"
                onClick={toggleFriendCode}>
                    {friendCode ? 'Hide My Code' : 'Show My Code'}
                </button>
            </div>
            {friendCode && (
                <div className="friend-code-display">
                    <strong>Your Friend ID: </strong>
                    <span className="friend-code">{friendCode}</span>
                </div>
            )}
        </div>
        <section className="card-section friends-card">
            <div className="section-heading">
                Friends List
                {filteredAllFriends.length > allFriendsPerPage && (
                    <span style={{ fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '8px' }}>
                        - Showing {Math.min(allFriendsStartIndex + 1, filteredAllFriends.length)}-{Math.min(allFriendsEndIndex, filteredAllFriends.length)} of {filteredAllFriends.length} (Page {currentAllFriendsPage} of {totalAllFriendsPages})
                        {friendsListSearch && ` (filtered from ${allFriends.length} total)`}
                    </span>
                )}
            </div>
            
            {/* Friends List Search Bar */}
            <div className="search-container" style={{ marginBottom: '16px' }}>
                <input 
                    type="text" 
                    placeholder="Search friends by name, nickname, or ID..." 
                    value={friendsListSearch}
                    onChange={handleFriendsListSearch}
                    className="search-input"
                />
            </div>
            {allFriends.length === 0 ? (
                <p className="empty-state">No friends yet. Add one using the card above.</p>
            ) : filteredAllFriends.length === 0 ? (
                <p className="empty-state">No friends found matching "{friendsListSearch}". Try a different search term.</p>
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
                                    onClick={async () => {
                                        await deleteFriend(friend._id, friend.userId);
                                        // Notify parent to reload friends
                                        window.dispatchEvent(new CustomEvent('friendsUpdated'));
                                    }}
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
