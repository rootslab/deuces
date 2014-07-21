#!/usr/bin/env node

/* 
 * Dueces, pubsub mode events test.
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

log( '- created new Dueces client with custom options:', inspect( client.options ) );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- opening client connection.' );

client.connect( null, function () {

    log( '- now client is connected and ready to send.' );
    // push expected events
    evts.push( 'connect', 'scanqueue', 'ready', 'listen' );

    client.commands.subscribe( 'channel', function () {
        // push expected event
        evts.push( 'message' );
        client.commands.psubscribe( 'chan*', function () {
            // push expected event
            evts.push( 'message' );
            client.commands.unsubscribe( null, function () {
                // push expected event
                evts.push( 'message' );
                client.commands.punsubscribe( null, function () {
                    // push expected event
                    evts.push( 'message', 'shutup' );
                } );
            } );
        } );
    } );

} );


log( '- now waiting 2 secs to collect events..' );

setTimeout( function () {

    var i = 0
        ;

    log( '- now disconnecting client with QUIT.' );

    // push expected connection event
    evts.push( 'reply', 'offline', 'lost' );

    client.commands.quit( function ( is_err, reply, fn ) {
        log( '- QUIT callback.', fn( reply ) );
        assert.ok( fn( reply )[ 0 ] === 'OK' );
        log( '- OK, client was disconnected.' );
    } );

    setTimeout( function () {
        log( '- check collected events for client, should be:', inspect( evts ) );
        assert.deepEqual( eresult, evts, 'got: ' + inspect( eresult ) );
    }, 1000 );

}, 2000 );