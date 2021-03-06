const Boom = require('boom')
const Conversation = require('./../models/conversation')

const ns = process.env.OAUTH_CLIENT_DOMAIN + '/conversations/'
const peopleNs = process.env.OAUTH_CLIENT_DOMAIN + '/people/'

function view (request, reply) {
  Conversation.findById(ns + request.params.id)
    .then(conversation => {
      if (!conversation) return reply(Boom.notFound())
      conversation.canEngage(request.auth.credentials.id)
        .then(allowed => {
          if (allowed) reply(conversation)
          else reply(Boom.forbidden())
        }
      )
    }).catch(err => { throw err })
}

// TODO optimize when loooots of conversations
function mine (request, reply) {
  if (peopleNs + request.params.id !== request.auth.credentials.id) return reply(Boom.forbidden())
  Conversation.findByPersonCanEngage(request.auth.credentials.id)
    .then(conversations => reply(conversations))
    .catch(err => { throw err })
}

function listReviews (request, reply) {
  Conversation.find({})
    .then(conversations => {
      let reviews = conversations.reduce((acc, conversation) => {
        return acc.concat(conversation.reviews)
      }, [])
      reply(reviews)
    }).catch(err => { throw err })
}

// TODO if open conversation with same creator, cousing and matching intent, dont
// TODO check if causing and matching exist and are active, in the db
function create (request, reply) {
  if (request.payload.creator !== request.auth.credentials.id || !request.payload.causingIntent) return reply(Boom.badData())
  Conversation.createAndAddBacklinks(request.payload)
    .then(conversation => reply(conversation))
    .catch(err => { throw err })
}

function addMessage (request, reply) {
  if (request.payload.creator !== request.auth.credentials.id) return reply(Boom.badData())
  Conversation.findById(request.payload.conversation)
    .then(conversation => {
      if (!conversation) return reply(Boom.badData())
      conversation.canEngage(request.auth.credentials.id)
        .then(allowed => {
          if (!allowed) return reply(Boom.forbidden())
          return conversation.addMessage(request.payload)
        }).then(message => reply(message))
    }).catch(err => { throw err })
}

function addReview (request, reply) {
  if (request.payload.creator !== request.auth.credentials.id) return reply(Boom.badData())
  Conversation.findById(request.payload.conversation)
    .then(conversation => {
      if (!conversation) return reply(Boom.badData())
      conversation.canEngage(request.auth.credentials.id)
        .then(allowed => {
          if (!allowed) return reply(Boom.forbidden())
          // TODO make sure not already reviewed
          return conversation.addReview(request.payload)
        }).then(review => reply(review))
    }).catch(err => { throw err })
}

module.exports = {
  view,
  mine,
  create,
  addMessage,
  listReviews,
  addReview
}
