require('express');
require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const token = require('./createJWT.js');

exports.setApp = function( app, client )
{
    app.post('/api/addcard', async (req, res, next) =>
    {
        // incoming: userId, color
        // outgoing: error

        const { userId, card, jwtToken } = req.body;

        try
        {
            if( token.isExpired(jwtToken))
            {
                var r = {error:'The JWT is no longer valid',jwtToken: ''};
                res.status(200).json(r);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        const newCard = {Card:card,UserId:userId};
        var error = '';

        try
        {
            const db = client.db('COP4331Cards');
            const result = db.collection('Cards').insertOne(newCard);
        }
        catch(e)
        {
            error = e.toString();
        }

        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(jwtToken);;
        }
        catch(e)
        {
            console.log(e.message);
        }

        var ret = { error: error, jwtToken:refreshedToken };

        res.status(200).json(ret);
    });

    app.post('/api/login', async (req, res, next) =>
    {
        // incoming: login, password
        // outgoing: id, firstName, lastName, error

        var error = '';

        const { login, password } = req.body;

        const db = client.db('COP4331Cards');
        const results = await
        db.collection('Users').find({Login:login,Password:password}).toArray();
        
        var id = -1;
        var fn = '';
        var ln = '';

        if( results.length > 0 )
        {
            id = results[0]._id; // id from mongoDB
            fn = results[0].FirstName;
            ln = results[0].LastName;

            var ret;
            
            try
            {
                const token = require('./createJWT.js');
                ret = token.createToken( fn, ln, id );
            }
            catch(e)
            {
                ret = { error:e.message };
            }
        }
        else
        {
            ret = { error:'Login/Password incorrect' };
        }

        res.status(200).json(ret);
    });

    app.post('/api/signup', async (req, res, next) =>
    {
        // incoming: login, password, firstName, lastName
        // outgoing: id, firstName, lastName, error

        var error = '';
        
        const { Login:login, Password:password, FirstName:firstName, LastName:lastName } = req.body;

        // Check for missing fields
        if( !login || !password || !firstName || !lastName || login.trim().length === 0 || password.trim().length === 0 || firstName.trim().length === 0 || lastName.trim().length === 0 )
        {
            var ret = { error:'All fields are required' };
            res.status(200).json(ret);
            return;
        }

        // Check for existing username
        const db = client.db('COP4331Cards');
        const results = await
        db.collection('Users').find({Login:login}).toArray();
        if( results.length > 0 )
        {
            var ret = { error:'Username already exists' };
            res.status(200).json(ret);
            return;
        }

        // Add new user
        const newUser = {Login:login,Password:password,FirstName:firstName,LastName:lastName};

        try
        {
            const result = await db.collection('Users').insertOne(newUser);
            var id = result.insertedId.toString();
            try
            {
                const token = require('./createJWT.js');
                ret = token.createToken( firstName, lastName, id );
                ret.error = '';
            }
            catch(e)
            {
                ret = { error:e.message };
            }
        }
        catch(e)
        {
            error = e.toString();
            ret = { error: error };
        }

        res.status(200).json(ret);
    });

    app.post('/api/searchcards', async (req, res, next) =>
    {
        // incoming: userId, search
        // outgoing: results[], error

        var error = '';

        const { userId, search, jwtToken } = req.body;

        try
        {
            if( token.isExpired( jwtToken ))
            {
                var r = {error:'The JWT is no longer valid',jwtToken: ''};
                res.status(200).json(r);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        var _search = search.trim();
        
        const db = client.db('COP4331Cards');
        const results = await db.collection('Cards').find({"Card":{$regex:_search+'.*', $options:'i'}}).toArray();
        
        var _ret = [];
        for( var i=0; i<results.length; i++ )
        {
            _ret.push( results[i].Card );
        }
        
        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(jwtToken);;
        }
        catch(e)
        {
            console.log(e.message);
        }

        var ret = {results:_ret, error:error, jwtToken:refreshedToken};
        res.status(200).json(ret);
    });

    app.post('/api/addevent', async (req, res, next) =>
    {
        // incoming: date, event_type, friend_id, name, notes, userId, time
        // outgoing: error

        const { date, type, friend, name, notes, userId, time, jwtToken } = req.body;

        try
        {
            if( token.isExpired(jwtToken))
            {
                var r = {error:'The JWT is no longer valid',jwtToken: ''};
                res.status(200).json(r);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        const newEvent = {date:date,event_type:type,friend_id:friend,name:name,notes:notes,userId:userId,time:time};
        var error = '';

        try
        {
            const db = client.db('COP4331Cards');
            const result = db.collection('CALENDAR_EVENT').insertOne(newEvent);
        }
        catch(e)
        {
            error = e.toString();
        }

        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(jwtToken);;
        }
        catch(e)
        {
            console.log(e.message);
        }

        var ret = { error: error, jwtToken:refreshedToken };

        res.status(200).json(ret);
    });

    app.post('/api/searchevents', async (req, res, next) =>
    {
        // incoming: userId, search
        // outgoing: results[], error

        var error = '';

        const { userId, search, jwtToken } = req.body;

        try
        {
            if( token.isExpired( jwtToken ))
            {
                var r = {error:'The JWT is no longer valid',jwtToken: ''};
                res.status(200).json(r);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        var _search = search.trim();
        
        const db = client.db('COP4331Cards');
        const results = await db.collection('CALENDAR_EVENT').find({
            userId: userId, 
            $or: [
                    {date: {$regex:_search+'.*', $options:'i'}},
                    {time: {$regex:_search+'.*', $options:'i'}},
                    {name: {$regex:_search+'.*', $options:'i'}},
                    {event_type: {$regex:_search+'.*', $options:'i'}},
                    {notes: {$regex:_search+'.*', $options:'i'}},
            ] }).toArray();
        
        var _ret = results;
        
        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(jwtToken);;
        }
        catch(e)
        {
            console.log(e.message);
        }

        var ret = {results:_ret, error:error, jwtToken:refreshedToken};
        res.status(200).json(ret);
    });

    app.post('/api/deleteevent', async (req, res, next) =>
    {
        // incoming: userId, _id
        // outgoing: error

        const { userId, _id, jwtToken } = req.body;

        try
        {
            if( token.isExpired(jwtToken))
            {
                var r = {error:'The JWT is no longer valid',jwtToken: ''};
                res.status(200).json(r);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        var error = '';

        try
        {
            const db = client.db('COP4331Cards');
            const result = await db.collection('CALENDAR_EVENT').deleteOne({
            _id: new ObjectId(_id),
            userId: userId
            });

            if(result.deletedCount === 0)
            {
                error = 'Event not found';
            }
        }
        catch(e)
        {
            error = e.toString();
        }

        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(jwtToken);;
        }
        catch(e)
        {
            console.log(e.message);
        }

        var ret = { error: error, jwtToken:refreshedToken };

        res.status(200).json(ret);
    });

     app.post('/api/editevent', async (req, res, next) =>
    {
        // incoming: userId, _id date, time, name, event_type, friend_id, notes
        // outgoing: error

        const { _id, date, type, friend, name, notes, userId, time, jwtToken } = req.body;

        try
        {
            if( token.isExpired(jwtToken))
            {
                var r = {error:'The JWT is no longer valid',jwtToken: ''};
                res.status(200).json(r);
                return;
            }
        }
        catch(e)
        {
            console.log(e.message);
        }

        var error = '';

        try
        {
            const db = client.db('COP4331Cards');
            const result = await db.collection('CALENDAR_EVENT').updateOne(
            {
                _id: new ObjectId(_id),
                userId: userId
            },
            {
                $set:
                {
                    date: date,
                    event_type: type,
                    friend_id: friend,
                    name: name,
                    notes: notes,
                    time: time
                }
            });
            if(result.matchedCount === 0)
            {
                error = 'Event could not be updated'
            }
        }
        catch(e)
        {
            error = e.toString();
        }

        var refreshedToken = null;
        try
        {
            refreshedToken = token.refresh(jwtToken);;
        }
        catch(e)
        {
            console.log(e.message);
        }

        var ret = { error: error, jwtToken:refreshedToken };

        res.status(200).json(ret);
    });
}