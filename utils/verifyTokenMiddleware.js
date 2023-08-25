require("dotenv").config()
const jwt = require('jsonwebtoken');

const secretKey = process.env.JWT_SECRET_KEY;

const verifyTokenMiddleware = (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decodedToken = jwt.verify(token, secretKey);
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Failed to authenticate token' });
    }
};

module.exports = verifyTokenMiddleware;
