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
      // "priceLevel",
      "types",
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
    const organizedPlaces = await handlePlaceSearch(places, map, AdvancedMarkerElement, true);
    await handleAPIRequests(organizedPlaces);
  } else {
    console.log("No results");
  }
}

async function nearbySearch(location) {
  const { Place, SearchNearbyRankPreference } = await google.maps.importLibrary("places");
  const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

  const request = {
    fields: [
      "displayName",
      "location",
      "rating",
      "photos",
      "formattedAddress",
      "websiteURI",
      "types",
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
    const organizedPlaces = await handlePlaceSearch(places, map, AdvancedMarkerElement, true, true);
    await handleAPIRequests(organizedPlaces);
  } else {
    console.log("No results");
  }
}

async function handlePlaceSearch(places, map, AdvancedMarkerElement, isFromFindPlaces, isRestaurant = false) {
  const { LatLngBounds } = await google.maps.importLibrary("core");
  const bounds = new LatLngBounds();
  const organizedPlaces = [];

  places.forEach((place) => {
    const markerView = createMarker(map, place, AdvancedMarkerElement, isFromFindPlaces, isRestaurant);
    bounds.extend(place.location);

    const locationContent = createLocationContent(place, map, isFromFindPlaces);
    information.appendChild(locationContent);

    const newPlace = organizePlaceData(place);
    organizedPlaces.push(newPlace);
  });

  map.fitBounds(bounds, { padding: 50 });
  return organizedPlaces;
}

function organizePlaceData(place) {
  return {
    displayName: place.displayName,
    formattedAddress: place.formattedAddress,
    placeId: place.id,
    location: place.location,
    imgUrl: `https://places.googleapis.com/v1/${place.photos[0].Eg}/media?maxHeightPx=400&maxWidthPx=400&key=AIzaSyBP6QgwDv2lnYLfEibqS1grCAh64BPnEJI`,
    rating: place.rating,
    websiteURI: place.websiteURI,
    type: place.types
  };
}

async function handleAPIRequests(organizedPlaces) {
  const placeIds = organizedPlaces.map((place) => place.placeId).join(",");
  const existingPlaces = await fetchPlacesData(`/api/place?placeId=${placeIds}`);
  const newPlaces = filterNewPlaces(organizedPlaces, existingPlaces);

  await postNewPlaces(newPlaces);
}

function filterNewPlaces(organizedPlaces, existingPlaces) {
  return organizedPlaces.filter(
    (place) => !existingPlaces.some((existingPlace) => existingPlace.placeId === place.placeId)
  );
}

async function postNewPlaces(newPlaces) {
  if (newPlaces.length > 0) {
    await fetch("/api/places", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPlaces)
    });
  }
}

async function fetchPlacesData(url) {
  const response = await fetch(url);
  return response.json();
}

function createMarker(
  map,
  place,
  AdvancedMarkerElement,
  isFromFindPlaces = false,
  isRestaurant = false
) {
  const searchFlagImg = document.createElement("img");
  searchFlagImg.className = "icon";
  searchFlagImg.src = isRestaurant
    ? "./images/restaurant.png"
    : "./images/search.png";

  const markerView = new AdvancedMarkerElement({
    map,
    position: place.location,
    title: place.displayName,
    content: searchFlagImg,
  });

  const landmarkSearchContent = document.createElement("div");
  landmarkSearchContent.className = "landmarkSearchContent";

  const landmarkSearchContentTitle = document.createElement("div");
  landmarkSearchContentTitle.className = "landmarkSearchContentTitle";
  landmarkSearchContentTitle.innerText = place.displayName;

  const landmarkSearchContentImg = document.createElement("img");
  landmarkSearchContentImg.className = "landmarkSearchContentImg";
  landmarkSearchContentImg.src = isFromFindPlaces
    ? `https://places.googleapis.com/v1/${place.photos[0].Eg}/media?maxHeightPx=400&maxWidthPx=400&key=AIzaSyBP6QgwDv2lnYLfEibqS1grCAh64BPnEJI`
    : `${place.imgUrl}`;

  const landmarkSearchContentBtn = document.createElement("div");
  landmarkSearchContentBtn.id = "landmarkSearchContentBtn";
  landmarkSearchContentBtn.className = "landmarkSearchContentBtn";
  landmarkSearchContentBtn.addEventListener("click", () => {
    document.querySelector(".loadingIndicator").style.display = "flex";
    fetch(
      `/api/places/location?lat=${place.location.lat}&lng=${place.location.lng}`
    )
      .then((response) => response.json())
      .then(async (data) => {
        const moreRestaurant = 10 - data.length;
        if (moreRestaurant <= 0) {
          const { LatLngBounds } = await google.maps.importLibrary("core");
          const bounds = new LatLngBounds();

          data.forEach((place) => {
            const markerView = createMarker(
              map,
              place,
              AdvancedMarkerElement,
              false,
              true
            );
            bounds.extend(place.location);

            const locationContent = createLocationContent(place, map, false);
            information.appendChild(locationContent);
          });

          map.fitBounds(bounds, { padding: 50 });
          document.querySelector(".loadingIndicator").style.display = "none";
        } else {
          nearbySearch(place.location);
          document.querySelector(".loadingIndicator").style.display = "none";
        }
      })
      .catch((error) => console.error("Place Search Error:", error));
  });

  landmarkSearchContent.appendChild(landmarkSearchContentImg);
  landmarkSearchContent.appendChild(landmarkSearchContentTitle);
  landmarkSearchContent.appendChild(landmarkSearchContentBtn);

  const infowindow = new google.maps.InfoWindow({
    content: landmarkSearchContent,
  });

  markerView.addListener("click", function () {
    deleteMarkerPadding();
    infowindow.open(map, markerView);
  });

  return markerView;
}

