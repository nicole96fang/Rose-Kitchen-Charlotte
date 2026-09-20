import { blankRecipe } from "./store.js";

const esc = (v="") => String(v).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
const uid = () => Math.random().toString(36).slice(2,8);
const icon = (value, cls="") => {
  const isImage = typeof value === "string" && value.startsWith("/");
  return isImage
    ? `<span class="category-icon ${cls}" aria-hidden="true"><img src="${value}" alt=""></span>`
    : `<span class="category-icon ${cls}" aria-hidden="true">${value}</span>`;
};

function toast(message){
  const root=document.getElementById("toast-root");
  const el=document.createElement("div");
  el.className="toast";
  el.textContent=message;
  root.appendChild(el);
  requestAnimationFrame(()=>el.classList.add("show"));
  setTimeout(()=>{el.classList.remove("show");setTimeout(()=>el.remove(),220)},2200);
}

async function fileToDataURL(file, max=1800){
  if(!file) return "";
  const img = await new Promise((resolve,reject)=>{
    const u=URL.createObjectURL(file), im=new Image();
    im.onload=()=>{URL.revokeObjectURL(u);resolve(im)};
    im.onerror=reject; im.src=u;
  });
  const scale=Math.min(1,max/Math.max(img.width,img.height));
  const canvas=document.createElement("canvas");
  canvas.width=Math.round(img.width*scale); canvas.height=Math.round(img.height*scale);
  const ctx=canvas.getContext("2d");
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  return canvas.toDataURL("image/jpeg",0.82);
}

