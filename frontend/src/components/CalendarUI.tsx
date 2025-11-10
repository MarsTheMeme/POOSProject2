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
    let userFriendID : string = ud.friend_id;
    // let _id : string;
    // var firstName = ud.firstName;
    // var lastName = ud.lastName;
    const [message,setMessage] = useState('');
    const [messageVisible, setMessageVisible] = useState(false);
    const [searchResults,setResults] = useState('');
    const [search,setSearchValue] = React.useState('');
    const [eventId, setEventId] = React.useState('');
    const [date,setDate] = React.useState('');
    const [name,setName] = React.useState('');
    const [type,setType] = React.useState('');
    const [selectedFriends,setSelectedFriends] = React.useState<string[]>([]);
    const [notes,setNotes] = React.useState('');
    const [time,setTime] = React.useState('');
    const [amPm,setAmPm] = React.useState('AM');

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

    const [eventList, setEventList] = useState<any[]>([]); // stores events in a list
    const [friendEventList, setFriendEventList] = useState<any[]>([]); // stores shared events in a list
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
        
        // Validate date format
        if (!date || !validateDateFormat(date)) {
            setTemporaryMessage('Please enter date in MM/DD/YYYY format');
            return;
        }
        
        // Validate time format
        if (!time || !validateTimeFormat(time, amPm)) {
            setTemporaryMessage('Please enter time in HH:MM format');
            return;
        }
        
        const friendsArray = selectedFriends.map(friendId => {
            const friend = friendList.find(f => f.friend_id === friendId);
            return {
                friend_id: friendId,
                fullName: friend ? `${friend.FirstName} ${friend.LastName}` : friendId
            };
        });
        var obj = {date:date,type:type,friends:friendsArray,name:name,notes:notes,userId:userId,time:`${time} ${amPm}`,jwtToken:retrieveToken()};
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
                setTemporaryMessage( "API Error:" + res.error );
            }
            else
            {
                setTemporaryMessage('Event has been added');
                storeToken( res.jwtToken );
                await loadAllEvents();
                clearEdit();
            }
        }
        catch(error:any)
        {
            setTemporaryMessage(error.toString());
        }
    };

    async function searchFriendEvents ( searchTerm : string ) : Promise<any[]>
    {
        var obj = {friend_id:userFriendID,search:searchTerm,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);

        try
        {
            const response = await
            fetch(buildPath('api/friendidsearchevents'),
            {method:'POST',body:js,headers:{'Content-Type':
            'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);

            if( res.error && res.error.length > 0 )
            {
                handleTokenExpiration(res.error);
                return [];
            }

            storeToken( res.jwtToken );
            return res.results || [];
        }
        catch( e:any )
        {
            console.error('Error searching friend events:', e);
            return [];
        }
    }

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

            let userEvents = res.results || [];

            setEventList(userEvents);
            
            const friendEvents = await searchFriendEvents(search);
            setFriendEventList(friendEvents);

            setCurrentPage(1); // Reset to first page when new search is performed

            const totalEvents = userEvents.length + friendEvents.length;

            if(totalEvents > 0)
            {
                setResults(`Found ${totalEvents} event(s) (${userEvents.length} yours, ${friendEvents.length} shared)`);
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
        
        // Split time into time and AM/PM parts
        if (time) {
            const timeParts = time.split(' ');
            if (timeParts.length === 2) {
                setTime(timeParts[0]); // HH:MM part
                setAmPm(timeParts[1]); // AM/PM part
            } else {
                setTime(time);
                setAmPm('AM'); // Default to AM if no AM/PM found
            }
        } else {
            setTime('');
            setAmPm('AM');
        }

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
        
        // Scroll to the Add/Edit Event form
        setTimeout(() => {
            const addEditContainer = document.getElementById('addEditEventContainer');
            if (addEditContainer) {
                addEditContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100); // Small delay to ensure state updates are complete
    }

    function clearEdit() : void
    {
        setEventId( '' );
        setDate('');
        setTime('');
        setAmPm('AM');
        setName('');
        setType('');
        setSelectedFriends([]);
        setNotes('');
    }

    async function handleEventAction(e:any) : Promise<void>
    {
        if (eventId) {
            // If eventId exists, we're editing
            await editEvent(e);
        } else {
            // If no eventId, we're adding
            await addEvent(e);
        }
    }

    async function editEvent(e:any) : Promise<void>
    {
        e.preventDefault();

        if(!eventId)
        {
            setTemporaryMessage('Event not selected');
            return;
        }
        
        // Validate date format
        if (!date || !validateDateFormat(date)) {
            setTemporaryMessage('Please enter date in MM/DD/YYYY format');
            return;
        }
        
        // Validate time format
        if (!time || !validateTimeFormat(time, amPm)) {
            setTemporaryMessage('Please enter time in HH:MM format');
            return;
        }

        const friendsArray = selectedFriends.map(friendId => {
            const friend = friendList.find(f => f.friend_id === friendId);
            return{
                friend_id: friendId,
                fullName: friend ? `${friend.FirstName} ${friend.LastName}` : friendId
            };
        });
        var obj = {_id:eventId,date:date,type:type,friends:friendsArray,name:name,notes:notes,userId:userId,time:`${time} ${amPm}`,jwtToken:retrieveToken()};
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
                setTemporaryMessage( "API Error:" + res.error );
            }
            else
            {
                setTemporaryMessage('Event has been edited');
                storeToken( res.jwtToken );
                clearEdit();
                await loadAllEvents();
                
                // recall searchEvent (need fake event for preventDefault to not cause errors)
                await searchEvent({preventDefault: () => {}});

            }
        }
        catch(error:any)
        {
            setTemporaryMessage(error.toString());
        }
    };

    function handleSearchTextChange( e: any ) : void
    {
        setSearchValue( e.target.value );
    }
    function validateDateFormat(value: string): boolean {
        // MM/DD/YYYY format
        const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
        return dateRegex.test(value);
    }

    function validateTimeFormat(timeValue: string, amPmValue: string): boolean {
        if (!timeValue) {
            return false;
        }
        
        // Split time into parts
        const parts = timeValue.split(':');
        if (parts.length !== 2) {
            return false;
        }
        
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        
        // Validate 12-hour format: hours 1-12, minutes 0-59
        // Handle both single digit (1-9) and double digit (10-12) hours
        const isValidHours = !isNaN(hours) && hours >= 1 && hours <= 12;
        const isValidMinutes = !isNaN(minutes) && minutes >= 0 && minutes <= 59;
        const isValidAmPm = (amPmValue === 'AM' || amPmValue === 'PM');
        
        return isValidHours && isValidMinutes && isValidAmPm;
    }
    


    function handleSetDate( e: any ) : void
    {
        let value = e.target.value;
        
        // Remove all non-numeric characters except existing slashes for processing
        const numbersOnly = value.replace(/[^\d]/g, '');
        
        // Auto-format as user types: MM/DD/YYYY
        if (numbersOnly.length >= 1) {
            if (numbersOnly.length <= 2) {
                value = numbersOnly;
            } else if (numbersOnly.length <= 4) {
                value = numbersOnly.slice(0, 2) + '/' + numbersOnly.slice(2);
            } else if (numbersOnly.length <= 8) {
                value = numbersOnly.slice(0, 2) + '/' + numbersOnly.slice(2, 4) + '/' + numbersOnly.slice(4);
            } else {
                // Limit to 8 digits (MMDDYYYY)
                const limited = numbersOnly.slice(0, 8);
                value = limited.slice(0, 2) + '/' + limited.slice(2, 4) + '/' + limited.slice(4);
            }
        }
        
        setDate(value);
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
        let value = e.target.value;
        
        // Remove all non-numeric characters except existing colons for processing
        const numbersOnly = value.replace(/[^\d]/g, '');
        
        // Auto-format as user types: H:MM or HH:MM (12-hour format)
        if (numbersOnly.length >= 1) {
            if (numbersOnly.length <= 2) {
                value = numbersOnly;
            } else if (numbersOnly.length <= 4) {
                let hours = numbersOnly.slice(0, 2);
                const minutes = numbersOnly.slice(2);
                
                // Convert leading zeros for hours in 12-hour format
                const hoursNum = parseInt(hours, 10);
                if (hoursNum === 0) {
                    hours = '12'; // 00 becomes 12 in 12-hour format
                } else if (hoursNum > 12) {
                    // If someone types something like 13, 14, etc., convert to 12-hour
                    hours = String(hoursNum > 12 ? hoursNum - 12 : hoursNum);
                } else {
                    hours = String(hoursNum); // Remove leading zero
                }
                
                value = hours + ':' + minutes;
            } else {
                // Limit to 4 digits (HHMM)
                const limited = numbersOnly.slice(0, 4);
                let hours = limited.slice(0, 2);
                const minutes = limited.slice(2);
                
                const hoursNum = parseInt(hours, 10);
                if (hoursNum === 0) {
                    hours = '12';
                } else if (hoursNum > 12) {
                    hours = String(hoursNum > 12 ? hoursNum - 12 : hoursNum);
                } else {
                    hours = String(hoursNum);
                }
                
                value = hours + ':' + minutes;
            }
        }
        
        setTime(value);
    }

    function handleSetAmPm( e: any ) : void
    {
        setAmPm(e.target.value);
    }

    // Pagination functions
    const totalEventList = [...eventList, ...friendEventList];
    const totalPages = Math.ceil(totalEventList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageEvents = totalEventList.slice(startIndex, endIndex);

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
                            <span> - Showing {Math.min(startIndex + 1, totalEventList.length)}-{Math.min(endIndex, totalEventList.length)} of {totalEventList.length} (Page {currentPage} of {totalPages})</span>
                        )}
                    </span>
                    {eventList.length > 0 && (
                        <div id="searchResultsList">
                            {currentPageEvents.map((event, index) => {
                                const late = isEventLate(event);
                                const upcoming = !late && isEventToday(event);
                                const isUserEvent = eventList.includes(event);
                                const isFriendEvent = friendEventList.includes(event);
                                return (
                                    <div key={startIndex + index} className="search-result-card">
                                        {(late || upcoming || isFriendEvent) && (
                                            <div className="event-status-wrapper">
                                                {isFriendEvent && <span className="event-status-tag shared">Shared</span>}
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
                                        {isUserEvent && (
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
                                        )}
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
                <div id="addEditEventContainer" className="card-section event-card">
                    <div className="section-heading">Add / Edit Event</div>
                    <input 
                        type="text" 
                        id="cardText" 
                        placeholder="Date: MM/DD/YYYY" 
                        value={date}
                        onChange={handleSetDate} 
                        maxLength={10}
                        inputMode="numeric"
                        pattern="^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$"
                        title="Enter numbers and the format will be applied automatically"
                        style={{
                            borderColor: date && !validateDateFormat(date) ? '#dc3545' : '',
                            backgroundColor: date && !validateDateFormat(date) ? '#fff5f5' : ''
                        }}
                    />
                    <div className="time-input-container">
                        <input 
                            type="text" 
                            id="timeInput" 
                            placeholder="Time: HH:MM" 
                            value={time}
                            onChange={handleSetTime} 
                            maxLength={5}
                            inputMode="numeric"
                            pattern="^([1-9]|1[0-2]):[0-5][0-9]$"
                            title="Enter numbers - format will be applied automatically"
                            className={time && time.length > 0 && !validateTimeFormat(time, amPm) ? 'input-error' : ''}
                        />
                        <select 
                            id="amPmSelect"
                            value={amPm}
                            onChange={handleSetAmPm}
                            className="ampm-select"
                        >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                        </select>
                    </div>
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
                        <button type="button" id="eventActionButton" className="buttons"
                        onClick={handleEventAction}>
                            {eventId ? 'Edit Event' : 'Add Event'}
                        </button>
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
