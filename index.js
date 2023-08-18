const express = require('express')
const cors = require('cors')
const app = express()
const connectDb = require("./utils/db")
const formsRouter = require("./routes/forms/surveyForms")
const authRouter = require("./routes/auth/auth")
const cookieParser = require('cookie-parser');

const port = 4000
connectDb()
app.use(cors())
app.use(cookieParser());
app.use(express.json())

app.use("/auth", authRouter)
app.use("/forms", formsRouter)

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })

app.get('/', (req, res) => {
  const userData = {
    id: 123,
    username: 'exampleuser',
    role: 'admin', 
  };

  // Set a cookie
  res.cookie('user', userData, { maxAge: 5000, httpOnly: true });
  res.json({ message: 'Server is Running' });
});

app.get('/test-cookie', (req, res) => {
  res.cookie('test', '123', { maxAge: 3600000, httpOnly: true });
  res.json({ message: 'Cookie set successfully' });
});



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})