const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

document.body.classList.add("stop-scrolling");

// Set the canvas to the height of the device screen
screenHeight = document.body.offsetHeight;
canvas.height = screenHeight;

// Start 
window.requestAnimationFrame(mainThread);

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
let planetOrbitSpeed = 0.0005;
let planetOrbit = Math.random()*toRadians(360);

let energy = 100;
let material = 500;

offset = 0;
maxOffset = 10;

let shipX;
let shipY;

// Techology
const drills = [] // Store the previous particles
const materialsToCollect = [];

const satellites = [];

const bundlers = [];
const bundles = [];


// Particles
const fire = [];



view = "planet";

// COSTS
drillCostMaterial = 5;
satelliteCostMaterial = 50;
bundlerCostMaterial = 100;

// Timing control
let lastTime = Date.now();
const TARGET_FPS = 60;
const MS_PER_FRAME = 1000 / TARGET_FPS; // ~16.66ms


// const intervalId = setInterval(() => {
    // planetRotation = planetRotation + planetRotationSpeed;
    // shipRotation = shipRotation + shipRotationSpeed;
// }, 100);

function mainThread() {
    // Clear canvas
    ctx.clearRect(0, 0, 10000, 10000); 

    // Timing control
    let now = Date.now();
    let dt = now - lastTime;
    lastTime = now;

    if (dt > 100) dt = MS_PER_FRAME; 

    // Rotate ship
    shipRotation += shipRotationSpeed;
    planetRotation += planetRotationSpeed;
    planetOrbit += planetOrbitSpeed;

    if (shipRotation > toRadians(360)) shipRotation = 0;
    if (planetRotation > toRadians(360)) planetRotation = 0;

    shipX = 500 + (flightRadius + 12.5) * Math.cos(shipRotation);
    shipY = 500 + (flightRadius + 12.5) * Math.sin(shipRotation);

    document.getElementById("energyText").innerHTML = formatNumber(energy);
    document.getElementById("materialText").innerHTML = formatNumber(material);

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

    for (let i = 0; i < planets.length; i++) {
        let p = planets[i];
        p.currentRotation += p.orbitSpeed;
    }

    // Shrink Planet
    // Count miners
    // let minerCount = 0;
    // for (let i = 0; i < drills.length; i++) {
    //     let p = drills[i];
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
    ctx.rotate(planetOrbit);
    ctx.fillStyle = "rgb(0 0 0)";
    ctx.fillRect(0, -planetRadius, 4000, 2*planetRadius);
    ctx.restore();

    // Rotate canvas to draw ship shadow RELATIVE to planet rotation
    ctx.save();
    ctx.translate(shipX,shipY);
    ctx.rotate(planetOrbit);
    ctx.fillStyle = "rgba(0 0 0)";
    ctx.fillRect(0, -12.5, 4000, 25);
    ctx.restore();
    

    // Draw planet
    ctx.fillStyle = "#EF233C";
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

    
    canvasDrawPowerTransmission();

    // Rotate to Draw ship
    ctx.save();
    ctx.translate(500,500);
    ctx.rotate(shipRotation);
    ctx.fillStyle = "rgb(255 255 255)";
    ctx.fillRect(flightRadius, -12.5, 25, 25);
    ctx.restore();

    // Draw materials floating
    for (let i = 0; i < materialsToCollect.length; i++) {
        let p = materialsToCollect[i];

            // Distance to the ship

            // 1. Get the material's current position
            const position = polarToCartesian(p.radius, p.angle);

            // 2. Calculate the difference in X and Y
            const dx = position.x - shipX;
            const dy = position.y - shipY;

            // 3. Calculate actual distance (Hypotenuse)
            const distance = Math.sqrt(dx * dx + dy * dy);

            p.value *= 1.004;

            if (distance <= 15) {

                materialsToCollect.splice(i, 1);
                i--;
                material += Math.floor(p.value);

            } 

            // 4. Check if distance is 10 or less
            if (distance <= 50) {
                
                p.timeInTractorBeam += 0.05;

                // start moving towards ship
                p.radius += (flightRadius + 7.5 - p.radius) * Math.min(p.timeInTractorBeam, 1);

                // Magically wraps the difference between -PI and PI
                let angleDiff = Math.atan2(Math.sin(shipRotation - p.angle), Math.cos(shipRotation - p.angle));
                
                p.angle += (angleDiff * Math.min(p.timeInTractorBeam, 1)) + toRadians(0.5);
                
            } else {
                p.radius += 0.5;

                if (p.radius > 600) p.alpha -= 0.1;

                if (p.alpha < 0) {
                    materialsToCollect.splice(i, 1);
                    i--;
                }
            }

            // Distance to bundlers

            for (let j = 0; j < bundlers.length; j++) {
                let b = bundlers[j];

                const dx = position.x - polarToCartesian(b.radius, b.angle).x;
                const dy = position.y - polarToCartesian(b.radius, b.angle).y;

                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= 15) {
                    materialsToCollect.splice(i, 1);
                    i--;
                    b.mineralsStored += Math.floor(p.value);
                } 

                if (distance <= 35) {
                    p.timeInTractorBeam += 0.05;

                    // start moving towards bundler
                    p.radius += (b.radius + 5 - p.radius) * Math.min(p.timeInTractorBeam, 1);

                    // Magically wraps the difference between -PI and PI
                    let angleDiff = Math.atan2(Math.sin(b.angle - p.angle), Math.cos(b.angle - p.angle));
                    
                    p.angle += (angleDiff * Math.min(p.timeInTractorBeam, 1)) + toRadians(0.5);
                    
                }
            }

            canvasDrawMaterials(p);
    }


    // Draw drills
    for (let i = 0; i < drills.length; i++) {
        let p = drills[i];

        while (p.arrived && p.radius > planetRadius) {
            p.radius = p.radius - 1;
        }

        if (p.radius > planetRadius && !p.arrived) {
            p.radius -= (p.inwardsVelocity * (300 / p.radius) ** 2);
            p.angle = p.angle + toRadians(p.tangentVelocity * (300 / p.radius) ** 2);
        } else {
            p.arrived = true;
            p.angle = p.angle + planetRotationSpeed;
            p.productionTimer += dt;

            if (p.productionTimer >= 3000) { 
                p.materialStored += 1; 
                p.productionTimer = 0; // Reset the timer

                materialsToCollect.push({
                    radius: p.radius,
                    angle: p.angle,
                    alpha: 1,
                    timeInTractorBeam: 0,
                    value: 1,
                });
            }
        }

        canvasDrawDrills(p);
    }

    // Draw satellites
    for (let i = 0; i < satellites.length; i++) {
        let p = satellites[i];

        // Satellites orbit faster if they are closer to the planet
        p.angle += p.rotationSpeed;

        p.productionTimer += dt;

        if (p.productionTimer >= 4000 && p.powerStored < 500) { 
            p.powerStored += 1;
            p.productionTimer = 0;
        }
        
        canvasDrawSatellites(p);
    }

    // Draw bundlers
    for (let i = 0; i < bundlers.length; i++) {
        let p = bundlers[i];

        // Bundlers orbit faster if they are closer to the planet
        p.angle += p.orbitSpeed;

        if (p.battery > 0) {
            // Bundle the amount of minerals every 10 seconds
            if (p.mineralsStored > 50) { 
                bundles.push({
                    radius: p.radius,
                    angle: p.angle,
                    rotation: p.angle,
                    rotationSpeed: p.rotationSpeed,
                    mineralsAmount: p.mineralsStored,
                    timeInTractorBeam: 0,
                });

                p.mineralsStored = 0; 
            }
        }        
        
        canvasDrawBundler(p);
    }

    // Draw bundles
    for (let i = 0; i < bundles.length; i++) {
        let p = bundles[i];

        // Bundlers orbit faster if they are closer to the planet
        // p.angle += p.rotationSpeed;

        p.rotation += p.rotationSpeed;

        // Distance to the ship

        // 1. Get the bundle's current position
        const position = polarToCartesian(p.radius, p.angle);

        // 2. Calculate the difference in X and Y
        const dx = position.x - shipX;
        const dy = position.y - shipY;

        // 3. Calculate actual distance (Hypotenuse)
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= 15) {

            bundles.splice(i, 1);
            i--;
            material += Math.floor(p.mineralsAmount);

        } 

        // 4. Check if distance is 10 or less
        if (distance <= 50) {
            
            p.timeInTractorBeam += 0.05;

            // start moving towards ship
            p.radius += (flightRadius + 7.5 - p.radius) * Math.min(p.timeInTractorBeam, 1);

            // Magically wraps the difference between -PI and PI
            let angleDiff = Math.atan2(Math.sin(shipRotation - p.angle), Math.cos(shipRotation - p.angle));
            
            p.angle += (angleDiff * Math.min(p.timeInTractorBeam, 1)) + toRadians(0.5);
            
        }

        
        canvasDrawBundle(p);
    }

    
    // COLLISION CODE
    // for (let i = 0; i < drills.length; i++) {
    //     for (let j = i + 1; j < drills.length; j++) {
    //         let b1 = drills[i];
    //         let b2 = drills[j];

    //         // Convert Polar to Cartesian (X, Y)
    //         let x1 = b1.radius * Math.cos(b1.angle);
    //         let y1 = b1.radius * Math.sin(b1.angle);
    //         let x2 = b2.radius * Math.cos(b2.angle);
    //         let y2 = b2.radius * Math.sin(b2.angle);

    //         // Calculate distance between centers
    //         let dx = x2 - x1;
    //         let dy = y2 - y1;
    //         let distance = Math.sqrt(dx * dx + dy * dy);

    //         // If distance is less than drill size (10px)
    //         if (distance < 10) {
    //             // Remove both (highest index first to avoid array shifting issues)
    //             drills.splice(j, 1);
    //             drills.splice(i, 1);
                
    //             // Step back i and break j loop since i no longer exists
    //             i--; 
    //             break; 
    //         }
    //     }
    // }

    if (view == "system") {
        drawSolarSystem();
    }
    
    window.requestAnimationFrame(mainThread);
}


