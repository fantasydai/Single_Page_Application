/*
* spa.js
* Root namespace module
*/
/*jslint   brower:true,  continue:true,
  devel:true,  indent:2,  maxerr:50,
  regexp:true,  sloppy:true, vars:false,
  white:true
*/
/*global $,spa*/

var spa=(function(){
	var initModule=function ($container) {
                         spa.model.initModule();
		spa.shell.initModule($container);
	};
	return {initModule:initModule};
}());