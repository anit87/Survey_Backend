const mongoose = require("mongoose")
const { Schema } = mongoose;

const anyUserSchema = new Schema({
    displayName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    userRole:{
        type: String,
        enum: ['admin', 'user', 'fielduser'],
        default: 'fielduser'
    },
    resetCode:{
        type: Number,
        default:null
    },
    date: { type: Date, default: Date.now },
});

const User = mongoose.model('User', anyUserSchema);
module.exports= User