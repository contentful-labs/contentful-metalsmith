'use strict'

const contentful = require('contentful')
const debug = require('debug')('metalsmith-contentful-queries')
const validator = require('./validator')
const util = require('./util')
const clients = {}

/**
 * Create contentful client
 *
 * @param  {String} accessToken access token
 * @param  {String} spaceId     space id
 * @param  {String} host        host
 * @param  {String} environment environment
 *
 * @return {Object}             contentful client
 */
function getContentfulClient (accessToken, spaceId, host, environment = 'master') {
  if (!clients[spaceId]) {
    clients[spaceId] = contentful.createClient({
      space: spaceId,
      accessToken,
      host,
      environment,
    })
  }

  return clients[spaceId]
}

/**
 * Fetch common content for a certain space.
 *
 * @param {Object} entries entries fetched from contentful
 * @param {Object} options plugin config
 *
 * @return {Object}        file mapping object with common content added
 */
function getCommonContentForSpace (entries, options) {
  if (!options.common) {
    return entries
  }

  const client = getContentfulClient(options.access_token, options.space_id, options.host, options.environment)

  const commonQueries = []
  const commonIds = []

  for (let id in options.common) {
    commonQueries.push(client.getEntries(util.getEntriesQuery(options.common[id], options.filterTransforms)))
    commonIds.push(id)
  }

  // First, execute all common queries.
  return Promise.all(commonQueries).then(commonContent => {
    return new Promise((resolve, reject) => {
      // Store the results in an object using the configured IDs.
      const commonsObj = commonIds.reduce((prev, curr, index) => {
        prev[curr] = commonContent[index]
        return prev
      }, {})

      // Assign common query results to each entry.
      for (let entry in entries) {
        entries[entry].common = commonsObj
      }

      resolve(entries)
    })
  })
}

/**
 * Enrich all fetched entries with additional properties
 *
 * @param {Array}  entries fetched entries
 * @param {Object} file    file the entries were fetched for
 *
 * @return {Array}         enriched entries
 */
function mapEntriesForFile (entries, file, options) {
  return entries.map(entry => {
    entry._fileName = util.getFileName(entry, file.contentful, options)

    return entry
  })
}

/**
 * Process the fetched entries by contentful
 * for given file
 *
 * @param {Object} file    file read by metalsmith
 * @param {Array}  entries entries fetched from contentful
 * @param {Object} options file options
 *
 * @return {Object}        file mapping object
 */
function processEntriesForFile (file, entries, options) {
  const contentfulOptions = file.contentful
  const files = {}

  files[file._fileName] = file

  if (contentfulOptions.entry_id) {
    validator.validateSingleEntryForFile(entries[0], file)

    file.data = entries[0]
  } else {
    let contentTypes = entries.reduce((collection, entry) => {
      if (!collection[entry.sys.contentType.sys.id]) {
        collection[entry.sys.contentType.sys.id] = []
      }
      collection[entry.sys.contentType.sys.id].push(entry)

      return collection
    }, {})

    file.data = { entries, contentTypes }
  }

  if (contentfulOptions.entry_template) {
    return entries.reduce((fileMap, entry) => {
      fileMap[ entry._fileName ] = Object.assign({
        // `contents` need to be defined because there
        // might be other plugins that expect it
        contents: '',
        data: entry,
        id: entry.sys.id,
        contentType: contentfulOptions.content_type,
        view: contentfulOptions.entry_template,
        locale: contentfulOptions.locale,

        _fileName: entry._fileName,
        _parentFileName: file._fileName
      }, options.metadata)

      return fileMap
    }, files)
  }

  return files
}

/**
 * Process one file and connect it with contentful data
 *
 * @param {Object} file    file read by metalsmith
 * @param {Object} options contentful metalsmith options
 *
 * @return {Boolean|Promise}
 */
function processFile (file, options) {
  if (!file.contentful) {
    return true
  }

  validator.validateFile(file)
  validator.validateFileAndOptions(file, options)

  const spaceId = file.contentful.space_id || options.space_id
  const accessToken = file.contentful.access_token || options.access_token
  const environment = file.contentful.environment || options.environment
  const host = file.contentful.host || options.host
  const query = util.getEntriesQuery(file.contentful, options.filterTransforms)

  const client = getContentfulClient(accessToken, spaceId, host, environment)

  return client.getEntries(query)
    .catch(error => (decorateAPIError(error, file)))
    .then(entries => mapEntriesForFile(entries.items, file, options))
    .then(entries => processEntriesForFile(file, entries, options))
    .then(entries => getCommonContentForSpace(entries, options))
}

/**
 * Decorate the error coming from a failed
 * API response with the hint that the API failed
 *
 * This function also throws an error to
 * propagate the promise chain
 *
 * @param {Object} error error thrown by the API call
 * @param {fiel}   file  file that triggered the API call
 *
 * @throws {Error}
 *
 */
function decorateAPIError (error, file) {
  throw new Error(
    `Could not process file ${file._fileName}:
    API error response: ${error.message}`
  )
}

module.exports = {
  processFile
}
