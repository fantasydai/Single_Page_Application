/*
* spa.chat.js
* Chat feature module for SPA
*/
spa.chat=(function (){
    'use strict';
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
                    +'<div class="spa-chat-list">'
                        +'<div class="spa-chat-list-box"></div>'
                    +'</div>'
                    +'<div class="spa-chat-msg">'
                        +'<div class="spa-chat-msg-log"></div>'
                        +'<div class="spa-chat-msg-in">'
                            +'<form class="spa-chat-msg-form">'
                                +'<input type="text" />'
                                +'<input type="submit" style="display:none" />'
                                +'<div class="spa-chat-msg-send">'
                                    +'send'
                                +'</div>'
                            +'</form>'
                        +'</div>'
                    +'</div>'
                +'</div>'
            +'</div>',
            //chat设置参数
            settable_map : {
                slider_open_time : true,
                slider_close_time : true,
                slider_opened_em : 2,
                slider_closed_em : true,
                slider_opened_title : 'Tap to close',
                slider_closed_title : 'Tap tp open',

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
    setPxSize,
    scrollChat,
    writeChat,
    writeAlert,
    clearChat,
    setSliderPosition,
    onTapToggle, onSubmitMsg , onTapList,
    onSetchatee , onUpdatechat , onListchange,
    onLogin, onLogout,
    onClickToggle,
    configModule,
    initModule,
    removeSlider,
    handleResize;
    //--------------End Module Scope Variables------------------

    //--------------Begin Utility Methods--------------------------
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
            $list_box : $slider.find('.spa-chat-list-box'),
            $msg_log : $slider.find('.spa-chat-msg-log'),
            $msg_in   :  $slider.find('.spa-chat-msg-in'),
            $input : $slider.find('.spa-chat-msg-in input[type=text]'),
            $send : $slider.find('.spa-chat-msg-send'),
            $form : $slider.find('.spa-chat-msg-form'),
            $window : $(window)
        };
    };
    //setPxSize函数 计算由该模块管理的元素的像素尺寸
    setPxSize = function () {
        var px_per_em, opened_height_em,window_height_em;
        px_per_em = spa.util_b.getEmSize(jqueryMap.$slider.get(0));
        window_height_em=Math.floor(//计算窗口高度
            (jqueryMap.$window.height() / px_per_em)+0.5
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

        //如果用户是匿名的，则组织打开滑块
        if(position_type === 'opened' && configMap.people_model.get_user().get_is_anon()){
            return false;
        }

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
                jqueryMap.$input.focus();
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

    //--------------Begin private Dom Methods-----------------------------

    //创建scroll-Chat方法，消息记录文字以平滑滚动的方式显示
    scrollChat = function () {
        var $msg_log = jqueryMap.$msg_log;
        $msg_log.animate(
            {scrollTop: $msg_log.prop('scrollHeight') - $msg_log.height()},150
        );
    };

    //创建writeChat方法，用于添加消息记录，发送者不同使用不同样式
    writeChat = function (person_name,text,is_user) {
        var msg_class = is_user ? 'spa-chat-msg-log-me' : 'spa-chat-msg-log-msg';

        jqueryMap.$msg_log.append(
            '<div class="'+msg_class+'">'
            +spa.util_b.encodeHtml(person_name)+ ':'
            +spa.util_b.encodeHtml(text)+'</div>'
        );
        scrollChat();
    };

    //创建writeAlert方法，用于在消息记录中添加系统警告
    writeAlert = function (alert_text) {
        jqueryMap.$msg_log.append(
            '<div class="spa-chat-msg-log-alert">'
            +spa.util_b.encodeHtml(alert_text)
            +'</div>'
        );
        scrollChat();
    };

    //创建clearChat方法，用于清除消息记录
    clearChat = function () {
        jqueryMap.$msg_log.empty();
    };
    //--------------End private Dom Methods-------------------------------

    //--------------Begin Event Methods----------------------------

    //onClickToggle事件处理程序，调用方法更改URI锚
    onTapToggle = function (event) {
        var set_chat_anchor = configMap.set_chat_anchor;
        if (stateMap.position_type === 'opened') {
            set_chat_anchor('closed');
        }
        else if (stateMap.position_type === 'closed') {
            set_chat_anchor ('opened');
        }
        return false;
    };

    //创建onSubmitMsg事件处理程序，当用户提交消息时，会产生这个事件
    onSubmitMsg = function (event) {
        var msg_text = jqueryMap.$input.val();
        if( msg_text.trim() === ''){
            return false;
        }
        configMap.chat_model.send_msg(msg_text);
        jqueryMap.$input.focus();
        jqueryMap.$send.addClass('spa-x-select');
        setTimeout(function () {
            jqueryMap.$send.removeClass('spa-x-select');
        },250);
        return false;
    };

    //创建onTapList处理程序，当用户点击或者轻击用户名时，会产生这个事件
    onTapList = function (event) {
        var $tapped = $(event.elem_target),chatee_id;
        if (! $tapped.hasClass('spa-chat-list-name')){return false;}

        chatee_id = $tapped.attr('data-id');
        return false;
    };

    //为Mode发布的spa-serchatee事件创建onSetchatee事件处理程序
    onSetchatee = function (event,arg_map) {
        var new_chatee = arg_map.new_chatee,
            old_chatee = arg_map.old_chatee;

            jqueryMap.$input.focus();
            if(!new_chatee) {
                if(old_chatee){
                    writeAlert(old_chatee.name+'has left the chat');
                } else {
                    writeAlert ('Your friend has left the chat');
                }
                jqueryMap.$title.text('Chat');
                return false;
            }
            jqueryMap.$list_box
                .find('.spa-chat-list-name')
                .removeClass('spa-x-select')
                .end()
                .find('[data-id='+arg_map.new_chatee.id+']')
                .addClass('spa-x-select');

            writeAlert('Now chatting with '+arg_map.new_chatee.name);
            jqueryMap.$title.text('Chat iwth' +arg_map.new_chatee.name);
            return true;
    };

    //为Model发布的spa-listchange事件创建onListchange事件处理程序
    //该处理程序会获取当前人员集合，并渲染人员列表，听者高亮
    onListchange = function (event) {
        var list_html = String(),
              people_db = configMap.people_model.get_db(),
              chatee = configMap.chat_model.get_chatee();

        people_db().each(function (person,idx) {
            var select_class = '';

            if (person.get_is_anon() || person.get_is_user ()){
                return true;
            }
            if(chatee && chatee.id === person.id) {
                select_class = 'spa-x-select';
            }
            list_html+='<div class="spa-chat-list-name'
            +select_class+'" data-id="'+person.id+'">'
            +spa.util_b.encodeHtml(person.name)+'</div>';
        });
        if(!list_html) {
            list_html = String()
            +'<div class="spa-chat-list-note">'
            +'To chat alone is the fate of all great souls...<br><br>'
            +'No noe is online'
            +'</div>';
        clearChat();
        }
        jqueryMap.$list_box.html(list_html);
    };

    //为Molde发布的spa-updatechat事件创建onUpdatechat事件处理程序
    //该事件处理程序会更新消息记录的显示，如果发送者是用户自己，则清楚输入框
    //并使之重新获取焦点
    onUpdatechat = function (event,msg_map) {
        var is_user, sender_id = msg_map.sender_id,
              msg_text = msg_map.msg_text,
              chatee = configMap.chat_model.get_chatee()||{},
              sender = configMap.people_model.get_by_cid(sender_id);

        if(! sender) {
            writeAlert(msg_text);
            return false;
        }

        is_user = sender.get_is_user();

        if(!(is_user || sender_id === chatee.id)) {
            configMap.chat_model.set_chatee(sender_id);
        }

        writeChat(sender.name,msg_text,is_user);

        if(is_user) {
            jqueryMap.$input.val('');
            jqueryMap.$input.focus();
        }
    };

    //为Model发布的spa-login事件创建事件处理程序
    onLogin = function (event,login_user) {
        configMap.set_chat_anchor('opened');
    };

    //为Model发布的spa-logout事件创建事件处理程序
    onLogin = function (event,logout_user) {
        configMap.set_chat_anchor('closed');
        jqueryMap.$title.text('Chat');
        clearChat();
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
        var $list_box;

        $append_target.append (configMap.main_html);
        stateMap.$append_target = $append_target;

        //向由调用者指定的容器中添加更新的滑块模板
        $append_target.append(configMap.main_html);
        setJqueryMap();
        setPxSize();

        // initialize chat slider to default title and state
        jqueryMap.$toggle.prop('title',configMap.slider_closed_title);
        jqueryMap.$head.click(onClickToggle);
        stateMap.position_type='closed';

        //订阅Model发布的所有事件
        $list_box = jqueryMap.$list_box;
        $.gevent.subscribe( $list_box, 'spa-listchange' ,onListchange);
        $.gevent.subscribe( $list_box, 'spa-setchatee' ,onSetchatee);
        $.gevent.subscribe( $list_box, 'spa-updatechat' ,onUpdatechat);
        $.gevent.subscribe( $list_box, 'spa-login' ,onLogin);
        $.gevent.subscribe( $list_box, 'spa-logout' ,onLogout);

        //绑定所有的用户输入事件
        jqueryMap.$head.bind('utap',onTapToggle);
        jqueryMap.$list_box.bind('utap',onTapList);
        jqueryMap.$send.bind('utap',onSubmitMsg);
        jqueryMap.$form.bind('utap',onSubmitMsg);
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