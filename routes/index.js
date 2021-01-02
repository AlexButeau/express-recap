/* eslint-disable implicit-arrow-linebreak */
// require('dotenv').config(); this is actually used in app.js
const { Router } = require('express');
// const omitBy = require('lodash/omitBy');
// const asyncHandler = require('express-async-handler');

const connection = require('../db');

const router = Router();

// const definedAttributesToSqlSet = (attributes) =>
//   Object.keys(omitBy(attributes, (item) => typeof item === 'undefined'))
//     .map((k) => `${k} = :${k}`)
//     .join(', ');

/* GET index page. */
router.get('/', (req, res) => {
  res.json({
    title: 'Express',
  });
});

/* GET all users */
router.get('/users', (req, res) => {
  // send an SQL request to get all users
  connection.query('SELECT * FROM user', (err, results) => {
    if (err) {
      // If an error has occurred, then the client is informed of the error
      res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    } else {
      // If everything went well, we send the result of the SQL query as JSON
      res.json(results);
    }
  });
});

/* GET all users names */
router.get('/users/names', (req, res) => {
  // send an SQL request to get all users
  connection.query('SELECT firstname, lastname FROM user', (err, results) => {
    if (err) {
      // If an error has occurred, then the client is informed of the error
      res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    } else {
      // If everything went well, we send the result of the SQL query as JSON
      const newResults = results.map(
        (user) => `${user.firstname} ${user.lastname}`
      );
      res.status(200).json(newResults);
    }
  });
});

/* GET all users with filters */
router.get('/users/filter', (req, res) => {
  const queries = req.query;

  if (queries.contains) {
    // filtre sur le texte de presentation
    const search = `%${queries.contains}%`;

    connection.query(
      'SELECT * FROM user WHERE presentation LIKE ?',
      [search],
      (err, results) => {
        if (err) {
          // If an error has occurred, then the client is informed of the error
          res.status(500).json({
            error: err.message,
            sql: err.sql,
          });
        } else {
          // If everything went well, we send the result of the SQL query as JSON
          res.status(200).json(results);
        }
      }
    );
  } else if (queries.name) {
    // filtre sur le début du nom de famille
    const name = `${queries.name}%`;

    connection.query(
      'SELECT * FROM user WHERE lastname COLLATE utf8mb4_general_ci LIKE ?',
      [name],
      (err, results) => {
        if (err) {
          // If an error has occurred, then the client is informed of the error
          res.status(500).json({
            error: err.message,
            sql: err.sql,
          });
        } else {
          // If everything went well, we send the result of the SQL query as JSON
          res.status(200).json(results);
        }
      }
    );
  } else if (queries.earlierBirthdate) {
    // filtre sur la date de naissance
    const { earlierBirthdate } = queries;

    connection.query(
      'SELECT * FROM user WHERE birthday > ? ',
      [earlierBirthdate],
      (err, results) => {
        if (err) {
          // If an error has occurred, then the client is informed of the error
          res.status(500).json({
            error: err.message,
            sql: err.sql,
          });
        } else {
          // If everything went well, we send the result of the SQL query as JSON
          res.status(200).json(results);
        }
      }
    );
  } else {
    res.send(
      'No filter on, please filter either on presentation content, name or age'
    );
  }
});

/* GET all users names with order */
router.get('/users/order/:order', (req, res) => {
  // send an SQL request to get all users
  if (req.params.order === 'asc' || req.params.order === 'desc') {
    const { order } = req.params; // this is ASC or DESC
    const sql = `SELECT firstname, lastname FROM user ORDER BY lastname ${order}`;
    connection.query(sql, (err, results) => {
      if (err) {
        // If an error has occurred, then the client is informed of the error
        res.status(500).json({
          error: err.message,
          sql: err.sql,
        });
      } else {
        // If everything went well, we send the result of the SQL query as JSON
        const newResults = results.map(
          (user) => `${user.firstname} ${user.lastname}`
        );
        res.status(200).json(newResults);
      }
    });
  } else {
    res.status(500).send('Wrong ordering parameter, chose ASC or DESC please');
  }
});

/* POST route */

router.post('/users', (req, res) => {
  // check data
  const {
    firstname,
    lastname,
    birthday,
    county,
    premium,
    presentation,
  } = req.body;

  const premiumInt = premium ? 1 : 0;
  if (firstname && lastname && birthday && county && premium && presentation) {
    // send an SQL request to get all users
    connection.query(
      'INSERT INTO user (firstname, lastname, birthday, county, premium, presentation) VALUES (?, ?, ?, ?, ?, ?)',
      [firstname, lastname, birthday, county, premiumInt, presentation],
      (err) => {
        if (err) {
          // If an error has occurred, then the client is informed of the error
          res.status(500).json({
            error: err.message,
            sql: err.sql,
          });
        } else {
          // If everything went well, we send the result of the SQL query as JSON
          res.status(200).send('New data inserted into the table');
        }
      }
    );
  } else {
    res.status(422).send('incomplete data');
  }
});

/* PUT route */
router.put('/users/:id', (req, res) => {
  // check data
  const {
    firstname,
    lastname,
    birthday,
    county,
    premium,
    presentation,
  } = req.body;

  const { id } = req.params;

  const premiumInt = premium ? 1 : 0;
  if (firstname && lastname && birthday && county && premium && presentation) {
    // send an SQL request to get all users
    connection.query(
      'UPDATE user SET firstname=?, lastname=?, birthday=?, county=?, premium=?, presentation=? WHERE id=?',
      [firstname, lastname, birthday, county, premiumInt, presentation, id],
      (err) => {
        if (err) {
          // If an error has occurred, then the client is informed of the error
          res.status(500).json({
            error: err.message,
            sql: err.sql,
          });
        } else {
          // If everything went well, we send the result of the SQL query as JSON
          res.status(200).send('Data updated');
        }
      }
    );
  } else {
    res.status(422).send('incomplete data');
  }
});

/* PUT route toggle premium */
router.put('/users/toggle/:id', (req, res) => {
  const { id } = req.params;

  // send an SQL request to get all users
  connection.query(
    'UPDATE user SET premium = !premium WHERE id = ?',
    [id],
    (err) => {
      if (err) {
        // If an error has occurred, then the client is informed of the error
        res.status(500).json({
          error: err.message,
          sql: err.sql,
        });
      } else {
        // If everything went well, we send the result of the SQL query as JSON
        res.status(200).send('Premium status toggled');
      }
    }
  );
});

/* DELETE route */
router.delete('/users/:id', (req, res) => {
  const { id } = req.params;

  // send an SQL request to get all users
  connection.query('DELETE FROM user WHERE id = ?', [id], (err) => {
    if (err) {
      // If an error has occurred, then the client is informed of the error
      res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    } else {
      // If everything went well, we send the result of the SQL query as JSON
      res.status(200).send('Data deleted');
    }
  });
});

/* DELETE route for all non premium */
router.delete('/deleteNonPremium', (req, res) => {
  // send an SQL request to get all users
  connection.query('DELETE FROM user WHERE premium=0', (err) => {
    if (err) {
      // If an error has occurred, then the client is informed of the error
      res.status(500).json({
        error: err.message,
        sql: err.sql,
      });
    } else {
      // If everything went well, we send the result of the SQL query as JSON
      res.status(200).send('All non premium members deleted');
    }
  });
});

module.exports = router;
