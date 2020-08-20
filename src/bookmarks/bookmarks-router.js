const express = require('express');
const { v4: uuid } = require('uuid');
const logger = require('../logger');
const { bookmarks } = require('../store');
const { PORT } = require('../config');

const bookmarksRouter = express.Router();
const bodyParser = express.json();

bookmarksRouter
    .route('/')
    .get((req, res) => {
        res.json(bookmarks);
    })
    .post(bodyParser, (req, res) => {
        const { title, url, description = '', rating } = req.body;
        
        //check that title url and rating are passed in
        if (!title) {
            logger.error(`Title is required`);
            return res
                .status(400)
                .send('Invalid data');
        }
        if (!url) {
            logger.error(`URL is required`);
            return res
                .status(400)
                .send('Invalid data');
        }
        if (!rating) {
            logger.error(`Rating is required`);
            return res
                .status(400)
                .send('Invalid data');
        }
        // check that rating is passed as a number between 0 and 5
        if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
            logger.error(`Rating ${rating} supplied is invalid`);
            return res
                .status(400)
                .send('Rating must be a number between 0 and 5');
        }
        // check that url at least starts with http:// or https://
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            logger.error(`URL ${url} supplied is invalid`);
            return res
                .status(400)
                .send('URL must begin with http(s)://');
        }

        const id = uuid();
        const bookmark = {
            id,
            title,
            url,
            description,
            rating
        };

        bookmarks.push(bookmark);

        logger.info(`Bookmark with id ${id} created`);

        res.status(201)
            .location(`http://localhost:${PORT}/bookmarks/${id}`)
            .json(bookmark);
    });

bookmarksRouter
    .route('/:id')
    .get((req, res) => {
        const { id } = req.params;

        const bookmark = bookmarks.find(bm => bm.id == id);

        if(!bookmark) {
            logger.error(`Bookmark with id ${id} not found`);
            return res.status(404).send('Not Found');
        }

        res.json(bookmark);
    })
    .delete((req, res) => {
        const { id } = req.params;

        const bookmarkIndex = bookmarks.findIndex(bm => bm.id == id);

        if(bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${id} not found`);
            return res.status(404).send('Not Found');
        }

        const deleteBook = bookmarks.splice(bookmarkIndex, 1);

        logger.info(`Bookmark with id ${id} deleted.`)
        res
            .status(204)
            .end();
    });

module.exports = bookmarksRouter;