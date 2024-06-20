const socket = io();
let userId = null;
let activeWindowId = null; 

let loginUserName = null;
let loginUserId = null;
let loginImg = null;
let loginEmail = null;

socket.on('init', (data) => {
  userId = data.id;
  console.log(userId);
});

let map;
let selectedLatLng;
let cursorsVisible = true;

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
      console.log('控制权获得，现在可以移动地图');
    } else {
      console.log('控制权未获得');
    }
  });
}

socket.on('mapMove', (data) => {
  if (map && data.id !== activeWindowId) { // 只在不是活動視窗時同步
    const center = new google.maps.LatLng(data.lat, data.lng);
    map.setCenter(center);
    map.setZoom(data.zoom);
  }
});

document.addEventListener('mousemove', (event) => {
  if (userId) {
    updateActiveWindow(); // 更新活動視窗
    const data = {
      id: userId,
      clientX: event.clientX,
      clientY: event.clientY,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight
    };
    socket.emit('mouseMove', data);
  }
});

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

socket.on('mouseMove', (data) => {
  if (data.id !== activeWindowId) { // 只在不是活動視窗時同步
    let cursor = document.getElementById(`cursor-${data.id}`);
    if (!cursor) {
      cursor = document.createElement('div');
      cursor.id = `cursor-${data.id}`;
      cursor.classList.add('cursor');
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
});

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  const mapOptions = {
    zoom: 5,
    center: { lat: 23.97565, lng: 120.9738819 },
    mapId: "7045cb95ea60f66d",
  };

  map = new Map(document.getElementById("map"), mapOptions);

  const debounceEmitMapMove = debounce(() => {
    updateActiveWindow(); // 更新活動視窗
    const center = map.getCenter();
    const zoom = map.getZoom();
    socket.emit('mapMove', { id: userId, lat: center.lat(), lng: center.lng(), zoom: zoom });
    socket.emit('releaseMapControl');
  }, 100);

  // google.maps.event.addListener(map, 'center_changed', () => {
  //   if (activeWindowId === userId) {
  //     debounceEmitMapMove();
  //   }
  // });
  // google.maps.event.addListener(map, 'zoom_changed', () => {
  //   if (activeWindowId === userId) {
  //     debounceEmitMapMove();
  //   }
  // });

  map.addListener("click", (e) => {
    placeMarkerAndPanTo(e.latLng, map, false);
    socket.emit('newEmptyMarker', { lat: e.latLng.lat(), lng: e.latLng.lng() });
  });
  socket.on('newEmptyMarker',(data) => {
    const latLng = new google.maps.LatLng(data.lat, data.lng);
    placeMarkerAndPanTo(latLng, map, false)
  });

  const controlButton  = document.getElementById('controlButton');
  controlButton.addEventListener("click", () => {
    debounceEmitMapMove();
    requestControl();
  });

  document.getElementById('toggleCursors').addEventListener('click', () => {
    cursorsVisible = !cursorsVisible;
    socket.emit('toggleCursorsVisibility', { showCursors: cursorsVisible });
    
    document.querySelectorAll('.cursor').forEach(cursor => {
        cursor.style.display = cursorsVisible ? 'block' : 'none';
    });
  });

  socket.on('toggleCursorsVisibility', (data) => {
    document.querySelectorAll('.cursor').forEach(cursor => {
      cursor.style.display = data.showCursors ? 'block' : 'none';
    });
  });

  function storeJWT(jwtToken) {
    if (jwtToken) {
      localStorage.setItem('jwtToken', jwtToken);
      console.log('JWT stored successfully');
    } else {
      console.error('No JWT token provided');
    }
  }
  
  if (!loginUserId) {
    const contentDiv = document.getElementById("information");
    contentDiv.innerHTML = `登入後查看使用者資訊`;
    contentDiv.style.display = 'block';
  }

  function updateUserInterface(user) {
    const contentDiv = document.getElementById("information");

    contentDiv.innerHTML = `
      <div class="welcomeInfo">
        <h2>Welcome, ${user.name}!</h2>
        <img src="${user.picture}" alt="Profile Picture" class="userPicture"/>
        <p>Email: ${user.email}</p>
      </div>
    `;
    contentDiv.style.display = 'block';
  }
  
  function clearJWT() {
    localStorage.removeItem('jwtToken');
    console.log('JWT cleared from LocalStorage');
  }
  
  async function fetchUserData() {
    const jwtToken = localStorage.getItem('jwtToken');
    if (!jwtToken) {
      console.log('No JWT token found, please log in.');
      return;
    }
  
    try {
      const response = await fetch('/user/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
  
      const data = await response.json();
      console.log('User data:', data);
      updateUserInterface(data.data);
      loginUserName = data.data.name;
      loginUserId = data.data.id;
      loginImg = data.data.picture;
      loginEmail = data.data.email;

      const images = await fetchImages(loginUserId);
      displayImages(images);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.message === 'Failed to fetch user data') {
        clearJWT();
      }
    }
  }
  
  function checkLoginStatus() {
    const jwtToken = localStorage.getItem('jwtToken');
    if (jwtToken) {
      fetchUserData();
    }
  }
  
  checkLoginStatus();

  document.getElementById('Login').addEventListener("click", () => {
    const information = document.getElementById('information');

    information.innerHTML = '';

    const loginButtonBox = document.getElementById('loginButtonBox');
    loginButtonBox.style.display = 'flex'

    loginButtonBox.innerHTML = '';

    const signUpBtn = document.createElement("div");
    signUpBtn.id = 'signUp';
    signUpBtn.className = 'signUp';
    signUpBtn.innerText = 'Sign UP'
    loginButtonBox.appendChild(signUpBtn);

    const signInBtn = document.createElement("div");
    signInBtn.id = 'signIn';
    signInBtn.className = 'signIn';
    signInBtn.innerText = 'Sign In'
    loginButtonBox.appendChild(signInBtn);

    const username = document.createElement("input");
    username.setAttribute("type", "text");
    username.className = 'logInInput';
    username.setAttribute("placeholder", "輸入用戶名");
    username.id = 'inputUsername'
    information.appendChild(username);

    const email = document.createElement("input");
    email.setAttribute("type", "text");
    email.className = 'logInInput';
    email.setAttribute("placeholder", "輸入信箱");
    email.id = 'inputEmail'
    information.appendChild(email);

    const password = document.createElement("input");
    password.setAttribute("type", "password");
    password.className = 'logInInput';
    password.setAttribute("placeholder", "輸入密碼");
    password.id = 'inputPassword'
    information.appendChild(password);
    
    const loginButton = document.createElement("button");
    loginButton.innerText = "註冊";
    loginButton.onclick = function() {
      submitSignupForm()
    };
    information.appendChild(loginButton);

    document.getElementById('signUp').addEventListener("click", () => {
      const information = document.getElementById('information');
  
      information.innerHTML = '';
  
      const username = document.createElement("input");
      username.setAttribute("type", "text");
      username.className = 'logInInput';
      username.setAttribute("placeholder", "輸入用戶名");
      username.id = 'inputUsername'
      information.appendChild(username);
  
      const email = document.createElement("input");
      email.setAttribute("type", "text");
      email.className = 'logInInput';
      email.setAttribute("placeholder", "輸入信箱");
      email.id = 'inputEmail'
      information.appendChild(email);
  
      const password = document.createElement("input");
      password.setAttribute("type", "password");
      password.className = 'logInInput';
      password.setAttribute("placeholder", "輸入密碼");
      password.id = 'inputPassword'
      information.appendChild(password);
      
      const loginButton = document.createElement("button");
      loginButton.innerText = "註冊";
      loginButton.onclick = function() {
        submitSignupForm()
      };
      information.appendChild(loginButton);
    });
  
    function submitSignupForm() {
      const name = document.getElementById('inputUsername').value;
      const email = document.getElementById('inputEmail').value;
      const password = document.getElementById('inputPassword').value;
  
      fetch('/user/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Signup Success:', data);
          if (data.success && data.data.access_token) {
            console.log('Access Token Received:', data.data.access_token);
            storeJWT(data.data.access_token);
            const contentDiv = document.getElementById("information");
            contentDiv.innerHTML = `
              <div class="welcomeInfo">
                <h2>Welcome, ${data.data.user.name}!</h2>
                <img src="${data.data.user.picture}" class="userPicture"/>
                <p>Email: ${data.data.user.email}</p>
              </div>
            `;
            loginUserName = data.data.user.name;
            loginUserId = data.data.user.id;
            loginImg = data.data.user.picture;
            loginEmail = data.data.user.email;
            contentDiv.style.display = 'block';
          } else {
            alert(data.message || 'No JWT token provided');
          }
      })
      .catch(error => console.error('Signup Error:', error));
    }
  
    document.getElementById('signIn').addEventListener("click", () => {
      const information = document.getElementById('information');
  
      information.innerHTML = '';
  
      const email = document.createElement("input");
      email.setAttribute("type", "text");
      email.className = 'logInInput';
      email.setAttribute("placeholder", "輸入信箱");
      email.id = 'inputEmail'
      information.appendChild(email);
  
      const password = document.createElement("input");
      password.setAttribute("type", "password");
      password.className = 'logInInput';
      password.setAttribute("placeholder", "輸入密碼");
      password.id = 'inputPassword'
      information.appendChild(password);
      
      const loginButton = document.createElement("button");
      loginButton.innerText = "登入";
      loginButton.onclick = function() {
        submitSignInForm()
      };
      information.appendChild(loginButton);
    });
  
    function submitSignInForm() {
      const email = document.getElementById('inputEmail').value;
      const password = document.getElementById('inputPassword').value;
  
      fetch('/user/signIn', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })
      .then(response => response.json())
      .then(data => {
        console.log('SignIn Success:', data);
        if (data.success && data.data.access_token) {
          console.log('Access Token Received:', data.data.access_token);
          storeJWT(data.data.access_token);
          const contentDiv = document.getElementById("information");
          contentDiv.innerHTML = `
            <div class="welcomeInfo">
              <h2>Welcome, ${data.data.user.name}!</h2>
              <img src="${data.data.user.picture}" class="userPicture"/>
              <p>Email: ${data.data.user.email}</p>
            </div>
          `;
          loginUserName = data.data.user.name;
          loginUserId = data.data.user.id;
          loginImg = data.data.user.picture;
          loginEmail = data.data.user.email;
          contentDiv.style.display = 'block';
        } else {
          alert(data.message || 'No JWT token provided');
        }
      })
      .catch(error => console.error('Signup Error:', error));
    }
  });

  document.getElementById('userInfo').addEventListener("click", () => {
    const information = document.getElementById('information');
    information.innerHTML = '';
    
    const loginButtonBox = document.getElementById('loginButtonBox');
    loginButtonBox.style.display = 'none'
    
    if (loginUserId) {
      const contentDiv = document.getElementById("information");
      contentDiv.innerHTML = `
        <div class="welcomeInfo">
          <h2>Welcome, ${loginUserName}!</h2>
          <img src="${loginImg}" alt="Profile Picture" class="userPicture"/>
          <p>Email: ${loginEmail}</p>
        </div>
      `;
      contentDiv.style.display = 'block';
    }else{
      const contentDiv = document.getElementById("information");
      contentDiv.innerHTML = `登入後查看使用者資訊`;
      contentDiv.style.display = 'block';
    }
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

  async function fetchImages(loginUserId) {
    try {
      const response = await fetch(`/api/marks?loginUserId=${loginUserId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }

  function displayImages(images) {
    images.forEach((imageData) => {
      const infoDiv = document.createElement("div");
      infoDiv.className = "infoDiv";
      const titleDiv = document.createElement("div");
      titleDiv.className = "titleDiv";
      titleDiv.innerText = imageData.title;
  
      const imgElementLink = document.createElement("a");
      imgElementLink.href = `/dist/blog.html?id=${imageData._id}&title=${encodeURIComponent(imageData.title)}`;
      imgElementLink.target = "_blank";
  
      const imgElement = document.createElement("img");
      imgElement.src = imageData.imgSrc;
      imgElement.className = "landmarkImg";
      imgElementLink.appendChild(imgElement);
  
      const buttonBox = document.createElement("div");
      const markDeleteButton = document.createElement("button");
      markDeleteButton.innerText = "刪除";
  
      markDeleteButton.addEventListener("click", async function () {
        const userConfirmation = confirm('會同時刪除文章，你確定要繼續嗎？');
        if (userConfirmation) {
          try {
            const response = await fetch("/api/marks/delete", {
              method: "delete",
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                _id: imageData._id,
              }),
            });
  
            if (response.ok) {
              marker.setMap(null);
            } else {
              alert("標記刪除失敗");
            }
          } catch (error) {
            console.error("Error:", error);
            alert("發生錯誤");
          }
  
          try {
            const response = await fetch("/api/posts/delete", {
              method: "delete",
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                _id: imageData._id,
              }),
            });
  
            if (response.ok) {
              alert("部落格也刪除了!");
            } else {
              alert("部落格刪除失敗");
            }
          } catch (error) {
            console.error("Error:", error);
            alert("發生錯誤");
          }
        }
      });
  
      buttonBox.appendChild(markDeleteButton);
  
      infoDiv.appendChild(titleDiv);
      infoDiv.appendChild(imgElementLink);
      infoDiv.appendChild(buttonBox);
  
      const infowindow = new google.maps.InfoWindow({
        content: infoDiv,
      });
  
      const beachFlagImg = document.createElement("img");
      beachFlagImg.className = "icon";
      beachFlagImg.src = "./images/location.png";
  
      const marker = new AdvancedMarkerElement({
        map,
        gmpClickable: true,
        position: { lat: imageData.lat, lng: imageData.lng },
        title: imageData.title,
        content: beachFlagImg,
      });
  
      marker.addListener("click", function () {
        infowindow.open(map, marker);
      });
    });
  }

  socket.on('newMarker', (data) => {
    const infoDiv = document.createElement("div");
    infoDiv.className = "infoDiv";
    const titleDiv = document.createElement("div");
    titleDiv.className = "titleDiv";
    titleDiv.innerText = data.title;

    const imgElementLink = document.createElement("a");
    imgElementLink.href = `/dist/blog.html?id=${data._id}&title=${encodeURIComponent(data.title)}`;
    imgElementLink.target = "_blank";

    const imgElement = document.createElement("img");
    imgElement.src = data.imgSrc;
    imgElement.className = "landmarkImg";
    imgElementLink.appendChild(imgElement);

    const buttonBox = document.createElement("div");
    const markDeleteButton = document.createElement("button");
    markDeleteButton.innerText = "刪除"
    
    markDeleteButton.addEventListener("click", async function () {
      const userConfirmation = confirm('會同時刪除文章，你確定要繼續嗎？');
      if(userConfirmation){
        try {
          const response = await fetch("/api/marks/delete", {
            method: "delete",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              _id: data._id
            })
          });
    
          if (response.ok) {
            marker.setMap(null);
          } else {
            alert("標記刪除失敗");
          }
        } catch (error) {
          console.error("Error:", error);
          alert("發生錯誤");
        }
  
        try {
          const response = await fetch("/api/posts/delete", {
            method: "delete",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              _id: data._id
            })
          });
    
          if (response.ok) {
            alert("部落格也刪除了!");
          } else {
            alert("部落格刪除失敗");
          }
        } catch (error) {
          console.error("Error:", error);
          alert("發生錯誤");
        }
      }
    });

    buttonBox.appendChild(markDeleteButton);

    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(imgElementLink);
    infoDiv.appendChild(buttonBox);

    const infowindow = new google.maps.InfoWindow({
      content: infoDiv,
    });

    const beachFlagImg = document.createElement("img");
    beachFlagImg.className = "icon";
    beachFlagImg.src = "./images/location.png";

    const marker = new AdvancedMarkerElement({
      map,
      gmpClickable: true,
      position: { lat: data.lat, lng: data.lng },
      title: data.title,
      content: beachFlagImg,
    });

    marker.addListener("click", function () {
      infowindow.open(map, marker);
    });
  });

  const drawingManager = new google.maps.drawing.DrawingManager({
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: [
        google.maps.drawing.OverlayType.MARKER,
        google.maps.drawing.OverlayType.CIRCLE,
        google.maps.drawing.OverlayType.POLYGON,
        google.maps.drawing.OverlayType.POLYLINE,
        google.maps.drawing.OverlayType.RECTANGLE,
      ],
    },
    markerOptions: {
      icon: "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png",
    },
    circleOptions: {
      fillColor: "#f1c40f",
      fillOpacity: 0.35,
      strokeWeight: 3,
      strokeColor: '#f1c40f',
      clickable: false,
      editable: true,
      zIndex: 1,
    },
  });

  drawingManager.setMap(map);

}

initMap();
