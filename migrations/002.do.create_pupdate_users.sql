CREATE TABLE pupdate_users (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    firstname text NOT NULL,
    lastname text NOT NULL,
    email VARCHAR(320) NOT NULL,
    password text NOT NULL,
    city VARCHAR(20) NOT NULL,
    state VARCHAR(20) NOT NULL,
    date_created TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pups
    ADD COLUMN
        owner INTEGER REFERENCES pupdate_users(id)
        ON DELETE SET NULL;
