const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

document.body.classList.add("stop-scrolling");

// canvas.width = window.innerWidth;
canvas.height = window.innerHeight;





ctx.fillStyle = "rgb(200 0 0)";
ctx.beginPath();
ctx.arc(500, 500, 100, 0, Math.PI*2, 1);
ctx.fill();

window.requestAnimationFrame(draw);

let flightRadius = 200;
let targetRadius = 200;
let shipWidth = 25;
let shipHeight = 25;

let shipRotation = 0;
let shipRotationSpeed = 0.01;
changeShipSpeed();

let planetRotation = 0;
let planetRotationSpeed = 0.002;
let planetRadius = 100;

let miners = 0;

const bullets = [] // Store the previous particles


function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, 10000, 10000); 

    flightRadius += (targetRadius - flightRadius) * 0.1;
    changeShipSpeed();

    // Shrink Planet
    // Count miners
    let minerCount = 0;
    for (let i = 0; i < bullets.length; i++) {
        let p = bullets[i];
        if (p.radius <= planetRadius) {
            minerCount++;
        }
    }
    if (minerCount > miners) {
        miners = minerCount;
    }
    planetRadius = Math.max(planetRadius - 0.01*miners, 0);

    // Rotate to draw planet shadow
    ctx.save();
    ctx.translate(500,500);
    ctx.rotate(planetRotation);
    ctx.fillStyle = "rgb(0 0 0)";
    ctx.fillRect(0, -planetRadius, 3000, 2*planetRadius);
    ctx.restore();


    // Rotate canvas to draw ship shadow RELATIVE to planet rotation
    // Rotate ship
    shipRotation = shipRotation + shipRotationSpeed;
    const shipX = 500 + (flightRadius + 12.5) * Math.cos(shipRotation);
    const shipY = 500 + (flightRadius + 12.5) * Math.sin(shipRotation);

    ctx.save();
    ctx.translate(shipX,shipY);
    ctx.rotate(planetRotation);

    ctx.fillStyle = "rgba(0 0 0)";
    ctx.fillRect(0, -12.5, 3000, 25);
    ctx.restore();
    

    // Draw planet
    ctx.fillStyle = "rgb(200 20 20)";
    ctx.beginPath();
    ctx.arc(500, 500, planetRadius, 0, Math.PI*2, 1);
    ctx.fill();


    // Rotate to Draw ship
    ctx.save();
    ctx.translate(500,500);
    ctx.rotate(shipRotation);

    ctx.fillStyle = "rgb(255 255 255)";
    ctx.fillRect(flightRadius, -12.5, 25, 25);

    // Loop again
    ctx.restore();

    planetRotation = planetRotation + planetRotationSpeed;
    for (let i = 0; i < bullets.length; i++) {
        let p = bullets[i];

        while (p.arrived && p.radius > planetRadius) {
            p.radius = p.radius - 1;
        }

        if (p.radius > planetRadius && !p.arrived) {
            p.radius -= (p.inwardsVelocity * (300 / p.radius) ** 2);
            p.angle = p.angle + toRadians(p.tangentVelocity * (300 / p.radius) ** 2);
        } else {
            p.arrived = true;
            p.angle = p.angle + planetRotationSpeed;
        }

        ctx.save();
        ctx.translate(500,500);
        ctx.rotate(p.angle);
        ctx.fillStyle = "rgb(255 255 255";
        ctx.fillRect(p.radius, 0, 10, 10);
        ctx.restore();
    }

    for (let i = 0; i < bullets.length; i++) {
    for (let j = i + 1; j < bullets.length; j++) {
        let b1 = bullets[i];
        let b2 = bullets[j];

        // Convert Polar to Cartesian (X, Y)
        let x1 = b1.radius * Math.cos(b1.angle);
        let y1 = b1.radius * Math.sin(b1.angle);
        let x2 = b2.radius * Math.cos(b2.angle);
        let y2 = b2.radius * Math.sin(b2.angle);

        // Calculate distance between centers
        let dx = x2 - x1;
        let dy = y2 - y1;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // If distance is less than bullet size (10px)
        if (distance < 10) {
            // Remove both (highest index first to avoid array shifting issues)
            bullets.splice(j, 1);
            bullets.splice(i, 1);
            
            // Step back i and break j loop since i no longer exists
            i--; 
            break; 
        }
    }
}

    
    window.requestAnimationFrame(draw);
}

function toRadians(degrees) {
    return(degrees * Math.PI / 180);
}

function rise() {
    targetRadius += 20;
}

function drop() {
    targetRadius -= 20;
}

function deploy() {
    bullets.push({
        radius: flightRadius + 12,
        angle: shipRotation,
        tangentVelocity: 0.4,
        inwardsVelocity: 0.2,
        arrived: false,
    });
}

function changeShipSpeed() {
    shipRotationSpeed = 43050.91127519282*(flightRadius**(-2.84313529232797));
}

window.addEventListener('keydown', (event) => {
    // 'Space' is the modern standard for the space bar
    if (event.code === 'Space') {
        // Prevent the page from scrolling down when you press space
        event.preventDefault(); 
        
        bullets.push({
            radius: flightRadius + 12,
            angle: shipRotation,
            tangentVelocity: 0.4,
            inwardsVelocity: 0.2,
            arrived: false,
        });
    };

    if (event.code === 'KeyW') {
        targetRadius += 20;
    };

    if (event.code === 'KeyS') {
        targetRadius -= 20;
    };

    // Optional: Prevent the target from going inside the planet
    if (targetRadius < 110) targetRadius = 110;
    if (targetRadius > 450) targetRadius = 450;
});
