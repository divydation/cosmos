const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

document.body.classList.add("stop-scrolling");


// Set the canvas to the height of the device screen
screenHeight = document.body.offsetHeight;
screenWidth = document.body.offsetWidth;

canvasInternalHeight = 1000;
scale = screenHeight / canvasInternalHeight;


if (screenWidth > screenHeight) {
    canvas.style.scale = scale;
    canvas.height = screenHeight/scale;
    canvas.width = screenWidth/scale;
} else {
    canvas.style.width = "100vw";
    canvas.height = screenHeight;
}


let flightRadius = 200;
let targetRadius = flightRadius;
let targetBoost = 0;
let boostAmount = 0;
let shipWidth = 25;
let shipHeight = 25;

let shipRotation = 0;
let shipRotationSpeed = 0.01;
changeShipSpeed();


let energy = 0;
let material = 10;
let crystal = 0;

offset = 0;
maxOffset = 10;

let shipX;
let shipY;
let shipPosition = {
    x: shipX,
    y: shipY
};



// Particles
let fire = [];


view = "planet";



// COSTS
drillCostMaterial = 5;
satelliteCostMaterial = 25;
bundlerCostMaterial = 50;
laserSatelliteCostMaterial = 50;
refineryCostMaterial = 250;
smartCollectorCostMaterial = 500;

drillRateUpgradeCost = 10;
collectionRadiusUpgradeCost = 10;
refineChainUpgradeCost = 10;


// UPGRADES
drillProductionRate = 3000;
drillLevel = 1;
collectionRadius = 50;
collectionRadiusLevel = 1;
refineChainCount = 1;
refineChainLevel = 1;



// Timing control
let lastTime = Date.now();
const TARGET_FPS = 60;
const MS_PER_FRAME = 1000 / TARGET_FPS; // ~16.66ms
setInterval(saveGame, 2000);

updating = true;


let planets = [];

planets.push({
    name: "redPlanet",
    radius: 100,
    orbitRadius: 200,
    orbitSpeed: 0.001,
    currentOrbitRotation: Math.random()*toRadians(360),
    rotationSpeed: 0.002,
    currentRotation: 0,
    hasShip: true,
    selected: false,
    color: "#EF233C",
    description: "Home",
    drills: [],
    refineries: [],
    materialsToCollect: [],
    satellites: [],
    collectors: [],
    smartCollectors: [],
    bundles: [],
    crystals: [],
    comets: [],
    laserSatellites: [],
});

planets.push({
    name: "bluePlanet",
    radius: 70,
    orbitRadius: 100,
    orbitSpeed: 0.0001,
    currentOrbitRotation: Math.random()*toRadians(360),
    rotationSpeed: 0.001,
    currentRotation: 0,
    hasShip: false,
    selected: false,
    color: "#2375ef",
    description: "Closer to the sun - great for solar power.",
    drills: [],
    refineries: [],
    materialsToCollect: [],
    satellites: [],
    collectors: [],
    smartCollectors: [],
    bundles: [],
    crystals: [],
    comets: [],
    laserSatellites: [],
});

planets.push({
    name: "orangePlanet",
    radius: 120,
    orbitRadius: 260,
    orbitSpeed: 0.0003,
    currentOrbitRotation: Math.random()*toRadians(360),
    rotationSpeed: 0.003,
    currentRotation: 0,
    hasShip: false,
    selected: true,
    color: "#ef6a23",
    description: "The large mass attracts more comets.",
    drills: [],
    refineries: [],
    materialsToCollect: [],
    satellites: [],
    collectors: [],
    smartCollectors: [],
    bundles: [],
    crystals: [],
    comets: [],
    laserSatellites: [],
});

let currentPlanet = planets[0];



