# Data-Go-Round

Creators:

[Carter Mak](https://github.com/cartermak)

[Cady Speelman]()

[Nikolai Lyssogor]()

[Noorain Baig]()

[Ryan Landson]()

## Architectural Overview

Data-Go-Round is built using [Bootstrap 4](https://getbootstrap.com/) with [Bootswatch](https://bootswatch.com/) for styling, calling to a [Node,JS](https://nodejs.org/en/) server running the [Express](https://expressjs.com/) framework, all connected to a [PostgreSQL](https://www.postgresql.org/) database.

Node version: 12.16.2

## Node Packages

- Express
- pg-promise
- nodemon
  
  > The nodemon module will monitor the `index.js` file and automatically restart the server when changes are made. To use, start the server with `npm run dev`

## Database Design

### Functional Requirements

- Store user information (email and password)
- Store survey data
    - Title
    - Questions
    - Answer Options
    - Aggregated Response Data

### Non-functional Requirements

- User information fields:
    - User ID (PK)
    - Name
    - Email
    - Hashed+Salted Password
- Survey Data
    - Creator (by ID)
    - Title
    - Description
    - Table for each question type
        - Question text
        - Answer Options
        - Aggregated Response Data

### Design

![Database Model](https://user-images.githubusercontent.com/49076171/76897696-d3063980-6859-11ea-8756-451ede973609.png)

## Notes

### Logout button
For the logout button, use the following:

```html
<form action="/logout?_method=DELETE" method="POST">
<button type="submit">Logout</button>
</form>
```

### Setting up a local database

The local database connection is set up with the following properties:

| Name          | Value          |
| :------------ | :------------- |
| port          | 5432 (default) |
| database name | dgr            |
| user          | postgres       |
| password      | admin          |

To change your postgres user password (use whatever password you choose, but be careful not to commit it in plaintext), enter the `psql` terminal and run:

```sql
ALTER USER postgres PASSWORD 'admin';
```

Now, create the dgr database:

```sql
CREATE DATABASE dgr
```

Checkout the `database-design` branch and enter the database, then run the `SQLFillerData.sql` script:

```sql
\c dgr
\i SQLFillerData.sql
```

## Credit System

- Give a user one credit for each question they complete in a survey
- Creating a survey costs a flat rate of 10 credits
