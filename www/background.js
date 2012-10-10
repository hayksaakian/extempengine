chrome.experimental.app.onLaunched.addListener(function() {
  // chrome.app.window.create('window.html', {
  //   'width': 400,
  //   'height': 500
  // });
  //alert('I am a background page!');
  console.log('made it!');
  var notification = webkitNotifications.createNotification(
  	'Hello!',
  	'Lorum etc'
  	);
  notification.show();
});