const express = require("express")
const fs = require('fs');
const path = require('path');
const surveyFormSchema = require("../../models/forms/surveyForm")
const router = express.Router()
require("dotenv").config()
const cpUpload = require("../../utils/uploadFile")
const { saveBase64Image, convertBase64ToImage } = require("../../utils/functions")


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

        console.log("extractedData---- ", extractedData);

        let voterIdImage = "";
        if (req.files.voterIdImage && Array.isArray(req.files.voterIdImage) && req.files.voterIdImage.length > 0) {
            voterIdImage = req.files.voterIdImage[0].filename;
        }
        if (req.body.voterIdImagee && req.body.voterIdImagee !== 'null' && req.body.voterIdImagee !== null) {
            const base64Image = req.body.voterIdImagee;
            voterIdImage = convertBase64ToImage(base64Image);
        }

        let locationPicture = "";
        if (req.files.locationPicture && req.files.locationPicture[0]) {
            locationPicture = req.files.locationPicture[0].filename;
        }
        if (req.body.locationPicturee) {
            const base64Image = req.body.locationPicturee;
            locationPicture = convertBase64ToImage(base64Image);
        }

        const membersList = JSON.parse(req.body.ageGroupOfMembers);

        console.log("membersList---", membersList);

        const updatedMembersList = await Promise.all(membersList.map(async (obj, i) => {
            const matchingData = extractedData[i];
            const matchingCapturedData = req.body.voterIdImageMember ? req.body.voterIdImageMember[i] : undefined;

            if (matchingData && matchingData[0]) {
                return { ...obj, voterIdImg: matchingData[0].filename };
            }
            if (matchingCapturedData) {
                const imageName = convertBase64ToImage(matchingCapturedData);
                return { ...obj, voterIdImg: imageName };
            }

            return obj; // Return the original object if no match is found
        }));

        console.log("updatedMembersList---", updatedMembersList);

        // Parse isParticipated to an array of numbers
        let isParticipated = [];
        if (req.body.isParticipated) {
            isParticipated = JSON.parse(req.body.isParticipated).map(Number);
        }

        const newForm = new surveyFormSchema({
            ...req.body,
            ageGroupOfMembers: updatedMembersList,
            voterIdImage,
            locationPicture,
            isParticipated
        });

        const data = await newForm.save();
        res.status(201).json({ status: true, msg: "Successfully Saved" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

router.put("/:formId", cpUpload, async (req, res) => {
    try {
        const { formId } = req.params;
        const extractedData = extractIndexesFromObjectKeys(req.files);

        console.log("extractedData---- ", extractedData);

        let voterIdImage = "";

        if (req.files.voterIdImage && Array.isArray(req.files.voterIdImage) && req.files.voterIdImage.length > 0) {
            voterIdImage = req.files.voterIdImage[0].filename;
        }
        if (req.body.voterIdImagee && req.body.voterIdImagee !== 'null' && req.body.voterIdImagee !== null) {
            const base64Image = req.body.voterIdImagee;
            voterIdImage = convertBase64ToImage(base64Image);
        }

        let locationPicture = "";
        if (req.files.locationPicture && req.files.locationPicture[0]) {
            locationPicture = req.files.locationPicture[0].filename;
        }
        if (req.body.locationPicturee) {
            const base64Image = req.body.locationPicturee;
            locationPicture = convertBase64ToImage(base64Image);
        }

        const membersList = await JSON.parse(req.body.ageGroupOfMembers);

        console.log("membersList---", membersList);

        const updatedMembersList = await Promise.all(membersList.map(async (obj, i) => {
            const matchingData = extractedData[i];
            const matchingCapturedData = req.body.voterIdImageMember ? req.body.voterIdImageMember[i] : undefined;

            if (matchingData && matchingData[0]) {
                return { ...obj, voterIdImg: matchingData[0].filename };
            }
            if (matchingCapturedData) {
                const imageName = convertBase64ToImage(matchingCapturedData);
                return { ...obj, voterIdImg: imageName };
            }

            return obj; // Return the original object if no match is found
        }));

        console.log("updatedMembersList---", updatedMembersList);

        // Ensure voterIdNumber is a number or null
        if (req.body.voterIdNumber === 'null' || req.body.voterIdNumber === '') {
            req.body.voterIdNumber = null;
        } else {
            req.body.voterIdNumber = Number(req.body.voterIdNumber);
        }

        // Parse isParticipated to an array of numbers
        let isParticipated = [];
        if (req.body.isParticipated) {
            isParticipated = JSON.parse(req.body.isParticipated).map(Number);
        }

        const data = await surveyFormSchema.findByIdAndUpdate(formId, {
            ...req.body,
            ageGroupOfMembers: updatedMembersList,
            voterIdImage,
            locationPicture,
            isParticipated
        });

        res.status(201).json({ status: true, msg: "Successfully Updated", data });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error });
    }
});

module.exports = router;

