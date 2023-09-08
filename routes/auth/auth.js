const express = require("express")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const router = express.Router()
require("dotenv").config()
const verifyTokenMiddleware = require("../../utils/verifyTokenMiddleware")

const { sendEmail, generateRandomCode } = require("../../utils/sendMail")
const userSchema = require("../../models/auth/users")
const userRoleSchema = require("../../models/auth/userByRole")

const verifyToken = (token, secret) => {
    try {
        const decoded = jwt.verify(token, secret);
        return decoded; // Returns the decoded token if it's valid
    } catch (error) {
        console.error('Invalid token:', error.message);
        return null; // Token is invalid or expired
    }
};

// Create User with email and password
router.post("/signup", verifyTokenMiddleware, async (req, res) => {
    try {
        const { displayName, password, userRole, phoneNumber, id } = req.body
        const email = req.body.email.toLowerCase()
        if (req.user.userRole === '3') {
            res.json({ status: false, msg: "You are not authorized" })
            return
        }
        if (id) {
            let user = await userRoleSchema.findByIdAndUpdate(id,{
                displayName,
                email,
                phoneNumber
            })
            // console.log("update result", user);
            res.status(200).json({ status: true, msg: "Updated Successfully" })
            return
        }

        let user = await userRoleSchema.findOne({ email }).select('-password')
        if (user) {
            res.json({
                status: false,
                msg: "Email already exits",
                data: user,
            })
            return
        }
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds)

        if (req.user.userRole === "admin") {
            const newUser = new userRoleSchema({
                creatorId: req.user.id,
                reportingAgent: req.body.reportingAgent || req.user.id,
                displayName,
                email,
                userRole,
                password: hash,
                phoneNumber
            })
            await newUser.save()
            res.status(201).json({ status: true, msg: "User Created Successfully" })

        } else {
            const newUser = new userRoleSchema({
                creatorId: req.user.id,
                reportingAgent: userRole == "3" ? req.user.id : null,
                displayName,
                email,
                userRole,
                password: hash,
                phoneNumber
            })
            const data = await newUser.save()
            res.status(201).json({ status: true, msg: "User Created Successfully" })
        }

    } catch (error) {
        console.log(error);
        res.status(500).json({ error })
    }
})

router.post("/signin", async (req, res) => {
    try {
        const { password } = req.body
        const email = req.body.email.toLowerCase()

        let user = await userSchema.findOne({ email })

        if (!user) {
            user = await userRoleSchema.findOne({ email })
        }
        // console.log("user sign in ", user);

        if (!user) {
            res.json({
                status: false,
                msg: 'Invalid email or password'
            });
            return
        }
        const result = await bcrypt.compare(password, user.password)
        // console.log("result ", result);
        if (!result) {
            res.json({
                status: false,
                msg: 'Invalid email or password'
            });
            return
        } else if (result) {
            const token = await jwt.sign({
                id: user._id.toString(),
                email: user.email,
                userRole: user.userRole,
                displayName: user.displayName
            }, process.env.JWT_SECRET_KEY)

            res.cookie('token', token, { maxAge: 3600000, httpOnly: true });
            res.json({
                status: true,
                token,
                msg: 'Logged in successfully'
            });
        }

    } catch (error) {
        res.status(500).send('Error logging in');
    }
})

router.post("/verifytoken", async (req, res) => {
    const data = verifyToken(req.body.token, process.env.JWT_SECRET_KEY)
    if (data) {
        res.json({
            status: true,
            isVerified: true,
            data,
            msg: 'User Verified'
        })
    } else {
        res.json({
            status: false,
            isVerified: false,
            data,
            msg: 'User Not Verified'
        })
    }
})

router.post("/resetpassword", async (req, res) => {
    try {
        const { email } = req.body
        let user = await userSchema.findOne({ email })

        if (!user) {
            res.json({
                status: false,
                msg: 'Invalid email'
            });
            return
        }
        const resetCode = generateRandomCode()
        // console.log("1 resetCode ", resetCode);

        await sendEmail(email, "Reset Password", resetCode)
        user = await userSchema.findOneAndUpdate({ email }, { resetCode })
        // console.log("2 ", user);
        res.json({ status: true, msg: "Check Your Email", email: user.email, resetCode })

    } catch (error) {
        console.log(error);
        res.status(500).send('Error logging in');
    }
})

module.exports = router