export function createApp(root, store){
  let route={page:"home"};
  let editing=null;
  let draft=null;
  let search="";
  let unsubscribe;
  let loading=true;

  const navigate=(page, params={})=>{
    route={page,...params};
    if(page==="new-recipe") draft=blankRecipe(params.categoryId);
    if(page==="edit-recipe") {
      const found=store.getState().recipes.find(r=>r.id===params.id);
      draft=found ? structuredClone(found) : blankRecipe(params.categoryId);
    }
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  };

  const render=()=>{
    const state=store.getState();
    root.innerHTML = `
      <div class="app-shell">
        <div class="snow-layer" id="snow-layer"></div>
        <main class="screen">${loading?loadingView():view(state)}</main>
        ${!loading && !["new-recipe","edit-recipe","recipe-detail"].includes(route.page)?bottomNav(): ""}
      </div>
    `;
    if(!loading) bind();
  };

  function loadingView(){
    return `<section class="loading-screen"><div class="loading-flower">✿</div><h2>正在打开厨房日记…</h2><p>把喜欢的食物，好好收藏起来。</p></section>`;
  }

  function bottomNav(){
    const items=[
      ["home","⌂","首页"],["recipes","▧","食谱"],["shopping","🛒","购买清单"],["profile","♙","我的"]
    ];
    return `<nav class="bottom-nav">${items.map(([p,i,n])=>`
      <button class="nav-item ${route.page===p?'active':''}" data-nav="${p}">
        <span class="nav-icon">${i}</span><span>${n}</span>
      </button>`).join("")}</nav>`;
  }

  function topHeader(title, subtitle=""){
    return `<header class="page-header">
      <button class="back-btn" data-nav="home" aria-label="返回">‹</button>
      <div><h1>${esc(title)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:""}</div>
      <button class="round-btn" data-action="scroll-top">⌃</button>
    </header>`;
  }

  function homeView(state){
    const filtered=state.recipes.filter(r=>{
      const c=store.categories.find(x=>x.id===r.categoryId);
      return `${r.title} ${r.intro} ${c?.name||""} ${r.ingredients?.map(i=>i.name).join(" ")||""}`.toLowerCase().includes(search.toLowerCase());
    });
    return `<div class="home-page">
      <section class="hero-card">
        <div class="hero-flower">✿</div>
        <div class="hero-copy">
          <div class="eyebrow">MY LITTLE KITCHEN</div>
          <h1>Hi，Lovely！</h1>
          <p>厨房是我的治愈地 ♡</p>
          <small>把每一道喜欢的味道，写成自己的小小日记。</small>
        </div>
        <div class="hero-butterfly">🦋</div>
      </section>

      <label class="search-bar">
        <span>⌕</span><input id="search" value="${esc(search)}" placeholder="搜索食谱 / 食材 / 菜系" />
        ${search?'<button data-action="clear-search">×</button>':""}
      </label>

      <section class="section">
        <div class="section-title"><div><h2>我的分类</h2><p>一起收集美味的回忆 ♡</p></div><span>${state.recipes.length} 道食谱</span></div>
        <div class="category-grid">
          ${store.categories.map(c=>`
            <button class="category-card" data-category="${c.id}">
              ${icon(c.icon)}
              <div><strong>${c.name}</strong><small>${state.recipes.filter(r=>r.categoryId===c.id).length} 道食谱</small></div>
              <span class="chevron">›</span>
            </button>`).join("")}
        </div>
      </section>
      ${search?`<section class="search-result-card"><h3>搜索结果</h3>${filtered.length?filtered.slice(0,8).map(recipeMini).join(""):`<p>还没有找到相关食谱 ♡</p>`}</section>`:""}
    </div>`;
  }

  function recipeMini(r){
    const c=store.categories.find(x=>x.id===r.categoryId);
    return `<button class="recipe-mini" data-recipe="${r.id}">
      <div class="mini-photo">${r.cover?`<img src="${r.cover}">`:icon(c?.icon||"🍳")}</div>
      <div><strong>${esc(r.title||"未命名食谱")}</strong><small>${esc(c?.name||"其他")} · ${esc(r.time||"")}</small></div>
      <span>›</span>
    </button>`;
  }

  function categoryView(state){
    const c=store.categories.find(x=>x.id===route.categoryId) || store.categories[0];
    const recipes=state.recipes.filter(r=>r.categoryId===c.id);
    return `<div class="page">
      ${topHeader(c.name, "把这一类喜欢的味道慢慢收好")}
      <section class="category-banner">
        ${icon(c.icon,"big")}
        <div><h2>${c.name}</h2><p>${recipes.length} 道食谱 · 每一道都是生活的记录</p></div>
      </section>
      <button class="primary-btn add-recipe" data-action="new-recipe" data-category="${c.id}">＋ 添加新食谱</button>
      <section class="recipe-list">
        ${recipes.length?recipes.map(r=>recipeCard(r)).join(""):`<div class="empty-state"><div>✿</div><h3>这里还空空的</h3><p>写下你的第一道${c.name}食谱吧。</p></div>`}
      </section>
    </div>`;
  }

  function recipeCard(r){
    const c=store.categories.find(x=>x.id===r.categoryId);
    return `<article class="recipe-card" data-recipe="${r.id}">
      <div class="recipe-card-photo">${r.cover?`<img src="${r.cover}" alt="">`:icon(c?.icon||"🍳","big")}</div>
      <div class="recipe-card-body">
        <div class="recipe-card-head"><div><h3>${esc(r.title||"未命名食谱")}</h3><p>${esc(r.intro||"还没有写介绍")}</p></div>
        <button class="heart-btn" data-fav="${r.id}" aria-label="收藏">${r.favorite?"♥":"♡"}</button></div>
        <div class="meta-row"><span>◷ ${esc(r.time||"—")}</span><span>🍽 ${esc(r.servings||"—")}</span><span>${r.ingredients?.length||0} 食材</span></div>
      </div>
    </article>`;
  }

  function recipesView(state){
    const all=state.recipes, fav=all.filter(r=>r.favorite);
    return `<div class="page">
      <section class="simple-top"><div class="eyebrow">RECIPE JOURNAL</div><h1>食谱大全</h1><p>每一道味道，都值得被好好记录。</p></section>
      <div class="segmented"><button class="active" data-recipe-tab="all">全部 ${all.length}</button><button data-recipe-tab="fav">收藏 ${fav.length}</button></div>
      <div id="recipe-tab-content">${all.length?all.map(recipeCard).join(""):`<div class="empty-state"><div>♡</div><h3>还没有食谱</h3><p>去首页选择一个分类，开始记录吧。</p></div>`}</div>
    </div>`;
  }

  function shoppingView(state){
    return `<div class="page">
      <section class="simple-top"><div class="eyebrow">MY SHOPPING</div><h1>购买清单</h1><p>买菜的时候，带着小小的厨房计划。</p></section>
      <button class="primary-btn" data-action="add-list">＋ 添加清单</button>
      <section class="shopping-list">
        ${state.shoppingLists.length?state.shoppingLists.map(list=>{
          const items=list.items||[];
          return `<article class="shopping-card">
            <div class="shopping-card-head"><div><h3>${esc(list.title||"今天要买什么？")}</h3><small>${new Date(list.createdAt||Date.now()).toLocaleDateString("zh-CN")}</small></div>
              <button class="icon-btn" data-delete-list="${list.id}">×</button></div>
            <div class="shopping-items">${items.map((it,i)=>`<label class="shopping-item ${it.done?'done':''}">
              <input type="checkbox" data-check-item="${list.id}:${i}" ${it.done?"checked":""}><span>${esc(it.name)}</span><em>${esc(it.amount)}</em>
            </label>`).join("")}</div>
          </article>`;
        }).join(""):`<div class="empty-state"><div>🛒</div><h3>清单是空的</h3><p>把今天要买的食材写下来，厨房会更从容。</p></div>`}
      </section>
    </div>`;
  }

  function profileView(state){
    const p=state.profile;
    return `<div class="page">
      <section class="profile-hero">
        <div class="avatar-wrap">${p.avatar?`<img src="${p.avatar}" alt="">`:"👩🏻‍🍳"}<label class="avatar-edit">✎<input id="avatar-input" type="file" accept="image/*"></label></div>
        <div><div class="eyebrow">MY KITCHEN</div><h1>${esc(p.name||"芳芳")}</h1><p>${esc(p.bio||"用喜欢的食物，过喜欢的生活 ♡")}</p></div>
      </section>
      <section class="stats-row"><div><strong>${state.recipes.length}</strong><span>总食谱</span></div><div><strong>${state.recipes.filter(r=>r.favorite).length}</strong><span>收藏</span></div><div><strong>${state.shoppingLists.length}</strong><span>清单</span></div></section>
      <section class="settings-card">
        <h2>主厨资料</h2>
        <label>昵称<input id="profile-name" value="${esc(p.name)}" placeholder="你的昵称"></label>
        <label>厨房签名<textarea id="profile-bio" rows="3" placeholder="写一句你喜欢的话">${esc(p.bio)}</textarea></label>
        <button class="secondary-btn" data-action="save-profile">保存资料</button>
      </section>
      <section class="backup-card">
        <div><div class="eyebrow">SAFETY BACKUP</div><h2>保护你的厨房记忆</h2><p>食谱保存在本机浏览器。建议定期手动备份，避免误清除 Safari 数据。</p></div>
        <div class="backup-actions"><button class="primary-btn" data-action="export">⬇ 导出备份</button><label class="secondary-btn">⬆ 导入备份<input id="import-input" type="file" accept="application/json" hidden></label></div>
      </section>
      <section class="info-note">☁︎ 本应用不使用后端、不含广告、不弹广告窗。数据默认只保存在你的设备中。</section>
    </div>`;
  }

  function recipeDetailView(state){
    const r=state.recipes.find(x=>x.id===route.id);
    if(!r) return `<div class="page">${topHeader("食谱不存在")}<div class="empty-state"><h3>找不到这道食谱</h3></div></div>`;
    const c=store.categories.find(x=>x.id===r.categoryId);
    return `<div class="page recipe-detail">
      <header class="page-header">
        <button class="back-btn" data-category="${c?.id}">‹</button>
        <div><div class="eyebrow">${esc(c?.name||"食谱")}</div><h1>${esc(r.title||"未命名食谱")}</h1></div>
        <button class="heart-btn large" data-fav="${r.id}">${r.favorite?"♥":"♡"}</button>
      </header>
      ${r.cover?`<div class="detail-cover"><img src="${r.cover}" alt=""></div>`:""}
      <section class="detail-intro"><h2>${esc(r.title||"未命名食谱")}</h2><p>${esc(r.intro||"")}</p><div class="detail-meta"><span>🍽 ${esc(r.servings||"—")}</span><span>◷ ${esc(r.time||"—")}</span></div></section>
      <section class="detail-section"><h2>食材</h2><div class="ingredient-table">${(r.ingredients||[]).map(i=>`<div><span>${esc(i.name)}</span><b>${esc(i.amount)}</b></div>`).join("")}</div></section>
      <section class="detail-section"><h2>烹饪步骤</h2><div class="steps">${(r.steps||[]).map((s,i)=>`<div class="step"><span>${i+1}</span><p>${esc(s.text)}</p></div>`).join("")}</div></section>
      ${(r.photos||[]).length?`<section class="detail-section"><h2>制作记录</h2><div class="photo-grid">${r.photos.map(x=>`<img src="${x}" alt="">`).join("")}</div></section>`:""}
      <div class="detail-actions"><button class="secondary-btn" data-action="print">Print</button><button class="secondary-btn" data-action="share-pdf">分享 PDF</button><button class="primary-btn" data-action="edit-recipe" data-id="${r.id}">编辑</button></div>
    </div>`;
  }

  function editorView(state){
    const c=store.categories.find(x=>x.id===draft.categoryId);
    return `<div class="page editor-page">
      <header class="page-header sticky-head">
        <button class="back-btn" data-category="${c?.id}">‹</button>
        <div><div class="eyebrow">${esc(c?.name||"食谱")}</div><h1>${draft.id?"编辑食谱":"添加新食谱"}</h1></div>
        <button class="round-btn" data-action="save-draft">✓</button>
      </header>
      <form id="recipe-form" class="recipe-form">
        <section class="form-card">
          <div class="form-card-title"><span>01</span><div><h2>食谱资料</h2><p>先写下这一道菜的名字和故事。</p></div></div>
          <label>菜名 <input name="title" value="${esc(draft.title)}" placeholder="例如：奶油蘑菇鸡"></label>
          <label>介绍 <textarea name="intro" rows="3" placeholder="这道菜为什么喜欢？">${esc(draft.intro)}</textarea></label>
          <div class="two-col"><label>份量<input name="servings" value="${esc(draft.servings)}" placeholder="2 人份"></label><label>时间<input name="time" value="${esc(draft.time)}" placeholder="30 分钟"></label></div>
        </section>
        <section class="form-card">
          <div class="form-card-title"><span>02</span><div><h2>食材</h2><p>可以无限添加食材与用量。</p></div></div>
          <div id="ingredients">${(draft.ingredients||[]).map((i,idx)=>ingredientRow(i,idx)).join("")}</div>
          <button type="button" class="add-line" data-add-ingredient>＋ 添加食材</button>
        </section>
        <section class="form-card">
          <div class="form-card-title"><span>03</span><div><h2>烹饪步骤</h2><p>一步一步，把味道留下来。</p></div></div>
          <div id="steps">${(draft.steps||[]).map((s,idx)=>stepRow(s,idx)).join("")}</div>
          <button type="button" class="add-line" data-add-step>＋ 添加步骤</button>
        </section>
        <section class="form-card">
          <div class="form-card-title"><span>04</span><div><h2>照片</h2><p>主题照片和制作过程都可以无限添加。</p></div></div>
          <label class="photo-upload">＋ 添加主题照片<input id="cover-input" type="file" accept="image/*"></label>
          ${draft.cover?`<div class="cover-preview"><img src="${draft.cover}"><button type="button" data-remove-cover>×</button></div>`:""}
          <label class="photo-upload">＋ 添加制作照片<input id="photos-input" type="file" accept="image/*" multiple></label>
          ${draft.photos?.length?`<div class="photo-grid edit-photos">${draft.photos.map((x,i)=>`<div><img src="${x}"><button type="button" data-remove-photo="${i}">×</button></div>`).join("")}</div>`:""}
        </section>
        <div class="editor-bottom-actions">
          <button type="button" class="secondary-btn" data-action="print-draft">Print</button>
          <button type="button" class="secondary-btn" data-action="share-draft">分享</button>
          <button type="submit" class="primary-btn">保存</button>
        </div>
      </form>
    </div>`;
  }

  function ingredientRow(i,idx){
    return `<div class="dynamic-row"><span class="row-num">${idx+1}</span><input data-ing-name value="${esc(i.name)}" placeholder="食材名称"><input data-ing-amount value="${esc(i.amount)}" placeholder="用量"><button type="button" data-remove-ing="${idx}">×</button></div>`;
  }
  function stepRow(s,idx){
    return `<div class="step-edit-row"><span>${idx+1}</span><textarea data-step-text rows="2" placeholder="写下第 ${idx+1} 步…">${esc(s.text)}</textarea><button type="button" data-remove-step="${idx}">×</button></div>`;
  }

  function view(state){
    if(route.page==="home") return homeView(state);
    if(route.page==="category") return categoryView(state);
    if(route.page==="recipes") return recipesView(state);
    if(route.page==="shopping") return shoppingView(state);
    if(route.page==="profile") return profileView(state);
    if(route.page==="recipe-detail") return recipeDetailView(state);
    if(route.page==="new-recipe" || route.page==="edit-recipe") return editorView(state);
    return homeView(state);
  }

  function bind(){
    root.querySelectorAll("[data-nav]").forEach(el=>el.addEventListener("click",()=>navigate(el.dataset.nav)));
    root.querySelectorAll("[data-category]").forEach(el=>el.addEventListener("click",()=>navigate("category",{categoryId:el.dataset.category})));
    root.querySelectorAll("[data-recipe]").forEach(el=>el.addEventListener("click",(e)=>{
      if(e.target.closest("[data-fav]")) return;
      navigate("recipe-detail",{id:el.dataset.recipe});
    }));
    root.querySelectorAll("[data-fav]").forEach(el=>el.addEventListener("click",async e=>{
      e.stopPropagation(); await store.toggleFavorite(el.dataset.fav); toast("已更新收藏 ♡");
    }));
    const searchEl=root.querySelector("#search");
    searchEl?.addEventListener("input",e=>{search=e.target.value; render(); const n=root.querySelector("#search"); n?.focus(); n?.setSelectionRange(search.length,search.length);});
    root.querySelector("[data-action=clear-search]")?.addEventListener("click",()=>{search="";render()});
    root.querySelectorAll("[data-action=scroll-top]").forEach(x=>x.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"})));

    root.querySelector("[data-action=new-recipe]")?.addEventListener("click",e=>navigate("new-recipe",{categoryId:e.currentTarget.dataset.category}));
    root.querySelector("[data-action=edit-recipe]")?.addEventListener("click",e=>navigate("edit-recipe",{id:e.currentTarget.dataset.id}));
    root.querySelector("[data-action=save-draft]")?.addEventListener("click",()=>saveDraft(true));
    root.querySelector("#recipe-form")?.addEventListener("submit",e=>{e.preventDefault();saveDraft(false)});
    root.querySelector("[data-add-ingredient]")?.addEventListener("click",()=>{draft.ingredients.push({name:"",amount:""});render();scrollToId("ingredients")});
    root.querySelector("[data-add-step]")?.addEventListener("click",()=>{draft.steps.push({text:""});render();scrollToId("steps")});
    root.querySelectorAll("[data-remove-ing]").forEach(x=>x.addEventListener("click",()=>{draft.ingredients.splice(+x.dataset.removeIng,1); if(!draft.ingredients.length)draft.ingredients.push({name:"",amount:""});render()}));
    root.querySelectorAll("[data-remove-step]").forEach(x=>x.addEventListener("click",()=>{draft.steps.splice(+x.dataset.removeStep,1); if(!draft.steps.length)draft.steps.push({text:""});render()}));
    root.querySelector("[data-remove-cover]")?.addEventListener("click",()=>{draft.cover="";render()});
    root.querySelectorAll("[data-remove-photo]").forEach(x=>x.addEventListener("click",()=>{draft.photos.splice(+x.dataset.removePhoto,1);render()}));
    root.querySelector("#cover-input")?.addEventListener("change",async e=>{draft.cover=await fileToDataURL(e.target.files[0]);render()});
    root.querySelector("#photos-input")?.addEventListener("change",async e=>{for(const f of e.target.files)draft.photos.push(await fileToDataURL(f));render()});

    root.querySelector("[data-action=print]")?.addEventListener("click",()=>printRecipe(store.getState().recipes.find(r=>r.id===route.id)));
    root.querySelector("[data-action=share-pdf]")?.addEventListener("click",()=>printRecipe(store.getState().recipes.find(r=>r.id===route.id),true));
    root.querySelector("[data-action=print-draft]")?.addEventListener("click",()=>{syncDraft();printRecipe(draft)});
    root.querySelector("[data-action=share-draft]")?.addEventListener("click",()=>{syncDraft();printRecipe(draft,true)});

    root.querySelector("[data-action=add-list]")?.addEventListener("click",openShoppingSheet);
    root.querySelectorAll("[data-delete-list]").forEach(x=>x.addEventListener("click",async()=>{await store.deleteShoppingList(x.dataset.deleteList);toast("清单已删除")}));
    root.querySelectorAll("[data-check-item]").forEach(x=>x.addEventListener("change",async()=>{
      const [id,idx]=x.dataset.checkItem.split(":"); const list=store.getState().shoppingLists.find(l=>l.id===id); if(!list)return;
      const items=structuredClone(list.items||[]); items[+idx].done=x.checked; await store.updateShoppingList(id,{items});
    }));
    root.querySelector("#avatar-input")?.addEventListener("change",async e=>{const a=await fileToDataURL(e.target.files[0],600);await store.updateProfile({avatar:a});toast("头像已更新")});
    root.querySelector("[data-action=save-profile]")?.addEventListener("click",async()=>{
      await store.updateProfile({name:root.querySelector("#profile-name").value,bio:root.querySelector("#profile-bio").value});toast("主厨资料已保存 ♡");
    });
    root.querySelector("[data-action=export]")?.addEventListener("click",()=>store.exportBackup().then(()=>toast("备份文件已下载")));
    root.querySelector("#import-input")?.addEventListener("change",async e=>{try{await store.importBackup(e.target.files[0]);toast("备份已恢复")}catch{toast("备份文件无法读取")}});

    root.querySelectorAll("[data-recipe-tab]").forEach(x=>x.addEventListener("click",()=>{
      root.querySelectorAll("[data-recipe-tab]").forEach(b=>b.classList.remove("active"));x.classList.add("active");
      const fav=x.dataset.recipeTab==="fav"; const arr=store.getState().recipes.filter(r=>fav?r.favorite:true);
      root.querySelector("#recipe-tab-content").innerHTML=arr.length?arr.map(recipeCard).join(""):`<div class="empty-state"><div>♡</div><h3>这里还没有</h3></div>`;
      root.querySelectorAll("#recipe-tab-content [data-recipe]").forEach(el=>el.addEventListener("click",()=>navigate("recipe-detail",{id:el.dataset.recipe})));
    }));
  }

  function syncDraft(){
    if(!root.querySelector("#recipe-form")) return draft;
    const f=new FormData(root.querySelector("#recipe-form"));
    draft.title=f.get("title")||"";
    draft.intro=f.get("intro")||"";
    draft.servings=f.get("servings")||"";
    draft.time=f.get("time")||"";
    draft.ingredients=[...root.querySelectorAll(".dynamic-row")].map(row=>({name:row.querySelector("[data-ing-name]")?.value||"",amount:row.querySelector("[data-ing-amount]")?.value||""})).filter(x=>x.name||x.amount);
    if(!draft.ingredients.length)draft.ingredients=[{name:"",amount:""}];
    draft.steps=[...root.querySelectorAll(".step-edit-row")].map(row=>({text:row.querySelector("[data-step-text]")?.value||""})).filter(x=>x.text);
    if(!draft.steps.length)draft.steps=[{text:""}];
    return draft;
  }

  async function saveDraft(silent=false){
    syncDraft();
    if(!draft.title.trim()){toast("请先写下菜名 ♡");return;}
    const saved=await store.upsertRecipe({...draft,createdAt:draft.createdAt||new Date().toISOString()});
    draft=saved;
    if(!silent){toast("食谱已保存 ♡");navigate("recipe-detail",{id:saved.id});}
    else toast("已保存");
  }

  function scrollToId(id){setTimeout(()=>root.querySelector("#"+id)?.scrollIntoView({behavior:"smooth",block:"center"}),30)}

  function openShoppingSheet(){
    const sheet=document.createElement("div");
    sheet.className="sheet-backdrop";
    sheet.innerHTML=`<div class="sheet"><div class="sheet-handle"></div><h2>今天要买什么？</h2><p>一项一项写下来，买菜会更轻松。</p>
      <label>清单名称<input id="sheet-title" value="今天要买什么？"></label>
      <div id="sheet-items"><div class="sheet-row"><input data-name placeholder="食材"><input data-amount placeholder="数量"></div></div>
      <button class="add-line" id="sheet-add">＋ 再加一项</button>
      <div class="sheet-actions"><button class="secondary-btn" id="sheet-cancel">取消</button><button class="primary-btn" id="sheet-save">加入清单</button></div>
    </div>`;
    document.body.appendChild(sheet);
    sheet.querySelector("#sheet-cancel").onclick=()=>sheet.remove();
    sheet.querySelector("#sheet-add").onclick=()=>{const row=document.createElement("div");row.className="sheet-row";row.innerHTML=`<input data-name placeholder="食材"><input data-amount placeholder="数量">`;sheet.querySelector("#sheet-items").appendChild(row)};
    sheet.querySelector("#sheet-save").onclick=async()=>{
      const items=[...sheet.querySelectorAll(".sheet-row")].map(x=>({name:x.querySelector("[data-name]").value.trim(),amount:x.querySelector("[data-amount]").value.trim(),done:false})).filter(x=>x.name);
      if(!items.length){toast("至少写一项食材 ♡");return;}
      await store.addShoppingList({title:sheet.querySelector("#sheet-title").value.trim()||"今天要买什么？",items});
      sheet.remove();toast("已加入购买清单 ♡");
    };
  }

  function printRecipe(recipe,share=false){
    if(!recipe){toast("没有可打印的食谱");return;}
    const c=store.categories.find(x=>x.id===recipe.categoryId);
    const printRoot=document.createElement("div");
    printRoot.id="print-root";
    printRoot.innerHTML=`<article class="print-page">
      <div class="print-frame">
        <div class="print-kicker">${esc(c?.name||"RECIPE JOURNAL")}</div>
        <h1>${esc(recipe.title||"未命名食谱")}</h1>
        <p class="print-intro">${esc(recipe.intro||"")}</p>
        <div class="print-meta"><span>份量 · ${esc(recipe.servings||"—")}</span><span>时间 · ${esc(recipe.time||"—")}</span></div>
        ${recipe.cover?`<img class="print-cover" src="${recipe.cover}" alt="">`:""}
        <section><h2>食材</h2><div class="print-ingredients">${(recipe.ingredients||[]).filter(i=>i.name||i.amount).map(i=>`<div><span>${esc(i.name)}</span><b>${esc(i.amount)}</b></div>`).join("")}</div></section>
        <section><h2>烹饪步骤</h2>${(recipe.steps||[]).filter(s=>s.text).map((s,i)=>`<div class="print-step"><b>${String(i+1).padStart(2,"0")}</b><p>${esc(s.text)}</p></div>`).join("")}</section>
        ${(recipe.photos||[]).length?`<section><h2>制作记录</h2><div class="print-photos">${recipe.photos.map(x=>`<img src="${x}" alt="">`).join("")}</div></section>`:""}
        <div class="print-footer">芳芳的小厨房日记 · 用喜欢的食物，过喜欢的生活 ♡</div>
      </div>
    </article>`;
    document.body.appendChild(printRoot);
    const cleanup=()=>{printRoot.remove();window.removeEventListener("afterprint",cleanup)};
    window.addEventListener("afterprint",cleanup);
    if(share) toast("请在打印预览中选择“存储为 PDF / 分享”，即可得到 A4 食谱 PDF");
    window.print();
  }

  unsubscribe=store.subscribe(()=>{ if(!loading) render(); });
  store.ready.then(()=>{loading=false;render()});
  window.addEventListener("keydown",e=>{if(e.key==="Escape" && route.page!=="home")navigate("home")});
}
