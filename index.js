const express = require('express')
const cors = require('cors')
const app = express()
const connectDb = require("./utils/db")
const formsRouter = require("./routes/forms/surveyForms")
const authRouter = require("./routes/auth/auth")
const usersRouter = require("./routes/users/users")
const cookieParser = require('cookie-parser');

const port = 4000
connectDb()
app.use(cors())
app.use(cookieParser());
app.use(express.json())
app.use(express.static('public'))
app.use('/uploads', express.static('public'))

app.use("/auth", authRouter)
app.use("/forms", formsRouter)
app.use("/users", usersRouter)

app.get('/', (req, res) => {
  res.json({ message: 'Server is Running' });
});

app.get('/test-cookie', (req, res) => {
  res.cookie('test', '123', { maxAge: 3600000, httpOnly: true });
  res.json({ message: 'Cookie set successfully' });
});

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})