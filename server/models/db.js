const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();

let dbConnection;
const encodedPassword = encodeURIComponent(process.env.MONGODB_PASSWORD);
let uri = `mongodb+srv://sss88154:${encodedPassword}@mytravel.wveyou6.mongodb.net/?retryWrites=true&w=majority&appName=MyTravel`;

module.exports={
    connectToDb: (cb) => {
        MongoClient.connect(uri)
        .then((client) => {
            dbConnection = client.db();
            return cb();
        })
        .catch(err => {
            console.log(err);
            return cb(err);
        })
    },
    getDb: () => dbConnection
};