function createLocationContent(place, map, isFromFindPlaces = false) {
  const locationContent = document.createElement("div");
  locationContent.id = "locationContent";
  locationContent.className = "locationContent";

  locationContent.addEventListener("click", () => {
    map.panTo(place.location);
    map.setZoom(18);
  });

  const photos = document.createElement("img");
  const imgUrl = isFromFindPlaces
    ? `https://places.googleapis.com/v1/${place.photos[0].Eg}/media?maxHeightPx=400&maxWidthPx=400&key=AIzaSyBP6QgwDv2lnYLfEibqS1grCAh64BPnEJI`
    : `${place.imgUrl}`;
  photos.src = imgUrl;
  locationContent.appendChild(photos);

  const locationLeftContent = document.createElement("div");
  locationLeftContent.id = "locationLeftContent";
  locationLeftContent.className = "locationLeftContent";
  locationContent.appendChild(locationLeftContent);

  const displayName = document.createElement("div");
  displayName.innerText = place.displayName;
  displayName.className = "locationLeftContentTitle";
  locationLeftContent.appendChild(displayName);

  const formattedAddress = document.createElement("p");
  formattedAddress.innerText = place.formattedAddress;
  locationLeftContent.appendChild(formattedAddress);

  const websiteURI = document.createElement("a");
  websiteURI.innerText = "website";
  websiteURI.href = place.websiteURI;
  locationLeftContent.appendChild(websiteURI);

  return locationContent;
}

function handlePlaceListClick(map, AdvancedMarkerElement) {
  if (loginUserId) {
    const information = document.getElementById("information");
    information.innerHTML = `
      <div class="WithoutMapId">
          <div>查詢後顯示地點</div>
      </div>
      `;

    const loginButtonBox = document.getElementById("loginButtonBox");
    loginButtonBox.style.display = "flex";
    loginButtonBox.innerHTML = "";

    const placeListSearchInput = document.createElement("input");
    placeListSearchInput.setAttribute("placeholder", "搜尋景點");
    placeListSearchInput.className = "placeListSearchInput";
    placeListSearchInput.id = "placeListSearchInput";
    loginButtonBox.appendChild(placeListSearchInput);

    const placeListSearchButton = document.createElement("button");
    placeListSearchButton.textContent = "搜尋";
    placeListSearchButton.className = "placeListSearchButton";
    placeListSearchButton.id = "placeListSearchButton";
    loginButtonBox.appendChild(placeListSearchButton);

    placeListSearchButton.addEventListener("click", () => {
      const placeResult = document
        .getElementById("placeListSearchInput")
        .value.trim();

      document.querySelector(".loadingIndicator").style.display = "flex";

      fetch(`/api/places?keyword=${placeResult}`)
        .then((response) => response.json())
        .then(async (data) => {
          if (data.success === false) {
            showAlert(data.error);
            document.querySelector(".loadingIndicator").style.display = "none";
          } else {
            information.innerHTML = "";
            if (data.length > 0) {
              const { LatLngBounds } = await google.maps.importLibrary("core");
              const bounds = new LatLngBounds();

              data.forEach((place) => {
                const markerView = createMarker(
                  map,
                  place,
                  AdvancedMarkerElement,
                  false,
                  false
                );
                bounds.extend(place.location);

                const locationContent = createLocationContent(
                  place,
                  map,
                  false
                );
                information.appendChild(locationContent);
              });

              map.fitBounds(bounds, { padding: 50 });

              document.querySelector(".loadingIndicator").style.display =
                "none";
            } else {
              findPlaces(placeResult, map);
              document.querySelector(".loadingIndicator").style.display =
                "none";
            }
          }
        })
        .catch((error) => console.error("Place Search Error:", error));
    });
  } else {
    const loginButtonBox = document.getElementById("loginButtonBox");
    loginButtonBox.style.display = "none";
    const information = document.getElementById("information");
    information.innerHTML = `
      <div class="WithoutMapId">
          <div>登入後查詢地點</div>
      </div>
      `;
  }
}
