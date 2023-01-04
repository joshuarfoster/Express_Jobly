"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company with company_handle does not exist 
   * */

  static async create({ title, salary, equity, company_handle}) {
    const companyCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [company_handle]);

    if (!companyCheck.rows[0])
      throw new BadRequestError(`No company: ${company_handle}`);

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
          title,
          salary,
          equity,
          company_handle
        ],
    );
    const job = result.rows[0];

    return job;
  }

  /** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           ORDER BY id`);
    return jobsRes.rows;
  }

  // Finds jobs based on parmeter filters

  static async filter(params) {
    let sqlStrings = []
    let values = []
    if (params.hasOwnProperty("minSalary")){
      const valueNumber = 1
      let minSalaryString = `$${valueNumber} <= salary`
      let minSalary = params['minSalary']
      values.push(minSalary)
      sqlStrings.push(minSalaryString)
    }
    if (params.hasOwnProperty("hasEquity") && params["hasEquity"]=="true"){
      let EquityString = 'equity > 0'
      sqlStrings.push(EquityString)
    }
    if (params.hasOwnProperty("title")){
      const valueNumber = values.length + 1
      let titleString = `LOWER(title) LIKE $${valueNumber}`
      let title = params['title']
      let titleValue = `%${title}%`
      values.push(titleValue)
      sqlStrings.push(titleString)
    }
    let sqlString = sqlStrings.join(' AND ')
    console.log(sqlStrings)
    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
       FROM jobs
       WHERE ${sqlString}
       ORDER BY id`,values)
    return jobsRes.rows
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No company: id of ${job}`);

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          companyHandle: "company_handle"
        });

    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: id of ${id}`);

    return job;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: id of ${id}`);
  }
}


module.exports = Job;
