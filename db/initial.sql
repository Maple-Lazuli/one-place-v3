DROP DATABASE IF EXISTS one_place_db;    

CREATE DATABASE one_place_db; 

\c one_place_db;  

CREATE TABLE roles(
   role_id serial PRIMARY KEY,
   role_name VARCHAR (255) UNIQUE NOT NULL
);

CREATE TABLE accounts (
        account_id serial PRIMARY KEY,
        role_id INT NOT NULL,
        first_name VARCHAR ( 50 ) NOT NULL,
        last_name VARCHAR ( 50 ) NOT NULL,
        created_on TIMESTAMP NOT NULL,
        username VARCHAR ( 50 ) UNIQUE NOT NULL,
        password VARCHAR ( 128 ) NOT NULL,
        salt INT NOT NULL,
        locked BOOL NOT NULL,
        log_in_attempts INT NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles (role_id)
        
);

CREATE TABLE permission_changes (
        change_id serial PRIMARY KEY,
        account_id INT NOT NULL,
        role_id INT NOT NULL,
        change_date TIMESTAMP NOT NULL,
        FOREIGN KEY (role_id) REFERENCES roles (role_id),
        FOREIGN KEY (account_id) REFERENCES accounts (account_id)
);

CREATE TABLE sessions (
        session_id serial PRIMARY KEY,
        account_id INT NOT NULL,
        creation_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        session_code VARCHAR ( 128 ) NOT NULL,
        active BOOL NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts (account_id)
);

CREATE TABLE preferences (
	preference_id serial PRIMARY KEY,
	account_id INT NOT NULL,
	editor VARCHAR ( 60 ) NOT NULL,
	utc_offset INT NOT NULL,
	FOREIGN KEY (account_id) REFERENCES accounts (account_id)
);

CREATE TABLE tags (
	tag_id serial PRIMARY KEY,
	tag_name VARCHAR ( 60 ) NOT NULL,
	tag_description VARCHAR ( 255 ) NOT NULL
);

CREATE TABLE projects (
	project_id serial PRIMARY KEY,
	account_id int NOT NULL,
	tag_id int NOT NULL,
	project_name VARCHAR ( 60 ) NOT NULL,
	project_description VARCHAR ( 255 ) NOT NULL,
	FOREIGN KEY (account_id) REFERENCES accounts (account_id),
	FOREIGN KEY (tag_id) REFERENCES tags (tag_id)
);

CREATE TABLE pages (
	page_id serial PRIMARY KEY,
	project_id INT NOT NULL,
	page_name VARCHAR ( 60 ) NOT NULL,
	contents TEXT,
	FOREIGN KEY (project_id) REFERENCES projects (project_id)
);


CREATE TABLE code (
	code_id serial PRIMARY KEY,
	page_id INT NOT NULL,
	code_name VARCHAR ( 60 ) NOT NULL,
	code_description VARCHAR ( 255 ) NOT NULL,
	code_content TEXT,
	code_language VARCHAR ( 60 ) NOT NULL,
	FOREIGN KEY (page_id) REFERENCES pages (page_id)
);

CREATE TABLE translations (
	translation_id serial PRIMARY KEY,
	page_id INT NOT NULL,
	translation_name VARCHAR ( 60 ) NOT NULL,
	translation TEXT,
	source TEXT,
	human_language VARCHAR ( 60 ) NOT NULL,
	FOREIGN KEY (page_id) REFERENCES pages (page_id)
);


CREATE TABLE files (
	file_id serial PRIMARY KEY,
	page_id INT NOT NULL,
	file_name VARCHAR ( 60 ) NOT NULL,
	file_description VARCHAR ( 255 ) NOT NULL,
	FOREIGN KEY (page_id) REFERENCES pages (page_id)
);


CREATE TABLE file_data (
	file_data_id serial PRIMARY KEY,
	file_id INT NOT NULL,
	data BYTEA NOT NULL,
	position INT NOT NULL,
	FOREIGN KEY (file_id) REFERENCES files (file_id)
);


CREATE TABLE canvas (
	canvas_id serial PRIMARY KEY,
	page_id INT NOT NULL,
	canvas_name VARCHAR ( 60 ) NOT NULL,
	canvas_description VARCHAR ( 255 ) NOT NULL,
	FOREIGN KEY (page_id) REFERENCES pages (page_id)
);


CREATE TABLE swiggle (
	swiggle_id serial PRIMARY KEY,
	canvas_id INT NOT NULL,
	swiggle_data BYTEA NOT NULL, 
	position INT NOT NULL,
	FOREIGN KEY (canvas_id) REFERENCES canvas (canvas_id)
);



