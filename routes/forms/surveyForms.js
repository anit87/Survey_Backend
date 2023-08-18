const express = require("express")
const surveyFormSchema = require("../../models/forms/surveyForm")
const router = express.Router()
require("dotenv").config()

router.post("/", async (req, res) => {
    try {
        const newForm = new surveyFormSchema(req.body)
        const data = await newForm.save()
        res.status(201).json({ status: true, msg: "Successfully Saved", data })
    } catch (error) {
        console.log(error);
        res.status(500).json({ error })
    }
})

module.exports = router

