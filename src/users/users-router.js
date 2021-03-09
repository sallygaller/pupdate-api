const express = require("express");
const path = require("path");
const UsersService = require("./users-service");

const usersRouter = express.Router();
const jsonBodyParser = express.json();

usersRouter.post("/", jsonBodyParser, (req, res, next) => {
  const { firstname, lastname, email, password, city, state } = req.body;
  for (const field of [
    "firstname",
    "lastname",
    "email",
    "password",
    "city",
    "state",
  ])
    if (!req.body[field])
      return res
        .status(400)
        .json({ error: `Missing '${field}' in request body` });

  const passwordError = UsersService.validatePassword(password);

  if (passwordError) return res.status(400).json({ error: passwordError });

  UsersService.hasUserWithEmail(req.app.get("db"), email)
    .then((hasUserWithEmail) => {
      if (hasUserWithEmail)
        return res.status(400).json({ error: `Email already taken` });

      return UsersService.hashPassword(password).then((hashedPassword) => {
        const newUser = {
          firstname,
          lastname,
          email,
          password: hashedPassword,
          city,
          state,
          date_created: "now()",
        };
        return UsersService.insertUser(req.app.get("db"), newUser).then(
          (user) => {
            res
              .status(201)
              .location(path.posix.join(req.originalUrl, `/${user.id}`))
              .json(UsersService.serializeUser(user));
          }
        );
      });
    })
    .catch(next);
});

module.exports = usersRouter;
