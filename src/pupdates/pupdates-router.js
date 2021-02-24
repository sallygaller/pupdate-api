const path = require("path");
const express = require("express");
const xss = require("xss");
const PupdatesService = require("./pupdates-service");
const { requireAuth } = require("../middleware/jwt-auth");

const pupdatesRouter = express.Router();
const jsonParser = express.json();

const serializePupdate = (pupdate) => ({
  id: pupdate.id,
  date: pupdate.date,
  starttime: pupdate.starttime,
  endtime: pupdate.endtime,
  location: xss(pupdate.location),
  organizer: pupdate.organizer,
});

pupdatesRouter
  .route("/")
  .all(requireAuth)
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    PupdatesService.getAllPupdates(knexInstance)
      .then((pupdates) => {
        res.json(pupdates.map(serializePupdate));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { date, starttime, endtime, location } = req.body;
    const organizer = req.user.id;
    const newPupdate = {
      date,
      starttime,
      endtime,
      location,
      organizer,
    };
    for (const [key, value] of Object.entries(newPupdate))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
    PupdatesService.insertPupdate(req.app.get("db"), newPupdate)
      .then((pupdate) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${pupdate.id}`))
          .json(serializePupdate(pupdate));
      })
      .catch(next);
  });

pupdatesRouter
  .route("/user")
  .all(requireAuth)
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    const id = req.user.id;
    PupdatesService.getUserPupdates(knexInstance, id)
      .then((pupdates) => {
        res.json(pupdates.map(serializePupdate));
      })
      .catch(next);
  });

pupdatesRouter
  .route("/:pupdate_id")
  .all(requireAuth)
  .all((req, res, next) => {
    PupdatesService.getById(req.app.get("db"), req.params.pupdate_id)
      .then((pupdate) => {
        if (!pupdate) {
          return res.status(404).json({
            error: { message: `Pupdate doesn't exist` },
          });
        }
        res.pupdate = pupdate;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializePupdate(res.pupdate));
  })
  .delete((req, res, next) => {
    PupdatesService.deletePupdate(req.app.get("db"), req.params.pupdate_id)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { date, starttime, endtime, location } = req.body;
    const pupdateToUpdate = { date, starttime, endtime, location };

    const numberOfValues = Object.values(pupdateToUpdate).filter(Boolean)
      .length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: `Request body is missing a required field`,
        },
      });
    }

    PupdatesService.updatePupdate(
      req.app.get("db"),
      req.params.pupdate_id,
      pupdateToUpdate
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = pupdatesRouter;
