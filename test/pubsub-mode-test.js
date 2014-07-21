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
    ;

log( '- created new Dueces client with default options.' );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- execute/enqueue SUBSCRIBE command in offline mode.' );

log( '- now connecting client.' );

evts.push( 'connect', 'scanqueue', 'ready' );

client.connect( null, function () {

    log( '- check collected events, should be:', inspect( evts ) );
    assert.deepEqual( eresult, evts, 'got: ' + inspect( eresult ) );

    client.commands.subscribe( channels, function ( ) {
        log( '- I\'m SUBSCRIBE callback.' );
        sub_cback_OK = 1;
    } );

    log( '- try to execute a ping command in pubsub mode.' );
    // push expected error event
    evts.push( 'error' );
    client.commands.ping( function ( is_err, reply, fn ) {
        log( '- PING callback should get an error.' );
        assert.ok( is_err );
    } );

} );

log( '- now waiting 2 secs to collect events..' );

setTimeout( function () {
    var i = 0
        ;
    // push expected message events
    evts.push( 'listen' );
    for ( ; i < channels.length; ++i ) evts.push( 'message' );
    // push expected message events
    evts.push( 'reply' );
    log( '- now disconnecting client with QUIT.' );
    client.commands.quit( function ( is_err, reply, fn ) {
        log( '- QUIT callback.', fn( reply ) );
        assert.ok( fn( reply )[ 0 ] === 'OK' );
        log( '- OK, client was disconnected.' );
    } );

    // push expected connection event
    evts.push( 'offline', 'lost' );

    setTimeout( function () {
        log( '- check collected events for client disconnection, should be:', inspect( evts ) );
        assert.deepEqual( eresult.slice( 0, evts.length ), evts, 'got: ' + inspect( eresult ) );
    }, 1000 );

    log( '- check execution of SUBSCRIBE callback:', inspect( [ sub_cback_OK ] ) );
    assert.deepEqual( [ sub_cback_OK ], [ 1 ] );

}, 2000 );