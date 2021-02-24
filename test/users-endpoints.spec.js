const knex = require("knex");
const app = require("../src/app");
const { makeUsersArray } = require("./users.fixtures");

describe.only("Users Endpoints", function () {
  let db;

  const testUsers = makeUsersArray();
  const testUser = testUsers[0];

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DATABASE_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("clean the table", () =>
    db.raw("TRUNCATE pupdate_users RESTART IDENTITY CASCADE")
  );

  afterEach("cleanup", () =>
    db.raw("TRUNCATE pupdate_users RESTART IDENTITY CASCADE")
  );

  describe(`POST /api/users`, () => {
    context(`User Validation`, () => {
      beforeEach("insert users", () => {
        return db.into("pupdate_users").insert(testUsers);
      });
      const requiredFields = [
        "firstname",
        "lastname",
        "password",
        "email",
        "city",
        "state",
      ];

      requiredFields.forEach((field) => {
        const registerAttemptBody = {
          firstname: "test firstname",
          lastname: "test lastname",
          email: "test email",
          password: "test password",
          city: "test city",
          state: "test state",
        };

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete registerAttemptBody[field];

          return supertest(app)
            .post("/api/users")
            .send(registerAttemptBody)
            .expect(400, {
              error: `Missing '${field}' in request body`,
            });
        });
      });

      it(`responds 400 'Password must be longer than 8 characters' when empty password`, () => {
        const userShortPassword = {
          firstname: "test firstname",
          lastname: "test lastname",
          email: "test email",
          password: "1234567",
          city: "test city",
          state: "test state",
        };
        return supertest(app)
          .post("/api/users")
          .send(userShortPassword)
          .expect(400, { error: `Password must be longer than 8 characters` });
      });

      it(`responds 400 'Password must be less than 72 characters' when long password`, () => {
        const userLongPassword = {
          firstname: "test firstname",
          lastname: "test lastname",
          password: "*".repeat(73),
          email: "test email",
          city: "test city",
          state: "test state",
        };
        return supertest(app)
          .post("/api/users")
          .send(userLongPassword)
          .expect(400, { error: `Password must be less than 72 characters` });
      });

      it(`responds 400 error when password starts with spaces`, () => {
        const userPasswordStartsSpaces = {
          firstname: "test firstname",
          lastname: "test lastname",
          password: " 1Aa!2Bb@",
          email: "test email",
          city: "test city",
          state: "test state",
        };
        return supertest(app)
          .post("/api/users")
          .send(userPasswordStartsSpaces)
          .expect(400, {
            error: `Password must not start or end with empty spaces`,
          });

        it(`responds 400 error when password ends with spaces`, () => {
          const userPasswordEndsSpaces = {
            firstname: "test firstname",
            lastname: "test lastname",
            password: "1Aa!2Bb@ ",
            email: "test email",
            city: "test city",
            state: "test state",
          };
          return supertest(app)
            .post("/api/users")
            .send(userPasswordEndsSpaces)
            .expect(400, {
              error: `Password must not start or end with empty spaces`,
            });

          it(`responds 400 error when password isn't complex enough`, () => {
            const userPasswordNotComplex = {
              firstname: "test firstname",
              lastname: "test lastname",
              password: "11AAaabb",
              email: "test email",
              city: "test city",
              state: "test state",
            };
            return supertest(app)
              .post("/api/users")
              .send(userPasswordNotComplex)
              .expect(400, {
                error: `Password must contain 1 upper case, lower case, number and special character`,
              });
          });
        });
      });
    });
    context(`Happy path`, () => {
      it(`responds 201, serialized user, storing bcryped password`, () => {
        const newUser = {
          firstname: "test firstname",
          lastname: "test lastname",
          password: "11AAaa!!",
          email: "test email",
          city: "test city",
          state: "test state",
        };
        return supertest(app)
          .post("/api/users")
          .send(newUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).to.have.property("id");
            expect(res.body.firstname).to.eql(newUser.firstname);
            expect(res.body.lastname).to.eql(newUser.lastname);
            expect(res.body.email).to.eql(newUser.email);
            expect(res.body.city).to.eql(newUser.city);
            expect(res.body.state).to.eql(newUser.state);
            expect(res.body).to.not.have.property("password");
            expect(res.headers.location).to.eql(`/api/users/${res.body.id}`);
          })
          .expect((res) =>
            db
              .from("pupdate_users")
              .select("*")
              .where({ id: res.body.id })
              .first()
              .then((row) => {
                expect(row.firstname).to.eql(newUser.firstname);
                expect(row.lastname).to.eql(newUser.lastname);
                expect(row.email).to.eql(newUser.email);
                expect(row.city).to.eql(newUser.city);
                expect(row.state).to.eql(newUser.state);
                const expectedDate = new Date().toLocaleString("en", {
                  timeZone: "UTC",
                });
                const actualDate = new Date(row.date_created).toLocaleString();
                expect(actualDate).to.eql(expectedDate);
              })
          );
      });
    });
  });
});
