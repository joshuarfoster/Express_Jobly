"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  const newJob = {
    title: "new",
    salary: 1000,
    equity: 0,
    company_handle: "c1"
  };

  test("ok for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "new",
        salary: 1000,
        equity: "0",
        companyHandle: "c1"
      },
    });
  });

  test("unauth for non admin", async function () {
    const resp = await request(app)
        .post(`/jobs`)
        .send(newJob)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post(`/jobs`)
        .send(newJob);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          salary: 10,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          id: 2,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs:
          [
            {
              id: expect.any(Number),
              title: "j1",
              salary: 30000,
              equity: "0",
              companyHandle: "c1"
            },
            {
              id: expect.any(Number),
              title: "j2",
              salary: 40000,
              equity: "0",
              companyHandle: "c1"
            },
            {
              id: expect.any(Number),
              title: "j3",
              salary: 120000,
              equity: "0.05",
              companyHandle: "c1"
            },
            {
              id: expect.any(Number),
              title: "j4",
              salary: 20000,
              equity: "0",
              companyHandle: "c2"
            },
            {
              id: expect.any(Number),
              title: "j5",
              salary: 30000,
              equity: "0",
              companyHandle: "c2"
            },
            {
              id: expect.any(Number),
              title: "j6",
              salary: 130000,
              equity: "0.1",
              companyHandle: "c3"
            },
            {
              id: expect.any(Number),
              title: "j7",
              salary: 230000,
              equity: "0.15",
              companyHandle: "c3"
            }
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
  
  test("filters by title", async function() {
    const resp1 = await request(app).get("/jobs?title=2")
    expect(resp1.body).toEqual({
      jobs:
          [
            {
                id: expect.any(Number),
                title:"j2",
                salary : 40000,
                equity : "0",
                companyHandle : 'c1'
            },
          ],
    })
    const resp2 = await request(app).get("/jobs?title=j")
    expect(resp2.body).toEqual({
      jobs:
      [
        {
          id: expect.any(Number),
          title: "j1",
          salary: 30000,
          equity: "0",
          companyHandle: "c1"
        },
        {
          id: expect.any(Number),
          title: "j2",
          salary: 40000,
          equity: "0",
          companyHandle: "c1"
        },
        {
          id: expect.any(Number),
          title: "j3",
          salary: 120000,
          equity: "0.05",
          companyHandle: "c1"
        },
        {
          id: expect.any(Number),
          title: "j4",
          salary: 20000,
          equity: "0",
          companyHandle: "c2"
        },
        {
          id: expect.any(Number),
          title: "j5",
          salary: 30000,
          equity: "0",
          companyHandle: "c2"
        },
        {
          id: expect.any(Number),
          title: "j6",
          salary: 130000,
          equity: "0.1",
          companyHandle: "c3"
        },
        {
          id: expect.any(Number),
          title: "j7",
          salary: 230000,
          equity: "0.15",
          companyHandle: "c3"
        }
      ],
    })
  })

  test('filters by salary', async function() {
    const resp1 = await request(app).get("/jobs?minSalary=100000")
    expect(resp1.body).toEqual({
      jobs:
            [
                {
                id: expect.any(Number),
                title: "j3",
                salary: 120000,
                equity: "0.05",
                companyHandle: "c1"
                },
                {
                id: expect.any(Number),
                title: "j6",
                salary: 130000,
                equity: "0.1",
                companyHandle: "c3"
                },
                {
                id: expect.any(Number),
                title: "j7",
                salary: 230000,
                equity: "0.15",
                companyHandle: "c3"
                }
            ]
    })
  })

  test('filters by equity', async function() {
    const resp1 = await request(app).get("/jobs?hasEquity=true")
    expect(resp1.body).toEqual({
      jobs:
            [
                {
                id: expect.any(Number),
                title: "j3",
                salary: 120000,
                equity: "0.05",
                companyHandle: "c1"
                },
                {
                id: expect.any(Number),
                title: "j6",
                salary: 130000,
                equity: "0.1",
                companyHandle: "c3"
                },
                {
                id: expect.any(Number),
                title: "j7",
                salary: 230000,
                equity: "0.15",
                companyHandle: "c3"
                }
            ]
    })
  })

  test("returns 404 if minSalary is less than 0", async function(){
    const resp = await request(app).get("/jobs?minSalary=-1")
    expect(resp.statusCode).toEqual(404)
  })

  test("filters by combination of filters", async function(){
    const resp = await request(app).get("/jobs?hasEquity=true&minSalary=130000")
    expect(resp.body).toEqual({
      jobs:
      [
        {
          id: expect.any(Number),
          title: "j6",
          salary: 130000,
          equity: "0.1",
          companyHandle: "c3"
        },
        {
          id: expect.any(Number),
          title: "j7",
          salary: 230000,
          equity: "0.15",
          companyHandle: "c3"
        }
      ]
    })
  })
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][0]['id']
    const resp = await request(app).get(`/jobs/${jobId}`);
    expect(resp.body).toEqual({
      job: {
        id: expect.any(Number),
        title: "j1",
        salary: 30000,
        equity: "0",
        companyHandle: "c1"
      },
    });
  });

  test("not found for no such job", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][6]['id'] +1
    const resp = await request(app).get(`/jobs/${jobId}`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admins", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][3]['id'];
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
          title: "new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job: {
        id : expect.any(Number),
        title:"new",
        salary : 20000,
        equity : "0",
        companyHandle : 'c2'
      },
    });
  });

  test("unauth for non admins", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][4]['id'];
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
          title: "new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][5]['id'];
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
            title: "new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][6]['id'] + 1;
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
            title: "new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][6]['id'];
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
          id: 3,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][2]['id'];
    const resp = await request(app)
        .patch(`/jobs/${jobId}`)
        .send({
          equity: 23,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][3]['id'];
    const resp = await request(app)
        .delete(`/jobs/${jobId}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: `${jobId}` });
  });

  test("unauth for non admins", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][4]['id'];
    const resp = await request(app)
        .delete(`/jobs/${jobId}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][1]['id'];
    const resp = await request(app)
        .delete(`/jobs/${jobId}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such company", async function () {
    const jobListResp = await request(app).get("/jobs");
    const jobId = jobListResp.body['jobs'][6]['id'] + 1;
    const resp = await request(app)
        .delete(`/jobs/${jobId}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});