const express = require("express")
const fs = require('fs');
const path = require('path');
const surveyFormSchema = require("../../models/forms/surveyForm")
const router = express.Router()
require("dotenv").config()
const cpUpload = require("../../utils/uploadFile")
const {saveBase64Image,convertBase64ToImage}= require("../../utils/functions")


function extractIndexesFromObjectKeys(obj) {
    const result = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const index = key.match(/\[(\d+)\]/);
            if (index) {
                const numericIndex = parseInt(index[1]);
                result[numericIndex] = obj[key];
            }
        }
    }
    return result;
}


router.post("/", cpUpload, async (req, res) => {
    try {
        const extractedData = extractIndexesFromObjectKeys(req.files);

        let voterIdImage
        if (!req.files.voterIdImage) {
            voterIdImage = ""
        } else {
            voterIdImage = req.files.voterIdImage[0].filename
        }
        if (req.body.voterIdImagee) {
            const base64Image = req.body.voterIdImagee;
            voterIdImage = convertBase64ToImage(base64Image);
        }


        let locationPicture
        if (!req.files.locationPicture) {
            locationPicture = ""
        } else {
            locationPicture = req.files.locationPicture[0].filename
        }
        if (req.body.locationPicturee) {
            const base64Image = req.body.locationPicturee;
            locationPicture = convertBase64ToImage(base64Image);
        }
        const membersList = JSON.parse(req.body.ageGroupOfMembers)
        const loc = JSON.parse(req.body.location)

        const updatedMembersList = await Promise.all(membersList.map(async (obj, i) => {
            const matchingData = extractedData[i];
            const matchingCapturedData = req.body.voterIdImageMember[i];

            if (matchingData) {
                return { ...obj, voterIdImg: matchingData[0].filename };
            }
            if (matchingCapturedData) {
                imageName = convertBase64ToImage(matchingCapturedData);
                return { ...obj, voterIdImg: imageName };
            }


            return obj; // Return the original object if no match is found
        }));
        
        const newForm = new surveyFormSchema({ ...req.body, ageGroupOfMembers: updatedMembersList, location: loc, voterIdImage, locationPicture })
        const data = await newForm.save()
        res.status(201).json({ status: true, msg: "Successfully Saved", data })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error })
    }
})

module.exports = router

