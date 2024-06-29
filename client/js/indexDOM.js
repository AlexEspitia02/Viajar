const socket = io();
let userId = null;
let activeWindowId = null; 

let loginUserName = null;
let loginUserId = null;
let loginImg = null;
let loginEmail = null;

let mapId = null;

socket.on('init', (data) => {
  userId = data.id;
  console.log(userId);
});

let map;
let selectedLatLng;
let cursorsVisible = true;

let markers = [];

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function updateActiveWindow() {
  activeWindowId = userId;
}

function requestControl() {
  socket.emit('requestMapControl', (response) => {
    if (response.granted) {
      console.log('獲取控制權');
    } else {
      console.log('未獲取控制權');
    }
  });
}

document.addEventListener('mouseout', () => {
  socket.emit('hideCursor', { userId: userId });
});

document.addEventListener('mouseover', () => {
  socket.emit('showCursor', { userId: userId });
});

socket.on('hideCursor', (data) => {
  const cursor = document.getElementById(`cursor-${data.userId}`);
  if (cursor) {
    cursor.style.display = 'none';
  }
});

socket.on('showCursor', (data) => {
  const cursor = document.getElementById(`cursor-${data.userId}`);
  if (cursor) {
    cursor.style.display = 'block';
  }
});

initMap();

async function initMap() {
  
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  const mapOptions = {
    zoom: 5,
    center: { lat: 23.97565, lng: 120.9738819 },
    mapId: "7045cb95ea60f66d",
  };

  map = new Map(document.getElementById("map"), mapOptions);

  document.getElementById('toggleControl').addEventListener('click', function() {
    const leftInfo = document.querySelector('.leftInfo');
    if (leftInfo.style.transform === "translateX(0px)") {
        const toggleControl = document.getElementById('toggleControl');
        toggleControl.innerHTML = '';
        toggleControl.innerHTML = '>';
        leftInfo.style.transform = "translateX(-100%)";
        this.style.transform = "translateY(-50%) translateX(0%)";
    } else {
        leftInfo.style.transform = "translateX(0px)";
        this.style.transform = "translateY(-50%) translateX(425px)";
        const toggleControl = document.getElementById('toggleControl');
        toggleControl.innerHTML = '';
        toggleControl.innerHTML = '<';
    }
});

  checkGoogleLoginStatus(fetchGoogleUserData);
  checkLoginStatus(fetchUserData);

  const debounceEmitMapMove = debounce(() => {
    updateActiveWindow(); // 更新活動視窗
    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('mapId');
    const center = map.getCenter();
    const zoom = map.getZoom();
    socket.emit('mapMove', { id: userId, lat: center.lat(), lng: center.lng(), zoom: zoom , mapId: mapId});
  }, 100);

  socket.on('mapMove', (data) => {
    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('mapId');
    if (data.mapId === mapId){
      if (map && data.id !== activeWindowId) { // 只在不是活動視窗時同步
        const center = new google.maps.LatLng(data.lat, data.lng);
        map.setCenter(center);
        map.setZoom(data.zoom);
      }
    }
  });

  google.maps.event.addListener(map, 'center_changed', () => {
    if (activeWindowId === userId) {
      debounceEmitMapMove();
    }
  });
  google.maps.event.addListener(map, 'zoom_changed', () => {
    if (activeWindowId === userId) {
      debounceEmitMapMove();
    }
  });

  let controlActive = false;

  const controlButton  = document.getElementById('controlButton');
  controlButton.addEventListener("click", () => {
    if (!controlActive) {
      controlButton.innerHTML=`<b style="color:#009382;">釋放</b>控制`;
      debounceEmitMapMove();
      requestControl();
    } else {
      controlButton.innerHTML=`<b style="color:#009382;">獲取</b>控制`;
      socket.emit('releaseMapControl');
    }
    controlActive = !controlActive;
  });

  document.getElementById('toggleCursors').addEventListener('click', () => {
    cursorsVisible = !cursorsVisible;
    socket.emit('toggleCursorsVisibility', { showCursors: cursorsVisible });
    
    document.querySelectorAll('.cursor').forEach(cursor => {
        cursor.style.display = cursorsVisible ? 'block' : 'none';


    const toggleButton = document.getElementById('toggleCursors');
    toggleButton.innerHTML = cursorsVisible ? `<b style="color:#009382;">隱藏</b>鼠標` : `<b style="color:#009382;">顯示</b>鼠標`;
      });
  });

  socket.on('toggleCursorsVisibility', (data) => {
    document.querySelectorAll('.cursor').forEach(cursor => {
      cursor.style.display = data.showCursors ? 'block' : 'none';
    });
  });

  if (!loginUserId) {
    const contentDiv = document.getElementById("information");
    contentDiv.innerHTML = `登入後查看使用者資訊`;
    contentDiv.style.display = 'flex';
  }

  document.addEventListener('mousemove', (event) => {
    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('mapId');
    if (userId) {
      updateActiveWindow(); // 更新活動視窗
      const data = {
        loginUserId,
        loginUserName,
        id: userId,
        mapId: mapId,
        clientX: event.clientX,
        clientY: event.clientY,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight
      };
      socket.emit('mouseMove', data);
    }
  });
  
  socket.on('mouseMove', (data) => {
    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('mapId');
    if (data.mapId === mapId) {
      if (data.id !== activeWindowId) { // 只在不是活動視窗時同步
        let cursor = document.getElementById(`cursor-${data.id}`);
        if (!cursor) {
          cursor = document.createElement('div');
          cursor.id = `cursor-${data.id}`;
          cursor.classList.add('cursor');
          const userNameElement = document.createElement('div');
          userNameElement.classList.add('username');
          const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
          userNameElement.style.backgroundColor = randomColor;
          userNameElement.innerText = data.loginUserName;
          cursor.appendChild(userNameElement);
          document.getElementById('map').appendChild(cursor);
        }
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const x = centerX + data.xOffset;
        const y = centerY + data.yOffset;
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
        cursor.style.display = cursorsVisible ? 'block' : 'none';
      }
    }
  });

  const hasCookieToken = document.cookie.split(';').some(cookie => cookie.trim().startsWith(`token=`));
  const hasLocalStorageToken = localStorage.getItem('jwtToken');
  if (hasCookieToken && hasLocalStorageToken){
    alert("重複登入，請重新登入");
    clearCookieJWT();
    clearJWT();
    location.reload();
  }
  

  map.addListener("click", async (e) => {
    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('mapId');
    const userAndMapMatch = await fetch(`/api/maps/match?loginUserId=${loginUserId}&mapId=${mapId}`)
        .then(response => response.json())
        .catch(error => showAlert(error));
    const hasCookieToken = document.cookie.split(';').some(cookie => cookie.trim().startsWith(`token=`));
    
    if (!localStorage.getItem('jwtToken') && !hasCookieToken) {
      showAlert("請先<b>註冊</b>或<b>登入</b>");
    } else if (!mapId) {
      showAlert("您需要先<b>選擇地圖</b>或<b>創建地圖</b>再來進行這個操作");
    } else if (userAndMapMatch.length === 0) {
      showAlert("您無權使用此地圖或無此地圖");
    } else {
      placeMarkerAndPanTo(e.latLng, map, false);
      socket.emit('newEmptyMarker', { lat: e.latLng.lat(), lng: e.latLng.lng(), mapId });
    }
  });
  socket.on('newEmptyMarker',(data) => {
    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('mapId');
    if ( mapId === data.mapId){
      const latLng = new google.maps.LatLng(data.lat, data.lng);
      placeMarkerAndPanTo(latLng, map, false)
    }
  });

  document.getElementById('Login').addEventListener("click", () => {
    handleAuthForm(true);
  });

  document.getElementById('userInfo').addEventListener("click", () => {
    const information = document.getElementById('information');
    information.innerHTML = '';
    
    const loginButtonBox = document.getElementById('loginButtonBox');
    loginButtonBox.style.display = 'none'
    
    if (loginUserId) {
      const user = {
        name: loginUserName,
        picture: loginImg,
        email: loginEmail,
        id: loginUserId
    };
    updateUserInterface(user);
    }else{
      const contentDiv = document.getElementById("information");
      contentDiv.innerHTML = `登入後查看使用者資訊`;
      contentDiv.style.display = 'flex';
    }
  });

  document.getElementById('mapList').addEventListener("click", handleMapListClick);

  document.getElementById('articleList').addEventListener("click", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('mapId');
    fetch(`/api/blogList?mapId=${mapId}`)
    .then((response) => response.json())
    .then((data) => displayBlogList(data))
    .catch((error) => console.error('Error fetching data:', error));
  });

  document.getElementById('placeSearchList').addEventListener("click", () => {
    handlePlaceListClick(map, AdvancedMarkerElement)
  });

  const inputDiv = document.createElement("div");
  inputDiv.className = "inputDiv";

  const inputTitleBox = document.createElement("input");
  inputTitleBox.setAttribute("type", "text");
  inputTitleBox.className = "inputTitleBox";
  inputTitleBox.setAttribute("placeholder", "Title");

  const inputImgBox = document.createElement("input");
  inputImgBox.setAttribute("type", "file");
  inputImgBox.className = "inputImgBox";

  const inputButton = document.createElement("button");
  inputButton.innerText = "上傳資料";

  inputDiv.appendChild(inputTitleBox);
  inputDiv.appendChild(inputImgBox);
  inputDiv.appendChild(inputButton);

  const infowindow = new google.maps.InfoWindow({
    content: inputDiv,
  });

  function placeMarkerAndPanTo(latLng, map, shouldPan = true) {
    const beachFlagImg = document.createElement("img");
    beachFlagImg.className = "icon"
    beachFlagImg.src ="./images/location.png";
    selectedLatLng = latLng;
    const marker = new AdvancedMarkerElement({
      position: latLng,
      map: map,
      content: beachFlagImg,
    });
    if (shouldPan) {
      map.panTo(latLng);
    }
    marker.addListener("click", function () {
      infowindow.open(map, marker);
    });
  }

  inputButton.addEventListener("click", async () => {
    const title = inputTitleBox.value;
    const file = inputImgBox.files[0];
  
    if (!title || !file || !selectedLatLng) {
      alert("請填寫所有字段並選擇地圖上的位置");
      return;
    }
  
    const formData = new FormData();
    formData.append('main_image', file);
    formData.append('title', title);
    formData.append('lat', selectedLatLng.lat());
    formData.append('lng', selectedLatLng.lng());
    formData.append('loginUserId', loginUserId);
    formData.append('mapId', mapId);
  
    try {
      const response = await fetch("/api/marks", {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        alert("數據上傳成功");
        inputTitleBox.value = "";
        inputImgBox.value = "";

      } else {
        alert("數據上傳失敗");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("發生錯誤");
    }
  }); 

  const urlParams = new URLSearchParams(window.location.search);
  const mapId = urlParams.get('mapId');

  const images = await fetchImages(mapId);
  displayImages(images);

  async function fetchImages(mapId) {
    try {
      const response = await fetch(`/api/marks?mapId=${mapId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }

  socket.on('deleteMarker', (data) => {
    const marker = findMarkerById(data._id);
    if (marker) {
      marker.setMap(null);
    }
  });

  function findMarkerById(_id) {
    return markers.find(marker => marker._id === _id);
  }

  function displayImages(images) {
    images.forEach((imageData) => {
      createAndDisplayMarker(imageData, map, markers, socket, AdvancedMarkerElement);
    });
  }

  socket.on('newMarker', (data) => {
    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('mapId');
    if ( mapId === data.mapId){
      createAndDisplayMarker(data, map, markers, socket, AdvancedMarkerElement);
    }
  });

  initializeDrawingManager(map);

}
