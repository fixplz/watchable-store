var test = require('tape')
var inspect = require('util').inspect

test.Test.prototype.equalVal = function(a, b, message) {
    a = Imm.fromJS(a); if(a.toJS) a = a.toJS()
    b = Imm.fromJS(b); if(b.toJS) b = b.toJS()
    this.deepEqual(a, b, message)
}


var Imm = require('immutable')
var Store = require('./')

test('get set', function(t) {
    var store = new Store()

    t.equalVal(store.history(), [], 'history is empty')
    t.equalVal(store.getAll(), {}, 'store is empty')

    store.set('abc', 123)
    store.set('def', Imm.Map({ a: 'beepboop' }))

    t.equalVal(store.get('abc'), 123, 'get')
    t.equalVal(store.get('def'), { a: 'beepboop' }, 'get map')
    t.equalVal(store.getAll(), { abc: 123, def: { a: 'beepboop' } }, 'getAll')

    t.equalVal(store.history(), [{}, { abc: 123 }], 'history')

    store.set('def', Imm.Map({ a: 'beep', b: 'boop' }))

    t.equalVal(store.get('def'), { a: 'beep', b: 'boop' }, 'get 2')

    store.set('def.a', 'boop')
    store.set('def.b', 'beep')

    t.equalVal(store.get('def'), { a: 'boop', b: 'beep' }, 'get 3')

    t.equalVal(store.history('def'),
        [ { a: 'beepboop' }, { a: 'beep', b: 'boop' }, { a: 'boop', b: 'boop' } ],
        'history 2')

    store.set('def.c.d', Imm.Map({ e: 'zap' }))

    t.equalVal(store.get('def.c.d.e'), 'zap', 'get 4')

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

    t.equalVal(events1, [{abc: 123}, {abc:123, def:456}], 'watcher 1')
    t.equalVal(events2, [123], 'watcher 2')
    t.equalVal(events3, [456], 'watcher 3')

    t.end()
})
