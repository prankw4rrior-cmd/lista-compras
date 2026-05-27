import React, { useState, useEffect, useCallback, useRef } from "react";
import { fbGet, fbSet, fbListen } from "./firebase.js";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600&family=DM+Sans:wght@300;400;500&display=swap";

const LISTS_KEY    = "slv4_lists";
const HISTORY_KEY  = "slv4_history";
const PROFILE_KEY  = "slv4_profile";
const USERS_KEY    = "slv4_users";
const NOTIFS_KEY   = "slv4_notifs";
const REMINDERS_KEY= "slv4_reminders";

// ── List profiles ───────────────────────────────────────────────────
// Each profile defines: categories, keywords per category, unit hints,
// and a validator that rejects clearly wrong products.
const LIST_PROFILES = {
  supermercado: {
    label:"🛒 Supermercado", emoji:"🛒",
    nameTriggers:["supermercado","mercado","compras","semana","mes"],
    categories:[
      { id:"frutas",     label:"🍎 Frutas & Legumes", color:"#6EBF8B" },
      { id:"laticinios", label:"🧀 Laticínios",        color:"#F4C95D" },
      { id:"carnes",     label:"🥩 Carnes & Peixe",    color:"#E07A5F" },
      { id:"padaria",    label:"🍞 Padaria",            color:"#D4A574" },
      { id:"bebidas",    label:"🥤 Bebidas",            color:"#7EC8E3" },
      { id:"limpeza",    label:"🧹 Limpeza",            color:"#B5A9D4" },
      { id:"higiene",    label:"🧴 Higiene",            color:"#F0A7C0" },
      { id:"congelados", label:"❄️ Congelados",         color:"#A8D5E2" },
      { id:"outro",      label:"🛒 Outro",              color:"#C8C8C8" },
    ],
    kw:{
      frutas:["maca","pera","banana","laranja","limao","uva","morango","kiwi","manga","ananas","melao","melancia","pessego","ameixa","cereja","figo","framboesa","mirtilo","coco","papaia","tangerina","nectarina","tomate","cenoura","batata","cebola","alho","alface","espinafre","brocolo","couve","pepino","pimento","beringela","curgete","abobora","cogumelo","funcho","nabo","rabanete","beterraba","feijao","ervilha","grao","lentilha","milho","espargo","rucula","agriao","salsa","coentro","hortela","manjericao","gengibre","batata doce"],
      laticinios:["leite","queijo","iogurte","yogurte","manteiga","natas","creme","requeijao","ricota","mozzarella","brie","gouda","emmental","parmesao","feta","cottage","ovo","ovos","kefir"],
      carnes:["frango","peru","pato","coelho","borrego","vitela","vaca","boi","porco","carne","bife","costeleta","lombo","alheira","chourico","linguica","presunto","fiambre","bacon","toucinho","morcela","salsicha","hamburguer","bacalhau","peixe","salmon","atum","sardinha","carapau","dourada","robalo","pescada","polvo","lula","choco","camarao","gambas","lagosta","mexilhao","ameijoa"],
      padaria:["pao","bolo","broa","croissant","baguete","tostas","tosta","bolacha","biscoito","pastel","nata","queijada","muffin","brioche","pita","waffle","cereal","granola","aveia","muesli","farinha"],
      bebidas:["agua","sumo","nectar","refrigerante","coca","fanta","sprite","pepsi","limonada","cerveja","vinho","espumante","whisky","vodka","rum","gin","licor","cidra","cafe","cha","infusao","kombucha","bebida"],
      limpeza:["detergente","sabao","lixivia","desinfetante","multiusos","esponja","vassoura","mop","pano","rodo","balde","saco lixo","papel higienico","toalhas papel","guardanapo","lencos","fralda","ambientador","amaciador"],
      higiene:["shampoo","champo","gel banho","sabonete","pasta dentes","escova dentes","fio dental","desodorizante","creme","locao","hidratante","protetor solar","serum","toner","maquilhagem","batom","rimel","algodao","cotonetes","absorvente","tampao"],
      congelados:["congelado","gelado","ice cream","sorvete","nuggets","pizza congelada","lasanha congelada"],
    },
    blockedKw:[], // nothing blocked in supermarket
    defaultCat:"outro",
  },

  farmacia: {
    label:"💊 Farmácia", emoji:"💊",
    nameTriggers:["farmacia","farmácia","medicamento","remedio","saude","health"],
    categories:[
      { id:"medicamentos", label:"💊 Medicamentos",   color:"#E07A5F" },
      { id:"suplementos",  label:"🌿 Suplementos",    color:"#6EBF8B" },
      { id:"bebe",         label:"👶 Bebé",            color:"#F4C95D" },
      { id:"pensos",       label:"🩹 Pensos & Curativos", color:"#F0A7C0" },
      { id:"higiene_f",    label:"🧴 Higiene",         color:"#7EC8E3" },
      { id:"outro_f",      label:"💊 Outro",           color:"#C8C8C8" },
    ],
    kw:{
      medicamentos:["paracetamol","ibuprofeno","aspirina","amoxicilina","antibiotico","antihistaminico","antiinflamatorio","xarope","comprimido","capsula","supositorio","colírio","colirio","pomada","creme medicinal","spray nasal","descongestionante","antiácido","antiacido","laxante","antidiarreico","antiemetico","insulina","metformina","omeprazol","pantoprazol","losartan","atenolol","sinvastatina","fluoxetina","brufen","ben-u-ron","voltaren","strepsils","neo angin"],
      suplementos:["vitamina","vitamina c","vitamina d","vitamina b","magnesio","calcio","ferro","zinco","omega 3","acido folico","probiotico","colageno","proteina","melatonina","ginkgo","valeriana","equinacea","curcuma","spirulina","glutamina","creatina","multivitaminico"],
      bebe:["fralda","lencos humedos","toalhetes","creme bebe","talco","formula","leite bebe","papa","boiao","chupeta","mamilo","termometro","aspirador nasal","pomada fralda","gel gengivas"],
      pensos:["penso","pensos rapidos","ligadura","atadura","gaze","esparadrapo","algodao","adesivo","soro fisiologico","agua oxigenada","betadine","alcool","termometro","seringa","luvas","mascara"],
      higiene_f:["shampoo","champo","gel banho","sabonete","pasta dentes","escova dentes","fio dental","desodorizante","creme hidratante","protetor solar","serum","micellar","desmaquilhante","absorvente","tampao","creme maos","baton labial","lip balm"],
    },
    blockedKw:["banana","maca","pera","laranja","pao","bolo","leite","queijo","frango","carne","cerveja","vinho","detergente","lixivia","pizza"],
    defaultCat:"outro_f",
  },

  pet: {
    label:"🐾 Pet Shop", emoji:"🐾",
    nameTriggers:["pet","animal","cao","cão","gato","veterinario","vet"],
    categories:[
      { id:"alimentacao_p", label:"🥣 Alimentação",  color:"#D4A574" },
      { id:"higiene_p",     label:"🛁 Higiene",      color:"#7EC8E3" },
      { id:"saude_p",       label:"💉 Saúde",        color:"#E07A5F" },
      { id:"acessorios_p",  label:"🎾 Acessórios",   color:"#B5A9D4" },
      { id:"outro_p",       label:"🐾 Outro",        color:"#C8C8C8" },
    ],
    kw:{
      alimentacao_p:["racao","ração","comida cao","comida gato","comida peixe","comida hamster","snack animal","petisco","osso","guloseima animal","comedouro","bebedouro","agua animal"],
      higiene_p:["shampoo animal","shampoo cao","shampoo gato","escova animal","cortador unhas","limpa ouvidos","lencos animal","toalhetes animal","desodorizante animal","colonia animal"],
      saude_p:["antiparasitario","antipulgas","vermifugo","coleira antipulgas","spot on","frontline","seresto","vacina","pipeta","comprimido animal","medicamento animal"],
      acessorios_p:["trela","coleira","cama animal","cesto","gaiola","aquario","areia gato","liteira","brinquedo animal","arranhador","transportadora"],
    },
    blockedKw:["paracetamol","ibuprofeno","banana","pao","leite","cerveja","detergente","lixivia"],
    defaultCat:"outro_p",
  },

  papelaria: {
    label:"✏️ Papelaria", emoji:"✏️",
    nameTriggers:["papelaria","escola","material escolar","escritorio"],
    categories:[
      { id:"escrita",    label:"✏️ Escrita",        color:"#F4C95D" },
      { id:"papel_p",    label:"📄 Papel & Blocos",  color:"#A8D5E2" },
      { id:"organizacao",label:"📁 Organização",     color:"#B5A9D4" },
      { id:"arte",       label:"🎨 Arte",            color:"#F0A7C0" },
      { id:"outro_pp",   label:"✏️ Outro",           color:"#C8C8C8" },
    ],
    kw:{
      escrita:["caneta","lapis","lápis","marcador","marcadores","esferografica","canetas","borracha","afiadeira","corrector","tippex","marca texto","stabilo"],
      papel_p:["caderno","bloco","folhas","papel","post it","agenda","planner","calendario","separadores","ficheiro"],
      organizacao:["pasta","dossier","capa","clips","agrafes","agrafador","furador","elásticos","etiquetas","fita cola","scotch"],
      arte:["tinta","guache","aguarela","pincel","tela","cartolina","papel colorido","cola","tesoura","x-ato"],
    },
    blockedKw:["banana","pao","leite","frango","cerveja","paracetamol","racao","fralda"],
    defaultCat:"outro_pp",
  },
};

