import React, { useState, useEffect } from 'react';
import { buildPath } from './Path.ts';
import { retrieveToken, storeToken } from '../tokenStorage.ts';

type EventRecord = {
    date?: string;
    time?: string;
};

const parseEventDateTime = (dateStr?: string, timeStr?: string): Date | null => {
    if (!dateStr) return null;

    const normalizedDate = dateStr.trim();
    const separators = normalizedDate.includes('-') ? '-' : '/';
    const dateParts = normalizedDate.split(separators).map(part => parseInt(part, 10));

    if (dateParts.length !== 3 || dateParts.some(isNaN)) {
        return null;
    }

    let [month, day, year] = dateParts;
    if (year < 100) {
        year += 2000;
    }
    let hours = 23;
    let minutes = 59;

    if (timeStr) {
        const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (match) {
            let parsedHours = parseInt(match[1], 10) % 12;
            const parsedMinutes = parseInt(match[2], 10);
            const period = match[3].toUpperCase();

            if (!Number.isNaN(parsedMinutes)) {
                minutes = parsedMinutes;
            }
            if (period === 'PM') {
                parsedHours += 12;
            }
            hours = parsedHours;
        }
    }

    return new Date(year, month - 1, day, hours, minutes, 59, 999);
};

const isEventLate = (event: EventRecord): boolean => {
    if (!event || !event.date) return false;
    const eventDate = parseEventDateTime(event.date, event.time);
    if (!eventDate) return false;
    return eventDate.getTime() < Date.now();
};

const isEventToday = (event: EventRecord): boolean => {
    if (!event || !event.date) return false;
    const eventDate = parseEventDateTime(event.date, event.time);
    if (!eventDate) return false;
    const today = new Date();
    return (
        eventDate.getFullYear() === today.getFullYear() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getDate() === today.getDate()
    );
};

type CalendarUIProps = {
    friendCard?: React.ReactNode;
};

