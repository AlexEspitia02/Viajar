function createAndDisplayMarker(imageData, map, markers, socket, AdvancedMarkerElement) {
    const infoDiv = document.createElement("div");
    infoDiv.className = "infoDiv";
    const titleDiv = document.createElement("div");
    titleDiv.className = "titleDiv";
    titleDiv.innerText = imageData.title;

    const urlParams = new URLSearchParams(window.location.search);
    const mapId = urlParams.get('mapId');
  
    const imgElementLink = document.createElement("a");
    imgElementLink.href = `/dist/blog.html?id=${imageData._id}&mapId=${mapId}&title=${imageData.title}`;
    imgElementLink.target = "_blank";
  
    const imgElement = document.createElement("img");
    imgElement.src = `https://d327wy5d585ux5.cloudfront.net/${imageData.imgSrc}`;
    imgElement.className = "landmarkImg";
    imgElementLink.appendChild(imgElement);
  
    const markDeleteButtonBox = document.createElement("div");
    markDeleteButtonBox.className = 'markDeleteButtonBox';
    
    const markDeleteButton = document.createElement("div");
    markDeleteButton.className = 'markDeleteButton'
  
    markDeleteButton.addEventListener("click", async function () {
        showCustomConfirm('會同時刪除文章，你確定要繼續嗎？', async (confirmed) => {
            if (confirmed) {
                try {
                document.querySelector('.loadingIndicator').style.display = 'flex';
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
                    document.querySelector('.loadingIndicator').style.display = 'none';
                } else {
                    alert("標記刪除失敗");
                }
                } catch (error) {
                console.error("Error:", error);
                alert("發生錯誤");
                }
        
                try {
                document.querySelector('.loadingIndicator').style.display = 'flex';
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
                    showAlert("部落格也刪除了!");
                    document.querySelector('.loadingIndicator').style.display = 'none';
                } else {
                    alert("部落格刪除失敗");
                }
                } catch (error) {
                console.error("Error:", error);
                alert("發生錯誤");
                }
            }
        })
    });
  
    markDeleteButtonBox.appendChild(markDeleteButton);

    infoDiv.appendChild(imgElementLink);
    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(markDeleteButtonBox);
  
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
        deleteMarkerPadding();
        infowindow.open(map, marker);
    });
}

function deleteMarkerPadding() {
    const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const markScrollElements = document.querySelectorAll('.gm-style-iw-d');
                if (markScrollElements.length > 0) {
                    markScrollElements.forEach(element => {
                        element.style.overflow = 'auto';
                        element.style.padding = '0';
                    });
                    const childPaddingElements = document.querySelectorAll('.gm-style-iw-c');
                    if (childPaddingElements.length > 0) {
                        childPaddingElements.forEach(element => {
                            element.style.padding = '0';
                        });
                    }
                    const childCloseIconElements = document.querySelectorAll('button.gm-ui-hover-effect[aria-label="關閉"]');
                    if (childCloseIconElements.length > 0) {
                        childCloseIconElements.forEach(element => {
                            element.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                            element.style.borderRadius = '50%';
                            element.style.height = '32px';
                            element.style.width = '32px';
                            element.style.margin = '5px';

                            element.addEventListener('mouseover', () => {
                                element.style.backgroundColor = 'rgba(255, 255, 255, 1)';
                            });
                            element.addEventListener('mouseout', () => {
                                element.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                            });
                        });
                    }
                    const childCloseIconChildElements = document.querySelectorAll('button.gm-ui-hover-effect[aria-label="關閉"] span');
                    if (childCloseIconChildElements.length > 0) {
                        childCloseIconChildElements.forEach(element => {
                            element.style.margin = '0px 0px 0px 4px';
                        });
                    }
                    observer.disconnect();
                    break;
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
