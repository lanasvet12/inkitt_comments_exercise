var alertstars = require("./lib/alertstars");
var _ = require('underscore');
var $ = require('jquery');

window.onload = function () {
  var messages = [
    "Welcome!",
    "This is my new page!",
    "Do you like it?",
    "How about now?"
  ];

  // _.each(messages, alertstars);
  _.each(messages, function (message) {
    $("body").append($("<p>").text(message));
  });
};