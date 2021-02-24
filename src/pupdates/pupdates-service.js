const PupdatesService = {
  getAllPupdates(knex) {
    return knex.select("*").from("pupdates");
  },
  getById(knex, id) {
    return knex.from("pupdates").select("*").where("id", id).first();
  },
  getUserPupdates(knex, id) {
    return knex.from("pupdates").select("*").where("organizer", id);
  },
  insertPupdate(knex, newPupdate) {
    return knex
      .insert(newPupdate)
      .into("pupdates")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },
  deletePupdate(knex, id) {
    return knex("pupdates").where({ id }).delete();
  },
  updatePupdate(knex, id, newPupdateFields) {
    return knex("pupdates").where({ id }).update(newPupdateFields);
  },
};

module.exports = PupdatesService;
