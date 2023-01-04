"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 20,
    equity: 0,
    company_handle: 'c1',
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
        id: expect.any(Number),
        title: "new",
        salary: 20,
        equity: "0",
        companyHandle: 'c1',
      });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "new",
        salary: 20,
        equity: "0",
        company_handle: "c1"
      },
    ]);
  });

  test("bad request with no company with company handle", async function () {
    try {
      const badJob = {
        title: "new",
        salary: 20,
        equity: 0,
        company_handle: 'badCompany'
      };
      await Job.create(badJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 30000,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 40000,
        equity: "0",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 120000,
        equity: "0.05",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j4",
        salary: 20000,
        equity: "0",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j5",
        salary: 30000,
        equity: "0",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j6",
        salary: 130000,
        equity: "0.1",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "j7",
        salary: 230000,
        equity: "0.15",
        companyHandle: "c3",
      }
    ]);
  });
});

// ************************************flter

describe("filter", function() {
  test("filters", async function() {
    const params = {"name":"j", "hasEquity":true, "minSalary": 125000}
    let jobs = await Job.filter(params)
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j6",
        salary: 130000,
        equity: "0.1",
        companyHandle: "c3",
      },
      {
        id: expect.any(Number),
        title: "j7",
        salary: 230000,
        equity: "0.15",
        companyHandle: "c3",
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const highestIdResp = await db.query(`SELECT id FROM jobs WHERE title = 'j7'`);
    const highestId = highestIdResp.rows[0]["id"]
    let job = await Job.get(highestId);
    expect(job).toEqual({
      id: highestId,
      title: "j7",
      salary: 230000,
      equity: "0.15",
      companyHandle: "c3",
    });
  });

  test("not found if no such job", async function () {
    try {
      const highestIdResp = await db.query(`SELECT id FROM jobs WHERE title = 'j7'`);
      const tooHighId = highestIdResp.rows[0]["id"] + 1
      await Job.get(tooHighId);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "New",
    salary: 999,
    equity: 0
  };

  test("works", async function () {
    const idResp = await db.query(`SELECT id FROM jobs WHERE title = 'j3'`);
    const id = idResp.rows[0]["id"]
    let job = await Job.update(id, updateData);
    expect(job).toEqual({
      id: id,
      companyHandle: 'c1',
      title: "New",
      salary: 999,
      equity: "0"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${id}`);
    expect(result.rows).toEqual([{
      id: id,
      title: "New",
      salary: 999,
      equity: "0",
      company_handle: "c1",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: 999
    };

    const idResp = await db.query(`SELECT id FROM jobs WHERE title = 'j4'`);
    const id = idResp.rows[0]["id"]
    let job = await Job.update(id, updateDataSetNulls);
    expect(job).toEqual({
        id: id,
        companyHandle: 'c2',
        title: "New",
        salary: 999,
        equity: "0"
      });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${id}`);
    expect(result.rows).toEqual([{
        id: id,
        company_handle: 'c2',
        title: "New",
        salary: 999,
        equity: "0"
      }]);
  });

  test("not found if no such company", async function () {
    try {
      const updateData = {
          title: "New",
          salary: 999,
          equity: 0
        };
      const highestIdResp = await db.query(`SELECT id FROM jobs WHERE title = 'j7'`);
      const tooHighId = highestIdResp.rows[0]["id"] + 1
      await Job.update(tooHighId, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      const idResp = await db.query(`SELECT id FROM jobs WHERE title = 'j2'`);
      const id = idResp.rows[0]["id"]
      await Job.update(id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const idResp = await db.query(`SELECT id FROM jobs WHERE title = 'j2'`);
    const id = idResp.rows[0]["id"]
    await Job.remove(id);
    const res = await db.query(
        `SELECT title FROM jobs WHERE id=${id}`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      const highestIdResp = await db.query(`SELECT id FROM jobs WHERE title = 'j7'`);
      const tooHighId = highestIdResp.rows[0]["id"] + 1
      await Job.remove(tooHighId);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
