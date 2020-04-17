const size = 20;
const socket = io();

let rot = 0;
function rotX(x) {
  if (rot === 0) return x;
  return 1024 - x;
}
function rotY(y) {
  if (rot === 0) return y;
  return 576 - y;
}
function doRotate() {
  rot = 180;
  document.getElementById('bg').style.transform = 'rotate(180deg)';
}

function create(event) {
  if (!event.ctrlKey) return;
  console.log('create', event.pageX, event.pageY);
  id = (Math.random() * 9000000) | (0 + 1000000);
  createPebble(id, event.pageX, event.pageY);
  socket.emit('create', { id: id, x: rotX(event.pageX), y: rotY(event.pageY) });
}

function getById(id) {
  const children = document.getElementById('canvas').children;
  for (let i = 0; i < children.length; i++) {
    if (children[i].dataset.id == id) return children[i];
  }
  return null;
}

function move(event) {
  event.stopPropagation();
  console.log('move', event.target.dataset.id, event.pageX, event.pageY);
}

function drop(event) {
  event.stopPropagation();
  console.log(event);
  console.log('drop', event.target.dataset.id, event.pageX, event.pageY);
  movePebble(event.target.dataset.id, event.pageX, event.pageY);
  socket.emit('move', {
    id: event.target.dataset.id,
    x: rotX(event.pageX),
    y: rotY(event.pageY)
  });
  const g = document.getElementById('g');
  while (g.childNodes.length > 0) {
    g.removeChild(g.childNodes[0]);
  }
}

function createPebble(id, x, y, backURL) {
  const elem = document.createElement('div');
  elem.style.width = `${size}px`;
  elem.style.height = `${size}px`;
  elem.style.position = 'absolute';
  elem.style.borderRadius = `${size / 2}px`;
  elem.style.left = `${x - size / 2}px`;
  elem.style.top = `${y - size / 2}px`;
  if (backURL) elem.style.backgroundImage = `url(${backURL})`;
  else elem.style.backgroundColor = 'red';
  elem.draggable = true;
  elem.addEventListener('dragstart', event => {
    move(event);
  });
  elem.addEventListener('dragend', event => {
    drop(event);
  });
  elem.dataset.id = id;
  document.getElementById('canvas').append(elem);
}

function movePebble(id, x, y) {
  const elem = getById(id);
  if (!elem) return;
  const oldX = elem.style.left.split('p')[0] - -size / 2;
  const oldY = elem.style.top.split('p')[0] - -size / 2;
  const newX = x;
  const newY = y;

  elem.style.left = `${x - size / 2}px`;
  elem.style.top = `${y - size / 2}px`;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttributeNS(null, 'marker-end', 'url(#head)');
  path.setAttributeNS(null, 'stroke-width', '6');
  path.setAttributeNS(null, 'fill', 'none');
  path.setAttributeNS(null, 'stroke', 'cyan');
  path.setAttributeNS(null, 'd', `M ${oldX} ${oldY} ${newX} ${newY}`);
  document.getElementById('g').appendChild(path);
}

function table(backURL) {
  const bg = document.getElementById('bg');
  bg.style.backgroundImage = `url(${backURL})`;
}

socket.on('created', data => {
  console.log('created back', data);
  if (!getById(data.id))
    createPebble(data.id, rotX(data.x), rotY(data.y), data.backURL);
});
socket.on('moved', data => {
  console.log('moved back', data);
  if (getById(data.id)) movePebble(data.id, rotX(data.x), rotY(data.y));
});
socket.on('tabled', data => {
  console.log('tabled back', data);
  table(data.backURL);
});

document.addEventListener(
  'dragover',
  function(event) {
    event.preventDefault();
  },
  false
);

document.addEventListener(
  'drop',
  function(event) {
    // cancel default actions
    event.preventDefault();

    console.log(event.pageX, event.pageY);

    var i = 0,
      files = event && event.dataTransfer && event.dataTransfer.files,
      len = (files && files.length) || 0;

    const baseX = 727;
    const baseY = 47;
    let j = 0;
    for (; i < len; i++) {
      var reader = new FileReader();
      reader.onload = function(event) {
        var contents = event.target.result;
        console.log(contents);

        if (contents.length < 1000) {
          id = (Math.random() * 9000000) | (0 + 1000000);
          createPebble(
            id,
            baseX + (j % 8) * 25,
            baseY + Math.floor(j / 8) * 25,
            contents
          );
          socket.emit('create', {
            id: id,
            x: rotX(baseX + (j % 8) * 25),
            y: rotY(baseY + Math.floor(j / 8) * 25),
            backURL: contents
          });
          j++;
        } else {
          console.log('krukkk');
          table(contents);
          socket.emit('table', { backURL: contents });
        }

        try {
          // todo
        } catch {
          console.error('Not proper JSON, hey!');
        }
      };

      reader.onerror = function(event) {
        console.error(
          'File could not be read! Code ' + event.target.error.code
        );
      };

      if (files) reader.readAsDataURL(files[i]);
    }
  },
  false
);

function sendAllPebles() {
  const children = document.getElementById('canvas').children;
  for (let i = 0; i < children.length; i++) {
    const elem = children[i];
    const x = elem.style.left.split('p')[0] - -size / 2;
    const y = elem.style.top.split('p')[0] - -size / 2;
    const id = elem.dataset.id;
    const backURL = elem.style.backgroundImage.slice(
      4,
      elem.style.backgroundImage.length - 1
    );
    socket.emit('create', { x: rotX(x), y: rotY(y), id, backURL });
  }
}
