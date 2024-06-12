const express = require('express');
const path = require('path');
// const { ObjectId } = require('mongodb');

const app = express();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const markHandling = require('./routes/markHandling');

app.use(markHandling);

// const {
//   createProduct,
//   createOtherImages,
// } = require('./database');

// const homePageRoute = require('./routes/home_page');

// app.use(homePageRoute);

// const options = {
//   key: fs.readFileSync(path.join(__dirname, 'key', 'private.key')),
//   cert: fs.readFileSync(path.join(__dirname, 'key', 'certificate.crt')),
// };

app.use(express.static(path.join(__dirname, '../client')));

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});