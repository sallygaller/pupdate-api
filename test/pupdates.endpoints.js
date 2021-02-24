const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const jwt = require("jsonwebtoken");

const { makePupdatesArray } = require("./pupdates.fixtures");
const { makeUsersArray } = require("./users.fixtures");

describe("Pupdates Endpoints", function () {
  let db;

  function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
      subject: user.email,
      algorithm: "HS256",
    });
    console.log(token);
    return `Bearer ${token}`;
  }

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () =>
    db.raw("TRUNCATE pupdates, pupdate_users RESTART IDENTITY CASCADE")
  );

  afterEach("cleanup", () =>
    db.raw("TRUNCATE pupdates, pupdate_users RESTART IDENTITY CASCADE")
  );

  describe("GET /api/pupdates", () => {
    context("Given no pupdates", () => {
      const testUsers = makeUsersArray();

      beforeEach("insert users", () => {
        return db.into("pupdate_users").insert(testUsers);
      });

      it("responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/api/pupdates")
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, []);
      });
    });

    context("Given there are pupdates in the database", () => {
      const testUsers = makeUsersArray();
      const testPupdates = makePupdatesArray();

      beforeEach("insert pupdates", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pupdates").insert(testPupdates);
          });
      });

      it("GET /api/pupdates responds with 200 and all the pupdates", () => {
        return supertest(app)
          .get("/api/pupdates")
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, testPupdates);
      });
    });
  });

  describe("GET /api/pupdates/:pupdate_id", () => {
    context("Given no pupdate", () => {
      const testUsers = makeUsersArray();

      beforeEach("insert users", () => {
        return db.into("pupdate_users").insert(testUsers);
      });

      it("responds with 404", () => {
        const pupdateId = 123456;
        return supertest(app)
          .get(`/api/pupdates/${pupdateId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Pupdate doesn't exist` } });
      });
    });

    context("Given there are pupdates in the database", () => {
      const testPupdates = makePupdatesArray();
      const testUsers = makeUsersArray();

      beforeEach("insert pupdates", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pupdates").insert(testPupdates);
          });
      });

      it("GET /api/pupdates/:pupdate_id responds with 200 and the specified pupdate", () => {
        const pupdateId = 2;
        const expectedPupdate = testPupdates[pupdateId - 1];
        return supertest(app)
          .get(`/api/pupdates/${pupdateId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, expectedPupdate);
      });
    });

    context("Given an XSS attack pupdate", () => {
      const testUsers = makeUsersArray();
      const maliciousPupdate = {
        id: 911,
        date: "2020-03-02T08:00:00.000Z",
        starttime: "10:30:00",
        endtime: "11:30:00",
        location: '<script>alert("xss");</script>',
        organizer: 3,
      };

      beforeEach("insert malicious pupdate", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pupdates").insert([maliciousPupdate]);
          });
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/api/pupdates/${maliciousPupdate.id}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200)
          .expect((res) => {
            expect(res.body.location).to.eql(
              '&lt;script&gt;alert("xss");&lt;/script&gt;'
            );
          });
      });
    });
  });

  describe("POST /api/pupdates", () => {
    const testPupdates = makePupdatesArray();
    const testUsers = makeUsersArray();

    beforeEach("insert users", () => {
      return db.into("pupdate_users").insert(testUsers);
    });

    it("Creates a pupdate, responding with 201 and the new pupdate", () => {
      this.retries(3);
      const newPupdate = {
        date: "2020-02-09",
        starttime: "17:30:00",
        endtime: "18:30:00",
        location: "Arbor Lodge Park",
        organizer: 1,
      };
      return supertest(app)
        .post("/api/pupdates")
        .set("Authorization", makeAuthHeader(testUsers[0]))
        .send(newPupdate)
        .expect(201)
        .expect((res) => {
          expect(res.body.starttime).to.eql(newPupdate.starttime);
          expect(res.body.endtime).to.eql(newPupdate.endtime);
          expect(res.body.location).to.eql(newPupdate.location);
          expect(res.body.organizer).to.eql(testUsers[0].id);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/api/pupdates/${res.body.id}`);
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/pupdates/${postRes.body.id}`)
            .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect(postRes.body)
        );
    });

    const requiredFields = ["starttime", "endtime", "location"];

    requiredFields.forEach((field) => {
      const newPupdate = {
        date: "2020-04-01T08:00:00.000Z",
        starttime: "12:30:00",
        endtime: "13:30:00",
        location: "Arbor Lodge Park",
        organizer: 1,
      };

      it(`responds with 400 and an error message when the ${field} is missing`, () => {
        delete newPupdate[field];
        return supertest(app)
          .post("/api/pupdates")
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send(newPupdate)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          });
      });
    });
  });

  describe("DELETE /api/pupdates/:pupdate_id", () => {
    context("Given no pupdates", () => {
      const testUsers = makeUsersArray();

      beforeEach("insert users", () => {
        return db.into("pupdate_users").insert(testUsers);
      });

      it("responds with 404", () => {
        const pupdateId = 123456;
        return supertest(app)
          .delete(`/api/pupdates/${pupdateId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Pupdate doesn't exist` } });
      });
    });

    context("Give there are pupdates in the database", () => {
      const testPupdates = makePupdatesArray();
      const testUsers = makeUsersArray();

      beforeEach("insert pupdates", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pupdates").insert(testPupdates);
          });
      });

      it("responds with 204 and removes the pupdate", () => {
        const idToRemove = 2;
        const expectedPupdate = testPupdates.filter(
          (pupdate) => pupdate.id !== idToRemove
        );
        return supertest(app)
          .delete(`/api/pupdates/${idToRemove}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(204)
          .then((res) =>
            supertest(app)
              .get("/api/pupdates")
              .set("Authorization", makeAuthHeader(testUsers[0]))
              .expect(expectedPupdate)
          );
      });
    });
  });

  describe("PATCH /api/pupdates/:pupdate_id", () => {
    context(`Given no pupdates`, () => {
      const testUsers = makeUsersArray();

      beforeEach("insert users", () => {
        return db.into("pupdate_users").insert(testUsers);
      });

      it(`responds with 404`, () => {
        const pupdateId = 123456;
        return supertest(app)
          .patch(`/api/pupdates/${pupdateId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Pupdate doesn't exist` } });
      });
    });

    context(`Given there are pupdates in the database`, () => {
      const testPupdates = makePupdatesArray();
      const testUsers = makeUsersArray();

      beforeEach("insert pupdates", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pupdates").insert(testPupdates);
          });
      });

      it("responds with 204 and updates the pupdate", () => {
        const idToUpdate = 2;
        const updatedPupdate = {
          id: 2,
          date: "2020-03-01T08:00:00.000Z",
          starttime: "15:30:00",
          endtime: "17:30:00",
          location: "Portsmouth Park",
          organizer: 1,
        };
        const expectedPupdate = {
          ...testPupdates[idToUpdate - 1],
          ...updatedPupdate,
        };
        return supertest(app)
          .patch(`/api/pupdates/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send(updatedPupdate)
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/pupdates/${idToUpdate}`)
              .set("Authorization", makeAuthHeader(testUsers[0]))
              .expect(expectedPupdate)
          );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return supertest(app)
          .patch(`/api/pupdates/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send({ randomField: "foo" })
          .expect(400, {
            error: {
              message: `Request body is missing a required field`,
            },
          });
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updatedPupdate = {
          location: "McKenna Park",
        };
        const expectedPupdate = {
          ...testPupdates[idToUpdate - 1],
          ...updatedPupdate,
        };

        return supertest(app)
          .patch(`/api/pupdates/${idToUpdate}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .send({
            ...updatedPupdate,
            fieldToIgnore: "should not be in GET response",
          })
          .expect(204)
          .then((res) =>
            supertest(app)
              .get(`/api/pupdates/${idToUpdate}`)
              .set("Authorization", makeAuthHeader(testUsers[0]))
              .expect(expectedPupdate)
          );
      });
    });
  });
});
