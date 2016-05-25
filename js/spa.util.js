/*
* spa.util.js
* General JavaScript utilities
*/
spa.util = (function () {
    var makeError,
          setConfigMap;

    //makeError函数
    makeError = function (name_text,msg_text,data) {
        var error = new Error ();
        error.name = name_text;  //错误名称
        error.message = msg_text;  //错误消息

        if (data) {
            error.data = data;
        }
        return error;
    };

    //setConfigMap函数
    setConfigMap = function (arg_map) {
        var input_map     = arg_map.input_map,
              settable_map = arg_map.settable_map,
              config_map   = arg_map.config_map,
              key_name,
              error;

              for (key_name in input_map) {
                if ( input_map.hasOwnProperty(key_name)) {
                    if (settable_map.hasOwnProperty(key_name)) {
                        config_map[key_name] = input_map[key_name];
                    }
                    else {
                        error = makeError('Bad Input','Setting config key |'+key_name+'| is not supported');
                        throw (error);
                    }
                }
              }
    };

    return {
        makeError       : makeError,
        setConfigMap : setConfigMap
    };
})();