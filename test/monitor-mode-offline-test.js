#!/usr/bin/env node

/* 
 * Deuces, monitor mode events test.
 */

var debug = !! true
    , emptyFn = function () {}
    , log = console.log
    , dbg = debug ? console.log : emptyFn
    , assert = require( 'assert' )
    , test_utils = require( './deps/test-utils' )
    , inspect = test_utils.inspect
    , format = test_utils.format
    , Deuces = require( '../' )
    , client = Deuces()
    // expected events
    , evts = []
    // collected events
    , eresult = []
    ;

log( '- created new Deuces client with default options.' );

log( '- enable CLI logging.' );

client.cli( true, function ( ename, args ) {
    eresult.push( ename );
    dbg( '  !%s %s', ename, format( ename, args || [] ) );
} );

log( '- execute/enqueue MONITOR command in offline mode.' );

client.commands.monitor( function ( is_err, reply, fn ) {
    log( '- MONITOR callback should execute and get OK.' );
    assert.ok( fn( reply )[ 0 ] === 'OK' );
} );

log( '- now connecting client.' );

client.connect( null, function () {

    log( '- try to execute a ping command in monitor mode.' );

    client.commands.ping( function ( is_err, reply, fn ) {
        log( '- PING callback should get an error.' );
        assert.ok( is_err );
    } );

} );

log( '- now waiting 1 sec to collect events..' );

setTimeout( function () {

    log( '- now disconnecting client with QUIT.' );
    client.commands.quit( function () {
        log( '- OK, client was disconnected.' );
    } );

    setTimeout( function () {
        log( '- check collected events for client disconnection.' );
        assert.ok( ~eresult.indexOf( 'offline' ) );
        assert.ok( ~eresult.indexOf( 'lost' ) );
    }, 1000 );

}, 1000 );