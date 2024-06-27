const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();
const verifyTokenMiddleware = require("../../utils/verifyTokenMiddleware");
const userRoleSchema = require("../../models/auth/userByRole");
const surveyFormSchema = require("../../models/forms/surveyForm");

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

router.get("/agentslist", verifyTokenMiddleware, async (req, res) => {
  try {
    const { user } = req;
    const data = await userRoleSchema.find({
      userRole: '2',
      creatorId: new mongoose.Types.ObjectId(user.id) // Ensure creatorId matches the logged-in user's ID
    });
    res.json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).send("error");
  }
});

router.get("/", verifyTokenMiddleware, async (req, res) => {
  try {
    const { user } = req;

    if (user.userRole === "admin") {

      // const allAgents = await userRoleSchema.find({ userRole: '2' })

      // Promise.all(
      //   allAgents.map(async (user, index) => {
      //     const fieldUsers = await userRoleSchema.find({ $or: [{ reportingAgent: user._id }, { creatorId: user._id }], userRole: { $not: { $eq: "2" } } })
      //     // const fieldUsers = await userRoleSchema.find({ reportingAgent: user._id  creatorId: user._id })

      //     const userInfo = await Promise.all(
      //       fieldUsers.map(async (fieldUser) => {
      //         const formsFilled = await getTotalForms(fieldUser._id)
      //         return {
      //           _id: fieldUser._id,
      //           email: fieldUser.email,
      //           phoneNumber: fieldUser.phoneNumber,
      //           displayName: fieldUser.displayName,
      //           userRole: fieldUser.userRole,
      //           reportingAgent: fieldUser.reportingAgent || "",
      //           surveyRecords: formsFilled
      //         }
      //       })
      //     )
      //     const surveyRecords = await getTotalForms(user._id)
      //     return {
      //       _id: user._id,
      //       displayName: user.displayName,
      //       email: user.email,
      //       phoneNumber: user.phoneNumber,
      //       userRole: user.userRole,
      //       reportingAgent: user.reportingAgent || "",
      //       fieldUsers: userInfo,
      //       surveyRecords
      //     };
      //   })
      // ).then(result => (console.timeEnd('myCode'), res.json({ status: true, result })))


      const result = await userRoleSchema.aggregate(
        [
          {
            $match: {
              userRole: "2",
              creatorId: new mongoose.Types.ObjectId(user.id), // Ensure creatorId matches the logged-in user's ID
            },
          },
          {
            $lookup: {
              from: "userroles",
              let: { userId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $or: [
                            { $eq: ["$creatorId", "$$userId"] },
                            { $eq: ["$reportingAgent", "$$userId"] },
                          ],
                        },
                        { $eq: ["$userRole", "3"] },
                      ],
                    },
                  },
                },
                {
                  $lookup: {
                    from: "surveyforms",
                    localField: "_id",
                    foreignField: "filledBy",
                    as: "surveyRecords",
                  },
                },
              ],
              as: "fieldUsers",
            },
          },
          {
            $lookup: {
              from: "surveyforms",
              localField: "_id",
              foreignField: "filledBy",
              as: "surveyRecords",
            },
          },
        ]
      )

      res.json({ status: true, result });
    }
    if (req.user.userRole !== "admin") {
      const agents = await userRoleSchema.aggregate([
        {
          $match: {
            $or: [
              {
                creatorId: new mongoose.Types.ObjectId(req.user.id),
              },
              {
                reportingAgent: new mongoose.Types.ObjectId(req.user.id),
              },
            ],
            $and: [
              {
                userRole: "3",
              },
            ],
          },
        },
        {
          $lookup: {
            from: "surveyforms",
            localField: "_id",
            foreignField: "filledBy",
            as: "surveyRecords",
          },
        },
        {
          $addFields: {
            fieldUsers: [],
          },
        },
      ]);

      res.json({ status: true, result: agents });

      // const users = await userRoleSchema.find({ creatorId: req.user.id })     // all F users
      // Promise.all(
      //   users.map(async (user, index) => {
      //     const fieldUsers = await userRoleSchema.find({ creatorId: user._id })

      //     const userInfo = await Promise.all(
      //       fieldUsers.map(async (fieldUser, i) => {
      //         const formsFilled = await getTotalForms(fieldUser._id)
      //         return {
      //           _id: fieldUser._id,
      //           email: fieldUser.email,
      //           displayName: fieldUser.displayName,
      //           userRole: fieldUser.userRole,
      //           phoneNumber: fieldUser.phoneNumber,
      //           surveyRecords: formsFilled
      //         }
      //       })
      //     )
      //     const surveyRecords = await getTotalForms(user._id)

      //     return {
      //       _id: user._id,
      //       displayName: user.displayName,
      //       email: user.email,
      //       userRole: user.userRole,
      //       fieldUsers: userInfo,
      //       surveyRecords
      //     };
      //   })
      // ).then(result => res.json({ status: true, result }))
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
})

