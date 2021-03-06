const express = require('express');
const logger = require('../logger');
const xss = require('xss');
const BookmarksService = require('./bookmarks-service');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: xss(bookmark.url),
  description: xss(bookmark.description),
  rating: bookmark.rating
});

bookmarksRouter
  .route('/')
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(bookmark => serializeBookmark(bookmark)));
      })
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
        res.status(201).location(`/bookmarks/${bookmark.id}`).json(serializeBookmark(bookmark));
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
    res.json(serializeBookmark(res.bookmark));
  })
  .delete((req, res, next) => {
    const { id } = req.params;
    BookmarksService.deleteBookmark(req.app.get('db'), id)
      .then(() => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(bodyParser, (req, res, next) => {
    res.status(204).end();
  });

module.exports = bookmarksRouter;