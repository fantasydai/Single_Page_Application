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
        user : null //保存当前用户对象
    },

    isFakeData = true, //告诉model是否使用Fake模块数据

    personProto,
    makeCid,clearPeopleDb,completeLogin,
    makePerson,removePerson,
    people,
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

        $.gevent.publish ('spa-login',[stateMap.user]);
    };

    //创建person对象的makePerson构造函数,并将新创建的对保存到TaffyDB中，
    //同时更新people_cid_map索引
    makePerson = function  (person_map) {
            var person,
                  cid = person_map.cid,
                  css_map = person_map.css_map,
                  id = person_map._id,
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
            //绑定useruodate事件处理程序
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
            var is_removed ,user = stateMap.user;
            //when we add chat,we should leave the chatroom here

            is_removed = removePerson(user);
            stateMap.user = stateMap.anon_user;

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

    initModule = function () {
        var i , people_list , person_map;

        //initialize  anonymous person
        stateMap.anon_user=makePerson ({
            cid : configMap.anon_id,
            id : configMap.anon_id,
            name : 'anonymous'
        });
        stateMap.user = stateMap.anon_user;

        if (isFakeData) {
            people_list =spa.fake.getPeopleList();

            for ( i = 0;i < people_list.length; i++) {
                person_map = people_list[i];
                makePerson ({
                    cid : person_map._id,
                    css_map : person_map.css_map,
                    id : person_map._id,
                    name : person_map.name
                });
            }
        }
    };
    return {
        initModule : initModule,
        people :people
    };
})();