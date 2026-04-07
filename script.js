const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

document.body.classList.add("stop-scrolling");


screenHeight = document.body.offsetHeight;

canvas.height = screenHeight;

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

offset = 0;
maxOffset = 10;

const bullets = [] // Store the previous particles

const fire = [];

const battery = [];

const satellites = [];



function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, 10000, 10000); 

    if (riseButtonHeld) {
        targetRadius += 3;
    }

    if (dropButtonHeld) {
        targetRadius -= 3;
    }

    if (targetRadius < 110) targetRadius = 110;
    if (targetRadius > 450) targetRadius = 450;
    flightRadius += (targetRadius - flightRadius) * 0.05;
    changeShipSpeed();

    // Shrink Planet
    // Count miners
    // let minerCount = 0;
    // for (let i = 0; i < bullets.length; i++) {
    //     let p = bullets[i];
    //     if (p.radius <= planetRadius) {
    //         minerCount++;
    //     }
    // }
    // if (minerCount > miners) {
    //     miners = minerCount;
    // }
    // planetRadius = Math.max(planetRadius - 0.01*miners, 0);

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


    if (riseButtonHeld || dropButtonHeld) {
        // Add flame particle
        fire.push({
            radius: flightRadius + 6 + Math.random() * 10 - 5,
            angle: shipRotation,
            life: Math.random() * 40,
            size: 12,
            color: Math.floor(Math.random() * 60),
            alpha: 1,
        });

    }

    // Draw fire
    for (let i = 0; i < fire.length; i++) {
        let currentParticle = fire[i];

        // Decrease life or kill
        if (currentParticle.life > 0 && currentParticle.size > 0) {
            currentParticle.life = currentParticle.life - shipRotationSpeed;
            currentParticle.size = currentParticle.size - 0.2;
            currentParticle.alpha -= 0.01;
        } else {
            fire.splice(i, 1);
            i--;
        }

        ctx.save();
        ctx.translate(500,500);
        ctx.rotate(currentParticle.angle);
        ctx.fillStyle = `hsla(${currentParticle.color}, 100%, 50% , ${currentParticle.alpha})`;
        ctx.fillRect(currentParticle.radius, 0, currentParticle.size, currentParticle.size);
        ctx.restore();
    }

    
    offset += 1.5;
    if (offset > 10) offset = 0;

    for (let i = 0; i < satellites.length; i++) {
        let p = satellites[i];

        // 1. Get the satellite's current position
        const satPos = polarToCartesian(p.radius, p.angle);

        // 2. Calculate the difference in X and Y
        const dx = satPos.x - shipX;
        const dy = satPos.y - shipY;

        // 3. Calculate actual distance (Hypotenuse)
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 4. Check if distance is 10 or less
        if (distance <= 100) {
            // console.log("Collected Power");
            // ctx.fillStyle = "rgb(255 255 255)";
            // p.powerStored = 450;
            lineColor = 
            ctx.strokeStyle = `hsl(${50 + Math.floor(Math.random() * 30)}, 100%, 50%)`;
            ctx.beginPath();
            ctx.moveTo(satPos.x, satPos.y);
            ctx.lineTo(shipX, shipY);
            ctx.lineWidth = Math.floor(3 + Math.random() * 7);
            ctx.setLineDash([5, 5])
            ctx.lineDashOffset = -offset;
            ctx.stroke();
            ctx.fillStyle = "rgb(255 255 255)";
        }
    }
    


    // Rotate to Draw ship
    ctx.save();
    ctx.translate(500,500);
    ctx.rotate(shipRotation);

    ctx.fillStyle = "rgb(255 255 255)";
    ctx.fillRect(flightRadius, -12.5, 25, 25);

    ctx.restore();

    // Draw bullets
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
        ctx.fillStyle = "rgb(255 255 255)";
        ctx.fillRect(p.radius, 0, 10, 10);
        ctx.restore();
    }

    // Draw battery particles
    for (let i = 0; i < battery.length; i++) {
        let currentParticle = battery[i];

        // Decrease life or kill
        if (currentParticle.life > 0 && currentParticle.size > 0) {
            currentParticle.life = currentParticle.life - 1;
            currentParticle.size = currentParticle.size - 0.2;
            currentParticle.alpha -= 0.01;
        } else {
            battery.splice(i, 1);
            i--;
        }

        ctx.save();
        ctx.translate(500,500);
        ctx.rotate(currentParticle.angle);
        ctx.fillStyle = `hsla(${50 + currentParticle.color}, 100%, 50% , ${currentParticle.alpha})`;
        ctx.fillRect(currentParticle.radius, 0, currentParticle.size, currentParticle.size);
        ctx.restore();
    }

    // Draw satellites
    for (let i = 0; i < satellites.length; i++) {
        let p = satellites[i];

        // Satellites orbit faster if they are closer to the planet
        p.angle += p.rotationSpeed;


        if (p.powerStored < 500) {
            p.powerStored += 1;
            ctx.fillStyle = "rgb(255 255 255)";
        } else {
            // battery.push({
            //     radius: p.radius + Math.random() * 6 - 3,
            //     angle: p.angle,
            //     life: Math.random() * 20,
            //     size: 8,
            //     color: Math.floor(Math.random() * 30),
            //     alpha: 1,
            // });
        }
        ctx.fillStyle = "rgb(255 255 255)";


        

        ctx.save();
        ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
        ctx.rotate(planetRotation);
        const satelliteSize = 20;
        const batterySize = satelliteSize - 4;
        const wingWidth = 5;
        const wingLength = 10;
        // ctx.fillRect(p.radius-(satelliteSize/2), -(satelliteSize/2), satelliteSize, satelliteSize);
        // ctx.fillRect(p.radius - (wingWidth/2), -((satelliteSize/2)+wingLength), wingWidth, satelliteSize + 2*wingLength);
        ctx.fillRect(-(satelliteSize/2), -(satelliteSize/2), satelliteSize, satelliteSize);
        ctx.fillRect(- (wingWidth/2), -((satelliteSize/2)+wingLength), wingWidth, satelliteSize + 2*wingLength);
        // ctx.fillStyle = "rgb(69, 198, 33)";
        // ctx.fillRect(-(batterySize/2), -(batterySize/2), batterySize, batterySize);
        ctx.restore();
    }

    

    // for (let i = 0; i < bullets.length; i++) {
    //     for (let j = i + 1; j < bullets.length; j++) {
    //         let b1 = bullets[i];
    //         let b2 = bullets[j];

    //         // Convert Polar to Cartesian (X, Y)
    //         let x1 = b1.radius * Math.cos(b1.angle);
    //         let y1 = b1.radius * Math.sin(b1.angle);
    //         let x2 = b2.radius * Math.cos(b2.angle);
    //         let y2 = b2.radius * Math.sin(b2.angle);

    //         // Calculate distance between centers
    //         let dx = x2 - x1;
    //         let dy = y2 - y1;
    //         let distance = Math.sqrt(dx * dx + dy * dy);

    //         // If distance is less than bullet size (10px)
    //         if (distance < 10) {
    //             // Remove both (highest index first to avoid array shifting issues)
    //             bullets.splice(j, 1);
    //             bullets.splice(i, 1);
                
    //             // Step back i and break j loop since i no longer exists
    //             i--; 
    //             break; 
    //         }
    //     }
    // }

    
    window.requestAnimationFrame(draw);
}


