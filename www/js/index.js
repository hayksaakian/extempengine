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
        console.log("initialize bound");
    },
    bind: function() {
        var ms = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);
        if (ms != null) {
            alert(navigator.userAgent.toString()+" user agent is mobile, we are in PhoneGap");
            document.addEventListener('deviceready', this.deviceready, false);
        } else {
            alert(navigator.userAgent.toString()+"user agent did not match, assuming PC, we are in Chrome App");
            this.deviceready();
        }
        console.log("listener bound");
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
            var lawnchair = Lawnchair({name:'lawnchair'},function(e){
                console.log('storage open');
            });
            // uncomment to clear the database
            //lawnchair.nuke();
            function reload_list(){          
                lawnchair.all(function(articles){
                    $('#article_list').empty();
                    console.log(articles.length);
                    for(var i = 0; i<articles.length;i++)
                    {
                        //make sure this is an article
                        cur_a = articles[i].value;
                        if(cur_a["title"] != null){
                            var lyo = make_article_layout();
                            lyo.id = cur_a["_id"];
                            //lyo.find("#body").text(cur_a["body"]);
                            lyo.find("#published_at").append(" "+cur_a["published_at"]);
                            lyo.find("#author").append(" "+cur_a["author"]);
                            lyo.find("#title").append(" "+cur_a["title"]);
                            lyo.find("#source").append(" paper_id:"+cur_a["paper_id"]+" | "+cur_a["url"]);
                        }
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
                lawnchair.all(function(articles){
                    $('#status').innerHTML(articles.length+" items in the database");
                });
            });
            $('#save').click(function(e){  
                var nm = $("#entry_name").val();
                var desc = $("#entry_description").val();
                var cur_key = "";
                if(nm != "" && desc != ""){
                    lawnchair.all(function(articles){
                        cur_key = articles.length.toString();
                    });
                    var obj1 = {"name":nm,"description":desc};           
                    lawnchair.save({key:cur_key,value:obj1});
                }
            });
            $('#retrieve').click(function(e){
                var cur_key = "0";
                lawnchair.all(function(articles){
                    cur_key = articles.length.toString();
                });
                lawnchair.get(cur_key,function(obj){
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
                lawnchair.save({key:"timestamp", value:obj});
                return obj["time"];
            }
            // function checkLatest(){
            //     // the object im using will be:
            //     // "timestamp":{"time":"INT_TIME_AS_STRING", "cur_state":"STARTED/DOWNLOADING/FINISHED"}
            //     var last_update_time = "0";
            //     lawnchair.get("timestamp",function(thisobj){
            //         console.log(JSON.stringify(thisobj));
            //         var obj = {};
            //             obj = thisobj.value;
            //             obj["cur_state"] = "STARTED";
            //         last_update_time = obj["time"]
            //         //check for null somehow
            //         //initTimestamp() if not there
            //         //done with the null case
            //         lawnchair.save({key:thisobj.key,value:obj});
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
                return "http://www.extempengine.com/articles/latest.json?getnewer=true&int_time="+timestamp_as_int//+"&callback=?";
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
                lawnchair.save({key:article_as_json["_id"],value:article_as_json});
            }
            $('#get_from_server').click(function(e) {
                console.log("starting article search");
                var newer_than = "0";
                lawnchair.get("timestamp",function(thisobj){
                    console.log("bad keys are");
                    console.log(thisobj);
                    console.log(", just fyi.");
                    if(thisobj == null)
                    {
                        newer_than = initTimestamp();
                    } else {
                        var obj = {};
                            obj = thisobj.value;
                            //obj.name = "Modified Value";                
                            // var d = new Date();
                            // d.setFullYear(d.getFullYear() - 1);
                            // obj = {};
                            // //validate that this would actually work
                            newer_than = parseInt(thisobj.value["time"]);
                            //lawnchair.save({key:thisobj.key,value:obj});
                    }
                });

                jQuery.getJSON(latest_articles_path(newer_than), function(jsondata){    
                    console.log("recieved data from server!");
                    console.log("callback "+JSON.stringify(jsondata).length.toString());
                    $.each(jsondata, function(index, data) {
                        //var article = data;
                        add_article_to_db(data);
                    });
                    console.log("done updating articles");

                    lawnchair.get("timestamp",function(thisobj){
                        var obj = {};
                        obj = thisobj.value;
                        var d = new Date();
                        obj["time"] = Math.round(d.valueOf() / 1000).toString();
                        lawnchair.save({key:thisobj.key,value:obj});
                    });
                    //add_article_to_db(data);
                }); 
                console.log("jquery getjson was just initiated");
            });
            // $('#modify').click(function(e) {
            //     lawnchair.get("1",function(thisobj){
            //         console.log(thisobj);
            //         var obj = {};
            //             obj = thisobj.value;
            //             obj.name = "Modified Value";
            //             alert(JSON.stringify(obj));
            //         //lawnchair.save({key:thisobj.key,value:obj});
            //     });
            // });

            $('#sort_by_match_count').click(function(e){
                derp("#match_count");
            });
            $('#sort_by_xrank').click(function(e){
                derp("#xrank");
            });
            function derp(critera_div_string_selector){
                var list = $('#article_list');
                var arr = $.makeArray(list.children(".well"));
                arr.sort(function(a, b) {
                    var textA = parseFloat($(a).find(critera_div_string_selector).text());
                    var textB = parseFloat($(b).find(critera_div_string_selector).text());    
                    if (textA > textB) return -1;
                    if (textA < textB) return 1;
                    return 0;
                });
                list.empty();
                $.each(arr, function() {
                    list.append(this);
                });
            }

            $('#search').click(function(e) {
                var search_term = $("#search_field").val();
                var search_type = $('#search_type').val(); 
                var re = new RegExp(search_term, "gi")
                console.log("startings search for "+search_term);
                console.log("startings search for "+re.toString());
                lawnchair.all(function(articles){
                    $('#article_list').empty();
                    console.log(articles.length);
                    var counter = 0;
                    for(var i = 0; i<articles.length;i++)
                    {
                        cur_a = articles[i].value;
                        if(cur_a["title"] != null){
                            var thing_to_search = "string";
                            if(search_type == "all"){
                                thing_to_search = cur_a["title"]+" "+cur_a["body"];
                            }else if(search_type == "title"){
                                thing_to_search = cur_a["title"];
                            }else if (search_type == "body"){
                                thing_to_search = cur_a["body"];
                            }
                            var matches = thing_to_search.match(re);
                            if (matches != null) 
                            {
                                counter = counter + 1;
                                var lyo = make_article_layout();
                                lyo.find("#title").text(cur_a["title"]);
                                //xrank is the kw density
                                //let title be 10x more important than body
                                var xrank = (1.0 * matches.length) / thing_to_search.length;
                                if(cur_a["title"] != null){
                                    var m2 = cur_a["title"].match(re);
                                    if(m2 != null){
                                        xrank = (xrank * m2.length)
                                    }
                                }
                                lyo.find("#match_count").text(matches.length.toString());
                                lyo.find("#xrank").text(xrank.toString());
                                console.log(cur_a["title"]);
                                //console.log(cur_a["body"]);
                                lyo.id = cur_a["_id"];
                                //lyo.find("#body").text(cur_a["body"]);
                                lyo.find("#published_at").append(" "+cur_a["published_at"]);
                                lyo.find("#author").append(" "+cur_a["author"]);
                                lyo.find("#source").append(" paper_id:"+cur_a["paper_id"]+" | "+cur_a["url"]);
                            }
                        }
                    }
                    $('#status').text("Results Found:"+counter.toString())
                });
            });
            function make_article_layout(){
                var template = $("#article_template");
                var cont = $("#article_list");
                var n = template.contents().clone();
                n.appendTo(cont);
                n.show();
                return n;                
            }
            $("#clear_db").click(function(e){
                lawnchair.nuke();
            });
            //reload_list();
        }); // end lawnchair shit
    }
};
