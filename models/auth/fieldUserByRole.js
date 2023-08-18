const mongoose = require("mongoose")
const { Schema } = mongoose;

const fielduserByRoleSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserRole'
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
    userRole:{
        type: String,
        enum: ['admin', 'user', 'fielduser'],
        default: 'user'
    },
    resetCode:{
        type: Number,
        default:null
    },
    date: { type: Date, default: Date.now },
});

const FieldUserRole = mongoose.model('FieldUserRole', fielduserByRoleSchema);
module.exports= FieldUserRole