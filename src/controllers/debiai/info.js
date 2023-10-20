// ===== Info route =====
// This route is used to get the data-provider information
// This route is mandatory and allows DebiAI to know:
// - The data-provider version
// - The maximum number of data ids to request at the same time
// - The maximum number of data to request for a project
// - The maximum number of results from a model to request
// - If DebiAI can be used to delete project, selections or models

const pjson = require("../../../package.json");

exports.info = (req, res) => {
  const version = pjson.version;
  /*
    Adjust those values depending on your data-provider capacity
    - maxSampleIdByRequest : The maximum sample Ids to request at the same time
    - maxSampleDataByRequest : The maximum sample of data to request for a project
    - maxResultByRequest : The maximum results from a model to request 

    Change the value to false if you wan't to prevent deletion
    - canDelete.projects : If DebiAI can be used to delete projects
    - canDelete.selections : If DebiAI can be used to delete selections
    - canDelete.models : If DebiAI can be used to delete models
  */
  const infoResponse = {
    version: version,
    maxSampleIdByRequest: 10000,
    maxSampleDataByRequest: 2000,
    maxResultByRequest: 5000,

    canDelete: {
      projects: true,
      selections: true,
      models: true,
    },
  };

  res.status(200).send(infoResponse);
};
