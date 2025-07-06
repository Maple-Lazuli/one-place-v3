-- Create the users table
CREATE TABLE users (
    UserID SERIAL PRIMARY KEY,
    name VARCHAR(25) NOT NULL,
    hash VARCHAR(64) NOT NULL,
    salt INTEGER NOT NULL,
    lastfailedlogin TIMESTAMP,
    preferences TEXT
);


CREATE TABLE projects (
    ProjectID SERIAL PRIMARY KEY,
    UserID INTEGER NOT NULL,
    name VARCHAR(64) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES users(UserID) ON DELETE CASCADE
);
