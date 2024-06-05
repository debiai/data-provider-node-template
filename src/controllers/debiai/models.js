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
  // Return the list of the project models
  // The models are the models that have been evaluated or trained on the project data
  /*
      Response body : [{
          "id": "string",
          "name": "string",      // Optional
          "nbResults": "number"  // Optional
      }]
    */
  try {
    const requestedProjectId = req.openapi.pathParams.projectId;

    if (requestedProjectId !== "project_1")
      res.status(404).send("Can't find project " + requestedProjectId);

    const projectModels = [
      {
        id: "model_1",
        name: "Model 1",
        nbResults: 2,
        metadata: {
          author_name: ["Alice", "Bob", "Charlie"],
          model_names: ["Linear Regression", "Random Forest", "Neural Network"],
          input_features: [
            ["feature1", "feature2"],
            ["feature1", "feature2", "feature3"],
            ["feature1", "feature2", "feature4"],
          ],
          notes: [
            "Baseline model",
            "Tuned with grid search",
            "Deep learning model",
          ],
          models_data: [
            {
              ModelID: "M1",
              ModelName: "Linear Regression",
              Author: "Alice",
              InputFeatures: ["feature1", "feature2"],
              Notes: "Baseline model",
            },
            {
              ModelID: "M2",
              ModelName: "Random Forest",
              Author: "Bob",
              InputFeatures: ["feature1", "feature2", "feature3"],
              Notes: "Tuned with grid search",
            },
            {
              ModelID: "M3",
              ModelName: "Neural Network",
              Author: "Charlie",
              InputFeatures: ["feature1", "feature2", "feature4"],
              Notes: "Deep learning model",
            },
          ],
        },
      },
      {
        id: "model_2",
        nbResults: 2,
      },
      {
        id: "model_3",
      },
    ];

    // The model ids are 'model_1' and 'model_2', they will be requested by DebiAI
    // The name is optional, it will be replaced by the model id if not provided
    // The nbResults is optional, it will be replaced by 0 if not provided

    res.status(200).send(projectModels);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.modelEvaluatedDataIdList = (req, res) => {
  // Return a list of data ids that the model have been evaluated on
  try {
    const requestedProjectId = req.openapi.pathParams.projectId;
    const requestedModelId = req.openapi.pathParams.modelId;

    if (requestedProjectId !== "project_1")
      res.status(404).send("Can't find project " + requestedProjectId);

    if (requestedModelId == "model_1") res.status(200).send([1, 2]);
    else if (requestedModelId == "model_2") res.status(200).send([2, 3]);
    else if (requestedModelId == "model_3") res.status(200).send([]);
    else res.status(404).send("Model not found");

    // The provided ids have to be in the data ids list
    // Here, the Model 1 has been evaluated on data ids 1 and 2
    // and the Model 2 has been evaluated on data ids 2 and 3
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.modelResults = (req, res) => {
  // Return the model results for the given data ids
  try {
    const requestedProjectId = req.openapi.pathParams.projectId;
    const requestedModelId = req.openapi.pathParams.modelId;
    const requestedDataIds = req.body;

    if (requestedProjectId !== "project_1")
      res.status(404).send("Can't find project " + requestedProjectId);

    const model1Results = {
      1: [9, -2],
      2: [26, 3],
    };
    const model2Results = {
      2: [23, 0],
      3: [-6, -4],
    };

    const modelResults =
      requestedModelId == "model_1" ? model1Results : model2Results;

    const results = {};
    for (const dataId of requestedDataIds)
      if (modelResults[dataId]) results[dataId] = modelResults[dataId];

    // The results object keys are the requested data ids, the values are the model results
    // The model results arrays follow the expectedResults order defined in the project info
    res.status(200).send(results);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.deleteModel = (req, res) => {
  // Delete the model
  // This route will be called when the user click on the delete model button in the project page
  // If the data provider is not designed to support deletion, throw an error
  // To prevent deletion, you can set the "canDelete.models" to false in the debiai/info route
  const requestedProjectId = req.openapi.pathParams.projectId;
  const requestedModelId = req.openapi.pathParams.modelId;

  // Delete the model from the project or don't if you don't want to
  res.status(404).send("Not implemented");
};
