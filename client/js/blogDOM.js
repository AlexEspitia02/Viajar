import EditorJs from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import List from '@editorjs/list';
import Embed from '@editorjs/embed';
import ImageTool from '@editorjs/image';
import ColorPlugin from 'editorjs-text-color-plugin';
// import io from 'socket.io-client';

// const socket = io();
let editor;
let loginUserId = null;

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');
const title = urlParams.get('title');
const mapId = urlParams.get('mapId');

function clearJWT() {
localStorage.removeItem('jwtToken');
console.log('JWT cleared from LocalStorage');
}

function fetchUserData() {
const jwtToken = localStorage.getItem('jwtToken');
if (!jwtToken) {
    console.log('No JWT token found, please log in.');
    return;
}

fetch('/user/profile', {
    method: 'GET',
    headers: {
    Authorization: `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
    },
})
.then((response) => {
    if (!response.ok) {
    throw new Error('Failed to fetch user data');
    }
    return response.json();
})
.then((data) => {
    console.log('User data:', data);
    loginUserName = data.data.name;
    loginUserId = data.data.id;
    loginImg = data.data.picture;
    loginEmail = data.data.email;
})
.catch((error) => {
    console.error('Error fetching user data:', error);
    if (error.message === 'Failed to fetch user data') {
        clearJWT();
    }
});
}

function checkLoginStatus() {
    const jwtToken = localStorage.getItem('jwtToken');
    if (jwtToken) {
        fetchUserData();
    }
}

document.addEventListener('DOMContentLoaded', checkLoginStatus);

document.addEventListener('DOMContentLoaded', function () {

    const titleDiv = document.getElementById('titleDiv');
    titleDiv.className = "titleDiv";
    titleDiv.innerHTML = `Blog Title: <b>${title}</b>`;

    editor = new EditorJs({
        holder: 'editorjs',
        
        tools:{
            header: {
                class: Header,
                inlineToolbar:['link']
            },
            list: {
                class: List,
                inlineToolbar:[
                    'link',
                    'bold',
                ]
            },
            embed: {
                class: Embed,
                inlineToolbar: false,
                config:{
                    services: {
                        youtube: true,
                        coub: true
                    }
                }
            },
            image: {
                class: ImageTool,
                config: {
                    endpoints: {
                        byFile: '/api/upload',
                        byUrl: 'http://localhost:8008/fetchUrl',
                    }
                }
            },
            Color: {
                class: ColorPlugin,
                config: {
                   colorCollections: ['#EC7878','#9C27B0','#673AB7','#3F51B5','#0070FF','#03A9F4','#00BCD4','#4CAF50','#8BC34A','#CDDC39', '#FFF'],
                   defaultColor: '#FF1300',
                   type: 'text', 
                   customPicker: true
                }     
              },
            Marker: {
            class: ColorPlugin,
            config: {
                defaultColor: '#FFBF00',
                type: 'marker',
                icon: `<svg fill="#000000" height="200px" width="200px" version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <path d="M17.6,6L6.9,16.7c-0.2,0.2-0.3,0.4-0.3,0.6L6,23.9c0,0.3,0.1,0.6,0.3,0.8C6.5,24.9,6.7,25,7,25c0,0,0.1,0,0.1,0l6.6-0.6 c0.2,0,0.5-0.1,0.6-0.3L25,13.4L17.6,6z"></path> <path d="M26.4,12l1.4-1.4c1.2-1.2,1.1-3.1-0.1-4.3l-3-3c-0.6-0.6-1.3-0.9-2.2-0.9c-0.8,0-1.6,0.3-2.2,0.9L19,4.6L26.4,12z"></path> </g> <g> <path d="M28,29H4c-0.6,0-1-0.4-1-1s0.4-1,1-1h24c0.6,0,1,0.4,1,1S28.6,29,28,29z"></path> </g> </g></svg>`
                }       
            },
        }
    });
    loadEditorData();
});

function loadEditorData() {
    fetch(`/api/posts/${postId}`)
        .then(response => response.json())
        .then(data => {
            editor.isReady
                .then(() => {
                    editor.render(data);
                })
                .catch(error => {
                    console.error('Error loading the post:', error);
                });
        });

    // socket.on('newPost', function(data) {
    //     console.log('New post received:', data);
    // });
}

let saveBtn = document.getElementById('saveButton');
saveBtn.addEventListener('click', function() {
    editor.save().then((outputData) => {
        outputData._id = postId;
        outputData.title = title;
        outputData.loginUserId = loginUserId;
        outputData.mapId = mapId;
        const formData = new FormData();
        formData.append('data', JSON.stringify(outputData));
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput.files[0]) {
            formData.append('main_image', fileInput.files[0]);
        }
        
        // socket.emit('newPost', formData);

        fetch("/api/posts", {
            method: "POST",
            body: formData
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Something went wrong on api server!');
            }
        })
        .then(data => {
            alert("數據上傳成功");
            console.log('Success:', data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert("數據上傳失敗");
        });
    }).catch((error) => {
        console.log('Saving failed', error);
    });
});

let blogListButton = document.getElementById('blogListButton');
blogListButton.addEventListener('click', function() {
    window.location.href = '/blogList.html';
});
