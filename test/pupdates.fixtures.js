function makePupdatesArray() {
  return [
    {
      id: 1,
      date: "2020-03-02T08:00:00.000Z",
      starttime: "09:30:00",
      endtime: "10:30:00",
      location: "Arbor Lodge Park",
      description: "Let's hang out at the park!",
      organizer: 1,
    },
    {
      id: 2,
      date: "2020-03-01T08:00:00.000Z",
      starttime: "15:30:00",
      endtime: "17:30:00",
      location: "Arbor Lodge Park",
      description: "Let's hang out at the park! I'll bring a frisbee",
      organizer: 1,
    },
    {
      id: 3,
      date: "2020-02-09T08:00:00.000Z",
      starttime: "10:00:00",
      endtime: "12:30:00",
      location: "Cathedral Park",
      description: "We'll go on a gentle walk around the neighborhood.",
      organizer: 2,
    },
    {
      id: 4,
      date: "2020-02-28T08:00:00.000Z",
      starttime: "11:00:00",
      endtime: "12:30:00",
      location: "Arbor Lodge Park",
      description: "Let's go for a picnic!",
      organizer: 3,
    },
    {
      id: 5,
      date: "2020-03-02T08:00:00.000Z",
      starttime: "14:00:00",
      endtime: "15:30:00",
      location: "Arbor Lodge Park",
      description: "Let's go for a walk!",
      organizer: 3,
    },
  ];
}

module.exports = { makePupdatesArray };
