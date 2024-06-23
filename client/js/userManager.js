function updateUserInterface(user) {
    const contentDiv = document.getElementById("information");
    contentDiv.innerHTML = `
        <div class="welcomeInfo">
            <h2>Welcome, ${user.name}!</h2>
            <img src="${user.picture}" alt="Profile Picture" class="userPicture"/>
            <p>Email: ${user.email}</p>
            <p>User ID: ${user.id}</p>
        </div>
    `;
    contentDiv.style.display = 'flex';
}
  
function clearJWT() {
    localStorage.removeItem('jwtToken');
    console.log('JWT cleared from LocalStorage');
}

async function fetchUserData() {
    const jwtToken = localStorage.getItem('jwtToken');
    if (!jwtToken) {
        console.log('No JWT token found, please log in.');
        return;
    }
  
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
        console.log('User data:', data);
        updateUserInterface(data.data);
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

function checkLoginStatus(fetchUserData) {
    const jwtToken = localStorage.getItem('jwtToken');
    if (jwtToken) {
        fetchUserData()
    }
}
