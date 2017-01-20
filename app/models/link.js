var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;

var linkSchema = new Schema({
  url: String,
  baseUrl: String,
  code: String,
  title: String,
  visits: {type: Number, default: 0},
  link: String
});

var Link = mongoose.model('Link', linkSchema);

var createSha = function(url) {
  var shasum = crypto.createHash('sha1');
  shasum.update(url);
  return shasum.digest('hex').slice(0, 5);
};

linkSchema.pre('save', function(next) {
  var code = createSha(this.url);
  this.code = code;
  next();
});

module.exports = Link;
