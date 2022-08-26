// My project data
const projectId = "project_1"

const projectName = "Project 1"

const projectColumns = [
    { name: "Context 1", type: "text", category: "context" },
    { name: "Ground thruth 1", type: "number", category: "groundtruth" },
    { name: "Input 1", type: "number", category: "input" },
]
const projectModelResults = [
    { name: "Model prediction", type: "number" },
    { name: "Model error", type: "number" },
]

const projectData = [
    // ID, Context, Ground truth, Input
    [1, "Context a", 11, 4],
    [2, "Context b", 23, 2],
    [3, "Context c", -2, 0]
]

const projectModels = {
    model_1: [
        [1, 9, -2],
        [2, 26, 32],
    ],
    model_2: [
        [2, 23, 0],
        [3, -6, -4],
    ],
}

exports.info = (req, res) => {
    // Return the list of projects with their columns and results
    try {
        const projects = {}
        projects[projectId] = {
            name: projectName,
            columns: projectColumns,
            expectedResults: projectModelResults
        }

        res.status(200).send(projects)
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

exports.dataIdList = (req, res) => {
    // Return the list of the project data ids
    try {
        const project = req.openapi.pathParams.view;

        if (project === projectId) {
            res.status(200).send(projectData.map(row => row[0]))
        } else {
            res.status(404).send("Project not found")
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

exports.data = (req, res) => {
    // Return the data for the given data ids
    try {
        const project = req.openapi.pathParams.view;
        const requestedDataIds = req.body;

        if (project === projectId) {
            const data = projectData.filter(row => requestedDataIds.includes(row[0]))
            const dataRet = {}
            data.forEach(row => { dataRet[row[0]] = row.slice(1) })

            res.status(200).send(dataRet)
        } else {
            res.status(404).send("Project not found")
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

exports.modelList = (req, res) => {
    // Return the list of the project models
    try {
        const project = req.openapi.pathParams.view;
        if (project === projectId) {
            const modelsToSend = Object.keys(projectModels).map(modelId => {
                return {
                    id: modelId,
                    name: modelId,
                    nbSamples: projectModels[modelId].length
                }
            })
            res.status(200).send(modelsToSend)

        } else {
            res.status(404).send("Project not found")
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

exports.modelEvaluatedDataIdList = (req, res) => {
    // Return the list of data ids that have been evaluated by the model
    try {
        const project = req.openapi.pathParams.view;
        const modelId = req.openapi.pathParams.modelId;

        if (project === projectId && modelId in projectModels) {
            res.status(200).send(projectModels[modelId].map(row => row[0]))
        } else {
            res.status(404).send("Project or model not found")
        }
    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}

exports.modelResults = (req, res) => {
    // Return the model results for the given data ids
    try {
        const project = req.openapi.pathParams.view;
        const modelId = req.openapi.pathParams.modelId;
        const requestedDataIds = req.body;

        if (project === projectId && modelId in projectModels) {
            const modelResults = {}

            projectModels[modelId].forEach(row => {
                if (requestedDataIds.includes(row[0])) {
                    modelResults[row[0]] = row.slice(1)
                }
            })

            res.status(200).send(modelResults)
        } else {
            res.status(404).send("Project or model not found")
        }

    } catch (error) {
        console.log(error)
        res.status(500).send(error)
    }
}