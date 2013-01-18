//TODO: bookmarks
//better search:
//keywords instead of literal
//OR support

//PRO Tips:
//after typing your terms, push tab, then space to quickly start your search

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
var platform = null;
var app = {    
    initialize: function() {
        this.bind();
        console.log("initialize bound");
    },
    bind: function() {
        // document.addEventListener('deviceready', this.deviceready, false);
        // console.log("listener bound");
        var ms = navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/);
        var ua = navigator.userAgent.toString();
        if (ms != null) {
            platform = 'mobile';
            $("#status").text("mobile: "+ua+" user agent is mobile, we are in PhoneGap");
            document.addEventListener('deviceready', this.deviceready, false);
        } else {
            platform = 'pc';
            $("#status").text("pc: "+ua+" user agent did not match, assuming PC, we are in Chrome App");
            this.deviceready();
        }
        console.log("listener bound");
        console.log("user agent is: "+ua);
    },
    deviceready: function() {
        // This is an event handler function, which means the scope is the event.
        // So, we must explicitly called `app.report()` instead of `this.report()`.
        $("#status").text("");
        app.report('deviceready');
    },
    notify: function(title, body){
        if(!body){
            body = '';
        }
        if(platform == 'pc'){
            chrome.runtime.getBackgroundPage(function(bp){
                bp.notify(title, body);
            });
        }else if(platform == 'mobile'){
            //derp 
        }
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
                refresh_timestamp_view();
                refresh_total_article_count_view();
            });
            var papers_db = Lawnchair({name:'papers_db'},function(e){
                console.log('papers db open');
            });
            var articles_db = Lawnchair({name:'articles_db'},function(e){
                console.log('articles db open');
            });
            cache_article_keys();
            //this is slow as hell, i know why, working on it
            function refresh_total_article_count_view(){
                lawnchair.exists("article_count", function(bool){
                    var t0 = Date.now();
                    if(bool == false){
                        articles_db.all(function(everything){
                            var vl = everything.length;
                            var l = vl.toString();
                            var obj = {};
                            obj["total"] = l;
                            lawnchair.save({key:"article_count",value:obj});
                            $('#already_downloaded').text(l);
                            $('#total_article_count').text(l+' articles.');
                            console.log(l+" items in db");
                            console.log('count took this long:');
                            console.log(Date.now()-t0);  
                        });
                        // If we assume this block will occur when there are no articles
                        // var obj = {};
                        // obj["total"] = '0';
                        // lawnchair.save({key:"article_count",value:obj});
                        // $('#already_downloaded').text('0');
                        // $('#total_article_count').text('No articles.');
                    }else if(bool == true){
                        lawnchair.get("article_count", function(thisobj){
                            var obj = {};
                            obj = thisobj.value;
                            var l = obj["total"];
                            $('#already_downloaded').text(l);
                            $('#total_article_count').text(l+' articles.');
                            console.log(l+" items in db");
                            console.log('count took this long:');
                            console.log(Date.now()-t0);                            
                        });
                    }
                });
                //alternatly keep a tally in a specific kv pair
            };
            function refresh_timestamp_view(){
                $("#last_update_time").text("checking age");
                lawnchair.get("timestamp",function(obj){
                    var tm = "Never updated.";
                    if(obj != null){
                        var t = parseInt(obj.value["time"])*1000;
                        // console.log(t);
                        d = new Date(t);
                        tm = "Last updated on "+d.toLocaleDateString()+" at "+d.toLocaleTimeString();
                    }
                    $("#last_update_time").text(tm);
                });
            }

            function initTimestamp(){
                //sets the time stamp to a year before now
                var d = new Date();
                d.setFullYear(d.getFullYear() - 1);
                obj = {};
                //validate that this would actually work
                obj["time"] = Math.round(d.valueOf() / 1000).toString();
                obj["cur_state"] = "FINISHED";
                lawnchair.save({key:"timestamp", value:obj});
                check_for_more();
            }
            // uncomment to clear the database
            //lawnchair.nuke();
            //commented because it's never called, delete it if this remains the case
            // function inject_article(ui_container, json){
            //     $(ui_container).find('#body').text(json["body"]);
            // }

            $('#reload_list').click(function(e){
                reload_list();
            });

            function latest_articles_path(timestamp_as_int){
                //GET url for articles newer than timestamp_as_int
                return "https://www.extempengine.com/articles/latest.json?order_by=asc&getnewer=true&limit=25&int_time="+timestamp_as_int//+"&callback=?";
            }

            function add_article_to_db(article_as_json){
                articles_db.save({key:article_as_json["_id"],value:article_as_json});
            }
            function article_to_lc_entry(article_as_json){
                return {key:article_as_json["_id"],value:article_as_json};
            }
            $('#get_from_server').click(function(e) {
                check_for_more();
            });
            function update_articles(){
                $(".progress").show();
                var pbar = $(".bar");
                console.log("starting update process");
                var newer_than = "0";
                lawnchair.exists("timestamp", function(bl) {
                    // console.log("bad keys may be");
                    // console.log(thisobj);
                    // console.log(", just fyi.");
                    console.log(bl);
                    var adl = parseInt($('#already_downloaded').text());
                    var ltd = parseInt($('#left_to_download').text());
                    var w = 100*(adl/(ltd+adl));
                    pbar.width(w.toString()+'%');
                    console.log('adl '+adl);
                    console.log('ltd '+ltd);
                    console.log('w '+w);
                    console.log('width '+pbar.width().toString());
                    if (bl == false) {
                        initTimestamp();
                    } else {
                        lawnchair.get("timestamp", function(thisobj) {
                            var obj = {};
                            obj = thisobj.value;
                            // //validate that this would actually work
                            newer_than = parseInt(obj["time"]);
                            console.log(newer_than);
                            console.log(latest_articles_path(newer_than));
                            $.getJSON(latest_articles_path(newer_than), function(jsondata){    
                                console.log("recieved data from server!");
                                console.log("callback data str length "+JSON.stringify(jsondata).length.toString());                    
                                var total = jsondata.length;
                                //format like:
                                var newest_date = newer_than.toString();
                                var t0 = Date.now();
                                $.each(jsondata, function(index, data) {
                                    //var article = data;
                                    add_article_to_db(data);
                                    if(index == total - 1){
                                        di = new Date(data["created_at"].toString());
                                        newest_date = Math.round(di.valueOf() / 1000).toString();
                                        update_timestamp(newest_date);
                                        tdelta = (Date.now() - t0).toString();
                                        console.log('saving took '+tdelta+' milliseconds');
                                    }
                                });
                                lawnchair.get('article_count', function(artcnt){
                                    var b_obj = {};
                                    b_obj = artcnt.value;
                                    var tt = parseInt(b_obj['total'].toString());
                                    tt = tt + total;
                                    b_obj['total'] = tt.toString();
                                    lawnchair.save({key:'article_count', value:b_obj})
                                });
                                //Check for more articles
                                check_for_more();
                            }); 
                        });
                    }
                });
            }
            function check_for_more(){
                $('#get_from_server').button('loading');
                lawnchair.exists("timestamp", function(bl) {
                    console.log(bl.toString()+' regarding the timestamp');
                    if (bl == false) {
                        initTimestamp();
                    } else {
                        lawnchair.get("timestamp", function(thisobj){
                            var obj = {};
                            obj = thisobj.value;
                            var newer_than = obj["time"];
                            var path = latest_articles_path(newer_than)+'&count=true'
                            $.getJSON(path, function(jsondata){
                                refresh_total_article_count_view();
                                var ltd = parseInt(jsondata[0].toString());                    
                                var dld = ltd + parseInt($('#already_downloaded').text());
                                $('#all_article_count').text(dld.toString());
                                $('#left_to_download').text(ltd.toString());
                                console.log(ltd.toString()+' left to download.')
                                if(ltd>0){
                                    update_articles();
                                }else{
                                    //now that we've ensured our articles are up to date, 
                                    //lets check on our papers
                                    download_paper_info();
                                    console.log('getting paper info');
                                    //re-downloading everything is that not expensive,
                                    //but it could be optimized if you wanted to
                                    app.notify('Done downloading!', (dld)+' articles.');
                                    setTimeout(function(){
                                        var pr = $('.progress');
                                        pr.find('.bar').width('100%');
                                        pr.hide();
                                        $('#get_from_server').button('reset');
                                    }, 750);
                                }
                            });
                        });
                    }
                });
            }
            function move_search(to_where){
                if(to_where == "results"){
                    var sb = $('#search_bar');
                    sb.appendTo('#search_bar_container');
                    sb.find('.lead').show();
                }else if(to_where == "home"){
                    var sb = $('#search_bar');
                    sb.appendTo('#home_search_bar_container');
                    sb.find('.lead').hide();
                }
            }
            function update_timestamp(str_time){
                lawnchair.get("timestamp",function(thisobj){
                    console.log(JSON.stringify(thisobj));
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
            // disabled for optimization
            // $('#sort_by_xrank').click(function(e){
            //     derp("#xrank");
            // });
            $('#sort_by_date').click(function(e){
                derp("#pb_time");
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

            function search_to_AND_regex(search_term){
                var tmp = search_term.split(' ');
                var length = tmp.length;
                var prefix = '';
                var suffix = '.*';
                var composite = '';
                for (var i = 0; i < length; i++) {
                    var el = tmp[i];
                    if(el.length > 2){
                        composite = composite + '(?=.*'+el+')';
                    }
                }
                search_term = prefix + composite + suffix;
                var re = new RegExp(search_term, "gi");
                return re;
                //search_term = something(search_term)
            }
            function search_to_OR_regex(search_term){
                var tmp = search_term.split(' ');
                var length = tmp.length;
                var prefix = '(';
                var suffix = ')';
                var composite = '';
                for (var i = 0; i < length; i++) {
                    var el = tmp[i];
                    if(el.length > 2){
                        if(i != 0){
                            composite = composite + '|'+el;
                        }else{
                            composite = composite + el;
                        }
                    }
                } 
                search_term = prefix + composite + suffix;
                var re = new RegExp(search_term, "gi");
                return re;
            }

            //cancel submission
            $('#search_bar').bind('submit', function(){
                return false;
            });

            $('#search').click(function(e) {
                $(this).button('loading');
                $('#show_search').click();
                $('#nav_container').show();
                $('#results_sort_buttons').hide();
                $(".progress").show();
                var pbar = $(".bar");
                pbar.width('5%');
                var search_term = $("#search_field").val();
                $('#show_search').find('.txtv').text('\"'+search_term+'\"');

                // pbar.parent().find('#txtv').text('Searching for '+search_term+' in '+search_scope);
                pbar.parent().find('#left_to_download').text('');
                
                var OR_re = search_to_OR_regex(search_term);
                var AND_re = search_to_AND_regex(search_term);
                console.log(AND_re);
                console.log(OR_re);
                var t0 = Date.now();
                pbar.width('15%');
                var total = parseInt(article_keys.length/16);
                $('#article_list').empty();

                pbar.width('25%');
                console.log('searching in '+total);

                var matched_keys = [];
                var searched_articles = 0;
                pbar.addClass('bar-success');

                for (var i = total - 1; i >= 0; i--) {
                    articles_db.get(article_keys[i], function(aa){
                        var cur_a = aa.value;
                        // searching summary is redundant
                        var thing_to_search = cur_a["title"]+" "+cur_a["body"]//+" "+cur_a["summary"];
                        //search returns -1 if no results, otherwise the index of the result
                        if(thing_to_search.search(AND_re) != -1){
                            matched_keys.push(aa.key);
                            var matches = thing_to_search.match(OR_re);
                            // console.log(counter.toString()+") "+cur_a["title"].toString());
                            var lyo = make_article_layout();
                            lyo.find("#title").html(cur_a["title"]);

                            lyo.find("#match_count").text(matches.length.toString());
                            lyo.attr("id", "partial_"+cur_a["_id"]);
                            lyo.find(".rd").attr("id", cur_a["_id"]);
                            var d = new Date(cur_a["published_at"].toString());
                            lyo.find("#published_at").text(d.toDateString());
                            var pb_time = Math.round(d.valueOf() / 1000).toString();
                            lyo.find("#pb_time").text(pb_time);
                            lyo.find("#body_text").text(cur_a["body"]);
                            lyo.find("#author").text(cur_a["author"]);
                            get_paper(cur_a["paper_id"], lyo.find("#source"));
                            lyo.find("#url").text(cur_a["url"]);


                            $(".rd").on("click", function(e){
                                //this selected could be a lot nicer
                                var the_id = $(this).attr("id");
                                console.log("user is trying to read article "+the_id);
                                var show_article_tab = $('#show_article_'+the_id);
                                if(show_article_tab.length == 0){
                                    console.log("expanding");
                                    expand_article(the_id);
                                }else{
                                    console.log("showing");
                                    show_article_tab.click();
                                }
                            });
                        }else{
                            // console.log('nope');
                        }
                        searched_articles += 1;
                        //if we're on the last article, do all this stuff
                        if(searched_articles % 100 == 0){
                            console.log('searched '+searched_articles+' of '+total+' so far');
                            pbar.width(((searched_articles*100)/total)+'%');
                        }
                        if(searched_articles == total){
                            var counter = matched_keys.length;
                            $('#number_of_results').text(counter.toString());
                            pbar.removeClass('bar-success');
                            $(".progress").hide();
                            //derp("#match_count");
                            console.log(counter.toString()+" results")
                            console.log('search took this long in ms:');
                            console.log(Date.now()-t0);
                            // $(".rd").on("click", function(e){
                            //     //this selected could be a lot nicer
                            //     var the_id = $(this).attr("id");
                            //     console.log("user is trying to read article "+the_id);
                            //     var show_article_tab = $('#show_article_'+the_id);
                            //     if(show_article_tab.length == 0){
                            //         console.log("expanding");
                            //         expand_article(the_id);
                            //     }else{
                            //         console.log("showing");
                            //         show_article_tab.click();
                            //     }
                            // });
                            if(counter>0){
                                $('#results_sort_buttons').show();
                            }
                            $('#search').button('reset');
                        }
                    });
                };

                // articles_db.each(function(article, i){
                //     console.log(i+' searched');
                //     cur_a = article.value;
                //     var thing_to_search = cur_a["title"]+" "+cur_a["body"]+" "+cur_a["summary"];
                //     // pbar.width(((75*i/total) + 25).toString()+'%');
                //     // testing
                //     if(thing_to_search.match(AND_re) != null){
                //         counter = counter + 1;
                //         var matches = thing_to_search.match(OR_re);
                //         // console.log(counter.toString()+") "+cur_a["title"].toString());
                //         var lyo = make_article_layout();
                //         lyo.find("#title").html(cur_a["title"]);
                //         //xrank is the kw density
                //         //let title be more important than body
                //         // var xrank = (1.0 * matches.length) / thing_to_search.length;
                //         // if(cur_a["title"] != null){
                //         //     var m2 = cur_a["title"].match(OR_re);
                //         //     if(m2 != null){
                //         //         xrank = (xrank * m2.length);
                //         //     }
                //         // }
                //         lyo.find("#match_count").text(matches.length.toString());
                //         // lyo.find("#xrank").text(xrank.toString());
                //         lyo.attr("id", "partial_"+cur_a["_id"]);
                //         lyo.find(".rd").attr("id", cur_a["_id"]);
                //         //lyo.find("#body").text(cur_a["body"]);
                //         var d = new Date(cur_a["published_at"].toString());
                //         lyo.find("#published_at").text(d.toDateString());
                //         var pb_time = Math.round(d.valueOf() / 1000).toString();
                //         lyo.find("#pb_time").text(pb_time);
                //         lyo.find("#author").text(cur_a["author"]);
                //         get_paper(cur_a["paper_id"], lyo.find("#source"));
                //         lyo.find("#url").text(cur_a["url"]);
                //     }else{
                //         console.log('nope');
                //     }
                //     //if we're on the last article, do all this stuff
                //     if(i + 1 == total){
                //         $('#number_of_results').text(counter.toString());
                //         $(".progress").hide();
                //         derp("#match_count");
                //         console.log(counter.toString()+" results")
                //         console.log('search took this long in ms:');
                //         console.log(Date.now()-t0);
                //         $(".rd").on("click", function(e){
                //             //this selected could be a lot nicer
                //             var the_id = $(this).attr("id");
                //             console.log("user is trying to read article "+the_id);
                //             var show_article_tab = $('#show_article_'+the_id);
                //             if(show_article_tab.length == 0){
                //                 console.log("expanding");
                //                 expand_article(the_id);
                //             }else{
                //                 console.log("showing");
                //                 show_article_tab.click();
                //             }
                //         });
                //         if(counter>0){
                //             $('#results_sort_buttons').show();
                //         }
                //         $('#search').button('reset');
                //     }
                // });
            });
            function bm_dne(e){
                console.log("the bookmark does not exist, create it");
                var t_id = $(this).attr("id").replace("bkmrk_", "");
                var n = $('#bkmrk_'+t_id);
                n.click(bm_de);
                n.removeClass('btn-warning');
                n.addClass('btn-danger');
                create_bookmark(t_id);
            }
            function bm_de(e){
                console.log("the bookmark does exist, remove it");
                var t_id = $(this).attr("id").replace("bkmrk_", "");
                var n = $('#bkmrk_'+t_id);
                n.click(bm_dne);
                n.removeClass('btn-danger');
                n.addClass('btn-warning');
                remove_bookmark(t_id);
            }
            function make_article_layout(){
                var template = $("#article_template");
                var cont = $("#article_list");
                var n = template.contents().clone();
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
                n.appendTo(articles_nav);
                n.show();
                //create view //and then will also click on the tab
                open_article(article_id);
            }
            function open_article(article_id){
                //get the partial
                var template = $('#partial_'+article_id);
                console.log(template.length);
                console.log(template.find('.rd').text().length);
                var s = template.find('.rd').text();
                console.log(s);
                var tab_b = $('#show_article_'+article_id);
                tab_b.find('.txtv').text(' '+s.substring(0, 14)+'...');
                tab_b.find('.txtv').attr('title', s);
                console.log(s.substring(0, 16));
                var cont = $("#articles_view");
                //build a view rfom the partial
                var n = template.clone();
                n.attr('id', 'article_'+article_id+'_view');
                n.find('.rd').parent().hide();
                n.find('.bck').parent().show();
                n.find('.cls').parent().show();
                n.find('.cls').click(function(e){
                    //kill the tab
                    $('#show_article_'+article_id).parent().remove();
                    //go back to search results if there are no more open articles
                    if($('#articles_view').children().length != 0){
                        //switch back to other view
                        $('#buttons').find('li').last().find('a').click();
                    }
                    //kill the view
                    n.remove();
                });
                n.find('#body_well').show();
                n.appendTo(cont);
                //because doing the 'get' could take some time, display text
                // Doing this during search for now...
                // consider moving back here later...
                // n.find('#body_text').text('Loading article body...');
                // articles_db.get(article_id, function(obj){
                //     console.log(obj);
                //     var article_json = obj.value;
                //     //actually assign all of the fields, lol
                //     // show line breaks as in the string
                //     var article_body = article_json['body'];
                //     var formatted_article = htmlify_spacing(article_body);
                //     n.find('#body_text').html(formatted_article);
                //     //click on the tab to actually show everything
                // });
                n.show();
                tab_b.click();
            }

            $("#clear_db").click(function(e){
                lawnchair.nuke();
                papers_db.nuke();
                articles_db.nuke();

                console.log('nuke dropped on lawnchair');

            });
            //view controls
            $(document).on("click", '.shw', function(e){
                var id = $(this).attr("id");
                var vname = id.replace("show_", "");
                vname = "#"+vname + "_view";
                $(".vw").hide();
                $(".shw.active").removeClass("active");
                // $(".shw").find("span").hide();
                $(this).addClass("active");
                // $(this).find("span").show();
                if(id.indexOf("article") != -1){
                    //show opened articles list
                    $('#articles_view').show();
                    //hide items in list, you'll show the specific one later
                    $('#articles_view').children().hide();
                    console.log('clicked on an article tab');
                }else{
                    console.log('clicked on not an article tab');
                }
                if(id.indexOf('search') != -1){
                    move_search('results');
                }else if(id.indexOf('home') != -1){
                    move_search('home');
                }
                $(vname).show();
            });
            $(document).on("click", '.bck', function(e){
                //maybe check if there are results to show first
                //also maybe keep track of last shown view and click on that one
                $('#show_search').click();
            });
            $(document).on("click", '#just_title', function(e){
                var self = $(this);
                if (self.hasClass('active')){
                    self.find('i').addClass('icon-ok');
                    self.find('span').text('only in Title');
                }else{
                    self.find('i').removeClass('icon-ok');
                    self.find('span').text('in Everything');
                }
            });
            //Download Paper Info to get Full paper names
            function download_paper_info(){
                $.getJSON('https://www.extempengine.com/papers.json', function(jsondata){
                    //trying to batch save here
                    //it seems to work
                    var arr = [];
                    $.each(jsondata, function(index, data){
                        var obj = {};
                        obj["value"] = data;
                        obj["key"] = data["_id"];
                        arr.push(obj);
                    });
                    papers_db.batch(arr);
                });
            }
            function get_paper(paper_id, target_element){
                papers_db.get(paper_id, function(data){
                    target_element.text(data.value['name']);
                });
            }

            var article_keys = [];

            function save_article_keys(keys){
                article_keys = keys;
                $('#search').button('reset');
                lawnchair.exists('article_keys', function(bool){
                    if(bool){
                        lawnchair.get('article_keys', function(obj){
                            if(obj.value != keys){
                                lawnchair.save({key:'article_keys', value:keys});
                            }else{
                                article_keys = keys
                            }
                        });
                    }else{
                        lawnchair.save({key:'article_keys', value:keys});
                    }
                });
            }
            //remember to call this method after new articles are added
            function cache_article_keys(){
                $('#search').button('loading');
                lawnchair.exists('article_keys', function(bool){
                    if(bool){
                        lawnchair.get('article_keys', function(obj){
                            article_keys = obj.value;
                            $('#search').button('reset');
                        });
                    }else{
                        update_article_keys();
                    }
                });
            }

            function update_article_keys(){
                $('#search').button('loading');
                articles_db.keys(function(keys){
                    save_article_keys(keys);
                });
            }


            //Bookmarks
            function add_bookmark(article_id){
                lawnchair.exists("bookmarks", function(bool){
                    if(bool){                
                        lawnchair.get("bookmarks", function(obj){
                            obj.push(article_id);
                            lawnchair.save({key:"bookmarks", value:obj});
                        });
                    }else{                
                        obj = [article_id];
                        lawnchair.save({key:"bookmarks", value:obj});
                    }
                    //create partial
                    create_bookmark(article_id);
                });
            }
            function create_bookmark(article_id){
                var template = $('#partial_'+article_id);
                console.log(template.length);
                //build a view rfom the partial
                var n = template.clone();
                n.attr('id', 'article_'+article_id+'_bookmark');
                n.find('.bck').parent().show();
                n.find('.bck').click(function(e){
                    $('#show_search').click();
                });
                n.show();
            }
            function remove_bookmark(article_id){
                lawnchair.exists("bookmarks", function(bool){
                    //bookmarks exist, proceed...
                    if(bool){                
                        lawnchair.get("bookmarks", function(obj){
                            var idx = obj.indexOf(article_id); // Find the index
                            if(idx != -1) {
                                obj.splice(idx, 1); // Remove it if really found!
                                lawnchair.save({key:"bookmarks", value:obj});
                            }else{
                                //this article_id is not bookmarked...
                            }
                        });
                    } else{
                        //there are no bookmarks bro
                    }
                });
            }
            function htmlify_spacing(string_with_newlines){
                console.log(string_with_newlines);
                string_with_newlines = '<p>' + string_with_newlines.replace(/\n/g, '</p><p>') + '</p>';
                console.log(string_with_newlines);
                return string_with_newlines;
            }
        }); // end lawnchair shit and jquery block
    } //done with report
}; //done defining app

