


async function loadPosts(){
  document.getElementById("feed-loading").style.display = "flex";
  const res = await fetch("/api/feed")

  const data = await res.json()
  const posts = data.posts
  const comments = data.comments
  const reacts = data.reacts

  const feed = document.getElementById("feed")

  feed.innerHTML = ""

  for (const post of posts)  {
    console.log(post);
    const id = post.split("_")[1]
    const url = "https://api.testnet.shelby.xyz/shelby/v1/blobs/0x2a2b71eb64838441b6bb408913cacd6d04f517fac1e187f7c346931f35b32775/" + post.split("_")[1];
    const timee = post.split("_")[2];
    const author = post.split("_")[4];
    const caption = post.split("_")[5];
     const totalReact = getLikeCount(reacts,id);
     const totalComment = getTotalComment(comments,id)
     let liked = false;
     let authorStory = "";

    const user = localStorage.getItem("user");

    if (user !== null) {
      authorStory = user;
      liked = isLiked(reacts, id, user);
    }
      
    
   const date = new Date(Number(timee))   // nếu timee là milliseconds

const time = date.toLocaleString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
})

    const html = `
    
    <section class="post">

      <div class="background">
        <img src="${url}">
      </div>

      <div class="content">

        <img src="${url}" class="media">

        <p class="postby">Posted by ${author} at ${time}</p>

        <p class="caption">${caption}</p>

        <div class="actions">
          <button class="like ${liked ? "active" : ""}" id="reactBtn_${id}" onclick="react('${id}')"><span>❤️</span> <span id="totalReact_${id}">${totalReact}</span></button>
          <button class="comment" onclick="toggleComment('${id}')" id="commentBtn">💬 ${totalComment}</button>
        </div>

      </div>

    </section>

    `

    feed.insertAdjacentHTML("beforeend", html)

  document.getElementById("feed-loading").style.display = "none";
  }

}

loadPosts();

let tokenClient;

window.onload = () => {

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: "735568185958-l76dpbhn8j9v7jj67j2l26m0cf4tm58m.apps.googleusercontent.com",
    scope: "email profile",
    callback: (response) => {
      getUserInfo(response.access_token);
    }
  });

  // nếu đã login trước đó
  const savedUser = localStorage.getItem("user");

  if (savedUser) {
    const user = savedUser;
    showUser(user);
  }
};
const storyBtn = document.getElementById("upStory");
const myStoryy = document.getElementById("btnStory");
const Nofibtn = document.getElementById("btnNofi");
const Menubtn = document.getElementById("btnMenu");

storyBtn.style.display = "none";
myStoryy.style.display = "none";
Nofibtn.style.display = "none";
Menubtn.style.display = "none";
document.getElementById("connect").onclick = () => {

  const savedUser = localStorage.getItem("user");

  if (savedUser) {

   Swal.fire({
  title: "Are you sure you want to logout?",
  icon: "question",
  showCancelButton: true,
  confirmButtonText: "Logout",
  cancelButtonText: "Cancel"
}).then((result) => {

  if (result.isConfirmed) {
    
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      Swal.fire({
        title: "Logout Success !",
        icon: "success"
      });
      document.getElementById("connect").innerText = "Connect Account";
      storyBtn.style.display = "none";
      myStoryy.style.display = "none";
      Nofibtn.style.display = "none";
      Menubtn.style.display = "none";
      document.getElementById("commentsend").innerHTML = '';
    
  }

});

   

  } else {
    tokenClient.requestAccessToken();
  }
};

async function getUserInfo(token){

  const res = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers:{
        Authorization:"Bearer "+token
      }
    }
  );

  const data = await res.json();

  /* gửi email lên backend */
  const loginRes = await fetch("/api/login",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body:JSON.stringify({
      email: data.email
    })
  });

  const loginData = await loginRes.json();
  
  localStorage.setItem("token",loginData.token);
  localStorage.setItem("user", loginData.email.email);
  Swal.fire({
    title:"Login Success!",
    icon:"success"
  });
  
  showUser(loginData.email.email);

}


