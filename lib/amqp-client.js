/**
 *
 * @author peshkov@UD
 */

var debug = require( 'debug' )('gce-amqp-cluster-client'),
    async = require('async'),
    _ = require('lodash');


Object.defineProperties( module.exports, {
  create: {
    value: function create( options ) {
      return new amqpClient( options );
    },
    enumerable: true,
    writable: true
  },
  version: {
    value: 0.1,
    writable: false
  }
});


/**
 *
 */
function amqpClient( options ) {

  var self = this;
  var amqp = require('amqplib/callback_api');

  options = _.defaults( options, {
    amqpUser: "",
    amqpPassword: "",
    amqpHost: null
    // Other options belong to GCE discovery
    // See: require('docker-gce-discovery').create();
  });

  //self._interval;
  self._discovery;

  //
  self.connect = function ( callback ) {
    var conn = null;

    debug( require('util').inspect( self._discovery.machines, {showHidden: false, depth: 10, colors: true}) );

    async.eachLimit( ( self._discovery.machines || [] ), 1, function( machine, done ) {

      if( conn ) {
        done();
        return;
      }

      var amqp_address = 'amqp://' + ( process.env.AMQP_USER || options.amqpUser ) + ':' + ( process.env.AMQP_PASSWORD || options.amqpPassword ) + '@' + machine.host;

      // Try to determine virtual host
      var vhost = process.env.AMQP_VHOST || options.amqpHost;
      if( !vhost ) {
        vhost = process.env.GIT_BRANCH || false;
      }
      if( vhost ) {
        amqp_address += '/' + vhost;
      }

      debug( 'Trying to connect to the following RabbitMQ Node:', amqp_address );

      amqp.connect( amqp_address, {
        timeout: 3000
      }, function( err, c ) {
        if( !err ) {
          conn = c;
          //console.log( require( 'util' ).inspect(  conn , { showHidden: false, depth: 10, colors: true } ) );
          debug( 'Connected to RabbitMQ Node on the following host: ', c.connection.stream._host );
        }
        done();
      });

    }, function(){

      if( conn ) {

        conn.on( 'error', function( error ){
          console.error( 'RabbitMQ Connection ERROR', error );
        } );

        conn.on( 'close', function( msg ){
          //if( self._interval ) {
          //  clearInterval( self._interval );
          //}
          debug( 'RabbitMQ Connection CLOSE', msg );
        } );

        setTimeout( function() {
          callback( null, conn );
        }, 100 );

      } else {
        callback( new Error( 'All RabbitMQ Cluster Nodes are down or refused connection.' ) );
      }

    });

  }

  //
  function discovery() {
    self._discovery = require('docker-gce-discovery').create( options || {} );
  }

  // We always do GCE discovery on AMQP init
  discovery();

  // Watch for available ES machines every 10 min
  //self._interval = setInterval( function() {
  //  discovery();
  //}, 600000 );

}