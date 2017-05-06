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
    })
    .catch(err => { throw err })
}

// TODO optimize when loooots of conversations
function mine (request, reply) {
  if (peopleNs + request.params.id !== request.auth.credentials.id) return reply(Boom.forbidden())
  Conversation.findByPersonCanEngage(request.auth.credentials.id)
    .then(conversations => reply(conversations))
    .catch(err => { throw err })
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
  Conversation.findById(ns + request.payload.conversation)
    .then(conversation => {
      if (!conversation) return reply(Boom.badData())
      conversation.canEngage(request.auth.credentials.id)
        .then(allowed => {
          if (!allowed) return reply(Boom.forbidden())
          conversation.messages.push(request.payload)
          conversation.save()
            .then(updated => reply(updated.messages.find(message => message._id === request.payload._id)))
        }
      )
    })
    .catch(err => { throw err })
}

module.exports = {
  view,
  mine,
  create,
  addMessage
}
