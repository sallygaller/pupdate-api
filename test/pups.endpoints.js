const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
// const jwt = require("jsonwebtoken");

const { makePupsArray } = require("./pups.fixtures");
const { makeUsersArray } = require("./users.fixtures");

describe("Pups Endpoints", function () {
  let db;

  //   function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  //     const token = jwt.sign({ user_id: user.id }, secret, {
  //       subject: user.email,
  //       algorithm: "HS256",
  //     });
  //     return `Bearer ${token}`;
  //   }

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () =>
    db.raw("TRUNCATE pups, pupdate_users RESTART IDENTITY CASCADE")
  );

  afterEach("cleanup", () =>
    db.raw("TRUNCATE pups, pupdate_users RESTART IDENTITY CASCADE")
  );

  describe("GET /api/pups", () => {
    context("Given no pups", () => {
      const testUsers = makeUsersArray();

      beforeEach("insert users", () => {
        return db.into("pupdate_users").insert(testUsers);
      });

      it("responds with 200 and an empty list", () => {
        return (
          supertest(app)
            .get("/api/pups")
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect(200, [])
        );
      });
    });

    context("Given there are pups in the database", () => {
      const testUsers = makeUsersArray();
      const testPups = makePupsArray();

      beforeEach("insert pups", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pups").insert(testPups);
          });
      });

      it("GET /api/pups responds with 200 and all the pups", () => {
        return (
          supertest(app)
            .get("/api/pups")
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect(200, testPups)
        );
      });
    });
  });

  describe("GET /api/pups/:pup_id", () => {
    context("Given no pups", () => {
      const testUsers = makeUsersArray();

      beforeEach("insert users", () => {
        return db.into("pupdate_users").insert(testUsers);
      });

      it("responds with 404", () => {
        const pupId = 123456;
        return (
          supertest(app)
            .get(`/api/pups/${pupId}`)
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect(404, { error: { message: `Pup doesn't exist` } })
        );
      });
    });

    context("Given there are pups in the database", () => {
      const testPups = makePupsArray();
      const testUsers = makeUsersArray();

      beforeEach("insert pups", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pups").insert(testPups);
          });
      });

      it("GET /api/pups/:pup_id responds with 200 and the specified pup", () => {
        const pupId = 2;
        const expectedPup = testPups[pupId - 1];
        return (
          supertest(app)
            .get(`/api/pups/${pupId}`)
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect(200, expectedPup)
        );
      });
    });

    context("Given an XSS attack pup", () => {
      const testUsers = makeUsersArray();
      const maliciousPup = {
        id: 911,
        name: '<script>alert("xss");</script>',
        breed: "labrador",
        mix: true,
        age: "Adult",
        size: "M",
        nervous: true,
        rambunctious: false,
        gentle: true,
        wrestling: false,
        walks: false,
        parks: true,
        foodobsessed: false,
        ballobsessed: true,
        description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
        owner: 3,
      };

      beforeEach("insert malicious pup", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pups").insert([maliciousPup]);
          });
      });

      it("removes XSS attack content", () => {
        return (
          supertest(app)
            .get(`/api/pups/${maliciousPup.id}`)
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect(200)
            .expect((res) => {
              expect(res.body.name).to.eql(
                '&lt;script&gt;alert("xss");&lt;/script&gt;'
              );
              expect(res.body.description).to.eql(
                `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
              );
            })
        );
      });
    });
  });

  describe("POST /api/pups", () => {
    const testPups = makePupsArray();
    const testUsers = makeUsersArray();

    beforeEach("insert users", () => {
      return db.into("pupdate_users").insert(testUsers);
    });

    it("Creates a pup, responding with 201 and the new pup", () => {
      this.retries(3);
      const newPup = {
        name: "Cassie",
        breed: "poodle",
        mix: false,
        age: "Adult",
        size: "M",
        nervous: true,
        rambunctious: false,
        gentle: true,
        wrestling: false,
        walks: false,
        parks: true,
        foodobsessed: false,
        ballobsessed: true,
        description: `Cassie loves to play with other poodles.`,
        owner: 1,
      };
      return (
        supertest(app)
          .post("/api/pups")
          // .set("Authorization", makeAuthHeader(testUsers[0]))
          .send(newPup)
          .expect(201)
          .expect((res) => {
            expect(res.body.name).to.eql(newPup.name);
            expect(res.body.breed).to.eql(newPup.breed);
            expect(res.body.mix).to.eql(newPup.mix);
            expect(res.body.age).to.eql(newPup.age);
            expect(res.body.size).to.eql(newPup.size);
            expect(res.body.nervous).to.eql(newPup.nervous);
            expect(res.body.rambunctious).to.eql(newPup.rambunctious);
            expect(res.body.gentle).to.eql(newPup.gentle);
            expect(res.body.wrestling).to.eql(newPup.wrestling);
            expect(res.body.walks).to.eql(newPup.walks);
            expect(res.body.parks).to.eql(newPup.parks);
            expect(res.body.foodobsessed).to.eql(newPup.foodobsessed);
            expect(res.body.ballobsessed).to.eql(newPup.ballobsessed);
            expect(res.body.description).to.eql(newPup.description);
            expect(res.body.owner).to.eql(testUsers[0].id);
            expect(res.body).to.have.property("id");
            expect(res.headers.location).to.eql(`/api/pups/${res.body.id}`);
            const expected = new Date().toLocaleString();
            const actual = new Date(res.body.date_added).toLocaleString();
            expect(actual).to.eql(expected);
          })
          .then((postRes) =>
            supertest(app)
              .get(`/api/pups/${postRes.body.id}`)
              //   .set("Authorization", makeAuthHeader(testUsers[0]))
              .expect(postRes.body)
          )
      );
    });

    const requiredFields = ["name", "breed", "age", "size"];

    requiredFields.forEach((field) => {
      const newPup = {
        name: "Bob",
        breed: "Dachshund",
        age: "Adult",
        size: "S",
        mix: false,
        nervous: true,
        rambunctious: false,
        gentle: true,
        wrestling: false,
        walks: false,
        parks: true,
        foodobsessed: false,
        ballobsessed: true,
        owner: 1,
      };

      it(`responds with 400 and an error message when the ${field} is missing`, () => {
        delete newPup[field];
        return (
          supertest(app)
            .post("/api/pups")
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .send(newPup)
            .expect(400, {
              error: { message: `Missing '${field}' in request body` },
            })
        );
      });
    });
  });

  describe("DELETE /api/pups/:pup_id", () => {
    context("Given no pups", () => {
      const testUsers = makeUsersArray();

      beforeEach("insert users", () => {
        return db.into("pupdate_users").insert(testUsers);
      });

      it("responds with 404", () => {
        const pupId = 123456;
        return (
          supertest(app)
            .delete(`/api/pups/${pupId}`)
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect(404, { error: { message: `Pup doesn't exist` } })
        );
      });
    });

    context("Give there are pups in the database", () => {
      const testPups = makePupsArray();
      const testUsers = makeUsersArray();

      beforeEach("insert pups", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pups").insert(testPups);
          });
      });

      it("responds with 204 and removes the pup", () => {
        const idToRemove = 2;
        const expectedPup = testPups.filter((pup) => pup.id !== idToRemove);
        return (
          supertest(app)
            .delete(`/api/pups/${idToRemove}`)
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect(204)
            .then((res) =>
              supertest(app)
                .get("/api/pups")
                // .set("Authorization", makeAuthHeader(testUsers[0]))
                .expect(expectedPup)
            )
        );
      });
    });
  });

  describe("PATCH /api/pups/:pup_id", () => {
    context(`Given no pups`, () => {
      const testUsers = makeUsersArray();

      beforeEach("insert users", () => {
        return db.into("pupdate_users").insert(testUsers);
      });

      it(`responds with 404`, () => {
        const pupId = 123456;
        return (
          supertest(app)
            .patch(`/api/pups/${pupId}`)
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .expect(404, { error: { message: `Pup doesn't exist` } })
        );
      });
    });

    context(`Given there are pups in the database`, () => {
      const testPups = makePupsArray();
      const testUsers = makeUsersArray();

      beforeEach("insert pups", () => {
        return db
          .into("pupdate_users")
          .insert(testUsers)
          .then(() => {
            return db.into("pups").insert(testPups);
          });
      });

      it("responds with 204 and updates the pup", () => {
        const idToUpdate = 2;
        const updatedPup = {
          name: "Buddy",
          breed: "labrador",
          mix: true,
          age: "Adult",
          size: "L",
          nervous: false,
          rambunctious: true,
          gentle: false,
          wrestling: true,
          walks: true,
          parks: true,
          foodobsessed: false,
          ballobsessed: false,
          description:
            "Buddy can be a bit full on for some dogs, but he really just loves to play! He especially loves puppies",
        };
        const expectedPup = {
          ...testPups[idToUpdate - 1],
          ...updatedPup,
        };
        return (
          supertest(app)
            .patch(`/api/pups/${idToUpdate}`)
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .send(updatedPup)
            .expect(204)
            .then((res) =>
              supertest(app)
                .get(`/api/pups/${idToUpdate}`)
                //   .set("Authorization", makeAuthHeader(testUsers[0]))
                .expect(expectedPup)
            )
        );
      });

      it(`responds with 400 when no required fields supplied`, () => {
        const idToUpdate = 2;
        return (
          supertest(app)
            .patch(`/api/pups/${idToUpdate}`)
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .send({ randomField: "foo" })
            .expect(400, {
              error: {
                message: `Request body is missing a required field`,
              },
            })
        );
      });

      it(`responds with 204 when updating only a subset of fields`, () => {
        const idToUpdate = 2;
        const updatedPup = {
          breed: "dachshund",
        };
        const expectedPup = {
          ...testPups[idToUpdate - 1],
          ...updatedPup,
        };

        return (
          supertest(app)
            .patch(`/api/pups/${idToUpdate}`)
            //   .set("Authorization", makeAuthHeader(testUsers[0]))
            .send({
              ...updatedPup,
              fieldToIgnore: "should not be in GET response",
            })
            .expect(204)
            .then((res) =>
              supertest(app)
                .get(`/api/pups/${idToUpdate}`)
                // .set("Authorization", makeAuthHeader(testUsers[0]))
                .expect(expectedPup)
            )
        );
      });
    });
  });
});
