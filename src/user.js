const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/* eslint-disable */

const BCRYPT_COST = 11;
// Clear out mongoose's model cache to allow --watch to work for tests:
// https://github.com/Automattic/mongoose/issues/1251
mongoose.models = {};
mongoose.modelSchemas = {};

mongoose.Promise = Promise;
mongoose.connect('mongodb://localhost/users', { useMongoClient: true });

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  }
});

UserSchema.pre('save', function(next) {
  const user = this;
  bcrypt.hash(this.passwordHash, BCRYPT_COST, function(error, hash) {
    if (error) return next(error);
    user.passwordHash = hash;
    next();
  });
});

UserSchema.methods.checkPassword = function(potentialPassword, cb) {
  bcrypt.compare(potentialPassword, this.passwordHash, (err, isMatch) => {
    if (err) return cb(err);
    // console.log(isMatch);
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', UserSchema);