// Drawing
function canvasDrawPowerTransmission() {
    offset += 2.5;
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
            ctx.save();
            ctx.strokeStyle = '#F5D752';
            ctx.beginPath();
            ctx.moveTo(satPos.x, satPos.y);
            ctx.lineTo(shipX, shipY);
            ctx.lineWidth = 5;
            ctx.setLineDash([5, 5])
            ctx.lineDashOffset = -offset;
            ctx.stroke();
            ctx.fillStyle = "rgb(255 255 255)";
            ctx.restore();

            if (p.powerStored > 0) {
                p.powerStored -= 1;
                energy += 1;
            }
        }

        // Draw power line between satellites and bundlers
        for (let j = 0; j < bundlers.length; j++) {
            let b = bundlers[j];

            bundlerPosition = polarToCartesian(b.radius, b.angle);

            const dx = satPos.x - bundlerPosition.x;
            const dy = satPos.y - bundlerPosition.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= 100) {
                ctx.save();
                ctx.strokeStyle = '#F5D752';
                ctx.beginPath();
                ctx.moveTo(satPos.x, satPos.y);
                ctx.lineTo(bundlerPosition.x, bundlerPosition.y);
                ctx.lineWidth = 5;
                ctx.setLineDash([5, 5])
                ctx.lineDashOffset = -offset;
                ctx.stroke();
                ctx.fillStyle = "rgb(255 255 255)";
                ctx.restore();

                if (p.powerStored > 0) {
                    p.powerStored -= 1;
                    b.battery += 1;
                }
            }
        }
    }
}

