/* ===== VIEWS: tab layout (วันนี้ / รายการ / งบ / สรุป) =====
   Loaded after app.js. Uses its globals (cY, sM_, viewDate, render, ...). */

/* ----- shared month state ----- */
function setMonth(y,m){
    cY=y;sM_=m;
    var now=getBangkokNow();
    if(viewDate.getFullYear()!==y||viewDate.getMonth()!==m){
        viewDate=(now.getFullYear()===y&&now.getMonth()===m)?new Date(now):new Date(y,m,1);
    }
    render();
}
function shiftMonth(delta){var m=sM_+delta,y=cY;if(m<0){m=11;y--}else if(m>11){m=0;y++}setMonth(y,m)}
function monthSwitchH(){
    return '<div class="month-switch"><button type="button" class="ms-btn" onclick="shiftMonth(-1)" aria-label="เดือนก่อน">‹</button><button type="button" class="ms-label" onclick="openMP()">'+TMF[sM_]+' '+cY+'</button><button type="button" class="ms-btn" onclick="shiftMonth(1)" aria-label="เดือนถัดไป">›</button></div>';
}
function statTrioH(items){
    return '<div class="stat-trio">'+items.map(function(it){return '<div class="stat-cell"><small>'+it[0]+'</small><b class="'+(it[2]||'')+'">'+it[1]+'</b></div>'}).join('')+'</div>';
}

/* ----- วันนี้ ----- */
function todayHeadH(c,y,m){
    var d=viewDate,isToday=dKey(d)===dKey(getBangkokNow());
    var dayLb=(isToday?'วันนี้ · ':'')+THDAY[d.getDay()]+' '+d.getDate()+' '+TM[d.getMonth()];
    return '<div class="today-head"><button type="button" class="today-date" onclick="openCal()">'+dayLb+' <span>▾</span></button><div class="today-bal"><small>คงเหลือ '+TMF[m]+'</small><b class="'+(c.r>=0?'':'neg')+'">'+fmt(c.r)+'</b></div></div>';
}

function txRowH(dk,x,i,cats){
    var cat=cats.find(function(c2){return c2.id===x.cat})||{name:'อื่นๆ',id:'other'};
    var title=(x.n&&x.n.trim())?x.n:cat.name;
    var meta=[cat.name,x.t,x.w?getWalletName(x.w):''].filter(Boolean).join(' · ');
    return '<button type="button" class="tx-row" onclick="openEditEntry(\''+dk+'\','+i+')"><span class="tx-ic">'+getCatIcon(cat.id)+'</span><span class="tx-main"><b>'+esc(title)+'</b><small>'+esc(meta)+'</small></span><span class="tx-amt">−'+fmt(x.a)+'</span></button>';
}
function todayListH(log,dk,total){
    if(!log.length)return '<div class="tx-group">'+emptyStateH({title:'ยังไม่มีรายการวันนี้',desc:'กดปุ่ม + ด้านล่างเพื่อบันทึกรายจ่าย',cta:{text:'+ บันทึกรายจ่าย',onclick:'openQuickAdd()'}})+'</div>';
    var cats=getAllDailyCats(),h='<div class="tx-group"><div class="tx-day"><span>รายจ่ายวันนี้ · '+log.length+' รายการ</span><span>−'+fmt(total)+'</span></div>';
    for(var i=log.length-1;i>=0;i--)h+=txRowH(dk,log[i],i,cats);
    return h+'</div>';
}

/* ----- งบ ----- */
function budgetHeadH(c){
    return statTrioH([['รายรับ','+'+fmtSh(c.tI),'pos'],['ใช้/ตั้งงบ','−'+fmtSh(c.tE),'neg'],['คงเหลือ',(c.r<0?'−':'')+fmtSh(Math.abs(c.r)),c.r>=0?'':'neg']]);
}