router.get("/getlastform", verifyTokenMiddleware, async (req, res) => {
  try {
    if (req.user.userRole === "admin" || "2") {
      const agents = await userRoleSchema.aggregate([
        {
          $match: {
            userRole: "2"
          }
        },
        {
          $lookup: {
            from: "surveyforms",
            localField: "_id",
            foreignField: "filledBy",
            as: "surveys",
            pipeline: [
              {
                $sort: {
                  date: -1
                }
              },
              {
                $limit: 1
              },
              {
                $project: {
                  date: 1
                }
              }
            ]
          }
        },
        {
          $project: {
            displayName: 1,
            email: 1,
            surveys: 1
          }
        }
      ]);
      const fieldAgents = await userRoleSchema.aggregate([
        {
          $match: {
            userRole: "3"
          }
        },
        {
          $lookup: {
            from: "surveyforms",
            localField: "_id",
            foreignField: "filledBy",
            as: "surveys",
            pipeline: [
              {
                $sort: {
                  date: -1
                }
              },
              {
                $limit: 1
              },
              {
                $project: {
                  date: 1
                }
              }

            ]
          }
        },
        {
          $project: {
            displayName: 1,
            email: 1,
            creatorId: 1,
            reportingAgent: 1,
            surveys: 1
          }
        }

      ]);
      res.json({ status: true, result: { agents, fieldAgents } });
    } else {
      res.json({ status: false, result: { agents: [], fieldAgents: [] } });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
})

router.post("/records", verifyTokenMiddleware, async (req, res) => {
  try {
    const data = await getTotalForms(req.body.id);
    const user = await userRoleSchema.findById(req.body.id).select("-password");
    res.json({ data, user });
  } catch (error) {
    res.status(500).send("error");
  }
})


router.post("/record", async (req, res) => {
  try {
    const data = await surveyFormSchema.findById(req.body.id).sort({ date: -1 });
    res.json({ data });
  } catch (error) {
    res.status(500).send("error");
  }
})

router.get("/allrecords", verifyTokenMiddleware, async (req, res) => {
  try {
    const { user } = req;
    const { birthdayDate, isOwnProperty, monthlyHouseholdIncome, maritalStatus, occupationStatus, religion, caste, cweEducation, startDate, endDate } = req.query;

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
    if (caste) {
      condition.caste = parseInt(caste);
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
    // Admin: Fetch all surveys filled by agents and sub-agents
    if (user.userRole === 'admin') {
      // Fetch all agents created by the admin
      const allAgents = await userRoleSchema.find({
        userRole: '2',
        creatorId: new mongoose.Types.ObjectId(user.id)
      });
      const agentIds = allAgents.map(agent => agent._id);

      // Fetch sub-agents under each agent
      const subAgents = await userRoleSchema.find({ reportingAgent: { $in: agentIds }, userRole: '3' });
      const subAgentIds = subAgents.map(subAgent => subAgent._id);

      // Combine agent and sub-agent IDs
      const allIds = [...agentIds, ...subAgentIds];

      // Fetch surveys filled by agents and sub-agents
      const surveys = await SurveyForm.find({ ...condition, filledBy: { $in: allIds } })
        .populate({
          path: 'filledBy',
          select: 'displayName userRole'
        })
        .sort({ date: -1 });

      res.json({ status: true, data: surveys });

      // Sub-agent: Fetch all surveys filled by the sub-agent
    } else if (user.userRole == '3') {
      const data = await surveyFormSchema.find({ filledBy: user.id, ...condition }).sort({ date: -1 });
      res.json({ status: true, data });

      // Agent: Fetch all surveys filled by the agent and their sub-agents
    } else if (user.userRole == '2') {
      const agentForms = await surveyFormSchema.find({ filledBy: user.id, ...condition }).sort({ date: -1 });

      const subAgents = await userRoleSchema.find({ reportingAgent: user.id, userRole: '3' });
      const subAgentIds = subAgents.map(subAgent => subAgent._id);

      const subAgentForms = await surveyFormSchema.find({ filledBy: { $in: subAgentIds }, ...condition }).sort({ date: -1 });

      const formsOfAllFieldAgent = [...agentForms, ...subAgentForms].sort((a, b) => new Date(b.date) - new Date(a.date));

      res.json({ status: true, data: formsOfAllFieldAgent });
    }
  } catch (error) {
    console.log("Error fetching survey records:", error);
    res.status(500).send(error.message);
  }
});

router.get('/getuser/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const data = await userRoleSchema.findById(id).select('-password')
    res.json({ status: true, data })
  } catch (error) {
    res.status(500).send("error")
  }
})

module.exports = router