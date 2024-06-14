const socket = io();

let map;
let selectedLatLng;

async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  const mapOptions = {
    zoom: 5,
    center: { lat: 23.97565, lng: 120.9738819 },
    mapId: "7045cb95ea60f66d",
  };

  map = new Map(document.getElementById("map"), mapOptions);

  map.addListener("click", (e) => {
    placeMarkerAndPanTo(e.latLng, map);
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

  function placeMarkerAndPanTo(latLng, map) {
    const beachFlagImg = document.createElement("img");
    beachFlagImg.className = "icon"
    beachFlagImg.src ="./images/location.png";
    selectedLatLng = latLng;
    const marker = new AdvancedMarkerElement({
      position: latLng,
      map: map,
      content: beachFlagImg,
    });
    map.panTo(latLng);
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
  
    try {
      const response = await fetch("/api/marks", {
        method: "POST",
        body: formData,
      });
  
      if (response.ok) {
        alert("數據上傳成功");
        inputTitleBox.value = "";
        inputImgBox.value = "";

        socket.emit('newMarker', {
          title: title,
          lat: selectedLatLng.lat(),
          lng: selectedLatLng.lng(),
          imgSrc: `/uploads/${file.name}`,
          src: "/post.html"
        });

      } else {
        alert("數據上傳失敗");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("發生錯誤");
    }
  });  

  async function fetchImages() {
    try {
      const response = await fetch("/api/marks");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching images:", error);
    }
  }

  const images = await fetchImages();

  images.forEach((imageData) => {
    const infoDiv = document.createElement("div");
    infoDiv.className = "infoDiv";
    const titleDiv = document.createElement("div");
    titleDiv.className = "titleDiv";
    titleDiv.innerText = imageData.title;

    const imgElementLink = document.createElement("a");
    imgElementLink.href = `/dist/blog.html?id=${imageData._id}`;
    imgElementLink.target = "_blank";

    const imgElement = document.createElement("img");
    imgElement.src = imageData.imgSrc;
    imgElement.className = "landmarkImg";
    imgElementLink.appendChild(imgElement);

    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(imgElementLink);

    const infowindow = new google.maps.InfoWindow({
      content: infoDiv,
    });

    const beachFlagImg = document.createElement("img");
    beachFlagImg.className = "icon"
    beachFlagImg.src ="./images/location.png";

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

  socket.on('newMarker', (data) => {
    const infoDiv = document.createElement("div");
    infoDiv.className = "infoDiv";
    const titleDiv = document.createElement("div");
    titleDiv.className = "titleDiv";
    titleDiv.innerText = data.title;

    const imgElementLink = document.createElement("a");
    imgElementLink.href = `/dist/blog.html?id=${data._id}`;
    imgElementLink.target = "_blank";

    const imgElement = document.createElement("img");
    imgElement.src = data.imgSrc;
    imgElement.className = "landmarkImg";
    imgElementLink.appendChild(imgElement);

    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(imgElementLink);

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
}

initMap();
