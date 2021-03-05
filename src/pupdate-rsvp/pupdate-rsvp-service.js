const PupdateRsvpService = {
  getUserPupdateRsvps(knex, attendee) {
    return knex.from("pupdate_rsvp").select("*").where("attendee", attendee);
  },
  getPupdateRsvps(knex, pupdate) {
    return knex.from("pupdate_rsvp").select("*").where("pupdate", pupdate);
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
    console.log(IDBCursor);
    return knex("pupdate_rsvp").where({ id }).delete();
  },
};

module.exports = PupdateRsvpService;
