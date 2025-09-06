
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCuO7GuySvhOsWgi1w_h3cq8_araPUxrlA",
  authDomain: "finance-78a64.firebaseapp.com",
  projectId: "finance-78a64",
  storageBucket: "finance-78a64.firebasestorage.app",
  messagingSenderId: "46972621123",
  appId: "1:46972621123:web:59b9662b69c24731759ff6",
  measurementId: "G-HKGV4RKPMM"
};

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
const auth = firebase.auth();

const GEMINI_ENDPOINT = "https://us-central1-finance-78a64.cloudfunctions.net/gemini";
const appId = "totum-fund";

const navConfig=[
  {id:"home",icon:"fa-home",label:"Home"},
  {id:"budgets",icon:"fa-bullseye",label:"Budgets"},
  {id:"savings",icon:"fa-piggy-bank",label:"Savings"},
  {id:"assistant",icon:"fa-robot",label:"AI"},
  {id:"profile",icon:"fa-user",label:"Profile"}
];

const navContainer=document.getElementById("nav-container");
const navTemplate=document.getElementById("nav-item-template").content;
let currentView="home";
const appContainer=document.getElementById("app-container");

navConfig.forEach(({id,icon,label})=>{
  const clone=navTemplate.cloneNode(true);
  const btn=clone.querySelector(".nav-item");
  btn.dataset.page=id;
  clone.querySelector("i").className=`fa-solid ${icon}`;
  clone.querySelector("span").textContent=label;
  btn.addEventListener("click",()=>navigateTo(id));
  navContainer.appendChild(clone);
});
function updateNavUI(){
  document.querySelectorAll(".nav-item").forEach(b=>{
    b.classList.toggle("active",b.dataset.page===currentView);
  });
}
function navigateTo(page){
  const i=navConfig.findIndex(x=>x.id===page);
  if(i!==-1){appContainer.style.transform=`translateX(-${i*100}vw)`;currentView=page;updateNavUI();}
}
updateNavUI();

async function addTransaction() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const tx = { amount: Math.floor(Math.random()*100), desc: "Test Tx", created: Date.now() };
  await db.collection("artifacts").doc(appId).collection("users").doc(uid).collection("transactions").add(tx);
  loadTransactions();
}
async function loadTransactions() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const snap = await db.collection("artifacts").doc(appId).collection("users").doc(uid).collection("transactions").orderBy("created","desc").get();
  const div = document.getElementById("transactions");
  div.innerHTML = "";
  snap.forEach(doc => {
    const d = doc.data();
    div.innerHTML += `<div class="glass-card p-2 my-2">?? ${d.desc} - $${d.amount}</div>`;
  });
}

async function addBudget() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const budget = { category: "Food", limit: 200, created: Date.now() };
  await db.collection("artifacts").doc(appId).collection("users").doc(uid).collection("budgets").add(budget);
  loadBudgets();
}
async function loadBudgets() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const snap = await db.collection("artifacts").doc(appId).collection("users").doc(uid).collection("budgets").get();
  const div = document.getElementById("budgets");
  div.innerHTML = "";
  snap.forEach(doc => {
    const d = doc.data();
    div.innerHTML += `<div class="glass-card p-2 my-2">?? ${d.category} - Limit: $${d.limit}</div>`;
  });
}

async function addSaving() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const saving = { goal: "Emergency Fund", target: 1000, created: Date.now() };
  await db.collection("artifacts").doc(appId).collection("users").doc(uid).collection("savings").add(saving);
  loadSavings();
}
async function loadSavings() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const snap = await db.collection("artifacts").doc(appId).collection("users").doc(uid).collection("savings").get();
  const div = document.getElementById("savings");
  div.innerHTML = "";
  snap.forEach(doc => {
    const d = doc.data();
    div.innerHTML += `<div class="glass-card p-2 my-2">?? ${d.goal} - Target: $${d.target}</div>`;
  });
}

async function askAI() {
  const input = document.getElementById("aiInput").value;
  if (!input) return;
  document.getElementById("aiResponse").textContent = "? Thinking...";
  try {
    const res = await fetch(GEMINI_ENDPOINT, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ prompt: input })
    });
    const data = await res.json();
    document.getElementById("aiResponse").textContent = data.text || "No response";
  } catch (e) {
    document.getElementById("aiResponse").textContent = "Error contacting AI.";
  }
}

async function seedIfNewUser(uid) {
  const userDoc = db.collection("artifacts").doc(appId).collection("users").doc(uid);
  const seededDoc = await userDoc.get();
  if (!seededDoc.exists) {
    const transactions = [
      { amount: 45, desc: "Groceries", created: Date.now() },
      { amount: 120, desc: "Electric Bill", created: Date.now() },
      { amount: 15, desc: "Coffee", created: Date.now() }
    ];
    for (const tx of transactions) {
      await userDoc.collection("transactions").add(tx);
    }

    const budgets = [
      { category: "Food", limit: 300, created: Date.now() },
      { category: "Utilities", limit: 150, created: Date.now() },
      { category: "Entertainment", limit: 100, created: Date.now() }
    ];
    for (const b of budgets) {
      await userDoc.collection("budgets").add(b);
    }

    const savings = [
      { goal: "Emergency Fund", target: 1000, created: Date.now() },
      { goal: "Vacation", target: 2000, created: Date.now() }
    ];
    for (const s of savings) {
      await userDoc.collection("savings").add(s);
    }
  }
}

auth.signInAnonymously();

auth.onAuthStateChanged(async user=>{
  if(user){
    document.getElementById("userId").textContent = "User ID: " + user.uid;
    await seedIfNewUser(user.uid);
    loadTransactions();
    loadBudgets();
    loadSavings();
  }
});
