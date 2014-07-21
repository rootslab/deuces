#!/usr/bin/env node

/* 
 * Dueces, socket connection events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? console.log : emptyFn
    , assert = require( 'assert' )
    , Bolgia = require( 'bolgia' )
    , clone = Bolgia.clone
    , test_utils = require( './deps/test-utils' )
    , inspect = test_utils.inspect
    , format = test_utils.format
    , Dueces = require( '../' )
    , client = Dueces()
    // expected events
    , evts = []
    // collected events
    , eresult = []
    ;

log( '- created new Dueces client with default options:', inspect( client.options ) );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- opening client connection.' );

client.connect( null, function () {
    log( '- now client is connected and ready to send.' );
    // push expected events
    evts.push( 'connect', 'scanqueue', 'ready' );
} );

log( '- wait 1 second to collect events..' );

setTimeout( function () {
    log( '- check collected events from client, should be: %s.', inspect( evts ) );
    assert.deepEqual( eresult, evts, 'something goes wrong with client connection! got: "' + eresult + '"' );

    log( '- now disconnecting client.' );
    client.disconnect( function () {
        log( '- client disconnected.' );
 
        // push expected events
        evts.push( 'offline', 'lost' );

        log( '- check collected events from client, should be: %s.', inspect( evts ) );
        assert.deepEqual( eresult, evts, 'something goes wrong with client disconnection! got: ' + inspect( eresult ) );
    } );

}, 1000 );
