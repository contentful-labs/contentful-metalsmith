import test from 'ava'
import fs from 'fs'
import Metalsmith from 'metalsmith'
import slug from 'slug-component'
import nock from 'nock'

const expectedResults = {
  postsCustomFileName: `Down the Rabbit HoleSeven Tips From Ernest Hemingway on How to Write Fiction
test__posts__customFileName-POSTS-CONTENT-CUSTOM-FILENAME\n`,
  postsOverview: `Down the Rabbit HoleSeven Tips From Ernest Hemingway on How to Write Fiction
test__posts-POSTS-CONTENT\n`,
  postsPermalinkStructure: `Down the Rabbit HoleSeven Tips From Ernest Hemingway on How to Write Fiction
test__posts__permalinks-POSTS-CONTENT-PERMALINKS\n`,
  postsExtension: `Down the Rabbit HoleSeven Tips From Ernest Hemingway on How to Write Fiction
test__posts__extentsion-POSTS-CONTENT-EXTENSION\n`,
  postsFiltered: `Down the Rabbit Hole
test__posts__filtered-POSTS-CONTENT-FILTERED\n`,
  postsInclude: `Down the Rabbit HoleSeven Tips From Ernest Hemingway on How to Write Fiction
test__posts-POSTS-INCLUDE\n`,
  postsLimited: `Down the Rabbit Hole
test__posts__limited-POSTS-CONTENT-LIMITED\n`,
  postsLocale: `Down the Rabbit HoleSeven Tips From Ernest Hemingway on How to Write Fiction
test__posts__locale-POSTS-CONTENT-LOCALE\n`,
  postsOrdered: `Seven Tips From Ernest Hemingway on How to Write FictionDown the Rabbit Hole
test__posts__ordered-POSTS-CONTENT-ORDERED\n`,
  posts: {
    downTheRabbitHole: 'Down the Rabbit Hole',
    sevenTips: 'Seven Tips From Ernest Hemingway on How to Write Fiction'
  },
  singlePost: 'Single Post - Seven Tips From Ernest Hemingway on How to Write Fiction'
}

/**
 * create metalsmith instance
 *
 * @param {Object} config config options
 *
 * @return {Object}       metalsmith instance
 *
 */
function createMetalsmith (config = {}, markdown) {
  const metalsmith = new Metalsmith(__dirname)

  metalsmith.use(
    require('..')(config)
  )
  if (markdown) {
    metalsmith.use(
      require('metalsmith-markdown')()
    )
  } else {
    metalsmith.use(
      require('metalsmith-layouts')({ engine: 'handlebars' })
    )
  }

  metalsmith.source(config.src || 'src')
  metalsmith.destination(config.dest || 'build')

  return metalsmith
}

test.serial.cb('e2e - it propagate errors properly', t => {
  const metalsmith = createMetalsmith({})

  metalsmith.build(error => {
    t.is(error instanceof Error, true)
    t.end()
  })
})

test.serial.cb('e2e - it propagates error for no files properly', t => {
  const metalsmith = createMetalsmith({
    src: 'entry_key_src',
    dest: 'entry_key_build',
    entry_key: '_key',
    entry_extension: 'md',
    contentful: null
  })
  metalsmith.build(error => {
    t.is(error instanceof Error, true)
    t.end()
  })
})

