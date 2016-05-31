/*
* spa.fake.js
* Fake
7 feature module
*/

spa.fake = ( function () {
    'use strict';
    var peopleList ,fakeIdSerial , makeFakeId , mockSio;

    fakeIdSerial = 5; //添加模拟的服务端ID序号计数器

    //创建生成模拟的服务器ID字符串的方法
    makeFakeId = function () {
        return 'id_' + String(fakeIdSerial++);
    };
    //创建peopleList，用来保存模拟的人员列表
    peopleList = [
            {
                name: 'Betty',_id : 'id_01',
                css_map : {
                    top :20 , left : 20 ,
                    'background-color' : 'rgb(128,128,128)'
                }
            },
            {
                name: 'Mike' , _id : 'id_02',
                css_map : {
                    top :60 , left : 20 ,
                    'background-color' : 'rgb(128,255,128)'
                }
            },
            {
                name: 'Pebbles' , _id : 'id_03',
                css_map : {
                    top :100 , left : 20 ,
                    'background-color' : 'rgb(128,192,192)'
                }
            },
            {
                name: 'Wilma',_id : 'id_04',
                css_map : {
                    top :140 , left : 20 ,
                    'background-color' : 'rgb(192,128,128)'
                }
            }
    ];

    //定义mocSio对象
    mockSio = (function () {
        var on_sio , emit_sio ,
        emit_mock_msg,//模拟消息函数
        send_listchange , listchange_idto ,
        callback_map ={};

        //on_sic方法，给某个消息类型注册回调函数
        on_sio = function (msg_type,callback) {
            callback_map[msg_type] = callback;
        };

        //emit_sio方法 - 模拟向服务器发送消息
        emit_sio = function (msg_type,data) {
            var person_map,i;
            //respond to 'adduser' event with 'userupdate'
            //callback after a 3s delay
            if ( msg_type === 'adduser' && callback_map.userupdate) {
                setTimeout (function () {
                    person_map = {
                        _id : makeFakeId(),
                        name : data.name,
                        css_map : data.css_map
                    };
                    peopleList.push(person_map);
                    callback_map.userupdate ([person_map]);
                },3000);
            }

            //添加代码，延迟2秒后使用模拟的响应对发送的消息进行响应
            if(msg_type === 'updatechat' && callback_map.updatechat) {
                setTimeout(function () {
                    var user = spa.model.people.get_user();
                    callback_map.updatechat([{
                        dest_id : user.id,
                        dest_name : user.name,
                        sender_id : data.dest_id,
                        msg_text : 'Thanks for the note' +user.name
                    }]);
                },2000);
            }

            //如果接收到leavechat消息，则清除chat使用的回调函数
            if (msg_type === 'leavechat') {
                delete callback_map.listchange;
                delete callback_map.updatechat;

                if(listchange_idto) {
                    clearTimeout(listchange_idto);
                    listchange_idto = undefined;
                }
                send_listchange();
            }

            //创建接受updateavatar消息的处理程序
            if (msg_type === 'updateavatar' && callback_map.listchange) {
                //根据updateavatar消息携带的数据指定的信息查找person对象，更改css_map值
                for(i=0;i<peopleList.length;i++){
                    if(peopleList[i]._id === data.person_id) {
                        peopleList[i].css_map = data.css_map;
                        break;
                    }
                }
                //执行注册了listchange消息的回调函数
                callback_map.listchange([peopleList]);
            }
        };

        //每隔8秒钟，给已登录的用户发送模拟的消息，当设置updatechat回调函数时，
        //仅当用户登入才会成功
        emit_mock_msg = function () {
            setTimeout (function () {
                var user = spa.model.people.get_user();
                if(callback_map.updatechat) {
                    callback_map.updatechat ([{
                        dest_id : user.id,
                        dest_name : user.name,
                        sender_id : 'id_04',
                        msg_text : 'Hi there' +user.name+'!Wilma here.'
                    }]);
                }
                else {emit_mock_msg();}
            },8000);
        };

        //添加send_listchange函数，模拟接收来自后端的listchange消息，每隔一秒，
        //该方法会查找listchange回调函数，如果找到，则执行这个回调函数
        send_listchange = function () {
            listchange_idto = setTimeout(function () {
                if(callback_map.listchange) {
                    callback_map.listchange([peopleList]);
                    emit_mock_msg();
                    listchange_idto = undefined;
                } else {
                    send_listchange();
                }
            },1000);
        };
        send_listchange();

        return {emit: emit_sio , on: on_sio};
    })();

    return {
        mockSio : mockSio
    };
})();