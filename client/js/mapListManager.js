function handleMapListClick() {
    const information = document.getElementById('information');
    const loginButtonBox = document.getElementById('loginButtonBox');
    setupLoginButtonBox(loginButtonBox);

    if (loginUserId) {
        fetchMapList();
    } else {
        displayLoginPrompt(information);
    }

    document.getElementById('mapListBtn').addEventListener("click", fetchMapList);
    document.getElementById('createMap').addEventListener("click", displayCreateMapForm);
}

function setupLoginButtonBox(loginButtonBox) {
    loginButtonBox.style.display = 'flex';
    loginButtonBox.innerHTML = '';

    const mapListBtn = createButton('mapListBtn', 'mapListBtn', '地圖清單');
    const createMapBtn = createButton('createMap', 'createMap', '創建地圖');

    loginButtonBox.appendChild(mapListBtn);
    loginButtonBox.appendChild(createMapBtn);
}

function createButton(id, className, text) {
    const button = document.createElement("div");
    button.id = id;
    button.className = className;
    button.innerText = text;
    return button;
}

function fetchMapList() {
    if (!loginUserId) {
        const information = document.getElementById('information');
        information.innerText = '登入後查看地圖清單';
        return;
    }
    
    fetch(`/api/maps?loginUserId=${loginUserId}`)
        .then(response => response.json())
        .then(data => {
            const information = document.getElementById('information');
            information.innerHTML = '';

            data.forEach(roomInfo => {
                const roomBox = createRoomBox(roomInfo);
                information.appendChild(roomBox);
            });
        })
        .catch(error => console.error('Map Create Error:', error));
}

function createRoomBox(roomInfo) {
    const roomBox = document.createElement("div");
    roomBox.className = 'roomBox';
    roomBox.id = `roomBox-${roomInfo._id}`;

    const roomName = createRoomDetail('roomName', `地圖名稱: ${roomInfo.roomName}`);
    const roomId = createRoomDetail('roomId', `地圖 ID: ${roomInfo._id}`);
    const roomOwner = createRoomDetail('roomOwner', `創建人: ${roomInfo.loginUserName}`);

    roomBox.appendChild(roomName);
    roomBox.appendChild(roomId);
    roomBox.appendChild(roomOwner);

    roomBox.addEventListener("click", () => {
        mapId = roomInfo._id;
        console.log(mapId);
    });

    return roomBox;
}

function createRoomDetail(className, text) {
    const detail = document.createElement("div");
    detail.className = className;
    detail.innerText = text;
    return detail;
}

function displayLoginPrompt(information) {
    information.innerHTML = '登入後查看地圖清單';
    information.style.display = 'flex';
}

function displayCreateMapForm() {
    if (loginUserId) {
        const information = document.getElementById('information');
        information.innerHTML = '';
    
        const roomNameInput = document.createElement("input");
        roomNameInput.setAttribute("type", "text");
        roomNameInput.className = 'roomNameInput';
        roomNameInput.setAttribute("placeholder", "輸入地圖名稱");
        roomNameInput.id = 'roomNameInput';
        information.appendChild(roomNameInput);
    
        const createRoomBtn = document.createElement("button");
        createRoomBtn.innerText = '確定創建';
        createRoomBtn.onclick = createMap;
        information.appendChild(createRoomBtn);
    } else {
        const information = document.getElementById('information');
        information.innerHTML = '登入後創建地圖';
    }
}

function createMap() {
    const roomName = document.getElementById('roomNameInput').value;

    fetch('/api/maps', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomName, loginUserId, loginUserName })
    })
    .then(response => {
        if (response.ok) {
            const information = document.getElementById('information');
            information.innerHTML = '上傳地圖成功! 請點擊地圖清單';
        }
    })
    .catch(error => console.error('Map Create Error:', error));
}