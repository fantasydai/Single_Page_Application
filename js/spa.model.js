/*
* dps.model.js
* Model module
*/
spa.model = (function () {
    'use strict';

    var configMap = {
        anon_id : 'a0'
    },
    stateMap = {
        anon_user : null,  //保存匿名person对象
        cid_serial : 0, //为已登入的用户创建客户端ID
        people_cid_map : {},  //保存person对象映射，键为客户端ID
        people_db : TAFFY(),  //保存person对象TaffyDB集合
        user : null, //保存当前用户对象
        is_connected : false
    },

    isFakeData = true, //告诉model是否使用Fake模块数据

    personProto,
    makeCid,clearPeopleDb,completeLogin,
    makePerson,removePerson,
    people,
    chat,
    initModule;

    //创建person对象原型
    personProto = {
        get_is_user : function () {
            return this.cid === stateMap.user.cid;
        },
        get_is_anon : function () {
            return this.cid === stateMap.anon_user.cid
        }
    };

    //makeCid函数，为person对象添加客户端ID
    makeCid = function () {
        return 'c' + String (stateMap.cid_serial++);
    };

    //clearPersonDb方法，用来移除所有出匿名用户及当前登入用户之外的person对象
    clearPeopleDb = function () {
        var user=stateMap.user;
        stateMap.people_db = TAFFY();
        stateMap.people_cid_map = {};
        if( user ) {
            stateMap.people_db.insert(user);
            stateMap.people_cid_map[user.cid] = user;
        }
    };

    //completeLogin方法 - 当后端发送回用户的确认信息和数据完成用户的登入时，
    //更新当前用户信息
    completeLogin = function (user_list) {
        var user_map = user_list[0];
        delete stateMap.people_cid_map[user_map.cid];
        stateMap.user.cid = user_map._id;
        stateMap.user.id = user_map._id;
        stateMap.user.css_map = user_map.css_map;
        stateMap.people_cid_map[user_map._id] = stateMap.user;
        chat.join();//调用chat.join一旦用户完成登入，就自动加入聊天室

        $.gevent.publish ('spa-login',[stateMap.user]);
    };

    //创建person对象的makePerson构造函数,并将新创建的对保存到TaffyDB中，
    //同时更新people_cid_map索引
    makePerson = function  (person_map) {
            var person,
                  cid = person_map.cid,
                  css_map = person_map.css_map,
                  id = person_map.id,
                  name = person_map.name;

            if(cid ===undefined || !name) {
                throw 'client id and name required';
            }

            person = Object.create(personProto);
            person.cid = cid;
            person.name = name;
            person.css_map = css_map;

             if(id) {
                person.id = id;
            }
            stateMap.people_cid_map[cid] = person;
            stateMap.people_db.insert(person);
            return person;
    };
    //removePerson方法 - 从人员列表中移除person对象
    removePerson = function (person) {
        if(!person){
            return false;
        }
        if(person.id === configMap.anon_id) {
            return false;
        }
        stateMap.people_db({cid:person.cid}).remove();
        if(person.id) {
            delete stateMap.people_cid_map[person.id];
        }
        return true;
    };

    //创建people对象
    people =(function () {
        var get_by_cid,get_db,get_user,login,logout;
        get_by_cid = function (cid) {
            return stateMap.people_cid_map[cid];
        };
         get_db = function () {  //get_db方法 - 返回person对象的TaffyDB集合
            return stateMap.people_db;
        };
        get_user = function (){
            return stateMap.user;
        };
        login = function (name) {
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();

            stateMap.user = makePerson ({
                cid : makeCid (),
                css_map : {top : 25 , left : 25 , 'background-color' : '#8f8'},
                name : name
            });
            //绑定userupdate事件处理程序
            sio.on ('userupdate',completeLogin);
            //向后端发送adduser消息，携带用户详细信息
            sio.emit ('adduser' , {
                cid : stateMap.user.cid,
                css_map : stateMap.user.css_map,
                name : stateMap.user.name
            });
        };

        //logout方法
        logout = function () {
            var user = stateMap.user;
            //when we add chat,we should leave the chatroom here

            chat._leave();//调用_leave方法，一旦用户完成登出就自动退出聊天室
            stateMap.user = stateMap.anon_user;
            clearPeopleDb();

            $.gevent.publish ('spa-logout',[user]);
            return is_removed;
        };

        return {
            get_by_cid : get_by_cid,
            get_db : get_db,
            get_user :get_user,
            login : login,
            logout : logout
        };
    })();

    //创建chat对象
    chat = (function () {
        var _publish_listchange,_publish_updatechat,
        _update_list,
        _leave_chat,
        get_chatee,send_msg,set_chatee,
        join_chat,
        update_avatar,

        chatee = null;

        //创建_update_list方法，当接收新的人员列表时，用来刷新people对象
        _update_list = function (arg_list) {
            var i , person_map , make_person_map,person,
                  people_list = arg_list[0],
                  is_chatee_online = false;

            clearPeopleDb();

            for( i = 0; i < people_list.length; i++) {
                person_map = people_list[i];
                if(!person_map.name) {continue;}

                //如果用户存在，更新css_map
                if (stateMap.user && stateMap.user.id === person_map.id){
                    stateMap.user.css_map = person_map.css_map;
                    continue;
                }
                make_person_map = {
                    cid          : person_map._id,
                    css_map : person_map.css_map,
                    id            : person_map._id,
                    name      : person_map.name
                };
                person = makePerson(make_person_map);

                //如果chatee人员对象在更新后的用户列表中，则设置is_chatee_online为true
                if(chatee && chatee.id === make_person_map.id) {
                    is_chatee_online = true;
                    chatee = person;
                }

                makePerson(make_person_map);
            }
            stateMap.people_db.sort('name');

            //如果chatee人员对象不在更新的用户列表中，则置为空
            if ( chatee && !is_chatee_online) {
                set_chatee('');
            }
        };

        //创建_pulish_list-change方法，用来发布spa-listchange事件，
        //携带的数据是更新的人员列表，每当接收到来自后端的listchange消息，调用此方法
        _publish_listchange = function (arg_list) {
            _update_list (arg_list);
            $.gevent.publish('spa-listchange',[arg_list]);
        };

        //创建publish_updatechat方法,发布spa-updatechat事件
        _publish_updatechat = function (arg_list) {
            var msg_map = arg_list [0];

            if(!chatee) {
                set_chatee (msg_map.sender_id);
            } else if (msg_map.sender_id !== stateMap.user.id &&
                          msg_map.sender_id !== chatee.id) {
                set_chatee(msg_map.sender_id);
            }

            $.gevent.publish('spa-updatechat',[msg_map]);
        };

        //创建_leave_chat方法，向后端发送leavechat消息，并清理状态变量
        _leave_chat = function () {
            var sio = isFakeData  ? spa.fake.mockSio : spa.data.getSio();
            chatee = null;
            stateMap.is_connected = false;
            if(sio) {
                sio.emit('leavechat');
            }
        };

        //创建get_chatee方法，返回chatee人员对象
        get_chatee = function () {
            return chatee;
        };

        //创建join_chat加入聊天室方法，该方法会检查用户是否已经加入了聊天室
        join_chat = function () {
            var sio;

            if(stateMap .is_connected) {return false;}

            if(stateMap.user.get_is_anon()) {
                console.warn('User must be defined before joining chat');
                return false;
            }

            sio= isFakeData ?spa.fake.mockSio : spa.data.getSio();
            sio.on('listchange',_publish_listchange);

            //绑定_publish_uodatechat函数，处理从后端接收到的uodatechat消息时，会发布
            //spa-uodatechat事件
            sio.on('updatechat' , _publish_updatechat);

            stateMap.is_connected = true;
            return true;
        };

        //创建send_msg方法，发送文本消息和相关详细信息
        send_msg = function (msg_text) {
            var msg_map,
                  sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();

                  //若果没有连接或用户和听者有一个没有设置，则取消消息发送
                  if(!sio){
                    return false;
                  }
                  if (!(stateMap.user && chatee)) {
                    return false;
                  }

                  msg_map = {
                    dest_id : chatee.id,
                    dest_name : chatee.name,
                    sender_id : stateMap.user.id,
                    msg_text : msg_text
                  };

                  //发布spa-updatechat事件，使用户可以在聊天窗口看到消息
                  _publish_updatechat ([msg_map]);
                  sio.emit('updatechat',msg_map);
                  return true;
            };

            //创建set_chatee方法，把chatee更改为传入的对象
        set_chatee = function (person_id) {
            var new_chatee;
            new_chatee = stateMap.people_cid_map[person_id];
            if(new_chatee) {
                if(chatee && chatee.id === new_chatee.id){
                    return false;
                }
             } else {
                new_chatee = null;
             }

            //发布set_setchatee事件
             $.gevent.publish('spa-setchatee',{old_chatee:chatee,new_chatee:new_chatee});
            chatee = new_chatee;
            return true;
        };

        //创建update_avatar方法，向后端发送updateavatar消息
        update_avatar = function (avatar_update_map) {
            var sio = isFakeData ? spa.fake.mockSio : spa.data.getSio();
            if(sio) {
                sio.emit ('updateavatar',avatar_update_map);
            }
        };

        return {
            _leave : _leave_chat,
            get_chatee : get_chatee,
            join : join_chat,
            send_msg : send_msg,
            set_chatee :set_chatee,
            update_avatar  : update_avatar
        };
    })();

    initModule = function () {
        var i , people_list , person_map;

        //initialize  anonymous person
        stateMap.anon_user=makePerson ({
            cid : configMap.anon_id,
            id : configMap.anon_id,
            name : 'anonymous'
        });
        stateMap.user = stateMap.anon_user;

    };
    return {
        initModule : initModule,
        people :people,
        chat :chat
    };
})();