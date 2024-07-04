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
      alertText.className = 'alertText';
      alertText.innerHTML = message;
  
      alertContent.appendChild(alertClosure);
      alertContent.appendChild(alertText);
      alert.appendChild(alertContent);
      document.body.appendChild(alert);
    } else {
      const alertText = alert.getElementsByClassName('alertText')[0];
      alertText.innerHTML = message;
    }
    alert.style.display = 'block';
  }
  
  function showCustomConfirm(message, callback) {
    const confirmDialog = document.getElementById('custom-confirm');
    const confirmMessage = confirmDialog.querySelector('p');
    confirmMessage.textContent = message;
  
    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');
  
    confirmYes.onclick = () => {
      callback(true);
      confirmDialog.classList.add('hidden');
    };
  
    confirmNo.onclick = () => {
      callback(false);
      confirmDialog.classList.add('hidden');
    };
  
    confirmDialog.classList.remove('hidden');
  }