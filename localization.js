"use strict";

const cl = global.botanLoader;
const Dragonfly = global.Dragonfly;

const ProxyLocale = function( name, _locale, _parent )
{
	var _thisProxy = new Proxy( _locale, {

		get: ( target, prop ) => {

			switch( prop )
			{
				case Symbol.toPrimitive:
					return () => _locale( global.lang || "en-US" );

				case "inspect":
					return _parent
						? () => `LocaleString[ ${_parent}.${name} ]`
						: () => `LocaleString[ ${name} ]`
						;
			}

			if( target[ prop ] == undefined )
			{
				target[ prop ] = ProxyLocale(
					prop
					, function( lang, stack )
					{
						if( !stack )
						{
							stack = stack || [ prop, "" ];
						}
						else
						{
							stack[1] = stack[1] + "." + prop;
						}

						return _locale( lang, stack );
					}
					, _thisProxy );
			}

			return Reflect.get( target, prop );
		}

	} );

	return _thisProxy;
};

const rLocale = function( lang, stack )
{
	var Zone =  "LocaleSX." + lang + stack[1];

	try
	{
		var zoneFile = cl.load( Zone );

		var translated = zoneFile[ stack[0] ];
		if( translated == undefined )
		{
			throw new Error( `Translation does not exists: ${Zone}[ ${stack[0]} ]` );
		}

		return translated;
	}
	catch( e )
	{
		Dragonfly.Warning( e );
	}

	return Zone + "." + stack[0];
};

module.exports = ProxyLocale( "", rLocale );
