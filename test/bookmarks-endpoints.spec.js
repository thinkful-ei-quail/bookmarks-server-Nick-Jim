const app = require('../src/app');
const knex = require('knex');
const makeBookmarksArray = require('./bookmarks-fixtures');
const supertest = require('supertest');
const { expect } = require('chai');

describe('Bookmarks Endpoints', function () {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('bookmarks').truncate());

  //afterEach('clean the table', () => db('bookmarks').truncate());

  describe('GET /bookmarks', () => {
    context('Given there is no data', () => {
      it('responds with 200 and an empty array', () => {
        return supertest(app).get('/bookmarks').expect(200, []);
      });

      it('responds with 404 for a specified bookmark', () => {
        return supertest(app).get('/bookmarks/2').expect(404);
      });
    });

    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert test data', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });

      it('responds with 200 and all of the bookmarks', () => {
        return supertest(app).get('/bookmarks').expect(200, testBookmarks);
      });

      it('resonds with 200 and the specified bookmark', () => {
        return supertest(app).get('/bookmarks/2').expect(200, testBookmarks[1]);
      });
    });
  });

  describe.only('POST /bookmarks', () => {
    context('Given there is no data', () => {
      it('creates a bookmark, responding with 201 and the new bookmark', () => {
        const newBookmark = {
          title: 'New title',
          url: 'http://www.newplace.com',
          description: 'New desc...',
          rating: 5
        };

        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .expect(201)
          .then(res => {
            expect(res.body.title).to.eql(newBookmark.title);
            expect(res.body.url).to.eql(newBookmark.url);
            expect(res.body.description).to.eql(newBookmark.description);
            expect(res.body.rating).to.eql(newBookmark.rating);
            expect(res.body.id).to.exist;
            expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
          })
          // .then(postRes => 
          //   supertest(app)
          //     .get(`/bookmarks/${postRes.body.id}`)
          //     .expect(postRes.body)
          // );
      });
    });
  });
});
