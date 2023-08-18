const mongoose = require("mongoose")
require("dotenv").config()

console.log(process.env.dbURI);
const connectDb = () => {
    mongoose.connect(process.env.dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', () => {
        console.log('MongoDB connected');
    });
}
module.exports = connectDb