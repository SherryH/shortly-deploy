var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find({}, function(err, results) {
    if (err) {
      throw err;
    } else {
      res.status(200).send(results);
    }
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;
  console.log('uri: ', uri);
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }
  Link.findOne({ url: uri }, function(err, result) {
    if (err) {
      return res.sendStatus(404);
    } else {
      //check if link exists or not
      if (result) {
        res.status(200).send(result);
      } else {
        //get a title and hash create a new link
        util.getUrlTitle(uri, function(err, title) {
          if (err) {
            console.log('Error reading URL heading: ', err);
            return res.sendStatus(404);
          } else {
            var newLink = new Link({
              url: uri,
              title: title,
              baseUrl: req.headers.origin
            });
            newLink.save(function (err, link) {
              if (err) {
                console.log('error creating link');
                res.sendStatus(500).send(err);
              } else {
                res.status(200).send(link);
              }
            });
          }
        });
      }
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  User.findOne({username: username}, function(err, user) {
    if (err) { console.log('login error'); }
    if (!user) {
      res.redirect('/login');
    } else {
      User.comparePassword(password, user.password, function(err, match) {
        if (match) {
          util.createSession(req, res, user);
        } else {
          res.redirect('/login');
        }
      });
    }
  });
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({username: username}, function(err, user) {
    if (err) { console.log(err); }
    if (!user) {
      var newUser = new User({
        username: username,
        password: password
      });
      newUser.save(function(err, newUser) {
        if (err) { res.status(500).send(err); }
        util.createSession(req, res, newUser);
      });
    } else {
      console.log('Account already exists');
      res.redirect('/signup');
    }
  });
};

exports.navToLink = function(req, res) {
  Link.findOne({ code: req.params[0] }, function(err, link) {
    if (err) {
      console.log('error navigating to link');
      return;
    } else {
      if (!link) {
        res.redirect('/');
      } else {
        link.visits++;
        link.save(function(err, link) {
          res.redirect(link.url);
          return;
        });
      }
    }
  });
};