function canvasDrawMaterials(p) {
    ctx.save();
    ctx.translate(500,500);
    ctx.rotate(p.angle);
    ctx.fillStyle = `rgba(46, 191, 165, ${p.alpha})`;
    ctx.fillRect(p.radius, -4, 8, 8);
    ctx.restore();
}

function canvasDrawDrills(p) {
    ctx.save();
    ctx.translate(500,500);
    ctx.rotate(p.angle);
    ctx.fillStyle = "rgb(255 255 255)";
    ctx.fillRect(p.radius, -5, 10, 10);
    ctx.restore();
}

function canvasDrawSatellites(p) {
    ctx.save();
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    ctx.rotate(planetOrbit);
    const satelliteSize = 20;
    const wingWidth = 5;
    const wingLength = 10;
    // ctx.fillStyle = "rgb(255 255 255)";
    // ctx.fillRect(-(satelliteSize/2), -(satelliteSize/2), satelliteSize, satelliteSize);
    // ctx.fillRect(- (wingWidth/2), -((satelliteSize/2)+wingLength), wingWidth, satelliteSize + 2*wingLength);
    ctx.fillStyle = "rgb(255 255 255)";
    ctx.fillRect(-satelliteSize/8, -satelliteSize, satelliteSize/4, satelliteSize*2);
    ctx.beginPath()
    ctx.arc(0,0,satelliteSize/2,0, Math.PI*2, 1);
    ctx.fill();
    ctx.restore();
}

