CREATE TABLE pupdate_rsvp (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    pupdate INTEGER REFERENCES pupdates(id) ON DELETE CASCADE NOT NULL,
    attendee INTEGER REFERENCES pupdate_users(id) ON DELETE CASCADE NOT NULL
);