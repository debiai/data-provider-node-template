const pjson = require("./../../package.json")
// To have a fonctionnal data-provider, you will need to provide the following functions:


exports.info = (req, res) => {
    try {
        const version = pjson.version;
        /*
            Adjust those values depending on your data-provider capacity

            - maxSampleIdByRequest : The maximum sample Ids to request at the same time
            - maxSampleDataByRequest : The maximum sample of data to request for a project
            - maxResultByRequest : The maximum results from a model to request 
        */
        const infoResponse = {
            version: version,
            maxSampleIdByRequest: 10000,
            maxSampleDataByRequest: 2000,
            maxResultByRequest: 5000
        }

        res.status(200).send(infoResponse);
    } catch (error) {
        res.status(500).send(error);
    }
}


exports.getProjectsOverview = async (req, res) => {
    // Return the list of projects with their names and values their numbers of samples, selections and models 
    try {
        const projects = {
            project_1: {
                name: "Project 1",
                nbSamples: 10,
                nbSelections: 2,
                nbModels: 1,
            }
        }

        res.status(200).send(projects)
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}


exports.getProject = async (req, res) => {
    try {
        /*
            Return a single project with his columns and results 
        */
        const projectId = req.openapi.pathParams.projectId;

        //Project value will be the collums and expected results for the project
        const projectValue = {
            name: "Project 1",
            columns: [
                { name: "Context 1", type: "text" },
                { name: "Ground thruth 1", type: "number" },
                { name: "Input 1", type: "number" },
            ],
            expectedResults: [
                { name: "Model prediction", type: "number" },
                { name: "Model error", type: "number" },
            ],
            nbSamples: 10,
        }


        // To set name, columns and expected results to the variable we send to Debiai
        if (projectId == "project_1") {
            res.status(200).send(projectValue);
        } else {
            res.status(404).send("Can't find project " + projectId)
        }
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }

}

exports.dataIdList = (req, res) => {
    // Return the list of the project data ids
    try {
        const requestedProjectId = req.openapi.pathParams.projectId;

        if (requestedProjectId !== "project_1")
            res.status(404).send("Can't find project " + requestedProjectId)

        const projectDataIds = [1, 2, 3]
        // The data ids are 1, 2, 3, they will be requested by DebiAI
        // they can be in any format, but please avoid caracters like : / ( ) < > . ; or ,

        // In case of a number of sample > maxSampleIdByRequest, we will ask for a sequensed amount of sample ID
        // Set variables only if from & to in query parameters*
        const from = req.query.from
        const to = req.query.to

        if (from !== undefined && to !== undefined) {
            // Fetch data with from and to filter;
            // Add + 1 because slice function excluded last value
            res.status(200).send(projectDataIds.slice(from, to + 1));
        }
        else {
            res.status(200).send(projectDataIds)
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

exports.data = (req, res) => {
    // Return the data for the given data ids
    try {
        const requestedProjectId = req.openapi.pathParams.projectId;
        const requestedDataIds = req.body; // List of data ids requested by DebiAI

        if (requestedProjectId !== "project_1")
            res.status(404).send("Can't find project " + requestedProjectId)


        // If the requested ids are [1, 2, 3], the following data will be returned:
        const projectData = {
            1: ["Context a", 11, 4],
            2: ["Context b", 23, 2],
            3: ["Context c", -2, 0]
        }

        // The object keys are the data ids and the object values are the data
        // The data array MUST follow the columns order defined in the project info
        // Data containing '', null or undefined aren't supported by DebiAI at the moment
        // Data in a format other than string or number (array, objects, ...) aren't supported by DebiAI

        const dataToReturn = {}
        requestedDataIds.forEach(id => { dataToReturn[id] = projectData[id] })

        res.status(200).send(dataToReturn)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

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
            res.status(404).send("Can't find project " + requestedProjectId)


        const projectModels = [
            {
                id: "model_1",
                name: "Model 1",
                nbResults: 2
            },
            {
                id: "model_2",
                nbResults: 2
            },
            {
                id: "model_3"
            },
        ]

        // The model ids are 'model_1' and 'model_2', they will be requested by DebiAI
        // The name is optional, it will be replaced by the model id if not provided
        // The nbResults is optional, it will be replaced by 0 if not provided

        res.status(200).send(projectModels)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

exports.modelEvaluatedDataIdList = (req, res) => {
    // Return a list of data ids that the model have been evaluated on
    try {
        const requestedProjectId = req.openapi.pathParams.projectId;
        const requestedModelId = req.openapi.pathParams.modelId;

        if (requestedProjectId !== "project_1")
            res.status(404).send("Can't find project " + requestedProjectId)


        if (requestedModelId == "model_1")
            res.status(200).send([1, 2])
        else if (requestedModelId == "model_2")
            res.status(200).send([2, 3])
        else if (requestedModelId == "model_3")
            res.status(200).send([])
        else
            res.status(404).send("Model not found")

        // The provided ids have to be in the data ids list
        // Here, the Model 1 has been evaluated on data ids 1 and 2
        // and the Model 2 has been evaluated on data ids 2 and 3

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

exports.modelResults = (req, res) => {
    // Return the model results for the given data ids
    try {
        const requestedProjectId = req.openapi.pathParams.projectId;
        const requestedModelId = req.openapi.pathParams.modelId;
        const requestedDataIds = req.body;

        if (requestedProjectId !== "project_1")
            res.status(404).send("Can't find project " + requestedProjectId)

        const model1Results = {
            1: [9, -2],
            2: [26, 3],
        }
        const model2Results = {
            2: [23, 0],
            3: [-6, -4],
        }

        const modelResults = requestedModelId == "model_1" ? model1Results : model2Results

        const results = {}
        for (const dataId of requestedDataIds) if (modelResults[dataId]) results[dataId] = modelResults[dataId]

        // The results object keys are the requested data ids, the values are the model results
        // The model results arrays follow the expectedResults order defined in the project info
        res.status(200).send(results)

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

// Selections
const selections = [
    {
        "id": "first-selection",
        "name": "First selection",
        "nbSamples": 2,

        "dataIds": [1, 2]
    },
    {
        "id": "second-selection",
        "name": "second selection",

        "dataIds": [2, 3]
    },
    {
        "id": "third-selection",

        "dataIds": [1]
    }
]

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

        if (requestedProjectId !== "project_1")
            res.status(404).send("Can't find project " + requestedProjectId)


        // Send the selections list without the data id list
        const selectionsToSend = selections.map(selection => {
            return { "id": selection.id, "name": selection.name, "nbSamples": selection.nbSamples }
        })

        res.status(200).send(selectionsToSend)
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

exports.selectionDataIdList = (req, res) => {
    // Return the list of a selection samples ids
    /*
        Response body : 
        ["id 1", "id 2", "id 3", ...]
    */
    try {
        const requestedProjectId = req.openapi.pathParams.projectId;
        const requestedSelectionId = req.openapi.pathParams.selectionId

        if (requestedProjectId !== "project_1")
            res.status(404).send("Can't find project " + requestedProjectId)

        const selection = selections.find(selection => selection.id == requestedSelectionId)
        if (!selection) {
            res.status(404).send("Selection not found")
            return
        }

        const idList = selection.dataIds

        res.status(200).send(idList)
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

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

        if (requestedProjectId !== "project_1")
            res.status(404).send("Can't find project " + requestedProjectId)


        selections.push({
            "id": selectionName,
            "name": selectionName,
            "nbSamples": selectionsDataIds.length,
            "dataIds": selectionsDataIds
        })

        res.status(204).end()
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

exports.deleteSelection = (req, res) => {
    /* Delete a selection
    The route is called by DebiAI user Interface
    Optionnal route, return no content http response (204)
    If the data provider is not designed to support deletion, throw an error
    */
    try {
        const requestedProjectId = req.openapi.pathParams.projectId;
        const requestedSelectionId = req.openapi.pathParams.selectionId;

        if (requestedProjectId !== "project_1")
            res.status(404).send("Can't find project " + requestedProjectId)


        const selectionIndex = selections.findIndex(selection => selection.id == requestedSelectionId)
        if (selectionIndex == -1) res.status(404).send("Selection not found")

        selections.splice(selectionIndex, 1)

        res.status(204).end()
    } catch (error) {
        console.log(error);
        res.status(500).send(error);
    }
}

