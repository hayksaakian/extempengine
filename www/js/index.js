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
            function reload_list(){          
                beers.all(function(arrBeers){
                    $('#beer_list').empty();
                    console.log(arrBeers.length);
                    for(var i = 0; i<arrBeers.length;i++)
                    {
                        var lyo = make_article_layout();
                        cur_a = arrBeers[i].value;
                        lyo.id = cur_a["_id"];
                        //lyo.find("#body").text(cur_a["body"]);
                        lyo.find("#published_at").append(" "+cur_a["published_at"]);
                        lyo.find("#author").append(" "+cur_a["author"]);
                        lyo.find("#title").append(" "+cur_a["title"]);
                        lyo.find("#source").append(" paper_id:"+cur_a["paper_id"]+" | "+cur_a["url"]);
                    }
                });
            }
            function inject_article(ui_container, json){
                $(ui_container).find('#body').text(json["body"]);
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
                var cur_key = "0";
                beers.all(function(arrBeers){
                    cur_key = arrBeers.length.toString();
                });
                beers.get(cur_key,function(obj){
                    var resul = JSON.stringify(obj);
                    console.log(resul);
                    alert(resul);
                });
            });
            function initTimestamp(){
                //sets the time stamp to a year before now
                var d = new Date();
                d.setFullYear(d.getFullYear() - 1);
                obj = {};
                //validate that this would actually work
                obj["time"] = Math.round(d.valueOf() / 1000).toString();
                obj["cur_state"] = "FINISHED";
                beers.save({key:"timestamp", value:obj});
            }
            // function checkLatest(){
            //     // the object im using will be:
            //     // "timestamp":{"time":"INT_TIME_AS_STRING", "cur_state":"STARTED/DOWNLOADING/FINISHED"}
            //     var last_update_time = "0";
            //     beers.get("timestamp",function(thisobj){
            //         console.log(JSON.stringify(thisobj));
            //         var obj = {};
            //             obj = thisobj.value;
            //             obj["cur_state"] = "STARTED";
            //         last_update_time = obj["time"]
            //         //check for null somehow
            //         //initTimestamp() if not there
            //         //done with the null case
            //         beers.save({key:thisobj.key,value:obj});
            //     });
            //     var url = latest_articles_path(last_update_time);
            //     get_latest_from_url(url, function(jsondata){
            //         //should be a json array atm                
            //         $.each(jsondata, function(index, data) {
            //             var article = data;
            //             add_article_to_db(data);
            //         });
            //     });
            // }
            function latest_articles_path(timestamp_as_int){
                //GET url for articles newer than timestamp_as_int
                return "http://www.extempengine.com/articles/latest?getolder=false&int_time="+timestamp_as_int+"&callback=?";
            }
            // below could be bad
            // function get_latest_from_url(url, callback_function){
            //     //wrap with callback due to same origin BS
            //     url = wrap_with_bs(url);
            //     jQuery.getJSON(url, function(data){
            //         var retval = JSON.stringify(data));
            //         console.log("via getJSON > "+retval);
            //         callback_function(data);
            //     }); 
            // }
            // everything below works
            function wrap_with_bs(url){
                if (url.indexOf("?") == -1) {
                    url = url + "&callback=?";
                } else {
                    url = url + "?callback=?";
                }
                return url;
            }
            function add_article_to_db(article_as_json){
                beers.save({key:article_as_json["_id"],value:article_as_json});
            }
            var article_url = "http://extempengine.com/articles/latest.js";
            $('#get_from_server').click(function(e) {
                console.log("starting article search");
                var newer_than = "0";
                beers.get("timestamp",function(thisobj){
                    console.log("bad keys are");
                    console.log(thisobj);
                    console.log(", just fyi.");
                    var obj = {};
                        obj = thisobj.value;
                        //obj.name = "Modified Value";
                    alert(JSON.stringify(obj));

                    // var d = new Date();
                    // d.setFullYear(d.getFullYear() - 1);
                    // obj = {};
                    // //validate that this would actually work
                    // obj["time"] = Math.round(d.valueOf() / 1000).toString();

                    //beers.save({key:thisobj.key,value:obj});
                });

                jQuery.getJSON(latest_articles_path(newer_than), function(jsondata){    
                    console.log("callback "+JSON.stringify(jsondata));
                    $.each(jsondata, function(index, data) {
                        //var article = data;
                        add_article_to_db(data);
                    });
                    alert("done updating articles");
                    //add_article_to_db(data);
                }); 
                console.log("jquery getjson was just initiated search");
            });
            // $('#initTimestamp').click(function(e) {
            //     initTimestamp();
            // });
            $('#modify').click(function(e) {
                beers.get("1",function(thisobj){
                    console.log(thisobj);
                    var obj = {};
                        obj = thisobj.value;
                        obj.name = "Modified Value";
                        alert(JSON.stringify(obj));
                    //beers.save({key:thisobj.key,value:obj});
                });
            });
            $('#search').click(function(e) {
                var search_term = $("#search_title").val();
                var re = new RegExp(search_term, "i")
                //alert("startings search for "+search_term);
                beers.all(function(arrBeers){
                    $('#beer_list').empty();
                    console.log(arrBeers.length);
                    var counter = 0;
                    for(var i = 0; i<arrBeers.length;i++)
                    {
                        cur_a = arrBeers[i].value;
                        if (cur_a["title"].search(re) != -1) 
                        {
                            counter = counter + 1;
                            var lyo = make_article_layout();
                            lyo.find("#title").text(cur_a["title"]);
                            console.log(cur_a["title"]);
                            console.log(cur_a["body"]);
                            lyo.id = cur_a["_id"];
                            lyo.find("#body").append(cur_a["body"]);
                            lyo.find("#published_at").append(" "+cur_a["published_at"]);
                            lyo.find("#author").append(" "+cur_a["author"]);
                            lyo.find("#source").append(" paper_id:"+cur_a["paper_id"]+" | "+cur_a["url"]);
                        }
                    }
                    $('#status').text("Results Found:"+counter.toString())
                });
            });
            function make_article_layout(){
                var template = $("#article_template");
                var cont = $("#beer_list");
                var n = template.contents().clone();
                n.appendTo(cont);
                n.show();
                return n;                
            }
            $("#clear_db").click(function(e){
                beers.nuke();
            });
            reload_list();
        }); // end lawnchair shit
    }
};