function canvasDrawBundler(p) {
    ctx.save();
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    // ctx.rotate(p.angle);

    p.battery = Math.max(p.battery, 0);

    // Only rotate if bundler has battery
    if (p.battery > 0) {
        p.rotation += p.rotationSpeed;
        p.battery -= 0.005;
    }

    updateHelp(formatNumber(p.battery));
    
    ctx.rotate(p.rotation);

    const bundlerSize = 20;
    const wingSize = 15;
    ctx.fillStyle = "rgb(255 255 255)";
    ctx.strokeStyle = "rgb(255 255 255)";
    ctx.lineWidth = 5;
    ctx.fillRect(-(bundlerSize/2), -(bundlerSize/2), bundlerSize, bundlerSize);

    // Arm 1
    ctx.beginPath();
    ctx.moveTo(wingSize, -(wingSize));
    ctx.lineTo(-wingSize,wingSize);
    ctx.stroke();

    // Arm 2
    ctx.beginPath();
    ctx.moveTo(-(wingSize), -(wingSize));
    ctx.lineTo(wingSize,wingSize);
    ctx.stroke();

    ctx.restore();
}

function canvasDrawBundle(p) {
    ctx.save();
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = `rgba(46, 191, 165, 1)`;
    ctx.fillRect(-8, -8, 16, 16);
    ctx.restore();
}

const planets = [];

planets.push({
    name: "redPlanet",
    radius: 100,
    orbitRadius: 150,
    orbitSpeed: planetOrbitSpeed,
    currentRotation: planetOrbit,
    hasShip: true,
    color: "#EF233C",
});

planets.push({
    name: "bluePlanet",
    radius: 70,
    orbitRadius: 300,
    orbitSpeed: 0.001,
    currentRotation: Math.random()*toRadians(360),
    hasShip: false,
    color: "#2375ef",
});

planets.push({
    name: "orangePlanet",
    radius: 120,
    orbitRadius: 370,
    orbitSpeed: 0.004,
    currentRotation: Math.random()*toRadians(360),
    hasShip: false,
    color: "#ef6a23",
});

function drawSolarSystem() {
    ctx.clearRect(0, 0, 10000, 10000); 

    const scale = 0.1;

    // Traverse planets and draw their shadow and then the planet itself
    for (let i = 0; i < planets.length; i++) {
        let p = planets[i];

        p.currentRotation += p.orbitSpeed;

        // Shadow
        ctx.save();
        ctx.translate(500,500);
        ctx.rotate(p.currentRotation);
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(p.orbitRadius, -p.radius*scale, 3000, 2*p.radius*scale);
        ctx.restore();

        // Planet
        ctx.save();
        ctx.translate(500,500);
        ctx.rotate(p.currentRotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.orbitRadius, 0, p.radius*scale, 0, Math.PI*2, 1);
        ctx.fill();

        // Ship
        if (p.hasShip) {
            ctx.translate(p.orbitRadius,0);
            ctx.rotate(shipRotation - p.currentRotation);
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(p.radius*scale+3, -2.5, 5, 5);
        }

        ctx.restore();
    }

    // Draw sun
    ctx.fillStyle = "#efcd23";
    ctx.beginPath();
    ctx.arc(500, 500, 50, 0, Math.PI*2, 1);
    ctx.fill();
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

// Deploying

function deploy() {
    if (material < drillCostMaterial) return;
    material -= drillCostMaterial;
    drillCostMaterial = Math.floor(drillCostMaterial * 1.3);

    drills.push({
        radius: flightRadius + 12.5,
        angle: shipRotation,
        tangentVelocity: 0.4,
        inwardsVelocity: 0.2,
        arrived: false,
        materialStored: 0,
        productionTimer: 0,
    });
}

function deploySatellite() {
    // Material
    if (material < satelliteCostMaterial) return;
    material -= satelliteCostMaterial;
    satelliteCostMaterial = Math.floor(satelliteCostMaterial * 1.3);

    satellites.push({
        radius: flightRadius + 6,
        angle: shipRotation,
        rotationSpeed: shipRotationSpeed,
        powerStored: 0,
        productionTimer: 0,
    });
}

function deployBundler() {
    // Material
    if (material < bundlerCostMaterial) return;
    material -= bundlerCostMaterial;
    bundlerCostMaterial = Math.floor(bundlerCostMaterial * 1.3);

    bundlers.push({
        radius: flightRadius + 6,
        angle: shipRotation,
        orbitSpeed: shipRotationSpeed,
        rotation: 0,
        rotationSpeed: 0.1,
        mineralsStored: 0,
        battery: 0,
    });
}

// Ship speed calculations

function changeShipSpeed() {
    shipRotationSpeed = 43050.91127519282*(flightRadius**(-2.84313529232797));
}








// --------- //
//  BUTTONS  //
// --------- //

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
    event.target.style.backgroundColor = "#EF233C";
    
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

// Tip button
const tipButtons = document.querySelectorAll('.tipButton');

tipButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    updateHelp();
    
  });

  button.addEventListener('pointerup', (event) => {
    
    clearHelp();
    
  });
});