function mainThread() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    let planet = null;

    document.getElementById("energyText").innerHTML = formatNumber(energy);
    document.getElementById("materialText").innerHTML = formatNumber(material);
    document.getElementById("crystalText").innerHTML = formatNumber(crystal);

    // Timing control
    let now = Date.now();
    let dt = now - lastTime;
    lastTime = now;

    if (dt > 100) dt = MS_PER_FRAME; 

    shipX = 500 + (flightRadius + 12.5) * Math.cos(shipRotation);
    shipY = 500 + (flightRadius + 12.5) * Math.sin(shipRotation);
    
    shipPosition = {
        x: shipX,
        y: shipY
    };

    if (riseButtonHeld) {
        targetRadius += 2;
    }

    if (dropButtonHeld) {
        targetRadius -= 2;
    }

    if (boostButtonHeld && targetBoost < 5) {
        targetBoost += 1;
    }

    if (!boostButtonHeld && targetBoost > 0) {
        targetBoost -= 1;
    }

    boostAmount += (targetBoost - boostAmount) * 0.05;

    shipRotation += boostAmount/1000;

    if (riseButtonHeld || dropButtonHeld || boostButtonHeld) {
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

    for (let i = 0; i < planets.length; i++) {
        let p = planets[i]
        planet = p;

        if (p.hasShip) {
            if (targetRadius < (planet.radius + 15)) targetRadius = (planet.radius + 15);
            if (targetRadius > 450) targetRadius = 450;

            // targetRadius = Math.round(targetRadius / 2) * 2;

            // if (Math.abs(targetRadius - flightRadius) < 1) {
            //     flightRadius = targetRadius; // Snap it perfectly
            // } else {
                flightRadius += (targetRadius - flightRadius) * 0.05; // Otherwise, keep lerping
            // }

            changeShipSpeed();
            break;
        }
    }

    // Rotate ship
    shipRotation += shipRotationSpeed;
    shipRotation = shipRotation % toRadians(360);

    

    


    randomNumber = Math.floor(Math.random() * 2000);
    if (randomNumber == 1) spawnComet();

    // --------------------------------------------------
    // GO THROUGH EACH PLANET AND CALCULATE AND/OR RENDER
    // --------------------------------------------------
    for (let i = 0; i < planets.length; i++) {
        let p = planets[i]

        // Rotate and orbit this planet
        p.currentRotation += p.rotationSpeed;
        p.currentOrbitRotation += p.orbitSpeed;
        planet.currentRotation = planet.currentRotation % toRadians(360);
        

        // Set current updates to this planet
        planet = p;

        // Is this planet going to be drawn or just calculated?
        drawThisPlanet = false;
        if (p.hasShip) drawThisPlanet = true;

        

        if (drawThisPlanet) {
            // Rotate to draw planet shadow
            ctx.save();
            ctx.translate(500,500);
            ctx.rotate(planet.currentOrbitRotation);
            ctx.fillStyle = "rgb(0 0 0)";
            ctx.fillRect(0, -planet.radius, 4000, 2*planet.radius);
            ctx.restore();

            // Rotate canvas to draw ship shadow RELATIVE to planet rotation
            ctx.save();
            ctx.translate(shipX,shipY);
            ctx.rotate(planet.currentOrbitRotation);
            ctx.fillStyle = "rgba(0 0 0)";
            ctx.fillRect(0, -12.5, 4000, 25);
            ctx.restore();
            

            // Draw planet
            ctx.fillStyle = planet.color;
            ctx.beginPath();
            ctx.arc(500, 500, planet.radius, 0, Math.PI*2, 1);
            ctx.fill();

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
        }

        
        const MAX_DISTANCE_SQ = 100 ** 2; // Maximum range (10,000)

        for (let i = 0; i < planet.satellites.length; i++) {
            let p = planet.satellites[i];

            // 1. Get the satellite's current position
            const satPos = polarToCartesian(p.radius, p.angle);

            let closestDistance = Infinity;
            let targetPos = null;
            let targetType = null; // Will be 'ship' or 'collector'
            let closestCollector = null;

            // 2. Check distance to the ship (only on current planet)
            if (drawThisPlanet) {
                let shipDistance = calculateDistance(satPos, shipPosition);
                if (shipDistance < closestDistance) {
                    closestDistance = shipDistance;
                    targetType = 'ship';
                    // Using shipX and shipY for drawing, matching your original logic
                    targetPos = { x: shipX, y: shipY }; 
                }
            }

            // 3. Check distance to all collectors
            for (let j = 0; j < planet.collectors.length; j++) {
                let c = planet.collectors[j];
                let collectorPos = polarToCartesian(c.radius, c.angle);
                let collectorDistance = calculateDistance(satPos, collectorPos);

                // If this collector is closer than anything we've checked so far
                if (collectorDistance < closestDistance) {
                    closestDistance = collectorDistance;
                    targetType = 'collector';
                    targetPos = collectorPos;
                    closestCollector = c; // Save the reference so we can update its battery later
                }
            }

            // 3. Check distance to all smart collectors
            for (let j = 0; j < planet.smartCollectors.length; j++) {
                let c = planet.smartCollectors[j];
                let collectorPos = polarToCartesian(c.radius, c.angle);
                let collectorDistance = calculateDistance(satPos, collectorPos);

                // If this collector is closer than anything we've checked so far
                if (collectorDistance < closestDistance) {
                    closestDistance = collectorDistance;
                    targetType = 'collector';
                    targetPos = collectorPos;
                    closestCollector = c; // Save the reference so we can update its battery later
                }
            }

            // 4. If the absolute closest target is within range, draw line and transfer power
            if (closestDistance <= MAX_DISTANCE_SQ && targetPos !== null) {
                
                // Draw the power line to the winning target
                if (drawThisPlanet) {
                    ctx.save();
                    ctx.strokeStyle = '#F5D752';
                    ctx.beginPath();
                    ctx.moveTo(satPos.x, satPos.y);
                    ctx.lineTo(targetPos.x, targetPos.y);
                    // ctx.lineWidth = 5;
                    ctx.setLineDash([]);
                    // ctx.lineDashOffset = -offset;
                    ctx.lineWidth = Math.random()*5
                    ctx.stroke();
                    ctx.restore();
                }

                // Transfer power to the winning target
                if (p.powerStored > 0) {
                    p.powerStored -= 1;
                    
                    if (targetType === 'ship') {
                        energy += 1;
                    } else if (targetType === 'collector') {
                        closestCollector.battery += 1;
                    }
                }
            }
        }

        // Rotate to Draw ship
        if (drawThisPlanet) {
            ctx.save();
            ctx.translate(shipX,shipY);
            ctx.rotate(shipRotation);
            ctx.fillStyle = "rgb(255 255 255)";
            ctx.fillRect(-12.5, -12.5, 25, 25);
            ctx.restore();
        }
        

        // Draw materials floating
        for (let i = 0; i < planet.materialsToCollect.length; i++) {
            let p = planet.materialsToCollect[i];

                if (p == null) continue;

                // 1. Get the material's current position
                const materialPosition = polarToCartesian(p.radius, p.angle);

                distance = calculateDistance(materialPosition, shipPosition);

                p.value *= 1.005;
                p.value = Math.min(p.value, 100); // Don't let them be worth more than 100

                if (distance <= 225 && drawThisPlanet) {
                    planet.materialsToCollect.splice(i, 1);
                    i--;
                    material += Math.floor(p.value);
                } 

                if (distance <= collectionRadius**2  && drawThisPlanet) {
                    
                    p.timeInTractorBeam += 0.05;

                    // start moving towards ship
                    p.radius += (flightRadius + 7.5 - p.radius) * Math.min(p.timeInTractorBeam, 1);

                    // Magically wraps the difference between -PI and PI
                    let angleDiff = Math.atan2(Math.sin(shipRotation - p.angle), Math.cos(shipRotation - p.angle));
                    
                    p.angle += (angleDiff * Math.min(p.timeInTractorBeam, 1)) + toRadians(0.5);
                    
                } 

                p.radius += p.radiusChange;

                if (p.radius > 600 || p.radius < 10) p.alpha -= 0.1;

                if (p.alpha < 0) {
                    planet.materialsToCollect.splice(i, 1);
                    i--;
                }

                // Distance to collectors

                for (let j = 0; j < planet.collectors.length; j++) {
                    let b = planet.collectors[j];

                    if (b.battery > 0) {

                        bundlerPosition = polarToCartesian(b.radius, b.angle);

                        distance = calculateDistance(materialPosition, bundlerPosition);

                        if (distance <= 15**2) {
                            planet.materialsToCollect.splice(i, 1);
                            i--;
                            // b.mineralsStored += Math.floor(p.value);
                            material += p.value;
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

                // Distance to smart collectors

                for (let j = 0; j < planet.smartCollectors.length; j++) {
                    let b = planet.smartCollectors[j];

                    if (b.battery > 0) {

                        bundlerPosition = polarToCartesian(b.radius, b.angle);

                        distance = calculateDistance(materialPosition, bundlerPosition);

                        if (distance <= 15**2) {
                            planet.materialsToCollect.splice(i, 1);
                            i--;
                            // b.mineralsStored += Math.floor(p.value);
                            material += p.value;
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

                // Distance to refiners

                // for (let j = 0; j < planet.refineries.length; j++) {
                //     let r = planet.refineries[j];

                //     refineryPosition = polarToCartesian(r.radius, r.angle);

                //     distance = calculateDistance(materialPosition, refineryPosition);

                //     if (distance <= 1000 && !p.refined) {
                //         p.timeInTractorBeam += 0.05;

                //         // start moving towards refinery
                //         p.radius += (r.radius - p.radius) * Math.min(p.timeInTractorBeam, 1);

                //         // Magically wraps the difference between -PI and PI
                //         let angleDiff = Math.atan2(Math.sin(r.angle - p.angle), Math.cos(r.angle - p.angle));
                        
                //         p.angle += (angleDiff * Math.min(p.timeInTractorBeam, 1)) + toRadians(0.5);
                        
                //     }
                // }

                if (drawThisPlanet) canvasDrawMaterials(p);
        }


        // Draw drills
        for (let i = 0; i < planet.drills.length; i++) {
            let p = planet.drills[i];


            if (p.radius > planet.radius && !p.arrived) {
                p.radius -= (p.inwardsVelocity * (300 / p.radius) ** 2);
                p.radius = Math.max(p.radius, planet.radius);
                p.angle = p.angle + toRadians(p.tangentVelocity * (300 / p.radius) ** 2);
                p.angle = p.angle % toRadians(360);
            } else {
                p.arrived = true;
                p.angle = p.angle + planet.rotationSpeed;
                p.angle = p.angle % toRadians(360);
                p.productionTimer += dt;

                if (p.productionTimer >= (drillProductionRate + p.randomTimeOffset)) { 
                    p.materialStored += 1; 
                    p.productionTimer = 0; // Reset the timer

                    planet.materialsToCollect.push({
                        radius: p.radius+6,
                        angle: p.angle,
                        rotation: 0,
                        radiusChange: 0.5,
                        angleChange: 0,
                        alpha: 1,
                        timeInTractorBeam: 0,
                        value: 1,
                        refined: false,
                    });
                }
            }

            if (drawThisPlanet) canvasDrawDrills(p);
        }

        // Draw refineries
        for (let i = 0; i < planet.refineries.length; i++) {
            let p = planet.refineries[i];

            if ((p.radius-20) > planet.radius && !p.arrived) {
                p.radius -= (p.inwardsVelocity * (300 / p.radius) ** 2);
                p.angle = p.angle + toRadians(p.tangentVelocity * (300 / p.radius) ** 2);
                p.angle = p.angle % toRadians(360);
                if (drawThisPlanet) canvasDrawRefinery(p);
                continue;
            } 

            p.arrived = true;
            p.angle = p.angle + planet.rotationSpeed;
            p.angle = p.angle % toRadians(360);

            p.productionTimer += dt;

            refineryPosition = polarToCartesian(p.radius, p.angle);

            timer = 4000;
            let chainMaterials = [p];

            if (p.productionTimer >= timer) { 

                    for (t = 0; t < refineChainCount; t++) {
                        if (chainMaterials[t] == null) break; // Stop chaining
                        newMaterial = findClosestMaterial(chainMaterials[t], planet.materialsToCollect);
                        if (newMaterial == null) break;
                        chainMaterials.push(newMaterial);
                    }

                    ctx.save();
                    // ctx.strokeStyle = '#ef6a23';
                    // ctx.strokeStyle = planet.color;
                    // ctx.strokeStyle = `rgba(255,255,255, 0.3)`;
                    ctx.strokeStyle = `rgba(0, 255, 213, ${Math.random()})`;
                    ctx.beginPath();
                    ctx.moveTo(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);

                    for (d = 0; d < chainMaterials.length; d++) {
                        h = chainMaterials[d];
                        
                        ctx.lineTo(polarToCartesian(h.radius, h.angle).x, polarToCartesian(h.radius, h.angle).y);
                    }

                    ctx.lineWidth = (p.productionTimer - timer)/400 + (Math.random() * 5 - 2);
                    ctx.setLineDash([]);
                    ctx.stroke();
                    ctx.restore();

                }

                // thirdMaterial = findClosestMaterial(secondMaterial, planet.materialsToCollect);
            

            if (p.productionTimer >= (timer+1000)) { 
                for (d = 0; d < chainMaterials.length; d++) {
                    h = chainMaterials[d]
                    h.refined = true;
                    h.value = h.value * 1.5;
                }
                p.productionTimer = 0;
            }

            

            


            if (drawThisPlanet) canvasDrawRefinery(p);
        }

        // Draw satellites
        for (let i = 0; i < planet.satellites.length; i++) {
            let p = planet.satellites[i];

            // Satellites orbit faster if they are closer to the planet
            p.angle += p.rotationSpeed;
            p.angle = p.angle % toRadians(360);

            p.productionTimer += dt;

            if (p.productionTimer >= 3000) { 
                p.powerStored += 1;
                p.productionTimer = 0;
            }
            
            if (drawThisPlanet) canvasDrawSatellites(p);
        }

        // Draw laser Satellites 
        for (let i = 0; i < planet.laserSatellites.length; i++) {
            let p = planet.laserSatellites[i];

            // Satellites orbit faster if they are closer to the planet
            p.angle += p.rotationSpeed;
            p.angle = p.angle % toRadians(360);

            p.damageStored += 0.2;

            p.damageStored = Math.min(p.damageStored, 50)

            laserSatPosition = polarToCartesian(p.radius, p.angle);


            closestComet = null;
            smallestDistance = 100000000000;

            // Find closest comet
            for (let j = 0; j < planet.comets.length; j++) {
                let c = planet.comets[j];

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
                

                if (!drawLine && drawThisPlanet) {
                    ctx.save();
                    ctx.strokeStyle = '#3083DC';
                    ctx.beginPath();
                    ctx.moveTo(laserSatPosition.x, laserSatPosition.y);
                    ctx.lineTo(closestCometPosition.x, closestCometPosition.y);
                    ctx.lineWidth = Math.random() * p.damageStored/2 + Math.random() * 5;
                    ctx.setLineDash([]);
                    // ctx.lineDashOffset = -offset;
                    ctx.stroke();
                    ctx.fillStyle = "rgb(255 255 255)";
                    ctx.restore();
                }
            }
            
            if (drawThisPlanet) canvasDrawLaserSatellites(p);
        }

        // Draw collectors
        for (let i = 0; i < planet.collectors.length; i++) {
            let p = planet.collectors[i];

            // collectors orbit faster if they are closer to the planet
            p.angle += p.orbitSpeed;
            p.angle = p.angle % toRadians(360);

            // If the bundler has power and at least 50 material (could be more) push a bundle out
            // DELETED FOR NOW - use later for other mechanic maybe
            // if (p.battery > 0) {
            //     if (p.mineralsStored > 50) { 
            //         bundles.push({
            //             radius: p.radius,
            //             angle: p.angle,
            //             rotation: p.angle,
            //             rotationSpeed: p.rotationSpeed,
            //             mineralsAmount: p.mineralsStored,
            //             timeInTractorBeam: 0,
            //         });

            //         p.mineralsStored = 0; 
            //     }
            // }        
            
            if (drawThisPlanet) canvasDrawBundler(p);
        }

        // Draw smart collectors
        for (let i = 0; i < planet.smartCollectors.length; i++) {
            let sc = planet.smartCollectors[i];  

            let closestMaterial = null;
            let closestDistance = 10000000000000;

            // Go through the materials
            // Check which are in range
            // Check which is closest
            // Move towards it
            if (sc.battery > 0) {
                for (let j = 0; j < planet.materialsToCollect.length; j++) {
                    let m = planet.materialsToCollect[j];


                    if (m.value < 3) continue;
                    if (m.radius > 450) continue;
                

                    materialPosition = polarToCartesian(m.radius, m.angle);
                    smartCollectorPosition = polarToCartesian(sc.radius, sc.angle);

                    distance = calculateDistance(smartCollectorPosition, materialPosition);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestMaterial = m;
                    }

                    // if (distance <= 225) {
                    //     planet.materialsToCollect.splice(j, 1);
                    //     j--;
                    //     material += Math.floor(m.value);
                    //     sc.battery -= 0.1;
                    // } else if (distance <= collectionRadius**2) {
                        
                    //     m.timeInTractorBeam += 0.05;

                    //     // start moving towards smart collector
                    //     m.radius += (sc.radius - m.radius) * Math.min(m.timeInTractorBeam, 1);

                    //     // Magically wraps the difference between -PI and PI
                    //     let angleDiff = Math.atan2(Math.sin(sc.angle - m.angle), Math.cos(sc.angle - m.angle));
                        
                    //     m.angle += (angleDiff * Math.min(m.timeInTractorBeam, 1)) + toRadians(0.5);
                        
                    // } 
                }

                if (closestMaterial) {
                    // 1. Calculate raw differences
                    let rDiff = closestMaterial.radius - sc.radius;
                    let angleDiff = Math.atan2(
                        Math.sin(closestMaterial.angle - sc.angle), 
                        Math.cos(closestMaterial.angle - sc.angle)
                    );

                    // 2. Convert Angle difference to "Arc Distance" (actual pixels)
                    // Distance = Radius * Angle
                    let arcDiff = angleDiff * sc.radius;

                    // 3. Calculate Total Pixel Distance (Pythagoras)
                    let totalDist = Math.sqrt(rDiff * rDiff + arcDiff * arcDiff);

                    if (totalDist > 0.1) {
                        // --- TWEAK THESE TWO ---
                        const maxSpeed = Math.min(0.75, sc.battery);  // Constant travel speed in pixels
                        const easing = 0.1;    // How soon it starts slowing down (0.1 = 10% of distance)
                        
                        // 4. Determine Step Size (Constant Speed + Easing)
                        // This ensures the collector moves at 'maxSpeed' until it's close.
                        let stepSize = Math.min(maxSpeed, totalDist * easing);

                        // 5. Calculate the Movement Ratio
                        let ratio = stepSize / totalDist;

                        // 6. Apply Movement proportionally
                        sc.radius += rDiff * ratio;
                        sc.radius = Math.min(sc.radius, 450);
                        sc.angle += angleDiff * ratio;
                        sc.angle = sc.angle % toRadians(360);
                    }

                    // Angle cleanup
                    if (sc.angle > Math.PI) sc.angle -= Math.PI * 2;
                    if (sc.angle < -Math.PI) sc.angle += Math.PI * 2;

                    ctx.save();
                    ctx.strokeStyle = `rgba(255,255,255, ${Math.min(sc.battery, 0.3)})`;
                    ctx.beginPath();
                    ctx.moveTo(polarToCartesian(sc.radius, sc.angle).x, polarToCartesian(sc.radius, sc.angle).y);
                    ctx.lineTo(polarToCartesian(closestMaterial.radius, closestMaterial.angle).x, polarToCartesian(closestMaterial.radius, closestMaterial.angle).y);
                    ctx.lineWidth = 2;
                    ctx.setLineDash([]);
                    ctx.stroke();
                    ctx.fillStyle = "rgb(255 255 255)";
                    ctx.restore();
                }
            }

            

            // // 1. Physics Constants
            // const maxSpeed = 1.7;     // The top speed it can reach
            // const accel = 0.09;      // Higher = faster startup (0.01 to 0.1)
            // const friction = 0.98;   // Higher = longer glide (0.9 to 0.98)

            // // Initialize velocity if it doesn't exist yet
            // sc.vr = sc.vr || 0;
            // sc.va = sc.va || 0;

            // let desiredVr = 0;
            // let desiredVa = 0;

            // // 2. Targeting Logic (The "Push")
            // if (closestMaterial && closestDistance < 20000) {
            //     let rDiff = closestMaterial.radius - sc.radius;
            //     let angleDiff = Math.atan2(
            //         Math.sin(closestMaterial.angle - sc.angle), 
            //         Math.cos(closestMaterial.angle - sc.angle)
            //     );
            //     let arcDiff = angleDiff * sc.radius;
            //     let totalDist = Math.hypot(rDiff, arcDiff);

            //     // Only "push" if we haven't arrived yet
            //     if (totalDist > 5) { 
            //         // Calculate the direction vector at max speed
            //         desiredVr = (rDiff / totalDist) * maxSpeed;
            //         desiredVa = (arcDiff / totalDist) * maxSpeed;
            //     }
            // }

            // // 3. Apply Steering (Acceleration)
            // // This moves the current velocity toward the desired velocity
            // sc.vr += (desiredVr - sc.vr) * accel;
            // sc.va += (desiredVa - sc.va) * accel;

            // // 4. Apply Friction (Damping)
            // // This handles the "gliding to a stop" when desiredVr/Va are 0
            // sc.vr *= friction;
            // sc.va *= friction;

            // // 5. Apply Velocity to Position
            // sc.radius += sc.vr;
            // sc.angle += (sc.va / sc.radius);
            
            if (drawThisPlanet) canvasDrawSmartCollector(sc);
        }

        // Draw bundles
        for (let i = 0; i < planet.bundles.length; i++) {
            let p = planet.bundles[i];


            p.rotation += p.rotationSpeed;

            const bundlePosition = polarToCartesian(p.radius, p.angle);

            // Don't need to calculate bundles if ship isn't there
            if (drawThisPlanet) {
                distance = calculateDistance(bundlePosition, shipPosition);

                if (distance <= 15**2) {

                    planet.bundles.splice(i, 1);
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
        }

        // Draw crystals
        for (let i = 0; i < planet.crystals.length; i++) {
            let p = planet.crystals[i];


            p.rotation += p.rotationSpeed;

            // Don't need to calculate crystals if ship isn't on this planet
            if (drawThisPlanet) {
                const crystalPosition = polarToCartesian(p.radius, p.angle);

                distance = calculateDistance(crystalPosition, shipPosition);

                if (distance <= 15**2) {

                    planet.crystals.splice(i, 1);
                    i--;
                    crystal += Math.floor(p.crystalAmount);

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
                
                canvasDrawCrystal(p);
            }

            
        }


        // Comets
        for (let i = 0; i < planet.comets.length; i++) {
            let comet = planet.comets[i];

            // Comets don't orbit the planet, they pass by
            comet.progress += comet.speed;
            comet.rotation += comet.rotationSpeed;

            comet.currentX = comet.startX + (comet.finishX - comet.startX) * comet.progress;
            comet.currentY = comet.startY + (comet.finishY - comet.startY) * comet.progress;

            // Check if the comet is done
            if (comet.progress >= 1) {
                planet.comets.splice(i, 1);
                i--; // Adjust the index so we don't skip the next comet
                continue; 
            }    
            
            // Check if the comet is destroyed
            if (comet.material <= 0) {
                planet.crystals.push({
                    radius: cartesianToPolar(comet.currentX, comet.currentY).radius,
                    angle: cartesianToPolar(comet.currentX, comet.currentY).angle,
                    rotation: cartesianToPolar(comet.currentX, comet.currentY).angle,
                    rotationSpeed: 0.1,
                    crystalAmount: 1,
                    timeInTractorBeam: 0,
                });
                planet.comets.splice(i, 1);
                i--; // Adjust the index so we don't skip the next comet
                continue; 
            }   

            
            if (drawThisPlanet) canvasDrawComet(comet);
        }

    }
    

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
    return distanceSquared < (currentPlanet.radius**2);
}


function findClosestMaterial(object, materialsArray) {
    let closestMaterial = null;
    let closestDistance = 10000000000000;

    objectPosition = polarToCartesian(object.radius, object.angle);

    // Find the closest material
    for (let j = 0; j < materialsArray.length; j++) {
        let m = materialsArray[j];

        // Skip any materials that are already refined
        if (m.refined) continue;

        // Skip if it is the same as itself
        if (m == object) continue;

        // Skip if it is closer to planet than itself
        if (m.radius < object.radius) continue;

        
        materialPosition = polarToCartesian(m.radius, m.angle);

        distance = calculateDistance(objectPosition, materialPosition);

        // Skip any materials that are too far away
        if (distance > 10000) continue;

        if (distance < closestDistance) {
            closestDistance = distance;
            closestMaterial = m;
        }
    }

    // Return the closest material which is in range and not already refined
    return closestMaterial;
}






function canvasDrawMaterials(p) {
    ctx.save();
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    
    if (p.refined) {
        ctx.fillStyle = `rgba(8, 247, 208, ${p.alpha})`;
        p.rotation += 0.1;
    } else {
        ctx.fillStyle = `rgba(46, 191, 165, ${p.alpha})`;
    }
    ctx.rotate(p.angle);
    ctx.rotate(p.rotation);
    
    // scale = 1 + p.value/75;
    ctx.fillRect(-4, -4, 8, 8);
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

function canvasDrawRefinery(p) {
    ctx.save();
    // ctx.translate(500,500);
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    ctx.rotate(p.angle);
    ctx.fillStyle = "rgb(255 255 255)";
    ctx.fillRect(-20, -5, 25, 10);
    ctx.restore();
}

function canvasDrawSatellites(p) {
    ctx.save();
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    ctx.rotate(currentPlanet.currentOrbitRotation);
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
    } else if (p.battery > 0) {
        p.rotation += p.rotationSpeed * (p.battery);
    }
    p.battery -= 0.005;

    
    ctx.rotate(p.rotation);

    const collectorsize = 20;
    const wingSize = 15;
    ctx.fillStyle = "rgb(255 255 255)";
    ctx.strokeStyle = "rgb(255 255 255)";
    ctx.setLineDash([]);
    ctx.lineWidth = 5;
    ctx.fillRect(-(collectorsize/2), -(collectorsize/2), collectorsize, collectorsize);

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

function canvasDrawSmartCollector(p) {
    ctx.save();
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    // ctx.rotate(p.angle);

    p.battery -= 0.005;
    p.battery = Math.max(p.battery, 0);

    // Only rotate or move if smart collector has battery
    if (p.battery > 1) {
        p.rotation += p.rotationSpeed;
    } else if (p.battery > 0.1) {
        p.rotation += p.rotationSpeed * (p.battery);
    } else if (p.battery < 0.1) {
        p.rotation += p.rotationSpeed * 0.1;
    }
    

    
    ctx.rotate(p.rotation);

    const collectorsize = 13;
    const wingSize = 7.5;
    ctx.fillStyle = "rgb(255 255 255)";
    ctx.strokeStyle = "rgb(255 255 255)";
    ctx.setLineDash([]);
    ctx.lineWidth = 5;
    ctx.fillRect(-(collectorsize/2), -(collectorsize/2), collectorsize, collectorsize);

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

function canvasDrawCrystal(p) {
    ctx.save();
    ctx.translate(polarToCartesian(p.radius, p.angle).x, polarToCartesian(p.radius, p.angle).y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = `rgb(211, 54, 242)`;
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

    currentPlanet.comets.push({
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



let ringOffset = 0;


function drawSolarSystem() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    const scale = 0.1;
    let activePlanet = null;
    selectedPlanet = null;

    // Draw shadows so no overlap
    for (let i = 0; i < planets.length; i++) {
        let p = planets[i];

        // Shadow
        ctx.save();
        ctx.translate(500,500);
        ctx.rotate(p.currentOrbitRotation);
        ctx.fillStyle = "rgb(0 0 0)";
        ctx.fillRect(p.orbitRadius, -p.radius*scale, 3000, 2*p.radius*scale);
        ctx.restore();
    }

    // Draw pathway from current planet to selected planet
    for (let i = 0; i < planets.length; i++) {
        let p = planets[i];

        // Pathway from current planet to selected planet

        if (p.hasShip) activePlanet = p;
        if (p.selected) selectedPlanet = p;

    }

    // Draw pathway between current and selected planet
    ctx.strokeStyle = "rgba(255,255,255,0.5";
    ctx.lineWidth = 3;
    // ctx.lineWidth = 2; // Optional: ensure the line is visible
    // ctx.strokeStyle = "rgba(0, 255, 255, 0.6)"; // Optional: cyan glow
    ctx.lineDashOffset = ringOffset;
    ctx.setLineDash([3,3]);


    if (activePlanet != null && selectedPlanet != null) {
        // 1. Setup Sun and Planet data
        let sunX = 500;
        let sunY = 500;

        let planetA = activePlanet;
        let planetB = selectedPlanet;

        // Use variables directly to ensure we know which is Start and which is End
        let r1 = planetA.orbitRadius;
        let r2 = planetB.orbitRadius;

        // 2. NORMALIZE ANGLES
        let startAngle = planetA.currentOrbitRotation % (Math.PI * 2);
        let endAngle = planetB.currentOrbitRotation % (Math.PI * 2);

        if (startAngle < 0) startAngle += Math.PI * 2;
        if (endAngle < 0) endAngle += Math.PI * 2;

        // 3. CALCULATE THE SHORTEST DISTANCE (The "Flip" Logic)
        let diff = endAngle - startAngle;

        // Force the difference to be between -PI and PI (-180 to 180 degrees).
        // This guarantees the spiral never travels more than halfway around the sun.
        if (diff > Math.PI) {
            diff -= Math.PI * 2;
        } else if (diff < -Math.PI) {
            diff += Math.PI * 2;
        }

        let drawEnd = startAngle + diff;

        // 4. DRAWING
        ctx.save();
        ctx.beginPath();


        const segments = 20; 
        for (let i = 0; i <= segments; i++) {
            let t = i / segments;
            
            // Smoothly transition the angle and the radius using our new shortest path
            let currentAngle = startAngle + (drawEnd - startAngle) * t;
            let currentRadius = r1 + (r2 - r1) * t;
            
            let x = sunX + Math.cos(currentAngle) * currentRadius;
            let y = sunY + Math.sin(currentAngle) * currentRadius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();
        ctx.restore();
    }


    // Draw planets
    for (let i = 0; i < planets.length; i++) {
        let p = planets[i];

        // Pathway from current planet to selected planet

        if (p.hasShip) currentPlanet = p;
        if (p.selected) selectedPlanet = p;

        // Planet
        ctx.save();
        ctx.translate(500,500);
        ctx.rotate(p.currentOrbitRotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.orbitRadius, 0, p.radius*scale, 0, Math.PI*2, 1);
        ctx.fill();

        ringOffset = ringOffset - 0.2;

        if (ringOffset < -6) {
            ringOffset = 0;
        }

        if (p.selected) {
            ctx.beginPath();
            ctx.arc(p.orbitRadius, 0, p.radius*scale*2, 0, Math.PI*2, 1);
            ctx.strokeStyle = "rgba(255,255,255,0.5";
            ctx.lineWidth = 3;
            ctx.lineDashOffset = ringOffset;
            ctx.setLineDash([3,3]);
            ctx.stroke();
        }

        // Ship
        if (p.hasShip) {
            ctx.translate(p.orbitRadius,0);
            ctx.rotate(shipRotation - p.currentOrbitRotation);
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
    drillCostMaterial = Math.floor(drillCostMaterial * 1.2);

    currentPlanet.drills.push({
        radius: flightRadius + 12.5,
        angle: shipRotation,
        tangentVelocity: 0,
        inwardsVelocity: 0.2,
        arrived: false,
        materialStored: 0,
        productionTimer: 0,
        randomTimeOffset: Math.random() * 1000 - 500,
    });
}

function deployRefinery() {
    if (material < refineryCostMaterial) return;
    material -= refineryCostMaterial;
    refineryCostMaterial = Math.floor(refineryCostMaterial * 1.2);

    currentPlanet.refineries.push({
        radius: flightRadius + 12.5,
        angle: shipRotation,
        tangentVelocity: 0,
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
    satelliteCostMaterial = Math.floor(satelliteCostMaterial * 1.1);

    currentPlanet.satellites.push({
        radius: flightRadius + 10,
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
    bundlerCostMaterial = Math.floor(bundlerCostMaterial * 1.1);

    currentPlanet.collectors.push({
        radius: flightRadius + 10,
        angle: shipRotation,
        orbitSpeed: shipRotationSpeed,
        rotation: 0,
        rotationSpeed: 0.1,
        mineralsStored: 0,
        battery: 0,
    });
}

function deploySmartCollector() {
    // Material
    if (material < smartCollectorCostMaterial) return;
    material -= smartCollectorCostMaterial;
    smartCollectorCostMaterial = Math.floor(smartCollectorCostMaterial * 1.1);

    currentPlanet.smartCollectors.push({
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
    laserSatelliteCostMaterial = Math.floor(laserSatelliteCostMaterial * 1.1);

    currentPlanet.laserSatellites.push({
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
    if (crystal < drillRateUpgradeCost) return;
    crystal -= drillRateUpgradeCost;
    drillRateUpgradeCost = Math.floor(drillRateUpgradeCost * 2);

    drillProductionRate = drillProductionRate / 1.25;
    drillLevel++;
}

function upgradeCollectionLevel() {
    if (crystal < collectionRadiusUpgradeCost) return;
    crystal -= collectionRadiusUpgradeCost;
    collectionRadiusUpgradeCost = Math.floor(collectionRadiusUpgradeCost * 2);

    collectionRadius = collectionRadius * 1.1;
    collectionRadiusLevel++;
}

function upgradeRefineChainLevel() {
    if (crystal < refineChainUpgradeCost) return;
    crystal -= refineChainUpgradeCost;
    refineChainUpgradeCost = Math.floor(refineChainUpgradeCost * 2);

    refineChainCount += 1;
    refineChainLevel++;
}

// Ship speed calculations

function changeShipSpeed() {
    shipRotationSpeed = 43051*(flightRadius**(-2.843));
}








// --------- //
//  BUTTONS  //
// --------- //


function reset(element) {
    element.target.style.scale = "1";
    element.target.style.backgroundColor = "rgba(100,100,100,0.5)";
    element.target.style.boxShadow = "";
    element.target.style.textShadow = "";
}

function setRedGlow(element) {
    element.target.style.scale = "0.9";
    element.target.style.backgroundColor = "#EF233C";
    element.target.style.boxShadow = "0 0 6vw 0.1vw #EF233C";
    element.target.style.textShadow = "0 0 3vw #fff";
}

const riseButton = document.getElementById("riseButton");

riseButtonHeld = false;
riseButton.addEventListener('pointerdown', (e) => {
  e.preventDefault(); 
  riseButtonHeld = true;
  setRedGlow(e);
});

riseButton.addEventListener('pointerup', (e) => {
  e.preventDefault(); 
  riseButtonHeld = false;
  reset(e);
});

riseButton.addEventListener('pointerleave', (e) => {
    if (riseButtonHeld) {
        riseButtonHeld = false;
        reset(e);
    }
});

riseButton.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

const dropButton = document.getElementById("dropButton");

dropButtonHeld = false;
dropButton.addEventListener('pointerdown', (e) => {
  e.preventDefault(); 
  dropButtonHeld = true;
  setRedGlow(e);
});

dropButton.addEventListener('pointerup', (e) => {
  e.preventDefault(); 
  dropButtonHeld = false;
  reset(e);
});

dropButton.addEventListener('pointerleave', (e) => {
    if (dropButtonHeld) {
        dropButtonHeld = false;
        reset(e);
    }
});

dropButton.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});

// Boost Button
const boostButton = document.getElementById("boostButton");

boostButtonHeld = false;
boostButton.addEventListener('pointerdown', (e) => {
  e.preventDefault(); 
  boostButtonHeld = true;
  setRedGlow(e);
});

boostButton.addEventListener('pointerup', (e) => {
  e.preventDefault(); 
  boostButtonHeld = false;
  reset(e);
});

boostButton.addEventListener('pointerleave', (e) => {
    if (boostButtonHeld) {
        boostButtonHeld = false;
        reset(e);
    }
});

boostButton.addEventListener('contextmenu', (event) => {
  event.preventDefault();
});


// Peek button
const peekButton = document.getElementById("planetSelectButton");
peeking = false;

peekButton.addEventListener('pointerdown', (event) => {

    setTimeout(() => {
        view = "system";
        peeking = true;
    }, 200);
        
});

// Cancel Peek button
const cancelPeekButton = document.getElementById("cancelPeekButton");

cancelPeekButton.addEventListener('pointerdown', (event) => {
        setTimeout(() => {
            view = "planet";
            peeking = false;
            clearHelp();
        }, 200);
});

// Next planet button
document.getElementById("nextPlanetButton").addEventListener('pointerdown', (event) => {
    setTimeout(() => {
        for (let i = 0; i < planets.length; i++) {
            if (planets[i].selected) {
                planets[i].selected = false;

                let nextIndex = i;

                // keep moving forward until we find a valid planet
                do {
                    nextIndex = (nextIndex + 1) % planets.length;
                } while (planets[nextIndex].hasShip);

                planets[nextIndex].selected = true;
                updateHelp(planets[nextIndex].description);
                break;
            }
        }
    }, 100);
});

// Previous planet button
document.getElementById("previousPlanetButton").addEventListener('pointerdown', (event) => {
    setTimeout(() => {
        for (let i = 0; i < planets.length; i++) {
            if (planets[i].selected) {
                planets[i].selected = false;

                let prevIndex = i;

                // keep moving backward until we find a valid planet
                do {
                    prevIndex = (prevIndex - 1 + planets.length) % planets.length;
                } while (planets[prevIndex].hasShip);

                planets[prevIndex].selected = true;
                updateHelp(planets[prevIndex].description);
                break;
            }
        }
    }, 100);
});

function travelToSelectedPlanet() {

    // Get rid of the ship where it currently is
    for (let i = 0; i < planets.length; i++) {
        let p = planets[i];

        // Get rid of the ship where it currently is
        if (p.hasShip) {
            p.hasShip = false;
            break;
        }
    }

    // Find selected planet and give it the ship
    for (let i = 0; i < planets.length; i++) {
        let p = planets[i];
        
        if (p.selected) {
            p.hasShip = true;
            p.selected = false;

            // Change the selected planet to the NEXT planet
                planets[i].selected = false;

                let nextIndex = i;

                // keep moving forward until we find a valid planet
                do {
                    nextIndex = (nextIndex + 1) % planets.length;
                } while (planets[nextIndex].hasShip);

                planets[nextIndex].selected = true;

            // Put view back to planet view (for new planet)
            view = "planet";
            peeking = false;

            // Set the current global planet
            currentPlanet = planets[i];

            // Put menu back to normal
            oldActiveMenuID = activeMenu;
            activeMenu = "mainMenu";
            switchMenu(oldActiveMenuID, activeMenu);

            // setTimeout(() => {
            //     switchMenu(oldActiveMenuID, activeMenu);
            // }, 200);

            break;
        }
    }
}


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
    
    setRedGlow(event);

    setTimeout(() => {
        reset(event)
    }, 150);
    
  });

  button.addEventListener('pointerup', (event) => {
    
    
    
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
document.getElementById("deviceMenuTwo").style.display = "none";
document.getElementById("upgradeMenu").style.display = "none";
document.getElementById("planetSelectMenu").style.display = "none";

function switchMenu(oldActiveMenuID, newActiveMenuID) {
    document.getElementById(oldActiveMenuID).style.display = "none";
    document.getElementById(newActiveMenuID).style.display = "flex";
}

const menuButtons = document.querySelectorAll('.menuButton');

menuButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {

    if (!acceptingInput) return;
    acceptingInput = false;
    
    extractedId = button.id.toString().slice(0, -6) + "Menu";
    oldActiveMenuID = activeMenu;
    activeMenu = extractedId;

    menuFade();

    setTimeout(() => {
        switchMenu(oldActiveMenuID, activeMenu);
        acceptingInput = true;
    }, 200);

    
    
  });
});


function menuFade() {
    setTimeout(() => {
        buttons.forEach(currentbutton => {
        currentbutton.style.opacity = "0";
    });
    }, 100);
    

    setTimeout(() => {
        buttons.forEach(currentbutton => {
        currentbutton.style.opacity = "1";
        });
    }, 250);
}

const returnButtons = document.querySelectorAll('.returnButton');

returnButtons.forEach(button => {
  button.addEventListener('pointerdown', (event) => {

    if (!acceptingInput) return;
    acceptingInput = false;
    
    oldActiveMenuID = activeMenu;
    activeMenu = "mainMenu";

    menuFade();
    
    setTimeout(() => {
        switchMenu(oldActiveMenuID, activeMenu);
        acceptingInput = true;
    }, 200);
    
  });
});

acceptingInput = true;
const deviceMenuTwoButton = document.querySelectorAll('.deviceMenuTwoButton');

deviceMenuTwoButton.forEach(button => {
  button.addEventListener('pointerdown', (event) => {
    if (!acceptingInput) return;
    acceptingInput = false;
    
    oldActiveMenuID = activeMenu;
    activeMenu = "deviceMenuTwo";

    menuFade();
    
    setTimeout(() => {
        switchMenu(oldActiveMenuID, activeMenu);
        acceptingInput = true;
    }, 200);
    
  });
});

const deviceMenuOneButton = document.querySelectorAll('.deviceMenuOneButton');

deviceMenuOneButton.forEach(button => {
  button.addEventListener('pointerdown', (event) => {

    if (!acceptingInput) return;
    acceptingInput = false;
    
    oldActiveMenuID = activeMenu;
    activeMenu = "deviceMenu";

    menuFade();
    
    setTimeout(() => {
        switchMenu(oldActiveMenuID, activeMenu);
        acceptingInput = true;
    }, 200);
    
  });
});






const holdButtons = document.querySelectorAll('.holdButton');
const HOLD_DURATION = 1000;

holdButtons.forEach(button => {
    let animationFrameId;
    let startTime;
    // let defaultText = button.innerHTML;

    // Function to completely reset the button state and stop the loop
    const resetBar = () => {
        cancelAnimationFrame(animationFrameId);
        button.style.background = ""; // Resets to the default CSS background
        button.style.scale = "1";
        button.style.boxShadow = "";
        button.style.textShadow = "";
        svg = button.querySelector("svg");
        if (svg) svg.style.filter = "";
        // button.innerHTML = defaultText;
        
        // updating = true;
        document.getElementById("drillCostMaterial").innerHTML = drillCostMaterial;
        document.getElementById("satelliteCostMaterial").innerHTML = satelliteCostMaterial;
        document.getElementById("bundlerCostMaterial").innerHTML = bundlerCostMaterial;
        document.getElementById("laserSatelliteCostMaterial").innerHTML = laserSatelliteCostMaterial;
        document.getElementById("refineryCostMaterial").innerHTML = refineryCostMaterial;
        document.getElementById("smartCollectorCostMaterial").innerHTML = smartCollectorCostMaterial;
        
        document.getElementById("drillRateUpgradeCost").innerHTML = drillRateUpgradeCost;
        document.getElementById("drillLevel").innerHTML = "LVL " + drillLevel.toString();
        document.getElementById("collectionRadiusUpgradeCost").innerHTML = collectionRadiusUpgradeCost;
        document.getElementById("collectionRadiusLevel").innerHTML = "LVL " + collectionRadiusLevel.toString();

        document.getElementById("refineChainUpgradeCost").innerHTML = refineChainUpgradeCost;
        document.getElementById("refineChainLevel").innerHTML = "LVL " + refineChainLevel.toString();
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
            

            if (button.id == "drill") {
                deploy();
            } else if (button.id == "satellite") {
                deploySatellite();
            } else if (button.id == "bundler") {
                deployBundler();
            } else if (button.id == "laserSatellite") {
                deployLaserSatellite();
            } else if (button.id == "refinery") {
                deployRefinery();
            } else if (button.id == "smartCollector") {
                deploySmartCollector();
            } else if (button.id == "drillRate") {
                upgradeDrillRate();
            } else if (button.id == "collectionRadiusUpgrade") {
                upgradeCollectionLevel();
            } else if (button.id == "refineChainUpgrade") {
                upgradeRefineChainLevel();
            } else if (button.id == "resetButton") {
                localStorage.clear();
                window.location.reload();
                return;
            } else if (button.id == "travelButton") {
                clearHelp();
                travelToSelectedPlanet();
            }

            resetBar();
            return; // Exit the loop so it doesn't keep running
        }

        updating = false;

        button.style.scale = "0.9";
        // button.target.style.backgroundColor = "#EF233C";
        button.style.boxShadow = "0 0 6vw 0.1vw #3083DC";
        button.style.textShadow = "0 0 3vw #fff";

        svg = button.querySelector("svg");
        if (svg) svg.style.filter = "drop-shadow(0 0 2.5vw #fff)";


        // Apply the gradient visually using template literals for cleaner syntax
        button.style.backgroundImage = `linear-gradient(to right, #96c4f6 0%, #96c4f6 ${holdPercentage}%, #3083DC ${holdPercentage}%, #3083DC 100%)`;
        // button.style.backgroundImage = `linear-gradient(to right, #3083DC 0%, #3083DC ${holdPercentage}%, #222222 ${holdPercentage}%, #222222 100%)`;


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
    "Welcome to DEBRIS!",
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



// Save the game
function saveGame() {
    const gameState = {
        energy,
        material,
        crystal,
        flightRadius,
        targetRadius,
        shipRotation,
        // planetRotation,
        // planetOrbit,

        // Progress & Costs
        drillCostMaterial,
        satelliteCostMaterial,
        bundlerCostMaterial,
        laserSatelliteCostMaterial,
        drillRateUpgradeCost,
        collectionRadiusUpgradeCost,
        drillProductionRate,
        drillLevel,
        collectionRadius,
        collectionRadiusLevel,
        refineChainCount,
        refineChainLevel,
        refineChainUpgradeCost,

        // Arrays
        // drills,
        // satellites,
        // collectors,
        // laserSatellites,
        // planets,
        // materialsToCollect,
        // bundles,
        // crystals
        planets,
    };

    localStorage.setItem("spaceMiningSave", JSON.stringify(gameState));
    // console.log("Game Saved!");
}


function loadGame() {
    const savedData = localStorage.getItem("spaceMiningSave");
    if (!savedData) return; // No save found, just start fresh

    const state = JSON.parse(savedData);

    // Restore simple variables
    energy = state.energy;
    material = state.material;
    crystal = state.crystal;
    flightRadius = state.flightRadius;
    targetRadius = state.targetRadius;
    shipRotation = state.shipRotation;
    // planetRotation = state.planetRotation;
    // planetOrbit = state.planetOrbit;
    
    drillCostMaterial = state.drillCostMaterial;
    satelliteCostMaterial = state.satelliteCostMaterial;
    bundlerCostMaterial = state.bundlerCostMaterial;
    laserSatelliteCostMaterial = state.laserSatelliteCostMaterial;
    drillRateUpgradeCost = state.drillRateUpgradeCost;
    collectionRadiusUpgradeCost = state.collectionRadiusUpgradeCost;
    
    drillProductionRate = state.drillProductionRate;
    drillLevel = state.drillLevel;
    collectionRadius = state.collectionRadius;
    collectionRadiusLevel = state.collectionRadiusLevel;
    refineChainCount = state.refineChainCount;
    refineChainLevel = state.refineChainLevel;
    refineChainUpgradeCost = state.refineChainUpgradeCost;

    planets = state.planets;

    // console.log("Game Loaded!");
    for (let i = 0; i < planets.length; i++) {
        let p = planets[i];
        if (p.hasShip) currentPlanet = p;
    }
}

loadGame();

// Start 
window.requestAnimationFrame(mainThread);
