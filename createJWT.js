const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.createToken = function ( fn, ln, id, fid )
{
    return _createToken( fn, ln, id, fid );
}

_createToken = function ( fn, ln, id, fid )
{
    try
    {
        const expiration = new Date();
        const user = {userId:id,firstName:fn,lastName:ln,friend_id:fid};
        const accessToken= jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '4h'} );
        // In order to exoire with a value other than the default, use the
        // following
        /*
        const accessToken= jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '30m'} );
        '24h'
        '365d'
        */
        var ret = {accessToken:accessToken};
    }
    catch(e)
    {
        var ret = {error:e.message};
    }
    return ret;
}

exports.isExpired = function( token )
{
    var isError = jwt.verify( token, process.env.ACCESS_TOKEN_SECRET,
    (err, verifiedJwt) =>
    {
        if( err )
        {
            return true;
        }
        else
        {
            return false;
        }
    });

    return isError;
}

exports.refresh = function( token )
{
    var ud = jwt.decode(token,{complete:true});
    var userId = ud.payload.userId;
    var friend_id = ud.payload.friend_id;

    var firstName = ud.payload.firstName;
    var lastName = ud.payload.lastName;

    return _createToken( firstName, lastName, userId, friend_id );
}