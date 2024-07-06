import EditorJs from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import List from '@editorjs/list';
import Embed from '@editorjs/embed';
import ImageTool from '@editorjs/image';
import ColorPlugin from 'editorjs-text-color-plugin';

let editor;
let loginUserId;

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');
const title = urlParams.get('title');
const mapId = urlParams.get('mapId');

async function initializeBlogUser() {
    const isHomepage = false;
    loginUserId = await checkGoogleLoginStatus(fetchGoogleUserData, isHomepage);

    if (!loginUserId) {
        loginUserId = await checkLoginStatus(fetchUserData, isHomepage);
    }

    const saveBtn = document.getElementById('saveButton');
    findUser(loginUserId, saveBtn);
}

initializeBlogUser();

document.addEventListener('DOMContentLoaded', function () {

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
                        byUrl: '/api/upload',
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
    document.querySelector('.loadingIndicator').style.display = 'flex';
    fetch(`/api/posts/${postId}`)
        .then(response => response.json())
        .then(data => {
            editor.isReady
                .then(() => {
                    editor.render(data);
                    document.querySelector('.loadingIndicator').style.display = 'none';
                })
                .catch(error => {
                    console.error('Error loading the post:', error);
                });
        });
}

document.addEventListener('DOMContentLoaded', function() {
    const saveBtn = document.getElementById('saveButton');
    saveBtn.addEventListener('click', function() {
        editor.save().then((outputData) => {
            outputData._id = postId;
            outputData.title = title;
            outputData.loginUserId = loginUserId;
            outputData.mapId = mapId;
            const formData = new FormData();
            formData.append('data', JSON.stringify(outputData));

            document.querySelector('.loadingIndicator').style.display = 'flex';
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
                if (data.success === true){
                    showAlert(data.message);
                    document.querySelector('.loadingIndicator').style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert("數據上傳失敗");
            });
        }).catch((error) => {
            console.log('Saving failed', error);
        });
    });
});

let blogListButton = document.getElementById('blogListButton');
blogListButton.addEventListener('click', function() {
    window.location.href = '/blogList.html';
});

function findUser(loginUserId, saveBtn) {
    document.querySelector('.loadingIndicator').style.display = 'flex';
    fetch(`/api/post/user?loginUserId=${loginUserId}&mapId=${mapId}`, {
        method: "GET"
    })
    .then(response => response.json())
    .then(data => {
        if (data === null) {
            saveBtn.style.display = 'none';
            document.querySelector('.loadingIndicator').style.display = 'none';
        } else {
            document.querySelector('.loadingIndicator').style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        saveBtn.style.display = 'none';
        alert("查找文章失敗!");
    });
}