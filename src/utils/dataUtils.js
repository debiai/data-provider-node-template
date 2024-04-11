// Provide functions to manipulate csv data
const fs = require("fs");
const DATA_PATH = "data/RomaniaElectricityConsumptionAndProduction.csv";

const getData = () => {
  // Return the data from the csv file as a 2D array
  const data = fs.readFileSync(DATA_PATH, "utf8");

  // Split the data by rows
  const rows = data.split("\n");

  // Split the rows by columns
  const result = rows.map((row) => row.split(","));

  // Remove the first row (column names)
  result.shift();

  // Remove the last row (empty)
  result.pop();
  return result;
};

exports.getDataLength = () => {
  return getData().length;
};

exports.getColumns = () => {
  // Return the columns from the csv file as an array
  return [
    { name: "DateTime", category: "context", type: "text" },
    { name: "Consumption", category: "context", type: "number" },
    { name: "Production", category: "context", type: "number" },
    { name: "Nuclear", category: "context", type: "number" },
    { name: "Wind", category: "context", type: "number" },
    { name: "Hydroelectric", category: "context", type: "number" },
    { name: "Oil and Gas", category: "context", type: "number" },
    { name: "Coal", category: "context", type: "number" },
    { name: "Solar", category: "context", type: "number" },
    { name: "Biomass", category: "context", type: "number" },
  ];
};

exports.getIdList = () => {
  // Return the list of the data ids
  // For our data, the id is the line number
  const nbSamples = getData().length;
  return Array.from({ length: nbSamples }, (_, i) => i);
};

exports.getDataByIdList = (idList) => {
  // Return the data from the csv file for the given list of data ids
  const data = getData();
  const ret = {};
  idList.forEach((id) => {
    ret[id] = data[id];
  });
  return ret;
};
