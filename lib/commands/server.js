/*
 * SERVER mix-ins.
 */

exports.commands = function ( encode, error ) {
    var Abaco = require( 'abaco' )
        , parseIntArray = Abaco.parseIntArray
        ;

    return {

        monitor : function ( cback ) {
            var result = encode( 'MONITOR', null, cback )
                ;
            // set special command shortcut
            result.isMonitor = 1;
            return result;
        }

        , time : function ( cback ) {
            return encode( 'TIME', parseIntArray, cback );
        }

    };

};