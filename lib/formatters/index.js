module.exports = ( function () {
    var isArray = Array.isArray
        ;
    return {
        // for monitor events / messages
        monitor : function ( mmsg ) {
            if ( typeof( mmsg ) !== 'string' ) return;
            var mlen = mmsg.length
                , s = 0
                , t = 0
                // unix time in millis
                , utime = 0
                , secs = 0
                , msecs = 0
                , address = [ null, 0 ]
                , db = 0
                , command = ''
                , stime = null
                , saddress = null
                ;
            if ( ! mlen ) return;
            s = mmsg.indexOf( '[' );
            stime = mmsg.slice( 0, s - 1 );
            t = stime.length - 3;
            utime = + stime.slice( 0, t ) * 1000;
            t = mmsg.indexOf( '.' );
            secs = + stime.slice( 0, t );
            msecs = + stime.slice( t + 1, s - 1 );
            t = mmsg.indexOf( ']' );
            command = mmsg.slice( t + 2 );
            saddress = mmsg.slice( s + 1, t );
            t = saddress.indexOf( ' ' );
            db = + saddress.slice( 0, t );
            address = saddress.slice( t + 1 ).split( ':' );
            return {
                ip : address[ 0 ]
                , port : + address[ 1 ]
                , db : db
                , cmd : command
                , utime : utime
                , time : [ secs, msecs ]
            };
        }
        // for pubsub events / messages
        , message : function ( msg ) {
            if ( ! isArray( msg ) ) return;
            if ( msg.length < 3 ) return;
            var mtype = msg[ 0 ];
            return ( mtype === 'message' ) ? {
                type : mtype
                , chan : msg[ 1 ]
                , msg : msg[ 2 ]
            } : ( mtype === 'pmessage' ) ? {
                type : mtype
                , pattern : msg[ 1 ]
                , chan : msg[ 2 ]
                , msg : msg[ 3 ]
            } : {
                type : mtype
                , chan : msg[ 1 ]
                , subs : msg[ 2 ]
            }
            ;
        }
    };
} )();