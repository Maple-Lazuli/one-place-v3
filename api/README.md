# One Place API Documentation

## Overview

This API is a modular Flask application for managing users, projects, pages, files, images, code snippets, equations, canvas, events, todo items, tags, translations, sessions, and analytics. All endpoints generally require authentication via a session token (cookie: `token`).

---

## Authentication

Most endpoints require a valid session token, set as a cookie named `token` after login.

---

## Endpoints

### Main

- `GET /`  
  Returns a welcome message.

---

### Users (`/users`)

- `GET /users/test`  
  Test endpoint.

- `POST /users/create_user`  
  Create a new user.  
  **Body:**  
  ```json
  {
    "username": "string",
    "password": "string",
    "preferences": {}
  }
  ```

- `POST /users/login`  
  Login and receive a session token.  
  **Body:**  
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- `PATCH /users/update_user_name`  
  Change username.  
  **Body:**  
  ```json
  {
    "username": "string",
    "new_username": "string",
    "password": "string"
  }
  ```

- `PATCH /users/update_user_password`  
  Change password.  
  **Body:**  
  ```json
  {
    "username": "string",
    "new_password": "string",
    "password": "string"
  }
  ```

- `PATCH /users/update_user_preferences`  
  Update preferences.  
  **Body:**  
  ```json
  {
    "username": "string",
    "preferences": "json-string",
    "password": "string"
  }
  ```

