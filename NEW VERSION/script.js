let currentRound = 1;
let totalScore = 0;
let currentMarker = null;
let map;
let guessedMap = '';
let roundScores = [];

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('game.html')) {
        startGame();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
        openLocationImage(currentMapName);
    } else if (event.key === 'Escape') {
        closeLocationImage();
    }
});

function loadRound() {
    if (currentRound > 5) {
        endGame();
        return;
    }

    document.getElementById('round-info').innerText = `Round ${currentRound} of 5`;
    document.getElementById('score-info').innerText = `Score: ${totalScore}`;

    const location = getRandomLocation();
    document.getElementById('location-img').src = `images/${location.map.toLowerCase()}/${location.image}`;

    const mapButtons = document.getElementById('map-buttons');
    mapButtons.innerHTML = '';

    const mapDisplayNames = {
        'Cosmodrome': 'Cosmodrome',
        'DreamingCity': 'The Dreaming City',
        'EDZ': 'EDZ',
        'Europa': 'Europa',
        'Moon': 'Moon',
        'Neomuna': 'Neomuna',
        'Nessus': 'Nessus',
        'STW': 'Savathun\'s Throne World',
        'TPH': 'The Pale Heart'
    };

    const maps = Object.keys(mapDisplayNames);
    maps.forEach(mapName => {
        const button = document.createElement('button');
        button.innerText = mapDisplayNames[mapName];
        button.classList.add('map-button');

        const className = `map-${mapName.toLowerCase().replace(/[^a-z0-9]/gi, '')}`;
        button.classList.add(className);

        button.addEventListener('click', () => {
            guessedMap = mapName;
            openMapModal(mapName, location);
        });

        mapButtons.appendChild(button);
    });
}

function openMapModal(mapName, location) {
    guessedMap = mapName;
    const modal = document.getElementById('map-modal');
    modal.style.display = 'block';

    const closeBtn = document.querySelector('.close-btn');
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        guessedMap = '';
    };

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
            guessedMap = '';
        }
    };

    initializeMap(mapName, location);
}

function initializeMap(mapName, location) {
    if (map) {
        map.remove();
    }

    map = L.map('map', {
        crs: L.CRS.Simple,
        maxZoom: 7,
        minZoom: -1,
    }).setView([500, 500], 1);

    const imageUrl = `maps/${mapName}.png`;
    const img = new Image();
    img.onload = function() {
        const imageBounds = [[0, 0], [img.height, img.width]];

        const extendedBounds = [
            [-150, -150],
            [img.height + 150, img.width + 150]
        ];

        L.imageOverlay(imageUrl, imageBounds).addTo(map);
        map.fitBounds(imageBounds);

        map.setMaxBounds(extendedBounds);
    };
    img.src = imageUrl;

    map.on('click', placeMarker);

    const submitButton = document.getElementById('submit-button');
    submitButton.style.display = 'none';
    submitButton.onclick = () => submitGuess(location);
}

function placeMarker(e) {
    const latLng = e.latlng;

    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    const redMarkerIcon = L.icon({
        iconUrl: 'icons/red-marker-icon.png',
        iconSize: [30, 45],
        iconAnchor: [15, 45],
        popupAnchor: [0, -45],
    });

    currentMarker = L.marker(latLng, { icon: redMarkerIcon }).addTo(map);

    const submitButton = document.getElementById('submit-button');
    submitButton.style.display = 'block';
}

function submitGuess(location) {
    if (!currentMarker) {
        alert('Please place a marker on the map!');
        return;
    }

    const guessedCoordinates = currentMarker.getLatLng();
    const actualCoordinates = location.coordinates;
    const mapName = location.map;

    const distance = calculateDistance(guessedCoordinates, actualCoordinates);
    const points = calculatePoints(distance, mapName);

    totalScore += points;
    roundScores.push(points);
    localStorage.setItem('roundScores', JSON.stringify(roundScores));
    showRoundSummary(guessedCoordinates, actualCoordinates, points, distance, mapName, location.image);

    currentRound++;
    localStorage.setItem('totalScore', totalScore);
}

