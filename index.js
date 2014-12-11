var Immutable = require('immutable')

module.exports = Document = function(opts) {
    this._store = new Immutable.Map()
    this._versions = []
    this._scopes = []
    if(opts.getHandle) this._getHandle = opts.getHandle

    this._writing = false
    this._writes = []
}

Document.prototype.get = function(key) {
    return this._store.getIn(parseKey(key))
}

Document.prototype.set = function(key, val) {
    this._writes.push({key: key, val: val})
    this._doWrites()
}

Document.prototype._doWrites = function() {
    if(this._writing)
        return

    this._writing = true

    while(this._writes.length > 0) {
        var kv = this._writes.shift()
        this._setInternal(kv.key, kv.val)
    }

    this._writing = false
}

Document.prototype._setInternal = function(key, val) {
    var path = parseKey(key)

    var next = this._store.setIn(path, val)

    if(next == this._store)
        return

    this._versions.push(this._store)
    this._store = next

    this._scopes = this._scopes.filter(function(scope) { return ! pathIsParent(path, scope._path) })

    this._scopes.forEach(function(scope) {
        if(pathIsPrefix(scope._path, path))
            scope._run(path)
    })
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

Document.prototype.scope = function(key) {
    var scope = new Scope(key, this)
    this._scopes.push(scope)
    return scope
}

Document.Scope = Scope = function(key, doc) {
    this._doc = doc
    this._path = parseKey(key)
    this._watch = []
}

Scope.prototype.handle = function(key) {
    var path = parseKey(key)

    var watcher
    this._watch.some(function(w) { 
        return pathEqual(path, w.path) && (watcher = w)
    })

    if(watcher)
        return watcher.sink
    
    watcher = { path: path, sink: null }
    this._watch.push(watcher)

    return this._doc._getHandle(key, function(sink) { watcher.sink = sink })
}

Scope.prototype._run = function(path) {
    this._watch.forEach(function(w) {
        if(pathIsPrefix(path, w.path))
            w.sink(this._doc.get(w.path))
    }.bind(this))
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

function pathEqual(keypath, subkeypath) {
    return (
        keypath.length == subkeypath.length &&
        keypath.every(function(frag, ix) { return subkeypath[ix] == frag })
    )
}

function pathIsParent(keypath, subkeypath) {
    return (
        keypath.length < subkeypath.length &&
        keypath.every(function(frag, ix) { return subkeypath[ix] == frag })
    )
}

function pathIsPrefix(keypath, subkeypath) {
    return (
        keypath.length <= subkeypath.length &&
        keypath.every(function(frag, ix) { return subkeypath[ix] == frag })
    )
}
