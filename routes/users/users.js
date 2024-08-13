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
              ],
              as: "fieldUsers",
            },
          },
          {
            $sort: {
              displayName: 1,
            },
          },
        ]
      )

      return res.json({ status: true, result });
    }
    if (req.user.userRole === '2') {

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

      return res.json({ status: true, result: agents });
    } else {
      return res.status(401).json({ status: false, result: [] });
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
                  respondentName: 1,
                  date: 1
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: "commercialforms",
            localField: "_id",
            foreignField: "filledBy",
            as: "lastCommercial",
            pipeline: [
              { $sort: { date: -1 } },
              { $limit: 1 },
              {
                $project: {
                  establishmentName: 1,
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
            surveys: 1,
            lastCommercial: 1
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
                  respondentName: 1,
                  date: 1
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: "commercialforms",
            localField: "_id",
            foreignField: "filledBy",
            as: "lastCommercial",
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
                  establishmentName: 1,
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
            surveys: 1,
            lastCommercial: 1
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
                  respondentName: 1,
                  date: 1
                }
              }
            ]
          }
        },
        {
          $lookup: {
            from: "commercialforms",
            localField: "_id",
            foreignField: "filledBy",
            as: "lastCommercial",
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
                  establishmentName: 1,
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
            surveys: 1,
            lastCommercial: 1
          }
        }
      ]);

      res.json({ status: true, result: { agentSurveys, fieldAgents } });
    } else {
      res.status(403).json({ status: false, message: 'Unauthorized' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, error: error.message });
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
router.post("/allrecords", verifyTokenMiddleware, async (req, res) => {
  try {
    const { user } = req;
    const { birthdayDate, isOwnProperty, monthlyHouseholdIncome, maritalStatus, occupationStatus, religion, caste, cweEducation, startDate, endDate } = req.query;

    let condition = {};

    if (birthdayDate) {
      condition.birthdayDate = parseInt(birthdayDate, 10);
    }
    if (isOwnProperty) {
      condition.isOwnProperty = isOwnProperty;
    }
    if (monthlyHouseholdIncome) {
      condition.monthlyHouseholdIncome = parseInt(monthlyHouseholdIncome, 10);
    }
    if (maritalStatus) {
      condition.maritalStatus = parseInt(maritalStatus, 10);
    }
    if (occupationStatus) {
      condition.occupationStatus = parseInt(occupationStatus, 10);
    }
    if (religion) {
      condition.religion = parseInt(religion, 10);
    }
    if (caste) {
      condition.caste = parseInt(caste, 10);
    }
    if (cweEducation) {
      condition.cweEducation = parseInt(cweEducation, 10);
    }
    if (startDate && endDate) {
      condition.date = {
        $gte: new Date(startDate + 'T00:00:00.000+00:00'),
        $lte: new Date(endDate + 'T23:59:59.999+00:00'),
      };
    }

    const limitParsed = parseInt(req.body.limit, 10) || 10;
    const pageParsed = parseInt(req.body.page, 10) || 1;
    const skip = (pageParsed - 1) * limitParsed;

    let surveys = null;
    let totalRecords = null;

    // Admin: Fetch all surveys filled by agents and sub-agents
    if (user.userRole === 'admin') {
      surveys = await surveyFormSchema.find(condition)
        .populate({
          path: 'filledBy',
          select: 'displayName userRole'
        })
        .select(['_id', 'mobileNo', 'respondentName', 'pincode', 'maritalStatus', 'date'])
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitParsed);

      totalRecords = await surveyFormSchema.countDocuments(condition);

      // Sub-agent: Fetch all surveys filled by the sub-agent
    } else if (user.userRole === '3') {
      surveys = await surveyFormSchema.find({ filledBy: user.id, ...condition })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitParsed);

      totalRecords = await surveyFormSchema.countDocuments({ filledBy: user.id, ...condition });

      // Agent: Fetch all surveys filled by the agent and their sub-agents
    } else if (user.userRole === '2') {
      const subAgents = await userRoleSchema.find({ reportingAgent: user.id, userRole: '3' });
      const subAgentIds = subAgents.map(subAgent => subAgent._id);
      const allIds = [...subAgentIds, user.id];

      surveys = await surveyFormSchema.find({ filledBy: { $in: allIds }, ...condition })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitParsed);

      totalRecords = await surveyFormSchema.countDocuments({ filledBy: { $in: allIds }, ...condition });
    }

    res.json({
      status: true,
      data: surveys,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limitParsed),
      currentPage: pageParsed
    });
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