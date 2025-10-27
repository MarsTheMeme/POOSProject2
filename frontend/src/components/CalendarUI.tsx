import React, { useState } from 'react';
import { buildPath } from './Path.ts';
import { retrieveToken, storeToken } from '../tokenStorage.ts';

function CalendarUI()
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
    const [eventId, setEventId] = React.useState('');
    const [date,setDate] = React.useState('');
    const [name,setName] = React.useState('');
    const [type,setType] = React.useState('');
    const [friend,setFriend] = React.useState('');
    const [notes,setNotes] = React.useState('');
    const [time,setTime] = React.useState('');
    const [eventList, setEventList] = useState<any[]>([]); // stores events in a list
    

    async function addEvent(e:any) : Promise<void>
    {
        e.preventDefault();

        var obj = {date:date,type:type,friend:friend,name:name,notes:notes,userId:userId,time:time,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);

        try
        {
            const response = await
            fetch(buildPath('api/addevent'),
            {method:'POST',body:js,headers:{'Content-Type':
            'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);

            if( res.error.length > 0 )
            {
                setMessage( "API Error:" + res.error );
            }
            else
            {
                setMessage('Event has been added');
                storeToken( res.jwtToken );
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
            let _results = res.results;

            setEventList(_results);
        
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

            storeToken( res.jwtToken );
        }
        catch(error:any)
        {
            alert(error.toString());
            setResults(error.toString());
        }
        setEventList(eventList.filter(e => e._id !== _id));
    };

    function populateEvent(_id:string, date:string, time:string, name:string, event_type:string, notes:string, friend_id:string) : void
    {
        setEventId( _id );
        setDate( date );
        setType( event_type );
        setName( name );
        setFriend( friend_id );
        setNotes (notes );
        setTime( time );
    }

    function clearEdit() : void
    {
        setEventId( '' );
        setDate('');
        setTime('');
        setName('');
        setType('');
        setFriend('');
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

        var obj = {_id:eventId,date:date,type:type,friend:friend,name:name,notes:notes,userId:userId,time:time,jwtToken:retrieveToken()};
        var js = JSON.stringify(obj);

        try
        {
            const response = await
            fetch(buildPath('api/editevent'),
            {method:'POST',body:js,headers:{'Content-Type':
            'application/json'}});

            let txt = await response.text();
            let res = JSON.parse(txt);

            if( res.error.length > 0 )
            {
                setMessage( "API Error:" + res.error );
            }
            else
            {
                setMessage('Event has been edited');
                storeToken( res.jwtToken );
                clearEdit();
                
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
    function handleSetFriend( e: any ) : void
    {
        setFriend( e.target.value );
    }
    function handleSetNotes( e: any ) : void
    {
        setNotes( e.target.value );
    }
    function handleSetTime( e: any ) : void
    {
        setTime( e.target.value );
    }

    return(
        <div id="cardUIDiv">
            <br />
            Search: <input type="text" id="searchText" placeholder="Event To Search For"
            onChange={handleSearchTextChange} />
            <button type="button" id="searchCardButton" className="buttons"
            onClick={searchEvent}> Search Event</button><br />
            <span id="cardSearchResult">{searchResults}</span><br />
            {eventList.length > 0 && (
                <div id="searchResultsList">
                    {eventList.map((event, index) => (
                        <div key={index} style={{border: '1px solid #ccc', margin: '10px', padding: '10px'}}>
                            <p><strong>Date:</strong> {event.date}</p>
                            <p><strong>Time:</strong> {event.time}</p>
                            <p><strong>Name:</strong> {event.name}</p>
                            <p><strong>Type:</strong> {event.event_type}</p>
                            <p><strong>Notes:</strong> {event.notes}</p>
                            {event.friend_id && <p><strong>Friend:</strong> {event.friend_id}</p>}
                            <button type="button" id="deleteEventButton" className="buttons"
                            onClick={() => deleteEvent(event._id,event.userId)}> Delete Event </button><br /><br />
                            <button type="button" id="populateEditEvent" className="buttons"
                            onClick={() => populateEvent(event._id,event.date,event.time,event.name,event.event_type,event.notes,event.friend_id)}> Edit Event </button><br />
                        </div>
                    ))}
                </div>
            )}
            Add/Edit: <br />
            <input type="text" id="cardText" placeholder="Date: MM/DD/YYYY" value={date}
            onChange={handleSetDate} /><br />
            <input type="text" id="cardText" placeholder="Time: HH:MM AM/PM" value={time}
            onChange={handleSetTime} /><br />
            <input type="text" id="cardText" placeholder="Name" value={name}
            onChange={handleSetName} /><br />
            <input type="text" id="cardText" placeholder="Event Type" value={type}
            onChange={handleSetType} /><br />
            <input type="text" id="cardText" placeholder="Friends To Add" value={friend}
            onChange={handleSetFriend} /><br />
            <input type="text" id="cardText" placeholder="Notes" value={notes}
            onChange={handleSetNotes} /><br />
            <button type="button" id="addEventButton" className="buttons"
            onClick={addEvent}> Add Event </button><br />
            <button type="button" id="editEventButton" className="buttons"
            onClick={editEvent}> Edit Event </button><br />
            <span id="cardAddResult">{message}</span>
        </div>
    );
}
export default CalendarUI;