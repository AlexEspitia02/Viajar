const express = require('express');
const path = require('path');

const app = express();


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

app.use(express.static(path.join(__dirname, 'views')));

// app.get('/admin/blog.html', async (req, res) => {
//     res.json({hi:'hi'});
// });

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
