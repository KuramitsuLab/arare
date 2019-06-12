var express = require("express");
var path = require("path");
var app = express();

var server = app.listen(8080, function () {
  console.log("Node.js is listening to PORT:" + server.address().port);
});

app.use(express.static(path.join(__dirname, 'static')));

app.get("/", function (req, res, next) {
  res.render("index.html");
});

app.get("/:kind(audio|image|js|sample)/:path", function (req, res, next) {
  res.sendFile(path.join(__dirname, `./static/${req.params['kind']}/${req.params['path']}`));
});

app.post("/compile", function (req, res, next) {
  res.sendFile(path.join(__dirname, './static/sample/js/PuppyVMCode.js'));
});