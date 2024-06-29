async function findPlaces(placeText, map) {
  const { Place } = await google.maps.importLibrary("places");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  const request = {
      textQuery: placeText,
      fields: [
          "displayName",
          "location",
          // "businessStatus", 
          "rating",
          "photos",
          "formattedAddress",
          "websiteURI",
          // "regularOpeningHours", 
          // "priceLevel"
      ],
      // includedType: "restaurant",
      // isOpenNow: true,
      language: "zh-TW",
      maxResultCount: 7,
      // minRating: 3.2,
      region: "TW",
      useStrictTypeFiltering: false,
  };
  const { places } = await Place.searchByText(request);

  if (places.length) {
      const { LatLngBounds } = await google.maps.importLibrary("core");
      const bounds = new LatLngBounds();
      const organizedPlaces = [];

      places.forEach((place) => {
          const markerView = createMarker(map, place, AdvancedMarkerElement, true);
          bounds.extend(place.location);

          const locationContent = createLocationContent(place, map, true);
          information.appendChild(locationContent);

          const imgUrl = `https://places.googleapis.com/v1/${place.photos[0].Eg}/media?maxHeightPx=400&maxWidthPx=400&key=AIzaSyBP6QgwDv2lnYLfEibqS1grCAh64BPnEJI`;

          const newPlace = {
              displayName: place.displayName,
              formattedAddress: place.formattedAddress,
              placeId: place.id,
              location: place.location,
              imgUrl,
              rating: place.rating,
              websiteURI: place.websiteURI,
          };

          organizedPlaces.push(newPlace);
      });

      map.fitBounds(bounds, { padding: 50 });

      fetch('/api/places', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(organizedPlaces),
      })
          .catch(error => console.error('輸入資料錯誤:', error));

  } else {
      console.log("No results");
  }
}

function createMarker(map, place, AdvancedMarkerElement, isFromFindPlaces = false) {
  const searchFlagImg = document.createElement("img");
  searchFlagImg.className = "icon";
  searchFlagImg.src = "./images/search.png";

  const markerView = new AdvancedMarkerElement({
      map,
      position: place.location,
      title: place.displayName,
      content: searchFlagImg,
  });

  const landmarkSearchContent = document.createElement('div');
  landmarkSearchContent.className = 'landmarkSearchContent';

  const landmarkSearchContentTitle = document.createElement('div');
  landmarkSearchContentTitle.className = 'landmarkSearchContentTitle'
  landmarkSearchContentTitle.innerText = place.displayName;

  const landmarkSearchContentImg = document.createElement('img');
  landmarkSearchContentImg.className = 'landmarkSearchContentImg';
  landmarkSearchContentImg.src = isFromFindPlaces
  ? `https://places.googleapis.com/v1/${place.photos[0].Eg}/media?maxHeightPx=400&maxWidthPx=400&key=AIzaSyBP6QgwDv2lnYLfEibqS1grCAh64BPnEJI`
  : `placeImg/${place.imgUrl}`;

  const landmarkSearchContentBtn = document.createElement('div');
  landmarkSearchContentBtn.id = 'landmarkSearchContentBtn';
  landmarkSearchContentBtn.className = 'landmarkSearchContentBtn';
  landmarkSearchContentBtn.addEventListener('click',()=>{
    // fetch(`/api/places/location?lat=${place.location.lat}&lng=${place.location.lng}`)
    //     .then(response => response.json())
    //     .then(async (data) => {
    //         if (data.length > 0) {
    //             const { LatLngBounds } = await google.maps.importLibrary("core");
    //             const bounds = new LatLngBounds();

    //             data.forEach((place) => {
    //                 const markerView = createMarker(map, place, AdvancedMarkerElement, false);
    //                 bounds.extend(place.location);

    //                 const locationContent = createLocationContent(place, map, false);
    //                 information.appendChild(locationContent);
    //             });

    //             map.fitBounds(bounds, { padding: 50 });

    //         } else {
                
                nearbySearch(place.location);
        //     }
        // })
        // .catch(error => console.error('Place Search Error:', error));
  });
  
  landmarkSearchContent.appendChild(landmarkSearchContentTitle);
  landmarkSearchContent.appendChild(landmarkSearchContentImg);
  landmarkSearchContent.appendChild(landmarkSearchContentBtn);

  const infowindow = new google.maps.InfoWindow({
      content: landmarkSearchContent,
  });

  markerView.addListener("click", function () {
      infowindow.open(map, markerView);
  });

  return markerView;
}