// Detect list profile from name+emoji
function getListProfile(listName="", listEmoji=""){
  const n = norm(listName);
  const e = listEmoji;
  if(e==="💊"||LIST_PROFILES.farmacia.nameTriggers.some(t=>n.includes(t))) return "farmacia";
  if(e==="🐾"||LIST_PROFILES.pet.nameTriggers.some(t=>n.includes(t))) return "pet";
  if(e==="✏️"||LIST_PROFILES.papelaria.nameTriggers.some(t=>n.includes(t))) return "papelaria";
  return "supermercado";
}

function getProfileData(profileId){ return LIST_PROFILES[profileId]||LIST_PROFILES.supermercado; }

// Detect category within a profile
function detectCatForProfile(name, profileId){
  const profile = getProfileData(profileId);
  const n=norm(name), ws=n.split(/\s+/);
  for(const [cat,kws] of Object.entries(profile.kw)){
    for(const kw of kws){
      const nk=norm(kw);
      if(n===nk||n.startsWith(nk+" ")||n.endsWith(" "+nk)||n.includes(" "+nk+" "))return cat;
      for(const w of ws)if(w===nk||(nk.length>=4&&w.startsWith(nk.slice(0,5))))return cat;
    }
  }
  return null;
}

// Validate: returns {ok, warning} — warns if product seems wrong for this list
function validateForProfile(name, profileId){
  if(profileId==="supermercado") return {ok:true, warning:null};
  const profile = getProfileData(profileId);
  const n = norm(name);
  const blocked = profile.blockedKw.find(k=>n.includes(norm(k)));
  if(blocked) return {ok:false, warning:`"${name}" não parece adequado para uma lista de ${profile.label}.`};
  return {ok:true, warning:null};
}

const AVATAR_COLORS = ["#e07a5f","#6EBF8B","#7EC8E3","#F4C95D","#B5A9D4"];

// ── Utilities ────────────────────────────────────────────────────────
function uid(){ return Math.random().toString(36).slice(2,9)+Date.now().toString(36); }
function timeAgo(ts){ const d=(Date.now()-ts)/1000; if(d<60)return"agora"; if(d<3600)return`há ${Math.floor(d/60)}m`; if(d<86400)return`há ${Math.floor(d/3600)}h`; return`há ${Math.floor(d/86400)}d`; }
function norm(s){ return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g," ").trim(); }
function fmtPrice(n){ return n!=null&&n!==""?`${parseFloat(n).toFixed(2)}€`:""; }
function fmtDate(date){ return new Date(date).toLocaleDateString("pt-PT",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}); }
function isoLocal(){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,16); }

// ── Storage ──────────────────────────────────────────────────────────
const LS = {
  get:(k)=>{ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):null; }catch{ return null; } },
  set:(k,v)=>{ try{ localStorage.setItem(k,JSON.stringify(v)); }catch{} },
  del:(k)=>{ try{ localStorage.removeItem(k); }catch{} },
};
async function cloudGet(k){ return await fbGet(k); }
async function cloudSet(k,v){ await fbSet(k,v); }

// ── Unit detection (universal) ───────────────────────────────────────
const U_KG=["carne","frango","peixe","bacalhau","salmon","queijo","fiambre","presunto","chourico","cenoura","batata","cebola","tomate","pimento","arroz","massa","acucar","farinha","cafe","sal","manteiga","racao"];
const U_L=["leite","agua","sumo","refrigerante","cerveja","vinho","azeite","vinagre","detergente","lixivia","shampoo","champo","gel","xarope"];
const U_PACK=["iogurte","manteiga","natas","bacon","fiambre","bolachas","tostas","cereais","guardanapo","lencos","fralda","penso","gaze"];
const U_CX=["cerveja","agua","sumo","ovos"];
function detectUnit(name){ const n=norm(name); if(U_CX.some(k=>n.includes(norm(k))))return"cx"; if(U_PACK.some(k=>n.includes(norm(k))))return"pack"; if(U_L.some(k=>n.includes(norm(k))))return"L"; if(U_KG.some(k=>n.includes(norm(k))))return"kg"; return"un"; }

// ── Shared styles (used by sub-components) ───────────────────────────
const IS = {
  input:{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"12px 16px", color:"#f0ebe3", fontSize:16, width:"100%", boxSizing:"border-box", fontFamily:"'DM Sans',sans-serif", WebkitAppearance:"none" },
  select:{ background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:12, padding:"12px 14px", color:"#f0ebe3", fontSize:16, width:"100%", fontFamily:"'DM Sans',sans-serif", WebkitAppearance:"none" },
  btn:(v)=>({ padding:"13px 20px", borderRadius:12, border:"none", cursor:"pointer", fontSize:15, fontWeight:500, fontFamily:"'DM Sans',sans-serif", transition:"background 0.15s", WebkitTapHighlightColor:"transparent", touchAction:"manipulation",
    ...(v==="primary"?{background:"#e07a5f",color:"#fff"}:v==="ghost"?{background:"rgba(255,255,255,0.07)",color:"#f0ebe3"}:v==="green"?{background:"#6EBF8B",color:"#fff"}:{background:"rgba(224,122,95,0.15)",color:"#e07a5f"}) }),
};

// ── NotifToast ───────────────────────────────────────────────────────
function NotifToast({ notifs, onDismiss }) {
  if (!notifs.length) return null;
  return (
    <div style={{position:"fixed",top:56,left:0,right:0,zIndex:300,display:"flex",flexDirection:"column",gap:8,alignItems:"center",pointerEvents:"none",padding:"0 16px"}}>
      {notifs.map(n=>(
        <div key={n.id} style={{background:"rgba(18,26,52,0.97)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:16,padding:"12px 16px",width:"100%",maxWidth:448,display:"flex",gap:10,alignItems:"center",boxShadow:"0 8px 32px rgba(0,0,0,0.5)",pointerEvents:"all",animation:"slideDown 0.3s ease"}}>
          <div style={{width:34,height:34,borderRadius:"50%",background:n.color||"#e07a5f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",flexShrink:0}}>{n.userName?.[0]?.toUpperCase()||"?"}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:"#f0ebe3"}}>{n.userName}</div>
            <div style={{fontSize:12,color:"rgba(240,235,227,0.55)",marginTop:1}}>{n.message}</div>
          </div>
          <button style={{background:"none",border:"none",cursor:"pointer",color:"rgba(240,235,227,0.3)",fontSize:20,padding:"4px 6px",pointerEvents:"all",WebkitTapHighlightColor:"transparent"}} onClick={()=>onDismiss(n.id)}>×</button>
        </div>
      ))}
    </div>
  );
}