function showUser(user) {

  document.getElementById("connect").innerText =
    user;
      storyBtn.style.display = "block";
      myStoryy.style.display = "block";
      Nofibtn.style.display = "block";
      Menubtn.style.display = "block";
}







/* đóng comment khi lướt feed */
const feed = document.querySelector(".feed");

feed.addEventListener("scroll", () => {
  document.getElementById("commentPanel").classList.remove("show");
  document.getElementById("commentsend").innerHTML = '';

});
const modal = document.getElementById("storyModal")
const openBtn = document.getElementById("upStory")
const closeBtn = document.getElementById("storyCloseBtn")

const previewBox = document.getElementById("storyPreviewBox")
const fileInput = document.getElementById("storyFileInput")

const previewImg = document.getElementById("storyPreviewImage")
const previewVideo = document.getElementById("storyPreviewVideo")

/* mở modal */

openBtn.onclick = () => {

  modal.style.display = "block"

}

/* đóng modal */

closeBtn.onclick = () => {

  modal.style.display = "none"

}

/* click ngoài modal */

window.onclick = (e)=>{

  if(e.target === modal){

    modal.style.display = "none"

  }

}

/* click preview → chọn file */

previewBox.onclick = () => {

  fileInput.click()

}

/* preview file */

fileInput.onchange = () => {

  const file = fileInput.files[0]

  if(!file) return

  const url = URL.createObjectURL(file)

  if(file.type.startsWith("image")){

    previewImg.src = url
    previewImg.style.display = "block"

    previewVideo.style.display = "none"

  }

  if(file.type.startsWith("video")){

    previewVideo.src = url
    previewVideo.style.display = "block"

    previewImg.style.display = "none"

  }

}

    const storyFileInput = document.getElementById('storyFileInput');
    const uploadBtn = document.getElementById('story-upload-btn');
       let authorStory = "";
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (user !== null) {
      authorStory = user;
    }
    // Upload khi click button
    uploadBtn.addEventListener('click', async () => {
      const file = storyFileInput.files[0];
        
      uploadBtn.disabled = true;
      Swal.fire({
        title: "Uploading Story...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
          
        },
        customClass:{
            container:"my-swal"
  }
      });
        const captionStory = document.getElementById('storyCaption').value;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption',captionStory);
      formData.append("author",authorStory);
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers:{
          Authorization:"Bearer "+token
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          Swal.close();
          Swal.fire({
            title: errorData.error, // hiển thị lỗi
            icon: "error",
            customClass:{
            container:"my-swal"
  }
          });
          return;
        }

        const data = await response.json();
        Swal.close();
         Swal.fire({
            title: "Upload Success !",
            icon: "success",
            customClass:{
            container:"my-swal"
  }
          });
                // 🔥 RESET UI
        document.getElementById("storyFileInput").value = "";
        document.getElementById("storyCaption").value = "";

        const img = document.getElementById("storyPreviewImage");
        const video = document.getElementById("storyPreviewVideo");

        img.src = "upload-placeholder.png";
        img.style.display = "block";

        video.src = "";
        video.style.display = "none";
        document.getElementById("storyModal").style.display = "none";
          loadPosts();
          

        }catch(e){
            Swal.fire({
            title: e.message, // hiển thị lỗi
            icon: "error"
          });
        }
                finally {
                uploadBtn.disabled = false;
            }
            });
    const statusBox = document.getElementById("postStatus")
