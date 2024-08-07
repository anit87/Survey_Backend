const mongoose = require("mongoose");
const { Schema } = mongoose;

const ageGroupOfMembers = new Schema({
    name: String,
    age: Number,
    gender: String,
    assembly: String,
    voterId: Number,
    voterIdNum: String,
    voterIdImg: String,
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
        ref: 'UserRole',
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
    isOwnProperty: {
        type: Number,
        required: true,
    },
    totalMembers: {
        type: Number,
        required: true,
    },
    religion: {
        type: String,
        required: true,
    },
    caste: {
        type: String,
    },
    cweEducation: {
        type: Number,
        required: true,
    },
    birthdayDate: {
        type: Number,
        required: true,
    },
    isParticipated: {
        type: [Number], // Ensure this is an array of numbers
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
        type: String,
    },
    voterIdImage: {
        type: String,
    },
    locationPicture: {
        type: String,
    },
    ageGroupOfMembers: {
        type: [ageGroupOfMembers],
        required: true,
    },
    assemblyConstituencyMembers: {
        type: [assemblyConstituencyMembers],
    },
    voterIDsList: {
        type: [assemblyConstituencyMembers],
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
    date: {
        type: Date,
        default: Date.now,
    },
    votedLastElection: {
        type: Number,
        required: false,
    },
    dateOfBirth: {
        type: Date,
        required: false,
    },
    weddingDate: {
        type: Date,
        required: false,
    },
    isCelebrities: {
        type: String,
        required: false,
    },
    boothNumber: {
        type: String,
        required: false,
    },
    constituency: {
        type: String,
        required: false,
    },
    wardNumber: {
        type: String,
        required: false,
    },
});

const SurveyForm = mongoose.model('SurveyForm', surveyFormSchema);

module.exports = SurveyForm;
