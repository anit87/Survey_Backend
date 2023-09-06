const express = require("express")
const surveyFormSchema = require("../../models/forms/surveyForm")
const router = express.Router()
require("dotenv").config()
const upload = require("../../utils/uploadFile")

router.post("/", upload.single('voterIdImage'), async (req, res) => {
    try {
        const membersList = JSON.parse(req.body.ageGroupOfMembers)
        const loc = JSON.parse(req.body.location)
        const newForm = new surveyFormSchema({ ...req.body, ageGroupOfMembers: membersList, location: loc, voterIdImage: req.file.filename || "" })
        const data = await newForm.save()
        res.status(201).json({ status: true, msg: "Successfully Saved", data })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error })
    }
})

module.exports = router

