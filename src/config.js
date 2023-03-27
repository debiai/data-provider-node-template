const fs = require("fs");
const ini = require("ini");
const config = ini.parse(fs.readFileSync("config/app.ini", "utf-8"));

exports.default = config;
