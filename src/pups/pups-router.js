const path = require("path");
const express = require("express");
const xss = require("xss");
const PupsService = require("./pups-service");

const pupsRouter = express.Router();
const jsonParser = express.json();

const serializePup = (pup) => ({
  id: pup.id,
  name: xss(pup.name),
  breed: pup.breed,
  mix: pup.mix,
  age: pup.age,
  size: pup.size,
  nervous: pup.nervous,
  rambunctious: pup.rambunctious,
  gentle: pup.gentle,
  wrestling: pup.wrestling,
  walks: pup.walks,
  parks: pup.parks,
  foodobsessed: pup.foodobsessed,
  ballobsessed: pup.ballobsessed,
  description: xss(pup.description),
  owner: pup.owner,
});

pupsRouter
  .route("/")
  .all()
  //   .all(requireAuth)
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    PupsService.getAllPups(knexInstance)
      .then((pups) => {
        res.json(pups.map(serializePup));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const {
      name,
      breed,
      mix,
      age,
      size,
      nervous,
      rambunctious,
      gentle,
      wrestling,
      walks,
      parks,
      foodobsessed,
      ballobsessed,
      description,
    } = req.body;
    const owner = req.user.id;
    const newPup = {
      name,
      breed,
      mix,
      age,
      size,
      nervous,
      rambunctious,
      gentle,
      wrestling,
      walks,
      parks,
      foodobsessed,
      ballobsessed,
      description,
    };
    for (const [key, value] of Object.entries(newPup))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
    PupsService.insertPup(req.app.get("db"), newPup)
      .then((pup) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${pup.id}`))
          .json(serializePup(pup));
      })
      .catch(next);
  });

pupsRouter
  .route("/user")
  .all()
  //   .all(requireAuth)
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    const id = req.user.id;
    PupsService.getUserPups(knexInstance, id)
      .then((pups) => {
        res.json(pups.map(serializePup));
      })
      .catch(next);
  });

pupsRouter
  .route("/:pup_id")
  .all()
  //   .all(requireAuth)
  .all((req, res, next) => {
    PupsService.getById(req.app.get("db"), req.params.pup_id)
      .then((pup) => {
        if (!pup) {
          return res.status(404).json({
            error: { message: `Pup doesn't exist` },
          });
        }
        res.pup = pup;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializePup(res.pup));
  })
  .delete((req, res, next) => {
    PupsService.deletePup(req.app.get("db"), req.params.pup_id)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const {
      name,
      breed,
      mix,
      age,
      size,
      nervous,
      rambunctious,
      gentle,
      wrestling,
      walks,
      parks,
      foodobsessed,
      ballobsessed,
      description,
    } = req.body;
    const pupToUpdate = {
      name,
      breed,
      mix,
      age,
      size,
      nervous,
      rambunctious,
      gentle,
      wrestling,
      walks,
      parks,
      foodobsessed,
      ballobsessed,
      description,
    };

    const numberOfValues = Object.values(pupToUpdate).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body is missing a required field`,
        },
      });
    }

    PupsService.updatePup(req.app.get("db"), req.params.pup_id, pupToUpdate)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = pupsRouter;
