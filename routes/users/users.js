const express = require("express")
const jwt = require("jsonwebtoken")
const router = express.Router()
require("dotenv").config()
const verifyTokenMiddleware = require("../../utils/verifyTokenMiddleware")
const userRoleSchema = require("../../models/auth/userByRole")
const surveyFormSchema = require("../../models/forms/surveyForm")
const { default: mongoose } = require("mongoose")

const getTotalForms = function (userId) {
  return new Promise(async function (resolve, reject) {
    const data = await surveyFormSchema.find({ filledBy: userId }).sort({ date: -1 })
    if (data) {
      resolve(data)
    } else {
      reject(Error("error"));
    }
  });
};


router.get("/agentslist", async (req, res) => {
  console.log("1 ", req.body);
  try {
    const data = await userRoleSchema.find({ userRole: '2' })
    res.json({ data })
  } catch (error) {
    res.status(500).send("error")
  }

})


router.get("/", verifyTokenMiddleware, async (req, res) => {
  try {
    if (req.user.userRole === "admin") {
      const allAgents = await userRoleSchema.find({ userRole: '2' })

      Promise.all(
        allAgents.map(async (user, index) => {
          const fieldUsers = await userRoleSchema.find({ $or: [{ reportingAgent: user._id }, { creatorId: user._id }], userRole: { $not: { $eq: "2" } } })
          // const fieldUsers = await userRoleSchema.find({ reportingAgent: user._id  creatorId: user._id })

          const userInfo = await Promise.all(
            fieldUsers.map(async (fieldUser) => {
              const formsFilled = await getTotalForms(fieldUser._id)
              return {
                _id: fieldUser._id,
                email: fieldUser.email,
                phoneNumber: fieldUser.phoneNumber,
                displayName: fieldUser.displayName,
                userRole: fieldUser.userRole,
                reportingAgent: fieldUser.reportingAgent || "",
                surveyRecords: formsFilled
              }
            })
          )
          const surveyRecords = await getTotalForms(user._id)
          return {
            _id: user._id,
            displayName: user.displayName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            userRole: user.userRole,
            reportingAgent: user.reportingAgent || "",
            fieldUsers: userInfo,
            surveyRecords
          };
        })
      ).then(result => res.json({ status: true, result }))
    }
    if (req.user.userRole !== "admin") {
      const users = await userRoleSchema.find({ creatorId: req.user.id })
      let totalResults = 0

      Promise.all(
        users.map(async (user, index) => {
          const fieldUsers = await userRoleSchema.find({ creatorId: user._id })

          const userInfo = await Promise.all(
            fieldUsers.map(async (fieldUser, i) => {
              const formsFilled = await getTotalForms(fieldUser._id)
              totalResults = +formsFilled.length
              // console.log("------------------------",i,fieldUser.email, totalResults);
              return {
                _id: fieldUser._id,
                email: fieldUser.email,
                displayName: fieldUser.displayName,
                userRole: fieldUser.userRole,
                phoneNumber: fieldUser.phoneNumber,
                surveyRecords: formsFilled
              }
            })
          )
          const surveyRecords = await getTotalForms(user._id)
          totalResults += surveyRecords.length
          // console.log("***********************", user.email , totalResults);

          return {
            _id: user._id,
            displayName: user.displayName,
            email: user.email,
            userRole: user.userRole,
            fieldUsers: userInfo,
            surveyRecords
          };
        })
      ).then(result => res.json({ status: true, result, totalResults }))
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error })
  }
})

router.post("/records", verifyTokenMiddleware, async (req, res) => {
  console.log("1 ", req.body);
  try {
    const data = await getTotalForms(req.body.id)
    const user = await userRoleSchema.findById(req.body.id).select("-password")
    res.json({ data, user })
  } catch (error) {
    res.status(500).send("error")
  }

})


