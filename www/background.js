var lawnchair = null;
chrome.app.runtime.onLaunched.addListener(function() {
  // chrome.app.window.create('window.html', {
  // 	width: 400,
  // 	height: 200
  // });
  chrome.app.window.create('index.html', {
  	width: 800,
  	height: 400
  });
	//notify('Hello Notification!');
  // articles_db = Lawnchair({name:'articles_db'},function(e){
  //   console.log('storage open');
		// showArticleCount();
		// articles_db.keys( function(keys){
		//  	for (var i = keys.length - 1; i >= 0; i--) {
		//  		articles_db.get(keys[i], function(article){
		// 	  	console.log(article.value['title']);
		// 	  });
		//  	};
		//  	// console.log(objs[0]);
		//  	// 50eb6a1930197b0002000001

		//   // articles_db.get(keys[0], function(article){
		//   // 	console.log(article.value['title']);
		//   // });
		//  	console.log('opened');
		// });
  // });
  // papers_db.each(function(article, i){
  // 	console.log(i);
  // });

  // articles_db.each(function(article, i){
  // 	console.log(i);
  // });

	// articles_db.all(function(objs){
	// 	console.log(objs.length);
	// });

  // articles_db.get('50eb6a1930197b0002000001', function(article){
  // 	console.log(article.value['title']);
  // });
  // console.log('last js');
});
function doThing(){
	console.log('a thing')
}
function notify(title, body){
	if(!body){
		body = '';
	}
	var notification = webkitNotifications.createNotification(
		//icon url path is borked, using web hosted icon url
	  'http://i.imgur.com/20yz0.png',  // icon url - can be relative
	  title,  // notification title
	  body  // notification body text
	);
	notification.show();
  // setTimeout(function(){notification.cancel();}, 5000);
}
function showArticleCount(){
  lawnchair.get('article_count', function(artcnt){
    var tt = parseInt(artcnt.value['total'].toString());
    notify('total', '='+tt);
  });
}
