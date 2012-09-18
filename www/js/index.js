/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    initialize: function() {
        this.bind();
    },
    bind: function() {
        document.addEventListener('deviceready', this.deviceready, false);
    },
    deviceready: function() {
        // This is an event handler function, which means the scope is the event.
        // So, we must explicitly called `app.report()` instead of `this.report()`.
        app.report('deviceready');
    },
    report: function(id) {
        // Report the event in the console
        console.log("Report: " + id);

        // Toggle the state from "pending" to "complete" for the reported ID.
        // Accomplished by adding .hide to the pending element and removing
        // .hide from the complete element.
        document.querySelector('#' + id + ' .pending').className += ' hide';
        var completeElem = document.querySelector('#' + id + ' .complete');
        completeElem.className = completeElem.className.split('hide').join('');
        //testing out lawnchair.js
        $(function(e) {
            var beers = Lawnchair({name:'beers'},function(e){
                console.log('storage open');
            });
            // uncomment to clear the database
            beers.nuke();
            beers.all(function(arrBeers){
                for(var i = 0; i<arrBeers.length;i++)
                {
                    console.log(arrBeers.length);
                    var listdiv = document.createElement('li');
                        listdiv.setAttribute('id','listdiv');
                        listdiv.innerHTML = arrBeers[i].value.name;         
                    $('#beer_list').append(listdiv);    
                }
                $('#beer_list').listview("refresh");
            });
            function reload_list(){          
                beers.all(function(arrBeers){
                    $('#beer_list').empty();
                    for(var i = 0; i<arrBeers.length;i++)
                    {
                        console.log(arrBeers.length);
                        var listdiv = document.createElement('li');
                            listdiv.setAttribute('id','listdiv');
                            listdiv.innerHTML = JSON.stringify(arrBeers[i].value);         
                        $('#beer_list').append(listdiv);    
                    }
                    $('#beer_list').listview("refresh");
                });
            }
            $('#reload_list').click(function(e){
                reload_list();
            });

            $('#count').click(function(e){
                beers.all(function(arrBeers){
                    $('#status').innerHTML(arrBeers.length+" items in the database");
                });
            });
            $('#save').click(function(e){  
                var nm = $("#entry_name").val();
                var desc = $("#entry_description").val();
                var cur_key = "";
                if(nm != "" && desc != ""){
                    beers.all(function(arrBeers){
                        cur_key = arrBeers.length.toString();
                    });
                    var obj1 = {"name":nm,"description":desc};           
                    beers.save({key:cur_key,value:obj1});
                }
            });
            $('#retrieve').click(function(e){
                var cur_key = "0"
                beers.all(function(arrBeers){
                    cur_key = arrBeers.length.toString();
                });
                beers.get(cur_key,function(obj){
                    var resul = JSON.stringify(obj);
                    console.log(resul);
                    alert(resul);
                });
            });     
            $('#modify').click(function(e) {
                beers.get("1",function(thisobj){
                    console.log(thisobj);
                    var obj = {};
                        obj = thisobj.value;
                        obj.name = "Modified Value";
                    beers.save({key:thisobj.key,value:obj});
                });
            });
        }); // end lawnchair shit
    }
};
