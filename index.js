const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const cookieParser = require('cookie-parser');
const connectDb = require('./utils/db');
const formsRouter = require('./routes/forms/surveyForms');
const authRouter = require('./routes/auth/auth');
const usersRouter = require('./routes/users/users');

const app = express();
const port = 4000;

// Read SSL certificate files
// const privateKey = fs.readFileSync('./certs/server.key', 'utf8');
// const certificate = fs.readFileSync('./certs/server.cert', 'utf8');
// const credentials = { key: privateKey, cert: certificate };

connectDb();

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('public'));

app.use("/auth", authRouter);
app.use("/forms", formsRouter);
app.use("/users", usersRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Server is Running' });
});

app.get('/test-cookie', (req, res) => {
  res.cookie('test', '123', { maxAge: 3600000, httpOnly: true });
  res.json({ message: 'Cookie set successfully' });
});

// HTTP server
app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

// Create HTTPS server
// const httpsServer = https.createServer(credentials, app);

// httpsServer.listen(port, (error) => {
//   if (error) {
//     console.error('Error starting HTTPS server:', error);
//   } else {
//     console.log(`App listening on port ${port} over HTTPS`);
//   }
// });
