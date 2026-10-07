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
var EYE_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
var EYE_OFF_SVG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6C3.6 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20"/></svg>';
function todayHeadH(c,y,m){
    var d=viewDate,isToday=dKey(d)===dKey(getBangkokNow());
    var dayLb=(isToday?'วันนี้ · ':'')+THDAY[d.getDay()]+' '+d.getDate()+' '+TM[d.getMonth()];
    var hidden=!!ensureSettings().hideAmount,r=Number(c.r||0),tI=Number(c.tI||0),tE=Number(c.tE||0);
    return '<section class="today-hero'+(r<0?' is-neg':'')+'">'+
        '<div class="th-orb" aria-hidden="true"></div><div class="th-orb th-orb2" aria-hidden="true"></div><div class="th-sheen" aria-hidden="true"></div>'+
        '<div class="th-top"><button type="button" class="th-date" onclick="openCal()">'+dayLb+' <span aria-hidden="true">▾</span></button>'+
        '<button type="button" class="th-eye" onclick="toggleHideAmt()" aria-label="'+(hidden?'แสดงจำนวนเงิน':'ซ่อนจำนวนเงิน')+'" aria-pressed="'+hidden+'">'+(hidden?EYE_OFF_SVG:EYE_SVG)+'</button></div>'+
        '<small class="th-lb">คงเหลือ '+TMF[m]+(y!==getBangkokNow().getFullYear()?' '+y:'')+'</small>'+
        '<div class="th-bal rv" data-tween-key="today-bal" data-tween-target="'+r+'" data-tween-fmt="signed">'+(r<0?'-':'')+fmt(Math.abs(r))+'</div>'+
        '<div class="th-split">'+
            '<div class="th-tile"><small><i aria-hidden="true">↑</i>รายรับ</small><b class="rv" data-tween-key="today-inc" data-tween-target="'+tI+'" data-tween-fmt="plus">+'+fmt(tI)+'</b></div>'+
            '<div class="th-tile"><small><i aria-hidden="true">↓</i>ใช้/ตั้งงบ</small><b class="rv" data-tween-key="today-exp" data-tween-target="'+tE+'" data-tween-fmt="minus">-'+fmt(tE)+'</b></div>'+
        '</div></section>';
}

/* "ใช้ได้อีกวันนี้": what's left of today's even share of the month's remaining balance */
function todaySafeH(c,y,m,todaySpent){
    var now=getBangkokNow();
    if(!(now.getFullYear()===y&&now.getMonth()===m)||dKey(viewDate)!==dKey(now))return '';
    var dim=new Date(y,m+1,0).getDate(),left=dim-now.getDate()+1;
    var allow=left>0?Math.max(0,Number(c.r||0)+Number(todaySpent||0))/left:0;
    var pct=allow>0?Math.min(100,Math.round(todaySpent/allow*100)):(todaySpent>0?100:0);
    var rem=allow-todaySpent,over=rem<0,tone=over?'bad':pct>=75?'warn':'ok';
    return '<section class="safe-card safe-'+tone+'"><div class="safe-ring" style="--p:'+pct+'" role="img" aria-label="ใช้ไป '+pct+'% ของงบวันนี้"><span>'+pct+'%</span></div>'+
        '<div class="safe-copy"><small>'+(over?'เกินงบวันนี้':'ใช้ได้อีกวันนี้')+'</small>'+
        '<b class="rv" data-tween-key="today-safe" data-tween-target="'+Math.abs(rem)+'" data-tween-fmt="plain">'+fmt(Math.abs(rem))+'</b>'+
        '<span>ใช้ไป <em class="rv">'+fmt(todaySpent)+'</em> จาก <em class="rv">'+fmt(allow)+'</em>/วัน · เหลือ '+left+' วัน</span></div></section>';
}

/* top categories by % used, as rows with bars; striped once a category passes 90% */
function todayBudgetH(cards){
    if(!cards.length)return '';
    var hot=cards[0].pct>=70;
    var h='<section class="tb-card"><div class="tb-hd"><b>'+(hot?'งบใกล้เต็ม':'งบเดือนนี้')+'</b>'+
        '<button type="button" class="tb-all" onclick="window._budgetOpen=true;setV(\'m\')">ดูทั้งหมด ›</button></div>';
    cards.slice(0,3).forEach(function(bc){
        var p=Math.round(bc.pct),over=bc.left<0;
        h+='<button type="button" class="tb-row" onclick="openCatDetail(\''+bc.k+'\')"><span class="tb-ic">'+catBadge(bc.k)+'</span>'+
            '<span class="tb-main"><span class="tb-line"><b>'+esc(bc.n)+'</b><span class="rv">'+(over?'เกิน '+fmt(-bc.left):'เหลือ '+fmt(bc.left))+'</span></span>'+
            '<span class="tb-bar'+(p>=90?' hi':'')+'"><i style="width:'+p+'%"></i></span></span><span class="tb-pct">'+p+'%</span></button>';
    });
    return h+'</section>';
}

function txRowH(dk,x,i,cats){
    var cat=cats.find(function(c2){return c2.id===x.cat})||{name:'อื่นๆ',id:'other'};
    var title=(x.n&&x.n.trim())?x.n:cat.name;
    var meta=[cat.name,x.t,x.w?getWalletName(x.w):''].filter(Boolean).join(' · ');
    return '<button type="button" class="tx-row" onclick="openEditEntry(\''+dk+'\','+i+')"><span class="tx-ic">'+getCatIcon(cat.id)+'</span><span class="tx-main"><b>'+esc(title)+'</b><small>'+esc(meta)+'</small></span><span class="tx-amt">−'+fmt(x.a)+'</span></button>';
}
function todayListH(log,dk,total){
    if(!log.length)return '<div class="tx-group today-list">'+emptyStateH({title:'ยังไม่มีรายการวันนี้',desc:'กดปุ่ม + ด้านล่างเพื่อบันทึกรายจ่าย',cta:{text:'+ บันทึกรายจ่าย',onclick:'openQuickAdd()'}})+'</div>';
    var cats=getAllDailyCats(),h='<div class="tx-group today-list"><div class="tx-day"><span>รายจ่ายวันนี้ · '+log.length+' รายการ</span><span>−'+fmt(total)+'</span></div>';
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