test.serial.cb('e2e - it should render all templates properly', t => {
  const metalsmith = createMetalsmith({
    space_id: 'w7sdyslol3fu',
    access_token: 'baa905fc9cbfab17b1bc0b556a7e17a3e783a2068c9fd6ccf74ba09331357182',
    filenameBuilders: {
      aldente (entry) {
        return `aldente-${slug(entry.fields.title)}.html`
      }
    }
  })

  metalsmith.build(error => {
    if (error) {
      throw error
    }

    //
    // render default posts
    //
    t.is(
      fs.readFileSync(`${__dirname}/build/posts.html`, { encoding: 'utf8' }),
      expectedResults.postsOverview
    )

    t.is(
      fs.readFileSync(`${__dirname}/build/2wKn6yEnZewu2SCCkus4as-1asN98Ph3mUiCYIYiiqwko.html`, { encoding: 'utf8' }),
      expectedResults.posts.downTheRabbitHole
    )
    t.is(
      fs.readFileSync(`${__dirname}/build/2wKn6yEnZewu2SCCkus4as-A96usFSlY4G0W4kwAqswk.html`, { encoding: 'utf8' }),
      expectedResults.posts.sevenTips
    )

    //
    // render filtered posts
    //
    t.is(
      fs.readFileSync(`${__dirname}/build/posts-filtered.html`, { encoding: 'utf8' }),
      expectedResults.postsFiltered
    )

    //
    // render include posts
    //
    t.is(
      fs.readFileSync(`${__dirname}/build/posts-include.html`, { encoding: 'utf8' }),
      expectedResults.postsInclude
    )

    //
    // render limited posts
    //
    t.is(
      fs.readFileSync(`${__dirname}/build/posts-limited.html`, { encoding: 'utf8' }),
      expectedResults.postsLimited
    )

    //
    // render locale posts
    //
    t.is(
      fs.readFileSync(`${__dirname}/build/posts-locale.html`, { encoding: 'utf8' }),
      expectedResults.postsLocale
    )

    //
    // render ordered posts
    //
    t.is(
      fs.readFileSync(`${__dirname}/build/posts-ordered.html`, { encoding: 'utf8' }),
      expectedResults.postsOrdered
    )

    //
    // render posts with custom filenames
    //
    t.is(
      fs.readFileSync(`${__dirname}/build/posts-custom-filename.html`, { encoding: 'utf8' }),
      expectedResults.postsCustomFileName
    )

    t.is(
      fs.readFileSync(`${__dirname}/build/post-down-the-rabbit-hole.html`, { encoding: 'utf8' }),
      expectedResults.posts.downTheRabbitHole
    )

    t.is(
      fs.readFileSync(`${__dirname}/build/post-seven-tips-from-ernest-hemingway-on-how-to-write-fiction.html`, { encoding: 'utf8' }),
      expectedResults.posts.sevenTips
    )

    t.is(
      fs.readFileSync(`${__dirname}/build/aldente-seven-tips-from-ernest-hemingway-on-how-to-write-fiction.html`, { encoding: 'utf8' }),
      expectedResults.posts.sevenTips
    )

    t.is(
      fs.readFileSync(`${__dirname}/build/aldente-seven-tips-from-ernest-hemingway-on-how-to-write-fiction.html`, { encoding: 'utf8' }),
      expectedResults.posts.sevenTips
    )

    //
    // render a post defined with id
    //
    t.is(
      fs.readFileSync(`${__dirname}/build/single-post.html`, { encoding: 'utf8' }),
      expectedResults.singlePost
    )

    //
    // render posts with permalink structure
    //
    t.is(
      fs.readFileSync(`${__dirname}/build/posts-permalink-structure.html`, { encoding: 'utf8' }),
      expectedResults.postsPermalinkStructure
    )

    t.is(
      fs.readFileSync(`${__dirname}/build/2wKn6yEnZewu2SCCkus4as-1asN98Ph3mUiCYIYiiqwko/index.html`, { encoding: 'utf8' }),
      expectedResults.posts.downTheRabbitHole
    )
    t.is(
      fs.readFileSync(`${__dirname}/build/2wKn6yEnZewu2SCCkus4as-A96usFSlY4G0W4kwAqswk/index.html`, { encoding: 'utf8' }),
      expectedResults.posts.sevenTips
    )

    //
    // render posts using the given template extension
    //
    t.is(
      fs.readFileSync(`${__dirname}/build/posts-extension.awesome`, { encoding: 'utf8' }),
      expectedResults.postsExtension
    )

    t.is(
      fs.readFileSync(`${__dirname}/build/2wKn6yEnZewu2SCCkus4as-1asN98Ph3mUiCYIYiiqwko.awesome`, { encoding: 'utf8' }),
      expectedResults.posts.downTheRabbitHole
    )
    t.is(
      fs.readFileSync(`${__dirname}/build/2wKn6yEnZewu2SCCkus4as-A96usFSlY4G0W4kwAqswk.awesome`, { encoding: 'utf8' }),
      expectedResults.posts.sevenTips
    )

    t.end()
  })
})

test.serial.cb('e2e - it should render file from contentful', t => {
  /* eslint camelcase: 0 */
  const space_id = 'w7sdyslol3fu'
  const access_token = 'baa905fc9cbfab17b1bc0b556a7e17a3e783a2068c9fd6ccf74ba09331357182'
  const res = require('./fixtures/res')
  const contentful = nock('https://cdn.contentful.com:443')
    .get(`/spaces/${space_id}/entries`)
    .query({'content_type': '2wKn6yEnZewu2SCCkus4as'})
    .reply(200, res)

  const metalsmith = createMetalsmith({
    src: 'entry_key_src',
    dest: 'entry_key_build',
    space_id,
    access_token,
    contentful: {
      content_type: '2wKn6yEnZewu2SCCkus4as'
    },
    entry_key: '_key',
    entry_extension: 'md',
    filenameBuilders: {
      aldente (entry) {
        return `aldente-${slug(entry.fields.title)}.html`
      }
    }
  }, true)

  metalsmith.build(error => {
    if (error) {
      throw error
    }

    t.is(
      contentful.isDone(),
      true
    )

    t.is(
      fs.readdirSync(`${__dirname}/entry_key_build/`)[1],
      'pages'
    )

    t.is(
      fs.readFileSync(`${__dirname}/entry_key_build/pages/index.html`, { encoding: 'utf8' }),
      '<p>Home Page Content</p>\n'
    )

    t.end()
  })
})
