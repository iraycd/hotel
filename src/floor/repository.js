const _ = require('lodash')
const { TABLES: { FLOOR } } = require('../config')

module.exports = function ({ connection }) {
  if (!connection) {
    throw new Error('No conn specified')
  }

  const timestamps = {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }

  const _updateTimestamps = (fields) => {
    if (timestamps) {
      const ts = [].slice.call(arguments, 1)
      const now = new Date()
      for (let i = 0, l = ts.length; i < l; ++i) {
        let column = timestamps[ts[i]]
        if (column) {
          fields[column] || (fields[column] = now)
        }
      }
    }
  }

  const create = async (object) => {
    _updateTimestamps(object, 'createdAt', 'updatedAt')
    let ids = await connection(FLOOR)
      .returning('id')
      .insert(object)
    return { ...object, id: ids[0] }
  }

  const del = id => {
    return connection(FLOOR)
      .where({ id })
      .del()
      .then(() => true)
  }

  const load = async (id) => {
    let result = await connection(FLOOR)
      .where({ id })
      .select()
      .then(data => data[0])
    return result
  }

  const update = async ({ id, ...rest }) => {
    _updateTimestamps(rest, 'updatedAt')
    return connection(FLOOR)
      .where({ id })
      .update(rest)
      .then(() => true)
  }

  const findOr = async (object) => {
    return connection(FLOOR)
    .modify(function (queryBuilder) {
      let keys = Object.keys(object)
      for (let i = 0, l = keys.length; i < l; i++) {
        let key = keys[i]
        let val = object[keys[i]]
        if (i === 0 && !_.isUndefined(val)) {
          queryBuilder.where(key, val)
        } else {
          if (!_.isUndefined(val)) {
            queryBuilder.orWhere(key, val)
          }
        }
      }
    })
  }

  const list = async (filters = {}, limit = null, offset = null) => {
    filters || (filters = {})
    let result = null
    if (!_.isNull(limit) && !_.isNull(offset)) {
      result = await connection(FLOOR)
        .select()
        .where(filters)
        .limit(limit)
        .offset(offset)
    } else {
      result = await connection(FLOOR).select().where(filters)
    }
    return result
  }

  return {
    create,
    findOr,
    list,
    load,
    del,
    update
  }
}
