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
    document.getElementById('mapSearchBtn').addEventListener("click", showSearch);
    document.getElementById('createMap').addEventListener("click", displayCreateMapForm);
    document.getElementById('inviteesMapBtn').addEventListener("click", displayInviteForm);
}

function setupLoginButtonBox(loginButtonBox) {
    loginButtonBox.style.display = 'flex';
    loginButtonBox.innerHTML = '';

    const mapListBtn = createButton('mapListBtn', 'mapListBtn', '地圖清單');
    const mapSearchBtn = createButton('mapSearchBtn', 'mapSearchBtn', '搜尋地圖');
    const createMapBtn = createButton('createMap', 'createMap', '創建地圖');
    const inviteesMapBtn = createButton('inviteesMapBtn', 'inviteesMapBtn', '邀請');

    loginButtonBox.appendChild(mapListBtn);
    loginButtonBox.appendChild(mapSearchBtn);
    loginButtonBox.appendChild(createMapBtn);
    loginButtonBox.appendChild(inviteesMapBtn);
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
        localStorage.setItem('mapId', roomInfo._id);
        location.reload();
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

function displayInviteForm() {
    const information = document.getElementById('information');
    information.innerHTML = '';

    const roomIdInput = document.createElement("input");
    roomIdInput.setAttribute("type", "text");
    roomIdInput.className = 'roomIdInput';
    roomIdInput.setAttribute("placeholder", "輸入分享的地圖ID");
    roomIdInput.id = 'roomIdInput';
    information.appendChild(roomIdInput);

    const inviteesIdInput = document.createElement("input");
    inviteesIdInput.setAttribute("type", "text");
    inviteesIdInput.className = 'inviteesIdInput';
    inviteesIdInput.setAttribute("placeholder", "輸入受邀者的User ID");
    inviteesIdInput.id = 'inviteesIdInput';
    information.appendChild(inviteesIdInput);

    const inviteUserBtn = document.createElement("button");
    inviteUserBtn.innerText = '確定邀請';
    inviteUserBtn.onclick = inviteUser;
    information.appendChild(inviteUserBtn);
}

function inviteUser() {
    const roomId = document.getElementById('roomIdInput').value;
    const invitees = document.getElementById('inviteesIdInput').value;

    fetch('/api/maps', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomId, loginUserId, invitees })
    })
    .then(response => {
        if (response.ok) {
            const information = document.getElementById('information');
            information.innerHTML = '地圖分享成功!';
        }
    })
    .catch(error => alert(error));
}

function showSearch() {
    const loginButtonBox = document.getElementById('loginButtonBox');

    let searchContainer = document.getElementById('searchContainer');
    if (!searchContainer) {
        searchContainer = document.createElement('nav');
        searchContainer.id = 'searchContainer';
        searchContainer.className = 'searchContainer';
        loginButtonBox.appendChild(searchContainer);

        const mapListSearchInput = document.createElement('input');
        mapListSearchInput.setAttribute("placeholder", "搜尋地圖");
        mapListSearchInput.className = 'mapListSearchInput';
        mapListSearchInput.id = 'mapListSearchInput';
        searchContainer.appendChild(mapListSearchInput);

        const mapSearchDisplayButton = document.createElement('button');
        mapSearchDisplayButton.textContent = '搜尋';
        mapSearchDisplayButton.className = 'mapSearchDisplayButton';
        mapSearchDisplayButton.id = 'mapSearchDisplayButton';
        searchContainer.appendChild(mapSearchDisplayButton);

        mapSearchDisplayButton.addEventListener('click', () => {
            
            const mapListContainer = document.getElementById('information');
            mapListContainer.innerHTML = '';
            const keyword = document.getElementById('mapListSearchInput').value;
            if (keyword) {
                fetch(`/api/maps/search?keyword=${encodeURIComponent(keyword)}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.length === 0){
                            mapListContainer.innerHTML=`
                            查無地圖
                            `
                        }else{
                            data.forEach(map => {
                                const mapElement = createRoomBox(map);
                                mapListContainer.appendChild(mapElement);
                            });
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching data:', error);
                        document.getElementById('results').textContent = '搜索失敗';
                    });
            } else {
                alert('請輸入搜索關鍵字');
            }

            mapListSearchInput.value = '';
            searchContainer.classList.remove('expanded');
        });

        mapListSearchInput.addEventListener('blur', () => {
            if (mapListSearchInput.value === '') {
                searchContainer.classList.remove('expanded');
            }
        });
    }

    if (searchContainer.classList.contains('expanded')) {
        searchContainer.classList.remove('expanded');
    } else {
        searchContainer.classList.add('expanded');
        document.getElementById('mapListSearchInput').focus();
    }
}
