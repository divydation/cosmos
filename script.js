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

let energy = 0;
let material = 5;

offset = 0;
maxOffset = 10;

let shipX;
let shipY;
let shipPosition = {
    x: shipX,
    y: shipY
};

// Techology
const drills = [] // Store the previous particles
const materialsToCollect = [];

const satellites = [];

const bundlers = [];
const bundles = [];

const comets = [];

const laserSatellites = [];

// Particles
const fire = [];



view = "planet";



// COSTS
drillCostMaterial = 5;
satelliteCostMaterial = 25;
bundlerCostMaterial = 50;
laserSatelliteCostMaterial = 50;

drillRateUpgradeCost = 100;
collectionRadiusUpgradeCost = 100;


// UPGRADES

drillProductionRate = 3000;
drillLevel = 1;

collectionRadius = 50;
collectionRadiusLevel = 1;


// Timing control
let lastTime = Date.now();
const TARGET_FPS = 60;
const MS_PER_FRAME = 1000 / TARGET_FPS; // ~16.66ms



updating = true;

// const intervalId = setInterval(() => {
    
// }, 1);

function mainThread() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    document.getElementById("energyText").innerHTML = formatNumber(energy);
    document.getElementById("materialText").innerHTML = formatNumber(material);

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
    
    let shipPosition = {
        x: shipX,
        y: shipY
    };

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

    randomNumber = Math.floor(Math.random() * 10000);
    if (randomNumber == 50) spawnComet();

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

            // 1. Get the material's current position
            const materialPosition = polarToCartesian(p.radius, p.angle);

            distance = calculateDistance(materialPosition, shipPosition);

            p.value *= 1.004;

            if (distance <= 15**2) {
                materialsToCollect.splice(i, 1);
                i--;
                material += Math.floor(p.value);
            } 

            if (distance <= collectionRadius**2) {
                
                p.timeInTractorBeam += 0.05;

                // start moving towards ship
                p.radius += (flightRadius + 7.5 - p.radius) * Math.min(p.timeInTractorBeam, 1);

                // Magically wraps the difference between -PI and PI
                let angleDiff = Math.atan2(Math.sin(shipRotation - p.angle), Math.cos(shipRotation - p.angle));
                
                p.angle += (angleDiff * Math.min(p.timeInTractorBeam, 1)) + toRadians(0.5);
                
            } else {
                p.radius += p.radiusChange;

                if (p.radius > 600 || p.radius < planetRadius) p.alpha -= 0.1;

                if (p.alpha < 0) {
                    materialsToCollect.splice(i, 1);
                    i--;
                }
            }

            // Distance to bundlers

            for (let j = 0; j < bundlers.length; j++) {
                let b = bundlers[j];

                if (b.battery > 0) {

                    bundlerPosition = polarToCartesian(b.radius, b.angle);

                    distance = calculateDistance(materialPosition, bundlerPosition);

                    if (distance <= 15**2) {
                        materialsToCollect.splice(i, 1);
                        i--;
                        b.mineralsStored += Math.floor(p.value);
                    } 

                    if (distance <= collectionRadius**2) {
                        p.timeInTractorBeam += 0.05;

                        // start moving towards bundler
                        p.radius += (b.radius + 5 - p.radius) * Math.min(p.timeInTractorBeam, 1);

                        // Magically wraps the difference between -PI and PI
                        let angleDiff = Math.atan2(Math.sin(b.angle - p.angle), Math.cos(b.angle - p.angle));
                        
                        p.angle += (angleDiff * Math.min(p.timeInTractorBeam, 1)) + toRadians(0.5);
                        
                    }
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

            if (p.productionTimer >= drillProductionRate) { 
                p.materialStored += 1; 
                p.productionTimer = 0; // Reset the timer

                materialsToCollect.push({
                    radius: p.radius,
                    angle: p.angle,
                    radiusChange: 0.5,
                    angleChange: 0,
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

    // Draw laser Satellites 
    for (let i = 0; i < laserSatellites.length; i++) {
        let p = laserSatellites[i];

        // Satellites orbit faster if they are closer to the planet
        p.angle += p.rotationSpeed;

        p.damageStored += 0.2;

        // p.productionTimer += dt;
        // p.timeSinceLastShot += dt;

        // p.timeSinceLastShot = Math.min(p.timeSinceLastShot, 5000)

        // if (p.productionTimer >= 500) { 
        //     p.damageStored += 1;
        //     p.productionTimer = 0;
        // }

        p.damageStored = Math.min(p.damageStored, 50)

        laserSatPosition = polarToCartesian(p.radius, p.angle);


        closestComet = null;
        smallestDistance = 100000000000;

        // Find closest comet
        for (let j = 0; j < comets.length; j++) {
            let c = comets[j];

            cometPosition = {
                x: c.currentX,
                y: c.currentY
            }

            distanceToComet = calculateDistance(laserSatPosition, cometPosition);

            if (distanceToComet < smallestDistance && !isLaserBlocked(laserSatPosition, cometPosition)) {
                smallestDistance = distanceToComet;
                closestComet = c;
            }
        }

        if  (closestComet != null && p.damageStored > 0) {
            closestCometPosition = {
                x: closestComet.currentX,
                y: closestComet.currentY,
            }

            // Laser does more damage if it has more damage stored up
            dmgPerFrameMax = 0.35;
            dmgPerFrameMin = 0.05;
            damagePerFrame = dmgPerFrameMin + (p.damageStored - 0.1) * (dmgPerFrameMax / 50);
            closestComet.material -= damagePerFrame;

            p.damageStored -= 0.5;
            p.damageStored = Math.max(p.damageStored, 0);

            drawLine = isLaserBlocked(laserSatPosition, closestCometPosition);

            let dy = closestCometPosition.y - laserSatPosition.y;
            let dx = closestCometPosition.x - laserSatPosition.x;
            
            // 1. Calculate the angle we WANT to be at
            let targetAngle = Math.atan2(dy, dx);

            // 2. Calculate the difference between current and target
            let angleDiff = targetAngle - p.rotation;

            // 3. Normalize the angle to ensure the satellite takes the shortest path
            // This prevents the "360-degree spin" bug
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

            // 4. Smoothly increment the rotation
            let rotationSpeed = 0.2; // Adjust this for "weight"
            if (Math.abs(angleDiff) > 0.01) {
                p.rotation += angleDiff * rotationSpeed;
            } else {
                p.rotation = targetAngle; // Snap to target if very close
            }
            

            if (!drawLine) {
                ctx.save();
                ctx.strokeStyle = '#3083DC';
                ctx.beginPath();
                ctx.moveTo(laserSatPosition.x, laserSatPosition.y);
                ctx.lineTo(closestCometPosition.x, closestCometPosition.y);
                ctx.lineWidth = Math.random() * p.damageStored/2 + Math.random() * 5;
                // ctx.setLineDash([5, 5])
                // ctx.lineDashOffset = -offset;
                ctx.stroke();
                ctx.fillStyle = "rgb(255 255 255)";
                ctx.restore();
            }
        }
        
        canvasDrawLaserSatellites(p);
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

        const bundlePosition = polarToCartesian(p.radius, p.angle);

        distance = calculateDistance(bundlePosition, shipPosition);

        if (distance <= 15**2) {

            bundles.splice(i, 1);
            i--;
            material += Math.floor(p.mineralsAmount);

        } 

        // 4. Check if distance is 10 or less
        if (distance <= collectionRadius**2) {
            
            p.timeInTractorBeam += 0.05;

            // start moving towards ship
            p.radius += (flightRadius + 7.5 - p.radius) * Math.min(p.timeInTractorBeam, 1);

            // Magically wraps the difference between -PI and PI
            let angleDiff = Math.atan2(Math.sin(shipRotation - p.angle), Math.cos(shipRotation - p.angle));
            
            p.angle += (angleDiff * Math.min(p.timeInTractorBeam, 1)) + toRadians(0.5);
            
        }

        
        canvasDrawBundle(p);
    }



    // Comets
    for (let i = 0; i < comets.length; i++) {
        let comet = comets[i];

        // Comets don't orbit the planet, they pass by
        comet.progress += comet.speed;
        comet.rotation += comet.rotationSpeed;

        // Check if the comet is done
        if (comet.progress >= 1 || comet.material < 0) {
            bundles.push({
                radius: cartesianToPolar(comet.currentX, comet.currentY).radius,
                angle: cartesianToPolar(comet.currentX, comet.currentY).angle,
                rotation: cartesianToPolar(comet.currentX, comet.currentY).angle,
                rotationSpeed: 0.1,
                mineralsAmount: comet.material,
                timeInTractorBeam: 0,
            });
            comets.splice(i, 1);
            i--; // Adjust the index so we don't skip the next comet
            continue; 
        }       

        

        comet.currentX = comet.startX + (comet.finishX - comet.startX) * comet.progress;
        comet.currentY = comet.startY + (comet.finishY - comet.startY) * comet.progress;
        
        canvasDrawComet(comet);
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


count = 0;



// Calculations

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateDistance(objectOne, objectTwo) {

        // Calculate the difference in X and Y
        dx = objectOne.x - objectTwo.x;
        dy = objectOne.y - objectTwo.y;

        distanceSquared = (dx * dx) + (dy * dy);
        return(distanceSquared);
}

function toRadians(degrees) {
    return(degrees * Math.PI / 180);
}

function polarToCartesian(radius, angle, centerX = 500, centerY = 500) {
    return {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
    };
}

function cartesianToPolar(objectX, objectY) {
    // 1. Get relative distance from the center (500, 500)
    const dx = objectX - 500;
    const dy = objectY - 500;

    // 2. Calculate the radius (distance from center)
    const radius = Math.sqrt(dx * dx + dy * dy);

    // 3. Calculate the angle in radians
    const angle = Math.atan2(dy, dx);

    polarCoordinates = {
        radius: radius,
        angle: angle,
    }

    return polarCoordinates;
}

function isLaserBlocked(sat, comet) {
    // 1. Get the vector from Satellite to Comet
    const dx = comet.x - sat.x;
    const dy = comet.y - sat.y;
    
    // 2. Find the "t" parameter of the projection
    // This tells us how far along the segment the closest point is
    const l2 = dx * dx + dy * dy; // Squared length of the laser segment
    if (l2 === 0) return false;    // Satellite and comet are on the same spot
    
    let t = ((500 - sat.x) * dx + (500 - sat.y) * dy) / l2;
    
    // 3. Clamp 't' to the range [0, 1] 
    // This ensures we only care about the segment between the two points
    t = Math.max(0, Math.min(1, t));
    
    // 4. Find the coordinates of that closest point on the segment
    const closestX = sat.x + t * dx;
    const closestY = sat.y + t * dy;
    
    // 5. Calculate distance from planet center to this closest point
    const distDX = 500 - closestX;
    const distDY = 500 - closestY;
    const distanceSquared = distDX * distDX + distDY * distDY;
    
    // 6. If distance is less than radius, it's blocked!
    return distanceSquared < (planetRadius * planetRadius);
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
        distance = calculateDistance(satPos, shipPosition);

        // 4. Check if distance is 10 or less
        if (distance <= 100**2) {
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

            distance = calculateDistance(satPos, bundlerPosition);

            if (distance <= 100**2) {
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
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    ctx.rotate(p.angle);
    ctx.fillStyle = `rgba(46, 191, 165, ${p.alpha})`;
    ctx.fillRect(0, -4, 8, 8);
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

function canvasDrawLaserSatellites(p) {
    ctx.save();
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    ctx.rotate(p.rotation);
    const satelliteSize = 20;
    const wingWidth = 5;
    const wingLength = 10;

    ctx.fillStyle = "rgb(255 255 255)";
    ctx.fillRect(-satelliteSize/8, -satelliteSize, satelliteSize/4, satelliteSize*2);
    ctx.fillRect(-satelliteSize, -satelliteSize/2, satelliteSize, satelliteSize);
    ctx.beginPath()
    ctx.arc(satelliteSize/2,0,satelliteSize/2, toRadians(270), toRadians(90), true);
    ctx.fill();
    // ctx.fillRect(0, -satelliteSize/5, satelliteSize, satelliteSize/4);

    ctx.restore();
}


function canvasDrawBundler(p) {
    ctx.save();
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    // ctx.rotate(p.angle);

    p.battery = Math.max(p.battery, 0);

    // Only rotate if bundler has battery
    if (p.battery > 1) {
        p.rotation += p.rotationSpeed;
        p.battery -= 0.0075;
    } else if (p.battery > 0) {
        p.rotation += p.rotationSpeed * (p.battery);
        p.battery -= 0.0075;
    }

    
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

function canvasDrawComet(comet) {
    ctx.save();
    ctx.translate(comet.currentX, comet.currentY);
    ctx.rotate(comet.rotation);
    ctx.fillStyle = `rgba(100, 100, 100, 1)`;
    ctx.fillRect(-comet.material/6, -comet.material/6, comet.material/3, comet.material/3);
    ctx.restore();
}

function spawnComet() {
    const margin = 100; // Spawn 100px off-screen
    const width = 1000;
    const height = 1000;

    // Define our valid sides (excluding bottom)
    const validSides = ['left', 'right'];
    
    // 1. Pick a random starting side
    const startSide = validSides[Math.floor(Math.random() * validSides.length)];
    
    // 2. Filter out the start side so it doesn't try to exit the same way it entered
    const availableFinishSides = validSides.filter(side => side !== startSide);
    
    // 3. Pick a random finish side from the remaining options
    const finishSide = availableFinishSides[Math.floor(Math.random() * availableFinishSides.length)];

    let startX, startY, finishX, finishY;

    // 4. Set starting coordinates based on startSide
    if (startSide === 'top') {
        startX = Math.random() * width;
        startY = -margin;
    } else if (startSide === 'left') {
        startX = -margin;
        startY = Math.random() * height;
    } else if (startSide === 'right') {
        startX = width + margin;
        startY = Math.random() * height;
    }

    // 5. Set finishing coordinates based on finishSide
    if (finishSide === 'top') {
        finishX = Math.random() * width;
        finishY = -margin;
    } else if (finishSide === 'left') {
        finishX = -margin;
        finishY = Math.random() * height;
    } else if (finishSide === 'right') {
        finishX = width + margin;
        finishY = Math.random() * height;
    }

    comets.push({
        startX, startY,
        finishX, finishY,
        currentX: startX,
        currentY: startY,
        progress: 0, // This goes from 0 to 1
        speed: 0.001, // Adjust for how fast they cross (0.01 is very fast)
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        material: 50 + (Math.random() * 100)
    });
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
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

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

function deployLaserSatellite() {
    // Material
    if (material < laserSatelliteCostMaterial) return;
    material -= laserSatelliteCostMaterial;
    laserSatelliteCostMaterial = Math.floor(laserSatelliteCostMaterial * 1.3);

    laserSatellites.push({
        radius: flightRadius + 6,
        angle: shipRotation,
        rotation: 0,
        rotationSpeed: shipRotationSpeed,
        damageStored: 0,
        productionTimer: 0,
        timeSinceLastShot: 0,
    });
}



function upgradeDrillRate() {
    // Material
    if (energy < drillRateUpgradeCost) return;
    energy -= drillRateUpgradeCost;
    drillRateUpgradeCost = Math.floor(drillRateUpgradeCost * 2);

    drillProductionRate = drillProductionRate / 1.5;
    drillLevel++;
}

function upgradeCollectionLevel() {
    // Material
    if (energy < collectionRadiusUpgradeCost) return;
    energy -= collectionRadiusUpgradeCost;
    collectionRadiusUpgradeCost = Math.floor(collectionRadiusUpgradeCost * 2);

    collectionRadius = collectionRadius * 1.2;
    collectionRadiusLevel++;
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

  button.addEventListener('pointerup', (event) => {
    
    button.style.scale = "1";
    button.style.backgroundColor = "rgba(100,100,100,0.5)";
    
  });
});

// Blue buttons
const blueButtons = document.querySelectorAll('.blueButton');

blueButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    event.target.style.scale = "0.9";
    event.target.style.backgroundColor = "rgba(30,30,200,0.2)";
    
  });

  button.addEventListener('pointerup', (event) => {
    
    button.style.scale = "1";
    button.style.backgroundColor = "rgba(100,100,100,0.5)";
    
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
peeking = false;

peekButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    if (!peeking) {
        view = "system";
        peeking = true;
    } else {
        view = "planet";
        peeking = false;
    }
  });
});


// Toggle buttons
const toggleButtons = document.querySelectorAll('.toggleButton');

toggleButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    button.style.scale = "0.9";

    if (button.style.backgroundColor == "rgb(20, 204, 146)") {
        button.style.backgroundColor = "rgba(100,100,100,0.5)";
    } else {
        button.style.backgroundColor = "rgb(20, 204, 146)";
    }

  });

  button.addEventListener('pointerup', (event) => {
    
    button.style.scale = "1";
    
  });
});




// Menu switching
activeMenu = "mainMenu";
document.getElementById("deviceMenu").style.display = "none";
document.getElementById("upgradeMenu").style.display = "none";

function switchMenu(oldActiveMenuID, newActiveMenuID) {
    document.getElementById(oldActiveMenuID).style.display = "none";
    document.getElementById(newActiveMenuID).style.display = "flex";
}

const menuButtons = document.querySelectorAll('.menuButton');

menuButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    extractedId = button.id.toString().slice(0, -6) + "Menu";
    oldActiveMenuID = activeMenu;
    activeMenu = extractedId;

    setTimeout(() => {
        switchMenu(oldActiveMenuID, activeMenu);
    }, 200);

    
    
  });
});

