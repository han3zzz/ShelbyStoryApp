import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import { Account, AccountAddress, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { ShelbyNodeClient } from "@shelby-protocol/sdk/node";
import { json } from "node:stream/consumers";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });
const SECRET = process.env.JWT_SECRET;
const TIME_TO_LIVE = 30 * 24 * 60 * 60 * 1_000_000
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests, chill bro 😅"
    });
  }
});
app.use("/api/upload", limiter);
app.use("/api/comment", limiter);
app.use("/api/react", limiter);
// fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve static
app.use(express.static(path.join(__dirname, "../")));

// route /
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../index.html"));
});
app.use((err: any, req: any, res: any, next: any) => {
  res.status(500).json({
    success: false,
    error: err?.message || "The server is overloaded, please try again later."
  });
});
if (!process.env.SHELBY_ACCOUNT_PRIVATE_KEY) {
  throw new Error("Missing SHELBY_ACCOUNT_PRIVATE_KEY");
}
if (!process.env.SHELBY_API_KEY) {
  throw new Error("Missing SHELBY_API_KEY");
}

const config = {
  network: Network.TESTNET,
  apiKey: process.env.SHELBY_API_KEY,
};

const shelbyClient = new ShelbyNodeClient(config);

const signer = Account.fromPrivateKey({
  privateKey: new Ed25519PrivateKey(process.env.SHELBY_ACCOUNT_PRIVATE_KEY),
});

function randomId(){
  return crypto.randomUUID().replaceAll("-", "")
}
function createTime(){
   
  return Date.now()  +"_"+ crypto.randomUUID().slice(0,6)

}
app.get("/api/ping", async (req, res) => {
   console.log("ping");
   res.send("pong");
});


app.post("/api/upload",verifyToken, upload.single("file"), async (req, res) => {
  try {

    const file = req.file;
    const caption = req.body.caption;
    const author = (req as any).user.email.email;
    /* ---------- VALIDATE ---------- */

    if(!author){
      return res.status(400).json({error:"Author required"});
    }
     if(!file){
      return res.status(400).json({error:"No file uploaded"});
    }
    /* check file type */

    const allowedTypes = ["image/png","image/jpeg","image/webp","video/mp4"];

    if(!allowedTypes.includes(file.mimetype)){
      return res.status(400).json({error:"File type not supported"});
    }

    /* check file size (5MB) */

    if(file.size > 5 * 1024 * 1024){
      return res.status(400).json({error:"File too large (max 5MB)"});
    }

    if(!caption || caption.trim()===""){
      return res.status(400).json({error:"Caption required"});
    }

    if(caption.length >= 50){
      return res.status(400).json({error:"Caption too long (max 50)"});
    }

   
    if(caption.includes("_")){
  return res.status(400).json({
    error:"Caption cannot contain '_' character"
  });
}

    

    /* ---------- UPLOAD ---------- */

    const id = randomId();
    const timee = createTime();

    const blobName = id;

    await shelbyClient.upload({
      blobData: new Uint8Array(file.buffer),
      signer,
      blobName:id,
      expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
    });

    await new Promise(r => setTimeout(r,10000));

    const post = {
      id:id,
      author:author,
      caption:caption,
      time:Date.now(),
      media:"https://api.testnet.shelby.xyz/shelby/v1/blobs/0x2a2b71eb64838441b6bb408913cacd6d04f517fac1e187f7c346931f35b32775/"+blobName
    }

    const jsonBytes = new TextEncoder().encode(JSON.stringify(post));

    const linkPost = "post_"+id+"_"+timee+"_"+author+"_"+caption;

    await shelbyClient.upload({
      blobData: jsonBytes,
      signer,
      blobName: linkPost,
      expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
    });

    res.json({
      success:true,
      message:"Upload successful",
      blobName
    });

  } catch(err) {

    console.error(err);

    res.status(500).json({
      error:"Server error"
    });

  }
});

app.listen(3000, () => {
  console.log("API running on http://localhost:3000");
});

