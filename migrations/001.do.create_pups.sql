CREATE TABLE pups (
    id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
    name VARCHAR(30),
    breed TEXT NOT NULL,
    mix BOOLEAN,
    age TEXT NOT NULL,
    size VARCHAR(1) NOT NULL,
    nervous BOOLEAN,
    rambunctious BOOLEAN,
    gentle BOOLEAN,
    wrestling BOOLEAN,
    walks BOOLEAN,
    parks BOOLEAN,
    foodobsessed BOOLEAN,
    ballobsessed BOOLEAN,
    description TEXT, 
    date_added TIMESTAMPTZ DEFAULT now() NOT NULL
);

