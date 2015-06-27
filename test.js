var test = require('tape')

var Store = require('./')

test('get set', function(t) {
    var store = new Store()

    t.deepEqual(store.get(), {}, 'store is empty')

    store.set('abc', 123)
    store.set('def', { a: 'beepboop' })

    t.deepEqual(store.get('abc'), 123, 'get set')
    t.deepEqual(store.get('def'), { a: 'beepboop' }, 'get set')
    t.deepEqual(store.get(), { abc: 123, def: { a: 'beepboop' } }, 'get set')

    store.set('def', { a: 'beep', b: 'boop' })

    t.deepEqual(store.get('def'), { a: 'beep', b: 'boop' }, 'get set')

    store.set('def.a', 'boop')
    store.set('def.b', 'beep')

    t.deepEqual(store.get('def'), { a: 'boop', b: 'beep' }, 'get set')

    store.set('def.c.d', { e: 'zap' })

    t.deepEqual(store.get('def.c.d.e'), 'zap', 'get set')

    store.update('def.c.d', function (it) {
        return { e: 'zip ' + it.e }
    })

    t.deepEqual(store.get('def.c.d.e'), 'zip zap', 'get set')

    store.set({})

    t.deepEqual(store.get(), {}, 'store is emptied')

    t.end()
})

test('handles', function(t) {
    var store = new Store()

    var events1 = []
    var events2 = []
    var events3 = []

    store.watch('x',    function(val) { events1.push(val) })
    store.watch('x.abc', function(val) { events2.push(val) })
    store.watch('x.def', function(val) { events3.push(val) })

    store.set('x.abc', 123)
    store.set('x.def', 456)

    t.deepEqual(events1, [{abc: 123}, {abc:123, def:456}], 'watcher 1')
    t.deepEqual(events2, [123], 'watcher 2')
    t.deepEqual(events3, [456], 'watcher 3')

    t.end()
})