app.get("/api/list", async (req, res) => {
 const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS);
 
 const blobs = await getAllBlobs(account)
const posts = blobs
  .filter(blob => blob.blobNameSuffix.startsWith("post"))
  .sort((a,b)=>{

    const timeA = Number(a.blobNameSuffix.split("_")[2])
    const timeB = Number(b.blobNameSuffix.split("_")[2])

    return timeB - timeA // mới nhất trước
  })
  const result = [];
  for (const post of posts) {
   const url = "https://api.testnet.shelby.xyz/shelby/v1/blobs/0x2a2b71eb64838441b6bb408913cacd6d04f517fac1e187f7c346931f35b32775/" + post.blobNameSuffix;

const res = await fetch(url)

const data = await res.json()

result.push(data);
console.log(data);
} 
res.json(result);

});
app.get("/api/getReact", async (req, res) => {
 const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS);
 
 const blobs = await getAllBlobs(account)
const posts = blobs
  .filter(blob => {

    const type = blob.blobNameSuffix.split("_")[0]

    return type === "like" || type === "unlike"

  })
  .sort((a,b)=>{

    const timeA = Number(a.blobNameSuffix.split("_")[2])
    const timeB = Number(b.blobNameSuffix.split("_")[2])

    return timeB - timeA

  })
  const result = [];
  for (const post of posts) {
   const url = "https://api.testnet.shelby.xyz/shelby/v1/blobs/0x2a2b71eb64838441b6bb408913cacd6d04f517fac1e187f7c346931f35b32775/" + post.blobNameSuffix;

const res = await fetch(url)

const data = await res.json()

result.push(data);
console.log(data);
} 
res.json(result);

});
app.post("/api/react",verifyToken,upload.single("file"), async (req, res) => {
  try {
    const author = (req as any).user.email.email;
    const id = req.body.id;
    const type = req.body.type;
    const timee = createTime();
    if(!author){
      return res.status(400).json({error:"Author required"});
    }
      const react = {
      id: id,
      author: author,
      type : type,
      time: Date.now(),
    }
    const jsonString = JSON.stringify(react)
   const encoder = new TextEncoder()

const jsonBytes = encoder.encode(jsonString);
     const linkPost = type+"_" + id + "_" + timee +"_" + author;
     await shelbyClient.upload({
      blobData: jsonBytes,
      signer,
      blobName : linkPost,
      expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
    });

    res.json({
      success: true,
      message: "React successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "React failed! Please try later" });
  }
});
app.post("/api/comment",verifyToken,upload.single("file"), async (req, res) => {
  
  try {
    const author = (req as any).user.email.email;
    const id = req.body.id;
    const text = req.body.text;
    const timee = createTime();
     if(!author){
      return res.status(400).json({error:"Author required"});
    }
    // ❌ validate id
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid post id" });
    }

    // ❌ validate text
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: "Comment cannot be empty" });
    }

    // ❌ giới hạn độ dài
    if (text.length >= 100) {
      return res.status(400).json({ error: "Comment too long (max 100 chars)" });
    }

    // ❌ chống spam ký tự rác
    const cleanText = text.trim();
        // ❌ cấm dấu _
    if (cleanText.includes("_")) {
      return res.status(400).json({
        error: "Comment cannot contain '_' character"
      });
    }

    // ❌ chống XSS cơ bản
    if (/<script>/i.test(cleanText)) {
      return res.status(400).json({ error: "Invalid content" });
    }
      const react = {
      id: id,
      author: author,
      comment : text,
      time: Date.now(),
    }
    const jsonString = JSON.stringify(react)
   const encoder = new TextEncoder()

const jsonBytes = encoder.encode(jsonString);
     const linkPost = "comment_" + id + "_" + timee +"_" + author + "_" + text;
     await shelbyClient.upload({
      blobData: jsonBytes,
      signer,
      blobName : linkPost,
      expirationMicros: Date.now() * 1000 + TIME_TO_LIVE,
    });

    res.json({
      success: true,
      message: "React successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Comment failed! Please try later" });
  }
});
app.get("/api/getcomment/:id", async (req, res) => {
  try {
    const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS);
    const id = req.params.id;

    const blobs = await getAllBlobs(account)

    const posts = blobs
      .filter(blob => {
        const parts = blob.blobNameSuffix.split("_");
        return parts[0] === "comment" && parts[1] === id;
      })
      .sort((a, b) => {
        const timeA = Number(a.blobNameSuffix.split("_")[2]);
        const timeB = Number(b.blobNameSuffix.split("_")[2]);
        return timeB - timeA;
      });

    const result = [];

    for (const post of posts) {
      try {
        const url =
          "https://api.testnet.shelby.xyz/shelby/v1/blobs/" +
          process.env.SHELBY_ACCOUNT_ADDRESS +
          "/" +
          post.blobNameSuffix;

        const r = await fetch(url, {
          headers: {
            Authorization: `Bearer ${process.env.SHELBY_API_KEY}`
          }
        });

        if (!r.ok) {
          console.log("Fetch lỗi:", r.status);
          continue;
        }

        const text = await r.text();

        if (!text) continue;

        const data = JSON.parse(text);

        result.push(data);

      } catch (err) {
        console.log("Lỗi từng comment:", err);
        continue;
      }
    }

    res.json(result);

  } catch (err) {
    console.error("GET COMMENT ERROR:", err);
    res.status(500).json({ error: "Failed to load comments" });
  }
});
app.get("/api/feed", async (req, res) => {
  try {
    const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS)
    const blobs = await getAllBlobs(account)

    const posts = []
    const comments = []
    const reacts = []

    // phân loại blob
    for (const blob of blobs) {
      const name = blob?.blobNameSuffix
      if (!name) continue

      const parts = name.split("_")
      const type = parts[0]

      if (type === "post") posts.push(name)
      else if (type === "comment") comments.push(name)
      else if (type === "like" || type === "unlike") reacts.push(name)
    }

    // sort post mới nhất trước (dựa vào timestamp index 2)
    posts.sort((a, b) => {
      const ta = Number(a.split("_")[2]) || 0
      const tb = Number(b.split("_")[2]) || 0
      return tb - ta
    })

    // --- CURSOR PAGINATION ---
    const limit = 5
    const cursorStr = req.query.cursor as string | undefined
    const cursor = cursorStr ? parseInt(cursorStr) : 0

    const slice = posts.slice(cursor, cursor + limit)
    const nextCursor = cursor + slice.length < posts.length ? cursor + slice.length : null

    res.json({
      posts: slice,
      comments, // trả toàn bộ nếu muốn, hoặc tách pagination riêng
      reacts,   // tương tự
      nextCursor
    })

  } catch (err) {
    console.log("FEED ERROR:", err)
    res.status(500).json({
      posts: [],
      comments: [],
      reacts: [],
      nextCursor: null
    })
  }
})
app.get("/api/nofi", async (req, res) => {
  try {
    const currentUser = req.query.user as string
    if (!currentUser) {
      return res.status(400).json({ notifications: [] })
    }

    const account = AccountAddress.fromString(process.env.SHELBY_ACCOUNT_ADDRESS)
    const blobs = await getAllBlobs(account)

    const posts: string[] = []
    const comments: string[] = []
    const reacts: string[] = []

    // --- phân loại ---
    for (const blob of blobs) {
      const name = blob?.blobNameSuffix
      if (!name) continue
      if (!name.includes("_")) continue

      const parts = name.split("_")
      const type = parts[0]

      if (type === "post") posts.push(name)
      else if (type === "comment") comments.push(name)
      else if (type === "like" || type === "unlike") reacts.push(name)
    }

    // --- lấy post của user ---
    const myPosts = posts.filter(p => p.split("_")[4] === currentUser)
    const myPostIds = myPosts.map(p => p.split("_")[1])

    // map postId -> caption
    const postMap = new Map<string, string>()
    myPosts.forEach(p => {
      const parts = p.split("_")
      postMap.set(parts[1], parts[5] || "")
    })

    const seen = new Set()
    const notifications: any[] = []

    // --- reacts ---
    reacts.forEach(r => {
      const p = r.split("_")
      if (p.length < 5) return

      const type = p[0]
      const postId = p[1]
      const time = p[2]
      const user = p[4]

      if (!myPostIds.includes(postId)) return
      if (user === currentUser) return

      const caption = postMap.get(postId) || ""

      const key = `${type}_${postId}_${user}`

      if (seen.has(key)) return
      seen.add(key)

      notifications.push({
        type,
        author: user,
        caption,
        time
      })
    })

    // --- comments ---
    comments.forEach(c => {
      const p = c.split("_")
      if (p.length < 5) return

      const postId = p[1]
      const time = p[2]
      const user = p[4]

      if (!myPostIds.includes(postId)) return
      if (user === currentUser) return

      const caption = postMap.get(postId) || ""

      const key = `comment_${postId}_${user}`

      if (seen.has(key)) return
      seen.add(key)

      notifications.push({
        type: "comment",
        author: user,
        caption,
        time
      })
    })

    // sort mới nhất
    notifications.sort((a, b) => Number(b.time) - Number(a.time))

    res.json({
      notifications
    })

  } catch (err) {
    console.log("NOFI ERROR:", err)

    res.status(500).json({
      notifications: []
    })
  }
})
app.post("/api/login",upload.single("file"), (req, res) => {

  const  email = req.body;
   console.log(email)

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const token = jwt.sign(
    { email: email },
    SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    token: token,
    email: email
  });

});
export function verifyToken(req: any, res: any, next: any){

  const authHeader = req.headers.authorization;

  if(!authHeader){
    return res.status(401).json({error:"You can login!"});
  }

  const token = authHeader.split(" ")[1];

  try{

    const decoded = jwt.verify(token, SECRET);

    req.user = decoded;

    next();

  }catch(e){

    res.status(401).json({error:"You can login!"});

  }

}
app.get("/api/image/:id", async (req, res) => {
  try {
    const url = `https://api.testnet.shelby.xyz/shelby/v1/blobs/0x2a2b71eb64838441b6bb408913cacd6d04f517fac1e187f7c346931f35b32775/${req.params.id}`;

    async function fetchWithRetry(retries = 2) {
      for (let i = 0; i <= retries; i++) {
        const r = await fetch(url, {
          headers: {
            Authorization: `Bearer ${process.env.SHELBY_API_KEY}`
          }
        });

        // ❗ nếu status lỗi → retry
        if (!r.ok) {
          console.error("Shelby status:", r.status);
        } else {
          const buffer = await r.arrayBuffer();

          // ❗ nếu có data thật → return luôn
          if (buffer && buffer.byteLength > 0) {
            return {
              buffer,
              contentType: r.headers.get("content-type")
            };
          }

          console.error("Empty buffer lần", i + 1);
        }

        // delay 200ms rồi thử lại
        await new Promise(res => setTimeout(res, 200));
      }

      return null;
    }

    const result = await fetchWithRetry(2);

    if (!result) {
      return res.status(404).send("Image not ready");
    }

    res.set(
      "Content-Type",
      result.contentType || "image/jpeg"
    );
    res.set("Cache-Control", "public, max-age=86400");

    res.send(Buffer.from(result.buffer));

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).send("Server error");
  }
});

async function getAllBlobs(account: string) {
  const limit = 200;
  let offset = 0; // ⚠️ phải bắt đầu từ 0
  let allBlobs: any[] = [];

  while (true) {
    const blobs = await shelbyClient.coordination.getAccountBlobs({
      account,
      pagination: { limit, offset }
    });

    allBlobs = allBlobs.concat(blobs);

    // nếu trả về ít hơn limit => đã hết data
    if (blobs.length < limit) break;

    offset += limit;
  }

  return allBlobs;
}