// ── ReminderModal ────────────────────────────────────────────────────
function ReminderModal({ onSave, onClose }) {
  const [text,setText]     = useState("");
  const [date,setDate]     = useState(isoLocal());
  const [repeat,setRepeat] = useState("none");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#16213e",borderRadius:"24px 24px 0 0",padding:"20px 20px 40px",paddingBottom:"calc(40px + env(safe-area-inset-bottom))",width:"100%",maxWidth:480,display:"flex",flexDirection:"column",gap:14}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:"rgba(255,255,255,0.18)",borderRadius:99,margin:"0 auto 4px"}}/>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:600,color:"#f0ebe3"}}>🔔 Novo lembrete</div>
        <input style={IS.input} placeholder="O que queres lembrar?" value={text} onChange={e=>setText(e.target.value)} autoFocus/>
        <div>
          <span style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(240,235,227,0.35)",display:"block",marginBottom:6}}>Data e hora</span>
          <input style={{...IS.input,colorScheme:"dark"}} type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} min={isoLocal()}/>
        </div>
        <div>
          <span style={{fontSize:11,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"rgba(240,235,227,0.35)",display:"block",marginBottom:6}}>Repetir</span>
          <select style={IS.select} value={repeat} onChange={e=>setRepeat(e.target.value)}>
            <option value="none">Não repetir</option>
            <option value="daily">Todos os dias</option>
            <option value="weekly">Todas as semanas</option>
            <option value="monthly">Todos os meses</option>
          </select>
        </div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button style={{...IS.btn("ghost"),flex:1}} onClick={onClose}>Cancelar</button>
          <button style={{...IS.btn("primary"),flex:2}} onClick={()=>{ if(text.trim()&&date) onSave({text:text.trim(),date,repeat}); }}>🔔 Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ── EditModal ────────────────────────────────────────────────────────
function EditModal({ item, onSave, onClose }) {
  const [name,setName]   = useState(item.name);
  const [qty,setQty]     = useState(item.qty||"1");
  const [unit,setUnit]   = useState(item.unit||"un");
  const [cat,setCat]     = useState(item.category||"outro");
  const [note,setNote]   = useState(item.note||"");
  const [price,setPrice] = useState(item.price||"");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div style={{background:"#16213e",borderRadius:"24px 24px 0 0",padding:"20px 20px 40px",paddingBottom:"calc(40px + env(safe-area-inset-bottom))",width:"100%",maxWidth:480,display:"flex",flexDirection:"column",gap:14}} onClick={e=>e.stopPropagation()}>
        <div style={{width:36,height:4,background:"rgba(255,255,255,0.18)",borderRadius:99,margin:"0 auto 4px"}}/>
        <div style={{fontFamily:"'Fraunces',serif",fontSize:20,fontWeight:600,color:"#f0ebe3"}}>Editar item</div>
        <div style={{display:"flex",gap:8}}>
          <input style={{...IS.input,flex:1}} value={name} onChange={e=>setName(e.target.value)} placeholder="Nome" autoFocus/>
          <input style={{...IS.input,width:60,textAlign:"center",padding:"12px 6px"}} value={qty} onChange={e=>setQty(e.target.value)} type="number" min="1"/>
          <select style={{...IS.select,width:76,padding:"12px 6px"}} value={unit} onChange={e=>setUnit(e.target.value)}>
            {["un","kg","g","L","mL","pack","cx"].map(u=><option key={u}>{u}</option>)}
          </select>
        </div>
        <select style={IS.select} value={cat} onChange={e=>setCat(e.target.value)}>
          {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <div style={{display:"flex",gap:8}}>
          <input style={{...IS.input,flex:1}} value={note} onChange={e=>setNote(e.target.value)} placeholder="Nota (opcional)"/>
          <div style={{position:"relative",flexShrink:0}}>
            <input style={{...IS.input,width:96,paddingRight:22}} value={price} onChange={e=>setPrice(e.target.value)} type="number" min="0" step="0.01" placeholder="Preço"/>
            <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"rgba(240,235,227,0.4)"}}>€</span>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button style={{...IS.btn("ghost"),flex:1}} onClick={onClose}>Cancelar</button>
          <button style={{...IS.btn("primary"),flex:2}} onClick={()=>onSave({...item,name,qty,unit,category:cat,note,price})}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ── SwipeItem ────────────────────────────────────────────────────────
function SwipeItem({ children, onDelete }) {
  const startX = useRef(null);
  const [offset,setOffset] = useState(0);
  const [gone,setGone]     = useState(false);
  function onStart(cx){ startX.current=cx; }
  function onMove(cx){ if(startX.current===null)return; const dx=cx-startX.current; if(dx<0)setOffset(Math.max(dx,-88)); }
  function onEnd(){ if(offset<-60){setGone(true);setTimeout(onDelete,260);}else setOffset(0); startX.current=null; }
  return (
    <div style={{position:"relative",overflow:"hidden",borderRadius:16}}>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:80,background:"#c0392b",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:16,fontSize:18}}>🗑</div>
      <div style={{transform:`translateX(${gone?-120:offset}px)`,transition:startX.current!==null?"none":"transform 0.22s ease",willChange:"transform",touchAction:"pan-y"}}
        onTouchStart={e=>onStart(e.touches[0].clientX)}
        onTouchMove={e=>onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
        onMouseDown={e=>onStart(e.clientX)}
        onMouseMove={e=>{ if(startX.current!==null)onMove(e.clientX); }}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
      >{children}</div>
    </div>
  );
}

