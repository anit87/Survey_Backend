const express = require("express");
const fs = require('fs');
const path = require('path');
const CommercialForm = require("../../models/forms/commercialForm");
const router = express.Router();
require("dotenv").config();
const verifyTokenMiddleware = require('../../utils/verifyTokenMiddleware')

// Save Or Update Commercial Form
router.post("/", verifyTokenMiddleware, async (req, res) => {
    try {
        const { user } = req;
        const { formId } = req.body;

        if (formId) {
            // Update the existing form
            const data = await CommercialForm.findByIdAndUpdate(
                formId,
                { ...req.body, filledBy: user.id },
                { new: true }
            );
            if (!data) {
                return res.status(404).json({ status: false, msg: "Form not found" });
            }
        } else {
            // Create a new form
            const newForm = new CommercialForm({ ...req.body, filledBy: user.id });
            await newForm.save();
        }

        res.status(201).json({ status: true, msg: "Successfully Saved" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;