const statusText = document.getElementById("postStatusText")


 async function react(id){
          let authorStory = "";

    const user = localStorage.getItem("user");

    if (user !== null) {
      authorStory = user;
    }
   const token1 = localStorage.getItem("token");
         const formData = new FormData();
      formData.append("id",id);
      formData.append("author",authorStory);
      const btnLike = document.getElementById("reactBtn_"+id)
      const total = document.getElementById("totalReact_"+id);
      const totalnow = total.textContent;
       // chặn spam click
     if(btnLike.classList.contains("loading")) return

      const checkliked = btnLike.classList.contains("active")
      btnLike.classList.add("loading")
      const type = checkliked ? "unlike" : "like"
      formData.append("type",type);
      try {
        const response = await fetch('/api/react', {
          method: 'POST',
          headers:{
          Authorization:"Bearer "+token1
          },
          body: formData,
          

        });

        if (!response.ok) {
          const errorData = await response.json();
           Swal.fire({
            title: errorData.error, // hiển thị lỗi
            icon: "error",
            customClass:{
            container:"my-swal"
  }
          });
          return;
        }

    if(type==="like"){
      btnLike.classList.add("active")
      total.innerText = Number(totalnow)+1
       heartBurst(btnLike)
    }else{
      btnLike.classList.remove("active")
      total.innerText = Number(totalnow)-1
    }
        const data = await response.json();
         
            
        }catch(e){
            
        }
                finally {
               btnLike.classList.remove("loading")
            }
 }
 async function sendComment(id){
         let authorStory = "";

    const user = localStorage.getItem("user");
    const token1 = localStorage.getItem("token");
    authorStory = user;
         const text = document.getElementById("commentText").value;
         const sendCommentBtn = document.getElementById("sendComment");
          sendCommentBtn.disabled = true;
      Swal.fire({
        title: "Uploading Comment...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
          
        },
        customClass:{
            container:"my-swal"
  }
      });
         const formData = new FormData();
      formData.append("author",authorStory);
      formData.append("text",text);
      formData.append("id",id);
      try {
        const response = await fetch('/api/comment', {
          method: 'POST',
          headers:{
          Authorization:"Bearer "+token1
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
           Swal.close();
          Swal.fire({
            title: errorData.error, // hiển thị lỗi
            icon: "error",
            customClass:{
            container:"my-swal"
  }
          });
          return;
        }

        const data = await response.json();
         Swal.close();
         Swal.fire({
            title: "Upload Success !",
            icon: "success",
            customClass:{
            container:"my-swal"
  }
          });
          document.getElementById("commentText").value = "";
          resetComment(id);
            

        }catch(e){
             Swal.fire({
            title: e.message, // hiển thị lỗi
            icon: "error"
          });
        }
                finally {
               sendCommentBtn.disabled = false;
            }
 }
 
 
 async function toggleComment(id){
  document.getElementById("commentsend").innerHTML = '';
    const panel = document.getElementById("commentPanel");
  panel.classList.toggle("show");
  const res = await fetch("/api/getcomment/"+id)

  const posts = await res.json()
  

  const feed = document.getElementById("comment-list")

  feed.innerHTML = ""
  posts.forEach(post => {
    
    const time = new Date(post.time).toLocaleString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
})

    const html = `
    
    <div class="comment">${post.author} at ${time} : ${post.comment}</div>

    `

    feed.insertAdjacentHTML("beforeend", html)

  })
   if(localStorage.getItem("user") === null){
    document.getElementById("commentsend").innerHTML = '';
  }else{
    document.getElementById("commentsend").innerHTML = '';
    const box = document.getElementById("commentsend");
     const chat = `
  <div class="comment-input" id="commentBox">
    <input placeholder="Write a comment..." id="commentText">
    <button id="sendComment" onclick="sendComment('${id}')">Send</button>
  </div>
  `

  box.insertAdjacentHTML("beforeend", chat)

  


  }
   

 }
 async function resetComment(id){
  document.getElementById("commentsend").innerHTML = '';
    const res = await fetch("/api/getcomment/"+id)

  const posts = await res.json()
  
  document.getElementById("commentBtn").innerText = "💬 " + posts.length
  const feed = document.getElementById("comment-list")

  feed.innerHTML = ""
  posts.forEach(post => {
    
    const time = new Date(post.time).toLocaleString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
})

    const html = `
    
    <div class="comment">${post.author} at ${time} : ${post.comment}</div>

    `

    feed.insertAdjacentHTML("beforeend", html)

  })
   if(localStorage.getItem("user") === null){
    document.getElementById("commentsend").innerHTML = '';
  }else{
    const box = document.getElementById("commentsend");
     const chat = `
  <div class="comment-input" id="commentBox">
    <input placeholder="Write a comment..." id="commentText">
    <button onclick="sendComment('${id}')">Send</button>
  </div>
  `

  box.insertAdjacentHTML("beforeend", chat)

  


  }
  }
  function getLikeCount(blobs, idpost){

  const state = {}

  for(const blob of blobs){
    
    const type = blob.split("_")[0];
    const postId = blob.split("_")[1];
    const time = blob.split("_")[2] ;
    const user = blob.split("_")[4];

    if(postId !== idpost) continue
    if(type !== "like" && type !== "unlike") continue

    const t = Number(time)

    if(!state[user] || t > state[user].time){
      state[user] = { type, time: t }
    }

  }

  let likeCount = 0

  for(const user in state){
    if(state[user].type === "like"){
      likeCount++
    }
  }

  return likeCount
}
function isLiked(blobs, postId, author){

  let lastTime = 0
  let lastAction = null

  for(const blob of blobs){

    const parts = blob.split("_")

    if(parts.length < 3) continue

    const type = parts[0]
    const pId = parts[1]
    const time = parts[2]
    const user = parts[parts.length - 1] // luôn lấy phần cuối

    if(pId !== postId) continue
    if(user !== author) continue

    const t = Number(time)

    if(t > lastTime){
      lastTime = t
      lastAction = type
    }

  }

  return lastAction === "like"
}
function getComments(postId, comments){

  return comments.filter(c=>{
    const parts = c.blobNameSuffix.split("_")
    return parts[1] === postId
  })

}
function getTotalComment(listComment, postId){

  let count = 0

  for(const c of listComment){
     
    if(c.split("_")[1] == postId){
      count++
    }

  }

  return count

}
function heartBurst(btn){

  const rect = btn.getBoundingClientRect()

  const originX = rect.left + rect.width/2
  const originY = rect.top + rect.height/2

  const totalHearts = 25

  for(let i=0;i<totalHearts;i++){

    const heart = document.createElement("div")
    heart.className = "heart-fly"
    heart.innerText = "❤️"

    heart.style.left = originX + "px"
    heart.style.top = originY + "px"

    const x = (Math.random()-0.5)*400
    const y = -(Math.random()*350+50)

    heart.style.setProperty("--x", x+"px")
    heart.style.setProperty("--y", y+"px")

    document.body.appendChild(heart)

    setTimeout(()=>{
      heart.remove()
    },1400)

  }

}