function createLocationContent(place, map, isFromFindPlaces = false) {
  const locationContent = document.createElement('div');
  locationContent.id = 'locationContent';
  locationContent.className = 'locationContent';

  locationContent.addEventListener('click', () => {
      map.panTo(place.location);
      map.setZoom(18);
  });

  const locationLeftContent = document.createElement('div');
  locationLeftContent.id = 'locationLeftContent';
  locationLeftContent.className = 'locationLeftContent';
  locationContent.appendChild(locationLeftContent);

  const displayName = document.createElement('h2');
  displayName.innerText = place.displayName;
  locationLeftContent.appendChild(displayName);

  const formattedAddress = document.createElement('p');
  formattedAddress.innerText = place.formattedAddress;
  locationLeftContent.appendChild(formattedAddress);

  const websiteURI = document.createElement('a');
  websiteURI.innerText = 'website';
  websiteURI.href = place.websiteURI;
  locationLeftContent.appendChild(websiteURI);

  const photos = document.createElement('img');
  const imgUrl = isFromFindPlaces
      ? `https://places.googleapis.com/v1/${place.photos[0].Eg}/media?maxHeightPx=400&maxWidthPx=400&key=AIzaSyBP6QgwDv2lnYLfEibqS1grCAh64BPnEJI`
      : `placeImg/${place.imgUrl}`;
  photos.src = imgUrl;
  locationContent.appendChild(photos);

  return locationContent;
}

function handlePlaceListClick(map, AdvancedMarkerElement) {
  if (loginUserId) {
      const information = document.getElementById('information');
      information.innerHTML = '';

      const loginButtonBox = document.getElementById('loginButtonBox');
      loginButtonBox.style.display = 'flex';
      loginButtonBox.innerHTML = '';

      const placeListSearchInput = document.createElement('input');
      placeListSearchInput.setAttribute("placeholder", "搜尋景點");
      placeListSearchInput.className = 'placeListSearchInput';
      placeListSearchInput.id = 'placeListSearchInput';
      loginButtonBox.appendChild(placeListSearchInput);

      const placeListSearchButton = document.createElement('button');
      placeListSearchButton.textContent = '搜尋';
      placeListSearchButton.className = 'placeListSearchButton';
      placeListSearchButton.id = 'placeListSearchButton';
      loginButtonBox.appendChild(placeListSearchButton);

      placeListSearchButton.addEventListener("click", () => {
          const placeResult = document.getElementById('placeListSearchInput').value.trim();

          fetch(`/api/places?keyword=${placeResult}`)
              .then(response => response.json())
              .then(async (data) => {
                  if (data.length > 0) {
                      const { LatLngBounds } = await google.maps.importLibrary("core");
                      const bounds = new LatLngBounds();

                      data.forEach((place) => {
                          const markerView = createMarker(map, place, AdvancedMarkerElement, false);
                          bounds.extend(place.location);

                          const locationContent = createLocationContent(place, map, false);
                          information.appendChild(locationContent);
                      });

                      map.fitBounds(bounds, { padding: 50 });

                  } else {
                      findPlaces(placeResult, map);
                  }
              })
              .catch(error => console.error('Place Search Error:', error));
      });
  } else {
      const loginButtonBox = document.getElementById('loginButtonBox');
      loginButtonBox.style.display = 'none';
      const information = document.getElementById('information');
      information.innerHTML = '登入後查詢地點';
  }
}

async function nearbySearch(location) {
    const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary(
      "places",
    );
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    const request = {
        fields: [
            "displayName",
            "location",
            "rating",
            "photos",
            "formattedAddress",
            "websiteURI",
        ],
        locationRestriction: {
            center: location,
            radius: 500,
        },
        includedPrimaryTypes: ["restaurant"],
        maxResultCount: 10,
        rankPreference: SearchNearbyRankPreference.POPULARITY,
        language: "zh-TW",
        region: "TW",
    };
    const { places } = await Place.searchNearby(request);
  
    if (places.length) {
      const organizedPlaces = [];
  
      const { LatLngBounds } = await google.maps.importLibrary("core");
      const bounds = new LatLngBounds();
  
      places.forEach((place) => {
        const searchFlagImg = document.createElement("img");
        searchFlagImg.className = "icon";
        searchFlagImg.src = "./images/restaurant.png";

        const markerView = new AdvancedMarkerElement({
          map,
          position: place.location,
          title: place.displayName,
          content:searchFlagImg,
        });
  
        bounds.extend(place.location);

        const locationContent = createLocationContent(place, map, true);
        information.appendChild(locationContent);

        const imgUrl = `https://places.googleapis.com/v1/${place.photos[0].Eg}/media?maxHeightPx=400&maxWidthPx=400&key=AIzaSyBP6QgwDv2lnYLfEibqS1grCAh64BPnEJI`;

        const newPlace = {
            displayName: place.displayName,
            formattedAddress: place.formattedAddress,
            placeId: place.id,
            location: place.location,
            imgUrl,
            rating: place.rating,
            websiteURI: place.websiteURI,
        };
        organizedPlaces.push(newPlace);
      });
      map.fitBounds(bounds);

    //   fetch('/api/places', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(organizedPlaces),
    //     })
    //     .catch(error => console.error('輸入資料錯誤:', error));

    } else {
      console.log("No results");
    }
  }