/*
 * CONNECTION tasks mix-ins.
 */

exports.tasks = function ( client ) {
    var log = console.log
        , abs = Math.abs
        , qq = client.qq
        // ping server, disconnect after a no-reply timeout
        , wait_ping_reply = false
        , pollingFn = function ( msg, timeout ) {
            var me = this
                , socket = me.socket
                , queue = me.queue
                , qstatus = queue.status
                , s = qstatus.subscription
                , m = qstatus.monitoring
                , tout = timeout && typeof timeout ==='number' ? abs( timeout ) : 2000
                , ok = false
                , encode = me.mixins.encode
                , cback = function ( is_err, data, fn ) {
                    ok = true;
                    wait_ping_reply = false;
                }
                ;
            // (re-)enable timestamp option in queue
            queue.options.timestamps = true;
            // check if it is possible to send pings
            if ( ! me.ready || wait_ping_reply ) return;
            // check last update
            if ( Date.now() - qstatus.last_access < qq.ttable[ 'polling' ].interval ) return;
            // block sending of other pings
            wait_ping_reply = true;
            // check if monitoring or subscription mode is active
            if ( s.active || m.active ) {
                // emit polling event
                me.emit( 'polling', s.active, m.active );
                /*
                 * Write a raw PING command to force a monitor or subscription message
                 * reply, in this way no PINGs will be added to command and rollback queue
                 * in subscription mode. 
                 */
                me.socket.write( msg ? encode( 'PING', msg ).ecmd : encode( 'PING', null, msg ).ecmd );
                // force disconnection and re-connection after timeout
                setTimeout( function () {
                    ok = Date.now() - qstatus.last_access < qq.ttable[ 'polling' ].interval;
                    if ( ! ok ) {
                        // cback was not executed, then stop this task and force disconnection
                        qq.stop( 'polling' );
                        // emit hangup event
                        me.emit( 'hangup', s.active, m.active );
                        // end connection
                        socket.end();
                    }
                    wait_ping_reply = false;
                }, tout );
                return;
            }
            // emit polling event
            me.emit( 'polling', 0, 0 );
            // check legacy ping
            if ( msg ) me.commands.ping( msg, cback );
            else me.commands.ping( cback );
            // force disconnection and re-connection after timeout
            setTimeout( function () {
                if ( ! ok ) {
                    // cback was not executed, then stop this task and force disconnection
                    qq.stop( 'polling' );
                     // emit hangup event
                    me.emit( 'hangup', 0, 0 );
                    // end connection
                    socket.end();
                }
                wait_ping_reply = false;
            }, tout );
        }
        ;
    // push polling custom events for logging to console
    client.cli_events.push( 'polling', 'hangup' );
    // add Cucu task
    qq.add( 'polling', pollingFn, [], client, 600 * 1000 );
};