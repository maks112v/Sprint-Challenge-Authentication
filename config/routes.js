const axios = require("axios");

const { authenticate } = require("../auth/authenticate");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../database/dbConfig");

module.exports = server => {
  server.post("/api/register", register);
  server.post("/api/login", login);
  server.get("/api/jokes", authenticate, getJokes);
};

const jwtKey =
  process.env.JWT_SECRET ||
  'add a .env file to root of project with the JWT_SECRET variable';
const generateToken = user => {
  const payload = {
    subject: user.id,
    username: user.username
  };
  const options = {
    expiresIn: "1d"
  };
  return jwt.sign(payload, jwtKey, options);
};

function register(req, res) {
  // implement user registration
  let user = req.body;
  user.password = bcrypt.hashSync(user.password, 10);
  db("users")
    .insert(user)
    .then(user => {
      const token = generateToken(user);
      res.status(201).json({ user, token });
    })
    .catch(err => {
      res.status(500).json(err);
    });
}

function login(req, res) {
  // implement user login
  const { username, password } = req.body;
  db("users")
    .where({ username })
    .first()
    .then(user => {
      if(user && bcrypt.compareSync(password, user.password)) {
        const token = generateToken(user);
        res.status(200).json({message: 'welcome', username: user.username, token})
      }
    })
    .catch(err => {});
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: "application/json" }
  };

  axios
    .get("https://icanhazdadjoke.com/search", requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: "Error Fetching Jokes", error: err });
    });
}
