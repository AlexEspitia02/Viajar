function initializeDrawingManager(map) {
    
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