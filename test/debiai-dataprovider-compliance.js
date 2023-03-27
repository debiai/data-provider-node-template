const { response } = require("express");
const request = require("supertest");
const { app, server } = require("../src/index.js");

const DATA_PATCH_SIZE = 20;
const RESULTS_PATCH_SIZE = 20;
const NB_TEST_SAMPLES = DATA_PATCH_SIZE * 3;
const NB_TEST_RESULTS = RESULTS_PATCH_SIZE * 2;

describe("Testing the debiai dataprovider compliance", function () {
  this.timeout(15000);

  let providerProjects;
  let providerProjectsColumns = {};
  let providerProjectsExpectedResults = {};
  let projectsDataIds = {};
  let projectsModels = {};
  let projectsModelsEvaluatedDataIdList = {};
  let projectsSelections = {};
  let projectsSelectionsDataIdList = {};
  before((done) => {
    // console.log("  Waiting for the debiai data provider service to be ready...");
    // app.on('ready', () => {
    done();
    // });
  });

  after(() => {
    server.close();
  });

  // Projects
  it("should expose Data provider info", (done) => {
    request(app)
      .get("/debiai/info")
      .set("Content-Type", "application/json")
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        if (err) return done(err);

        done();
      });
  });

  it("should give projects overview", (done) => {
    request(app)
      .get("/debiai/projects")
      .set("Content-Type", "application/json")
      .expect(200)
      .expect("Content-Type", /json/)
      .end((err, res) => {
        if (err) return done(err);
        providerProjects = Object.keys(res.body);
        done();
      });
  });

  it("should expose a project", (done) => {
    for (let projectNb = 0; projectNb < providerProjects.length; projectNb++) {
      const projectId = providerProjects[projectNb];
      request(app)
        .get(`/debiai/projects/${projectId}`)
        .set("Content-Type", "application/json")
        .expect(200)
        .expect("Content-Type", /json/)
        .end((err, res) => {
          if (err) return done(err);
          providerProjectsColumns[projectId] = res.body.columns;
          providerProjectsExpectedResults[projectId] = res.body.expectedResults;
        });
    }
    done();
  });

  it("should return a 404 error : project not found", (done) => {
    const projectId = "project_that_doesnt_exist";
    request(app)
      .get(`/debiai/projects/${projectId}`)
      .set("Content-Type", "application/json")
      .expect(404, done);
  });

  it("should give data ids for each projects", async () => {
    for (let projectNb = 0; projectNb < providerProjects.length; projectNb++) {
      const projectId = providerProjects[projectNb];
      let resp = await request(app)
        .get(
          `/debiai/projects/${projectId}/data-id-list?from=0&to=${NB_TEST_SAMPLES}`
        )
        .set("Content-Type", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      projectsDataIds[projectId] = resp.body;
    }
  });

  it("should give data and columns for each ids of each projects", async () => {
    for (let projectNb = 0; projectNb < providerProjects.length; projectNb++) {
      const projectId = providerProjects[projectNb];
      let i, j, dataIdChunk;
      for (
        i = 0, j = projectsDataIds[projectId].length;
        i < j && i < NB_TEST_SAMPLES;
        i += DATA_PATCH_SIZE
      ) {
        dataIdChunk = projectsDataIds[projectId].slice(i, i + DATA_PATCH_SIZE);

        let resp = await request(app)
          .post(`/debiai/projects/${projectId}/data`)
          .set("Content-Type", "application/json")
          .send(dataIdChunk)
          .expect(200)
          .expect("Content-Type", /json/);

        let dataReturned = resp.body;
        let idsReturned = Object.keys(dataReturned);
        let nbDataReturned = idsReturned.length;
        if (nbDataReturned !== dataIdChunk.length)
          throw new Error(
            `Expected ${dataIdChunk.length} data, got ${nbDataReturned}`
          );
        idsReturned.forEach((id) => {
          if (
            dataReturned[id].length !==
            providerProjectsColumns[projectId].length
          )
            throw new Error(
              `Columns and data length mismatch for project ${projectId} (${providerProjectsColumns[projectId].length} was expected but got ${dataReturned[id].length}) at data with id ${id}`
            );
        });
      }
    }
  });

  // Models
  it("should expose some models", async () => {
    for (let projectNb = 0; projectNb < providerProjects.length; projectNb++) {
      const projectId = providerProjects[projectNb];

      let resp = await request(app)
        .get(`/debiai/projects/${projectId}/models`)
        .set("Content-Type", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      projectsModels[projectId] = resp.body;
    }
  });

  it("should expose the models evaluated data id list", async () => {
    for (let projectNb = 0; projectNb < providerProjects.length; projectNb++) {
      const projectId = providerProjects[projectNb];

      projectsModelsEvaluatedDataIdList[projectId] = {};
      for (
        let modelNb = 0;
        modelNb < projectsModels[projectId].length;
        modelNb++
      ) {
        const model = projectsModels[projectId][modelNb];

        let resp = await request(app)
          .get(
            `/debiai/projects/${projectId}/models/${model.id}/evaluated-data-id-list`
          )
          .set("Content-Type", "application/json")
          .expect(200)
          .expect("Content-Type", /json/);

        projectsModelsEvaluatedDataIdList[projectId][model.id] = resp.body;
      }
    }
  });

  it("should provide model results", async () => {
    // For each project
    for (let projectNb = 0; projectNb < providerProjects.length; projectNb++) {
      const projectId = providerProjects[projectNb];
      // For each model
      for (
        let modelNb = 0;
        modelNb < projectsModels[projectId].length;
        modelNb++
      ) {
        const model = projectsModels[projectId][modelNb];
        // Get all available resutls
        const modelEvaluatedDataIdList =
          projectsModelsEvaluatedDataIdList[projectId][model.id];

        let i, j, dataIdChunk;
        for (
          i = 0, j = modelEvaluatedDataIdList.length;
          i < j && i < NB_TEST_RESULTS;
          i += RESULTS_PATCH_SIZE
        ) {
          dataIdChunk = modelEvaluatedDataIdList.slice(
            i,
            i + RESULTS_PATCH_SIZE
          );

          let resp = await request(app)
            .post(`/debiai/projects/${projectId}/models/${model.id}/results`)
            .set("Content-Type", "application/json")
            .send(dataIdChunk)
            .expect(200)
            .expect("Content-Type", /json/);

          let dataReturned = resp.body;
          let idsReturned = Object.keys(dataReturned);
          let nbDataReturned = idsReturned.length;
          if (nbDataReturned !== dataIdChunk.length)
            throw new Error(
              `Expected ${dataIdChunk.length} data, got ${nbDataReturned}`
            );

          idsReturned.forEach((id) => {
            if (
              dataReturned[id].length !==
              providerProjectsExpectedResults[projectId].length
            )
              throw new Error(
                `Columns and data length mismatch for project ${projectId} (${providerProjectsExpectedResults[projectId].length} was expected but got ${dataReturned[id].length}) at data with id ${id}`
              );
          });
        }
      }
    }
  });

  // Selections
  it("should expose some selections", async () => {
    for (let projectNb = 0; projectNb < providerProjects.length; projectNb++) {
      const projectId = providerProjects[projectNb];

      let resp = await request(app)
        .get(`/debiai/projects/${projectId}/selections`)
        .set("Content-Type", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      const selections = resp.body;

      // Check response
      if (!Array.isArray(selections))
        throw new Error(`Expected an array, got ${selections}`);

      selections.forEach((selection) => {
        if (!selection.id)
          throw new Error(`Expected a selection id, got ${selection.id}`);
      });

      projectsSelections[projectId] = selections;
    }
  });

  it("should expose the selections data id list", async () => {
    for (let projectNb = 0; projectNb < providerProjects.length; projectNb++) {
      const projectId = providerProjects[projectNb];

      projectsSelectionsDataIdList[projectId] = {};
      for (
        let selectionNb = 0;
        selectionNb < projectsSelections[projectId].length;
        selectionNb++
      ) {
        const selection = projectsSelections[projectId][selectionNb];

        let resp = await request(app)
          .get(
            `/debiai/projects/${projectId}/selections/${selection.id}/selected-data-id-list`
          )
          .set("Content-Type", "application/json")
          .expect(200)
          .expect("Content-Type", /json/);

        const dataIdList = resp.body;

        // Check response
        if (!Array.isArray(dataIdList))
          throw new Error(`Expected an array, got ${dataIdList}`);

        projectsSelectionsDataIdList[projectId][selection.id] = resp.body;
      }
    }
  });

  it("should return a 404 error : selection not found", (done) => {
    const projectId = "project_1";
    const selectionId = "selection_that_doesnt_exist";
    request(app)
      .get(
        `/debiai/projects/${projectId}/selections/${selectionId}/selected-data-id-list`
      )
      .set("Content-Type", "application/json")
      .expect(404, done);
  });

  it("should provide data for a selection", async () => {
    // For each project
    for (let projectNb = 0; projectNb < providerProjects.length; projectNb++) {
      const projectId = providerProjects[projectNb];
      // For each selection
      for (
        let selectionNb = 0;
        selectionNb < projectsSelections[projectId].length;
        selectionNb++
      ) {
        const selection = projectsSelections[projectId][selectionNb];
        // Get all available resutls
        const selectionDataIdList =
          projectsSelectionsDataIdList[projectId][selection.id];

        let i, j, dataIdChunk;
        for (
          i = 0, j = selectionDataIdList.length;
          i < j && i < NB_TEST_RESULTS;
          i += RESULTS_PATCH_SIZE
        ) {
          dataIdChunk = selectionDataIdList.slice(i, i + RESULTS_PATCH_SIZE);
          let resp = await request(app)
            .post(`/debiai/projects/${projectId}/data`)
            .set("Content-Type", "application/json")
            .send(dataIdChunk)
            .expect(200)
            .expect("Content-Type", /json/);

          let dataReturned = resp.body;
          let idsReturned = Object.keys(dataReturned);
          let nbDataReturned = idsReturned.length;
          if (nbDataReturned !== dataIdChunk.length)
            throw new Error(
              `Expected ${dataIdChunk.length} data, got ${nbDataReturned}`
            );

          idsReturned.forEach((id) => {
            if (
              dataReturned[id].length !==
              providerProjectsColumns[projectId].length
            )
              throw new Error(
                `Columns and data length mismatch for project ${projectId} (${providerProjectsColumns[projectId].length} was expected but got ${dataReturned[id].length}) at data with id ${id}`
              );
          });
        }
      }
    }
  });

  it("should be able to create a selection", async () => {
    for (let projectNb = 0; projectNb < providerProjects.length; projectNb++) {
      const projectId = providerProjects[projectNb];
      const selectionDataId = projectsDataIds[projectId];

      let resp = await request(app)
        .post(`/debiai/projects/${projectId}/selections`)
        .set("Content-Type", "application/json")
        .send({
          name: "test",
          idList: selectionDataId.slice(0, 3).map((id) => id.toString()),
        })
        .expect(204);

      // Get the selections
      let resp1 = await request(app)
        .get(`/debiai/projects/${projectId}/selections`)
        .set("Content-Type", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      const selections = resp1.body;
      if (!Array.isArray(selections))
        throw new Error(`Expected an array, got ${selections}`);

      if (selections.length !== projectsSelections[projectId].length + 1)
        throw new Error(
          `Expected ${
            projectSelections[projectId].length + 1
          } selections, got ${selections.length}`
        );
    }
  });

  it("should be able to delete a selection", async () => {
    for (let projectNb = 0; projectNb < providerProjects.length; projectNb++) {
      const projectId = providerProjects[projectNb];
      const selectionName = "test_selection_to_delete";

      // Create a selection
      let resp = await request(app)
        .post(`/debiai/projects/${projectId}/selections`)
        .set("Content-Type", "application/json")
        .send({
          name: selectionName,
          idList: ["1", "2", "3"],
        })
        .expect(204);

      // Get the selection
      let resp1 = await request(app)
        .get(`/debiai/projects/${projectId}/selections`)
        .set("Content-Type", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      const selections = resp1.body;
      const selection = selections.find(
        (selection) => selection.name === selectionName
      );

      if (!selection)
        throw new Error(
          `Could not find created selection ${selectionName} in ${selections.map(
            (selection) => selection.name
          )})}`
        );

      if (!selection.id)
        throw new Error(`Expected a selection id, got ${selection.id}`);

      // Delete it
      let resp2 = await request(app)
        .delete(`/debiai/projects/${projectId}/selections/${selection.id}`)
        .expect(204);

      // Check it is gone
      let resp3 = await request(app)
        .get(`/debiai/projects/${projectId}/selections`)
        .set("Content-Type", "application/json")
        .expect(200)
        .expect("Content-Type", /json/);

      const selections2 = resp3.body;
      const selection2 = selections2.find(
        (selection) => selection.name === selectionName
      );

      if (selection2)
        throw new Error(
          `Selection ${selectionName} did not get deleted in ${selections2.map(
            (selection) => selection.name
          )})}`
        );
    }
  });
});
