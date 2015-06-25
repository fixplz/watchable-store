var Imm = require('immutable')

module.exports = Store = function(initial) {
    this._store = new Imm.Map()
    this._versions = []
    this._watchers = []

    this._notify = []
    this._inNotifyLoop = false

    if(initial)
        this.set('', initial)
}

Store.prototype.get = function(key) {
    return this._store.getIn(parseKey(key))
}

Store.prototype.set = function(key, val) {
    key = parseKey(key)

    var lastStore = this._store
    var newStore = this._store.setIn(key, val)

    if(Imm.is(newStore, lastStore))
        return

    this._versions.push(lastStore)
    this._store = newStore

    this._watchers.forEach(function(watcher) {
        var watchKey = getWatcherKey(watcher.key)
        if(pathIsPrefix(watchKey, key) || pathIsPrefix(key, watchKey))
            this._notify.push(watcher)
    }.bind(this))

    if(this._inNotifyLoop)
        return

    this._inNotifyLoop = true

    while(this._notify.length > 0) {
        var watcher = this._notify.shift()
        var watchKey = getWatcherKey(watcher.key)
        if(! Imm.is(lastStore.getIn(watchKey), newStore.getIn(watchKey)))
            watcher.func(newStore.getIn(watchKey))
    }

    this._inNotifyLoop = false
}

Store.prototype.history = function(key) {
    key = parseKey(key)

    var arr = []
    var last
    this._versions.forEach(function(ver) {
        var val = ver.getIn(key)
        if(! Imm.is(val, last))
            arr.push(val)
        last = val
    })

    return arr
}

Store.prototype.watch = function(key, func) {
    this._watchers.push({ key: key, func: func })
}

Store.prototype.unwatch = function(key, func) {
    var index
    this._watchers.some(function(watcher, ix) {
        if(getWatcherKey(watcher.key).join('.') == key && watcher.func == func) {
            index = ix
            return true
        }
    })

    if(index) this._watchers.splice(index, 1)
}


function parseKey(key) {
    if(typeof key == 'string') {
        if(key == '') return []
        return key.split(/\s*\.\s*/g).map(function(frag) {
            if(! /^\w+$/.test(frag)) throw new Error('invalid path' + key)
            return frag
        })
    }
    else {
        return key || []
    }
}

function getWatcherKey (key) {
    return parseKey(typeof key == 'function' ? key() : key)
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