router.post("/record", async (req, res) => {
  console.log("1 ", req.body);
  try {
    const data = await surveyFormSchema.findById(req.body.id).sort({ date: -1 })
    res.json({ data })
  } catch (error) {
    res.status(500).send("error")
  }

})


router.get("/allrecords", verifyTokenMiddleware, async (req, res) => {
  try {
    const { birthdayDate, isOwnProperty, monthlyHouseholdIncome, maritalStatus, occupationStatus, religion, cweEducation, startDate, endDate } = req.query;
    console.log("filters ", req.query);
    let condition = {};

    if (birthdayDate) {
      condition.birthdayDate = parseInt(birthdayDate);
    }
    if (isOwnProperty) {
      condition.isOwnProperty = isOwnProperty === 'true' ? 1 : 0;
    }
    if (monthlyHouseholdIncome) {
      condition.monthlyHouseholdIncome = parseInt(monthlyHouseholdIncome);
    }
    if (maritalStatus) {
      condition.maritalStatus = parseInt(maritalStatus);
    }
    if (occupationStatus) {
      condition.occupationStatus = parseInt(occupationStatus);
    }
    if (religion) {
      condition.religion = parseInt(religion);
    }
    if (cweEducation) {
      condition.cweEducation = parseInt(cweEducation);
    }
    if (startDate && endDate) {
      condition.date = {
        $gte: new Date(startDate + 'T00:00:00.000+00:00'),
        $lte: new Date(endDate + 'T23:59:59.999+00:00'),
      };
    }
    if (req.user.userRole === 'admin') {
      const allForms = await surveyFormSchema.find(condition).sort({ date: -1 })

      const allUsers = await userRoleSchema.find()

      const newArr = allForms.map(async (singleForm, i) => {
        const userInfo = allUsers.find((user) => user._id.toString() === singleForm.filledBy.toString())
        return { ...singleForm, userInfo }
      })
      Promise.all(
        allForms.map(async (singleForm) => {
          const userInfo = allUsers.find((user) => user._id.toString() === singleForm.filledBy.toString())
          return {
            _id: singleForm._id,
            respondentName: singleForm.respondentName,
            pincode: singleForm.pincode,
            mobileNo: singleForm.mobileNo,
            maritalStatus: singleForm.maritalStatus,
            monthlyHouseholdIncome: singleForm.monthlyHouseholdIncome,
            date: singleForm.date,
            userInfo
          }
        })
      ).then(data => res.json({ status: true, data }))

    } else if (req.user.userRole == '3') {
      const data = await surveyFormSchema.find({ filledBy: req.user.id, ...condition }).sort({ date: -1 })
      res.json({ status: true, data })
    } else if (req.user.userRole == '2') {
      const agentForms = await surveyFormSchema.find({ filledBy: req.user.id, ...condition }).sort({ date: -1 })

      const fieldAgents = await userRoleSchema.find({ $or: [{ reportingAgent: req.user.id }, { creatorId: req.user.id }], userRole: { $not: { $eq: "2" } } })

      let formsOfAllFieldAgent = [...agentForms]

      const fieldAgentForms = await Promise.all(
        fieldAgents.map(async (fieldUser) => {
          // const formsFilled1 = await getTotalForms(fieldUser._id)
          const formsFilled = await surveyFormSchema.find({ filledBy: fieldUser._id, ...condition }).sort({ date: -1 })
          formsOfAllFieldAgent = [...formsOfAllFieldAgent, ...formsFilled]
        })
      )
      formsOfAllFieldAgent.sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json({ status: true, data: formsOfAllFieldAgent })
    }
  } catch (error) {
    res.status(500).send(error.message)
  }

})

router.get('/getuser/:id', async (req, res) => {
  const { id } = req.params
  console.log("1 ", id);
  try {
    const data = await userRoleSchema.findById(id).select('-password')
    res.json({ status: true, data })
  } catch (error) {
    res.status(500).send("error")
  }

})

module.exports = router