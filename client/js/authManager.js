
function storeJWT(jwtToken) {
    if (jwtToken) {
      localStorage.setItem('jwtToken', jwtToken);
      console.log('JWT stored successfully');
    } else {
      console.error('No JWT token provided');
    }
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
    contentDiv.style.display = 'flex';
  }

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
            updateUserInterface(data.data.user);
            loginUserId = data.data.user.id;
            loginUserName = data.data.user.name;
            loginImg = data.data.user.picture;
            loginEmail = data.data.user.email;
        } else {
            alert(data.message || 'No JWT token provided');
        }
    })
    .catch(error => console.error('Signup Error:', error));
  }
  
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
        updateUserInterface(data.data.user);
        loginUserId = data.data.user.id;
        loginUserName = data.data.user.name;
        loginImg = data.data.user.picture;
        loginEmail = data.data.user.email;
    } else {
        alert(data.message || 'No JWT token provided');
    }
    })
    .catch(error => console.error('Signup Error:', error));
}

function createUserNameForm () {
    const username = document.createElement("input");
    username.setAttribute("type", "text");
    username.className = 'logInInput';
    username.setAttribute("placeholder", "輸入用戶名");
    username.id = 'inputUsername'
    information.appendChild(username);
}

function createForm(isSignUp) {
    const information = document.getElementById('information');
    information.innerHTML = '';
  
    isSignUp ? createUserNameForm() : '';
  
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
    loginButton.innerText = isSignUp ? "註冊" : "登入";
    loginButton.onclick = function() {
        isSignUp ? submitSignupForm() : submitSignInForm();
    };
    information.appendChild(loginButton);
}
  
function handleAuthForm(isSignUp) {
    const information = document.getElementById('information');
    information.innerHTML = '';
  
    const loginButtonBox = document.getElementById('loginButtonBox');
    loginButtonBox.style.display = 'flex';
    loginButtonBox.innerHTML = '';
  
    const signUpBtn = document.createElement("div");
    signUpBtn.id = 'signUp';
    signUpBtn.className = 'signUp';
    signUpBtn.innerText = 'Sign UP';
    loginButtonBox.appendChild(signUpBtn);
  
    const signInBtn = document.createElement("div");
    signInBtn.id = 'signIn';
    signInBtn.className = 'signIn';
    signInBtn.innerText = 'Sign In';
    loginButtonBox.appendChild(signInBtn);
  
    document.getElementById('signUp').addEventListener("click", () => createForm(true));
    document.getElementById('signIn').addEventListener("click", () => createForm(false));
  
    createForm(isSignUp);
}
  