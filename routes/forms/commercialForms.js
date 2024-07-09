const express = require("express");
const mongoose = require("mongoose");
const fs = require('fs');
const path = require('path');
const CommercialForm = require("../../models/forms/commercialForm");
const UserRole = require("../../models/auth/userByRole");
const router = express.Router();
require("dotenv").config();
const verifyTokenMiddleware = require('../../utils/verifyTokenMiddleware')

// Save Or Update Commercial Form
router.post("/", verifyTokenMiddleware, async (req, res) => {
    try {
        const { user } = req;
        const { formId } = req.body;

        if (formId) {
            // Check if formId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(formId)) {
                return res.status(400).json({ status: false, msg: "Invalid form ID" });
            }

            const data = await CommercialForm.findById(formId);

            if (!data) {
                return res.status(404).json({ status: false, msg: "Form not found" });
            }

            // Update the existing form
            await CommercialForm.findByIdAndUpdate(
                formId,
                { ...req.body },
                { new: true }
            );
        } else {
            // Create a new form
            const newForm = new CommercialForm({ ...req.body, filledBy: user.id });
            await newForm.save();
        }

        res.status(201).json({ status: true, msg: "Successfully Saved" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ status: false, message: "An error occurred while saving the form", error: error.message });
    }
});

// Get all surveys based on Admin
router.get("/", verifyTokenMiddleware, async (req, res) => {
    try {
        const { user } = req;
        let data = null;

        if (user.userRole === 'admin') {
            data = await CommercialForm.find()
                .populate({
                    path: 'filledBy',
                    select: 'displayName userRole'
                })
                .sort({ date: -1 });
        } else if (user.userRole == '2') {
            const agentForms = await CommercialForm.find({ filledBy: user.id }).sort({ date: -1 });

            const subAgents = await UserRole.find({ reportingAgent: user.id, userRole: '3' });
            const subAgentIds = subAgents.map(subAgent => subAgent._id);

            const subAgentForms = await CommercialForm.find({ filledBy: { $in: subAgentIds } }).sort({ date: -1 });

            data = [...agentForms, ...subAgentForms].sort((a, b) => new Date(b.date) - new Date(a.date));
        } else {
            data = await CommercialForm.find({ filledBy: new mongoose.Types.ObjectId(user.id) });
        }
        res.status(201).json({ status: true, data });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});

// Get all surveys based on userId
router.post("/filledbyuser", verifyTokenMiddleware, async (req, res) => {
    try {
        const data = await CommercialForm.find({ filledBy: req.body.id }).sort({ date: -1 });

        const user = await UserRole.findById(req.body.id).select(["_id", "displayName"]);
        res.json({ data, user });
    } catch (error) {
        res.status(500).send("error");
    }
})

//Get Single form
router.post("/getForm", async (req, res) => {
    try {
        const data = await CommercialForm.findById(req.body.id).sort({ date: -1 });
        if (!data) {
            return res.status(404).json({ error: "Form not found" });
        }
        res.json({ status: true, data });
    } catch (error) {
        console.error("Error fetching form:", error);
        res.status(500).json({ status: false, error: error.message });
    }
});


module.exports = router;