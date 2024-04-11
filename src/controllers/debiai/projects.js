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

const dataUtils = require("../../utils/dataUtils");
const PROJECT_ID = "romania_electricity_consumption_and_production";
const PROJECT_NAME = "Romania electricity consumption and production";

exports.getProjectsOverview = async (req, res) => {
  // Return the list of projects with their names and values their numbers of samples, selections and models
  try {
    const projects = {};

    projects[PROJECT_ID] = {
      name: PROJECT_NAME,
      nbSamples: dataUtils.getDataLength(),
      // nbSelections: 2,
      // nbModels: 1,
    };

    res.status(200).send(projects);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.getProject = async (req, res) => {
  try {
    const projectId = req.openapi.pathParams.projectId;

    if (projectId == PROJECT_ID) {
      res.status(200).send({
        name: PROJECT_NAME,
        columns: dataUtils.getColumns(),
        expectedResults: [],
        nbSamples: dataUtils.getDataLength(),
      });
    } else {
      res.status(404).send("Can't find project " + projectId);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.dataIdList = async (req, res) => {
  // Return the list of the project data ids
  try {
    const requestedProjectId = req.openapi.pathParams.projectId;

    if (requestedProjectId !== PROJECT_ID)
      res.status(404).send("Can't find project " + requestedProjectId);

    const projectDataIds = dataUtils.getIdList();
    const from = req.query.from;
    const to = req.query.to;

    if (from !== undefined && to !== undefined) {
      // Fetch data with from and to filter;
      // Add + 1 because slice function excluded last value
      res.status(200).send(projectDataIds.slice(from, to + 1));
    } else {
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

    if (requestedProjectId !== PROJECT_ID)
      res.status(404).send("Can't find project " + requestedProjectId);

    // If the requested ids are [1, 2, 3], the following data will be returned:
    const projectData = dataUtils.getDataByIdList(requestedDataIds);
    res.status(200).send(projectData);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.deleteProject = async (req, res) => {
  res.status(404).send("Not implemented");
};
