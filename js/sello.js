/* Sello v2 landing — interactions */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- smooth scroll (Lenis) — a "manteiga" do getquoti/Linear ----------
     Scroll real (não transform): sticky/fixed, IntersectionObserver e o fade do
     hero seguem funcionando. Desligado em reduced-motion; toque fica nativo
     (mobile já tem momentum próprio — evita sensação de lag). */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true });
    window.lenis = lenis;
    (function raf(time){ lenis.raf(time); requestAnimationFrame(raf); })(performance.now());
  }

  /* ---------- scroll: nav state + hero text fade-out (estilo Novu) ---------- */
  var nav = document.getElementById('nav');
  var hero = document.querySelector('.hero');
  var heroContent = document.querySelector('.hero__content');
  var sTick = false;
  function onNav(){
    if (sTick) return; sTick = true;
    requestAnimationFrame(function(){
      // light frosted nav only once the white sheet reaches the nav (stays transparent over the dark hero)
      var trig = (hero ? hero.offsetHeight : 640) - 64;
      if (nav) nav.classList.toggle('is-scrolled', scrollY > trig);
      if (heroContent && !reduce){
        var p = Math.min(1, Math.max(0, scrollY / (innerHeight * 0.62)));
        heroContent.style.opacity = (1 - p).toFixed(3);
        // parallax compoe com o offset base (--hero-shift) definido no CSS
        heroContent.style.setProperty('--hero-parallax', (-p * 60).toFixed(1) + 'px');
      }
      sTick = false;
    });
  }
  addEventListener('scroll', onNav, {passive:true}); onNav();

  /* ---------- airport split-flap buttons ---------- */
  [].forEach.call(document.querySelectorAll('.btn__t'), function(t){
    var txt = t.textContent, frag = document.createDocumentFragment();
    for (var i=0;i<txt.length;i++){
      var ch = txt[i] === ' ' ? ' ' : txt[i];
      var c = document.createElement('span'); c.className='c'; c.style.setProperty('--i', i);
      var a = document.createElement('span'); a.textContent = ch;
      var b = document.createElement('span'); b.textContent = ch;
      c.appendChild(a); c.appendChild(b); frag.appendChild(c);
    }
    t.textContent=''; t.appendChild(frag);
  });

  /* ---------- stats: dígitos rolando (split-flap/odômetro) ao entrar na tela ---------- */
  var statGrid = document.querySelector('.stats__grid');
  var statNums = [].slice.call(document.querySelectorAll('.statc__n'));
  if (statGrid && statNums.length){
    statNums.forEach(function(el){
      var txt = el.textContent.trim(), frag = document.createDocumentFragment(), reels = [];
      for (var i=0;i<txt.length;i++){
        var ch = txt.charAt(i);
        if (ch>='0' && ch<='9'){
          var T=+ch, roll=document.createElement('span'), strip=document.createElement('span'), h='';
          roll.className='roll'; strip.className='roll__s';
          for (var k=0;k<=9;k++) h+='<i>'+k+'</i>';
          for (var k2=0;k2<=T;k2++) h+='<i>'+k2+'</i>';
          strip.innerHTML=h; roll.appendChild(strip); frag.appendChild(roll);
          reels.push({s:strip, d:10+T});
        } else {
          var x=document.createElement('span'); x.className='roll-x'; x.textContent=ch; frag.appendChild(x);
        }
      }
      el.textContent=''; el.appendChild(frag);
      var card=el.closest('.statc');
      el._reels=reels;
      el._base=(parseFloat(getComputedStyle(card).getPropertyValue('--d'))||0)*1000;
    });
    var runRoll=function(){
      statNums.forEach(function(el){
        el._reels.forEach(function(r,j){
          r.s.style.transitionDelay=(el._base+460+j*55)+'ms';
          r.s.style.transform='translateY(-'+r.d+'em)';
        });
      });
    };
    if (reduce){
      statNums.forEach(function(el){ el._reels.forEach(function(r){ r.s.style.transition='none'; r.s.style.transform='translateY(-'+r.d+'em)'; }); });
    } else if ('IntersectionObserver' in window){
      var sio=new IntersectionObserver(function(en){
        en.forEach(function(x){ if(x.isIntersecting){ runRoll(); sio.disconnect(); } });
      }, {threshold:0.25});
      sio.observe(statGrid);
    } else { runRoll(); }
  }

  /* ---------- reveal (reusable; works for elements added later) ---------- */
  var io = null;
  if (!reduce && 'IntersectionObserver' in window){
    io = new IntersectionObserver(function(en){
      en.forEach(function(x){
        if(x.isIntersecting){
          var d = parseInt(x.target.getAttribute('data-delay')||'0',10);
          x.target.style.transitionDelay = (d*90)+'ms';
          x.target.classList.add('is-in'); io.unobserve(x.target);
        }
      });
    }, {rootMargin:'0px 0px -8% 0px', threshold:0.12});
  }
  function reveal(el){ if(!io){ el.classList.add('is-in'); } else { io.observe(el); } }
  [].forEach.call(document.querySelectorAll('[data-reveal]'), reveal);

  /* ---------- Anton SC headings: word-rise (GSAP SplitText, vanilla) ----------
     Wrap every word in <span.w-mask><span.w-in>; words sit at translateY(110%) (hidden behind
     their own clip) and rise to 0 staggered 40ms, via the shared reveal observer. Recurses into
     child elements (e.g. .accent, .line) and preserves <br> so nested markup keeps its styling. */
  function splitFrag(node){
    var frag = document.createDocumentFragment();
    [].forEach.call(node.childNodes, function(ch){
      if (ch.nodeType === 3){
        ch.nodeValue.split(/(\s+)/).forEach(function(tok){
          if (tok === '') return;
          if (/^\s+$/.test(tok)){ frag.appendChild(document.createTextNode(' ')); return; }
          var m = document.createElement('span'); m.className = 'w-mask';
          var w = document.createElement('span'); w.className = 'w-in'; w.textContent = tok;
          m.appendChild(w); frag.appendChild(m);
        });
      } else if (ch.nodeType === 1){
        if (ch.tagName === 'BR'){ frag.appendChild(ch.cloneNode(false)); }
        else { var el = ch.cloneNode(false); el.appendChild(splitFrag(ch)); frag.appendChild(el); }
      }
    });
    return frag;
  }
  [].forEach.call(document.querySelectorAll('[data-split]'), function(h){
    var f = splitFrag(h);
    while (h.firstChild) h.removeChild(h.firstChild);
    h.appendChild(f);
    [].forEach.call(h.querySelectorAll('.w-in'), function(w,i){ w.style.transitionDelay = (i*0.04) + 's'; });
    h.classList.add('split-ready');
    reveal(h); // shared IO adds .is-in on scroll-in (or instantly when reduced-motion/no-IO)
  });

  /* ---------- live phones: hover-scroll distance (exact to screen bottom) ---------- */
  function setScrollVars(){
    [].forEach.call(document.querySelectorAll('.lphone'), function(ph){
      if (ph.classList.contains('lphone--avalie')) return; // avalie animates a sheet, not a scroll
      var scr = ph.querySelector('.lphone__scr'), img = scr && scr.querySelector('.lphone__img');
      if(!img) return;
      var apply = function(){
        var sh = scr.clientHeight, iw = scr.clientWidth;
        var ih = iw * (img.naturalHeight/img.naturalWidth);
        var dist = Math.max(0, ih - sh);
        ph.style.setProperty('--sy', '-'+dist.toFixed(0)+'px');
      };
      if(img.complete && img.naturalWidth) apply(); else img.addEventListener('load', apply);
    });
  }
  setScrollVars(); addEventListener('resize', setScrollVars, {passive:true});

  /* ---------- steps carousel: arrows + drag ---------- */
  var track = document.querySelector('[data-steps-track]');
  if (track){
    var nextB=document.querySelector('[data-steps-next]'), prevB=document.querySelector('[data-steps-prev]');
    function stepW(){ var c=track.querySelector('.scard'); return c ? c.getBoundingClientRect().width+24 : 360; }
    if(nextB) nextB.onclick=function(){ track.scrollBy({left:stepW(),behavior:'smooth'}); };
    if(prevB) prevB.onclick=function(){ track.scrollBy({left:-stepW(),behavior:'smooth'}); };
    enableDrag(track, function(dx){ track.scrollLeft -= dx; });
  }

  /* generic pointer drag (horizontal) */
  function enableDrag(el, onMove){
    var down=false, lastX=0, moved=0;
    el.addEventListener('pointerdown', function(e){ down=true; moved=0; lastX=e.clientX; el.classList.add('is-drag'); el.setPointerCapture&&el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', function(e){ if(!down) return; var dx=e.clientX-lastX; lastX=e.clientX; moved+=Math.abs(dx); onMove(dx); });
    function up(){ down=false; el.classList.remove('is-drag'); }
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    el.addEventListener('click', function(e){ if(moved>6){ e.preventDefault(); e.stopPropagation(); } }, true);
    return function(){ return moved; };
  }

  /* ---------- reviews: 2 carrosséis em sentidos opostos (slideshow puro) ---------- */
  var star='<svg viewBox="0 0 24 24"><path d="m12 17.27 4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72 3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41-1.89-4.46c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08z"/></svg>';
  var REVIEWS={
    '1':[
      {a:'av1.png', n:'Giovanna C.', q:'Baixei por causa de um amigo e acabei usando mais do que imaginava.'},
      {a:'av2.png', n:'Gabriel V.',  q:'Gostei de ver que não tem 15 mil restaurantes. Dá menos ansiedade pra escolher.'},
      {a:'av3.png', n:'Letícia M.',  q:'Sempre esquecia as indicações que recebia. Agora salvo tudo em um lugar só.'},
      {a:'av4.png', n:'Thales A.',   q:'Finalmente um app que explica por que um restaurante vale a pena.'},
      {a:'av5.png', n:'Marina Y.',   q:'Parei de abrir cinco abas pra decidir onde jantar.'}
    ],
    '2':[
      {a:'av3.png', n:'Camila S.',    q:'Descobri uns cafés ótimos que nunca apareceriam pra mim no Instagram.'},
      {a:'av4.png', n:'Guilherme R.', q:'É como ter um amigo que sempre sabe onde comer.'},
      {a:'av5.png', n:'Fernanda M.',  q:'Virou meu lugar favorito pra organizar os restaurantes que quero visitar.'},
      {a:'av1.png', n:'Helena B.',    q:'Confio mais nas recomendações daqui do que em qualquer ranking.'},
      {a:'av2.png', n:'André C.',     q:'Não parece um app de avaliação tradicional, e isso é um elogio.'}
    ]
  };
  function rcard(d,dup){ return '<article class="rcard"'+(dup?' aria-hidden="true"':'')+'><div class="rcard__stars" role="img" aria-label="5 estrelas">'+star+star+star+star+star+'</div><p class="rcard__quote">&ldquo;'+d.q+'&rdquo;</p><div class="rcard__by"><img class="rcard__av" src="assets/avatars/'+d.a+'" alt="" decoding="async" width="44" height="44" />'+d.n+'</div></article>'; }
  [].forEach.call(document.querySelectorAll('[data-marquee]'), function(mq){
    var data = REVIEWS[mq.getAttribute('data-row')] || REVIEWS['1'];
    if (reduce){                                            // sem animação: 1 conjunto só, vira faixa rolável (CSS reduced-motion)
      mq.innerHTML = data.map(function(d){ return rcard(d); }).join('');
      mq.style.transform = 'none';
      return;
    }
    mq.innerHTML = data.map(function(d){ return rcard(d); }).join('') + data.map(function(d){ return rcard(d, true); }).join(''); // 2º conjunto = clone aria-hidden: loop sem costura, sem leitura dupla
    var dir = mq.getAttribute('data-marquee')==='right' ? 1 : -1;
    var x = 0, speed = 0.5;
    (function frame(){
      x += dir*speed;
      var h = mq.scrollWidth/2;
      if(h>0){ x %= h; if(x>0) x-=h; }
      mq.style.transform='translateX('+x.toFixed(1)+'px)';
      requestAnimationFrame(frame);
    })();
  });

  /* ---------- city wall: mosaico flex misturado; hover expande o box+coluna e os outros se ajustam (flex-grow, smooth); stretch-in; sem repetir foto ---------- */
  var wall = document.querySelector('[data-city-wall]');
  if (wall){
    var POOL=[29,30,31,26,12,13,15,17,18,27,28,16,8,19,10,4]; // curados profissionais: pizzas, burger, pratos montados (sem garfo/porção/bebida)
    var COLS=[                                            // +tiles, sem retângulo gigante; larguras variadas -> mosaico misturado
      {w:1.0,  h:[1,0.85,1.15]},
      {w:0.82, h:[1.1,0.9]},
      {w:1.12, h:[0.9,1.2,0.85]},
      {w:1.15, h:[1,1.15,0.9]},
      {w:0.78, h:[0.95,1.1]},
      {w:0.95, h:[1.1,0.85,1.0]}
    ];
    var dsrc=function(n){ return 'assets/dishes/d'+(n<10?'0':'')+n+'.jpg?v=2'; };
    var used=Object.create(null);
    var take=function(){                                  // 1 prato livre do acervo curado: nenhum box repete foto
      var a=[],i; for(i=0;i<POOL.length;i++){ if(!used[POOL[i]]) a.push(POOL[i]); }
      if(!a.length){ a=POOL.slice(); }
      return a[Math.floor(Math.random()*a.length)];
    };
    var html='';
    for(var c=0;c<COLS.length;c++){
      html+='<div class="city__col" style="--w:'+COLS[c].w+'">';
      for(var r=0;r<COLS[c].h.length;r++){
        var d=take(); used[d]=1;
        html+='<div class="city__tile" style="--h:'+COLS[c].h[r]+'" data-cur="'+d+'">'
            +'<img src="'+dsrc(d)+'" alt="" decoding="async">'
            +'</div>';
      }
      html+='</div>';
    }
    wall.innerHTML=html;

    var tiles=[].slice.call(wall.querySelectorAll('.city__tile'));
    if(reduce){ tiles.forEach(function(t){ t.classList.add('is-in'); }); }
    else {
      var shown=false, cio=new IntersectionObserver(function(en){
        en.forEach(function(x){
          if(x.isIntersecting && !shown){ shown=true;
            tiles.forEach(function(t,i){ setTimeout(function(){ t.classList.add('is-in'); }, i*45); });
            cio.disconnect();
          }
        });
      }, {threshold:0.12});
      cio.observe(wall);
    }
  }

  /* ---------- FAQ accordion ---------- */
  [].forEach.call(document.querySelectorAll('.faq__q'), function(btn){
    var panel = btn.nextElementSibling;
    btn.addEventListener('click', function(){
      var open = btn.getAttribute('aria-expanded')==='true';
      [].forEach.call(document.querySelectorAll('.faq__q'), function(b){ if(b!==btn){ b.setAttribute('aria-expanded','false'); b.nextElementSibling.style.height='0px'; } });
      if(open){ btn.setAttribute('aria-expanded','false'); panel.style.height='0px'; }
      else { btn.setAttribute('aria-expanded','true'); panel.style.height = panel.scrollHeight+'px'; }
    });
  });

  /* ---------- DE SUA NOTA: slider corre + nota muda (loop contínuo) ---------- */
  var notaEl = document.querySelector('[data-nota]');
  if (notaEl && !reduce){
    var notaBox = notaEl.closest('.nota'), nStart=null, N_DUR=2200, N_HOLD=1000;
    var notaStep = function(ts){
      if(nStart==null) nStart=ts;
      var t=(ts-nStart)%(N_DUR+N_HOLD), p;
      if(t<N_DUR){ var pr=t/N_DUR, e=pr<.5?2*pr*pr:1-Math.pow(-2*pr+2,2)/2; p=0.5+0.4*e; }
      else p=0.9;
      notaBox.style.setProperty('--p', p.toFixed(3));
      notaEl.textContent=(p*10).toFixed(1);
      requestAnimationFrame(notaStep);
    };
    requestAnimationFrame(notaStep);
  }

  /* ---------- EXPLORE mapa: transição (crossfade) entre as telas reais (fotos do user) ---------- */
  var mapScr = document.querySelector('[data-map]');
  if (mapScr && !reduce){
    var slides = mapScr.querySelectorAll('.map-slide');
    if (slides.length > 1){
      var mi = 0;
      setInterval(function(){
        slides[mi].classList.remove('is-on');
        mi = (mi + 1) % slides.length;
        slides[mi].classList.add('is-on');
      }, 2400);
    }
  }

  /* ---------- auto-pan estilo GIF: começa logo, roda contínuo, independente de scroll/hover ---------- */
  if (!reduce) [].forEach.call(document.querySelectorAll('[data-pan]'), function(panPh, pIdx){
    var pImg = panPh.querySelector('.lphone__img'), pScr = panPh.querySelector('.lphone__scr'), pDown = false;
    var panApply = function(){
      var dist = Math.max(0, pImg.clientHeight - pScr.clientHeight);
      if (dist < 8) return;
      pImg.style.transform = 'translateY(' + (pDown ? -dist : 0).toFixed(0) + 'px)';
    };
    var panStart = function(){
      pImg.style.transform = 'translateY(0)';
      setTimeout(function go(){ pDown = !pDown; panApply(); setTimeout(go, 2800); }, 350 + pIdx * 180);
    };
    if (pImg.complete && pImg.naturalWidth) panStart(); else pImg.addEventListener('load', panStart);
    addEventListener('resize', panApply, {passive:true});
  });

  /* ---------- AVALIE: sheet sobe → slider/nota animam → "Continuar" → crossfade "veredito enviado" (loop) ---------- */
  var rv = document.querySelector('[data-review]');
  if (rv && !reduce){
    var rvSheet = rv.querySelector('.vnota'), rvNum = rv.querySelector('[data-review-num]');
    var rvSet = function(p){ rvSheet.style.setProperty('--p', p.toFixed(3)); rvNum.textContent = (p*10).toFixed(1); };
    var rvSlide = function(target, dur){
      var from = parseFloat(rvSheet.style.getPropertyValue('--p')) || 0.5, start = null;
      var step = function(ts){ if(start==null) start=ts; var t=Math.min(1,(ts-start)/dur); var e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2; rvSet(from+(target-from)*e); if(t<1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    var rvCycle = function(){
      rv.classList.remove('is-sent','is-press'); rvSet(0.5);
      rv.classList.add('is-open');
      setTimeout(function(){ rvSlide(0.9, 1600); }, 800);
      setTimeout(function(){ rv.classList.add('is-press'); }, 2900);
      setTimeout(function(){ rv.classList.remove('is-press'); rv.classList.add('is-sent'); }, 3250);
      setTimeout(function(){ rv.classList.remove('is-open'); }, 5400);
    };
    rvCycle();
    setInterval(rvCycle, 7600);
  }

  /* ---------- GAMEFICAÇÃO: trocar de chip (Geral/Exploração/Influência) reordena as pessoas do ranking ---------- */
  var rk = document.querySelector('[data-rank]');
  if (rk){
    var rkf = [].slice.call(rk.querySelectorAll('.rkf')), rkScr = rk.querySelector('.lphone__scr');
    if (rkf.length && !reduce){
      var rki = 0;
      var rkShow = function(i){ rkf.forEach(function(f,k){ f.classList.toggle('is-on', k===i); }); };
      var rkNext = function(){ rki = (rki + 1) % rkf.length; rkLoop(); };
      var rkLoop = function(){
        rkShow(rki);
        if (rki === 0){                                  // FEED: rola até embaixo, volta ao topo, depois segue
          var feed = rkf[0], dist = Math.max(0, feed.clientHeight - rkScr.clientHeight);
          feed.style.transform = 'translateY(0)';
          setTimeout(function(){ feed.style.transform = 'translateY(' + (-dist).toFixed(0) + 'px)'; }, 800);
          setTimeout(function(){ feed.style.transform = 'translateY(0)'; }, 3600);
          setTimeout(rkNext, 6600);
        } else {                                         // RANKING: troca de chip (crossfade)
          setTimeout(rkNext, 2400);
        }
      };
      rkLoop();
    }
  }

  /* ---------- SELLO watermark: carrossel de 2 linhas em sentidos opostos ---------- */
  [].forEach.call(document.querySelectorAll('[data-swm]'), function(row){
    row.innerHTML += row.innerHTML;
    if (reduce) return;
    var dir = row.getAttribute('data-swm') === 'right' ? 1 : -1, x = 0, speed = 0.32;
    (function frame(){
      x += dir * speed;
      var h = row.scrollWidth / 2;
      if (h > 0){ x %= h; if (x > 0) x -= h; }
      row.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
      requestAnimationFrame(frame);
    })();
  });

  /* ---------- guias: carrossel horizontal (desliza p/ esquerda, fade vermelho na borda) ---------- */
  [].forEach.call(document.querySelectorAll('[data-gmarquee]'), function(track){
    track.innerHTML += track.innerHTML;
    if (reduce) return;
    var x = 0, speed = 0.42;
    (function frame(){
      x -= speed;
      var h = track.scrollWidth / 2;
      if (h > 0){ x %= h; if (x > 0) x -= h; }
      track.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
      requestAnimationFrame(frame);
    })();
  });

  /* ---------- download modal (todos os "BAIXAR APP" abrem o modal) ---------- */
  (function(){
    var STORES = { ios: null, android: null }; // preencher os links quando o app publicar
    var modal = document.getElementById('dl-modal');
    if (!modal) return;
    var card = modal.querySelector('.dlm__card');
    var FOCUS = 'a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])';
    var lastFocus = null, hideT = null;

    [].forEach.call(modal.querySelectorAll('[data-store]'), function(a){
      var url = STORES[a.getAttribute('data-store')];
      if (url){ a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
      else { a.setAttribute('aria-disabled', 'true'); a.addEventListener('click', function(e){ e.preventDefault(); }); }
    });

    function open(){
      lastFocus = document.activeElement;
      clearTimeout(hideT);
      modal.hidden = false;
      requestAnimationFrame(function(){ modal.classList.add('is-open'); });
      document.documentElement.style.overflow = 'hidden';
      if (lenis) lenis.stop();                               // congela a inércia do scroll atrás do modal
      var x = modal.querySelector('.dlm__x'); if (x) x.focus();
      document.addEventListener('keydown', onKey);
    }
    function close(){
      modal.classList.remove('is-open');
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
      if (lenis) lenis.start();                              // retoma o smooth scroll
      var done = false;
      function hide(){ if (done) return; done = true; modal.hidden = true; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
      card.addEventListener('transitionend', hide, { once: true });
      hideT = setTimeout(hide, 380);
    }
    function onKey(e){
      if (e.key === 'Escape'){ close(); return; }
      if (e.key !== 'Tab') return;
      var f = [].filter.call(card.querySelectorAll(FOCUS), function(el){ return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
    [].forEach.call(modal.querySelectorAll('[data-dl-close]'), function(el){ el.addEventListener('click', close); });
    [].forEach.call(document.querySelectorAll('.btn--app, [data-cta="download"]'), function(btn){
      btn.addEventListener('click', function(e){ e.preventDefault(); open(); });
    });
  })();

  /* ---------- âncoras internas: scroll suave mantendo a URL limpa (sem #hash) ---------- */
  (function(){
    // estes abrem o modal / têm handler próprio — não interceptar
    var SKIP = '.btn--app,[data-cta="download"],[data-store]';
    document.addEventListener('click', function(e){
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a || a.matches(SKIP)) return;
      var id = a.getAttribute('href').slice(1);
      var target = id ? document.getElementById(id) : null;
      e.preventDefault();                                  // sem pulo nativo nem #hash na barra
      if (id === 'top') { if (lenis) lenis.scrollTo(0); else scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }   // logo → topo
      else if (target) { if (lenis) lenis.scrollTo(target); else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
      // href="#" sem destino (links de rodapé ainda sem página): só previne o pulo, não rola
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    });
  })();
})();
