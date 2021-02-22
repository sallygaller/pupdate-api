function makeUsersArray() {
  return [
    {
      id: 1,
      date_created: "2029-01-22T16:28:32.615Z",
      firstname: "Alex",
      lastname: "Beagle",
      email: "alex.beagle@madeup.com",
      password: "secret",
      city: "Portland",
      state: "OR",
    },
    {
      id: 2,
      date_created: "2100-05-24T16:28:32.615Z",
      firstname: "Helen",
      lastname: "Labrador",
      email: "helenlabrador@madeup.com",
      password: "secret",
      city: "Portland",
      state: "OR",
    },
    {
      id: 3,
      date_created: "2100-03-22T16:28:32.615Z",
      firstname: "Anne",
      lastname: "Terrier",
      email: "anneterria@madeup.com",
      password: "secret",
      city: "Portland",
      state: "OR",
    },
  ];
}

module.exports = {
  makeUsersArray,
};
