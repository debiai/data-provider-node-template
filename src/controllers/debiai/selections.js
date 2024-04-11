// ===== Selections routes =====

// For DebiAI, a selection is a list of data ids with a name,
// it can be used to analyse a subset of the data.
// DebiAI can list your project selections
// it can also send a creation request to your data-provider
// with data selected from the DebiAI analysis page.

// All the routes are optional, if not provided, DebiAI won't be able to use selections

// This file contains the routes to manage the selections:
// - Get the list of selections for a project
// - Get a selection samples ids
// - Create a selection
// - Delete a selection

// Selections
const selections = [
  {
    id: "first-selection",
    name: "First selection",
    nbSamples: 2,

    dataIds: [1, 2],
  },
  {
    id: "second-selection",
    name: "second selection",

    dataIds: [2, 3],
  },
  {
    id: "third-selection",

    dataIds: [1],
  },
];

exports.selectionList = (req, res) => {
  // Return the project selections
  // A selection is a group of data ids, it can be used to analyse a subset of the data
  // The route is optional, if not provided, DebiAI won't be able to use selections
  /*
          Response body : [{
              "id": "string",
              "name": "string",      // Optional
              "nbSamples": "number"  // Optional
          }]
    */
  try {
    const requestedProjectId = req.openapi.pathParams.projectId;

    if (requestedProjectId !== "RECP")
      res.status(404).send("Can't find project " + requestedProjectId);

    // Send the selections list without the data id list
    const selectionsToSend = selections.map((selection) => {
      return {
        id: selection.id,
        name: selection.name,
        nbSamples: selection.nbSamples,
      };
    });

    res.status(200).send(selectionsToSend);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.selectionDataIdList = (req, res) => {
  // Return the list of a selection samples ids
  /*
          Response body : 
          ["id 1", "id 2", "id 3", ...]
    */
  try {
    const requestedProjectId = req.openapi.pathParams.projectId;
    const requestedSelectionId = req.openapi.pathParams.selectionId;

    if (requestedProjectId !== "RECP")
      res.status(404).send("Can't find project " + requestedProjectId);

    const selection = selections.find(
      (selection) => selection.id == requestedSelectionId
    );
    if (!selection) {
      res.status(404).send("Selection not found");
      return;
    }

    const idList = selection.dataIds;

    res.status(200).send(idList);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.createSelection = (req, res) => {
  /* Create a selection from the idList ids given in request body
      The route is called by DebiAI user Interface
      Optionnal route, return no content http response (204)
      If the data provider is not designed to support creation, throw an error
  
      RequestBody: 
      {
          "name": "my selection",
          "idList": [
              "sample-1",
              "sample-2",
              "sample-3"
          ]
      }
  
      Known issue:
          If your project samples ID are number, you will receive the idList as string,
          you will have to convert them to number
    */
  try {
    const requestedProjectId = req.openapi.pathParams.projectId;
    const selectionName = req.body.name;
    const selectionsDataIds = req.body.idList; // Array of data ids

    if (requestedProjectId !== "RECP")
      res.status(404).send("Can't find project " + requestedProjectId);

    selections.push({
      id: selectionName,
      name: selectionName,
      nbSamples: selectionsDataIds.length,
      dataIds: selectionsDataIds,
    });

    res.status(204).end();
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};

exports.deleteSelection = (req, res) => {
  // Delete a selection
  // The route is called by DebiAI when a user click on the delete selection button
  // If the data provider is not designed to support deletion, throw an error
  // To prevent deletion, you can set the "canDelete.selections" to false in the debiai/info route

  try {
    const requestedProjectId = req.openapi.pathParams.projectId;
    const requestedSelectionId = req.openapi.pathParams.selectionId;

    if (requestedProjectId !== "RECP")
      res.status(404).send("Can't find project " + requestedProjectId);

    const selectionIndex = selections.findIndex(
      (selection) => selection.id == requestedSelectionId
    );
    if (selectionIndex == -1) res.status(404).send("Selection not found");

    selections.splice(selectionIndex, 1);

    res.status(204).end();
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  }
};