// Peek button
const peekButtons = document.querySelectorAll('.peekButton');

peekButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    view = "system";
    
  });

  button.addEventListener('pointerup', (event) => {
    
    view = "planet";
    
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
        clearHelp();
        document.getElementById("drillCostMaterial").innerHTML = drillCostMaterial;
        document.getElementById("satelliteCostMaterial").innerHTML = satelliteCostMaterial;
        document.getElementById("bundlerCostMaterial").innerHTML = bundlerCostMaterial;
    };

    // The animation loop that runs every frame while held
    const updateBar = (timestamp) => {
        // Set the start time on the very first frame
        if (!startTime) startTime = timestamp;
        
        const elapsed = timestamp - startTime;
        let holdPercentage = (elapsed / HOLD_DURATION) * 100;

        // if (button.id == "drill") {
        //     updateHelp("Drills shoot minerals into space, which increase in value as they oxidise.");
        // } else if (button.id == "satellite") {
        //     updateHelp("TESTING 2");
        // }

        // If the user has held for the full 3 seconds (100%+)
        if (holdPercentage >= 100) {
            resetBar();
            if (button.id == "drill") {
                deploy();
            } else if (button.id == "satellite") {
                deploySatellite();
            } else if (button.id == "bundler") {
                deployBundler();
            }
            clearHelp();
            return; // Exit the loop so it doesn't keep running
        }

        button.innerHTML = "DEPLOYING";
        button.style.scale = "0.9";

        // Apply the gradient visually using template literals for cleaner syntax
        button.style.backgroundImage = `linear-gradient(to right, #3083DC 0%, #3083DC ${holdPercentage}%, #222222 ${holdPercentage}%, #222222 100%)`;

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


// Text formatting
function formatNumber(num) {
  const suffixes = ['', 'k', 'm', 'b', 't'];
  let suffixIndex = 0;

  // Scale the number down by 1000s until it's under 1000
  // or we run out of suffixes
  while (num >= 1000 && suffixIndex < suffixes.length - 1) {
    num /= 1000;
    suffixIndex++;
  }

  // Handle formatting based on the size of the resulting number
  if (num >= 100 || suffixIndex === 0) {
    // No decimals needed if it's already 3 digits or under 1000
    return Math.floor(num) + suffixes[suffixIndex];
  } else if (num >= 10) {
    // e.g., 28.1m (3 total digits)
    return num.toFixed(1).replace(/\.0$/, '') + suffixes[suffixIndex];
  } else {
    // e.g., 1.56k (3 total digits)
    return num.toFixed(2).replace(/\.?0+$/, '') + suffixes[suffixIndex];
  }
}


// Info help
let helpNumber = 0;
document.getElementById("tipsContainer").style.visibility = "hidden";

let help = [
    "Welcome to COSMOS!",
    "Drills mine minerals from the planet and shoot them to space.",
    "Use the RISE and DROP controls to fly around and collect minerals.",
    "The closer your orbit, the faster you circle the planet.",
    "Materials increase in value as they oxidise in space.",
    "Satellites use solar panels to harvest energy.",
    "Fly near a satellite to collect its energy."
]

function updateHelp(text) {
    document.getElementById("tipsContainer").style.visibility = "visible";
    document.getElementById("tips").innerHTML = text;
    helpNumber++;
    if (helpNumber == 7) helpNumber = 0;
}

function clearHelp() {
    document.getElementById("tipsContainer").style.visibility = "hidden";
}
