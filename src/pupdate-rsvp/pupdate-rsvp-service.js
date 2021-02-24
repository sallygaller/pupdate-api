const PupdateRsvpService = {
  getAllPupdateRsvps(knex) {
    return knex.select("*").from("pupdate_rsvp");
  },
  getById(knex, id) {
    return knex.from("pupdate_rsvp").select("*").where("id", id).first();
  },
  getUserPupdateRsvps(knex, id) {
    return knex.from("pupdate_rsvp").select("*").where("attendee", id);
  },
  insertPupdateRsvp(knex, newPupdate) {
    return knex
      .insert(newPupdate)
      .into("pupdate_rsvp")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },
  deletePupdateRsvp(knex, id) {
    return knex("pupdate_rsvp").where({ id }).delete();
  },
};

module.exports = PupdateRsvpService;
