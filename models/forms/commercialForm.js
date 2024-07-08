const mongoose = require("mongoose");
const { Schema } = mongoose;

const commercialFormSchema = new Schema({
    filledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserRole',
        required: true
    },
    location: {
        type: Object,
        required: false
    },
    establishmentName: {
        type: String,
        required: false
    },
    establishmentType: {
        type: String,
        required: true
    },
    natureOfBusiness: {
        type: String,
        required: false
    },
    contactPerson: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const CommercialForm = mongoose.model('CommercialForm', commercialFormSchema);

module.exports = CommercialForm;
