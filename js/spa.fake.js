/*
* spa.fake.js
* Fake
7 feature module
*/

spa.fake = ( function () {
    'use strict';
    var getPeopleList ,fakeIdSerial , makeFakeId , mockSio;

    fakeIdSerial = 5; //添加模拟的服务端ID序号计数器

    //创建生成模拟的服务器ID字符串的方法
    makeFakeId = function () {
        return 'id_' + String(fakeIdSerial++);
    };

    getPeopleList = function () {
        return [
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
    };

    //定义mocSio对象
    mockSio = (function () {
        var on_sio , emit_sio , callback_map ={};

        //on_sic方法，给某个消息类型注册回调函数
        on_sio = function (msg_type,callback) {
            callback_map[msg_type] = callback;
        };

        //emit_sio方法 - 模拟向服务器发送消息
        emit_sio = function (msg_type,data) {

            //respond to 'adduser' event with 'userupdate'
            //callback after a 3s delay
            if ( msg_type === 'adduser' && callback_map.userupdate) {
                setTimeout (function () {
                    callback_map.userupdate (
                        [{
                            _id :makeFaleId(),
                            name : data.name ,
                            css_map : data.css_map
                        }]
                    );
                },3000);
            }
        };
        return {emit: emit_sio , on: on_sio};
    })();

    return {
        getPeopleList : getPeopleList,
        mockSio : mockSio
    };
})();