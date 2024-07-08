const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const router = express.Router();
require("dotenv").config();
const verifyTokenMiddleware = require("../../utils/verifyTokenMiddleware");
const userRoleSchema = require("../../models/auth/userByRole");
const surveyFormSchema = require("../../models/forms/surveyForm");

const getTotalForms = async function (userId) {
  try {
    const data = await surveyFormSchema.find({ filledBy: userId }).sort({ date: -1 });
    return data;
  } catch (error) {
    throw new Error("Error fetching survey forms");
  }
};


router.get("/agentslist", verifyTokenMiddleware, async (req, res) => {
  try {
    const { user } = req;
    const data = await userRoleSchema.find({
      userRole: '2',
      // creatorId: new mongoose.Types.ObjectId(user.id) // Ensure creatorId matches the logged-in user's ID
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

      const result = await userRoleSchema.aggregate(
        [
          {
            $match: {
              userRole: "2"
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
          {
            $sort: {
              displayName: 1,
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
        {
          $sort: {
            displayName: 1,
          },
        },
      ]);

      res.json({ status: true, result: agents });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
})

router.get("/getlastform", verifyTokenMiddleware, async (req, res) => {
  try {
    const { user } = req;

    if (user.userRole === 'admin') {
      // Fetch agents created by the admin
      const agents = await userRoleSchema.aggregate([
        {
          $match: {
            userRole: "2",
            // creatorId: new mongoose.Types.ObjectId(user.id)
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

      // Fetch sub-agents under each agent
      const fieldAgents = await userRoleSchema.aggregate([
        {
          $match: {
            userRole: "3",
            reportingAgent: { $in: agents.map(agent => agent._id) }
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
    } else if (user.userRole === '2') {
      // Fetch the last survey filled by the agent
      const agentSurveys = await surveyFormSchema.find({ filledBy: user.id })
        .sort({ date: -1 })
        .limit(1)
        .select('date');

      // Fetch sub-agents under the agent
      const fieldAgents = await userRoleSchema.aggregate([
        {
          $match: {
            userRole: "3",
            reportingAgent: new mongoose.Types.ObjectId(user.id)
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

      res.json({ status: true, result: { agentSurveys, fieldAgents } });
    } else {
      res.status(403).json({ status: false, message: 'Unauthorized' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message });
  }
});

// Get all surveys of a user 
router.post("/records", verifyTokenMiddleware, async (req, res) => {
  try {
    const data = await getTotalForms(req.body.id);
    const user = await userRoleSchema.findById(req.body.id).select(["_id", "displayName"]);
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

// Get all surveys based on Admin
router.get("/allrecords", verifyTokenMiddleware, async (req, res) => {
  try {
    const { user } = req;
    const { birthdayDate, isOwnProperty, monthlyHouseholdIncome, maritalStatus, occupationStatus, religion, caste, cweEducation, startDate, endDate } = req.query;

    let condition = {};

    if (birthdayDate) {
      condition.birthdayDate = parseInt(birthdayDate);
    }
    if (isOwnProperty) {
      condition.isOwnProperty = isOwnProperty;
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
        userRole: '2'
      });
      const agentIds = allAgents.map(agent => agent._id);

      // Fetch sub-agents under each agent
      const subAgents = await userRoleSchema.find({ reportingAgent: { $in: agentIds }, userRole: '3' });
      const subAgentIds = subAgents.map(subAgent => subAgent._id);

      // Combine agent and sub-agent IDs
      const allIds = [...agentIds, ...subAgentIds];

      // Fetch surveys filled by agents and sub-agents
      const surveys = await surveyFormSchema.find({ ...condition, filledBy: { $in: allIds } })
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
    const data = await userRoleSchema.findById(id).select('-password');
    res.json({ status: true, data });
  } catch (error) {
    res.status(500).send("error");
  }
})

module.exports = router;