const path = require("path");
const express = require("express");
const xss = require("xss");
const PupdateRsvpService = require("./pupdate-rsvp-service");
const { requireAuth } = require("../middleware/jwt-auth");

const pupdateRsvpRouter = express.Router();
const jsonParser = express.json();

const serializePupdateRsvp = (pupdateRsvp) => ({
  id: pupdateRsvp.id,
  pupdate: pupdateRsvp.pupdate,
  attendee: pupdateRsvp.attendee,
});

pupdateRsvpRouter
  .route("/")
  .all(requireAuth)
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    PupdateRsvpService.getAllPupdateRsvps(knexInstance)
      .then((pupdateRsvps) => {
        res.json(pupdateRsvps.map(serializePupdateRsvp));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { pupdate } = req.body;
    const attendee = req.user.id;
    const newPupdateRsvp = {
      pupdate,
      attendee,
    };
    for (const [key, value] of Object.entries(newPupdateRsvp))
      if (value == null)
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
    PupdateRsvpService.insertPupdateRsvp(req.app.get("db"), newPupdateRsvp)
      .then((pupdateRsvp) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${pupdateRsvp.id}`))
          .json(serializePupdateRsvp(pupdateRsvp));
      })
      .catch(next);
  });

pupdateRsvpRouter
  .route("/user")
  .all(requireAuth)
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    const id = req.user.id;
    PupdateRsvpService.getUserPupdateRsvps(knexInstance, id)
      .then((pupdateRsvps) => {
        res.json(pupdateRsvps.map(serializePupdateRsvp));
      })
      .catch(next);
  });

pupdateRsvpRouter
  .route("/:pupdateRsvp_id")
  .all(requireAuth)
  .all((req, res, next) => {
    PupdateRsvpService.getById(req.app.get("db"), req.params.pupdateRsvp_id)
      .then((pupdateRsvpRouter) => {
        if (!pupdateRsvp) {
          return res.status(404).json({
            error: { message: `PupdateRsvp doesn't exist` },
          });
        }
        res.pupdateRsvp = pupdateRsvp;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializePupdateRsvp(res.pupdateRsvp));
  })
  .delete((req, res, next) => {
    PupdateRsvpService.deletePupdateRsvp(
      req.app.get("db"),
      req.params.pupdateRsvp_id
    )
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = pupdateRsvpRouter;