// ── Main styles ───────────────────────────────────────────────────────
const S = {
  app:{ minHeight:"100dvh", background:"linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", fontFamily:"'DM Sans',sans-serif", color:"#f0ebe3", position:"relative" },
  grain:{ position:"fixed",inset:0,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,pointerEvents:"none",zIndex:0 },
  page:{ position:"relative",zIndex:1,maxWidth:480,margin:"0 auto",paddingBottom:"calc(80px + env(safe-area-inset-bottom))" },
  card:{ background:"rgba(255,255,255,0.05)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24 },
  avatar:(c)=>({ width:38,height:38,borderRadius:"50%",background:c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"#fff",flexShrink:0,WebkitTapHighlightColor:"transparent",touchAction:"manipulation" }),
  tag:(c)=>({ background:c+"22",color:c,borderRadius:6,padding:"2px 7px",fontSize:11,fontWeight:600 }),
  itemRow:(done)=>({ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:16,background:done?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.06)",border:"1px solid",borderColor:done?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.1)",opacity:done?0.5:1,transition:"opacity 0.2s" }),
  check:(done,c)=>({ width:28,height:28,borderRadius:8,border:`2px solid ${done?c:"rgba(255,255,255,0.2)"}`,background:done?c:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,WebkitTapHighlightColor:"transparent",touchAction:"manipulation",transition:"all 0.15s" }),
  syncDot:(s)=>({ width:8,height:8,borderRadius:"50%",background:s?"#F4C95D":"#6EBF8B",display:"inline-block",marginRight:6,animation:s?"pulse 1s infinite":"none" }),
  bottomBar:{ position:"fixed",bottom:0,left:0,right:0,background:"rgba(13,18,46,0.97)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderTop:"1px solid rgba(255,255,255,0.08)",padding:"12px 16px",paddingBottom:"calc(12px + env(safe-area-inset-bottom))",zIndex:100 },
};

// ════════════════════════════════════════════════════════════════════
export default function App() {
  const [user,setUser]             = useState(null);
  const [loginName,setLoginName]   = useState("");
  const [booting,setBooting]       = useState(true);

  const [lists,setLists]           = useState({});
  const [activeListId,setActiveListId] = useState(null);
  const [onlineUsers,setOnlineUsers]   = useState({});
  const [syncing,setSyncing]       = useState(false);
  const [lastSync,setLastSync]     = useState(0);
  const lastTsRef                  = useRef(0);
  const [history,setHistory]       = useState([]);

  const [tab,setTab]               = useState("lista");
  const [groupByCat,setGroupByCat] = useState(true);
  const [shopMode,setShopMode]     = useState(false);
  const [showDetail,setShowDetail] = useState(false);
  const [showDone,setShowDone]     = useState(false);
  const [editItem,setEditItem]     = useState(null);
  const [showListMgr,setShowListMgr] = useState(false);
  const [newListName,setNewListName] = useState("");
  const [newListEmoji,setNewListEmoji] = useState("🛒");

  const [quick,setQuick]           = useState("");
  const [suggestions,setSugg]      = useState([]);
  const quickRef                   = useRef(null);

  const [dName,setDName]=useState(""); const [dQty,setDQty]=useState("1");
  const [dUnit,setDUnit]=useState("un"); const [dCat,setDCat]=useState("outro");
  const [dNote,setDNote]=useState(""); const [dPrice,setDPrice]=useState("");
  const [dAI,setDAI]=useState(null); const [dOver,setDOver]=useState(false);
  const [detecting,setDet]=useState(false);
  const debRef=useRef(null);

  const [toasts,setToasts]               = useState([]);
  const [reminders,setReminders]         = useState([]);
  const [showReminderForm,setShowReminderForm] = useState(false);
  const seenNotifsRef                    = useRef(new Set());
  const [warnMsg,setWarnMsg]             = useState(null);
  const [warnFor,setWarnFor]             = useState("");

  // ── Boot ───────────────────────────────────────────────────────────
  useEffect(()=>{
    const saved=LS.get(PROFILE_KEY);
    if(saved?.id&&saved?.name) setUser(saved);
    setBooting(false);
  },[]);

  // ── Suggestions ────────────────────────────────────────────────────
  useEffect(()=>{
    if(!quick.trim()){setSugg([]);return;}
    const n=norm(quick);
    setSugg(history.filter(h=>norm(h.name).includes(n)).sort((a,b)=>b.count-a.count).slice(0,4));
  },[quick,history]);

  // ── AI debounce for detail form ────────────────────────────────────
  useEffect(()=>{
    if(dOver)return;
    if(debRef.current)clearTimeout(debRef.current);
    if(!dName.trim()||dName.length<2){setDAI(null);return;}
    setDet(true);
    debRef.current=setTimeout(()=>{
      const al=lists[activeListId];
      const pid=getListProfile(al?.name,al?.emoji);
      const prof=getProfileData(pid);
      const catMap=Object.fromEntries(prof.categories.map(c=>[c.id,c]));
      const c=detectCatForProfile(dName,pid),u=detectUnit(dName);
      setDet(false);
      if(c&&!dOver){setDAI(catMap[c]||null);setDCat(c);}
      setDUnit(u);
    },400);
    return()=>clearTimeout(debRef.current);
  },[dName,dOver,lists,activeListId]);

  useEffect(()=>{
    if(!showDetail){
      const al=lists[activeListId];
      const pid=getListProfile(al?.name,al?.emoji);
      setDName("");setDQty("1");setDUnit("un");setDCat(getProfileData(pid).defaultCat);setDNote("");setDPrice("");setDAI(null);setDOver(false);
    }
  },[showDetail,lists,activeListId]);

  // ── Cloud poll ─────────────────────────────────────────────────────
  const poll=useCallback(async()=>{
    if(!user)return;
    try{
      const data=await cloudGet(LISTS_KEY);
      if(data?.lastUpdate>lastTsRef.current){
        lastTsRef.current=data.lastUpdate;
        setLists(data.lists||{});
        setLastSync(Date.now());
        if(!activeListId&&data.lists){
          const ids=Object.keys(data.lists);
          if(ids.length>0)setActiveListId(ids[0]);
        }
      }
      const u=await cloudGet(USERS_KEY); if(u)setOnlineUsers(u);
      const h=await cloudGet(HISTORY_KEY); if(h)setHistory(h);

      // Notifications from other users
      const notifData=await cloudGet(NOTIFS_KEY);
      if(notifData?.events){
        const newOnes=notifData.events.filter(e=>
          e.userId!==user.id &&
          !seenNotifsRef.current.has(e.id) &&
          Date.now()-e.ts<30000
        );
        if(newOnes.length>0){
          newOnes.forEach(e=>seenNotifsRef.current.add(e.id));
          setToasts(prev=>[...prev,...newOnes].slice(-3));
          newOnes.forEach(e=>setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==e.id)),5000));
        }
      }

      // Reminders (personal, stored per user)
      const rems=await cloudGet(REMINDERS_KEY+"-"+user.id);
      if(rems) setReminders(rems);
    }catch(e){}
  },[user,activeListId]);

  useEffect(()=>{
    if(!user)return;
    poll();
    // Real-time listeners for instant sync
    const unsubLists = fbListen(LISTS_KEY, (val)=>{
      if(!val) return;
      try{
        const data = typeof val==="string" ? JSON.parse(val) : val;
        if(data?.lastUpdate>lastTsRef.current){
          lastTsRef.current=data.lastUpdate;
          setLists(data.lists||{});
          setLastSync(Date.now());
          if(!activeListId&&data.lists){ const ids=Object.keys(data.lists); if(ids.length>0)setActiveListId(ids[0]); }
        }
      }catch(e){}
    });
    const unsubUsers = fbListen(USERS_KEY, (val)=>{ if(val){ try{ setOnlineUsers(typeof val==="string"?JSON.parse(val):val); }catch{} } });
    const unsubNotifs = fbListen(NOTIFS_KEY, (val)=>{
      if(!val) return;
      try{
        const data = typeof val==="string" ? JSON.parse(val) : val;
        if(data?.events){
          const newOnes=data.events.filter(e=>e.userId!==user.id&&!seenNotifsRef.current.has(e.id)&&Date.now()-e.ts<30000);
          if(newOnes.length>0){
            newOnes.forEach(e=>seenNotifsRef.current.add(e.id));
            setToasts(prev=>[...prev,...newOnes].slice(-3));
            newOnes.forEach(e=>setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==e.id)),5000));
          }
        }
      }catch(e){}
    });
    return()=>{ unsubLists(); unsubUsers(); unsubNotifs(); };
  },[user]);

  // Fire due reminders (check every 30s)
  useEffect(()=>{
    if(!user)return;
    const check=setInterval(()=>{
      const now=Date.now();
      setReminders(prev=>{
        const fired=prev.filter(r=>!r.done&&new Date(r.date).getTime()<=now);
        if(!fired.length)return prev;
        fired.forEach(r=>{
          const t={id:uid(),userId:user.id,userName:"🔔 Lembrete",color:"#F4C95D",message:r.text};
          setToasts(p=>[...p,t]);
          setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==t.id)),8000);
        });
        const updated=prev.map(r=>{
          if(!r.done&&new Date(r.date).getTime()<=now){
            if(r.repeat==="daily") return{...r,date:new Date(new Date(r.date).getTime()+86400000).toISOString().slice(0,16)};
            if(r.repeat==="weekly") return{...r,date:new Date(new Date(r.date).getTime()+604800000).toISOString().slice(0,16)};
            if(r.repeat==="monthly"){const d=new Date(r.date);d.setMonth(d.getMonth()+1);return{...r,date:d.toISOString().slice(0,16)};}
            return{...r,done:true};
          }
          return r;
        });
        cloudSet(REMINDERS_KEY+"-"+user.id,updated);
        return updated;
      });
    },30000);
    return()=>clearInterval(check);
  },[user]);

  // Heartbeat
  useEffect(()=>{
    if(!user)return;
    const beat=async()=>{ const u=(await cloudGet(USERS_KEY))||{}; u[user.id]={name:user.name,color:user.color,lastSeen:Date.now()}; await cloudSet(USERS_KEY,u); };
    beat(); const t=setInterval(beat,15000); return()=>clearInterval(t);
  },[user]);

  // ── Auth ───────────────────────────────────────────────────────────
  function handleLogin(){
    if(!loginName.trim())return;
    const id=uid(),color=AVATAR_COLORS[Math.floor(Math.random()*AVATAR_COLORS.length)];
    const u={id,name:loginName.trim(),color};
    LS.set(PROFILE_KEY,u); setUser(u);
  }
  function handleLogout(){ LS.del(PROFILE_KEY); setUser(null); setLoginName(""); }

  // ── List CRUD ──────────────────────────────────────────────────────
  async function persistLists(nl){
    setSyncing(true); const ts=Date.now(); lastTsRef.current=ts;
    await cloudSet(LISTS_KEY,{lists:nl,lastUpdate:ts});
    setLists(nl); setSyncing(false); setLastSync(Date.now());
  }
  async function createList(){
    if(!newListName.trim())return;
    const id=uid();
    const nl={...lists,[id]:{id,name:newListName.trim(),emoji:newListEmoji,items:[],createdAt:Date.now()}};
    await persistLists(nl);
    setActiveListId(id); setNewListName(""); setNewListEmoji("🛒"); setShowListMgr(false);
  }
  async function deleteList(id){
    if(Object.keys(lists).length<=1)return;
    const nl={...lists}; delete nl[id];
    await persistLists(nl); setActiveListId(Object.keys(nl)[0]);
  }

  // ── Item CRUD ──────────────────────────────────────────────────────
  const getItems=()=>lists[activeListId]?.items||[];

  // ── All derived values ─────────────────────────────────────────────
  const activeList   = lists[activeListId];
  const hasLists     = Object.keys(lists).length>0;
  const profileId    = getListProfile(activeList?.name, activeList?.emoji);
  const profile      = getProfileData(profileId);
  const CATEGORIES   = profile.categories;
  const CAT          = Object.fromEntries(CATEGORIES.map(c=>[c.id,c]));
  const CAT_ORDER    = CATEGORIES.map(c=>c.id);
  const defaultCatId = profile.defaultCat;
  const items    = getItems();
  const pending  = items.filter(i=>!i.done);
  const done     = items.filter(i=>i.done);
  const pct      = items.length?Math.round(done.length/items.length*100):0;
  const online   = Object.entries(onlineUsers).filter(([,u])=>Date.now()-u.lastSeen<30000);
  const frequent = [...history].sort((a,b)=>b.count-a.count).slice(0,12);
  const totalEst = items.filter(i=>!i.done&&i.price).reduce((s,i)=>s+parseFloat(i.price||0)*parseFloat(i.qty||1),0);
  const doneEst  = items.filter(i=>i.done&&i.price).reduce((s,i)=>s+parseFloat(i.price||0)*parseFloat(i.qty||1),0);
  const grouped  = CAT_ORDER.map(cid=>({cat:CAT[cid],items:pending.filter(i=>(i.category||defaultCatId)===cid)})).filter(g=>g.items.length>0);

  async function persistItems(ni){
    if(!activeListId)return;
    await persistLists({...lists,[activeListId]:{...lists[activeListId],items:ni}});
  }
  async function pushNotif(message){
    const ev={id:uid(),userId:user.id,userName:user.name,color:user.color,message,ts:Date.now()};
    const data=(await cloudGet(NOTIFS_KEY))||{events:[]};
    data.events=[...data.events.filter(e=>Date.now()-e.ts<60000),ev].slice(-20);
    await cloudSet(NOTIFS_KEY,data);
  }
  async function recordHistory(name,cat,unit){
    const h=(await cloudGet(HISTORY_KEY))||[];
    const ex=h.find(x=>norm(x.name)===norm(name));
    const updated=ex?h.map(x=>norm(x.name)===norm(name)?{...x,count:x.count+1,cat,unit}:x):[...h,{name,cat,unit,count:1}];
    const trimmed=updated.sort((a,b)=>b.count-a.count).slice(0,60);
    await cloudSet(HISTORY_KEY,trimmed); setHistory(trimmed);
  }
  async function quickAdd(nameOverride){
    const name=(nameOverride||quick).trim(); if(!name)return;
    const al=lists[activeListId];
    const profileId=getListProfile(al?.name,al?.emoji);
    const {ok,warning}=validateForProfile(name,profileId);
    if(!ok){ setWarnMsg(warning); setWarnFor(name); setQuick(""); return; }
    const cat=detectCatForProfile(name,profileId)||getProfileData(profileId).defaultCat;
    const unit=detectUnit(name);
    const item={id:uid(),name,qty:"1",unit,category:cat,note:"",price:"",done:false,addedBy:user.id,addedByName:user.name,addedAt:Date.now(),aiCat:true};
    await persistItems([...getItems(),item]);
    await recordHistory(name,cat,unit);
    await pushNotif(`adicionou "${name}" à lista`);
    setQuick(""); setSugg([]); quickRef.current?.focus();
  }
  async function detailAdd(){
    if(!dName.trim())return;
    const al=lists[activeListId];
    const profileId=getListProfile(al?.name,al?.emoji);
    const {ok,warning}=validateForProfile(dName.trim(),profileId);
    if(!ok){ setWarnMsg(warning); setWarnFor(dName.trim()); return; }
    const item={id:uid(),name:dName.trim(),qty:dQty||"1",unit:dUnit,category:dCat,note:dNote.trim(),price:dPrice,done:false,addedBy:user.id,addedByName:user.name,addedAt:Date.now(),aiCat:!!dAI&&!dOver};
    await persistItems([...getItems(),item]);
    await recordHistory(dName.trim(),dCat,dUnit);
    await pushNotif(`adicionou "${dName.trim()}" à lista`);
    setShowDetail(false);
  }
  async function saveEdit(updated){ await persistItems(getItems().map(i=>i.id===updated.id?updated:i)); setEditItem(null); }
  async function toggleDone(id){ await persistItems(getItems().map(i=>i.id===id?{...i,done:!i.done,doneAt:Date.now(),doneBy:user.name}:i)); }
  async function removeItem(id){ await persistItems(getItems().filter(i=>i.id!==id)); }
  async function clearDone(){ await persistItems(getItems().filter(i=>!i.done)); }

  // ── Reminders ─────────────────────────────────────────────────────
  async function saveReminder({text,date,repeat}){
    const r={id:uid(),text,date,repeat,done:false,createdAt:Date.now()};
    const updated=[...reminders,r];
    setReminders(updated); await cloudSet(REMINDERS_KEY+"-"+user.id,updated);
    setShowReminderForm(false);
  }
  async function deleteReminder(id){
    const updated=reminders.filter(r=>r.id!==id);
    setReminders(updated); await cloudSet(REMINDERS_KEY+"-"+user.id,updated);
  }

  // ── Derived ────────────────────────────────────────────────────────

  const activeReminders = reminders.filter(r=>!r.done);

  // ── Loading ────────────────────────────────────────────────────────
  if(booting) return(
    <div style={{...S.app,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <link rel="stylesheet" href={FONT_URL}/>
      <div style={{textAlign:"center",color:"rgba(240,235,227,0.3)"}}><div style={{fontSize:44,marginBottom:10}}>🛒</div><div style={{fontSize:14}}>A carregar…</div></div>
    </div>
  );

  // ── Login ──────────────────────────────────────────────────────────
  if(!user) return(
    <div style={S.app}>
      <link rel="stylesheet" href={FONT_URL}/>
      <style>{`*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}input::placeholder{color:rgba(240,235,227,0.3)}select option{background:#1a1a2e}`}</style>
      <div style={S.grain}/>
      <div style={{minHeight:"100dvh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 20px",position:"relative",zIndex:1}}>
        <div style={{...S.card,padding:"40px 24px",width:"100%",maxWidth:380,display:"flex",flexDirection:"column",gap:18}}>
          <p style={{fontSize:52,margin:0,textAlign:"center"}}>🛒</p>
          <h1 style={{fontFamily:"'Fraunces',serif",fontSize:32,fontWeight:600,lineHeight:1.1,color:"#f0ebe3",margin:0,textAlign:"center"}}>Lista de<br/>Compras</h1>
          <p style={{fontSize:14,color:"rgba(240,235,227,0.45)",textAlign:"center",margin:0}}>O teu nome fica guardado neste dispositivo</p>
          <input style={IS.input} placeholder="O teu nome" value={loginName} onChange={e=>setLoginName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          <button style={{...IS.btn("primary"),width:"100%",padding:"15px 20px"}} onClick={handleLogin}>Entrar →</button>
        </div>
      </div>
    </div>
  );

  // ── App ────────────────────────────────────────────────────────────
  return(
    <div style={S.app}>
      <link rel="stylesheet" href={FONT_URL}/>
      <style>{`
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
        input,select,textarea{outline:none;font-size:16px}
        input::placeholder,textarea::placeholder{color:rgba(240,235,227,0.3)}
        ::-webkit-scrollbar{display:none}
        body{overscroll-behavior-y:none}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .enter{animation:slideUp 0.2s ease forwards}
        select option{background:#1a1a2e;color:#f0ebe3}
      `}</style>
      <div style={S.grain}/>

      <NotifToast notifs={toasts} onDismiss={id=>setToasts(p=>p.filter(t=>t.id!==id))}/>
      {warnMsg&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:250,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setWarnMsg(null)}>
          <div style={{background:"#16213e",borderRadius:"24px 24px 0 0",padding:"24px 20px 40px",paddingBottom:"calc(40px + env(safe-area-inset-bottom))",width:"100%",maxWidth:480,display:"flex",flexDirection:"column",gap:14}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:40,textAlign:"center"}}>⚠️</div>
            <div style={{fontFamily:"'Fraunces',serif",fontSize:18,fontWeight:600,color:"#f0ebe3",textAlign:"center"}}>Produto fora do contexto</div>
            <div style={{fontSize:14,color:"rgba(240,235,227,0.6)",textAlign:"center",lineHeight:1.5}}>{warnMsg}</div>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button style={{...IS.btn("ghost"),flex:1}} onClick={()=>setWarnMsg(null)}>Cancelar</button>
              <button style={{...IS.btn("primary"),flex:2}} onClick={async()=>{
                setWarnMsg(null);
                const al2=lists[activeListId]; const profileId2=getListProfile(al2?.name,al2?.emoji);
                const cat=getProfileData(profileId2).defaultCat;
                const unit=detectUnit(warnFor);
                const item={id:uid(),name:warnFor,qty:"1",unit,category:cat,note:"",price:"",done:false,addedBy:user.id,addedByName:user.name,addedAt:Date.now(),aiCat:false};
                await persistItems([...getItems(),item]);
                await recordHistory(warnFor,cat,unit);
                await pushNotif(`adicionou "${warnFor}" à lista`);
                setQuick(""); setSugg([]);
              }}>Adicionar mesmo assim</button>
            </div>
          </div>
        </div>
      )}
      {editItem&&<EditModal item={editItem} onSave={saveEdit} onClose={()=>setEditItem(null)}/>}
      {showReminderForm&&<ReminderModal onSave={saveReminder} onClose={()=>setShowReminderForm(false)}/>}

      <div style={S.page}>

        {/* Header */}
        <div style={{padding:"20px 20px 0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
          <div style={{flex:1,minWidth:0}}>
            <h1 style={{fontFamily:"'Fraunces',serif",fontSize:24,fontWeight:600,margin:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {shopMode?"🧺 Modo Compras":activeList?`${activeList.emoji} ${activeList.name}`:"Compras 🛒"}
            </h1>
            <div style={{fontSize:11,color:"rgba(240,235,227,0.35)",marginTop:3,display:"flex",alignItems:"center",gap:5}}>
              <span style={S.syncDot(syncing)}/>{syncing?"a sincronizar":lastSync?`sync ${timeAgo(lastSync)}`:"pronto"}
              {online.length>0&&<span>· {online.length} online</span>}
              {activeList&&<span style={{marginLeft:2,background:"rgba(255,255,255,0.07)",borderRadius:6,padding:"1px 6px"}}>{profile.label}</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
            <button style={{...IS.btn(shopMode?"green":"ghost"),padding:"9px 13px",fontSize:13}} onClick={()=>setShopMode(!shopMode)}>
              {shopMode?"✓ Sair":"🧺"}
            </button>
            <button style={{...IS.btn("ghost"),padding:"9px 13px",fontSize:13}} onClick={()=>setGroupByCat(!groupByCat)}>
              {groupByCat?"☰":"⊞"}
            </button>
            <div style={{...S.avatar(user.color),cursor:"pointer"}} onClick={handleLogout}>{user.name[0].toUpperCase()}</div>
          </div>
        </div>

        {/* List tabs */}
        <div style={{display:"flex",gap:7,padding:"12px 20px 0",overflowX:"auto",alignItems:"center"}}>
          {Object.values(lists).map(l=>(
            <button key={l.id} style={{padding:"8px 14px",borderRadius:99,border:"1px solid",borderColor:activeListId===l.id?"#e07a5f":"rgba(255,255,255,0.12)",background:activeListId===l.id?"rgba(224,122,95,0.18)":"transparent",color:activeListId===l.id?"#e07a5f":"rgba(240,235,227,0.5)",fontSize:14,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif",display:"flex",alignItems:"center",gap:5,touchAction:"manipulation",WebkitTapHighlightColor:"transparent"}}
              onClick={()=>{setActiveListId(l.id);setTab("lista");}}>
              {l.emoji} {l.name}
              {activeListId===l.id&&Object.keys(lists).length>1&&(
                <span style={{opacity:0.4,fontSize:14,marginLeft:1}} onClick={e=>{e.stopPropagation();deleteList(l.id);}}>×</span>
              )}
            </button>
          ))}
          <button style={{padding:"8px 14px",borderRadius:99,border:"1px dashed rgba(255,255,255,0.2)",background:"transparent",color:"rgba(240,235,227,0.4)",fontSize:14,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"'DM Sans',sans-serif",touchAction:"manipulation"}} onClick={()=>setShowListMgr(!showListMgr)}>
            + Nova
          </button>
        </div>

        {/* New list form */}
        {showListMgr&&(
          <div style={{margin:"10px 20px 0",...S.card,padding:14,display:"flex",gap:8,alignItems:"center"}} className="enter">
            <input style={{...IS.input,width:48,textAlign:"center",padding:"10px 4px",fontSize:22}} value={newListEmoji} onChange={e=>setNewListEmoji(e.target.value)} maxLength={2}/>
            <input style={{...IS.input,flex:1,padding:"10px 14px"}} placeholder="Nome da lista" value={newListName} onChange={e=>setNewListName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createList()} autoFocus/>
            <button style={{...IS.btn("primary"),padding:"10px 18px",flexShrink:0}} onClick={createList}>+</button>
          </div>
        )}

        {/* Nav tabs */}
        <div style={{display:"flex",gap:8,padding:"12px 20px 0"}}>
          {[["lista","📋 Lista"],["historico","🕐 Histórico"],["lembretes","🔔 Lembretes"]].map(([t,label])=>(
            <button key={t} style={{...IS.btn(tab===t?"primary":"ghost"),padding:"9px 16px",fontSize:13,position:"relative"}} onClick={()=>setTab(t)}>
              {label}
              {t==="lembretes"&&activeReminders.length>0&&(
                <span style={{position:"absolute",top:-4,right:-4,background:"#e07a5f",color:"#fff",borderRadius:99,fontSize:10,fontWeight:700,padding:"1px 5px",minWidth:16,textAlign:"center",pointerEvents:"none"}}>{activeReminders.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Progress + estimate */}
        {hasLists&&items.length>0&&(
          <div style={{padding:"12px 20px 0"}}>
            <div style={{height:4,borderRadius:99,background:`linear-gradient(90deg,#6EBF8B ${pct}%,rgba(255,255,255,0.08) ${pct}%)`,transition:"background 0.4s"}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
              <span style={{fontSize:11,color:"rgba(240,235,227,0.35)"}}>{done.length}/{items.length} comprados</span>
              {totalEst>0&&<span style={{fontSize:11,color:"rgba(240,235,227,0.35)"}}>
                est. {totalEst.toFixed(2)}€{doneEst>0&&<span style={{color:"#6EBF8B"}}> · {doneEst.toFixed(2)}€ ✓</span>}
              </span>}
            </div>
          </div>
        )}

        {/* ══ LISTA ══ */}
        {tab==="lista"&&(<>
          {/* Detail form */}
          {showDetail&&(
            <div style={{margin:"12px 20px 0",...S.card,padding:18,display:"flex",flexDirection:"column",gap:12}} className="enter">
              <div style={{fontSize:12,color:"rgba(240,235,227,0.35)"}}>Adicionar com detalhes</div>
              <div style={{display:"flex",gap:8}}>
                <div style={{position:"relative",flex:1}}>
                  <input style={{...IS.input,paddingRight:30}} placeholder="Nome *" value={dName} onChange={e=>{setDName(e.target.value);setDOver(false);setDAI(null);}} autoFocus/>
                  <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:13,opacity:0.4}}>
                    {detecting?<span style={{display:"inline-block",animation:"spin 0.8s linear infinite"}}>⟳</span>:dName.length>1?"✦":""}
                  </span>
                </div>
                <input style={{...IS.input,width:60,textAlign:"center",padding:"12px 6px"}} placeholder="1" value={dQty} onChange={e=>setDQty(e.target.value)} type="number" min="1"/>
                <select style={{...IS.select,width:76,padding:"12px 6px"}} value={dUnit} onChange={e=>setDUnit(e.target.value)}>
                  {["un","kg","g","L","mL","pack","cx"].map(u=><option key={u}>{u}</option>)}
                </select>
              </div>
              {(detecting||dAI)&&(
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:11,color:"rgba(240,235,227,0.35)"}}>✦ IA:</span>
                  {detecting?<span style={{fontSize:12,color:"rgba(240,235,227,0.3)"}}>A identificar…</span>
                    :<span style={{background:dAI.color+"22",border:`1px solid ${dAI.color}44`,color:dAI.color,borderRadius:99,padding:"3px 10px",fontSize:12}}>{dAI.label}</span>}
                </div>
              )}
              <select style={{...IS.select,borderColor:dAI&&!dOver?dAI.color+"66":"rgba(255,255,255,0.12)",color:dAI&&!dOver?dAI.color:"#f0ebe3"}} value={dCat} onChange={e=>{setDCat(e.target.value);setDOver(true);setDAI(null);}}>
                {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
              <div style={{display:"flex",gap:8}}>
                <input style={{...IS.input,flex:1}} placeholder="Nota (opcional)" value={dNote} onChange={e=>setDNote(e.target.value)}/>
                <div style={{position:"relative",flexShrink:0}}>
                  <input style={{...IS.input,width:96,paddingRight:22}} placeholder="Preço" value={dPrice} onChange={e=>setDPrice(e.target.value)} type="number" min="0" step="0.01"/>
                  <span style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"rgba(240,235,227,0.4)"}}>€</span>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button style={{...IS.btn("ghost"),flex:1}} onClick={()=>setShowDetail(false)}>Cancelar</button>
                <button style={{...IS.btn("primary"),flex:2}} onClick={detailAdd}>Adicionar</button>
              </div>
            </div>
          )}

          {!hasLists&&(
            <div style={{textAlign:"center",padding:"60px 20px",color:"rgba(240,235,227,0.3)"}}>
              <div style={{fontSize:40,marginBottom:12}}>📋</div>
              <div style={{fontSize:14}}>Cria a tua primeira lista acima</div>
            </div>
          )}

          <div style={{padding:"12px 20px 0",display:"flex",flexDirection:"column",gap:groupByCat?0:7}}>
            {pending.length===0&&hasLists&&!showDetail&&(
              <div style={{textAlign:"center",padding:"40px 0",color:"rgba(240,235,227,0.2)",fontSize:14}}>Lista vazia</div>
            )}
            {groupByCat ? grouped.map(({cat,items:gi})=>(
              <div key={cat.id} style={{marginBottom:16}}>
                <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:cat.color,padding:"0 2px 8px",display:"flex",alignItems:"center",gap:6}}>
                  {cat.label.split(" ")[0]} {cat.label.split(" ").slice(1).join(" ")}
                  <span style={{background:cat.color+"22",color:cat.color,borderRadius:99,padding:"1px 7px",fontSize:10}}>{gi.length}</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7}}>
                  {gi.map(item=>(
                    <SwipeItem key={item.id} onDelete={()=>removeItem(item.id)}>
                      <div style={S.itemRow(false)} onClick={()=>!shopMode&&setEditItem(item)}>
                        <div style={S.check(false,cat.color)} onClick={e=>{e.stopPropagation();toggleDone(item.id);}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:500,fontSize:15,color:"#f0ebe3"}}>
                            {item.name}
                            <span style={{fontWeight:400,fontSize:13,color:"rgba(240,235,227,0.4)",marginLeft:7}}>{item.qty||"1"} {item.unit||"un"}</span>
                            {item.price&&<span style={{fontWeight:400,fontSize:12,color:"#6EBF8B",marginLeft:6}}>{fmtPrice(parseFloat(item.price||0)*parseFloat(item.qty||1))}</span>}
                          </div>
                          {!shopMode&&item.note&&<div style={{fontSize:12,color:"rgba(240,235,227,0.35)",marginTop:2}}>{item.note}</div>}
                        </div>
                        {!shopMode&&<span style={{fontSize:13,color:"rgba(240,235,227,0.2)",flexShrink:0}}>✎</span>}
                      </div>
                    </SwipeItem>
                  ))}
                </div>
              </div>
            )) : pending.map(item=>{
              const cat=CAT[item.category]||CAT["outro"];
              return(
                <SwipeItem key={item.id} onDelete={()=>removeItem(item.id)}>
                  <div style={S.itemRow(false)} onClick={()=>!shopMode&&setEditItem(item)}>
                    <div style={S.check(false,cat.color)} onClick={e=>{e.stopPropagation();toggleDone(item.id);}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:500,fontSize:15,color:"#f0ebe3"}}>
                        {item.name}
                        <span style={{fontWeight:400,fontSize:13,color:"rgba(240,235,227,0.4)",marginLeft:7}}>{item.qty||"1"} {item.unit||"un"}</span>
                        {item.price&&<span style={{fontWeight:400,fontSize:12,color:"#6EBF8B",marginLeft:6}}>{fmtPrice(parseFloat(item.price||0)*parseFloat(item.qty||1))}</span>}
                      </div>
                      {!shopMode&&(
                        <div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                          <span style={S.tag(cat.color)}>{cat.label.split(" ").slice(1).join(" ")}</span>
                          {item.note&&<span style={{fontSize:11,color:"rgba(240,235,227,0.35)"}}>· {item.note}</span>}
                          <span style={{fontSize:11,color:"rgba(240,235,227,0.25)"}}>{item.addedByName} · {timeAgo(item.addedAt)}</span>
                        </div>
                      )}
                    </div>
                    {!shopMode&&<span style={{fontSize:13,color:"rgba(240,235,227,0.2)",flexShrink:0}}>✎</span>}
                  </div>
                </SwipeItem>
              );
            })}
          </div>

          {/* Done section */}
          {done.length>0&&(
            <div style={{padding:"0 20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 0 8px"}}>
                <button style={{background:"none",border:"none",cursor:"pointer",fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,235,227,0.3)",fontFamily:"'DM Sans',sans-serif",touchAction:"manipulation",WebkitTapHighlightColor:"transparent"}} onClick={()=>setShowDone(!showDone)}>
                  {showDone?"▾":"▸"} Comprados ({done.length})
                </button>
                <button style={{...IS.btn("accent"),fontSize:11,padding:"5px 13px"}} onClick={clearDone}>Limpar</button>
              </div>
              {showDone&&done.map(item=>{
                const cat=CAT[item.category]||CAT["outro"];
                return(
                  <div key={item.id} style={{...S.itemRow(true),marginBottom:7}}>
                    <div style={S.check(true,cat.color)} onClick={()=>toggleDone(item.id)}><span style={{color:"#fff",fontSize:13,fontWeight:700}}>✓</span></div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:500,fontSize:14,textDecoration:"line-through",color:"rgba(240,235,227,0.35)"}}>
                        {item.name}<span style={{fontWeight:400,fontSize:12,marginLeft:7}}>{item.qty} {item.unit}</span>
                        {item.price&&<span style={{fontSize:12,color:"rgba(110,191,139,0.4)",marginLeft:6}}>{fmtPrice(parseFloat(item.price||0)*parseFloat(item.qty||1))}</span>}
                      </div>
                      {item.doneBy&&<div style={{fontSize:11,color:"rgba(240,235,227,0.2)",marginTop:2}}>por {item.doneBy}</div>}
                    </div>
                    <button style={{background:"none",border:"none",cursor:"pointer",color:"rgba(240,235,227,0.15)",fontSize:20,padding:"0 4px",WebkitTapHighlightColor:"transparent"}} onClick={()=>removeItem(item.id)}>×</button>
                  </div>
                );
              })}
            </div>
          )}
        </>)}

        {/* ══ LEMBRETES ══ */}
        {tab==="lembretes"&&(
          <div style={{padding:"16px 20px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <p style={{fontSize:13,color:"rgba(240,235,227,0.35)",margin:0}}>Os teus lembretes pessoais.</p>
              <button style={{...IS.btn("primary"),padding:"9px 16px",fontSize:13}} onClick={()=>setShowReminderForm(true)}>+ Novo</button>
            </div>
            {activeReminders.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(240,235,227,0.2)",fontSize:14}}>Sem lembretes ativos</div>}
            <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {[...activeReminders].sort((a,b)=>new Date(a.date)-new Date(b.date)).map(r=>{
                const due=new Date(r.date).getTime();
                const overdue=due<Date.now();
                const soon=!overdue&&due-Date.now()<3600000;
                return(
                  <div key={r.id} style={{display:"flex",gap:12,padding:"14px 16px",borderRadius:16,background:overdue?"rgba(224,122,95,0.1)":soon?"rgba(244,201,93,0.07)":"rgba(255,255,255,0.05)",border:"1px solid",borderColor:overdue?"rgba(224,122,95,0.3)":soon?"rgba(244,201,93,0.2)":"rgba(255,255,255,0.08)"}}>
                    <div style={{fontSize:22,flexShrink:0,marginTop:1}}>{overdue?"🔴":soon?"🟡":"🔔"}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:500,fontSize:15,color:"#f0ebe3"}}>{r.text}</div>
                      <div style={{fontSize:12,color:overdue?"#e07a5f":soon?"#F4C95D":"rgba(240,235,227,0.4)",marginTop:3}}>
                        {overdue?"⚠️ Em atraso · ":""}{fmtDate(r.date)}
                        {r.repeat!=="none"&&<span style={{opacity:0.6}}> · {r.repeat==="daily"?"diário":r.repeat==="weekly"?"semanal":"mensal"}</span>}
                      </div>
                    </div>
                    <button style={{background:"none",border:"none",cursor:"pointer",color:"rgba(240,235,227,0.25)",fontSize:20,padding:"0 4px",alignSelf:"flex-start",WebkitTapHighlightColor:"transparent"}} onClick={()=>deleteReminder(r.id)}>×</button>
                  </div>
                );
              })}
            </div>
            {reminders.filter(r=>r.done).length>0&&(
              <div style={{marginTop:20}}>
                <div style={{fontSize:11,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"rgba(240,235,227,0.25)",marginBottom:8}}>Concluídos</div>
                {reminders.filter(r=>r.done).map(r=>(
                  <div key={r.id} style={{display:"flex",gap:10,padding:"10px 14px",borderRadius:12,background:"rgba(255,255,255,0.02)",marginBottom:6,opacity:0.45}}>
                    <span style={{fontSize:16}}>✅</span>
                    <div style={{flex:1,fontSize:13,textDecoration:"line-through",color:"rgba(240,235,227,0.4)"}}>{r.text}</div>
                    <button style={{background:"none",border:"none",cursor:"pointer",color:"rgba(240,235,227,0.2)",fontSize:17,WebkitTapHighlightColor:"transparent"}} onClick={()=>deleteReminder(r.id)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ HISTÓRICO ══ */}
        {tab==="historico"&&(
          <div style={{padding:"16px 20px 0"}}>
            <p style={{fontSize:13,color:"rgba(240,235,227,0.35)",margin:"0 0 14px"}}>Produtos mais frequentes. Toca para adicionar à lista atual.</p>
            {frequent.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"rgba(240,235,227,0.2)",fontSize:14}}>Ainda sem histórico</div>}
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {frequent.map((h,i)=>{
                const cat=CAT[h.cat]||CAT["outro"];
                const inList=items.some(x=>norm(x.name)===norm(h.name)&&!x.done);
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"13px 16px",borderRadius:14,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}}>
                    <div style={{width:36,height:36,borderRadius:10,background:cat.color+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{cat.label.split(" ")[0]}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:500,fontSize:14,color:inList?"rgba(240,235,227,0.4)":"#f0ebe3",textDecoration:inList?"line-through":"none"}}>{h.name}</div>
                      <div style={{fontSize:11,color:"rgba(240,235,227,0.3)",marginTop:2,display:"flex",gap:6,alignItems:"center"}}>
                        <span style={S.tag(cat.color)}>{cat.label.split(" ").slice(1).join(" ")}</span>
                        <span>· {h.count}× adicionado</span>
                      </div>
                    </div>
                    <button style={{...IS.btn(inList?"ghost":"primary"),padding:"8px 14px",fontSize:13,opacity:inList?0.4:1}} disabled={inList} onClick={()=>{if(!inList)quickAdd(h.name);}}>
                      {inList?"✓":"+ Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>{/* end page */}

      {/* Bottom bar */}
      <div style={S.bottomBar}>
        {suggestions.length>0&&(
          <div style={{position:"absolute",bottom:"100%",left:16,right:16,marginBottom:6,background:"rgba(18,24,50,0.98)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,overflow:"hidden"}} className="enter">
            {suggestions.map((s,i)=>{
              const cat=CAT[s.cat]||CAT["outro"];
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:i<suggestions.length-1?"1px solid rgba(255,255,255,0.06)":"none",cursor:"pointer",WebkitTapHighlightColor:"transparent"}} onClick={()=>quickAdd(s.name)}>
                  <span style={{fontSize:18}}>{cat.label.split(" ")[0]}</span>
                  <span style={{flex:1,fontSize:15,color:"#f0ebe3"}}>{s.name}</span>
                  <span style={{fontSize:11,color:"rgba(240,235,227,0.3)"}}>{s.count}×</span>
                </div>
              );
            })}
          </div>
        )}
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{...S.avatar(user.color),cursor:"pointer"}} onClick={handleLogout}>{user.name[0].toUpperCase()}</div>
          <input ref={quickRef}
            style={{...IS.input,flex:1,padding:"12px 14px"}}
            placeholder={activeList?`Adicionar a "${activeList.name}"…`:"Adicionar produto…"}
            value={quick} onChange={e=>setQuick(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&quickAdd()}
          />
          <button style={{...IS.btn("primary"),padding:"12px 18px",flexShrink:0,fontSize:22,lineHeight:1}} onClick={()=>quickAdd()}>+</button>
          <button style={{...IS.btn("ghost"),padding:"12px 14px",flexShrink:0,fontSize:15}} onClick={()=>{setShowDetail(!showDetail);setTab("lista");}}>⚙︎</button>
        </div>
      </div>
    </div>
  );
}
