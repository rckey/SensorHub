const {ipcRenderer} = require('electron');
const STREAM = require('./classes/stream');

let streams = [];
let selected;
let map;

let running = false;

function init() {

  let location = {lat: 40.65, lng: -73.91};
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 15,
    center: location,
    streetViewControl: false
  });

  /* prototyping */
  /*
    let ROOTS = ['NQQJGLSDHCPNRNZXNOKEOFL9OBYRIPKY9RBWUPBXGDMAOHZCYPOOUPKNKZVPHXAFLZAUYCUTEZAT9XFOC',
                  'RGWHXSDJIGGRFPEWBPICCLLLDVUMWGUXGLZZKECPFFYIACTGVVGUIAYDUGZDKFKSEJJUFVNXKRYPCWHIX',
                   'TRUAYCTIN9HAOXRLWQDGVLWEKMRHXIACVPPLWPTJHCULEUWUYSOTTHN9HKALHRUTSDBMGCRJ9PUOFHVWU']

    ROOTS.forEach(root => {
      addStream(root);
    })

    fetchStream(0);
    */
}

$("#quickAdd").keypress(function (_e) {
  if (_e.which === 13 && _e.target.value != '') {

    addStream(_e.target.value);
    _e.target.value = '';
  }
});

ipcRenderer.on('setRoot', (event, id, _newRoot) => {

  streams[id].root = _newRoot;
  /* next stream */
  setTimeout(fetchStream, 1000, ++id);
});

ipcRenderer.on('fetchPacket', (event, _packet, id) => {

  if (streams[id].id == '') {

    $('#temp_ctx').children().hide();
    $('#press_ctx').children().hide();
    $('#hum_ctx').children().hide();
    $('#gas_ctx').children().hide();

    $('#temp_ctx').append('<canvas id="' + streams[id].firstRoot + '_temperature_ctx"></canvas>');
    $('#press_ctx').append('<canvas id="' + streams[id].firstRoot + '_pressure_ctx"></canvas>');
    $('#hum_ctx').append('<canvas id="' + streams[id].firstRoot + '_humidity_ctx"></canvas>');
    $('#gas_ctx').append('<canvas id="' + streams[id].firstRoot + '_gasResistance_ctx"></canvas>');
  }

  $('#' + streams[id].streamLabel).html(_packet.id);
  streams[id].id = _packet.id;

  let location = {lat: _packet.location.lat, lng: _packet.location.lng};
  streams[id].location = location;
  streams[id].marker.setPosition(location);

  streams[id].lastUpdate = _packet.timestamp;

  /* for prototyping */
  let d1 = {'temperature': _packet.data[0].temperature}
  streams[id].addData(d1, _packet.timestamp);
  let d2 = {'pressure': _packet.data[0].pressure}
  streams[id].addData(d2, _packet.timestamp);
  let d3 = {'humidity': _packet.data[0].humidity}
  streams[id].addData(d3, _packet.timestamp);
  let d4 = {'gasResistance': _packet.data[0].gasResistance}
  streams[id].addData(d4, _packet.timestamp);

  if (selected != null && selected == id) {
    select(id);
  }
});

function fetchStream (id) {

  id = id > streams.length - 1 ? 0 : id;

  highlight(id);
  ipcRenderer.send('fetchRoot', streams[id].root, id);
}

function select (id) {

  $('#stream_nav > div').each(function () {
    $(this).removeClass('active');
  });

  $('#label_' + id).addClass('active');
  selected = id;

  map_panTo(streams[id].location);
  debug();
}

function addStream (root) {
  let s = new STREAM(root);
  let id = streams.length;
  s.streamLabel= 'label_' + id + '_title';
  streams.push(s);

  $('#stream_nav').append('<div class="stream_label" id="label_' + id + '" onclick="select(' + id + ');">' + '<h5 id="' + s.streamLabel+ '">...' + '</h5><span id="sync_indicator_' + id + '" class="label label-white">< 10 sec<span></div>');

  selected = id;

  if (running == false) {
    running = true;
    fetchStream(0);
  }
}

function map_panTo (location) {
  map.panTo(location);
}

function debug () {

 if (streams[selected].datasets == undefined)
  return;

  let data = streams[selected].datasets;


  // SET OUTPUT

  $('#title').text(streams[selected].id);
  $('#loc').text('Lat: ' + streams[selected].location.lat + ' Lng: ' + streams[selected].location.lng);
  $('#temp').text(data.temperature[data.temperature.length - 1]);
  $('#press').text(data.pressure[data.pressure.length - 1]);
  $('#hum').text(data.humidity[data.humidity.length - 1]);
  $('#gas').text(data.gasResistance[data.gasResistance.length - 1]);


  // SET CHARTS

  $('#temp_ctx').children().hide();
  $('#press_ctx').children().hide();
  $('#hum_ctx').children().hide();
  $('#gas_ctx').children().hide();

  $('#' + streams[selected].firstRoot + '_temperature_ctx').show();
  $('#' + streams[selected].firstRoot + '_pressure_ctx').show();
  $('#' + streams[selected].firstRoot + '_humidity_ctx').show();
  $('#' + streams[selected].firstRoot + '_gasResistance_ctx').show();


  //SET HISTORY

  $('#history_title').html(streams[selected].id);
  $('#history_table').html('');

  Object.keys(data).forEach(function (key) {
    $('#history_table').append('<h4>' + key + ':</h4></br>');
    data[key].forEach(function (value) {
      $('#history_table').append('&nbsp&nbsp&nbsp&nbsp' + value + '</br>');
    })
});
}

function highlight (id) {

  $('#stream_nav > div > span').each(function () {
    $(this).removeClass('highlight');
  });

  $('#sync_indicator_' + id).addClass('highlight');
}
