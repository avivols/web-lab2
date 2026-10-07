const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const scale = 40;

let results = [];

function drawArea(R){
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(scale, -scale);
    ctx.translate(0.5/scale, 0.5/scale);

    ctx.fillStyle = '#5F8ACE';

    // rectangle part
    ctx.fillRect(0, 0, R/2, R);

    // sector part
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0, 0, R, Math.PI, 3*Math.PI/2, false);
    ctx.closePath();
    ctx.fill();

    // triangle part
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(R, 0);
    ctx.lineTo(0, -R/2);
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

function drawPoint(x, y){
    ctx.setTransform(1, 0 , 0, 1, 0, 0);
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.scale(scale, -scale);
    ctx.translate(0.5/scale, 0.5/scale);

    ctx.fillStyle = 'black';

    ctx.beginPath();
    ctx.arc(x, y, 4/scale, 0, 2*Math.PI);
    ctx.fill();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

let selectedX = null;
const xButtons = document.querySelectorAll('#xButtons button');

xButtons.forEach(button => {
    button.addEventListener('click', () => {
        selectedX = button.dataset.value;

        xButtons.forEach(b => { b.classList.remove('active'); });
        button.classList.add('active');
    });
});

// function for validating Y and R
function isInRange(value, min, max){
    if (value.trim()==='') return false;
    const num = Number(value);
    if (isNaN(num)) return false;
    return num >= min && num <= max;
}

// constants for Y & R range
const yMin = -5;
const yMax = 5;

const rMin = 2;
const rMax = 5;

function toScaledBigInt(str, scale = 40) {
    let s = str.trim();
    let sign = 1n;
    if (s.startsWith('-')){
        sign = -1n;
        s = s.slice(1);
    }

    let [initPart, fracPart = ''] = s.split('.');
    fracPart = (fracPart + '0'.repeat(scale)).slice(0, scale);

    return sign * BigInt(initPart + fracPart);
}


const form = document.getElementById('pointForm');
form.addEventListener('submit', (event) => {
    event.preventDefault();

    const y = document.getElementById('yValue').value;
    const r = document.getElementById('rValue').value;

    const yValid = isInRange(y, yMin, yMax);
    const rValid = isInRange(r, rMin, rMax);

    if (!selectedX || !yValid || !rValid){
        errorMessage.textContent = 'Проверьте введенные координаты: X, Y [-5..5], R[2..5]';
        return;
    }

    errorMessage.textContent = '';

    const xVal = Number(selectedX);
    const yVal = Number(y);
    const rVal = Number(r);

    const xScaled = toScaledBigInt(selectedX);
    const yScaled = toScaledBigInt(y);
    const rScaled = toScaledBigInt(r);

    const hit = isInArea(xScaled, yScaled, rScaled);

    drawArea(rVal);
    drawPoint(xVal, yVal);

    const record = {
        x: xVal,
        y: y,
        r: r,
        hit: hit,
        date: new Date().toISOString()
    };
    results.push(record);

    localStorage.setItem('results', JSON.stringify(results));

    addResultRow(record);
});


// functions for checking the hit
function isInRectangle(xS, yS, RS) {
    return xS>= 0n && (2n * xS)<= RS && yS>=0n && yS<=RS;
}

function isInSector(xS, yS, RS){
    return xS<=0n && yS<=0n && (xS**2n + yS**2n) <= RS**2n;
}

function isInTriangle(xS, yS, RS){
    return xS>=0n && yS<=0n && yS * 2n>=2n * xS - RS;
}

function isInArea(x, y, R){
    return isInRectangle(x, y, R) || isInSector(x, y, R) || isInTriangle(x, y, R);
}

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

    const dateTimeText = new Date(record.date).toLocaleString('ru-RU');

    const cellX = document.createElement('td');
    cellX.textContent = record.x;

    const cellY = document.createElement('td');
    cellY.textContent = record.y;

    const cellR = document.createElement('td');
    cellR.textContent = record.r;

    // required for pseudoelement
    const cellRes = document.createElement('td');
    cellRes.textContent = resultText;

    if (record.hit){
        cellRes.classList.add('hit');
    } else {
        cellRes.classList.add('missed');
    }

    const cellDateTime = document.createElement('td');
    cellDateTime.textContent = dateTimeText;

    row.appendChild(cellX);
    row.appendChild(cellY);
    row.appendChild(cellR);
    row.appendChild(cellRes);
    row.appendChild(cellDateTime);

    tbody.appendChild(row);
}

const saved = localStorage.getItem('results');

if (saved) {
    results = JSON.parse(saved);
    results.forEach(record => {
        addResultRow(record);
    });
}

const clearButton = document.getElementById("clearHistory");
clearButton.addEventListener('click', () => {
    results = [];
    localStorage.removeItem('results');

    const tbody = document.getElementById('resultBody');
    tbody.innerHTML = '';
});

