const mongoose = require('mongoose');

module.exports = (callback) => {
  mongoose.connect(process.env.mongo_uri, {userNewUrlParse: true}, function (err) {
      if(err) {
          console.log(err);
      } else {
          console.log(`Connect to database successfully at ${process.env.app_port}`);
          callback();
      }
  })
};