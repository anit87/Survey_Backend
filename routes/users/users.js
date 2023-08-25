const express = require("express")
const jwt = require("jsonwebtoken")
const router = express.Router()
require("dotenv").config()
const verifyTokenMiddleware = require("../../utils/verifyTokenMiddleware")
const userRoleSchema = require("../../models/auth/userByRole")
const surveyFormSchema = require("../../models/forms/surveyForm")

const getTotalForms = function (userId) {
  return new Promise(async function (resolve, reject) {
    const data = await surveyFormSchema.find({ filledBy: userId })
    if (data) {
      resolve(data)
    } else {
      reject(Error("error"));
    }
  });
};


router.get("/", verifyTokenMiddleware, async (req, res) => {
  try {
    if (req.user.userRole === "admin") {
      const users = await userRoleSchema.find({ creatorId: req.user.id })
      const totalResults = (await surveyFormSchema.find()).length

      Promise.all(
        users.map(async (user, index) => {
          const fieldUsers = await userRoleSchema.find({ creatorId: user._id })

          const userInfo = await Promise.all(
            fieldUsers.map(async (fieldUser) => {
              const formsFilled = await getTotalForms(fieldUser._id)
              return {
                _id: fieldUser._id,
                email: fieldUser.email,
                displayName: fieldUser.displayName,
                userRole: fieldUser.userRole,
                surveyRecords: formsFilled
              }
            })
          )
          const surveyRecords = await getTotalForms(user._id)
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
    res.json({ data })
  } catch (error) {
    res.status(500).send("error")
  }

})
router.post("/record", async (req, res) => {
  console.log("1 ", req.body);
  try {
    const data = await surveyFormSchema.findById(req.body.id)
    res.json({ data })
  } catch (error) {
    res.status(500).send("error")
  }

})



module.exports = router