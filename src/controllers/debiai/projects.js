// ===== Projects routes =====

// For DebiAI, a project is composed of:
// - A name
// - A structure (columns and expected results)
// - A list of data ids
// - Some data for each data id
// - A list of selections (optional)
// - A list of models (optional)

// This file contains the routes to manage the projects:
// - Get the list of projects
// - Get a single project (project name, columns and expected results)
// - Get a project data ids
// - Get the project data from a list of data ids
// - Delete a project (optional)

// This data provider will provide a number of project with a certain number of random data

const sampleNumberToCreate = [
  10,
  // 100,
  1000, 10000,
  //   50000,
  100000, 1000000, 10000000,
  //   3000000,
  // 4000000,
  // 5000000,
  // 6000000,
  // 7000000,
  // 8000000,
  // 9000000,
  //   100000000000000000,
];

const projectToCreate = sampleNumberToCreate.map((sampleNumber) => {
  return { name: `P with ${sampleNumber} samples`, sampleNumber };
});

const randomContext = () => {
  const context = ["A", "B", "C", "D", "E", "F", "G"];
  return context[Math.floor(Math.random() * context.length)];
};

exports.getProjectsOverview = async (req, res) => {
  // Return the list of projects with their names and values their numbers of samples, selections and models
  try {
    const projects = {};
    for (const project of projectToCreate) {
      projects[project.name] = {
        name: project.name,
        nbSamples: project.sampleNumber,
        nbSelections: 0,
        nbModels: 0,
      };
    }
    res.status(200).send(projects);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.getProject = async (req, res) => {
  try {
    /*
          Return a single project with his columns and results 
      */
    const projectId = req.openapi.pathParams.projectId;
    // Check if projectId exists
    if (!projectToCreate.find((p) => p.name === projectId)) {
      res.status(404).send("Can't find project " + projectId);
      return;
    }
    // Project value will be the column and expected results for the project
    const projectValue = {
      name: "Project 1",
      columns: [
        // No need to add the "id" column, it will be added automatically
        { name: "Context 1", category: "context", type: "text" },
        { name: "Ground truth 1", category: "groundtruth", type: "number" },
        { name: "Input 1", category: "input" }, // type is not required, it will be detected automatically
        // You can also add a group to your columns, it will be used to group the columns in the interface

        // category can be : context, groundtruth, input, other. Default category is other
        // Type can be : auto, text, number, and boolean. Default type is auto
      ],
      expectedResults: [
        { name: "Model prediction", type: "number" },
        { name: "Model error", type: "number", group: "Errors" },
        // The expected results are the columns that are used to provide information about the model predictions
        // For example, you can add the model predictions and some metrics like the model errors
        // You can also group the expected results in the interface with the group property
      ],
      nbSamples: projectToCreate.find((p) => p.name === projectId).sampleNumber,
    };

    // To set name, columns and expected results to the variable we send to Debiai
    res.status(200).send(projectValue);
    console.log(projectId);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.dataIdList = async (req, res) => {
  // Return the list of the project data ids
  try {
    const requestedProjectId = req.openapi.pathParams.projectId;
    const project = projectToCreate.find((p) => p.name === requestedProjectId);
    if (project === undefined) {
      res.status(404).send("Can't find project " + requestedProjectId);
      return;
    }

    const requestedSampleNumber = project.sampleNumber;

    // DebiAI provide information about the analysis to help manage the data requests
    const analysis = {
      id: req.query.analysisId,
      start: req.query.analysisStart,
      end: req.query.analysisEnd,
    };

    // The analysis object contains the following properties:
    // - id : Generated by DebiAI, it can be used to identify the analysis
    // - start : A boolean to know if it's the first request for this analysis
    // - end : A boolean to know if it's the last request for this analysis

    // We gather the data ids from the database
    // The id of the data are 1, 2, 3, they will used by DebiAI to request the data
    // They can be in any format, but please avoid characters like : / ( ) < > . ; or ,

    // In case of a number of sample > maxSampleIdByRequest, we will ask for a sequenced amount of sample ID
    // Set variables only if from & to in query parameters*
    const from = req.query.from;
    const to = req.query.to;

    console.log(
      `Requested ${requestedSampleNumber} samples from`,
      from,
      "to",
      to
    );

    if (from !== undefined && to !== undefined) {
      // Fetch data with from and to filter;
      const projectDataIds = Array(to - from + 1)
        .fill()
        .map((_, i) => String(i + 1 + from));
      // Add + 1 because slice function excluded last value
      res.status(200).send(projectDataIds);
    } else {
      const projectDataIds = Array(requestedSampleNumber)
        .fill()
        .map((_, i) => String(i + 1));
      res.status(200).send(projectDataIds);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.data = (req, res) => {
  // Return the data for the given data ids
  try {
    const requestedProjectId = req.openapi.pathParams.projectId;
    const requestedDataIds = req.body; // List of data ids requested by DebiAI

    const project = projectToCreate.find((p) => p.name === requestedProjectId);
    if (project === undefined) {
      res.status(404).send("Can't find project " + requestedProjectId);
      return;
    }

    // DebiAI provide information about the analysis to help manage the data requests
    const analysis = {
      id: req.query.analysisId,
      start: req.query.analysisStart,
      end: req.query.analysisEnd,
    };

    const dataToReturn = {};
    requestedDataIds.forEach((id) => {
      //   dataToReturn[id] = [randomContext(), Math.random() * 100, id];
      dataToReturn[id] = [0, 0, id];
    });
    res.status(200).send(dataToReturn);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.deleteProject = async (req, res) => {
  // Delete a project
  // This route will be called when the user click on the delete button in the project page
  // If the data provider is not designed to support deletion, throw an error
  // To prevent deletion, you can set the "canDelete.projects" to false in the debiai/info route

  const requestedProjectId = req.openapi.pathParams.projectId;
  // Delete the project or don't if you don't want to
  res.status(404).send("Not implemented");
};
