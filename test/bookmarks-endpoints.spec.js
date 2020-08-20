const app = require('../src/app');
const knex = require('knex');
const makeBookmarksArray = require('./bookmarks-fixtures');
const supertest = require('supertest');

describe.only('Bookmarks Endpoints', function () {
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

  afterEach('clean the table', () => db('bookmarks').truncate());

  describe('GET /bookmarks', () => {
    //todo run with no data

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
});
