var test = require('tape')
test.Test.prototype.equalVal = function(a, b, message) {
    this.assert(
        Imm.is(Imm.fromJS(a), Imm.fromJS(b)),
        message || "should be value equal")
}


var Imm = require('immutable')
var Store = require('./')

test('get set', function(t) {
    var store = new Store()

    t.equalVal(store.history(), [])
    t.equalVal(store.getAll(), {})

    store.set('abc', 123)
    store.set('def', Imm.Map({ prop: 'beepboop' }))

    t.equalVal(store.get('abc'), 123)
    t.equalVal(store.get('def'), { prop: 'beepboop' })
    t.equalVal(store.getAll(), { abc: 123, def: { prop: 'beepboop' } })

    t.equalVal(store.history(), [{}, { abc: 123 }])

    store.set('def', Imm.Map({ prop: 'beepboop' }))

    t.equalVal(store.history(), [{}, { abc: 123 }])

    store.set('def', { prop: 'beep', prop2: 'boop' })
    store.set('def', { prop: 'boop', prop2: 'beep' })

    t.equalVal(store.get('def'), { prop: 'boop', prop2: 'beep' })

    t.equalVal(store.history('def'),
        [ { prop: "beepboop" },
          { prop: "beep", prop2: "boop" } ])

    t.end()
})

test('handles', function(t) {
    var store = new Store()

    var events1 = []
    var events2 = []
    var events3 = []

    store.watch('',    function(val) { events1.push(val) })
    store.watch('def', function(val) { events2.push(val) })
    store.watch('abc', function(val) { events3.push(val) })

    store.set('def', 123)
    store.set('abc', 456)

    t.equalVal(events1, [{def: 123}, {def:123, abc:456}])
    t.equalVal(events2, [123])
    t.equalVal(events3, [456])

    t.end()
})
