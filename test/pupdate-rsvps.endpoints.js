const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const jwt = require("jsonwebtoken");

const { makePupdateRsvpsArray } = require("./pupdate-rsvps.fixtures");
const { makePupdatesArray } = require("./pupdates.fixtures");
const { makeUsersArray } = require("./users.fixtures");

describe("Pupdate-RSVP Endpoints", function () {
  let db;

  function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
      subject: user.email,
      algorithm: "HS256",
    });
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
    db.raw(
      "TRUNCATE pupdates, pupdate_rsvp, pupdate_users RESTART IDENTITY CASCADE"
    )
  );

  afterEach("cleanup", () =>
    db.raw(
      "TRUNCATE pupdates, pupdate_rsvp, pupdate_users RESTART IDENTITY CASCADE"
    )
  );

  describe("GET /api/pupdate-rsvp/user", () => {
    context("Given no pupdate-rsvps", () => {
      const testUsers = makeUsersArray();
      const testPupdates = makePupdatesArray();
      const testPupdateRsvps = makePupdateRsvpsArray();

      beforeEach("insert pupdates", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pupdates").insert(testPupdates);
          });
      });

      it("responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/api/pupdate-rsvp/user")
          .set("Authorization", makeAuthHeader(testUsers[2]))
          .expect(200, []);
      });
    });

    context("Given there are pupdateRsvps for that user", () => {
      const testUsers = makeUsersArray();
      const testPupdates = makePupdatesArray();
      const testPupdateRsvps = makePupdateRsvpsArray();

      beforeEach("insert pupdates", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pupdates").insert(testPupdates);
          })
          .then(() => {
            return db.into("pupdate_rsvp").insert(testPupdateRsvps);
          });
      });

      it("GET /api/pupdate-rsvp/user responds with 200 and that pupdate", () => {
        return supertest(app)
          .get("/api/pupdate-rsvp/user")
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, [testPupdateRsvps[0]]);
      });
    });
  });

  describe("GET /api/pupdate-rsvp/:pupdate_id", () => {
    context("Given no pupdate", () => {
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

      it("responds with 200 and an empty list", () => {
        const pupdateId = 123456;
        return supertest(app)
          .get(`/api/pupdate-rsvp/${pupdateId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, []);
      });
    });

    context("Given there are rsvps for that pupdate", () => {
      const testUsers = makeUsersArray();
      const testPupdates = makePupdatesArray();
      const testPupdateRsvps = makePupdateRsvpsArray();

      beforeEach("insert pupdates", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pupdates").insert(testPupdates);
          })
          .then(() => {
            return db.into("pupdate_rsvp").insert(testPupdateRsvps);
          });
      });

      it("GET /api/pupdate-rsvp/:pupdate_id responds with 200 and the rsvps for the specified pupdate", () => {
        const pupdateId = 1;
        const expectedPupdateRsvps = [
          {
            id: 1,
            pupdate: 1,
            attendee: 1,
          },
          {
            id: 2,
            pupdate: 1,
            attendee: 2,
          },
        ];
        return supertest(app)
          .get(`/api/pupdate-rsvp/${pupdateId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(200, expectedPupdateRsvps);
      });
    });
  });

  describe("POST /api/pupdate-rsvp/pupdate_id", () => {
    const testUsers = makeUsersArray();
    const testPupdates = makePupdatesArray();
    const testPupdateRsvps = makePupdateRsvpsArray();

    beforeEach("insert pupdates", () => {
      return db
        .into("pupdate_users")
        .insert(testUsers)
        .then(() => {
          return db.into("pupdates").insert(testPupdates);
        });
    });

    it("Creates a pupdate-rsvp, responding with 201 and the new pupdate rsvp", () => {
      this.retries(3);
      const pupdateId = 3;
      return supertest(app)
        .post(`/api/pupdate-rsvp/${pupdateId}`)
        .set("Authorization", makeAuthHeader(testUsers[0]))
        .expect(201)
        .expect((res) => {
          expect(res.body.pupdate).to.eql(3);
          expect(res.body.attendee).to.eql(testUsers[0].id);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(
            `/api/pupdate-rsvp/${pupdateId}/${res.body.id}`
          );
        })
        .then((postRes) =>
          supertest(app)
            .get(`/api/pupdate-rsvp/${pupdateId}`)
            .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect([postRes.body])
        );
    });
  });

  describe("DELETE /api/pupdate-rsvp/user/:pupdateRsvp_id", () => {
    context("Given no pupdates", () => {
      const testUsers = makeUsersArray();

      beforeEach("insert users", () => {
        return db.into("pupdate_users").insert(testUsers);
      });

      it("responds with 404", () => {
        const pupdateRsvpId = 123456;
        return supertest(app)
          .delete(`/api/pupdate-rsvp/user/${pupdateRsvpId}`)
          .set("Authorization", makeAuthHeader(testUsers[0]))
          .expect(404, { error: { message: `Pupdate RSVP doesn't exist` } });
      });
    });

    context("Give there are pupdates in the database", () => {
      const testUsers = makeUsersArray();
      const testPupdates = makePupdatesArray();
      const testPupdateRsvps = makePupdateRsvpsArray();

      beforeEach("insert pupdates", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pupdates").insert(testPupdates);
          })
          .then(() => {
            return db.into("pupdate_rsvp").insert(testPupdateRsvps);
          });
      });

      it("responds with 204 and removes the pupdate", () => {
        const idToRemove = 2;
        const expectedPupdateRsvps = [
          {
            id: 4,
            pupdate: 2,
            attendee: 2,
          },
          {
            id: 5,
            pupdate: 3,
            attendee: 2,
          },
        ];
        return supertest(app)
          .delete(`/api/pupdate-rsvp/user/${idToRemove}`)
          .set("Authorization", makeAuthHeader(testUsers[1]))
          .expect(204)
          .then((res) =>
            supertest(app)
              .get("/api/pupdate-rsvp/user")
              .set("Authorization", makeAuthHeader(testUsers[1]))
              .expect(expectedPupdateRsvps)
          );
      });
    });
  });
});