// ANGLES

function toRadians(degrees) {
    return(degrees * Math.PI / 180);
}

function polarToCartesian(radius, angle, centerX = 500, centerY = 500) {
    return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
    };
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

function deploySatellite() {
    satellites.push({
        radius: flightRadius + 6,
        angle: shipRotation,
        rotationSpeed: shipRotationSpeed,
        powerStored: 495,
    });
}

function changeShipSpeed() {
    shipRotationSpeed = 43050.91127519282*(flightRadius**(-2.84313529232797));
}

const riseButton = document.getElementById("riseButton");

riseButtonHeld = false;
riseButton.addEventListener('pointerdown', (e) => {
  e.preventDefault(); 
  riseButtonHeld = true;
});

riseButton.addEventListener('pointerup', (e) => {
  e.preventDefault(); 
  riseButtonHeld = false;
});

riseButton.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

const dropButton = document.getElementById("dropButton");

dropButtonHeld = false;
dropButton.addEventListener('pointerdown', (e) => {
  e.preventDefault(); 
  dropButtonHeld = true;
});

dropButton.addEventListener('pointerup', (e) => {
  e.preventDefault(); 
  dropButtonHeld = false;
});

dropButton.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});


// All buttons
const buttons = document.querySelectorAll('button');

buttons.forEach(button => {
  button.addEventListener('pointerup', (event) => {
    
    event.target.style.scale = "1";
    event.target.style.backgroundColor = "rgba(100,100,100,0.5)";
    
  });

  button.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    });
});

// Red buttons
const redButtons = document.querySelectorAll('.redButton');

redButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    event.target.style.scale = "0.9";
    event.target.style.backgroundColor = "rgba(200,30,30,0.2)";
    
  });
});

// Blue buttons
const blueButtons = document.querySelectorAll('.blueButton');

blueButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    event.target.style.scale = "0.9";
    event.target.style.backgroundColor = "rgba(30,30,200,0.2)";
    
  });
});



const holdButtons = document.querySelectorAll('.holdButton');
const HOLD_DURATION = 1500;

holdButtons.forEach(button => {
    let animationFrameId;
    let startTime;
    let defaultText = button.innerHTML;

    // Function to completely reset the button state and stop the loop
    const resetBar = () => {
        cancelAnimationFrame(animationFrameId);
        button.style.background = ""; // Resets to the default CSS background
        button.style.scale = "1";
        button.innerHTML = defaultText;
    };

    // The animation loop that runs every frame while held
    const updateBar = (timestamp) => {
        // Set the start time on the very first frame
        if (!startTime) startTime = timestamp;
        
        const elapsed = timestamp - startTime;
        let holdPercentage = (elapsed / HOLD_DURATION) * 100;

        // If the user has held for the full 3 seconds (100%+)
        if (holdPercentage >= 100) {
            resetBar();
            if (defaultText == "PROBE") {
                deploy();
            } else if (defaultText == "SATELLITE") {
                deploySatellite();
            }
            
            return; // Exit the loop so it doesn't keep running
        }

        button.innerHTML = "DEPLOYING";
        button.style.scale = "0.9";

        // Apply the gradient visually using template literals for cleaner syntax
        button.style.background = `linear-gradient(to right, rgba(30,30,200,0.2) 0%, rgba(30,30,200,0.2) ${holdPercentage}%, rgba(100,100,100,0.25) ${holdPercentage}%, rgba(100,100,100,0.25) 100%)`;

        // Loop the function for the next frame
        animationFrameId = requestAnimationFrame(updateBar);
    };

    // When the user presses down
    button.addEventListener('pointerdown', (event) => {
        startTime = null; // Reset the timer
        animationFrameId = requestAnimationFrame(updateBar);
    });

    // When the user lets go
    button.addEventListener('pointerup', resetBar);

    // Cancel if the cursor drags off the button or the system interrupts the touch
    button.addEventListener('pointerleave', resetBar);
    button.addEventListener('pointercancel', resetBar);
});
