const express = require("express")
const surveyFormSchema = require("../../models/forms/surveyForm")
const router = express.Router()
require("dotenv").config()
const upload = require("../../utils/uploadFile")


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

const cpUpload = upload.fields([
    { name: 'voterIdImage', maxCount: 10 },
    { name: 'voterIdImageMember[0]', maxCount: 10 },
    { name: 'voterIdImageMember[1]', maxCount: 10 },
    { name: 'voterIdImageMember[2]', maxCount: 10 },
    { name: 'voterIdImageMember[3]', maxCount: 10 },
    { name: 'voterIdImageMember[4]', maxCount: 10 },
    { name: 'voterIdImageMember[5]', maxCount: 10 }
])

router.post("/", cpUpload, async (req, res) => {
    try {
        const extractedData = extractIndexesFromObjectKeys(req.files);


        let voterIdImage
        if (!req.files.voterIdImage) {
            voterIdImage = ""
        } else {
            voterIdImage = req.files.voterIdImage[0].filename
        }
        const membersList = JSON.parse(req.body.ageGroupOfMembers)
        const loc = JSON.parse(req.body.location)



        // await Promise.all(for (const key in extractedData) {
        //     console.log("11111111111```````````````````", key);
        //     membersList.forEach((obj, i )=> {
        //         if(key==i){
        //             return{...obj, voterIdImg:extractedData[key][0].filename}
        //         }
        //     });
        // })



        // const updatedMembersList = await Promise.all(Object.keys(extractedData).map(async (key) => {

        //     const matchingObject = membersList.find((obj, i) => key == i);

        //     if (matchingObject) {
        //         return { ...matchingObject, voterIdImg: extractedData[key][0].filename };
        //     }

        //     return matchingObject; // Return the original object if no match is found
        // }));

        const updatedMembersList = await Promise.all(membersList.map(async (obj, i) => {
            // console.log("11111111111```````````````````", i);
          
            const matchingData = extractedData[i];
          
            if (matchingData) {
              return { ...obj, voterIdImg: matchingData[0].filename };
            }
          
            return obj; // Return the original object if no match is found
          }));
        // console.log("-----------***********", updatedMembersList);
        const newForm = new surveyFormSchema({ ...req.body, ageGroupOfMembers: updatedMembersList, location: loc, voterIdImage })
        const data = await newForm.save()
        res.status(201).json({ status: true, msg: "Successfully Saved", data })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error })
    }
})

module.exports = router

