function createAndDisplayMarker(imageData, map, markers, socket, AdvancedMarkerElement) {
    const infoDiv = document.createElement("div");
    infoDiv.className = "infoDiv";
    const titleDiv = document.createElement("div");
    titleDiv.className = "titleDiv";
    titleDiv.innerText = imageData.title;

    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('mapId');
  
    const imgElementLink = document.createElement("a");
    imgElementLink.href = `/dist/blog.html?id=${imageData._id}&title=${encodeURIComponent(imageData.title)}&mapId=${mapId}`;
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
                socket.emit('deleteMarker', { _id: imageData._id });
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
  
    marker._id = imageData._id;
    markers.push(marker); 
  
    marker.addListener("click", function () {
        infowindow.open(map, marker);
    });
}
