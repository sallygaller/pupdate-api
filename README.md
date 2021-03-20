# pupdate API

View pupdate [here](https://pupdate.vercel.app/).

View the client repo [here](https://github.com/sallygaller/pupdate).

pupdate is an app designed for dog owners to schedule playdates for their pups. pupdate users can quickly see and RSVP to pupdates happening in their area, and see profiles of the pups attending. Pup profiles contain pertinent information including breed, age, size, and playstyle to ensure a happy playdate. 

This REST API allows users to:
- Register and log in
- RSVP to and create Pupdates
- Add, edit and delete pup profiles

## Technology Used
- JavaScript
- Node
- PostgreSQL
- Express
- Knex
- Amazon S3
- Chai
- Mocha
- Supertest

## Endpoints
### /api/user
| Endpoint        | Body           | Result  |
| ------------- |-------------| ----- |
| `POST /api/user` | Name, email, password, city and state (collected using the Google Places API). | Creates a new user, directs them to Login page. |

### /api/auth
| Endpoint        | Header      | Body           | Result  |
| --------------|-------------|-------------|-------------|
| `POST /api/auth/login` |            | Email, password. | Returns a bearer token. |
| `POST /api/auth/refresh` | Bearer: token. |            | Returns a refreshed auth token. |

### /api/pupdates
| Endpoint        | Header       | Body           | Result  |
| --------------|-------------|-------------|-------------|
| `GET /api/pupdates` | Bearer: token.      |       | Returns all pupdates. |
| `GET /api/pupdates/user` | Bearer: token.      |       | Returns all of the pupdates the user has organized. |
| `POST /api/pupdates` | Bearer: token.      |Date, location, start time, end time, description. | Returns the newly created pupdate. |
| `GET /api/pupdates/:id` | Bearer: token.      |          | Returns pupdate details of the submitted id. |
| `PATCH /api/pupdates/:id` | Bearer: token.      | At least one of the following: Date, location, start time, end time, description. | Returns the updated pupdate. |
| `DELETE /api/pupdates/:id` | Bearer: token.      |         | Deletes pupdate with the submitted id. | 

### /api/pups
| Endpoint        | Header       | Body           | Result  |
| --------------|-------------|-------------|-------------|
| `GET /api/pups` | Bearer: token.      |        | Returns all pups. |
| `GET /api/pups/user` | Bearer: token.      |       | Returns all of the user's pups. |
| `GET /api/pups/user/:user_id` | Bearer: token.      |        | Returns all of the specified user's pups. |
| `POST /api/pups` | Bearer: token.      | Name, breed, size, age, description, playstyle. | Returns the newly created pup. |
| `POST /api/pups/upload` | Bearer: token.      | Photo. | Returns the newly created pup. |
| `GET /api/pups/:id` | Bearer: token.      |        | Returns pup details of the submitted id. |
| `PATCH /api/pups/:id` | Bearer: token.      | At least one of the following: Name, breed, size, age, description, playstyle. | Returns the updated pup. |
| `DELETE /api/pups/:id` | Bearer: token.      |         | Deletes pup with the submitted id. | 

### /api/pupdate-rsvp
| Endpoint        | Header           | Result  |
| --------------|-------------|-------------|
| `GET /api/pupdate-rsvp/user` | Bearer: token. | Returns all pupdates the user is attending. |
| `GET /api/pupdate-rsvp/:pupdate_id` | Bearer: token. | Returns all of attendees for the specified pupdate. |
| `POST /api/pupdate-rsvp/:pupdate_id` | Bearer: token. | Records the logged in user as attending the specified pupdate. |
| `DELETE /api/pupdate-rsvp/user/:id` | Bearer: token. | Deletes the specified RSVP of the logged in user. | 