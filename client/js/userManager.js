function updateUserInterface(user) {
    const information = document.getElementById('information');
    information.innerHTML = '';
  
    const loginButtonBox = document.getElementById('loginButtonBox');
    loginButtonBox.style.display = 'none';
    loginButtonBox.innerHTML = '';

    const contentDiv = document.getElementById("information");
    contentDiv.innerHTML = `
        <div class="welcomeInfo">
            <h2>Welcome, ${user.name}!</h2>
            <img src="${user.picture}" alt="Profile Picture" class="userPicture"/>
            <p>${user.email}</p>
        </div>
    `;
    contentDiv.style.display = 'flex';

    const logoutBtn =  document.createElement('button');
    logoutBtn.innerText = '登出';
    logoutBtn.addEventListener('click',() => {
        clearCookieJWT();
        clearJWT();
        window.location.href = '/';
    })
    information.appendChild(logoutBtn);
}
  
function clearJWT() {
    localStorage.removeItem('jwtToken');
}

async function fetchUserData(isHomepage) {
    const jwtToken = localStorage.getItem('jwtToken');
  
    try {
        const response = await fetch('/user/profile', {
            method: 'GET',
            headers: {
            Authorization: `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
            },
        });
    
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }
    
        const data = await response.json();
        isHomepage ? updateUserInterface(data.data) : null;
        loginUserName = data.data.name;
        loginUserId = data.data.id;
        loginImg = data.data.picture;
        loginEmail = data.data.email;
        return loginUserId;
    } catch (error) {
        console.error('Error fetching user data:', error);
        if (error.message === 'Failed to fetch user data') {
            clearJWT();
        }
        return null;
    }
}

function checkLoginStatus(fetchUserData, isHomepage) {
    const jwtToken = localStorage.getItem('jwtToken');
    if (jwtToken) {
        return fetchUserData(isHomepage);
    }
}
