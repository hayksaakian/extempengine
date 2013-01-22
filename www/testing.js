var lawnchair = Lawnchair({name:'tester_db'},function(e){
  console.log('storage open '+e.name+' in '+e.adapter);
  setTimeout(count, 200);
});
// var lorem = 'short';
lorem = $('#lorem').text();
var counter = 0;
$(document).on('click', 'button', function(){
  var id = $(this).attr('id');
  if(id == 'add_100'){
    add_dummies(100);
  }else if(id == 'add_1000'){
    add_dummies(1000);
  }else if(id == 'add_9001'){
    add_dummies(9001);
  }else if(id == 'read_all'){
    read_all();
  }else if(id == 'count'){
    count();
  }else if(id == 'nuke'){
    nuke();
    $('#counter').text('0');
  }
});

function add_dummies(quantity){
  if(quantity > 1){
    var tosave = []
    for (var i = quantity - 1; i >= 0; i--) {
      var uuid = 'k'+lawnchair.uuid();
      var val = 'v'+lawnchair.uuid();
      tosave.push({key:uuid, value:{num:val, text:lorem}})
    };
    console.log(tosave)
    lawnchair.batch(tosave, function(e){
      console.log(e);
    })
  }else{
    var uuid = lawnchair.uuid();
    var val = 'heres a '+lawnchair.uuid()+' value';
    lawnchair.save({key:uuid, value:{num:val, text:lorem}}, function(e){
      console.log(e);
    })
  }
  $ct = $('#counter')
  counter += quantity;
  $ct.text(parseInt($ct.text())+quantity)
}

function nuke(){
  counter = 0;
  lawnchair.nuke();
}

function read_all(){
  console.log('starting read all');
  $('#output').html('');
  var output = [];
  var total = counter;
  lawnchair.each(function(dummy, i){
    console.log(dummy);
    //console.log(dummy.value);
    output.push(JSON.stringify(i+'...'+dummy.key));
    if (total - 1 == i){
      console.log('done reading '+(i+1)+' records');
      $('#output').html(output.join('<br>'));     
    }else {
      if (total % i <= 3){
        console.log(i+'...'+dummy.key)
      }
    }
  });
}

function search_for(text){
  console.log('starting search for '+text);
  var output = [];
  var total = counter;
  lawnchair.each(function(dummy, i){
    //console.log(dummy.value);
    if(dummy.value.num.indexOf(text) != -1){
      console.log(i+'...yes...'+dummy.value.num)
      output.push(JSON.stringify(i+'...'+dummy.value.num));
    }else {
      if (total % i <= 3){
        console.log(i+'...no...'+dummy.value.num)
      }
    }
    if (total - 1 == i){
      console.log('done reading '+(i+1)+' records');
      $('#output').html(output.join('<br>'));     
    }
  });  
}

function count(){
  console.log('counting');
  $('#counter').text(0);  
  count_with_all();
  // count_with_each();
}

function count_with_all(){
  lawnchair.all(function(derp){
    counter = derp.length;
    $('#counter').text(counter);  
    console.log('done counting '+counter)          
  });
}

function count_with_each(){
  lawnchair.each(function(derp, i){
    $('#counter').text(i+1); 
    console.log('maybe done counting '+i) 
  });
}


// fffb22eb-79e4-5f00-0ada-302d9b66bf43 
// getSizeOfPersisted('fffb22eb-79e4-5f00-0ada-302d9b66bf43')

function getSizeOfPersisted(key){
  lawnchair.get(key, function(obj){
    console.log(roughSizeOfObject(obj));
  });
}

function roughSizeOfObject( object ) {
  var objectList = [];
  var stack = [ object ];
  var bytes = 0;

  while ( stack.length ) {
      var value = stack.pop();

      if ( typeof value === 'boolean' ) {
          bytes += 4;
      }
      else if ( typeof value === 'string' ) {
          bytes += value.length * 2;
      }
      else if ( typeof value === 'number' ) {
          bytes += 8;
      }
      else if
      (
          typeof value === 'object'
          && objectList.indexOf( value ) === -1
      )
      {
          objectList.push( value );

          for( i in value ) {
              stack.push( value[ i ] );
          }
      }
  }
  return bytes;
}