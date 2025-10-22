// v2 social hub features
const HUB_URL = 'https://medium.funfyp.com';
const RSS_URL = 'https://medium.com/feed/@Funfyp';
const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(RSS_URL)}`;

const state = { all: [], filtered: [], tags: new Set(), listView: false };

document.addEventListener('DOMContentLoaded', () => {
  loadArticles();
  wireViewToggles();
  document.getElementById('share-hub')?.addEventListener('click', () => shareUrl(HUB_URL, 'Melody — Medium Articles Hub'));
});

async function loadArticles(){
  showLoading();
  try{
    const r = await fetch(API_URL);
    const data = await r.json();
    if(data.status !== 'ok') throw new Error('Bad status');
    state.all = data.items || [];
    collectTags(state.all);
    renderChips();
    applyFilter();
  }catch(e){ showError(); }
}

function collectTags(items){
  state.tags = new Set();
  items.forEach(it => (it.categories||[]).forEach(c => state.tags.add(c)));
}

function renderChips(){
  const wrap = document.getElementById('tag-chips');
  if(!wrap) return;
  const tags = ['All', ...Array.from(state.tags).slice(0,12)];
  wrap.innerHTML = '';
  tags.forEach(tag => {
    const b = document.createElement('button');
    b.className = 'chip' + (tag==='All' ? ' active' : '');
    b.textContent = tag;
    b.onclick = () => { document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active')); b.classList.add('active'); applyFilter(tag); };
    wrap.appendChild(b);
  });
}

function applyFilter(tag='All'){
  state.filtered = tag==='All' ? state.all : state.all.filter(a => (a.categories||[]).includes(tag));
  renderArticles();
}

function wireViewToggles(){
  const gridBtn = document.getElementById('gridBtn');
  const listBtn = document.getElementById('listBtn');
  gridBtn?.addEventListener('click', ()=>{ state.listView=false; document.body.classList.remove('list'); gridBtn.classList.add('active'); listBtn.classList.remove('active'); renderArticles(); });
  listBtn?.addEventListener('click', ()=>{ state.listView=true; document.body.classList.add('list'); listBtn.classList.add('active'); gridBtn.classList.remove('active'); renderArticles(); });
}

function renderArticles(){
  const container = document.getElementById('articles-container');
  document.getElementById('loading').style.display='none';
  document.getElementById('error').style.display='none';
  container.innerHTML = '';
  state.filtered.forEach((article,i)=> container.appendChild(card(article,i)));
}

function card(article, i){
  const c = document.createElement('div');
  c.className = 'article-card';
  c.style.animationDelay = `${(i+1)*0.08}s`;
  const image = extractImage(article.content);
  const excerpt = truncate(stripHtml(article.content), 200);
  const date = new Date(article.pubDate).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});
  const read = Math.max(1, Math.ceil(stripHtml(article.content).split(/\s+/).length/200));
  const likes = getLikes(article.link);
  c.innerHTML = `
    ${image ? `<img src="${image}" class="article-image" alt="${escapeHtml(article.title)}" loading="lazy">` : '<div class="article-image"></div>'}
    <div class="article-content">
      <h3 class="article-title">${article.title}</h3>
      <p class="article-excerpt">${excerpt}</p>
      <div class="article-meta"><span class="article-date">${date}</span><span class="reading-time">${read} min read</span></div>
      <div class="article-tags">${(article.categories||[]).slice(0,3).map(t=>`<span class="tag">${t}</span>`).join('')}</div>
      <div class="article-footer">
        <div class="share-row">
          ${btn('X', ()=>shareTo('x',article))}
          ${btn('in', ()=>shareTo('li',article))}
          ${btn('🔗', ()=>copyLink(article.link))}
        </div>
        <div>
          <button class="share-btn like" aria-label="Like" onclick="toggleLike('${article.link}')">❤ ${likes}</button>
          <a class="read-more" href="${article.link}" target="_blank" rel="noopener">Read →</a>
        </div>
      </div>
    </div>`;
  c.addEventListener('click', e => { if(e.target.tagName!=='A' && !e.target.classList.contains('share-btn')) window.open(article.link,'_blank'); });
  return c;
}

function btn(label, fn){ const b=document.createElement('button'); b.className='share-btn'; b.textContent=label; b.onclick=(e)=>{e.stopPropagation(); fn();}; return b; }

function shareTo(kind, article){
  const u = encodeURIComponent(article.link);
  const t = encodeURIComponent(article.title);
  let url = '';
  if(kind==='x') url = `https://twitter.com/intent/tweet?url=${u}&text=${t}`;
  if(kind==='li') url = `https://www.linkedin.com/shareArticle?url=${u}&title=${t}`;
  window.open(url,'_blank','noopener');
}

function shareUrl(url, title){
  if(navigator.share){ navigator.share({title, url}).catch(()=>{}); }
  else { copyLink(url); }
}

function copyLink(url){ navigator.clipboard?.writeText(url); }

function toggleLike(key){
  const n = getLikes(key)+1; localStorage.setItem('like:'+key, n); renderArticles();
}
function getLikes(key){ return parseInt(localStorage.getItem('like:'+key)||'0',10); }

function extractImage(html){ const m = html.match(/<img[^>]+src="([^"]+)"/); return m?m[1]:''; }
function stripHtml(h){ const d=document.createElement('div'); d.innerHTML=h; return d.textContent||''; }
function truncate(s,n){ return s.length>n? s.slice(0,n)+'…': s; }
function escapeHtml(s){ return s.replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); }

function showLoading(){ document.getElementById('loading').style.display='flex'; }
function showError(){ document.getElementById('loading').style.display='none'; document.getElementById('error').style.display='block'; }

setInterval(loadArticles, 30*60*1000);
