/**
 * Example.
 *
 */

var gceConfig = require( 'path-to-gcloud-connection-key/key.json' );

var gceAMQPCluster = require( 'gce-amqp-cluster-client').create( {
  gceConfig: gceConfig,
  zones: [ 'us-central1-a' ],
  project: 'project-name',
  machineTags: [ 'specific-tag' ],
  docker: false,
  watch: false,
  externalIP: true,
  amqpUser: "guest",
  amqpPassword: "guest"
} );

setTimeout( function() {

  gceAMQPCluster.connect( function( err, connection ) {
    if( err ) {
      console.error( err );
    } else {
      console.log( "Connected to [%s]", connection.stream._host );
    }
  } );

}, 10000 );