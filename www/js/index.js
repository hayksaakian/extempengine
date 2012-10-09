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
        // document.addEventListener('deviceready', this.deviceready, false);
        // console.log("listener bound");
        var ms = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);
        if (ms != null) {
            $("#status").text("mobile: "+navigator.userAgent.toString()+" user agent is mobile, we are in PhoneGap");
            document.addEventListener('deviceready', this.deviceready, false);
        } else {
            $("#status").text("pc: "+navigator.userAgent.toString()+" user agent did not match, assuming PC, we are in Chrome App");
            this.deviceready();
        }
        console.log("listener bound");
    },
    deviceready: function() {
        // This is an event handler function, which means the scope is the event.
        // So, we must explicitly called `app.report()` instead of `this.report()`.
        $("#status").text("");
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
            function refresh_total_article_count_view(){
                lawnchair.all(function(everything){
                    console.log(everything.length.toString()+" items in db");
                    $("#total_article_count").text(everything.length.toString());
                });
            };
            function refresh_timestamp_view(){
                $("#last_update_time").text("checking");
                lawnchair.get("timestamp",function(obj){
                    var tm = "... never updated";
                    if(obj != null){
                        var t = parseInt(obj.value["time"])*1000;
                        console.log(t);
                        d = new Date(t);
                        tm = "Last updated on "+d.toLocaleDateString()+" at "+d.toLocaleTimeString();
                    }
                    $("#last_update_time").text(tm);
                });
            }
            refresh_timestamp_view();
            refresh_total_article_count_view();
            // uncomment to clear the database
            //lawnchair.nuke();
            function inject_article(ui_container, json){
                $(ui_container).find('#body').text(json["body"]);
            }

            $('#reload_list').click(function(e){
                reload_list();
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
                $('#get_from_server').click();
            }

            function latest_articles_path(timestamp_as_int){
                //GET url for articles newer than timestamp_as_int
                return "http://www.extempengine.com/articles/latest.json?order_by=asc&getnewer=true&limit=200&int_time="+timestamp_as_int//+"&callback=?";
            }

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
                $(".progress").show();
                var pbar = $(".bar");
                pbar.width('0%');
                console.log("starting article search");
                var newer_than = "0";
                lawnchair.get("timestamp",function(thisobj){
                    // console.log("bad keys may be");
                    // console.log(thisobj);
                    // console.log(", just fyi.");
                    if(thisobj == null)
                    {
                        initTimestamp();
                    } else {
                        var obj = {};
                        obj = thisobj.value;
                        // //validate that this would actually work
                        newer_than = parseInt(obj["time"]);
                        console.log(newer_than);
                        console.log(latest_articles_path(newer_than));
                        jQuery.getJSON(latest_articles_path(newer_than), function(jsondata){    
                            console.log("recieved data from server!");
                            console.log("callback "+JSON.stringify(jsondata).length.toString());                    
                            var total = jsondata.length;
                            //format like:
                            var newest_date = newer_than.toString();
                            $.each(jsondata, function(index, data) {
                                //var article = data;

                                console.log((100*(index/total)).toString()+'%');
                                pbar.width((100*(index/total)).toString()+'%');
                                add_article_to_db(data);
                                if(index == total - 1){
                                    di = new Date(data["published_at"].toString());
                                    newest_date = Math.round(di.valueOf() / 1000).toString();
                                    update_timestamp(newest_date);
                                }
                            });
                            setTimeout(refresh_total_article_count_view, 1000);
                            //add_article_to_db(data);
                            $(".progress").hide();
                        }); 
                    }
                    // console.log("jquery getjson was just initiated");
                });
            });
            function update_timestamp(str_time){
                lawnchair.get("timestamp",function(thisobj){
                    console.log(thisobj);
                    var obj = {};
                    obj = thisobj.value;
                    obj["time"] = str_time;
                    lawnchair.save({key:"timestamp",value:obj});
                    refresh_timestamp_view();
                });
            }
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
                $(".progress").show();
                var pbar = $(".bar");
                pbar.width('0%');
                var search_term = $("#search_field").val();
                var search_type = $('#search_type').val(); 
                var re = new RegExp(search_term, "gi")
                console.log("startings search for "+search_term);
                console.log("startings search for "+re.toString());
                lawnchair.all(function(articles){
                    $('#article_list').empty();
                    console.log(articles.length);
                    var total = articles.length;
                    var counter = 0;
                    for(var i = 0; i<articles.length;i++)
                    {
                        console.log((100*(i/total)).toString()+'%');
                        pbar.width((100*(i/total)).toString()+'%');
                        cur_a = articles[i].value;
                        if(cur_a["title"] != null){
                            var thing_to_search = "string";
                            if(search_type == "both"){
                                thing_to_search = cur_a["title"]+" "+cur_a["body"];
                            }else if(search_type == "title"){
                                thing_to_search = cur_a["title"];
                            }else if (search_type == "body"){
                                thing_to_search = cur_a["body"];
                            }
                            var matches = thing_to_search.match(re);
                            if (matches != null) 
                            {
                                //count results in the body even though we're searching by title
                                //for the purposes of ranking
                                if(search_type == "title"){
                                    matches = (cur_a["title"]+" "+cur_a["body"]).match(re);
                                }
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
                                lyo.attr("id", "partial_"+cur_a["_id"]);
                                lyo.find(".rd").attr("id", "btn_"+cur_a["_id"]);
                                //lyo.find("#body").text(cur_a["body"]);
                                var d = new Date(cur_a["published_at"].toString());
                                lyo.find("#published_at").append(" "+d.toDateString());
                                lyo.find("#author").append(" "+cur_a["author"]);
                                lyo.find("#source").append(" paper_id:"+cur_a["paper_id"]+" | "+cur_a["url"]);
                            }
                        }
                    }
                    $('#number_of_results').text(counter.toString());
                    $(".progress").hide();
                    derp("#match_count");
                });
            });
            function make_article_layout(){
                var template = $("#article_template");
                var cont = $("#article_list");
                var n = template.contents().clone();
                n.find('.rd').click(function(e){
                    //this selected could be a lot nicer
                    var the_id = $(this).attr("id").replace('btn_', '');
                    console.log(the_id);
                    var show_article_tab = $('#show_article_'+the_id);
                    if(show_article_tab.length == 0){
                        console.log("expanding");
                        expand_article(the_id);
                    }else{
                        console.log("showing");
                        show_article_tab.click();
                    }
                });
                n.appendTo(cont);
                n.show();
                return n;                
            }
            function expand_article(article_id){
                //create tab
                var articles_nav = $('#articles_nav');
                var nav_template = articles_nav.find("#show_article_ID");
                var n = nav_template.parent().clone();
                n.find('a').attr("id", "show_article_"+article_id)
                //add nav toggle-ability to the new nav button
                n.find('.shw').click(function(e){
                    var id = $(this).attr("id");
                    var vname = id.replace("show_", "");
                    vname = "#"+vname + "_view";
                    $(".vw").hide();
                    $(".shw").removeClass("active");
                    // $(".shw").find("span").hide();
                    $(this).addClass("active");
                    // $(this).find("span").show();
                    console.log(vname);
                    $('#articles_view').show();
                    $(vname).show();
                });
                n.appendTo(articles_nav);
                n.show();
                //create view //and then will also click on the tab
                open_article(article_id);
            }
            function open_article(article_id){
                //get the partial
                var template = $('#partial_'+article_id);
                console.log(template.length);
                console.log(template.find('#title').length);
                var s = template.find('#title').text();
                console.log(s);
                var tab_b = $('#show_article_'+article_id);
                tab_b.find('.txtv').text(' '+s.substring(0, 12)+'...');
                console.log(s.substring(0, 16));
                var cont = $("#articles_view");
                //build a view rfom the partial
                var n = template.clone();
                n.attr('id', 'article_'+article_id+'_view');
                n.find('.rd').parent().hide();
                n.find('.bck').parent().show();
                n.find('.cls').parent().show();
                n.find('.bck').click(function(e){
                    $('#show_search').click();
                });
                n.find('.cls').click(function(e){
                    //kill the tab
                    $('#show_article_'+article_id).parent().remove();
                    //kill the view
                    n.remove();
                });
                n.find('#body_well').show();
                n.appendTo(cont);
                //because doing the 'get' could take some time, display text
                n.find('#body_text').text('Loading article body...');
                lawnchair.get(article_id, function(obj){
                    var article_json = obj.value;
                    //actually assign all of the fields, lol
                    n.find('#body_text').text(article_json['body']);
                    //click on the tab to actually show everything
                });
                n.show();
                tab_b.click();
            }

            $("#clear_db").click(function(e){
                lawnchair.nuke();
            });

            //view controls
            $(".shw").click(function(e){
                var id = $(this).attr("id");
                var vname = id.replace("show_", "");
                vname = "#"+vname + "_view";
                $(".vw").hide();
                $(".shw").removeClass("active");
                // $(".shw").find("span").hide();
                $(this).addClass("active");
                // $(this).find("span").show();
                $(vname).show();
            });
        }); // end lawnchair shit and jquery block
    } //done with report
}; //done defining app