function calculateDistance(guessedCoordinates, actualCoordinates) {
    const x1 = actualCoordinates[0];
    const y1 = actualCoordinates[1];
    const x2 = guessedCoordinates.lat;
    const y2 = guessedCoordinates.lng;

    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

function calculatePoints(distance, mapName) {
    if (guessedMap !== mapName) {
        return 0;
    }

    const maxPoints = 1000;
    const perfectRadius = 35;
    const falloffRadius = 350;

    if (distance <= perfectRadius) {
        return maxPoints;
    }

    if (distance > falloffRadius) {
        const tailScore = 100 * Math.exp(-0.01 * (distance - falloffRadius));
        return Math.max(1, Math.floor(tailScore));
    }

    const decay = (distance - perfectRadius) / (falloffRadius - perfectRadius);
    const score = maxPoints * Math.pow(1 - decay, 2);
    return Math.floor(score);
}


function showRoundSummary(guessedCoordinates, actualCoordinates, points, distance, mapName, locationImage) {
    const modal = document.getElementById('map-modal');
    modal.style.display = 'none';

    const summaryModal = document.createElement('div');
    summaryModal.className = 'modal';
    summaryModal.style.display = 'block';

    const summaryContent = document.createElement('div');
    summaryContent.className = 'modal-content';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'next-btn';
    nextBtn.innerHTML = 'Next &rarr;';
    nextBtn.onclick = () => {
        summaryModal.style.display = 'none';
        loadRound();
    };

    const viewImageBtn = document.createElement('button');
    viewImageBtn.className = 'view-image-btn';
    viewImageBtn.innerHTML = 'View Location Image';
    viewImageBtn.onclick = () => {
        openLocationImage(locationImage);
    };

    const mapContainer = document.createElement('div');
    mapContainer.id = 'summary-map';
    mapContainer.style.width = '800px';
    mapContainer.style.height = '600px';
    mapContainer.style.margin = '0 auto';

    const mapDisplayNames = {
        'Cosmodrome': 'Cosmodrome',
        'DreamingCity': 'The Dreaming City',
        'EDZ': 'EDZ',
        'Europa': 'Europa',
        'Moon': 'Moon',
        'Neomuna': 'Neomuna',
        'Nessus': 'Nessus',
        'STW': 'Savathun\'s Throne World',
        'TPH': 'The Pale Heart'
    };

    const guessedMapDisplayName = mapDisplayNames[guessedMap] || guessedMap;
    const actualMapDisplayName = mapDisplayNames[mapName] || mapName;

    const summaryText = document.createElement('p');
    if (guessedMap !== mapName) {
        summaryText.innerText = `Sorry! Wrong planet :( \nYou guessed ${guessedMapDisplayName} but the correct location was on ${actualMapDisplayName}.\n You earned 0 points.\n`;
        summaryText.innerHTML += `<br><strong>Total Score: ${totalScore}</strong>`;
    } else {
        summaryText.innerText = `You were ${distance.toFixed(2)} units away from the correct location. You earned ${points} points.\nThe green marker is where the location is.\n`;
        summaryText.innerHTML += `<br><strong>Round: ${currentRound} out of 5</strong>`;
        summaryText.innerHTML += `<br><strong>Total Score: ${totalScore}</strong>`;
    }
    summaryContent.appendChild(mapContainer);
    summaryContent.appendChild(summaryText);
    summaryContent.appendChild(viewImageBtn);
    summaryContent.appendChild(nextBtn);
    summaryModal.appendChild(summaryContent);
    document.body.appendChild(summaryModal);

    const summaryMap = L.map(mapContainer, {
        crs: L.CRS.Simple,
        maxZoom: 3,
        minZoom: -1,
    }).setView([500, 500], 1);

    const imageUrl = `maps/${mapName}.png`;
    const img = new Image();
    img.onload = function() {
        const imageBounds = [[0, 0], [img.height, img.width]];
        L.imageOverlay(imageUrl, imageBounds).addTo(summaryMap);
        summaryMap.fitBounds(imageBounds);

        const actualMarker = L.marker(actualCoordinates, {
            icon: L.icon({
                iconUrl: 'icons/green-marker-icon.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            })
        }).addTo(summaryMap);

        if (guessedMap === mapName) {
            const guessedMarker = L.marker(guessedCoordinates, {
                icon: L.icon({
                    iconUrl: 'icons/red-marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                })
            }).addTo(summaryMap);

            L.polyline([guessedCoordinates, actualCoordinates], { color: 'blue' }).addTo(summaryMap);
        }
    };
    img.src = imageUrl;
}

function openLocationImage(mapName) {
    const imageModal = document.createElement('div');
    imageModal.className = 'image-modal';
    imageModal.style.display = 'block';

    const imageContent = document.createElement('div');
    imageContent.className = 'image-modal-content';

    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-image-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => {
        imageModal.style.display = 'none';
    };

    const image = document.createElement('img');
    const baseMapName = mapName.replace(/\d+\.png$/, '');
    image.src = `images/${baseMapName}/${mapName}`;
    image.className = 'location-image';

    imageContent.appendChild(closeBtn);
    imageContent.appendChild(image);
    imageModal.appendChild(imageContent);
    document.body.appendChild(imageModal);
}
function closeLocationImage() {
    const imageModal = document.querySelector('.image-modal');
    if (imageModal) {
        imageModal.style.display = 'none';
    }
}

function getRandomLocation() {
    const randomIndex = Math.floor(Math.random() * locations.length);
    return locations[randomIndex];
}

function startGame() {
    loadRound();
}

function endGame() {
    window.location.href = 'results.html';
}