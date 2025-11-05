require('express');
require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const token = require('./createJWT.js');

exports.setApp = function( app, client )
{
    app.post('/api/login', async (req, res, next) =>
    {
        // incoming: login, password
        // outgoing: id, firstName, lastName, error

        var error = '';

        const { login, password } = req.body;

        const db = client.db('sample_mflix');
        const results = await
        db.collection('USERS').find({Login:login,Password:password}).toArray();
        
        var id = -1;
        var fn = '';
        var ln = '';
        var fid = '';

        if( results.length > 0 )
        {
            id = results[0]._id.toString(); // id from mongoDB
            fn = results[0].FirstName;
            ln = results[0].LastName;
            fid = results[0].friend_id;

            var ret;
            
            try
            {
                const token = require('./createJWT.js');
                retToken = token.createToken( fn, ln, id );
                ret = { accessToken: retToken.accessToken, id: id, Login: login, firstName: fn, lastName: ln, friend_id: fid };
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
        // incoming: login, password, firstName, lastName, friend_id
        // outgoing: id, firstName, lastName, error

        var error = '';
        
        const { Login:login, Password:password, FirstName:firstName, LastName:lastName, friend_id: friend_id} = req.body;

        // Check for missing fields
        if( !login || !password || !firstName || !lastName || !friend_id || login.trim().length === 0 || password.trim().length === 0 || firstName.trim().length === 0 || lastName.trim().length === 0 || friend_id.trim().length === 0 )
        {
            var ret = { error:'All fields are required' };
            res.status(200).json(ret);
            return;
        }

        // Check for existing username
        const db = client.db('sample_mflix');
        const results = await
        db.collection('USERS').find({Login:login}).toArray();
        if( results.length > 0 )
        {
            var ret = { error:'Email already exists' };
            res.status(200).json(ret);
            return;
        }

        // Check for existing friend_id
        const resultsFriend = await
        db.collection('USERS').find({friend_id:friend_id}).toArray();
        if( resultsFriend.length > 0 )
        {
            var ret = { error:'Friend ID already exists' };
            res.status(200).json(ret);
            return;
        }

        // Add new user
        const newUser = {Login:login,Password:password,FirstName:firstName,LastName:lastName, friend_id:friend_id};

        try
        {
            const result = await db.collection('USERS').insertOne(newUser);
            var id = result.insertedId.toString();
            try
            {
                const token = require('./createJWT.js');
                retToken = token.createToken( firstName, lastName, id );
                ret = { accessToken: retToken.accessToken, id: id, Login: login, firstName: firstName, lastName: lastName, friend_id: friend_id, error: '' };
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
            const db = client.db('sample_mflix');
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
        
        const db = client.db('sample_mflix');
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
            const db = client.db('sample_mflix');
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
            const db = client.db('sample_mflix');
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

    app.post('/api/addfriend', async (req, res, next) =>
    {
        // incoming: friend_id, nickName, userId, jwtToken
        // outgoing: error

        const { friend_id, nickname, userId, jwtToken } = req.body;

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

        const db = client.db('sample_mflix');

        // Check for existing friend_id
        const resultsFriend = await
        db.collection('USERS').find({friend_id:friend_id}).toArray();

        var fid = '';
        var firstName = '';
        var lastName = '';

        if( resultsFriend.length > 0 )
        {
            // Check if already friends
            const existingFriend = await db.collection('FRIENDS').findOne({ friend_id: friend_id, userId: userId });

            if (existingFriend) 
            {
                var ret = { error: error, jwtToken:refreshedToken };
                ret.error = 'You Are Already Friends';
                res.status(200).json(ret);
                return;
            }
            else
            {
                fid = resultsFriend[0].friend_id;
                firstName = resultsFriend[0].FirstName;
                lastName = resultsFriend[0].LastName;

                const newEvent = {friend_id:fid,FirstName:firstName,LastName:lastName,Nickname:nickname,userId:userId};
                var error = '';

                try
                {
                    const result = db.collection('FRIENDS').insertOne(newEvent);
                }
                catch(e)
                {
                    error = e.toString();
                }
            }
        }
        else
        {
            var ret = { error: error, jwtToken:refreshedToken };
            ret.error = 'Friend ID does not exists';
            res.status(200).json(ret);
            return;
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

    app.post('/api/searchfriend', async (req, res, next) =>
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
        
        const db = client.db('sample_mflix');
        const results = await db.collection('FRIENDS').find({
            userId: userId, 
            $or: [
                    {friend_id: {$regex:_search+'.*', $options:'i'}},
                    {FirstName: {$regex:_search+'.*', $options:'i'}},
                    {LastName: {$regex:_search+'.*', $options:'i'}},
                    {nickname: {$regex:_search+'.*', $options:'i'}}
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

    app.post('/api/deletefriend', async (req, res, next) =>
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
            const db = client.db('sample_mflix');
            const result = await db.collection('FRIENDS').deleteOne({
            _id: new ObjectId(_id),
            userId: userId
            });

            if(result.deletedCount === 0)
            {
                error = 'Firned not found';
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

    app.post('/api/editfriend', async (req, res, next) =>
    {
        // incoming: userId, _id, friend_id, firstName, lastName
        // outgoing: error

        const { _id, friend_id, nickname, userId, jwtToken } = req.body;

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
            const db = client.db('sample_mflix');
            const result = await db.collection('FRIENDS').updateOne(
            {
                _id: new ObjectId(_id),
                userId: userId
            },
            {
                $set:
                {
                    friend_id: friend_id,
                    nickname: nickname
                }
            });
            if(result.matchedCount === 0)
            {
                error = 'Friend could not be updated'
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