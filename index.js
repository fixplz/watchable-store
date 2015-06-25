var Imm = require('immutable')

module.exports = Store

function Store(initial) {
    if(! (this instanceof Store))
        return new Store(initial)

    initStore(this)

    if(initial != null)
        this.setAll(initial)
}

function initStore (me) {
    var store = new Imm.Map()
    var versions = []
    var watchers = []

    var notifyList = []
    var inNotifyLoop = false

    me.get = function (key) {
        return store.getIn(parseKey(key))
    }

    me.set = function (key, val) {
        key = parseKey(key)

        var lastStore = store
        var newStore = store.setIn(key, val)

        if(Imm.is(newStore, lastStore))
            return

        versions.push(lastStore)
        store = newStore

        watchers.forEach(function(watcher) {
            var watchKey = getWatcherKey(watcher.key)
            if(pathIsPrefix(watchKey, key) || pathIsPrefix(key, watchKey))
                notifyList.push(watcher)
        })

        if(inNotifyLoop)
            return

        inNotifyLoop = true

        while(notifyList.length > 0) {
            var watcher = notifyList.shift()
            var watchKey = getWatcherKey(watcher.key)
            if(! Imm.is(lastStore.getIn(watchKey), newStore.getIn(watchKey)))
                watcher.func(newStore.getIn(watchKey))
        }

        inNotifyLoop = false
    }

    me.getAll = function () {
        return store
    }

    me.setAll = function (val) {
        me.set([], val)
    }

    me.history = function(key) {
        key = key != null ? parseKey(key) : []

        var arr = []
        var last
        versions.forEach(function(ver) {
            var val = ver.getIn(key)
            if(! Imm.is(val, last))
                arr.push(val)
            last = val
        })

        return arr
    }

    me.watch = function(key, func) {
        watchers.push({ key: key, func: func })
    }

    me.unwatch = function(key, func) {
        var index
        watchers.some(function(watcher, ix) {
            if(getWatcherKey(watcher.key).join('.') == key && watcher.func == func) {
                index = ix
                return true
            }
        })

        if(index) watchers.splice(index, 1)
    }
}


function parseKey(key) {
    if(typeof key == 'string') {
        if(key == '') return []
        return key.split(/\s*\.\s*/g).map(function(frag) {
            if(! /^\w+$/.test(frag)) throw new Error('invalid path' + key)
            return frag
        })
    }
    else if(Array.isArray(key)) {
        return key
    }
    else {
        throw new Error('invalid key ' + key)
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
