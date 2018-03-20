const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
/* eslint-disable */
const User = require('./user.js');

const STATUS_USER_ERROR = 422;
const BCRYPT_COST = 11;

const server = express();
// to enable parsing of json bodies for post requests
server.use(bodyParser.json());
server.use(
  session({
    secret: 'e5SPiqsEtjexkTj3Xqovsjzq8ovjfgVDFMfUzSmJO21dtXs4re',
    resave: true,
    saveUninitialized: false
  })
);

/* Sends the given err, a string or an object, to the client. Sets the status
 * code appropriately. */
const sendUserError = (err, res) => {
  res.status(STATUS_USER_ERROR);
  if (err && err.message) {
    res.json({ message: err.message, stack: err.stack });
  } else {
    res.json({ error: err });
  }
};

server.post('/users', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    sendUserError('Username and password required', res);
  } else {
    const createdUser = { username, passwordHash: password };
    const newUser = new User(createdUser);
    newUser
      .save(function(err, hash) {
        if (err) sendUserError(err, res);
      })
      .then(savedUser => res.json(savedUser))
      .catch(err => sendUserError(err, res));
  }
});

server.post('/log-in', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    sendUserError('Username and password required', res);
  }
  User.findOne({ username: username.toLowerCase() })
    .then(foundUser => {
      if (!foundUser) {
        sendUserError('No user found with the username');
      } else {
        let cb = function(err, isMatch) {
          res.json({ success: isMatch });
        };
        foundUser.checkPassword(password, cb);
        req.session.username = username;
        req.session.isAuth = true;
        console.log(req.session);
      }
    })
    .catch(err => sendUserError(err, res));
});

const validateUser = (req, res, next) => {
  if (!req.session.isAuth) sendUserError('Not logged in.', res);
  else {
    User.findOne({ username: req.session.username })
      // .select('username passwordHash -_id')
      .then(user => {
        req.user = user;
        console.log(req.user);
        next();
      })
      .catch(err => {
        res.status(500).json({ error: err });
      });
  }
};

server.get('/me', validateUser, (req, res) => {
  // Do NOT modify this route handler in any way.
  res.json(req.user);
});

module.exports = { server };
