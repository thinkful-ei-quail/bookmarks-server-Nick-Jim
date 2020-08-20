const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('../logger');
const { bookmarks } = require('../store');
const { PORT } = require('../config');
const BookmarksService = require('./bookmarks-service');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
  .route('/')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then((bookmarks) => res.json(bookmarks))
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, description = '', rating } = req.body;
    const newBookmark = {
      title,
      url,
      description,
      rating,
    };

    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        return res.status(400).json({
          error: {
            message: `Missing '${key}' in request body`,
          },
        });
      }
    }

    // check that rating is a number between 0 and 5
    if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
      logger.error(`Rating ${rating} supplied is invalid`);
      return res.status(400).json({
        error: {
          message: `Rating must be a number between 0 and 5, recieved ${rating}`,
        },
      });
    }

    // check that url at least starts with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      logger.error(`URL ${url} supplied is invalid`);
      return res
        .status(400)
        .json({ error: { message: 'URL must begin with http(s)://' } });
    }

    BookmarksService.insertBookmark(req.app.get('db'), newBookmark)
      .then((bookmark) => {
        res.status(201).location(`/bookmarks/${bookmark.id}`).json(bookmark);
      })
      .catch(next);
  });

bookmarksRouter
  .route('/:id')
  .all((req, res, next) => {
    const { id } = req.params;

    BookmarksService.getBookmarkById(req.app.get('db'), id)
      .then((bookmark) => {
        if (!bookmark) {
          return res
            .status(404)
            .json({ message: `bookmark id ${id} does not exist` });
        }
        res.bookmark = bookmark;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(res.bookmark);
  })
  .delete((req, res, next) => {
    const { id } = req.params;
    BookmarksService.deleteBookmark(req.app.get('db'), id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);

    // const bookmarkIndex = bookmarks.findIndex((bm) => bm.id == id);

    // if (bookmarkIndex === -1) {
    //   logger.error(`Bookmark with id ${id} not found`);
    //   return res.status(404).send('Not Found');
    // }

    // const deleteBook = bookmarks.splice(bookmarkIndex, 1);

    // logger.info(`Bookmark with id ${id} deleted.`);
    // res.status(204).end();
  });

module.exports = bookmarksRouter;
