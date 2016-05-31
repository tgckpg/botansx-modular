"use stict";

const cl = global.botanLoader;

const events = require( "events" );
const util = require( "util" );

var Infrastructure = function()
{
	events.EventEmitter.call( this );
	var _self = this;

	var __readyList = [];
	this.readyList = new Proxy( __readyList, {

		get: ( target, prop ) => Reflect.get( target, prop )

		, set: ( target, prop, value ) => {

			// Have to emit the event at next tick
			// due to error thrown from the handlers
			// hangs the process
			process.nextTick( () => {
				if( __readyList.every( ( v ) => v === true ) )
				{
					_self.isReady = true;
					_self.emit( "apis_ready", _self )
				}
			} );

			return Reflect.set( target, prop, value );
		}

	} );

	this.APIs = {};
	this.isReady = true;
};

util.inherits( Infrastructure, events.EventEmitter );

Infrastructure.prototype.callAPI = function( name )
{
	var _self = this;

	var propName = name.split( "." );
	propName = name[ name.length - 1 ];

	if( this.APIs[ propName ] ) return this.APIs[ propName ];

	var path = name.replace( ".", "/" );

	var API = cl.load( name );

	if( !API.create )
	{
		throw new Error( "API does not have support calling" );
	}

	var aclass = API.create( Array.prototype.slice.call( arguments, 1 ) );

	this.APIs[ propName ] = aclass;

	if( aclass.ready !== undefined )
	{
		this.isReady = false;

		var rList =  this.readyList;
		rList.push( aclass.ready || aclass );

		aclass.once( "ready", ( e ) => rList[ rList.indexOf( e ) ] = true );
	}

	return aclass;
};

Infrastructure.prototype.Ready = function( callback )
{
	var _self = this;
	if( this.isReady ) callback();
	else this.once( "apis_ready", () => callback() );
};

module.exports = Infrastructure;
