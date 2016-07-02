# botansx-modular
The Botanical Simply eXtended modular package

## Localization.js
Translation is made easy by the Localization module
```javascript
global.lang = "en-US"; // This is the default language

// Folder structure
//   MyApp/locale
//   MyApp/locale/en-US
//   MyApp/locale/en-US/Error.js
//   MyApp/locale/zh-TW/Error.js
//   .
//   .
//   .
AppNS.define( "LocaleSX", "./MyApp/locale" );

var Locale = cl.load( "botansx.modular.localization" );
console.log( Locale.Error.ERROR1 ); // LocaleString[ Locale.Error.ERROR1 ]
console.log( Locale.Error.ERROR1 + "" ); // Error Message 1
console.log( Locale.Error.ERROR1( "zh-TW" ) ); // 錯誤訊息 1
```

`MyApp/locale/en-US/Error.js`
```javascript
module.exports = {
    "ERROR1": "Error Message 1"
};
```

`MyApp/locale/zh-TW/Error.js`
```javascript
module.exports = {
    "ERROR1": " 錯誤訊息 1"
};
```
