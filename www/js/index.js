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
            //beers.nuke();
         
         
            beers.all(function(arrBeers){
                for(var i = 0; i<arrBeers.length;i++)
                {
                    console.log(arrBeers.length);
                    var listdiv = document.createElement('li');
                        listdiv.setAttribute('id','listdiv');
                        listdiv.innerHTML = arrBeers[i].value.beername;         
                    $('#beer_list').append(listdiv);    
                }
                $('#beer_list').listview("refresh");
            });
         
            $('#save').click(function(e){  
         
                var obj1 = {beername:"Wet Hop",brewername:"Deschuttes",brewerlocation:"Bend, OR"
                            ,beerstyle:"IPA",quantity:1,purchasedate:"12/11/2011",price:"9.00"
                            ,cellardate:"9/11/2011",cellartemp:40,brewdate:"8/10/2011"};
                var obj2 = {beername:"Vertical Epic 11",brewername:"Stone",brewerlocation:"San Diego, CA"
                            ,beerstyle:"Belgian",quantity:1,purchasedate:"1/10/2011",price:"15.00"
                            ,cellardate:"1/12/2011",cellartemp:45,brewdate:"10/10/2010"};               
                beers.save({key:"1",value:obj1});       
                beers.save({key:"2",value:obj2});
         
         
            });
         
            $('#retrieve').click(function(e){
                beers.get("1",function(obj){
                    console.log(obj);
                });
            });     
            $('#modify').click(function(e) {
                beers.get("1",function(thisobj){
                    console.log(thisobj);
                    var obj = {};
                        obj = thisobj.value;
                        obj.beername = "Not Wet Hop";
                    beers.save({key:thisobj.key,value:obj});
                });
            });
        }); // end lawnchair shit
    }
};
