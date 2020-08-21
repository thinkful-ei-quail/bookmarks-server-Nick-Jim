const app = require('../src/app');
const knex = require('knex');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks-fixtures');
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

  afterEach('clean the table', () => db('bookmarks').truncate());

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

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();

      beforeEach('insert malicious bookmark', () => {
        return db
          .into('bookmarks')
          .insert([maliciousBookmark]);
      });

      it('removes XSS attack content for GET /bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title)
            expect(res.body[0].description).to.eql(expectedBookmark.description)
          });
      });

      it('removes XSS attack content for GET /bookmarks/:id', () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousBookmark.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title)
            expect(res.body.description).to.eql(expectedBookmark.description)
          });
      });
    });
  });

  describe('POST /bookmarks', () => {
    context('Given there is no data', () => {
      it('creates a bookmark, responding with 201 and the new bookmark', () => {
        const newBookmark = {
          title: 'New title',
          url: 'http://www.newplace.com',
          description: 'New desc...',
          rating: 5,
        };

        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .expect(201)
          .then((res) => {
            expect(res.body.title).to.eql(newBookmark.title);
            expect(res.body.url).to.eql(newBookmark.url);
            expect(res.body.description).to.eql(newBookmark.description);
            expect(res.body.rating).to.eql(newBookmark.rating);
            expect(res.body.id).to.exist;
            expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
          });
        // .then(postRes =>
        //   supertest(app)
        //     .get(`/bookmarks/${postRes.body.id}`)
        //     .expect(postRes.body)
        // );
      });

      const requiredFields = ['title', 'url', 'rating'];

      requiredFields.forEach((field) => {
        const newBookmark = {
          title: 'New title',
          url: 'http://www.newplace.com',
          description: 'New desc...',
          rating: 5,
        };

        it(`responds with 400 and an error message if ${field} is missing`, () => {
          delete newBookmark[field];

          return supertest(app)
            .post('/bookmarks')
            .send(newBookmark)
            .expect(400, {
              error: { message: `Missing '${field}' in request body` },
            });
        });
      });

      it('responds with 400 if rating is NaN', () => {
        const newBookmark = {
          title: 'New title',
          url: 'http://www.newplace.com',
          description: 'New desc...',
          rating: 'five',
        };
        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: {
              message: `Rating must be a number between 0 and 5, recieved ${newBookmark.rating}`,
            },
          });
      });

      it('responds with 400 if invalid URL', () => {
        const newBookmark = {
          title: 'New title',
          url: 'www.newplace.com',
          description: 'New desc...',
          rating: 3,
        };
        return supertest(app)
          .post('/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: {
              message: 'URL must begin with http(s)://',
            },
          });
      });
    });

    context('Given an XSS attack bookmark', () => {
      it('removes XSS attack content from response', () => {
        const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
        return supertest(app)
            .post('/bookmarks')
            .send(maliciousBookmark)
            .then(res => {
                expect(res.body.title).to.eql(expectedBookmark.title);
                expect(res.body.content).to.eql(expectedBookmark.content);
            });
    });
    })
  });

  describe('DELETE /bookmarks/:id', () => {
    context('Given there is no data', () => {
      it('responds with 404 when bookmark does not exist', () => {
        return supertest(app).delete('/bookmarks/2').expect(404);
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach('insert test data', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });

      it('responds with 204 and deletes bookmark', () => {
        return supertest(app).delete('/bookmarks/2').expect(204);
      });
    });
  });
});
