function storeJWT(jwtToken) {
    if (jwtToken) {
      localStorage.setItem('jwtToken', jwtToken);
      console.log('JWT stored successfully');
    } else {
      console.error('No JWT token provided');
    }
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
            location.reload();
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
        location.reload();
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

    const googleLoginForm = document.createElement("form");
    googleLoginForm.action = '/login';
    googleLoginForm.method = "POST";
    information.appendChild(googleLoginForm);

    const googleLoginButton = document.createElement("button");
    googleLoginButton.type = "submit";
    googleLoginButton.className = 'googleLoginButton'

    const googleLoginButtonIcon = document.createElement("img");
    googleLoginButtonIcon.className = 'icon';
    googleLoginButtonIcon.src = '../images/Google_Icon.png';

    const googleLoginButtonInnerText = document.createElement("span");
    googleLoginButtonInnerText.innerText = 'Google 登入'


    googleLoginButton.appendChild(googleLoginButtonInnerText);
    googleLoginButton.appendChild(googleLoginButtonIcon);

    googleLoginForm.appendChild(googleLoginButton);
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
    signUpBtn.innerText = '註冊';
    loginButtonBox.appendChild(signUpBtn);
  
    const signInBtn = document.createElement("div");
    signInBtn.id = 'signIn';
    signInBtn.className = 'signIn';
    signInBtn.innerText = '登入';
    loginButtonBox.appendChild(signInBtn);
  
    document.getElementById('signUp').addEventListener("click", () => createForm(true));
    document.getElementById('signIn').addEventListener("click", () => createForm(false));
  
    createForm(isSignUp);
}

async function fetchGoogleUserData(isHomepage) {
  const token = document.cookie
      ?.split('; ')
      ?.find((row) => row.startsWith('token='))
      ?.split('=')[1];

  if (!token) {
      console.error('Token not found');
      return null;
  }

  try {
      const response = await fetch('/user', {
          method: 'GET',
          headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
          },
      });

      if (!response.ok) {
          throw new Error('Failed to fetch user data');
      }

      const data = await response.json();

      isHomepage? updateUserInterface(data) : null;
      loginUserName = data.name;
      loginUserId = data._id;
      loginImg = data.picture;
      loginEmail = data.email;
      return loginUserId;
  } catch (error) {
      console.error('Error fetching user data:', error);
      if (error.message === 'Failed to fetch user data') {
          clearCookieJWT();
      }
      return null;
  }
}

function clearCookieJWT() {
  document.cookie = 'token=; Max-Age=0';
}

function checkGoogleLoginStatus(fetchGoogleUserData, isHomepage) {
  const hasCookieToken = document.cookie.split(';').some(cookie => cookie.trim().startsWith(`token=`));
  if (hasCookieToken) {
    return fetchGoogleUserData(isHomepage);
  }
}