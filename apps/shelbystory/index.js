let allPosts = []
let cursor = 0
let loading = false
let firstLoad = true

async function loadPosts() {
  if (loading || cursor === null) return
  loading = true

  if (firstLoad) document.getElementById("feed-loading").style.display = "flex"

  const res = await fetch(`/api/feed?cursor=${cursor}`)
  const data = await res.json()

  // gán react + comment để tính tổng
  window.reacts = data.reacts
  window.comments = data.comments

  allPosts = allPosts.concat(data.posts)
  cursor = data.nextCursor
  renderPosts(allPosts)

  if (firstLoad) {
    document.getElementById("feed-loading").style.display = "none"
    firstLoad = false
  }

  loading = false
  setupInfiniteScroll()
}

function renderPosts(posts) {
  const feed = document.getElementById("feed")
  const user = localStorage.getItem("user")

  for (const post of posts) { // 🔥 chỉ render post mới
    const parts = post.split("_")

    const id = parts[1]

    // 🔥 chống trùng
    if (document.querySelector(`[data-id="${id}"]`)) continue

    const timee = parts[2]
    const author = parts[4]
    const caption = parts[5]

    const totalReact = getLikeCount(window.reacts || [], id)
    const totalComment = getTotalComment(window.comments || [], id)
    const liked = user ? isLiked(window.reacts || [], id, user) : false

    const date = new Date(Number(timee))
    const time = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })

    const html = `
      <section class="post" data-id="${id}">
        <div class="background">
          <img src="/api/image/${id}">
        </div>
        <div class="content">
          <img src="/api/image/${id}" class="media" loading="lazy">
         
          <p class="postby">
            Posted by 
            <span class="postauthor" onclick="openProfile('${author}')">
              ${author}
            </span> 
            at ${time}
          </p>

          <p class="caption">${caption}</p>

          <div class="actions">
            <button class="like ${liked ? "active" : ""}" id="reactBtn_${id}" onclick="react('${id}')">
              <span>❤️ </span> <span id="totalReact_${id}">${totalReact}</span>
            </button>

            <button class="comment" onclick="toggleComment('${id}')">
              💬 ${totalComment}
            </button>
          </div>
        </div>
      </section>
    `

    feed.insertAdjacentHTML("beforeend", html) // 🔥 append
  }
}
function setupInfiniteScroll() {
  const feed = document.getElementById("feed")
  const posts = feed.querySelectorAll(".post")
  if (!posts.length) return

  const lastIndex = posts.length >= 4 ? posts.length - 2 : posts.length - 1
  const target = posts[lastIndex]

  const observer = new IntersectionObserver(async entries => {
    if (entries[0].isIntersecting) {
      observer.unobserve(target)
      await loadPosts()
    }
  }, { root: null, rootMargin: '0px', threshold: 0.5 })

  observer.observe(target)
}

// lần đầu load 5 post
loadPosts()

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
Menubtn.classList.add("hidden");
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
       sessionStorage.clear();
      loadPosts();

        // 🔥 xoá header nếu có
        if (window.axios) {
          delete axios.defaults.headers.common["Authorization"];
        }
      
        // 🔥 reset biến global nếu bạn có
        window.currentUser = null;
      Swal.fire({
        title: "Logout Success !",
        icon: "success"
      });
      document.getElementById("connect").innerText = "Connect Account";
      storyBtn.style.display = "none";
      myStoryy.style.display = "none";
      Nofibtn.style.display = "none";
      Menubtn.classList.add("hidden");
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
  loadPosts();
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
      Menubtn.classList.remove("hidden");
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
        btnLike.style.transform = "scale(1)";
        btnLike.offsetHeight;
            
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
            title: "Comment Success !",
            icon: "success",
            customClass:{
            container:"my-swal"
  }
          });
          document.getElementById("commentText").value = "";
          await resetComment(id);
            

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
function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
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
let storyCursor = 0
let storyLoading = false
let storyFirstLoad = true
let storyPostsCache = []

