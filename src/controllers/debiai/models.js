// ===== Models routes =====

// A model for DebiAI is a name and a list results mapped to some data ids
// The results are from the model being evaluated or trained on the data ids
// DebiAI will be able to analyse the results from different models and compare them

// This file contains the routes to manage the models:
// - Get the list of models for a project
// - Get a model evaluated data ids
// - Get a model results from a list of data ids
// - Delete a model (optional)

exports.modelList = (req, res) => {
  res.status(200).send([]);
};

exports.modelEvaluatedDataIdList = (req, res) => {
  res.status(200).send([]);
};

exports.modelResults = (req, res) => {
  res.status(200).send({});
};

exports.deleteModel = (req, res) => {};
