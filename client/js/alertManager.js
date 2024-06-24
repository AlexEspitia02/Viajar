function showAlert(message) {
    let alert = document.getElementById('alert');
    if (!alert) {
      alert = document.createElement("div");
      alert.className = 'alert';
      alert.id = 'alert';
  
      const alertContent = document.createElement("div");
      alertContent.className = 'alertContent';
  
      const alertClosure = document.createElement("span");
      alertClosure.innerHTML = '&times;';
      alertClosure.className = 'alertClosure';
      alertClosure.onclick = function() {
        alert.style.display = 'none';
      }
  
      const alertText = document.createElement("p");
      alertText.innerHTML = message;
  
      alertContent.appendChild(alertClosure);
      alertContent.appendChild(alertText);
      alert.appendChild(alertContent);
      document.body.appendChild(alert);
    }
    alert.style.display = 'block';
  }
  