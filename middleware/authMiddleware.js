const jwt = require("jsonwebtoken");
require("dotenv").config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // bearer TOKEN
    
    if (token == null) return res.sendStatus(401); // if there isn't any token

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded; // add user info to request
        next(); // proceed to next middleware or route handler
    } catch (err) {
        return res.sendStatus(403); // invalid token
    }
};

module.exports = authenticateToken;