- `DELETE /users/delete`  
  Delete user account.  
  **Body:**  
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```

- `PATCH /users/logout`  
  Logout and invalidate session.  
  **Body:**  
  ```json
  {
    "username": "string"
  }
  ```

---

### Projects (`/projects`)

- `GET /projects/test`  
  Test endpoint.

- `POST /projects/create`  
  Create a new project.  
  **Body:**  
  ```json
  {
    "project_name": "string",
    "project_description": "string"
  }
  ```

- `PATCH /projects/update`  
  Update project.  
  **Body:**  
  ```json
  {
    "project_id": int,
    "new_project_name": "string",
    "new_project_description": "string"
  }
  ```

- `DELETE /projects/delete`  
  Delete project.  
  **Body:**  
  ```json
  {
    "project_id": int
  }
  ```

- `GET /projects/get?id=<project_id>`  
  Get project by ID.

- `GET /projects/get_all`  
  Get all projects for user.

- `GET /projects/last_update?id=<project_id>`  
  Get last update time.

---

### Pages (`/pages`)

- `GET /pages/test`  
  Test endpoint.

- `POST /pages/create`  
  Create a new page.  
  **Body:**  
  ```json
  {
    "project_id": int,
    "name": "string"
  }
  ```

- `PATCH /pages/update`  
  Update page name.  
  **Body:**  
  ```json
  {
    "page_id": int,
    "name": "string"
  }
  ```

- `PUT /pages/content`  
  Update page content.  
  **Body:**  
  ```json
  {
    "page_id": int,
    "content": "string"
  }
  ```

- `DELETE /pages/delete`  
  Delete page.  
  **Body:**  
  ```json
  {
    "page_id": int
  }
  ```

- `GET /pages/get?id=<page_id>`  
  Get page by ID.

- `GET /pages/last_update?id=<page_id>`  
  Get last edit time.

---

### Files (`/files`)

- `GET /files/test`  
  Test endpoint.

- `POST /files/file`  
  Upload file (multipart/form-data).  
  **Fields:** `file`, `name`, `page_id`, `description`

- `GET /files/file?id=<file_id>`  
  Download file by ID.

- `GET /files/files_by_page?page_id=<page_id>`  
  Get file metadata by page.

---

### Images (`/images`)

- `GET /images/test`  
  Test endpoint.

- `POST /images/image`  
  Upload image (multipart/form-data).  
  **Field:** `file`

- `GET /images/image?id=<image_id>`  
  Download image by ID.

---

### Code Snippets (`/code_snippet`)

- `GET /code_snippet/test`  
  Test endpoint.

- `POST /code_snippet/create`  
  Create code snippet.  
  **Body:**  
  ```json
  {
    "page_id": int,
    "name": "string",
    "description": "string",
    "language": "string",
    "content": "string"
  }
  ```

- `GET /code_snippet/get?id=<snippet_id>`  
  Get snippet by ID.

- `GET /code_snippet/get_all_by_page?id=<page_id>`  
  Get all snippets for a page.

- `PATCH /code_snippet/update`  
  Update snippet.  
  **Body:**  
  ```json
  {
    "snippet_id": int,
    "new_name": "string",
    "new_description": "string",
    "new_language": "string",
    "new_content": "string"
  }
  ```

- `DELETE /code_snippet/delete`  
  Delete snippet.  
  **Body:**  
  ```json
  {
    "snippet_id": int
  }
  ```

- `GET /code_snippet/last_update?id=<snippet_id>`  
  Get last edit time.

---

### Equations (`/equations`)

- Similar endpoints to code snippets, but for equations.

---

### Canvas (`/canvas`)

- Similar endpoints to code snippets, but for canvas objects.

---

### Events (`/events`)

- `GET /events/test`  
  Test endpoint.

- `POST /events/create`  
  Create event.  
  **Body:**  
  ```json
  {
    "project_id": int,
    "name": "string",
    "description": "string",
    "time": "timestamp",
    "duration": int
  }
  ```

- `GET /events/get?id=<event_id>`  
  Get event by ID.

- `GET /events/get_project_events?project_id=<project_id>`  
  Get all events for a project.

- `PATCH /events/update`  
  Update event.  
  **Body:**  
  ```json
  {
    "event_id": int,
    "new_name": "string",
    "new_description": "string",
    "new_time": "timestamp",
    "new_duration": int
  }
  ```

- `DELETE /events/delete`  
  Delete event.  
  **Body:**  
  ```json
  {
    "event_id": int
  }
  ```

- `GET /events/last_update?id=<event_id>`  
  Get last update time.

---

### Todo (`/todo`)

- Similar endpoints to events, but for todo items.

---

### Tags (`/tags`)

- `GET /tags/test`  
  Test endpoint.

- `POST /tags/create`  
  Create tag.  
  **Body:**  
  ```json
  {
    "tag": "string",
    "options": "string"
  }
  ```

- `GET /tags/get`  
  Get all tags for user.

- `GET /tags/get_by_project?project_id=<project_id>`  
  Get all tags for a project.

- `PATCH /tags/update`  
  Update tag.  
  **Body:**  
  ```json
  {
    "tag_id": int,
    "new_tag": "string",
    "new_options": "string"
  }
  ```

- `POST /tags/assign`  
  Assign tag to project.  
  **Body:**  
  ```json
  {
    "tag_id": int,
    "project_id": int
  }
  ```

- `DELETE /tags/delete`  
  Delete tag.  
  **Body:**  
  ```json
  {
    "tag_id": int
  }
  ```

---

### Translations (`/translations`)

- `GET /translations/test`  
  Test endpoint.

- `POST /translations/create`  
  Create translation.  
  **Body:**  
  ```json
  {
    "page_id": int,
    "language": "string"
  }
  ```

- `GET /translations/get?id=<translation_id>`  
  Get translation by ID.

- `GET /translations/get_all_by_page?id=<page_id>`  
  Get all translations for a page.

- `PUT /translations/update`  
  Update translation.  
  **Body:**  
  ```json
  {
    "translation_id": int,
    "new_content": "string"
  }
  ```

- `DELETE /translations/delete`  
  Delete translation.  
  **Body:**  
  ```json
  {
    "translation_id": int
  }
  ```

- `GET /translations/last_update?id=<translation_id>`  
  Get last update time.

---

### Sessions (`/sessions`)

- `GET /sessions/test`  
  Test endpoint.

---

### Analytics (`/analytics`)

- `GET /analytics/report`  
  Get analytics report.

- `GET /analytics/test`  
  Test endpoint.

---

## Error Responses

- `400 Bad Request` – Invalid input.
- `401 Unauthorized` / `403 Forbidden` – Authentication/session required or invalid.
- `404 Not Found` – Resource not found.
- `500 Internal Server Error` – Server error.

---

## Notes

- Most endpoints require a valid session token (cookie: `token`).
- Some endpoints require additional authorization (project/page access).
- All data is stored in a PostgreSQL database.

---