/* ----- รายการ ----- */
var txQ='',txCat='';
function openTxFiltered(cat){txCat=cat||'';txQ='';setV('tx')}
function txCollect(y,m){
    var days=new Date(y,m+1,0).getDate(),out=[];
    for(var dd=days;dd>=1;dd--){
        var dk=y+'-'+String(m+1).padStart(2,'0')+'-'+String(dd).padStart(2,'0'),log=getDayLog(dk);
        if(!log.length)continue;
        out.push({dk:dk,d:dd,rows:log.map(function(x,i){return{x:x,i:i}}).reverse()});
    }
    return out;
}
function txListH(){
    var y=cY,m=sM_,cats=getAllDailyCats(),q=txQ.trim().toLowerCase();
    var h='',count=0,sum=0,now=getBangkokNow(),todayK=dKey(now);
    var yd=new Date(now);yd.setDate(yd.getDate()-1);var ydK=dKey(yd);
    txCollect(y,m).forEach(function(g){
        var rows=g.rows.filter(function(r){
            if(txCat&&(r.x.cat||'other')!==txCat)return false;
            if(!q)return true;
            var cn=((cats.find(function(c2){return c2.id===r.x.cat})||{}).name||'').toLowerCase();
            return (r.x.n||'').toLowerCase().indexOf(q)>=0||cn.indexOf(q)>=0;
        });
        if(!rows.length)return;
        var dt=new Date(y,m,g.d),dayT=rows.reduce(function(s2,r){return s2+Number(r.x.a||0)},0);
        count+=rows.length;sum+=dayT;
        var lb=g.dk===todayK?'วันนี้':g.dk===ydK?'เมื่อวาน':THDAY[dt.getDay()]+' '+g.d+' '+TM[m];
        h+='<div class="tx-group"><div class="tx-day"><span>'+lb+'</span><span>−'+fmt(dayT)+'</span></div>';
        rows.forEach(function(r){h+=txRowH(g.dk,r.x,r.i,cats)});
        h+='</div>';
    });
    var head='<div class="tx-sum"><span>'+count+' รายการ</span><b>−'+fmt(sum)+'</b></div>';
    if(!count)return head+emptyStateH({title:(q||txCat)?'ไม่พบรายการ':'ยังไม่มีรายการเดือนนี้',desc:(q||txCat)?'ลองเปลี่ยนคำค้นหรือหมวด':'กดปุ่ม + ด้านล่างเพื่อบันทึกรายจ่าย'});
    return head+h;
}
function rTxList(){var el=document.getElementById('txList');if(el)el.innerHTML=txListH()}
function setTxCat(c){txCat=c;render()}
function rTx(el){
    var cats=getAllDailyCats(),counts={};
    txCollect(cY,sM_).forEach(function(g){g.rows.forEach(function(r){var k=r.x.cat||'other';counts[k]=(counts[k]||0)+1})});
    var h=monthSwitchH();
    h+='<div class="tx-tools"><div class="tx-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input id="txQ" type="search" placeholder="ค้นหาโน้ตหรือหมวด" value="'+esc(txQ)+'" oninput="txQ=this.value;rTxList()"></div>';
    h+='<div class="chip-row"><button type="button" class="f-chip'+(txCat?'':' on')+'" onclick="setTxCat(\'\')">ทั้งหมด</button>';
    cats.forEach(function(c2){if(!counts[c2.id])return;h+='<button type="button" class="f-chip'+(txCat===c2.id?' on':'')+'" onclick="setTxCat(\''+c2.id+'\')">'+esc(c2.name)+' <small>'+counts[c2.id]+'</small></button>'});
    h+='</div></div><div id="txList">'+txListH()+'</div>';
    el.innerHTML=h;
}

/* ----- สรุป ----- */
function setSumMode(mo){window._sumMode=mo;render()}
function rSummary(el){
    var mode=window._sumMode==='y'?'y':'m';
    var seg='<div class="seg"><button type="button" class="'+(mode==='m'?'on':'')+'" onclick="setSumMode(\'m\')">รายเดือน</button><button type="button" class="'+(mode==='y'?'on':'')+'" onclick="setSumMode(\'y\')">รายปี</button></div>';
    if(mode==='y'){el.innerHTML=seg+'<div id="yWrap"></div>';try{rYear(document.getElementById('yWrap'))}catch(e){console.error(e)}return}
    var y=cY,m=sM_,d=gm(y,m),c=calc(y,m),prevC=(m===0)?calc(y-1,11):calc(y,m-1);
    var h=seg+monthSwitchH();
    h+=heroH('เงินคงเหลือ '+TMF[m]+' '+y,c.r,c.tI,c.tE,{key:'shero',prevExp:prevC.tE,prevLabel:'จากเดือนก่อน'});
    h+=monthPulseH(c,y,m);
    h+=savTabH(getSavings().balance);
    h+=monthInsightsH(c,y,m);
    h+=monthChartH();
    el.innerHTML=h;
    try{drawMC(d,y,m)}catch(e){console.error(e)}
}
