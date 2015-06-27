module.exports = Store

function Store(initial) {
    if(! (this instanceof Store))
        return new Store(initial)

    initStore(this, initial)
}

function initStore (me, initial) {
    if(initial == null) initial = {}

    var store = initial || []

    var watchers = []

    var notifyList = []
    var inNotifyLoop = false

    me.get = function (key) {
        if(arguments.length == 0) key = []

        return getPath(store, getKey(key))
    }

    me.set = function (key, val) {
        if(arguments.length == 1) {
            val = arguments[0]
            key = []
        }

        key = getKey(key)

        var lastStore = store
        var newStore = setPath(store, key, val)

        store = newStore

        if(newStore == lastStore)
            return

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
            if(getPathSoft(lastStore, watchKey) != getPathSoft(newStore, watchKey))
                watcher.func(getPathSoft(newStore, watchKey))
        }

        inNotifyLoop = false
    }

    me.update = function (key, modify) {
        if(arguments.length == 1) {
            modify = arguments[0]
            key = []
        }

        me.set(key, modify(me.get(key)))
    }

    me.watch = function(key, func) {
        watchers.push({ key: key, func: func })
    }

    me.unwatch = function(key, func) {
        var index
        watchers.some(function(watcher, ix) {
            if(getWatcherKey(watcher.key).join('.') == getKey(key).join('.')
            && watcher.func == func) {
                index = ix
                return true
            }
        })

        if(index != null) watchers.splice(index, 1)
    }
}


function getPath (obj, path, soft) {
    var cur = obj

    var ix = 0
    while(ix < path.length) {
        cur = cur[path[ix++]]

        if(cur == null) {
            if(soft)
                return null
            else
                throw new Error('path not found ' + JSON.stringify(path) + ' in ' + obj)
        }
    }

    return cur
}

function getPathSoft (obj, path) {
    return getPath(obj, path, true)
}

function setPath (source, path, innerVal) {
    if(path.length == 0)
        return innerVal

    var key = path[0]
    var subval = source != null ? source[key] : null
    var newval = setPath(subval, path.slice(1), innerVal)

    if(source == null) {
        var target = {}
        target[key] = newval
        return target
    }
    else {
        if(subval == newval)
            return source

        if(Array.isArray(source))
            var target = source.slice()
        else {
            var target = {}
            Object.keys(source).forEach(function (key) {
                target[key] = source[key] })
        }

        target[key] = newval
        return target
    }
}

function getKey(key) {
    if(Array.isArray(key))
        return key

    if(typeof key == 'string') {
        return key.split(/\s*\.\s*/g).map(function(frag) {
            if(! /^\w+$/.test(frag)) throw new Error('invalid path' + key)
            return frag
        })
    }

    if(key != null)
        return [key]

    throw new Error('invalid key ' + key)
}

function getWatcherKey (key) {
    return getKey(typeof key == 'function' ? key() : key)
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
