const request = require('supertest');
const { app, server } = require("../src/index.js");

const DATA_PATCH_SIZE = 20;
const RESULTS_PATCH_SIZE = 20;
const NB_TEST_SAMPLES = DATA_PATCH_SIZE * 3
const NB_TEST_RESULTS = RESULTS_PATCH_SIZE * 2

describe('Testing the debiai dataprovider compliance', function () {
    this.timeout(15000);

    let providerViews;
    let providerViewsColumns = {}
    let providerViewsExpectedResults = {}
    let viewsDataIds = {};
    let viewsModels = {};
    let viewsModelsEvaluatedDataIdList = {};
    let viewsSelections = {};
    let viewsSelectionsDataIdList = {};
    before((done) => {
        // console.log("  Waiting for the debiai data provider service to be ready...");
        // app.on('ready', () => {
        done();
        // });
    });


    after(() => { server.close() });

    // Projects
    it('should expose some views', (done) => {
        request(app)
            .get('/debiai/info')
            .set('Content-Type', 'application/json')
            .expect(200)
            .expect('Content-Type', /json/)
            .end((err, res) => {
                if (err) return done(err);
                providerViews = Object.keys(res.body);
                providerViews.forEach(providerView => {
                    providerViewsColumns[providerView] = res.body[providerView].columns;
                    providerViewsExpectedResults[providerView] = res.body[providerView].expectedResults;
                })
                done();
            })
    });

    it('should give data ids for each views', async () => {
        for (let viewNb = 0; viewNb < providerViews.length; viewNb++) {
            const view = providerViews[viewNb];

            let resp = await request(app)
                .get(`/debiai/view/${view}/dataIdList`)
                .set('Content-Type', 'application/json')
                .expect(200)
                .expect('Content-Type', /json/)

            viewsDataIds[view] = resp.body;
        }
    });

    it('should give data and columns for each ids of each views', async () => {
        for (let viewNb = 0; viewNb < providerViews.length; viewNb++) {
            const view = providerViews[viewNb];
            let i, j, dataIdChunk;
            for (i = 0, j = viewsDataIds[view].length; i < j && i < NB_TEST_SAMPLES; i += DATA_PATCH_SIZE) {
                dataIdChunk = viewsDataIds[view].slice(i, i + DATA_PATCH_SIZE);

                let resp = await request(app)
                    .post(`/debiai/view/${view}/data`)
                    .set('Content-Type', 'application/json')
                    .send(dataIdChunk)
                    .expect(200)
                    .expect('Content-Type', /json/);

                let dataReturned = resp.body;
                let idsReturned = Object.keys(dataReturned);
                let nbDataReturned = idsReturned.length;
                if (nbDataReturned !== dataIdChunk.length)
                    throw new Error(`Expected ${dataIdChunk.length} data, got ${nbDataReturned}`);

                idsReturned.forEach(id => {
                    if (dataReturned[id].length !== providerViewsColumns[view].length)
                        throw new Error(`Columns and data length mismatch for view ${view} (${providerViewsColumns[view].length} was expected but got ${dataReturned[id].length}) at data with id ${id}`);
                });
            }
        }
    })

    // Models
    it('should expose some models', async () => {
        for (let viewNb = 0; viewNb < providerViews.length; viewNb++) {
            const view = providerViews[viewNb];

            let resp = await request(app)
                .get(`/debiai/view/${view}/models`)
                .set('Content-Type', 'application/json')
                .expect(200)
                .expect('Content-Type', /json/)

            viewsModels[view] = resp.body;
        }
    });

    it('should expose the models evaluated data id list', async () => {
        for (let viewNb = 0; viewNb < providerViews.length; viewNb++) {
            const view = providerViews[viewNb];

            viewsModelsEvaluatedDataIdList[view] = {}
            for (let modelNb = 0; modelNb < viewsModels[view].length; modelNb++) {
                const model = viewsModels[view][modelNb];

                let resp = await request(app)
                    .get(`/debiai/view/${view}/model/${model.id}/evaluatedDataIdList`)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/)

                viewsModelsEvaluatedDataIdList[view][model.id] = resp.body;
            }
        }
    });

    it('should provide model results', async () => {
        // For each view
        for (let viewNb = 0; viewNb < providerViews.length; viewNb++) {
            const view = providerViews[viewNb];
            // For each model
            for (let modelNb = 0; modelNb < viewsModels[view].length; modelNb++) {
                const model = viewsModels[view][modelNb];
                // Get all available resutls
                const modelEvaluatedDataIdList = viewsModelsEvaluatedDataIdList[view][model.id];

                let i, j, dataIdChunk;
                for (i = 0, j = modelEvaluatedDataIdList.length; i < j && i < NB_TEST_RESULTS; i += RESULTS_PATCH_SIZE) {
                    dataIdChunk = modelEvaluatedDataIdList.slice(i, i + RESULTS_PATCH_SIZE);

                    let resp = await request(app)
                        .post(`/debiai/view/${view}/model/${model.id}/results`)
                        .set('Content-Type', 'application/json')
                        .send(dataIdChunk)
                        .expect(200)
                        .expect('Content-Type', /json/);

                    let dataReturned = resp.body;
                    let idsReturned = Object.keys(dataReturned);
                    let nbDataReturned = idsReturned.length;
                    if (nbDataReturned !== dataIdChunk.length)
                        throw new Error(`Expected ${dataIdChunk.length} data, got ${nbDataReturned}`);

                    idsReturned.forEach(id => {
                        if (dataReturned[id].length !== providerViewsExpectedResults[view].length)
                            throw new Error(`Columns and data length mismatch for view ${view} (${providerViewsExpectedResults[view].length} was expected but got ${dataReturned[id].length}) at data with id ${id}`);
                    });
                }
            }
        }
    });

    // Selections
    it('should expose some selections', async () => {
        for (let viewNb = 0; viewNb < providerViews.length; viewNb++) {
            const view = providerViews[viewNb];

            let resp = await request(app)
                .get(`/debiai/view/${view}/selections`)
                .set('Content-Type', 'application/json')
                .expect(200)
                .expect('Content-Type', /json/)

            const selections = resp.body;

            // Check response
            if (!Array.isArray(selections))
                throw new Error(`Expected an array, got ${selections}`);

            selections.forEach(selection => {
                if (!selection.id)
                    throw new Error(`Expected a selection id, got ${selection.id}`);
            })

            viewsSelections[view] = selections;
        }
    });

    it('should expose the selections data id list', async () => {
        for (let viewNb = 0; viewNb < providerViews.length; viewNb++) {
            const view = providerViews[viewNb];

            viewsSelectionsDataIdList[view] = {}
            for (let selectionNb = 0; selectionNb < viewsSelections[view].length; selectionNb++) {
                const selection = viewsSelections[view][selectionNb];

                let resp = await request(app)
                    .get(`/debiai/view/${view}/selection/${selection.id}/selectedDataIdList`)
                    .set('Content-Type', 'application/json')
                    .expect(200)
                    .expect('Content-Type', /json/)

                const dataIdList = resp.body;

                // Check response
                if (!Array.isArray(dataIdList))
                    throw new Error(`Expected an array, got ${dataIdList}`);

                viewsSelectionsDataIdList[view][selection.id] = resp.body;
            }
        }
    });

    it('should provide data for a selection', async () => {
        // For each view
        for (let viewNb = 0; viewNb < providerViews.length; viewNb++) {
            const view = providerViews[viewNb];
            // For each selection
            for (let selectionNb = 0; selectionNb < viewsSelections[view].length; selectionNb++) {
                const selection = viewsSelections[view][selectionNb];
                // Get all available resutls
                const selectionDataIdList = viewsSelectionsDataIdList[view][selection.id];

                let i, j, dataIdChunk;
                for (i = 0, j = selectionDataIdList.length; i < j && i < NB_TEST_RESULTS; i += RESULTS_PATCH_SIZE) {
                    dataIdChunk = selectionDataIdList.slice(i, i + RESULTS_PATCH_SIZE);
                    let resp = await request(app)
                        .post(`/debiai/view/${view}/data`)
                        .set('Content-Type', 'application/json')
                        .send(dataIdChunk)
                        .expect(200)
                        .expect('Content-Type', /json/);

                    let dataReturned = resp.body;
                    let idsReturned = Object.keys(dataReturned);
                    let nbDataReturned = idsReturned.length;
                    if (nbDataReturned !== dataIdChunk.length)
                        throw new Error(`Expected ${dataIdChunk.length} data, got ${nbDataReturned}`);

                    idsReturned.forEach(id => {
                        if (dataReturned[id].length !== providerViewsColumns[view].length)
                            throw new Error(`Columns and data length mismatch for view ${view} (${providerViewsColumns[view].length} was expected but got ${dataReturned[id].length}) at data with id ${id}`);
                    });
                }
            }
        }
    });

    it('should be able to create a selection', async () => {
        for (let viewNb = 0; viewNb < providerViews.length; viewNb++) {
            const view = providerViews[viewNb];

            let resp = await request(app)
                .post(`/debiai/view/${view}/selections`)
                .set('Content-Type', 'application/json')
                .send({
                    name: 'test',
                    idList: ["1", "2", "3"]
                })
                .expect(204)
            
            // Get the selections
            let resp1 = await request(app)
                .get(`/debiai/view/${view}/selections`)
                .set('Content-Type', 'application/json')
                .expect(200)
                .expect('Content-Type', /json/)

            const selections = resp1.body;
            if (!Array.isArray(selections))
                throw new Error(`Expected an array, got ${selections}`);
            
            if (selections.length !== viewsSelections[view].length + 1)
                throw new Error(`Expected ${viewsSelections[view].length + 1} selections, got ${selections.length}`);
        }
    });

    it('should be able to delete a selection', async () => {
        for (let viewNb = 0; viewNb < providerViews.length; viewNb++) {
            const view = providerViews[viewNb];
            const selectionName = 'test_selection_to_delete';

            // Create a selection
            let resp = await request(app)
                .post(`/debiai/view/${view}/selections`)
                .set('Content-Type', 'application/json')
                .send({
                    name: selectionName,
                    idList: ["1", "2", "3"]
                })
                .expect(204)

            // Get the selection
            let resp1 = await request(app)
                .get(`/debiai/view/${view}/selections`)
                .set('Content-Type', 'application/json')
                .expect(200)
                .expect('Content-Type', /json/)

            const selections = resp1.body;
            const selection = selections.find(selection => selection.name === selectionName);

            if (!selection)
                throw new Error(`Could not find created selection ${selectionName} in ${selections.map(selection => selection.name)})}`);

            if (!selection.id)
                throw new Error(`Expected a selection id, got ${selection.id}`);
            
            // Delete it
            let resp2 = await request(app)
                .delete(`/debiai/view/${view}/selections/${selection.id}`)
                .expect(204)

            // Check it is gone
            let resp3 = await request(app)
                .get(`/debiai/view/${view}/selections`)
                .set('Content-Type', 'application/json')
                .expect(200)
                .expect('Content-Type', /json/)

            const selections2 = resp3.body;
            const selection2 = selections2.find(selection => selection.name === selectionName);

            if (selection2)
                throw new Error(`Selection ${selectionName} did not get deleted in ${selections2.map(selection => selection.name)})}`);
        }
    });
});
