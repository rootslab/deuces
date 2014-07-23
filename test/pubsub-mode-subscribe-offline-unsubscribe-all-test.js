#!/usr/bin/env node

/* 
 * Dueces, pubsub mode events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? console.log : emptyFn
    , assert = require( 'assert' )
    , test_utils = require( './deps/test-utils' )
    , inspect = test_utils.inspect
    , format = test_utils.format
    , Dueces = require( '../' )
    , client = Dueces()
    // expected events
    , evts = []
    // collected events
    , eresult = []
    // channels
    , channels = [ 'a', 'a', 'b', 'b', 'c', 'c' ]
    , sub_cback_OK = 0
    , unsub_cback_OK = 0
    ;

log( '- created new Dueces client with default options.' );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- execute/enqueue SUBSCRIBE command in offline mode.' );

log( '- now connecting client.' );

// push expected events
evts.push( 'queued', 'connect', 'scanqueue', 'ready' );


client.commands.subscribe( channels, function () {
        log( '- I\'m SUBSCRIBE callback.' );
        sub_cback_OK = 1;
    }  );

client.connect( null, function () {
    log( '- check collected events, should be:', inspect( evts ) );
     assert.deepEqual( eresult, evts );

    log( '- try to execute a TIME command in pubsub mode.' );

    evts.push( 'error' );

    client.commands.time( function ( is_err, reply, fn ) {
        log( '- TIME callback should get an error.' );
        assert.ok( is_err );
    } );

    log( '- call #unsubscribe without arguments' );

    client.commands.unsubscribe( null, function () {
        log( '- I\'m UNSUBSCRIBE callback.' );
        unsub_cback_OK = 1;
    } );

} );

log( '- now waiting 3 secs to collect events..' );

setTimeout( function () {
    var i = 0
        ;
    client.commands.ping( function ( is_err, reply, fn ) {
        log( '- PING callback should get PONG reply, got:', fn( reply )[ 0 ] );
        assert.equal( fn( reply )[ 0 ], 'PONG' );
    } );
    // push expected message events ( + 3 unsubscribe replies )
    evts.push( 'listen' );
    for ( ; i < channels.length + 3; ++i ) evts.push( 'message' );
    evts.push( 'shutup' );
    log( '- check collected events, should be:', inspect( evts ) );
    assert.deepEqual( eresult.slice( 0, evts.length ), evts, 'got: ' + inspect( eresult ) );

    log( '- now disconnecting client with QUIT.' );

    client.commands.quit( function ( is_err, reply, fn ) {
        log( '- QUIT callback.', fn( reply ) );
        assert.ok( fn( reply )[ 0 ] === 'OK' );
    } );

   log( '- check execution of SUBSCRIBE and UNSUBSCRIBE callbacks:', inspect( [ sub_cback_OK, unsub_cback_OK ] ) );
    assert.deepEqual( [ sub_cback_OK, unsub_cback_OK ], [ 1, 1 ] );

}, 3000 );