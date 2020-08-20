const app = require('../src/app');
const store = require('../src/store');
const supertest = require('supertest');
const { expect } = require('chai');

describe('Bookmarks endpoints', () => {
  let bookmarksCopy;
  beforeEach('copy bookmarks', () => {
    bookmarksCopy = store.bookmarks.slice();
  });
  // afterEach('restore bookmarks', () => {
  //   store.bookmarks = bookmarksCopy;
  // });

  describe('Unauthorized requests', () => {
    it('should respond with 401 Unauthorized request for GET /bookmarks', () => {
      return supertest(app)
        .get('/bookmarks')
        .expect(401, { error: 'Unauthorized request' });
    });
    it('should respond with 401 Unauthorized request for POST /bookmarks', () => {
      return supertest(app)
        .post('/bookmarks')
        .send({ title: 'test-title', url: 'http://testplace.com', rating: 1})
        .expect(401, { error: 'Unauthorized request' });
    });
    it('should respond with 401 Unauthorized request for GET /bookmarks/:id', () => {
      const firstBookmark = store.bookmarks[0];
      return supertest(app)
        .get(`/bookmarks/${firstBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });
    it('should respond with 401 Unauthorized request for DELETE /bookmarks/:id', () => {
      const firstBookmark = store.bookmarks[0];
      return supertest(app)
        .delete(`/bookmarks/${firstBookmark.id}`)
        .expect(401, { error: 'Unauthorized request' });
    });
  });

  describe('GET /bookmarks', () => {
    it('should get all bookmarks from the store', () => {
      return supertest(app)
        .get('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200, store.bookmarks);
    });
  });

  describe('GET /bookmarks/:id', () => {
    it('should get the bookmark with matching id from the store', () => {
      const firstBookmark = store.bookmarks[0];
      return supertest(app)
        .get(`/bookmarks/${firstBookmark.id}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200, firstBookmark);
    });
    it('should respond with 404 if bookmark not found', () => {
      return supertest(app)
        .get(`/bookmarks/BOOKMARK_DOESN'T_EXIST`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(404, 'Not Found');
    });
  });

  describe('DELETE /bookmarks/:id', () => {
    it('should respond with 204 if delete successful', () => {
      const lastBookmark = store.bookmarks[store.bookmarks.length -1];
      const expectedBookmarks = store.bookmarks.filter(bm => bm.id !== lastBookmark.id);
      return supertest(app)
        .delete(`/bookmarks/${lastBookmark.id}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(204);
    });
    it('should delete the correct bookmark from the store', () => {
      const secondBookmark = bookmarksCopy[1];
      const expectedBookmarks = bookmarksCopy.filter(bm => bm.id !== secondBookmark.id);
      return supertest(app)
        .delete(`/bookmarks/${secondBookmark.id}`)
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(204)
        .then(res => {
          expect(store.bookmarks).to.eql(expectedBookmarks)
        });
    });
  });

  describe('POST /bookmarks', () => {
    it('should respond with 400 Invalid data if no title supplied', () => {
      return supertest(app)
        .post('/bookmarks')
        .send({
          url: 'http://testplace.com',
          rating: 3
        })
        .set('Authorization',  `Bearer ${process.env.API_TOKEN}`)
        .expect(400, 'Invalid data');
    });
    it('should respond with 400 Invalid data if no url supplied', () => {
      return supertest(app)
        .post('/bookmarks')
        .send({
          title: 'test-title',
          rating: 3
        })
        .set('Authorization',  `Bearer ${process.env.API_TOKEN}`)
        .expect(400, 'Invalid data');
    });
    it('should respond with 400 Invalid data if no rating supplied', () => {
      return supertest(app)
        .post('/bookmarks')
        .send({
          title: 'test-title',
          url: 'http://testplace.com'
        })
        .set('Authorization',  `Bearer ${process.env.API_TOKEN}`)
        .expect(400, 'Invalid data');
    });
    it('should respond with 400 if rating is not number between 0 and 5', () => {
      return supertest(app)
        .post('/bookmarks')
        .send({
          title: 'test-title',
          url: 'http://testplace.com',
          rating: -1
        })
        .set('Authorization',  `Bearer ${process.env.API_TOKEN}`)
        .expect(400, 'Rating must be a number between 0 and 5');
    });
    it('should respond with 400 if url doesn\'t start with http(s)://', () => {
      return supertest(app)
        .post('/bookmarks')
        .send({
          title: 'test-title',
          url: 'testplace.com',
          rating: 3
        })
        .set('Authorization',  `Bearer ${process.env.API_TOKEN}`)
        .expect(400, 'URL must begin with http(s)://');
    });
    it('should add the new bookmark to store', () => {
      const newBookmark = {
        title: 'test-title',
        url: 'http://testplace.com',
        description: 'test desc',
        rating: 3
      };
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .set('Authorization',  `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .then(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.description).to.eql(newBookmark.description)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body.id).to.be.a('string')
        });
    });
  });
  describe('GET /', () => {
    it('GET / responds with 200 containing "Hello, world!"', () => {
      return supertest(app)
        .get('/')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .expect(200, 'Hello, world!');
    });
  });
});