function closeMyStory(){
  document.getElementById("myStoryPage").classList.remove("open")
}
async function myStory(){
  document.getElementById("myStoryPage").classList.add("open")
  const res = await fetch("/api/feed")

const data = await res.json()

const posts = data.posts
const comments = data.comments
const reacts = data.reacts
let authorStory = "";
const feed = document.getElementById("myStoryList")
  feed.innerHTML = ""
    const user = localStorage.getItem("user");

    if (user !== null) {
      authorStory = user;
    }
const author = authorStory

const myPosts = posts.filter(p => {

  const parts = p.split("_")

  return parts[4] === author

})

  for (const post of myPosts)  {
   

  
    const id = post.split("_")[1]
    const url = "https://api.testnet.shelby.xyz/shelby/v1/blobs/0x2a2b71eb64838441b6bb408913cacd6d04f517fac1e187f7c346931f35b32775/" + post.split("_")[1];
    const timee = post.split("_")[2];
    const author = post.split("_")[4];
    const caption = post.split("_")[5];
     const totalReact = getLikeCount(reacts,id);
     const totalComment = getTotalComment(comments,id)
     let liked = false;

    const user = localStorage.getItem("user");

    if (user !== null) {
      authorStory = user;
      liked = isLiked(reacts, id, authorStory);
    }
      
    
   const date = new Date(Number(timee))   // nếu timee là milliseconds

const time = date.toLocaleString("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
})

    const html = `
    
    <section class="post">

      <div class="background">
        <img src="${url}">
      </div>

      <div class="content">

        <img src="${url}" class="media">

        <p class="postby">Posted by ${author} at ${time}</p>

        <p class="caption">${caption}</p>

        <div class="actions">
          <button class="like ${liked ? "active" : ""}" id="reactBtn_${id}" onclick="react('${id}')"><span>❤️</span> <span id="totalReact_${id}">${totalReact}</span></button>
          <button class="comment" onclick="toggleComment('${id}')" id="commentBtn">💬 ${totalComment}</button>
        </div>

      </div>

    </section>

    `

    feed.insertAdjacentHTML("beforeend", html)

  }
} 
async function toggleNotify(){

  const box = document.getElementById("notifyBox")
  const notifyList = document.getElementById("notifyList")

  // nếu đang mở thì đóng
  if(box.classList.contains("open")){
    box.classList.remove("open")
    return
  }
   let authorStory = "";

    const user = localStorage.getItem("user");

    if (user !== null) {
      authorStory = user;
    }

  const res = await fetch("/api/feed")
  const data = await res.json()

  const posts = data.posts
  const comments = data.comments
  const reacts = data.reacts

  const myPosts = posts.filter(p => p.split("_")[4] === authorStory)
  const myPostIds = myPosts.map(p => p.split("_")[1])

  const notifications = []

  // like + unlike
  reacts.forEach(r => {

    const p = r.split("_")

    const type = p[0]
    const postId = p[1]
    const user = p[4]
    const time = p[2]
    const story = myPosts.find(p => p.split("_")[1] === postId)

    const caption = story ? story.split("_")[5] : ""
    if(myPostIds.includes(postId) && user !== authorStory){

      notifications.push({
        type,
        author:user,
        caption : caption,
        time : time
      })

    }

  })

  // comment
  comments.forEach(c => {

    const p = c.split("_")

    const postId = p[1]
    const user = p[4]
     const time = p[2]
     const story = myPosts.find(p => p.split("_")[1] === postId)

    const caption = story ? story.split("_")[5] : ""
    if(myPostIds.includes(postId) && user !== authorStory){

      notifications.push({
        type:"comment",
        author:user,
        caption : caption,
        time : time
      })

    }

  })
  notifications.sort((a, b) => Number(b.time) - Number(a.time))
  // clear
  notifyList.innerHTML = ""

  // render
  notifications.forEach(n => {
     const date = new Date(Number(n.time))   // nếu timee là milliseconds

      const time = date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })

    const div = document.createElement("div")
    div.className = "notify-item"

    if(n.type === "like"){
      div.innerText = n.author + " liked your post '" + n.caption + "' at " + time
    }

    if(n.type === "unlike"){
      div.innerText = n.author + " unliked your post '" + n.caption + "' at " + time
    }

    if(n.type === "comment"){
      div.innerText = n.author + " commented on your post '" + n.caption + "' at " + time
    }

    notifyList.appendChild(div)

  })


  box.classList.toggle("open")

}


