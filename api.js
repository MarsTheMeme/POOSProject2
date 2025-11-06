require('express');
require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const token = require('./createJWT.js');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const VERIFICATION_CODE_TTL_MINUTES = parseInt(process.env.EMAIL_VERIFICATION_TTL_MINUTES ?? '15', 10);
const emailConfigured = Boolean(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_FROM
);

let emailTransporter = null;

if (emailConfigured)
{
    emailTransporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth:
        {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
}
else
{
    console.warn('Email environment variables are incomplete. Verification codes will be logged to the server console.');
}

async function sendVerificationEmail(recipient, code)
{
    if( !emailConfigured || !emailTransporter )
    {
        console.log(`[EmailVerification] Verification code for ${recipient}: ${code}`);
        return;
    }

    const mailOptions =
    {
        from: process.env.EMAIL_FROM,
        to: recipient,
        subject: 'Verify your email address',
        text: `Your verification code is: ${code}\n\nThis code expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.`,
        html: `<p>Your verification code is:</p><h2>${code}</h2><p>This code expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.</p>`
    };

    await emailTransporter.sendMail(mailOptions);
}

function generateVerificationCode()
{
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashVerificationCode(code)
{
    return crypto.createHash('sha256').update(code).digest('hex');
}

function getVerificationExpiryDate()
{
    return new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60 * 1000);
}

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
        var ret;

        if( results.length > 0 )
        {
            if( results[0].emailVerified === false )
            {
                ret = { error:'Please verify your email before logging in.' };
            }
            else
            {
                id = results[0]._id.toString(); // id from mongoDB
                fn = results[0].FirstName;
                ln = results[0].LastName;
                fid = results[0].friend_id;

                try
                {
                    const token = require('./createJWT.js');
                    const retToken = token.createToken( fn, ln, id );
                    ret = { accessToken: retToken.accessToken, id: id, Login: login, firstName: fn, lastName: ln, friend_id: fid };
                }
                catch(e)
                {
                    ret = { error:e.message };
                }
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
            const existingUser = results[0];
            if( existingUser.emailVerified === false )
            {
                const verificationCode = generateVerificationCode();
                const verificationCodeHash = hashVerificationCode(verificationCode);
                const verificationCodeExpires = getVerificationExpiryDate();

                try
                {
                    await db.collection('USERS').updateOne(
                    { _id: existingUser._id },
                    { $set:
                        {
                            verificationCodeHash: verificationCodeHash,
                            verificationCodeExpires: verificationCodeExpires,
                            emailVerified: false
                        }
                    });

                    await sendVerificationEmail(login, verificationCode);

                    var ret = { success: true, pendingVerification: true, message: 'Verification code resent to your email address.', login: login };
                }
                catch(e)
                {
                    console.error('Resend verification error:', e);
                    var ret = { error:'Unable to resend verification code. Please try again later.' };
                }
            }
            else
            {
                var ret = { error:'Email already exists' };
            }

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
        const verificationCode = generateVerificationCode();
        const verificationCodeHash = hashVerificationCode(verificationCode);
        const verificationCodeExpires = getVerificationExpiryDate();

        const newUser = {
            Login:login,
            Password:password,
            FirstName:firstName,
            LastName:lastName,
            friend_id:friend_id,
            emailVerified:false,
            verificationCodeHash:verificationCodeHash,
            verificationCodeExpires:verificationCodeExpires
        };

        try
        {
            const result = await db.collection('USERS').insertOne(newUser);
            try
            {
                await sendVerificationEmail(login, verificationCode);
                ret = { success: true, pendingVerification: true, message: 'Verification code sent to your email address.', login: login };
            }
            catch(e)
            {
                console.error('Verification email send error:', e);
                ret = { error:'Account created but failed to send verification email. Please try resending the code or contact support.' };
            }
        }
        catch(e)
        {
            error = e.toString();
            ret = { error: error };
        }

        res.status(200).json(ret);
    });

    app.post('/api/verify-email', async (req, res, next) =>
    {
        const { login, code } = req.body;

        if( !login || !code || login.trim().length === 0 || code.trim().length === 0 )
        {
            res.status(200).json({ error:'Email and verification code are required.' });
            return;
        }

        const db = client.db('sample_mflix');
        const user = await db.collection('USERS').findOne({Login:login});

        if( !user )
        {
            res.status(200).json({ error:'Account not found. Please sign up first.' });
            return;
        }

        const userId = user._id.toString();

        if( user.emailVerified && user.emailVerified !== false )
        {
            try
            {
                const retToken = token.createToken( user.FirstName, user.LastName, userId );
                res.status(200).json({
                    success:true,
                    alreadyVerified:true,
                    message:'Email already verified. You can log in.',
                    accessToken:retToken.accessToken,
                    id:userId,
                    Login:user.Login,
                    firstName:user.FirstName,
                    lastName:user.LastName,
                    friend_id:user.friend_id,
                    emailVerified:true
                });
            }
            catch(e)
            {
                res.status(200).json({ error:e.message });
            }
            return;
        }

        if( !user.verificationCodeHash || !user.verificationCodeExpires )
        {
            res.status(200).json({ error:'No verification code found. Please request a new code.' });
            return;
        }

        const hashedInput = hashVerificationCode(code.trim());
        const expiration = new Date(user.verificationCodeExpires);

        if( hashedInput !== user.verificationCodeHash )
        {
            res.status(200).json({ error:'Invalid verification code.' });
            return;
        }

        if( expiration.getTime() < Date.now() )
        {
            res.status(200).json({ error:'Verification code has expired. Please request a new code.' });
            return;
        }

        await db.collection('USERS').updateOne(
        { _id: user._id },
        {
            $set:
            {
                emailVerified:true
            },
            $unset:
            {
                verificationCodeHash:'',
                verificationCodeExpires:''
            }
        });

        try
        {
            const retToken = token.createToken( user.FirstName, user.LastName, userId );
            res.status(200).json({
                success:true,
                message:'Email verified successfully.',
                accessToken:retToken.accessToken,
                id:userId,
                Login:user.Login,
                firstName:user.FirstName,
                lastName:user.LastName,
                friend_id:user.friend_id,
                emailVerified:true
            });
        }
        catch(e)
        {
            res.status(200).json({ error:e.message });
        }
    });

    app.post('/api/resend-verification', async (req, res, next) =>
    {
        const { login } = req.body;

        if( !login || login.trim().length === 0 )
        {
            res.status(200).json({ error:'Email is required to resend verification code.' });
            return;
        }

        const db = client.db('sample_mflix');
        const user = await db.collection('USERS').findOne({Login:login});

        if( !user )
        {
            res.status(200).json({ error:'Account not found. Please sign up first.' });
            return;
        }

        if( user.emailVerified && user.emailVerified !== false )
        {
            res.status(200).json({ error:'Email already verified. You can log in now.' });
            return;
        }

        const verificationCode = generateVerificationCode();
        const verificationCodeHash = hashVerificationCode(verificationCode);
        const verificationCodeExpires = getVerificationExpiryDate();

        try
        {
            await db.collection('USERS').updateOne(
            { _id: user._id },
            { $set:
                {
                    verificationCodeHash:verificationCodeHash,
                    verificationCodeExpires:verificationCodeExpires,
                    emailVerified:false
                }
            });

            await sendVerificationEmail(login, verificationCode);

            res.status(200).json({ success:true, pendingVerification:true, message:'Verification code resent.', login:login });
        }
        catch(e)
        {
            console.error('Resend verification error:', e);
            res.status(200).json({ error:'Unable to resend verification code. Please try again later.' });
        }
    });
    
    app.post('/api/addevent', async (req, res, next) =>
    {
        // incoming: date, event_type, friend_id, name, notes, userId, time
        // outgoing: error

        const { date, type, friends, name, notes, userId, time, jwtToken } = req.body;

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

        const newEvent = 
        {
            date:date,
            event_type:type,
            friends: friends,
            name:name,
            notes:notes,
            userId:userId,
            time:time
        };
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

    app.post('/api/friendidsearchevents', async (req, res, next) =>
    {
        // incoming: friend_id, search
        // outgoing: results[], error

        var error = '';

        const { friend_id, search, jwtToken } = req.body;

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
            "friends.friend_id": friend_id, 
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
        // incoming: userId, _id date, time, name, event_type, friends, notes
        // outgoing: error

        const { _id, date, type, friends, name, notes, userId, time, jwtToken } = req.body;

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
                    friends: friends,
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
                    {Nickname: {$regex:_search+'.*', $options:'i'}}
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
