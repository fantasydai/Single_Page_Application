/*
* spa.chat.js
* Chat feature module for SPA
*/
spa.chat=(function (){
    //----------------声明变量-------------------
    //----------------Begin Module Scope Variables----------------
    //把静态配置值放在configMap变量中
    var configMap= {
        main_html:String()
            +'<div class="spa-chat">'
                +'<div class="spa-chat-head">'
                    +'<div class="spa-chat-head-toggle">+</div>'
                    +'<div class="spa-chat-head-title">'
                        +'Chat'
                    +'</div>'
                +'</div>'
                +'<div class="spa-chat-closer">x</div>'
                +'<div class="spa-chat-sizer">'
                    +'<div class="spa-chat-msgs"></div>'
                    +'<div class="spa-chat-box">'
                        +'<input type="text" />'
                        +'<div>send</div>'
                    +'</div>'
                +'</div>'
            +'</div>',
            //chat设置参数
            settable_map : {
                slider_open_time : true,
                slider_close_time : true,
                slider_opened_em : true,
                slider_closed_em : true,
                slider_opened_title : true,
                slider_closed_title : true,

                chat_model : true,
                people_model : true,
                set_chat_anchor : true
            },
            slider_open_time : 250,
            slider_close_time : 250,
            slider_opened_em :18,
            slider_opened_min_em: 10,
            window_height_min_em: 20,
            slider_closed_em : 2,
            slider_opened_title : 'Click to close',
            slider_closed_title : 'Click to open',

            chat_model :null,
            people_model : null,
            set_chat_anchor : null
    },
    stateMap = {
        $append_target : null,
        position_type : 'closed',
        px_per_em : 0,
        slider_hidden_px : 0,
        slider_closed_px : 0,
        slider_opened_px :0
    },
    jqueryMap = {},
    setJqueryMap,
    getEmSize,
    setPxSizes,
    setSliderPosition,
    onClickToggle,
    configModule,
    initModule,
    removeSlider,
    handleResize;
    //--------------End Module Scope Variables------------------

    //--------------Begin Utility Methods--------------------------

    //添加getEmSize方法，把em转换为px
    getEmSize = function (elem) {
        return Number (
            getComputedStyle(elem,'').fontSize.match(/\d*\.?\d*/)[0]
        );
    };
    //--------------End Utility Methods----------------------------

    //--------------Begin Dom Methods---------------------------
    //setJqueryMap
    setJqueryMap = function () {
        var $append_target = stateMap.$append_target,
        $slider = $append_target.find('.spa-chat');

        jqueryMap = {
            $slider : $slider,
            $head : $slider.find('.spa-chat-head'),
            $toggle : $slider.find('.spa-chat-head-toggle'),
            $title : $slider.find('.spa-chat-head-title'),
            $sizer : $slider.find('.spa-chat-sizer'),
            $msgs : $slider.find('.spa-chat-msgs'),
            $box : $slider.find('.spa-chat-box'),
            $input : $slider.find('.spa-chat-input input[type=text]')
        };
    };
    //setPxSize函数 计算由该模块管理的元素的像素尺寸
    setPxSize = function () {
        var px_per_em, opened_height_em,window_height_em;
        px_per_em = getEmSize(jqueryMap.$slider.get(0));
        window_height_em=Math.floor(//计算窗口高度
            ($(window).height() / px_per_em)+0.5
        );

        opened_height_em =window_height_em > configMap.window_height_min_em?
         configMap.slider_opened_em : configMap.slider_opened_min_em;

        stateMap.px_per_em = px_per_em;
        stateMap.slider_closed_px = configMap.slider_closed_em*px_per_em;
        stateMap.slider_opened_px = opened_height_em*px_per_em;
        jqueryMap.$sizer.css({
            height : (opened_height_em-2)*px_per_em
        });
    };

    //setSliderPosition方法 - 切换不同状态下slider的位置
    setSliderPosition = function (position_type,callback) {
        var height_px,animate_time,slider_title,toggle_text;

        //如果slider已在目标位置则直接返回
        if (stateMap.position_type === position_type) {
            return true;
        }
        switch (position_type) {
            case 'opened' :
                height_px = stateMap.slider_opened_px;
                animate_time = configMap.slider_open_time;
                slider_title = configMap.slider_opened_title;
                toggle_text = '=';
                break;
            case 'hidden' :
                height_px = 0;
                animate_time = configMap.slider_close_time;
                slider_title = '';
                toggle_text = '+';
                break;
            case 'closed' :
                height_px = stateMap.slider_closed_px;
                animate_time = configMap.slider_close_time;
                slider_title = configMap.slider_closed_title;
                toggle_text = '+';
                break;
            default :
                return false;
        }
        stateMap.position_type ='';
        jqueryMap.$slider.animate ({
            height : height_px
        },animate_time,function () {
            jqueryMap.$toggle.prop('title',slider_title);
            jqueryMap.$toggle.text(toggle_text);
            stateMap.position_type = position_type;
            if (callback) {
                callback (jqueryMap.$slider);
            }
        });
        return true;
    };
    //--------------End Dom Methods-----------------------------

    //--------------Begin Event Methods----------------------------

    //onClickToggle事件处理程序，调用方法更改URI锚
    onClickToggle = function (event) {
        var set_chat_anchor = configMap.set_chat_anchor;
        if (stateMap.position_type === 'opened') {
            set_chat_anchor('closed');
        }
        else if (stateMap.position_type === 'closed') {
            set_chat_anchor ('opened');
        }
        return false;
    };
    //--------------End Event Methods------------------------------

    //--------------Begin Public Methods----------------------------
    /*
    * configModule
    * 创建configModule方法，当功能模块接收设置时，使用相同方法
    */
    configModule = function (input_map) {
        spa.util.setConfigMap ({
            input_map : input_map,
            settable_map : configMap.settable_map,
            config_map : configMap
        });
        return true;
    };

    /*
    * removeSlider方法
    * 用来重置chat模块
    */
    removeSlider = function () {
        if (jqueryMap.$slider) {
            jqueryMap.$slider.remove();
            jqueryMap = {};
        }

        stateMap.$append_target = null;
        stateMap.position_type = null;

        configMap.chat_model = null;
        configMap.people_model = null;
        configMap.set_chat_anchor = null;

        return true;
    };

    /*
    * handleResize 方法
    * 用来处理页面resize事件，自适应大小
    */
    handleResize = function () {
        //如果没有$slider容器
        if (!jqueryMap.$slider) {
            return false;
        }
        setPxSize();
        if(stateMap.position_type === 'opened') {
            jqueryMap.$slider.css(
                {height : stateMap.slider_opened_px }
            );
        }
        return true;
    };

    /*
    * initModule
    * 创建initModule方法，由它执行模块
    */
    initModule = function ($append_target) {
        $append_target.append (configMap.main_html);
        stateMap.$append_target = $append_target;
        setJqueryMap();
        setPxSize();

        // initialize chat slider to default title and state
        jqueryMap.$toggle.prop('title',configMap.slider_closed_title);
        jqueryMap.$head.click(onClickToggle);
        stateMap.position_type='closed';
        return true;
    };
    //--------------End Public Methods------------------------------

    //return public methods
    return {
        setSliderPosition : setSliderPosition,
        configModule :configModule,
        initModule :initModule,
        removeSlider : removeSlider,
        handleResize : handleResize
    };
})();