async function myStory() {
  document.getElementById("myStoryPage").classList.add("open")
  document.getElementById("profile").innerText = "My Story";

  // reset state
  document.getElementById("myStoryList").scrollTop = 0
  storyCursor = 0
  storyPostsCache = []
  storyFirstLoad = true

  loadStoryPosts()
}

// --- load post ---
async function loadStoryPosts() {
  if (storyLoading || storyCursor === null) return
  storyLoading = true

  if (storyFirstLoad) {
    document.getElementById("feed-loading").style.display = "flex"
  }

  const res = await fetch(`/api/profile?email=${user}&cursor=${storyCursor}&t=${Date.now()}`)
  const data = await res.json()

  

  const myPost = data.posts ;

  // cache lại
  storyPostsCache = storyPostsCache.concat(myPost)

  // cursor vẫn theo toàn bộ feed
  storyCursor = data.nextCursor

  renderStoryPosts(myPost,data.comments, data.reacts)
  if (storyFirstLoad) {
    document.getElementById("feed-loading").style.display = "none"
    storyFirstLoad = false
  }

  storyLoading = false
  setupStoryScroll()
}

// --- render ---
function renderStoryPosts(posts, comments, reacts) {
  const feed = document.getElementById("myStoryList")
  const user = localStorage.getItem("user")

  for (const post of posts) { // 🔥 chỉ render post mới
    const parts = post.split("_")

    const id = parts[1]

    // 🔥 chống trùng
    if (document.querySelector(`[data-id="${id}"]`)) continue

    const timee = parts[2]
    const author = parts[4]
    const caption = parts[5]

    const url = `/api/image/${id}`

    const totalReact = getLikeCount(reacts, id)
    const totalComment = getTotalComment(comments, id)
    const liked = user ? isLiked(reacts, id, user) : false

    const date = new Date(Number(timee))
    const time = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })

    const html = `
      <section class="post" data-id="${id}">
        <div class="background">
          <img src="${url}">
        </div>

        <div class="content">
          <img src="${url}" class="media">

          <p class="postby">Posted by ${author} at ${time}</p>
          <p class="caption">${caption}</p>

          <div class="actions">
          
          <button class="like ${liked ? "active" : ""}" id="reactBtn_${id}" onclick="react('${id}')">
              <span>❤️ </span> <span id="totalReact_${id}">${totalReact}</span>
            </button>
            <button class="comment" onclick="toggleComment('${id}')">
              💬 ${totalComment}
            </button>
          </div>
        </div>
      </section>
    `

    feed.insertAdjacentHTML("beforeend", html) // 🔥 append
  }
}
// --- infinite scroll ---
function setupStoryScroll() {
  const feed = document.getElementById("myStoryList")
  const posts = feed.querySelectorAll(".post")
  if (!posts.length) return

  const index = posts.length >= 4 ? posts.length - 2 : posts.length - 1
  const target = posts[index]

  const observer = new IntersectionObserver(async entries => {
    if (entries[0].isIntersecting) {
      observer.unobserve(target)
      await loadStoryPosts()
    }
  }, { threshold: 0.5 })

  observer.observe(target)
}

let profileCursor = 0
let profileLoading = false
let profileFirstLoad = true
let profilePostsCache = []
let profileCommentsCache = []
let profileReactsCache = []
let profileEmail = null //  email đang xem