const returnButtons = document.querySelectorAll('.returnButton');

returnButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    
    oldActiveMenuID = activeMenu;
    activeMenu = "mainMenu";

    setTimeout(() => {
        switchMenu(oldActiveMenuID, activeMenu);
    }, 200);

    
    
  });
});






const holdButtons = document.querySelectorAll('.holdButton');
const HOLD_DURATION = 1200;

holdButtons.forEach(button => {
    let animationFrameId;
    let startTime;
    // let defaultText = button.innerHTML;

    // Function to completely reset the button state and stop the loop
    const resetBar = () => {
        cancelAnimationFrame(animationFrameId);
        button.style.background = ""; // Resets to the default CSS background
        button.style.scale = "1";
        // button.innerHTML = defaultText;
        clearHelp();
        // updating = true;
        document.getElementById("drillCostMaterial").innerHTML = drillCostMaterial;
        document.getElementById("satelliteCostMaterial").innerHTML = satelliteCostMaterial;
        document.getElementById("bundlerCostMaterial").innerHTML = bundlerCostMaterial;
        document.getElementById("laserSatelliteCostMaterial").innerHTML = laserSatelliteCostMaterial;
        
        document.getElementById("drillRateUpgradeCost").innerHTML = drillRateUpgradeCost;
        document.getElementById("drillLevel").innerHTML = "LVL " + drillLevel.toString();
        document.getElementById("collectionRadiusUpgradeCost").innerHTML = collectionRadiusUpgradeCost;
        document.getElementById("collectionRadiusLevel").innerHTML = "LVL " + collectionRadiusLevel.toString();
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
            } else if (button.id == "laserSatellite") {
                deployLaserSatellite();
            }else if (button.id == "drillRate") {
                upgradeDrillRate();
            } else if (button.id == "collectionRadiusUpgrade") {
                upgradeCollectionLevel();
            }

            clearHelp();
            return; // Exit the loop so it doesn't keep running
        }

        updating = false;
        // button.innerHTML = "HOLD TO CONFIRM";
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


function updateLevel(parent) {
//   const parent = document.getElementById(parentId);


  const immediateChildren = parent.querySelectorAll(':scope #level');

  immediateChildren.forEach(child => {
    oldLevel = child.innerHTML;
    oldLevel = parseInt(oldLevel.at(-1));
    newLevel = oldLevel + 1;
    child.innerHTML = "LVL " + newLevel.toString();
  });
}
