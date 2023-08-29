const mongoose = require("mongoose")
const { Schema } = mongoose;

const userByRoleSchema = new Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' || 'UserRole'
    },
    reportingAgent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' || 'UserRole'
    },
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
    phoneNumber: {
        type: String,
        required: true,
    },

    userRole:{
        type: String,
        enum: ['admin', '2', '3'],
        default: '3'
    },
    resetCode:{
        type: Number,
        default:null
    },
    date: { type: Date, default: Date.now },
});

const UserRole = mongoose.model('UserRole', userByRoleSchema);
module.exports= UserRole