function closeComment(){
  document.getElementById("commentPanel").classList.remove("show");
}
function toggleMenu(){
const menu = document.querySelector(".top-actions");
  const isOpen = menu.classList.toggle("active");
   const btnIcon = document.querySelector(".menu-toggle i");
  const btnConnect = document.getElementById("connect");
  const btnNofi = document.getElementById("btnNofi");
  if(isOpen){
    btnIcon.classList.remove("fa-bars");
    btnIcon.classList.add("fa-xmark");
    btnConnect.style.display = "none";
    btnNofi.style.display = "none";
    btnConnect.style.transition = "all 0.5s ease";
    btnNofi.style.transition = "all 0.5s ease";
  }else{
    btnIcon.classList.remove("fa-xmark");
    btnIcon.classList.add("fa-bars");
    btnConnect.style.display = "block";
    btnNofi.style.display = "block";
    btnConnect.style.transition = "all 0.5s ease";
    btnNofi.style.transition = "all 0.5s ease";
  }
  document.querySelectorAll(".swipe").forEach(el => {
  el.style.transition = "all 0.3s ease";

  if(isOpen){
    el.style.opacity = "0";
    el.style.transform = "translateX(-50%) translateY(15px)"; // ✅ giữ căn giữa
    el.style.pointerEvents = "none";
  }else{
    el.style.opacity = "1";
    el.style.transform = "translateX(-50%) translateY(0)";
    el.style.pointerEvents = "auto";
  }
});
}
