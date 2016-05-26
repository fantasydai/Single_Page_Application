/*
* spa.util_b.js
* Javascript browser utilities
*/

spa.util_b = ( function () {
    'use strict';
    //初始化变量
    var configMap ={
        regex_encode_html : /[&"'<>]/g,
        regex_encode_nomap : /["'<>]/g,
        html_encode_map : {
            '&' : '&#38;',
            '"' : '&#34;',
            "'" : '&#39;',
            '>' : '&#62;',
            '<' : '&#60;'
        }
    },
    decodeHtml,
    encodeHtml,
    getEmSize;

//创建修改后的配置的副本，用于实体编码
    configMap.encode_nomap_map = $.extend(
        {},configMap.html_encode_map
    );
    delete configMap.regex_encode_nomap['&'];

    //------------------Begin Utility Methods---------------------

    //decodeHtml方法，把浏览器实体转换成显示字符
    decodeHtml = function (str) {
        return $('<div />').html(str || '').text();
    };

    //encodeHtml方法 把特殊字符转换成HTML编码值
    encodeHtml = function (input_arg_str,exclude_map) {
        var input_str = String (input_arg_str),
        regex, lookup_map;

        if (exclude_map) {
            lookup_map = configMap.encode_nomap_map;
            regex = configMap.regex_encode_map;
        } else {
            lookup_map = configMap.html_encode_map;
            regex = configMap.regex_encode_html;
        }
        return input_str.replace (regex,function (match,name) {return lookup_map[match] || '';});
    };

    //getEmSize方法
    getEmSize = function (elem) {
        return Number(
            getComputedStyle(elem,'').fontSize.match(/\d*\.?\d*/)[0]
        );
    };
    //------------------End Utility Methods-----------------------

    //------------------Begin Public Methods---------------------
    return {
        decodeHtml : decodeHtml,
        encodeHtml : encodeHtml,
        getEmSize :getEmSize
    };
    //------------------End Public Methods-----------------------
})();