async function openProfile(email) {
  document.getElementById("myStoryPage").classList.add("open")
  document.getElementById("profile").innerText = "Profile " + email

  profileEmail = email

  // reset state
  document.getElementById("myStoryList").innerHTML = ""
  document.getElementById("myStoryList").scrollTop = 0
  profileCursor = 0
  profilePostsCache = []
  profileCommentsCache = []
  profileReactsCache = []
  profileFirstLoad = true
  
  loadProfilePosts(profileEmail)
}
async function loadProfilePosts(email) {
  if (profileLoading || profileCursor === null) return
  profileLoading = true

  if (profileFirstLoad) {
    document.getElementById("feed-loading").style.display = "flex"
  }
  
  const res = await fetch(`/api/profile?email=${email}&cursor=${profileCursor}&t=${Date.now()}`)
  const data = await res.json()


  const newPosts = data.posts
  profilePostsCache = profilePostsCache.concat(newPosts)
  profileCommentsCache = profileCommentsCache.concat(data.comments)
  profileReactsCache = profileReactsCache.concat(data.reacts)
  profileCursor = data.nextCursor
   
  renderProfilePosts(newPosts,profileCommentsCache, profileReactsCache)

  if (profileFirstLoad) {
    document.getElementById("feed-loading").style.display = "none"
    profileFirstLoad = false
  }

  profileLoading = false
  setupProfileScroll()
}
function renderProfilePosts(posts, comments, reacts) {
  const feed = document.getElementById("myStoryList")
  const currentUser = localStorage.getItem("user")

  for (const post of posts) { // 🔥 chỉ render post mới
    const parts = post.split("_")

    const id = parts[1]
    const timee = parts[2]
    const author = parts[4]
    const caption = parts[5]

    const url = `/api/image/${id}`

    const totalReact = getLikeCount(reacts, id)
    const totalComment = getTotalComment(comments, id)
    const liked = currentUser ? isLiked(reacts, id, currentUser) : false

    const date = new Date(Number(timee))
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

          <p class="postby">
            Posted by ${author} at ${time}
          </p>

          <p class="caption">${caption}</p>

          <div class="actions">
            <button class="like ${liked ? "active" : ""}" id="reactBtn_${id}" onclick="react('${id}')">
              <span>❤️ </span> <span id="totalReact_${id}">${totalReact}</span>
            </button>
            <button class="comment" onclick="toggleComment('${id}')">
              💬 ${totalComment}
            </button>
          </div>
        </div>
      </section>
    `

    feed.insertAdjacentHTML("beforeend", html) // 🔥 append
  }
}
function setupProfileScroll() {
  const feed = document.getElementById("myStoryList")
  const posts = feed.querySelectorAll(".post")
  if (!posts.length) return

  const index = posts.length >= 4 ? posts.length - 2 : posts.length - 1
  const target = posts[index]

  const observer = new IntersectionObserver(async entries => {
    if (entries[0].isIntersecting) {
      observer.unobserve(target)
      await loadProfilePosts(profileEmail)
    }
  }, { threshold: 0.5 })

  observer.observe(target)
}

async function toggleNotify() {
  const box = document.getElementById("notifyBox")
  const notifyList = document.getElementById("notifyList")

  // nếu đang mở thì đóng
  if (box.classList.contains("open")) {
    box.classList.remove("open")
    return
  }

  let authorStory = ""
  const user = localStorage.getItem("user")
  if (user !== null) authorStory = user

  const res = await fetch(`/api/nofi?user=${user}`)
  const data = await res.json()
  const notifications = data.notifications
  // clear UI
  notifyList.innerHTML = ""

  // render
  notifications.forEach(n => {
    const date = new Date(Number(n.time))

    const time = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })

    const div = document.createElement("div")
    div.className = "notify-item"

    if (n.type === "like") {
      div.innerText = `${n.author} liked your post '${n.caption}' at ${time}`
    } 
    else if (n.type === "unlike") {
      div.innerText = `${n.author} unliked your post '${n.caption}' at ${time}`
    } 
    else if (n.type === "comment") {
      div.innerText = `${n.author} commented on your post '${n.caption}' at ${time}`
    }

    notifyList.appendChild(div)
  })

  box.classList.add("open")
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

function reloadAssets() {
  const v = Date.now();

  // 🔥 reload CSS
  document.querySelectorAll("link[rel='stylesheet']").forEach(link => {
    const href = link.getAttribute("href");
    link.setAttribute("href", href);
  });

  // 🔥 reload JS (xóa script cũ + thêm lại)
  document.querySelectorAll("script[data-reload='true']").forEach(s => s.remove());

  const newScript = document.createElement("script");
  newScript.src = "./index.js";
  newScript.defer = true;
  newScript.setAttribute("data-reload", "true");

  document.body.appendChild(newScript);
}
