const BookmarksService = {
  getAllBookmarks(knex) {
    return knex.select('*').from('bookmarks');
  },

  getBookmarkById(knex, id) {
    return knex.select('*').from('bookmarks').where({ id }).first();
  },
};

module.exports = BookmarksService;
