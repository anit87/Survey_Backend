const mongoose = require("mongoose")
const { Schema } = mongoose;
const ageGroupOfMembers = new Schema({
    name: String,
    age: Number,
    gender: String,
    assembly: String,
    voterId: String,
    voterIdNum: String,

});
const assemblyConstituencyMembers = new Schema({
    name: String,
    age: Number,
    gender: String,
    assemblyName: String
});

const surveyFormSchema = new Schema({
    filledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' || 'UserRole',
        required: true
    },
    location: Object,
    respondentName: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true
    },
    pincode: {
        type: Number,
        required: true,
    },
    mobileNo: {
        type: Number,
        required: true,
    },
    residingYears: {
        type: Number
    },
    isOwnProperty: {
        type: Number,
        required: true,
    },
    totalMembers: {
        type: Number,
        required: true,
    },
    stayingMembers: {
        type: Number
    },
    religion: {
        type: String,
        required: true,
    },
    caste: {
        type: String,
        required: true,
    },
    cweEducation: {
        type: Number,
        required: true,
    },
    respondentEducation: {
        type: Number
    },
    birthdayDate: {
        type: Number,
        required: true,
    },
    isParticipated: {
        type: Number,
        required: true,
    },
    categoryFallUnder: {
        type: Number,
        required: true,
    },
    registeredVoter: {
        type: Number,
        required: true,
    },
    voterIdNumber: {
        type: Number
    },
    ageGroupOfMembers: {
        type: [ageGroupOfMembers],
        required: true,
    },
    assemblyConstituencyMembers: {
        type: [assemblyConstituencyMembers]
    },
    voterIDsList: {
        type: [assemblyConstituencyMembers]
    },
    maritalStatus: {
        type: Number,
        required: true,
    },
    occupationStatus: {
        type: Number,
        required: true,
    },
    monthlyHouseholdIncome: {
        type: Number,
        required: true,
    },
    date: { type: Date, default: Date.now },
});

const SurveyForm = mongoose.model('SurveyForm', surveyFormSchema);

module.exports = SurveyForm

