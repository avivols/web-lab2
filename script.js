const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const errorMessage = document.getElementById('errorMessage');
const SERVER_URL = '/fcgi-bin/lab2.jar';

const scale = 40;

function drawArea(R){
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(scale, -scale);
    ctx.translate(0.5/scale, 0.5/scale);

    ctx.fillStyle = '#5F8ACE';

    // rectangle part
    ctx.fillRect(0, 0, -R, -R);

    // sector part
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0, 0, R, 3*Math.PI/2, 0, false);
    ctx.closePath();
    ctx.fill();

    // triangle part
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(R, 0);
    ctx.lineTo(0, R/2);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // axes
    ctx.lineWidth = 1/scale;
    ctx.strokeStyle='black';
    // x-axis
    ctx.beginPath();
    ctx.moveTo(-canvas.width/2/scale + 10/scale, 0);
    ctx.lineTo(canvas.width/2/scale - 10/scale, 0);
    ctx.stroke();
    // y-axis
    ctx.beginPath();
    ctx.moveTo(0, -canvas.height/2/scale + 10/scale);
    ctx.lineTo(0, canvas.height/2/scale -10/scale);
    ctx.stroke();

    drawTickY(R);
    drawTickY(R/2);
    drawTickY(-R);
    drawTickY(-R/2);

    drawTickX(R);
    drawTickX(R/2);
    drawTickX(-R);
    drawTickX(-R/2);

    function drawArrow(fromX, fromY, toX, toY) {
        const size = 8;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - size * Math.cos(angle - Math.PI/6), toY - size * Math.sin(angle - Math.PI/6));
        ctx.lineTo(toX - size * Math.cos(angle + Math.PI/6), toY - size * Math.sin(angle + Math.PI/6));
        ctx.closePath();
        ctx.fill();
    }

    function drawTickX(x) {
        ctx.lineWidth = 1/scale;
        const tickSize = 5/scale;
        ctx.beginPath();
        ctx.moveTo(x, -tickSize);
        ctx.lineTo(x, tickSize);
        ctx.stroke();
    }

    function drawTickY(y) {
        ctx.lineWidth = 1/scale;
        const tickSize = 5/scale;
        ctx.beginPath();
        ctx.moveTo(-tickSize, y);
        ctx.lineTo(tickSize, y);
        ctx.stroke();
    }

    ctx.save();
    ctx.scale(1, -1);
    const fontSize = 17/scale;
    ctx.font = fontSize + 'px serif';
    ctx.fillStyle = 'black';

    // TEXT R, R/2, -R, -R/2
    // по Y
    ctx.fillText('R', 0.5, -R);
    ctx.fillText('R/2', 0.5, -R/2);
    ctx.fillText('-R/2', 0.5, R/2);
    ctx.fillText('-R', 0.5, R);

    // по X
    ctx.fillText('R', R - 0.1, -0.5);
    ctx.fillText('R/2', R/2 - 0.25, -0.5);
    ctx.fillText('-R/2', -R/2 - 0.25, -0.5);
    ctx.fillText('-R', -R - 0.25, -0.5);

    ctx.restore();

    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = 'black';
    ctx.font = '16px serif';

    drawArrow(20, cy, canvas.width - 10, cy);
    drawArrow(cx, canvas.height - 20, cx, 10);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('x', canvas.width - 15, cy - 8);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('y', cx + 8, 12);
}

function drawPoint(x, y, hit){
    ctx.setTransform(1, 0 , 0, 1, 0, 0);
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(scale, -scale);
    ctx.translate(0.5/scale, 0.5/scale);

    if (hit) {
        ctx.fillStyle = '#00EB0B';
    } else {
        ctx.fillStyle = '#FF0000';
    }


    ctx.beginPath();
    ctx.arc(x, y, 4/scale, 0, 2*Math.PI);
    ctx.fill();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// function for validating Y and R
function isInRange(value, min, max){
    if (value.trim()==='') return false;
    const num = Number(value);
    if (isNaN(num)) return false;
    return num >= min && num <= max;
}

// constants for Y & R range
const yMin = -3;
const yMax = 5;

const rMin = 1;
const rMax = 4;

const form = document.getElementById('pointForm');
form.addEventListener('submit', async(event) => {
    event.preventDefault();

    const checkedX = document.querySelector('input[name="x"]:checked');
    const y = document.getElementById('yValue').value.trim();
    const r = document.getElementById('rValue').value.trim();

    if (!checkedX || !isInRange(y, yMin, yMax) || !isInRange(r, rMin, rMax)){
        errorMessage.textContent = 'Проверьте введенные координаты: X, Y [-3..5], R[1..4]';
        return;
    }
    errorMessage.textContent = '';

    const params = new URLSearchParams({ x: checkedX.value, y: y, r: r});

    try{
        const response = await fetch(SERVER_URL + '?' + params);
        const data = await response.json();

        if (!response.ok) {
            errorMessage.textContent = 'Ошибка: ' + data.error;
            return;
        }

        const last = data.history[data.history.length - 1];
        drawArea(Number(r));
        drawPoint(Number(last.x), Number(last.y), last.hit);
        renderTable(data.history);
    } catch (e) {
        errorMessage.textContent = 'Сервер недоступен';
    }
});

drawArea(3);

function addResultRow(record){
    const tbody = document.getElementById('resultBody');
    const row = document.createElement('tr');

    let resultText;
    if (record.hit) {
        resultText = 'Попадание';
    } else {
        resultText = 'Промах'
    }

    const dateTimeText = record.time;

    const cellX = document.createElement('td');
    cellX.textContent = record.x;

    const cellY = document.createElement('td');
    cellY.textContent = record.y;

    const cellR = document.createElement('td');
    cellR.textContent = record.r;

    const cellRes = document.createElement('td');
    cellRes.textContent = resultText;

    if (record.hit){
        cellRes.classList.add('hit');
    } else {
        cellRes.classList.add('missed');
    }

    const cellDateTime = document.createElement('td');
    cellDateTime.textContent = dateTimeText;

    const cellExecTime = document.createElement('td');
    cellExecTime.textContent = record.execTime;

    row.appendChild(cellX);
    row.appendChild(cellY);
    row.appendChild(cellR);
    row.appendChild(cellRes);
    row.appendChild(cellDateTime);
    row.appendChild(cellExecTime);

    tbody.appendChild(row);
}

function renderTable(history){
    const tbody = document.getElementById('resultBody');
    tbody.innerHTML = '';
    history.forEach(record => addResultRow(record));
}

const clearButton = document.getElementById("clearHistory");
clearButton.addEventListener('click', async () => {
    try {
        const response = await fetch(SERVER_URL + '?clear=true');
        const data = await response.json();
        renderTable(data.history);
    } catch (e) {
        errorMessage.textContent = 'Сервер недоступен';
    }
});

async function loadHistory(){
    try{
        const response = await fetch(SERVER_URL);
        const data = await response.json();
        renderTable(data.history);
    } catch (e) {
        errorMessage.textContent = 'Сервер недоступен';
    }
}

loadHistory();