function CalendarUI({ friendCard }: CalendarUIProps)
{
    let _ud : any = localStorage.getItem('user_data');
    let ud = JSON.parse( _ud );
    let userId : string = ud.id; // id from local Login/Signup tsx
    //let userFriendID : string = ud.friend_id;
    // let _id : string;
    // var firstName = ud.firstName;
    // var lastName = ud.lastName;
    const [message,setMessage] = useState('');
    const [searchResults,setResults] = useState('');
    const [search,setSearchValue] = React.useState('');
    const [eventId, setEventId] = React.useState('');
    const [date,setDate] = React.useState('');
    const [name,setName] = React.useState('');
    const [type,setType] = React.useState('');
    const [selectedFriends,setSelectedFriends] = React.useState<string[]>([]);
    const [notes,setNotes] = React.useState('');
    const [time,setTime] = React.useState('');
    const [eventList, setEventList] = useState<any[]>([]); // stores events in a list
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [friendList, setFriendList] = useState<any[]>([]); // stores friends in a list
    const [isSearchExpanded, setIsSearchExpanded] = useState(true);
    
    // Pagination state for search results
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(3); // Set to 3 for testing pagination with current data
    
    // Pagination state for events card
    const [currentEventsPage, setCurrentEventsPage] = useState(1);
    const [eventsPerPage] = useState(3); // Set to 3 events per page
    
    // Pagination state for friend selector
    const [currentFriendSelectorPage, setCurrentFriendSelectorPage] = useState(1);
    const [friendSelectorPerPage] = useState(3); // Set to 3 friends per page
    
    useEffect(() => {
        // Fetch friend list on component mount
        loadFriends();
        loadAllEvents();
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
    
    async function loadFriends() : Promise<void>
    {
        var obj = {userId:userId,search:'',jwtToken:retrieveToken()};
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

            setFriendList(_results || []);
            storeToken( res.jwtToken );
        }
        catch(error:any)
        {
            console.log(error.toString());
        }
    }

    async function loadAllEvents() : Promise<void>
    {
        const obj = {userId:userId,search:'',jwtToken:retrieveToken()};
        const js = JSON.stringify(obj);

        try
        {
            const response = await fetch(buildPath('api/searchevents'),
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
            setAllEvents(results);
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

    function getFriendNames(friends: any): string
    {
        if (!friends || friends.length === 0) return 'No Friends';

        if (typeof friends === 'string') 
        {
            const ids = friends.split(',');
            const names = ids.map(id => {
                const friend = friendList.find(f => f.friend_id === id);
                return friend ? `${friend.firstName} ${friend.lastName}` : id;
            });
            return names.join(', ');
        }
        
        if (Array.isArray(friends))
        {
            return friends.map(f => f.fullName).join(', ');
        }

        return 'No Friends';
    }

    async function addEvent(e:any) : Promise<void>
    {
        e.preventDefault();
        const friendsArray = selectedFriends.map(friendId => {
            const friend = friendList.find(f => f.friend_id === friendId);
            return {
                friend_id: friendId,
                fullName: friend ? `${friend.FirstName} ${friend.LastName}` : friendId
            };
        });
        var obj = {date:date,type:type,friends:friendsArray,name:name,notes:notes,userId:userId,time:time,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);

        try
        {
            const response = await
            fetch(buildPath('api/addevent'),
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
                setMessage('Event has been added');
                storeToken( res.jwtToken );
                await loadAllEvents();
                clearEdit();
            }
        }
        catch(error:any)
        {
            setMessage(error.toString());
        }
    };

    async function searchEvent(e:any) : Promise<void>
    {
        e.preventDefault();
        setIsSearchExpanded(true);

        var obj = {userId:userId,search:search,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);
        

        try
        {
            const response = await
            fetch(buildPath('api/searchevents'),
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

            setEventList(_results);
            setCurrentPage(1); // Reset to first page when new search is performed
        
            if(_results && _results.length > 0)
            {
                setResults(`Found ${_results.length} event(s)`);
            }
            else
            {
                setResults('No events found');
            }
            storeToken( res.jwtToken );
        }
        catch(error:any)
        {
            alert(error.toString());
            setResults(error.toString());
        }
    };

    async function deleteEvent(_id:string,userId:string) : Promise<void>
    {
        //e.preventDefault();

        var obj = {_id:_id,userId:userId,search:search,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);
        
        try
        {
            const response = await
            fetch(buildPath('api/deleteevent'),
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
        setEventList(prev => prev.filter(e => e._id !== _id));
        await loadAllEvents();
    };

    function populateEvent(_id:string, date:string, time:string, name:string, event_type:string, notes:string, friends:any) : void
    {
        setEventId( _id );
        setDate( date );
        setType( event_type );
        setName( name );
        setNotes (notes );
        setTime( time );

        if (Array.isArray(friends))
        {
            setSelectedFriends(friends.map(f => f.friend_id));
        }
        else if (typeof friends === 'string')
        {
            setSelectedFriends(friends ? friends.split(',') : []);
        }
        else
        {
            setSelectedFriends([]);
        }
    }

    function clearEdit() : void
    {
        setEventId( '' );
        setDate('');
        setTime('');
        setName('');
        setType('');
        setSelectedFriends([]);
        setNotes('');
    }

    async function editEvent(e:any) : Promise<void>
    {
        e.preventDefault();

        if(!eventId)
        {
            setMessage('Event not selected');
            return;
        }

        const friendsArray = selectedFriends.map(friendId => {
            const friend = friendList.find(f => f.friend_id === friendId);
            return{
                friend_id: friendId,
                fullName: friend ? `${friend.FirstName} ${friend.LastName}` : friendId
            };
        });
        var obj = {_id:eventId,date:date,type:type,friends:friendsArray,name:name,notes:notes,userId:userId,time:time,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);

        try
        {
            const response = await
            fetch(buildPath('api/editevent'),
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
                setMessage('Event has been edited');
                storeToken( res.jwtToken );
                clearEdit();
                await loadAllEvents();
                
                // recall searchEvent (need fake event for preventDefault to not cause errors)
                await searchEvent({preventDefault: () => {}});

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
    function handleSetDate( e: any ) : void
    {
        setDate( e.target.value );
    }
    function handleSetName( e:any ) : void
    {
        setName( e.target.value )
    }
    function handleSetType( e: any ) : void
    {
        setType( e.target.value );
    }

    function handleSetNotes( e: any ) : void
    {
        setNotes( e.target.value );
    }
    function handleSetTime( e: any ) : void
    {
        setTime( e.target.value );
    }

    // Pagination functions
    const totalPages = Math.ceil(eventList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageEvents = eventList.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    // Events card pagination functions
    const totalEventsPages = Math.ceil(allEvents.length / eventsPerPage);
    const eventsStartIndex = (currentEventsPage - 1) * eventsPerPage;
    const eventsEndIndex = eventsStartIndex + eventsPerPage;
    const currentPageAllEvents = allEvents.slice(eventsStartIndex, eventsEndIndex);

    const goToEventsPage = (page: number) => {
        if (page >= 1 && page <= totalEventsPages) {
            setCurrentEventsPage(page);
        }
    };

    const goToPreviousEventsPage = () => {
        if (currentEventsPage > 1) {
            setCurrentEventsPage(currentEventsPage - 1);
        }
    };

    const goToNextEventsPage = () => {
        if (currentEventsPage < totalEventsPages) {
            setCurrentEventsPage(currentEventsPage + 1);
        }
    };

    // Friend selector pagination functions
    const totalFriendSelectorPages = Math.ceil(friendList.length / friendSelectorPerPage);
    const friendSelectorStartIndex = (currentFriendSelectorPage - 1) * friendSelectorPerPage;
    const friendSelectorEndIndex = friendSelectorStartIndex + friendSelectorPerPage;
    const currentPageFriendSelector = friendList.slice(friendSelectorStartIndex, friendSelectorEndIndex);

    const goToFriendSelectorPage = (page: number) => {
        if (page >= 1 && page <= totalFriendSelectorPages) {
            setCurrentFriendSelectorPage(page);
        }
    };

    const goToPreviousFriendSelectorPage = () => {
        if (currentFriendSelectorPage > 1) {
            setCurrentFriendSelectorPage(currentFriendSelectorPage - 1);
        }
    };

    const goToNextFriendSelectorPage = () => {
        if (currentFriendSelectorPage < totalFriendSelectorPages) {
            setCurrentFriendSelectorPage(currentFriendSelectorPage + 1);
        }
    };

    return(
        <div className="calendar-ui">
            <div id="cardUIDiv" className={`card-section search-card ${isSearchExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="search-card-header">
                    <div className="section-heading">Search Events</div>
                    <button
                        type="button"
                        className="collapse-toggle"
                        aria-expanded={isSearchExpanded}
                        aria-controls="searchCardContent"
                        onClick={() => setIsSearchExpanded(prev => !prev)}
                    >
                        {isSearchExpanded ? '▴' : '▾'}
                    </button>
                </div>
                <div className="search-row">
                    <label htmlFor="searchText">Search:</label>
                    <input type="text" id="searchText" placeholder="Event To Search For"
                    onChange={handleSearchTextChange} />
                    <button type="button" id="searchCardButton" className="buttons"
                    onClick={searchEvent}>Search Event</button>
                </div>
                <div
                    id="searchCardContent"
                    className={`search-collapsible ${isSearchExpanded ? 'open' : 'collapsed'}`}
                >
                    <span id="cardSearchResult">
                        {searchResults}
                        {eventList.length > itemsPerPage && (
                            <span> - Showing {Math.min(startIndex + 1, eventList.length)}-{Math.min(endIndex, eventList.length)} of {eventList.length} (Page {currentPage} of {totalPages})</span>
                        )}
                    </span>
                    {eventList.length > 0 && (
                        <div id="searchResultsList">
                            {currentPageEvents.map((event, index) => {
                                const late = isEventLate(event);
                                const upcoming = !late && isEventToday(event);
                                return (
                                    <div key={startIndex + index} className="search-result-card">
                                        {(late || upcoming) && (
                                            <div className="event-status-wrapper">
                                                {upcoming && <span className="event-status-tag upcoming">Upcoming</span>}
                                                {late && <span className="event-status-tag late">Late</span>}
                                            </div>
                                        )}
                                        <p><strong>Date:</strong> {event.date}</p>
                                        <p><strong>Time:</strong> {event.time}</p>
                                        <p><strong>Name:</strong> {event.name}</p>
                                        <p><strong>Type:</strong> {event.event_type}</p>
                                        <p><strong>Notes:</strong> {event.notes}</p>
                                            {((event.friends && event.friends.length > 0) || event.friend_id) && 
                                            <p><strong>Friend:</strong> {getFriendNames(event.friends || event.friend_id)}</p>}
                                        <div className="result-actions">
                                            <button type="button" id="deleteEventButton" className="buttons"
                                            onClick={() => deleteEvent(event._id,event.userId)}>Delete Event</button>
                                            <button type="button" id="populateEditEvent" className="buttons"
                                            onClick={() => populateEvent(event._id,event.date,event.time,event.name,event.event_type,event.notes,event.friends || event.friend_id)}>Edit Event</button>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="pagination-controls">
                                    <button
                                        type="button"
                                        className="pagination-btn"
                                        onClick={goToPreviousPage}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    
                                    <div className="page-numbers">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                type="button"
                                                className={`page-number ${page === currentPage ? 'active' : ''}`}
                                                onClick={() => goToPage(page)}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <button
                                        type="button"
                                        className="pagination-btn"
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="calendar-lower">
                <div className="card-section event-card">
                    <div className="section-heading">Add / Edit Event</div>
                    <input type="text" id="cardText" placeholder="Date: MM/DD/YYYY" value={date}
                    onChange={handleSetDate} />
                    <input type="text" id="cardText" placeholder="Time: HH:MM AM/PM" value={time}
                    onChange={handleSetTime} />
                    <input type="text" id="cardText" placeholder="Name" value={name}
                    onChange={handleSetName} />
                    <input type="text" id="cardText" placeholder="Event Type" value={type}
                    onChange={handleSetType} />
                    <label>
                        Select Friends:
                        {friendList.length > friendSelectorPerPage && (
                            <span style={{ fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '8px' }}>
                                Showing {Math.min(friendSelectorStartIndex + 1, friendList.length)}-{Math.min(friendSelectorEndIndex, friendList.length)} of {friendList.length} (Page {currentFriendSelectorPage} of {totalFriendSelectorPages})
                            </span>
                        )}
                    </label>
                    <div className="friend-checkbox-container">
                        {currentPageFriendSelector.map((friend, index) => (
                            <div key={friendSelectorStartIndex + index} className="friend-checkbox-item">
                                <input
                                    type="checkbox"
                                    id={`friend-${friend.friend_id}`}
                                    value={friend.friend_id}
                                    checked={selectedFriends.includes(friend.friend_id)}
                                    onChange={(e) => {
                                        const friendId = e.target.value;
                                        if (e.target.checked) {
                                            setSelectedFriends(prev => [...prev, friendId]);
                                        } else {
                                            setSelectedFriends(prev => prev.filter(id => id !== friendId));
                                        }
                                    }}
                                />
                                <label htmlFor={`friend-${friend.friend_id}`} className="friend-checkbox-label">
                                    {friend.FirstName} {friend.LastName}
                                </label>
                            </div>
                        ))}
                    </div>
                    
                    {/* Friend Selector Pagination Controls */}
                    {totalFriendSelectorPages > 1 && (
                        <div className="pagination-controls friend-selector-pagination" style={{ marginTop: '12px' }}>
                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={goToPreviousFriendSelectorPage}
                                disabled={currentFriendSelectorPage === 1}
                            >
                                Previous
                            </button>
                            
                            <div className="page-numbers">
                                {Array.from({ length: totalFriendSelectorPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        type="button"
                                        className={`page-number ${page === currentFriendSelectorPage ? 'active' : ''}`}
                                        onClick={() => goToFriendSelectorPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            
                            <button
                                type="button"
                                className="pagination-btn"
                                onClick={goToNextFriendSelectorPage}
                                disabled={currentFriendSelectorPage === totalFriendSelectorPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                    <input type="text" id="cardText" placeholder="Notes" value={notes}
                    onChange={handleSetNotes} />
                    <div className="form-actions">
                        <button type="button" id="addEventButton" className="buttons"
                        onClick={addEvent}>Add Event</button>
                        <button type="button" id="editEventButton" className="buttons"
                        onClick={editEvent}>Edit Event</button>
                    </div>
                    <span id="cardAddResult">{message}</span>
                </div>
                {friendCard}
                <section className="card-section events-card">
                    <div className="section-heading">
                        Events
                        {allEvents.length > eventsPerPage && (
                            <span style={{ fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '8px' }}>
                                - Showing {Math.min(eventsStartIndex + 1, allEvents.length)}-{Math.min(eventsEndIndex, allEvents.length)} of {allEvents.length} (Page {currentEventsPage} of {totalEventsPages})
                            </span>
                        )}
                    </div>
                    {allEvents.length === 0 ? (
                        <p className="empty-state">No events yet. Start by adding one above.</p>
                    ) : (
                        <div className="events-list">
                            {currentPageAllEvents.map((event, index) => {
                                const late = isEventLate(event);
                                const upcoming = !late && isEventToday(event);
                                return (
                                    <div key={event._id ?? index} className="event-item">
                                        <div className="event-item-header">
                                            <span className="event-item-name">{event.name || 'Untitled Event'}</span>
                                            <div className="event-item-tags">
                                                <span className="event-item-type">{event.event_type || 'General'}</span>
                                                {upcoming && <span className="event-status-tag upcoming">Upcoming</span>}
                                                {late && <span className="event-status-tag late">Late</span>}
                                            </div>
                                        </div>
                                        <div className="event-item-meta">
                                            <span><strong>Date:</strong> {event.date || '—'}</span>
                                            <span><strong>Time:</strong> {event.time || '—'}</span>
                                        </div>
                                        {event.notes && <p className="event-item-notes">{event.notes}</p>}
                                        {((event.friends && event.friends.length > 0) || event.friend_id) && (
                                            <p className="event-item-friends"><strong>Friends:</strong> {getFriendNames(event.friends || event.friend_id)}</p>
                                        )}
                                        <div className="event-item-actions">
                                            <button
                                                type="button"
                                                className="buttons"
                                                onClick={() => populateEvent(
                                                    event._id,
                                                    event.date,
                                                    event.time,
                                                    event.name,
                                                    event.event_type,
                                                    event.notes,
                                                    event.friends || event.friend_id,
                                                )}
                                            >
                                                Edit Event
                                            </button>
                                            <button
                                                type="button"
                                                className="buttons danger"
                                                onClick={() => deleteEvent(event._id, event.userId)}
                                            >
                                                Delete Event
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {/* Events Pagination Controls */}
                            {totalEventsPages > 1 && (
                                <div className="pagination-controls events-pagination">
                                    <button
                                        type="button"
                                        className="pagination-btn"
                                        onClick={goToPreviousEventsPage}
                                        disabled={currentEventsPage === 1}
                                    >
                                        Previous
                                    </button>
                                    
                                    <div className="page-numbers">
                                        {Array.from({ length: totalEventsPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                type="button"
                                                className={`page-number ${page === currentEventsPage ? 'active' : ''}`}
                                                onClick={() => goToEventsPage(page)}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <button
                                        type="button"
                                        className="pagination-btn"
                                        onClick={goToNextEventsPage}
                                        disabled={currentEventsPage === totalEventsPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
export default CalendarUI;
