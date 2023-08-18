require("dotenv").config()
const axios = require("axios")
const crypto = require('crypto');
const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars')
const path = require('path')

function generateRandomCode() {
    const min = 100000; // Minimum value (inclusive)
    const max = 999999; // Maximum value (inclusive)

    const randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomCode.toString();
}

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: 'jkxdbdwwcblcpkkp'
    }
});

const handlebarOptions = {
    viewEngine: {
        partialsDir: path.resolve('./views/'),
        defaultLayout: false,
    },
    viewPath: path.resolve('./views/'),
};

// use a template file with nodemailer
transporter.use('compile', hbs(handlebarOptions))

async function sendEmail(userEmail, sub, resetCode) {
    const info = await transporter.sendMail({
        from: `<${process.env.ADMIN_EMAIL}>`,
        to: userEmail,
        subject: sub,
        template: 'resetPasswordTemplate', // the name of the template file i.e email.handlebars
        context: {
            resetCode
        }
    });
    console.log("Message sent: %s", info.messageId);
    if (info.messageId) {
        return true
    }
}

module.exports = { sendEmail, generateRandomCode }