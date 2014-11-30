var Immutable = require('immutable')

module.exports = Document = function() {
    this._store = new Immutable.Map()
    this._versions = []
    this._scopes = []
}


Document.prototype.get = function(key) {
    return this._store.getIn(parseKey(key))
}

Document.prototype.set = function(key, val) {
    this._versions.push(this._store)
    this._store = this._store.setIn(parseKey(key), val)
}

Document.prototype.history = function(key) {
    var path = parseKey(key)

    var arr = []
    var last
    this._versions.forEach(function(ver) {
        var val = ver.getIn(path)
        if(val && val != last)
            arr.push(ver.getIn())
        last = val
    })

    return arr
}


function parseKey(key) {
    if(typeof key == 'string') {
        return key.split(/\s*\.\s*/g).map(function(frag) {
            if(! /^\w+$/.test(frag)) throw new Error('invalid path' + key)
            return frag
        })
    }
    else {
        return key || []
    }
}
