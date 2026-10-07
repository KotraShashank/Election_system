# Election Backend Application Guide

Welcome! This guide is designed for absolute beginners. It will walk you through exactly what this project is, how it works, the technologies it uses, and how to use it.

## 1. What is this Project?

This project is the **Backend API** (Application Programming Interface) for an **Election / Voting System**.

Imagine a restaurant:
* The **Frontend** (which is not in this folder) is like the menu and the dining area where customers sit and place orders.
* The **Backend** (this project) is the kitchen. It receives orders from the frontend, processes them (stores them in a database, checks if passwords are correct, counts votes), and sends the results back to the frontend.

This specific backend is responsible for:
- Registering new users and securely logging them in.
- Creating new elections.
- Managing candidates within an election.
- Allowing users to cast votes.
- Storing all this data safely in a database.

---

## 2. Working Principles (How it Works)

The system operates on a **Request and Response** cycle:
1. **Client Request:** A user clicks "Login" or "Vote" on the frontend webpage. This sends an HTTP request over the internet to this backend server.
2. **Authentication:** For secure actions (like voting), the backend first checks a digital ID badge (called a **JWT Token**). If the badge is valid, it proceeds.
3. **Processing (Controllers):** The request goes to a "Controller". The controller is the brain. If you want to vote, the `electionController` takes your vote, opens the database, and adds +1 to your chosen candidate.
4. **Database (MongoDB):** The controller talks to the database to save or fetch data (like finding out how many votes a candidate has).
5. **Response:** Finally, the backend sends a response back to the frontend (e.g., "Vote successful!" or "Wrong password").

---

## 3. Technologies Used

Here are the tools that power this backend:

* **Node.js**: The engine that runs javascript code on the server (your computer), instead of in a web browser.
* **Express.js**: A framework built on Node.js that makes it very easy to create the API routes (URLs like `/v1/login`).
* **MongoDB**: A "NoSQL" database. Instead of tables with rows and columns, it stores data like folders of documents, making it very flexible.
* **Mongoose**: A tool that acts as a translator between Node.js and MongoDB. It helps define strict rules (Schemas) for what a "User" or an "Election" should look like.
* **Bcryptjs**: A security tool used to scramble (hash) user passwords. If someone hacks the database, they will only see gibberish instead of actual passwords.
* **JSON Web Tokens (JWT)**: A digital badge given to a user after they log in. It proves their identity for future requests without needing them to log in again.
* **Nodemon**: A helpful developer tool that automatically restarts the server whenever you save a change in the code.

---

## 4. Folder & File Walkthrough

Here is a detailed breakdown of every piece of code in this folder:

### `app.js` (The Starting Point)
This is the main entry file of the application. When you run `npm start`, this is the file that executes. It connects to the database, configures security rules, and sets up the main URL paths (like starting everything with `/v1`).

### `.env` (Environment Variables)
This file holds secret configuration settings, like the `PORT` number the server runs on and the `MONGOURL` (the secret connection string and password to your database). This file should never be shared publicly.

### `package.json`
This is the instruction manual for Node.js. It lists the project's name, version, and—most importantly—all the external libraries (dependencies like `express` or `mongoose`) that the project needs to run.

### `middlewares/auth.js` (The Security Guard)
A "middleware" is code that runs in the middle of a request. `auth.js` acts like a bouncer at a club. Before someone is allowed to access the "Vote" route or the "Get User" route, this file checks if they have a valid JWT token. If they don't, it blocks them.

### `models/` (The Blueprints & Logic)
This directory is divided by feature: **Users** and **Elections**.

#### `models/userModel/`
* **`userSchema.js`**: The blueprint for a user in the database. It defines that every user must have an email, password, name, etc.
* **`userController.js`**: Contains the actual logic for users. It has the code to register a new user, check passwords during login, delete a user, and fetch user details.
* **`userRoutes.js`**: Connects the URLs (like `/register`) to the logic in the controller.

#### `models/electionModel/`
* **`electionSchema.js`**: The blueprint for an election. It defines the election name, the list of candidates, and keeps track of how many votes each candidate has.
* **`electionController.js`**: Contains the logic to create a new election in the database, fetch a list of all elections, and the logic to process a user's vote securely.
* **`electionRoutes.js`**: Connects the URLs (like `/submit_vote`) to the election logic.

---

## 5. How to Use This Application

Since this is a Backend API, it doesn't have a graphical interface. You interact with it either by connecting a Frontend website, or by using a developer tool like **Postman**.

### Step 1: Start the Server
Make sure you are in the project folder in your terminal and run:
```bash
npm run start_dev
```
Wait until you see `Database connected successfully!`.

### Step 2: Use an API Client (like Postman)
You send data to the server using JSON. Here is an example workflow:

1. **Register a User:**
   * Send a `POST` request to `http://localhost:5678/v1/register`
   * In the request body, send JSON with name, email, and password.

2. **Login:**
   * Send a `POST` request to `http://localhost:5678/v1/login`
   * Send the email and password.
   * The server will respond with a **JWT Token**.

3. **Perform Secure Actions (e.g., View Elections):**
   * Send a `GET` request to `http://localhost:5678/v1/get_all_elections`
   * In the request "Headers", you must include the token you got from logging in (usually under `Authorization: Bearer <your_token>`).

### Step 3: Connect a Frontend (The Real Goal)
Ultimately, to make this an app a normal person can use, you build a Frontend (using React, HTML, etc.). The frontend code will have a beautiful "Login" button that, when clicked, automatically sends the `POST /v1/login` request to this backend behind the scenes!
